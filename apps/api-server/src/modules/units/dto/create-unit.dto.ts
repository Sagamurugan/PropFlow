import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateUnitDto {
  @IsString()
  propertyId!: string;

  @IsString()
  unitNumber!: string;

  @IsOptional()
  @IsString()
  floor?: string;

  @Type(() => Number)
  @IsNumber()
  monthlyRent!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  securityDeposit?: number;
}
