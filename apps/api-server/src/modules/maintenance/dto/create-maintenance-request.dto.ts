import { MaintenancePriority } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class CreateMaintenanceRequestDto {
  @IsString()
  unitId!: string;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString()
  reportedByUserId?: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(MaintenancePriority)
  priority: MaintenancePriority = MaintenancePriority.MEDIUM;
}
