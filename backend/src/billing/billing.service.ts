import { Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceStatus, Prisma, RoleName } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

type Actor = {
  userId: string;
  role: RoleName;
};

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInvoiceDto, actor?: Actor) {
    const invoice = await this.prisma.invoice.create({ data: dto });
    await this.prisma.auditLog.create({
      data: {
        userId: actor?.userId,
        action: 'CREATE',
        module: 'BILLING',
        entityId: invoice.id,
        details: { type: dto.type, amount: dto.amount },
      },
    });
    return invoice;
  }

  async findAll(page = 1, limit = 10, actor?: Actor) {
    const skip = (page - 1) * limit;
    let where: { doctorId?: string } = {};

    if (actor?.role === RoleName.DOCTOR) {
      const doctor = await this.prisma.doctor.findUnique({ where: { userId: actor.userId } });
      if (!doctor) {
        throw new NotFoundException('Doctor profile not found');
      }
      // Doctors can only view their own invoices.
      where = { doctorId: doctor.id };
    }

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        include: { patient: true, doctor: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async update(id: string, dto: UpdateInvoiceDto, actor?: Actor) {
    const invoice = await this.prisma.invoice.update({ where: { id }, data: dto });
    await this.prisma.auditLog.create({
      data: {
        userId: actor?.userId,
        action: 'UPDATE',
        module: 'BILLING',
        entityId: invoice.id,
        details: dto as unknown as Prisma.InputJsonValue,
      },
    });
    return invoice;
  }

  async recordPayment(id: string, paidAmount: number, actor?: Actor) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const newPaidAmount = invoice.paidAmount + paidAmount;
    const status =
      newPaidAmount >= invoice.amount
        ? InvoiceStatus.PAID
        : newPaidAmount > 0
          ? InvoiceStatus.PARTIAL
          : InvoiceStatus.UNPAID;

    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: { paidAmount: newPaidAmount, status },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: actor?.userId,
        action: 'RECORD_PAYMENT',
        module: 'BILLING',
        entityId: updatedInvoice.id,
        details: { paidAmount, newPaidAmount, status },
      },
    });
    return updatedInvoice;
  }
}
