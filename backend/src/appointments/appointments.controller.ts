import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Controller('appointments')
@UseGuards(AuthGuard('jwt'), JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(RoleName.ADMIN, RoleName.RECEPTIONIST)
  create(
    @Body() dto: CreateAppointmentDto,
    @Req() req: Request & { user: { userId: string; role: RoleName } },
  ) {
    return this.appointmentsService.create(dto, req.user);
  }

  @Get()
  @Roles(RoleName.ADMIN, RoleName.DOCTOR, RoleName.RECEPTIONIST)
  findAll(
    @Query() query: PaginationQueryDto,
    @Req() req: Request & { user: { userId: string; role: RoleName } },
  ) {
    return this.appointmentsService.findAll(query.page, query.limit, req.user);
  }

  @Patch(':id')
  @Roles(RoleName.ADMIN, RoleName.RECEPTIONIST, RoleName.DOCTOR)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
    @Req() req: Request & { user: { userId: string; role: RoleName } },
  ) {
    return this.appointmentsService.update(id, dto, req.user);
  }

  @Patch(':id/cancel')
  @Roles(RoleName.ADMIN, RoleName.RECEPTIONIST)
  cancel(
    @Param('id') id: string,
    @Req() req: Request & { user: { userId: string; role: RoleName } },
  ) {
    return this.appointmentsService.cancel(id, req.user);
  }

  @Delete(':id')
  @Roles(RoleName.ADMIN)
  remove(
    @Param('id') id: string,
    @Req() req: Request & { user: { userId: string; role: RoleName } },
  ) {
    return this.appointmentsService.remove(id, req.user);
  }
}
