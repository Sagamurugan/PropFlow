import { Type } from "class-transformer";
import { IsDateString, IsInt, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateLeaseDto {
  @IsString()
  unitId!: string;

  @IsString()
  tenantId!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @Type(() => Number)
  @IsNumber()
  monthlyRent!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  securityDeposit?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(28)
  rentDueDay = 1;
}
