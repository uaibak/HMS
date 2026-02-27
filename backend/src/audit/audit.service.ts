import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  list(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return this.prisma.auditLog.findMany({
      skip,
      take: limit,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
