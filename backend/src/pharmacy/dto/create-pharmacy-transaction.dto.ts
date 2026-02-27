import { TransactionType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePharmacyTransactionDto {
  @IsString()
  medicineId: string;

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  amount: number;
}
