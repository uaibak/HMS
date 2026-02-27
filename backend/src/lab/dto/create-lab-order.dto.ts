import { IsOptional, IsString } from 'class-validator';

export class CreateLabOrderDto {
  @IsString()
  patientId: string;

  @IsString()
  testId: string;

  @IsOptional()
  @IsString()
  orderedById?: string;
}
