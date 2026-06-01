import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { UnitType, UnitStatus } from '@prisma/client';

export class UpdateUnitDto {
  @IsOptional()
  @IsString()
  unitNumber?: string;

  @IsOptional()
  @IsInt()
  floorNumber?: number;

  @IsOptional()
  @IsEnum(UnitType)
  unitType?: UnitType;

  @IsOptional()
  @IsInt()
  @Min(0)
  areaSqFt?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rentAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;

  @IsOptional()
  @IsEnum(UnitStatus)
  status?: UnitStatus;
}
