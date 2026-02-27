import { Type } from 'class-transformer';
import { IsDateString, IsEmail, IsOptional, IsString } from 'class-validator';

export class CreatePatientDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  cnic: string;

  @IsDateString()
  dob: string;

  @IsString()
  bloodGroup: string;

  @IsString()
  address: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  assignedDoctorId?: string;
}
