import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";

export class CreatePaymentDto {
  @IsString()
  leaseId!: string;

  @IsDateString()
  dueDate!: string;

  @Type(() => Number)
  @IsNumber()
  amountDue!: number;

  @IsEnum(PaymentStatus)
  status: PaymentStatus = PaymentStatus.PENDING;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  amountPaid?: number;

  @IsOptional()
  @IsString()
  referenceNumber?: string;
}
