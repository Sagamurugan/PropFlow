import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsString, Min, Max } from 'class-validator';
import { UnitType } from '@prisma/client';

export class BulkGenerateUnitDto {
  @IsNotEmpty()
  @IsString()
  propertyId!: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  startFloor!: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(100)
  endFloor!: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(50)
  unitsPerFloor!: number;

  @IsNotEmpty()
  @IsEnum(UnitType)
  unitType!: UnitType;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  areaSqFt!: number;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  bedrooms!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  bathrooms!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  rentAmount!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  depositAmount!: number;
}
