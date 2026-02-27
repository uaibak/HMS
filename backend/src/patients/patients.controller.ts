import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoleName } from '@prisma/client';
import { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientQueryDto } from './dto/patient-query.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientsService } from './patients.service';

@Controller('patients')
@UseGuards(AuthGuard('jwt'), JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles(RoleName.ADMIN, RoleName.RECEPTIONIST)
  create(
    @Body() dto: CreatePatientDto,
    @Req() req: Request & { user: { userId: string; role: RoleName } },
  ) {
    return this.patientsService.create(dto, req.user);
  }

  @Get()
  @Roles(RoleName.ADMIN, RoleName.DOCTOR, RoleName.RECEPTIONIST)
  findAll(@Query() query: PatientQueryDto) {
    return this.patientsService.findAll(query.page, query.limit, query.search);
  }

  @Get(':id')
  @Roles(RoleName.ADMIN, RoleName.DOCTOR, RoleName.RECEPTIONIST)
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleName.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
    @Req() req: Request & { user: { userId: string; role: RoleName } },
  ) {
    return this.patientsService.update(id, dto, req.user);
  }

  @Delete(':id')
  @Roles(RoleName.ADMIN)
  remove(
    @Param('id') id: string,
    @Req() req: Request & { user: { userId: string; role: RoleName } },
  ) {
    return this.patientsService.remove(id, req.user);
  }
}
