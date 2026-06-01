import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateLeaseDto {
  @IsNotEmpty()
  @IsString()
  leaseNumber!: string;

  @IsNotEmpty()
  @IsString()
  tenantId!: string;

  @IsNotEmpty()
  @IsString()
  unitId!: string;

  @IsNotEmpty()
  @IsDateString()
  startDate!: string;

  @IsNotEmpty()
  @IsDateString()
  endDate!: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  monthlyRent!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  securityDeposit!: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  noticePeriodDays?: number;

  @IsOptional()
  @IsString()
  signedDocumentUrl?: string;
}
