import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';
import { CreatePharmacyTransactionDto } from './dto/create-pharmacy-transaction.dto';

@Injectable()
export class PharmacyService {
  constructor(private readonly prisma: PrismaService) {}

  createMedicine(dto: CreateMedicineDto) {
    return this.prisma.medicine.create({ data: dto });
  }

  async findMedicines(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.medicine.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.medicine.count(),
    ]);
    return { data, total, page, limit };
  }

  async updateMedicine(id: string, dto: UpdateMedicineDto) {
    const medicine = await this.prisma.medicine.findUnique({ where: { id } });
    if (!medicine) throw new NotFoundException('Medicine not found');
    return this.prisma.medicine.update({ where: { id }, data: dto });
  }

  removeMedicine(id: string) {
    return this.prisma.medicine.delete({ where: { id } });
  }

  async createTransaction(dto: CreatePharmacyTransactionDto) {
    const medicine = await this.prisma.medicine.findUnique({ where: { id: dto.medicineId } });
    if (!medicine) throw new NotFoundException('Medicine not found');

    // Stock increases on purchase and decreases on sale.
    const stockDelta = dto.type === 'PURCHASE' ? dto.quantity : -dto.quantity;

    return this.prisma.$transaction([
      this.prisma.pharmacyTransaction.create({ data: dto }),
      this.prisma.medicine.update({
        where: { id: dto.medicineId },
        data: { stock: medicine.stock + stockDelta },
      }),
    ]);
  }

  findTransactions(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return this.prisma.pharmacyTransaction.findMany({
      skip,
      take: limit,
      include: { medicine: true, patient: true },
      orderBy: { transactionDate: 'desc' },
    });
  }
}
