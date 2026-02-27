import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceLineType, InvoiceReferenceType, Prisma, RoleName, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';
import { CreatePharmacyTransactionDto } from './dto/create-pharmacy-transaction.dto';
import { PrescribeMedicineDto } from './dto/prescribe-medicine.dto';
import { BillingService } from '../billing/billing.service';

type Actor = {
  userId: string;
  role: RoleName;
};

@Injectable()
export class PharmacyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService,
  ) {}

  private async safeAudit(data: Prisma.AuditLogUncheckedCreateInput) {
    try {
      await this.prisma.auditLog.create({ data });
    } catch {
      // Audit logging must not break primary pharmacy flows.
    }
  }

  async createMedicine(dto: CreateMedicineDto, actor?: Actor) {
    const medicine = await this.prisma.medicine.create({ data: dto });
    await this.safeAudit({ userId: actor?.userId, action: 'CREATE_MEDICINE', module: 'PHARMACY', entityId: medicine.id });
    return medicine;
  }

  async findMedicines(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.medicine.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.medicine.count(),
    ]);
    return { data, total, page, limit };
  }

  async updateMedicine(id: string, dto: UpdateMedicineDto, actor?: Actor) {
    const medicine = await this.prisma.medicine.findUnique({ where: { id } });
    if (!medicine) throw new NotFoundException('Medicine not found');
    const updated = await this.prisma.medicine.update({ where: { id }, data: dto });
    await this.safeAudit({
      userId: actor?.userId,
      action: 'UPDATE_MEDICINE',
      module: 'PHARMACY',
      entityId: updated.id,
      details: dto as unknown as Prisma.InputJsonValue,
    });
    return updated;
  }

  async removeMedicine(id: string, actor?: Actor) {
    const deleted = await this.prisma.medicine.delete({ where: { id } });
    await this.safeAudit({ userId: actor?.userId, action: 'DELETE_MEDICINE', module: 'PHARMACY', entityId: deleted.id });
    return deleted;
  }

  async createTransaction(dto: CreatePharmacyTransactionDto, actor?: Actor) {
    const medicine = await this.prisma.medicine.findUnique({ where: { id: dto.medicineId } });
    if (!medicine) throw new NotFoundException('Medicine not found');

    // Stock increases on purchase and decreases on sale.
    const stockDelta = dto.type === 'PURCHASE' ? dto.quantity : -dto.quantity;

    const [transaction] = await this.prisma.$transaction([
      this.prisma.pharmacyTransaction.create({ data: dto }),
      this.prisma.medicine.update({
        where: { id: dto.medicineId },
        data: { stock: medicine.stock + stockDelta },
      }),
    ]);

    if (dto.type === TransactionType.SALE && dto.patientId) {
      try {
        await this.billingService.appendAutoLine(
          {
            patientId: dto.patientId,
            lineType: InvoiceLineType.PHARMACY,
            referenceType: InvoiceReferenceType.PHARMACY_TRANSACTION,
            referenceId: transaction.id,
            description: `Pharmacy sale (${medicine.name}) for transaction ${transaction.id}`,
            quantity: dto.quantity,
            unitPrice: dto.quantity > 0 ? Number((dto.amount / dto.quantity).toFixed(2)) : 0,
          },
          actor,
        );
      } catch (error) {
        await this.safeAudit({
          userId: actor?.userId,
          action: 'BILLING_APPEND_FAILED',
          module: 'PHARMACY',
          entityId: transaction.id,
          details: {
            message: error instanceof Error ? error.message : 'Unknown billing append error',
          },
        });
      }
    }

    await this.safeAudit({
      userId: actor?.userId,
      action: 'CREATE_TRANSACTION',
      module: 'PHARMACY',
      entityId: transaction.id,
      details: { type: dto.type, quantity: dto.quantity },
    });
    return transaction;
  }

  async prescribeMedicine(dto: PrescribeMedicineDto, actor: Actor) {
    if (actor.role !== RoleName.DOCTOR && actor.role !== RoleName.ADMIN) {
      throw new ForbiddenException('Only doctors or admins can prescribe medicine');
    }

    const medicine = await this.prisma.medicine.findUnique({ where: { id: dto.medicineId } });
    if (!medicine) throw new NotFoundException('Medicine not found');
    if (medicine.stock < dto.quantity) {
      throw new BadRequestException('Insufficient stock for this medicine');
    }

    const patient = await this.prisma.patient.findUnique({ where: { id: dto.patientId } });
    if (!patient) throw new NotFoundException('Patient not found');

    let doctorId: string | null = null;
    if (actor.role === RoleName.DOCTOR) {
      const doctor = await this.prisma.doctor.findUnique({ where: { userId: actor.userId } });
      if (!doctor) throw new ForbiddenException('Doctor profile not found for this user');
      doctorId = doctor.id;
    }

    const amount = Number((medicine.unitPrice * dto.quantity).toFixed(2));

    const [transaction] = await this.prisma.$transaction([
      this.prisma.pharmacyTransaction.create({
        data: {
          medicineId: dto.medicineId,
          patientId: dto.patientId,
          type: TransactionType.SALE,
          quantity: dto.quantity,
          amount,
        },
      }),
      this.prisma.medicine.update({
        where: { id: dto.medicineId },
        data: { stock: medicine.stock - dto.quantity },
      }),
    ]);

    let invoice = null;
    try {
      invoice = await this.billingService.appendAutoLine(
        {
          patientId: dto.patientId,
          doctorId,
          lineType: InvoiceLineType.PHARMACY,
          referenceType: InvoiceReferenceType.PHARMACY_TRANSACTION,
          referenceId: transaction.id,
          description: `Pharmacy prescription: ${medicine.name} x ${dto.quantity}${dto.notes ? ` | Notes: ${dto.notes}` : ''}`,
          quantity: dto.quantity,
          unitPrice: medicine.unitPrice,
        },
        actor,
      );
    } catch (error) {
      await this.safeAudit({
        userId: actor.userId,
        action: 'BILLING_APPEND_FAILED',
        module: 'PHARMACY',
        entityId: transaction.id,
        details: {
          message: error instanceof Error ? error.message : 'Unknown billing append error',
        },
      });
    }

    await this.safeAudit({
      userId: actor.userId,
      action: 'PRESCRIBE_MEDICINE',
      module: 'PHARMACY',
      entityId: transaction.id,
      details: {
        patientId: dto.patientId,
        medicineId: dto.medicineId,
        quantity: dto.quantity,
        amount,
        invoiceId: invoice?.id,
      },
    });

    return { transaction, invoice };
  }

  findTransactions(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return this.prisma.pharmacyTransaction.findMany({
      skip,
      take: limit,
      include: { medicine: true, patient: true },
      orderBy: { transactionDate: 'desc' },
    });
  }
}
