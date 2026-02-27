import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboardSummary() {
    const [patientCount, appointmentCount, revenue, lowStockMedicines, labSummary, medicineStockSnapshot] = await Promise.all([
      this.prisma.patient.count(),
      this.prisma.appointment.count(),
      this.prisma.invoice.aggregate({ _sum: { paidAmount: true } }),
      this.prisma.medicine.findMany({ where: { stock: { lt: 20 } }, orderBy: { stock: 'asc' }, take: 10 }),
      this.prisma.labOrder.groupBy({ by: ['sampleStatus'], _count: { _all: true } }),
      this.prisma.medicine.findMany({
        orderBy: [{ stock: 'asc' }, { expiryDate: 'asc' }],
        take: 20,
        select: {
          id: true,
          name: true,
          batchNo: true,
          stock: true,
          unitPrice: true,
          expiryDate: true,
        },
      }),
    ]);

    return {
      patientCount,
      appointmentCount,
      revenue: revenue._sum.paidAmount ?? 0,
      lowStockMedicines,
      labSummary,
      medicineStockSnapshot,
    };
  }
}
