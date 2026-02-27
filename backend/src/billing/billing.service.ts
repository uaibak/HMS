import { Injectable, NotFoundException } from '@nestjs/common';
import {
  EncounterStatus,
  InvoiceLineType,
  InvoiceReferenceType,
  InvoiceStatus,
  InvoiceType,
  Prisma,
  RoleName,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

type Actor = {
  userId: string;
  role: RoleName;
};

type AppendLineInput = {
  patientId: string;
  doctorId?: string | null;
  appointmentId?: string | null;
  encounterId?: string | null;
  lineType: InvoiceLineType;
  referenceType: InvoiceReferenceType;
  referenceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  private static readonly ENCOUNTER_WINDOW_HOURS = 24;

  private async safeAudit(data: Prisma.AuditLogUncheckedCreateInput) {
    try {
      await this.prisma.auditLog.create({ data });
    } catch {
      // Audit logging must not break billing flows.
    }
  }

  async create(dto: CreateInvoiceDto, actor?: Actor) {
    // Compatibility: legacy manual invoice creation (without encounter)
    const invoice = await this.prisma.invoice.create({
      data: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        type: dto.type,
        description: dto.description,
        amount: dto.amount,
        subtotal: dto.amount,
        grandTotal: dto.amount,
        paidAmount: 0,
        status: dto.status ?? InvoiceStatus.UNPAID,
        dueDate: dto.dueDate,
      },
    });

    await this.safeAudit({
      userId: actor?.userId,
      action: 'CREATE',
      module: 'BILLING',
      entityId: invoice.id,
      details: { type: dto.type, amount: dto.amount },
    });
    return invoice;
  }

  async findAll(page = 1, limit = 10, actor?: Actor) {
    const skip = (page - 1) * limit;
    let where: Prisma.InvoiceWhereInput = {};

    if (actor?.role === RoleName.DOCTOR) {
      const doctor = await this.prisma.doctor.findUnique({ where: { userId: actor.userId } });
      if (!doctor) {
        throw new NotFoundException('Doctor profile not found');
      }
      where = { OR: [{ doctorId: doctor.id }, { encounter: { doctorId: doctor.id } }] };
    }

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        include: { patient: true, doctor: true, encounter: true, lines: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async update(id: string, dto: UpdateInvoiceDto, actor?: Actor) {
    const invoice = await this.prisma.invoice.update({ where: { id }, data: dto });
    await this.recalculateTotals(invoice.id);

    await this.safeAudit({
      userId: actor?.userId,
      action: 'UPDATE',
      module: 'BILLING',
      entityId: invoice.id,
      details: dto as unknown as Prisma.InputJsonValue,
    });
    return this.prisma.invoice.findUnique({ where: { id: invoice.id }, include: { lines: true, encounter: true } });
  }

  async recordPayment(id: string, paidAmount: number, actor?: Actor) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const totalDue = invoice.grandTotal || invoice.amount;
    const newPaidAmount = invoice.paidAmount + paidAmount;
    const status =
      newPaidAmount >= totalDue
        ? InvoiceStatus.PAID
        : newPaidAmount > 0
          ? InvoiceStatus.PARTIAL
          : InvoiceStatus.UNPAID;

    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: { paidAmount: newPaidAmount, status },
    });

    await this.safeAudit({
      userId: actor?.userId,
      action: 'RECORD_PAYMENT',
      module: 'BILLING',
      entityId: updatedInvoice.id,
      details: { paidAmount, newPaidAmount, status },
    });
    return updatedInvoice;
  }

  async listEncounters(page = 1, limit = 10, actor?: Actor) {
    const skip = (page - 1) * limit;
    let where: Prisma.EncounterWhereInput = {};

    if (actor?.role === RoleName.DOCTOR) {
      const doctor = await this.prisma.doctor.findUnique({ where: { userId: actor.userId } });
      if (!doctor) throw new NotFoundException('Doctor profile not found');
      where = { doctorId: doctor.id };
    }

    const [data, total] = await Promise.all([
      this.prisma.encounter.findMany({
        where,
        skip,
        take: limit,
        include: { patient: true, doctor: true, invoice: { include: { lines: true } } },
        orderBy: { openedAt: 'desc' },
      }),
      this.prisma.encounter.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getEncounterById(id: string, actor?: Actor) {
    const encounter = await this.prisma.encounter.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
        appointment: true,
        invoice: { include: { lines: true } },
      },
    });

    if (!encounter) {
      throw new NotFoundException('Encounter not found');
    }

    if (actor?.role === RoleName.DOCTOR) {
      const doctor = await this.prisma.doctor.findUnique({ where: { userId: actor.userId } });
      if (!doctor || encounter.doctorId !== doctor.id) {
        throw new NotFoundException('Encounter not found');
      }
    }

    return encounter;
  }

  async closeEncounter(id: string, actor?: Actor) {
    const encounter = await this.prisma.encounter.findUnique({ where: { id } });
    if (!encounter) throw new NotFoundException('Encounter not found');

    const updated = await this.prisma.encounter.update({
      where: { id },
      data: { status: EncounterStatus.CLOSED, closedAt: new Date() },
    });

    await this.safeAudit({ userId: actor?.userId, action: 'CLOSE_ENCOUNTER', module: 'BILLING', entityId: updated.id });

    return updated;
  }

  async appendAutoLine(input: AppendLineInput, actor?: Actor) {
    const encounter = await this.resolveEncounter(input);
    const invoice = await this.ensureEncounterInvoice(encounter.id, input.patientId, input.doctorId ?? null);

    await this.prisma.invoiceLine.upsert({
      where: {
        invoiceId_referenceType_referenceId: {
          invoiceId: invoice.id,
          referenceType: input.referenceType,
          referenceId: input.referenceId,
        },
      },
      create: {
        invoiceId: invoice.id,
        lineType: input.lineType,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        description: input.description,
        quantity: input.quantity,
        unitPrice: input.unitPrice,
        lineTotal: Number((input.quantity * input.unitPrice).toFixed(2)),
      },
      update: {
        description: input.description,
        quantity: input.quantity,
        unitPrice: input.unitPrice,
        lineTotal: Number((input.quantity * input.unitPrice).toFixed(2)),
      },
    });

    const updatedInvoice = await this.recalculateTotals(invoice.id);

    await this.safeAudit({
      userId: actor?.userId,
      action: 'APPEND_LINE',
      module: 'BILLING',
      entityId: updatedInvoice.id,
      details: {
        encounterId: encounter.id,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        lineType: input.lineType,
      },
    });

    return updatedInvoice;
  }

  private async resolveEncounter(input: AppendLineInput) {
    if (input.encounterId) {
      const byId = await this.prisma.encounter.findUnique({ where: { id: input.encounterId } });
      if (byId) return byId;
    }

    const from = new Date(Date.now() - BillingService.ENCOUNTER_WINDOW_HOURS * 60 * 60 * 1000);
    const openEncounter = await this.prisma.encounter.findFirst({
      where: {
        patientId: input.patientId,
        status: EncounterStatus.OPEN,
        openedAt: { gte: from },
      },
      orderBy: { openedAt: 'desc' },
    });

    if (openEncounter) {
      // Attach appointment/doctor context if still empty.
      return this.prisma.encounter.update({
        where: { id: openEncounter.id },
        data: {
          doctorId: openEncounter.doctorId ?? input.doctorId ?? undefined,
          appointmentId: openEncounter.appointmentId ?? input.appointmentId ?? undefined,
        },
      });
    }

    return this.prisma.encounter.create({
      data: {
        patientId: input.patientId,
        doctorId: input.doctorId ?? undefined,
        appointmentId: input.appointmentId ?? undefined,
        status: EncounterStatus.OPEN,
      },
    });
  }

  private async ensureEncounterInvoice(encounterId: string, patientId: string, doctorId?: string | null) {
    const existing = await this.prisma.invoice.findUnique({ where: { encounterId } });
    if (existing) return existing;

    return this.prisma.invoice.create({
      data: {
        patientId,
        doctorId: doctorId ?? undefined,
        encounterId,
        type: InvoiceType.OPD,
        description: 'Consolidated encounter invoice',
        subtotal: 0,
        discount: 0,
        tax: 0,
        grandTotal: 0,
        amount: 0,
        paidAmount: 0,
        status: InvoiceStatus.UNPAID,
      },
    });
  }

  private async recalculateTotals(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { lines: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const subtotal = Number(invoice.lines.reduce((sum, line) => sum + line.lineTotal, 0).toFixed(2));
    const tax = invoice.tax ?? 0;
    const discount = invoice.discount ?? 0;
    const grandTotal = Number((subtotal + tax - discount).toFixed(2));

    const status =
      invoice.paidAmount >= grandTotal && grandTotal > 0
        ? InvoiceStatus.PAID
        : invoice.paidAmount > 0
          ? InvoiceStatus.PARTIAL
          : InvoiceStatus.UNPAID;

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        subtotal,
        grandTotal,
        amount: grandTotal,
        status,
      },
      include: { lines: true, encounter: true, patient: true, doctor: true },
    });
  }
}
