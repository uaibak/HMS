import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { CreatePharmacyTransactionDto } from './dto/create-pharmacy-transaction.dto';
import { PrescribeMedicineDto } from './dto/prescribe-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';
import { PharmacyService } from './pharmacy.service';

@Controller('pharmacy')
@UseGuards(AuthGuard('jwt'), JwtAuthGuard, RolesGuard)
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  @Post('medicines')
  @Roles(RoleName.ADMIN, RoleName.PHARMACIST)
  createMedicine(
    @Body() dto: CreateMedicineDto,
    @Req() req: Request & { user: { userId: string; role: RoleName } },
  ) {
    return this.pharmacyService.createMedicine(dto, req.user);
  }

  @Get('medicines')
  @Roles(RoleName.ADMIN, RoleName.PHARMACIST, RoleName.DOCTOR)
  findMedicines(@Query() query: PaginationQueryDto) {
    return this.pharmacyService.findMedicines(query.page, query.limit);
  }

  @Patch('medicines/:id')
  @Roles(RoleName.ADMIN, RoleName.PHARMACIST)
  updateMedicine(
    @Param('id') id: string,
    @Body() dto: UpdateMedicineDto,
    @Req() req: Request & { user: { userId: string; role: RoleName } },
  ) {
    return this.pharmacyService.updateMedicine(id, dto, req.user);
  }

  @Delete('medicines/:id')
  @Roles(RoleName.ADMIN)
  removeMedicine(
    @Param('id') id: string,
    @Req() req: Request & { user: { userId: string; role: RoleName } },
  ) {
    return this.pharmacyService.removeMedicine(id, req.user);
  }

  @Post('transactions')
  @Roles(RoleName.ADMIN, RoleName.PHARMACIST)
  createTransaction(
    @Body() dto: CreatePharmacyTransactionDto,
    @Req() req: Request & { user: { userId: string; role: RoleName } },
  ) {
    return this.pharmacyService.createTransaction(dto, req.user);
  }

  @Get('transactions')
  @Roles(RoleName.ADMIN, RoleName.PHARMACIST, RoleName.DOCTOR)
  findTransactions(@Query() query: PaginationQueryDto) {
    return this.pharmacyService.findTransactions(query.page, query.limit);
  }

  @Post('prescriptions')
  @Roles(RoleName.ADMIN, RoleName.DOCTOR)
  prescribeMedicine(
    @Body() dto: PrescribeMedicineDto,
    @Req() req: Request & { user: { userId: string; role: RoleName } },
  ) {
    return this.pharmacyService.prescribeMedicine(dto, req.user);
  }
}
