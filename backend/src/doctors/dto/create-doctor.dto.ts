import { Type } from 'class-transformer';
import { IsEmail, IsObject, IsString, ValidateNested } from 'class-validator';

class AvailabilityDto {
  @IsString()
  day: string;

  @IsString()
  from: string;

  @IsString()
  to: string;
}

export class CreateDoctorDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  specialization: string;

  @IsObject()
  availability: Record<string, string | AvailabilityDto[]>;

  @IsString()
  phone: string;

  @IsEmail()
  email: string;
}
