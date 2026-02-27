import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
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
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  @Get()
  @Roles(RoleName.ADMIN, RoleName.DOCTOR, RoleName.RECEPTIONIST)
  findAll(@Query() query: PaginationQueryDto) {
    return this.appointmentsService.findAll(query.page, query.limit);
  }

  @Patch(':id')
  @Roles(RoleName.ADMIN, RoleName.RECEPTIONIST)
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, dto);
  }

  @Patch(':id/cancel')
  @Roles(RoleName.ADMIN, RoleName.RECEPTIONIST)
  cancel(@Param('id') id: string) {
    return this.appointmentsService.cancel(id);
  }

  @Delete(':id')
  @Roles(RoleName.ADMIN)
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}
