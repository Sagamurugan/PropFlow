import { IsOptional, IsString } from "class-validator";

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  kycIdType?: string;

  @IsOptional()
  @IsString()
  kycIdNumber?: string;

  @IsOptional()
  @IsString()
  employmentStatus?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
