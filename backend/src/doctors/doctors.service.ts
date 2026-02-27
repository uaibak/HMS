import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateDoctorDto) {
    return this.prisma.doctor.create({ data: dto });
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.doctor.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.doctor.count(),
    ]);

    return { data, total, page, limit };
  }

  findOne(id: string) {
    return this.prisma.doctor.findUnique({ where: { id } });
  }

  async update(id: string, dto: UpdateDoctorDto) {
    const doctor = await this.findOne(id);
    if (!doctor) throw new NotFoundException('Doctor not found');
    return this.prisma.doctor.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const doctor = await this.findOne(id);
    if (!doctor) throw new NotFoundException('Doctor not found');
    return this.prisma.doctor.delete({ where: { id } });
  }
}
