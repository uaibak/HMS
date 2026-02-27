import { Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceStatus, InvoiceType, Prisma, RoleName, SampleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabTestDto } from './dto/create-lab-test.dto';
import { UpdateLabTestDto } from './dto/update-lab-test.dto';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { UpdateLabOrderDto } from './dto/update-lab-order.dto';

type Actor = {
  userId: string;
  role: RoleName;
};

@Injectable()
export class LabService {
  constructor(private readonly prisma: PrismaService) {}

  createTest(dto: CreateLabTestDto) {
    return this.prisma.labTest.create({ data: dto });
  }

  listTests(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return this.prisma.labTest.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } });
  }

  updateTest(id: string, dto: UpdateLabTestDto) {
    return this.prisma.labTest.update({ where: { id }, data: dto });
  }

  async createOrder(dto: CreateLabOrderDto, actor?: Actor) {
    const order = await this.prisma.labOrder.create({ data: dto });
    await this.prisma.auditLog.create({
      data: {
        userId: actor?.userId,
        action: 'CREATE_ORDER',
        module: 'LAB',
        entityId: order.id,
        details: { patientId: dto.patientId, testId: dto.testId },
      },
    });
    return order;
  }

  async listOrders(page = 1, limit = 10, actor?: Actor) {
    const skip = (page - 1) * limit;
    const where = actor?.role === RoleName.DOCTOR ? { orderedById: actor.userId } : {};
    const [data, total] = await Promise.all([
      this.prisma.labOrder.findMany({
        where,
        skip,
        take: limit,
        include: { patient: true, test: true },
        orderBy: { orderedAt: 'desc' },
      }),
      this.prisma.labOrder.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async updateOrder(id: string, dto: UpdateLabOrderDto, actor?: Actor) {
    const order = await this.prisma.labOrder.findUnique({ where: { id }, include: { test: true } });
    if (!order) throw new NotFoundException('Lab order not found');
    const updated = await this.prisma.labOrder.update({ where: { id }, data: dto });
    if (updated.sampleStatus === SampleStatus.COMPLETED) {
      await this.createLabInvoiceIfMissing(updated.id, updated.patientId, order.test.price, order.test.name);
    }
    await this.prisma.auditLog.create({
      data: {
        userId: actor?.userId,
        action: 'UPDATE_ORDER',
        module: 'LAB',
        entityId: updated.id,
        details: dto as unknown as Prisma.InputJsonValue,
      },
    });
    return updated;
  }

  private async createLabInvoiceIfMissing(
    labOrderId: string,
    patientId: string,
    amount: number,
    testName: string,
  ) {
    const description = `Lab test (${testName}) for order ${labOrderId}`;
    const existing = await this.prisma.invoice.findFirst({
      where: {
        patientId,
        type: InvoiceType.LAB,
        description,
      },
    });
    if (existing) return existing;

    return this.prisma.invoice.create({
      data: {
        patientId,
        type: InvoiceType.LAB,
        description,
        amount,
        paidAmount: 0,
        status: InvoiceStatus.UNPAID,
      },
    });
  }
}
