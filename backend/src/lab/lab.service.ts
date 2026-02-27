import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InvoiceLineType, InvoiceReferenceType, Prisma, RoleName, SampleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabTestDto } from './dto/create-lab-test.dto';
import { UpdateLabTestDto } from './dto/update-lab-test.dto';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { UpdateLabOrderDto } from './dto/update-lab-order.dto';
import { BillingService } from '../billing/billing.service';

type Actor = {
  userId: string;
  role: RoleName;
};

@Injectable()
export class LabService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService,
  ) {}

  private async safeAudit(data: Prisma.AuditLogUncheckedCreateInput) {
    try {
      await this.prisma.auditLog.create({ data });
    } catch {
      // Audit logging must not break primary lab flows.
    }
  }

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
    const [patient, test] = await Promise.all([
      this.prisma.patient.findUnique({ where: { id: dto.patientId } }),
      this.prisma.labTest.findUnique({ where: { id: dto.testId } }),
    ]);
    if (!patient) throw new NotFoundException('Patient not found');
    if (!test) throw new NotFoundException('Lab test not found');

    // Do not trust client-provided orderedById; derive from authenticated actor.
    let orderedById: string | undefined;
    if (actor?.userId) {
      const actorUser = await this.prisma.user.findUnique({ where: { id: actor.userId }, select: { id: true } });
      if (!actorUser) {
        throw new UnauthorizedException('Session is invalid. Please login again.');
      }
      orderedById = actorUser.id;
    }

    const order = await this.prisma.labOrder.create({
      data: {
        patientId: dto.patientId,
        testId: dto.testId,
        orderedById,
      },
    });
    await this.safeAudit({
      userId: actor?.userId,
      action: 'CREATE_ORDER',
      module: 'LAB',
      entityId: order.id,
      details: { patientId: dto.patientId, testId: dto.testId },
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
      try {
        await this.billingService.appendAutoLine(
          {
            patientId: updated.patientId,
            lineType: InvoiceLineType.LAB,
            referenceType: InvoiceReferenceType.LAB_ORDER,
            referenceId: updated.id,
            description: `Lab test (${order.test.name}) for order ${updated.id}`,
            quantity: 1,
            unitPrice: order.test.price,
          },
          actor,
        );
      } catch (error) {
        await this.safeAudit({
          userId: actor?.userId,
          action: 'BILLING_APPEND_FAILED',
          module: 'LAB',
          entityId: updated.id,
          details: {
            message: error instanceof Error ? error.message : 'Unknown billing append error',
          },
        });
      }
    }
    await this.safeAudit({
      userId: actor?.userId,
      action: 'UPDATE_ORDER',
      module: 'LAB',
      entityId: updated.id,
      details: dto as unknown as Prisma.InputJsonValue,
    });
    return updated;
  }
}
