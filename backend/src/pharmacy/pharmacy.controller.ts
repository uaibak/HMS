import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { CreatePharmacyTransactionDto } from './dto/create-pharmacy-transaction.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';
import { PharmacyService } from './pharmacy.service';

@Controller('pharmacy')
@UseGuards(AuthGuard('jwt'), JwtAuthGuard, RolesGuard)
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  @Post('medicines')
  @Roles(RoleName.ADMIN, RoleName.PHARMACIST)
  createMedicine(@Body() dto: CreateMedicineDto) {
    return this.pharmacyService.createMedicine(dto);
  }

  @Get('medicines')
  @Roles(RoleName.ADMIN, RoleName.PHARMACIST)
  findMedicines(@Query() query: PaginationQueryDto) {
    return this.pharmacyService.findMedicines(query.page, query.limit);
  }

  @Patch('medicines/:id')
  @Roles(RoleName.ADMIN, RoleName.PHARMACIST)
  updateMedicine(@Param('id') id: string, @Body() dto: UpdateMedicineDto) {
    return this.pharmacyService.updateMedicine(id, dto);
  }

  @Delete('medicines/:id')
  @Roles(RoleName.ADMIN)
  removeMedicine(@Param('id') id: string) {
    return this.pharmacyService.removeMedicine(id);
  }

  @Post('transactions')
  @Roles(RoleName.ADMIN, RoleName.PHARMACIST)
  createTransaction(@Body() dto: CreatePharmacyTransactionDto) {
    return this.pharmacyService.createTransaction(dto);
  }

  @Get('transactions')
  @Roles(RoleName.ADMIN, RoleName.PHARMACIST)
  findTransactions(@Query() query: PaginationQueryDto) {
    return this.pharmacyService.findTransactions(query.page, query.limit);
  }
}
