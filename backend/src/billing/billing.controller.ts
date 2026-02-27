import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { BillingService } from './billing.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Controller('billing')
@UseGuards(AuthGuard('jwt'), JwtAuthGuard, RolesGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('invoices')
  @Roles(RoleName.ADMIN, RoleName.RECEPTIONIST)
  create(@Body() dto: CreateInvoiceDto) {
    return this.billingService.create(dto);
  }

  @Get('invoices')
  @Roles(RoleName.ADMIN, RoleName.RECEPTIONIST, RoleName.DOCTOR)
  findAll(@Query() query: PaginationQueryDto) {
    return this.billingService.findAll(query.page, query.limit);
  }

  @Patch('invoices/:id')
  @Roles(RoleName.ADMIN, RoleName.RECEPTIONIST)
  update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.billingService.update(id, dto);
  }

  @Patch('invoices/:id/payment')
  @Roles(RoleName.ADMIN, RoleName.RECEPTIONIST)
  recordPayment(@Param('id') id: string, @Body() body: { paidAmount: number }) {
    return this.billingService.recordPayment(id, body.paidAmount);
  }
}
