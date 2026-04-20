import { PropertyType } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class CreatePropertyDto {
  @IsString()
  ownerId!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsEnum(PropertyType)
  type: PropertyType = PropertyType.APARTMENT;

  @IsString()
  addressLine1!: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsString()
  city!: string;

  @IsString()
  state!: string;

  @IsOptional()
  @IsString()
  postalCode?: string;
}
