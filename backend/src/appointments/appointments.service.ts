import { Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateAppointmentDto) {
    return this.prisma.appointment.create({ data: dto });
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        skip,
        take: limit,
        include: { patient: true, doctor: true },
        orderBy: { appointmentDate: 'desc' },
      }),
      this.prisma.appointment.count(),
    ]);
    return { data, total, page, limit };
  }

  findOne(id: string) {
    return this.prisma.appointment.findUnique({ where: { id }, include: { patient: true, doctor: true } });
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    const appointment = await this.findOne(id);
    if (!appointment) throw new NotFoundException('Appointment not found');
    return this.prisma.appointment.update({ where: { id }, data: dto });
  }

  cancel(id: string) {
    return this.update(id, { status: AppointmentStatus.CANCELLED });
  }

  remove(id: string) {
    return this.prisma.appointment.delete({ where: { id } });
  }
}
