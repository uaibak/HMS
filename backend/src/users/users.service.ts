import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const role = await this.prisma.role.findUnique({ where: { name: dto.role } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        password: hashedPassword,
        roleId: role.id,
      },
      include: { role: true },
    });
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        include: { role: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return { data, total, page, limit };
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id }, include: { role: true } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email }, include: { role: true } });
  }

  async update(id: string, dto: UpdateUserDto) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const payload: Record<string, unknown> = { ...dto };
    if (dto.password) {
      payload.password = await bcrypt.hash(dto.password, 10);
    }
    if (dto.role) {
      const role = await this.prisma.role.findUnique({ where: { name: dto.role } });
      if (!role) {
        throw new NotFoundException('Role not found');
      }
      payload.roleId = role.id;
      delete payload.role;
    }

    return this.prisma.user.update({
      where: { id },
      data: payload,
      include: { role: true },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.user.delete({ where: { id } });
  }
}
