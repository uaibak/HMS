import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus, InvoiceLineType, InvoiceReferenceType, Prisma, RoleName } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { BillingService } from '../billing/billing.service';

type Actor = {
  userId: string;
  role: RoleName;
};

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService,
  ) {}
  private static readonly DEFAULT_OPD_FEE = 1500;

  private async safeAudit(data: Prisma.AuditLogUncheckedCreateInput) {
    try {
      await this.prisma.auditLog.create({ data });
    } catch {
      // Audit logging must not break primary appointment flows.
    }
  }

  /**
   * Billing is a side-effect of completion; appointment completion should not fail
   * if line aggregation has a transient issue.
   */
  private async tryAppendCompletionLine(appointmentId: string, patientId: string, doctorId: string, actor: Actor) {
    try {
      await this.billingService.appendAutoLine(
        {
          patientId,
          doctorId,
          appointmentId,
          lineType: InvoiceLineType.OPD,
          referenceType: InvoiceReferenceType.APPOINTMENT,
          referenceId: appointmentId,
          description: `OPD consultation for appointment ${appointmentId}`,
          quantity: 1,
          unitPrice: AppointmentsService.DEFAULT_OPD_FEE,
        },
        actor,
      );
    } catch (error) {
      await this.safeAudit({
        userId: actor.userId,
        action: 'BILLING_APPEND_FAILED',
        module: 'APPOINTMENTS',
        entityId: appointmentId,
        details: {
          message: error instanceof Error ? error.message : 'Unknown billing append error',
        },
      });
    }
  }

  async create(dto: CreateAppointmentDto, actor: Actor) {
    const appointment = await this.prisma.appointment.create({
      data: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        appointmentDate: dto.appointmentDate,
        reason: dto.reason,
        visitNotes: dto.visitNotes,
        // Always start with BOOKED status at booking time.
        status: AppointmentStatus.BOOKED,
      },
    });
    await this.safeAudit({
      userId: actor.userId,
      action: 'CREATE',
      module: 'APPOINTMENTS',
      entityId: appointment.id,
      details: { patientId: dto.patientId, doctorId: dto.doctorId },
    });
    return appointment;
  }

  async findAll(page = 1, limit = 10, actor?: Actor) {
    const skip = (page - 1) * limit;
    let doctorFilter: { doctorId?: string } = {};

    if (actor?.role === RoleName.DOCTOR) {
      const doctor = await this.prisma.doctor.findUnique({ where: { userId: actor.userId } });
      if (!doctor) {
        throw new ForbiddenException('Doctor profile not found for this user');
      }
      // Doctors can only view appointments assigned to them.
      doctorFilter = { doctorId: doctor.id };
    }

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where: doctorFilter,
        skip,
        take: limit,
        include: { patient: true, doctor: true },
        orderBy: { appointmentDate: 'desc' },
      }),
      this.prisma.appointment.count({ where: doctorFilter }),
    ]);
    return { data, total, page, limit };
  }

  findOne(id: string) {
    return this.prisma.appointment.findUnique({ where: { id }, include: { patient: true, doctor: true } });
  }

  async update(id: string, dto: UpdateAppointmentDto, actor: Actor) {
    const appointment = await this.findOne(id);
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Completed appointments cannot be modified');
    }

    if (actor.role === RoleName.DOCTOR) {
      const doctor = await this.prisma.doctor.findUnique({ where: { userId: actor.userId } });
      if (!doctor || appointment.doctorId !== doctor.id) {
        throw new ForbiddenException('Doctors can only reschedule appointments assigned to them');
      }

      const isDoctorReschedule = !!dto.appointmentDate;
      const isDoctorComplete = dto.status === AppointmentStatus.COMPLETED;

      if (!isDoctorReschedule && !isDoctorComplete) {
        throw new BadRequestException('Doctors can only reschedule or mark appointment completed');
      }

      const updatedByDoctor = await this.prisma.appointment.update({
        where: { id },
        data: {
          appointmentDate: dto.appointmentDate ?? appointment.appointmentDate,
          // Reschedule must keep status BOOKED; completion is explicit.
          status: isDoctorComplete ? AppointmentStatus.COMPLETED : AppointmentStatus.BOOKED,
          reason: dto.reason,
        },
      });

      if (updatedByDoctor.status === AppointmentStatus.COMPLETED) {
        await this.tryAppendCompletionLine(
          updatedByDoctor.id,
          updatedByDoctor.patientId,
          updatedByDoctor.doctorId,
          actor,
        );
      }

      await this.safeAudit({
        userId: actor.userId,
        action: isDoctorComplete ? 'COMPLETE' : 'RESCHEDULE',
        module: 'APPOINTMENTS',
        entityId: updatedByDoctor.id,
        details: { appointmentDate: dto.appointmentDate, status: updatedByDoctor.status },
      });
      return updatedByDoctor;
    }

    let updated;
    if (dto.appointmentDate) {
      // Rescheduling path: status is always reset/kept to BOOKED.
      updated = await this.prisma.appointment.update({
        where: { id },
        data: {
          appointmentDate: dto.appointmentDate,
          reason: dto.reason,
          visitNotes: dto.visitNotes,
          status: AppointmentStatus.BOOKED,
        },
      });
    } else if (dto.status === AppointmentStatus.COMPLETED || dto.status === AppointmentStatus.CANCELLED) {
      updated = await this.prisma.appointment.update({
        where: { id },
        data: { status: dto.status, reason: dto.reason, visitNotes: dto.visitNotes },
      });
    } else {
      updated = await this.prisma.appointment.update({
        where: { id },
        data: { reason: dto.reason, visitNotes: dto.visitNotes },
      });
    }
    if (updated.status === AppointmentStatus.COMPLETED) {
      await this.tryAppendCompletionLine(updated.id, updated.patientId, updated.doctorId, actor);
    }
    await this.safeAudit({
      userId: actor.userId,
      action: 'UPDATE',
      module: 'APPOINTMENTS',
      entityId: updated.id,
      details: dto as unknown as Prisma.InputJsonValue,
    });
    return updated;
  }

  cancel(id: string, actor: Actor) {
    return this.update(id, { status: AppointmentStatus.CANCELLED }, actor);
  }

  async remove(id: string, actor: Actor) {
    const appointment = await this.findOne(id);
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Completed appointments cannot be deleted');
    }
    const deleted = await this.prisma.appointment.delete({ where: { id } });
    await this.safeAudit({
      userId: actor.userId,
      action: 'DELETE',
      module: 'APPOINTMENTS',
      entityId: deleted.id,
    });
    return deleted;
  }
}
