import { LeaseStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsNumber, IsOptional, Max, Min } from "class-validator";

export class UpdateLeaseDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  monthlyRent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  securityDeposit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(28)
  rentDueDay?: number;

  @IsOptional()
  @IsEnum(LeaseStatus)
  status?: LeaseStatus;
}
