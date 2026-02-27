import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateLabTestDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;
}
