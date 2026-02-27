import { SampleStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateLabOrderDto {
  @IsOptional()
  @IsEnum(SampleStatus)
  sampleStatus?: SampleStatus;

  @IsOptional()
  @IsString()
  resultFileUrl?: string;

  @IsOptional()
  @IsString()
  resultText?: string;
}
