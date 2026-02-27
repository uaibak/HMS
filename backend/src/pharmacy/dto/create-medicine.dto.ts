import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateMedicineDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  genericName?: string;

  @IsString()
  batchNo: string;

  @IsDateString()
  expiryDate: string;

  @Min(0)
  stock: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}
