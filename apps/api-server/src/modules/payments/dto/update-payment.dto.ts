import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdatePaymentDto {
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  amountDue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  amountPaid?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lateFee?: number;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
