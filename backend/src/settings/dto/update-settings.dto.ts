import { IsObject, IsString } from 'class-validator';

export class UpdateSettingsDto {
  @IsString()
  hospitalName: string;

  @IsString()
  hospitalEmail: string;

  @IsString()
  hospitalPhone: string;

  @IsString()
  hospitalAddress: string;

  @IsObject()
  rolesConfig: Record<string, unknown>;

  @IsObject()
  permissionsConfig: Record<string, unknown>;
}
