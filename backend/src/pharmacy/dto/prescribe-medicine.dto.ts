import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class PrescribeMedicineDto {
  @IsString()
  patientId: string;

  @IsString()
  medicineId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
