import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { CreateLabTestDto } from './dto/create-lab-test.dto';
import { UpdateLabOrderDto } from './dto/update-lab-order.dto';
import { UpdateLabTestDto } from './dto/update-lab-test.dto';
import { LabService } from './lab.service';

@Controller('lab')
@UseGuards(AuthGuard('jwt'), JwtAuthGuard, RolesGuard)
export class LabController {
  constructor(private readonly labService: LabService) {}

  @Post('tests')
  @Roles(RoleName.ADMIN, RoleName.LAB_TECHNICIAN)
  createTest(@Body() dto: CreateLabTestDto) {
    return this.labService.createTest(dto);
  }

  @Get('tests')
  @Roles(RoleName.ADMIN, RoleName.LAB_TECHNICIAN, RoleName.DOCTOR, RoleName.RECEPTIONIST)
  listTests(@Query() query: PaginationQueryDto) {
    return this.labService.listTests(query.page, query.limit);
  }

  @Patch('tests/:id')
  @Roles(RoleName.ADMIN, RoleName.LAB_TECHNICIAN)
  updateTest(@Param('id') id: string, @Body() dto: UpdateLabTestDto) {
    return this.labService.updateTest(id, dto);
  }

  @Post('orders')
  @Roles(RoleName.ADMIN, RoleName.DOCTOR, RoleName.RECEPTIONIST)
  createOrder(
    @Body() dto: CreateLabOrderDto,
    @Req() req: Request & { user: { userId: string; role: RoleName } },
  ) {
    return this.labService.createOrder(dto, req.user);
  }

  @Get('orders')
  @Roles(RoleName.ADMIN, RoleName.DOCTOR, RoleName.LAB_TECHNICIAN, RoleName.RECEPTIONIST)
  listOrders(
    @Query() query: PaginationQueryDto,
    @Req() req: Request & { user: { userId: string; role: RoleName } },
  ) {
    return this.labService.listOrders(query.page, query.limit, req.user);
  }

  @Patch('orders/:id')
  @Roles(RoleName.ADMIN, RoleName.LAB_TECHNICIAN)
  updateOrder(
    @Param('id') id: string,
    @Body() dto: UpdateLabOrderDto,
    @Req() req: Request & { user: { userId: string; role: RoleName } },
  ) {
    return this.labService.updateOrder(id, dto, req.user);
  }
}
