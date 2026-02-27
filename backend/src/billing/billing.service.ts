import { Injectable } from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateInvoiceDto) {
    return this.prisma.invoice.create({ data: dto });
  }

  findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return this.prisma.invoice.findMany({
      skip,
      take: limit,
      include: { patient: true, doctor: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  update(id: string, dto: UpdateInvoiceDto) {
    return this.prisma.invoice.update({ where: { id }, data: dto });
  }

  async recordPayment(id: string, paidAmount: number) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new Error('Invoice not found');

    const newPaidAmount = invoice.paidAmount + paidAmount;
    const status =
      newPaidAmount >= invoice.amount
        ? InvoiceStatus.PAID
        : newPaidAmount > 0
          ? InvoiceStatus.PARTIAL
          : InvoiceStatus.UNPAID;

    return this.prisma.invoice.update({
      where: { id },
      data: { paidAmount: newPaidAmount, status },
    });
  }
}
