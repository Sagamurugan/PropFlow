import { IsOptional, IsString } from "class-validator";

export class CreateTenantDto {
  @IsString()
  userId!: string;

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
}
