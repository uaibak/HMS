import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabTestDto } from './dto/create-lab-test.dto';
import { UpdateLabTestDto } from './dto/update-lab-test.dto';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { UpdateLabOrderDto } from './dto/update-lab-order.dto';

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

  createOrder(dto: CreateLabOrderDto) {
    return this.prisma.labOrder.create({ data: dto });
  }

  listOrders(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return this.prisma.labOrder.findMany({
      skip,
      take: limit,
      include: { patient: true, test: true },
      orderBy: { orderedAt: 'desc' },
    });
  }

  async updateOrder(id: string, dto: UpdateLabOrderDto) {
    const order = await this.prisma.labOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Lab order not found');
    return this.prisma.labOrder.update({ where: { id }, data: dto });
  }
}
