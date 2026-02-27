import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
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
  create(
    @Body() dto: CreateInvoiceDto,
    @Req() req: Request & { user: { userId: string; role: RoleName } },
  ) {
    return this.billingService.create(dto, req.user);
  }

  @Get('invoices')
  @Roles(RoleName.ADMIN, RoleName.RECEPTIONIST, RoleName.DOCTOR)
  findAll(
    @Query() query: PaginationQueryDto,
    @Req() req: Request & { user: { userId: string; role: RoleName } },
  ) {
    return this.billingService.findAll(query.page, query.limit, req.user);
  }

  @Get('encounters')
  @Roles(RoleName.ADMIN, RoleName.RECEPTIONIST, RoleName.DOCTOR)
  listEncounters(
    @Query() query: PaginationQueryDto,
    @Req() req: Request & { user: { userId: string; role: RoleName } },
  ) {
    return this.billingService.listEncounters(query.page, query.limit, req.user);
  }

  @Get('encounters/:id')
  @Roles(RoleName.ADMIN, RoleName.RECEPTIONIST, RoleName.DOCTOR)
  getEncounter(
    @Param('id') id: string,
    @Req() req: Request & { user: { userId: string; role: RoleName } },
  ) {
    return this.billingService.getEncounterById(id, req.user);
  }

  @Patch('encounters/:id/close')
  @Roles(RoleName.ADMIN, RoleName.RECEPTIONIST)
  closeEncounter(
    @Param('id') id: string,
    @Req() req: Request & { user: { userId: string; role: RoleName } },
  ) {
    return this.billingService.closeEncounter(id, req.user);
  }

  @Patch('invoices/:id')
  @Roles(RoleName.ADMIN, RoleName.RECEPTIONIST)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
    @Req() req: Request & { user: { userId: string; role: RoleName } },
  ) {
    return this.billingService.update(id, dto, req.user);
  }

  @Patch('invoices/:id/payment')
  @Roles(RoleName.ADMIN, RoleName.RECEPTIONIST)
  recordPayment(
    @Param('id') id: string,
    @Body() body: { paidAmount: number },
    @Req() req: Request & { user: { userId: string; role: RoleName } },
  ) {
    return this.billingService.recordPayment(id, body.paidAmount, req.user);
  }
}
