import { IsEnum, IsNotEmpty, IsOptional, IsString, IsArray, IsDateString } from 'class-validator';
import { MaintenanceCategory, MaintenancePriority } from '@prisma/client';

export class CreateTicketDto {
  @IsNotEmpty()
  @IsEnum(MaintenanceCategory)
  category!: MaintenanceCategory;

  @IsNotEmpty()
  @IsEnum(MaintenancePriority)
  priority!: MaintenancePriority;

  @IsNotEmpty()
  @IsString()
  description!: string;

  @IsNotEmpty()
  @IsString()
  ticketNumber!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsDateString()
  targetResolutionDate?: string;

  @IsNotEmpty()
  @IsString()
  tenantId!: string;

  @IsNotEmpty()
  @IsString()
  unitId!: string;

  @IsNotEmpty()
  @IsString()
  propertyId!: string;
}
