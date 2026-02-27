import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    const first = await this.prisma.setting.findFirst();
    return first;
  }

  async upsertSettings(dto: UpdateSettingsDto) {
    const existing = await this.prisma.setting.findFirst();
    if (!existing) {
      return this.prisma.setting.create({
        data: {
          hospitalName: dto.hospitalName,
          hospitalEmail: dto.hospitalEmail,
          hospitalPhone: dto.hospitalPhone,
          hospitalAddress: dto.hospitalAddress,
          rolesConfig: dto.rolesConfig as Prisma.InputJsonValue,
          permissionsConfig: dto.permissionsConfig as Prisma.InputJsonValue,
        },
      });
    }

    return this.prisma.setting.update({
      where: { id: existing.id },
      data: {
        hospitalName: dto.hospitalName,
        hospitalEmail: dto.hospitalEmail,
        hospitalPhone: dto.hospitalPhone,
        hospitalAddress: dto.hospitalAddress,
        rolesConfig: dto.rolesConfig as Prisma.InputJsonValue,
        permissionsConfig: dto.permissionsConfig as Prisma.InputJsonValue,
      },
    });
  }
}
