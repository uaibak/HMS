import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePatientDto) {
    return this.prisma.patient.create({ data: dto });
  }

  async findAll(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { cnic: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        skip,
        take: limit,
        include: { assignedDoctor: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  findOne(id: string) {
    return this.prisma.patient.findUnique({
      where: { id },
      include: { assignedDoctor: true, appointments: true, labOrders: true, invoices: true },
    });
  }

  async update(id: string, dto: UpdatePatientDto) {
    const patient = await this.findOne(id);
    if (!patient) throw new NotFoundException('Patient not found');
    return this.prisma.patient.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const patient = await this.findOne(id);
    if (!patient) throw new NotFoundException('Patient not found');
    return this.prisma.patient.delete({ where: { id } });
  }
}
