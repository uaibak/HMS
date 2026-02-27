import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RoleName } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

type Actor = {
  userId: string;
  role: RoleName;
};

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePatientDto, actor?: Actor) {
    const patient = await this.prisma.patient.create({ data: dto });
    await this.prisma.auditLog.create({
      data: {
        userId: actor?.userId,
        action: 'CREATE',
        module: 'PATIENTS',
        entityId: patient.id,
      },
    });
    return patient;
  }

  async findAll(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    const normalizedSearch = search?.trim();
    const where: Prisma.PatientWhereInput = normalizedSearch
      ? {
          OR: [
            { firstName: { contains: normalizedSearch } },
            { lastName: { contains: normalizedSearch } },
            { cnic: { contains: normalizedSearch } },
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

  async update(id: string, dto: UpdatePatientDto, actor?: Actor) {
    const patient = await this.findOne(id);
    if (!patient) throw new NotFoundException('Patient not found');
    const updated = await this.prisma.patient.update({ where: { id }, data: dto });
    await this.prisma.auditLog.create({
      data: {
        userId: actor?.userId,
        action: 'UPDATE',
        module: 'PATIENTS',
        entityId: updated.id,
        details: dto as unknown as Prisma.InputJsonValue,
      },
    });
    return updated;
  }

  async remove(id: string, actor?: Actor) {
    const patient = await this.findOne(id);
    if (!patient) throw new NotFoundException('Patient not found');
    const deleted = await this.prisma.patient.delete({ where: { id } });
    await this.prisma.auditLog.create({
      data: {
        userId: actor?.userId,
        action: 'DELETE',
        module: 'PATIENTS',
        entityId: deleted.id,
      },
    });
    return deleted;
  }
}
