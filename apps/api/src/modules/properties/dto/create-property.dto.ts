import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsArray, Min } from 'class-validator';
import { PropertyType } from '@prisma/client';

export class CreatePropertyDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  propertyCode!: string;

  @IsNotEmpty()
  @IsEnum(PropertyType)
  propertyType!: PropertyType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  addressLine1!: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsNotEmpty()
  @IsString()
  city!: string;

  @IsNotEmpty()
  @IsString()
  state!: string;

  @IsNotEmpty()
  @IsString()
  postalCode!: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  totalFloors!: number;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  totalUnits!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsInt()
  yearBuilt?: number;

  @IsOptional()
  @IsString()
  managerName?: string;
}
