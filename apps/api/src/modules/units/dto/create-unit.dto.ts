import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { UnitType } from '@prisma/client';

export class CreateUnitDto {
  @IsNotEmpty()
  @IsString()
  propertyId!: string;

  @IsNotEmpty()
  @IsString()
  unitNumber!: string;

  @IsNotEmpty()
  @IsInt()
  floorNumber!: number;

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
