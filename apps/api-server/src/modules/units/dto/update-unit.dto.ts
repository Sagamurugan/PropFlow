import { UnitStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateUnitDto {
  @IsOptional()
  @IsString()
  unitNumber?: string;

  @IsOptional()
  @IsString()
  floor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  monthlyRent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  securityDeposit?: number;

  @IsOptional()
  @IsEnum(UnitStatus)
  status?: UnitStatus;
}
