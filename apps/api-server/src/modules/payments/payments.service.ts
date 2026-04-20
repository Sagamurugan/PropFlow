import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PaymentStatus } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { UpdatePaymentDto } from "./dto/update-payment.dto";

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.payment.findMany({
      include: {
        lease: {
          include: {
            tenant: {
              include: {
                user: true
              }
            },
            unit: {
              include: {
                property: true
              }
            }
          }
        }
      }
    });
  }

  findOne(id: string) {
    return this.prisma.payment.findUnique({
      where: { id },
      include: {
        lease: {
          include: {
            tenant: {
              include: {
                user: true
              }
            },
            unit: {
              include: {
                property: true
              }
            }
          }
        }
      }
    });
  }

  async create(dto: CreatePaymentDto) {
    const lease = await this.prisma.lease.findUnique({
      where: { id: dto.leaseId }
    });

    if (!lease) {
      throw new NotFoundException("Lease not found");
    }

    this.validateAmounts(dto.amountDue, dto.amountPaid);

    return this.prisma.payment.create({
      data: {
        leaseId: dto.leaseId,
        dueDate: new Date(dto.dueDate),
        amountDue: dto.amountDue,
        amountPaid: dto.amountPaid,
        paidAt: dto.status === PaymentStatus.PAID ? new Date() : undefined,
        status: dto.status,
        paymentMethod: dto.paymentMethod,
        referenceNumber: dto.referenceNumber
      }
    });
  }

  async update(id: string, dto: UpdatePaymentDto) {
    const existingPayment = await this.prisma.payment.findUnique({
      where: { id }
    });

    if (!existingPayment) {
      throw new NotFoundException("Payment not found");
    }

    this.validateAmounts(dto.amountDue ?? Number(existingPayment.amountDue), dto.amountPaid);

    return this.prisma.payment.update({
      where: { id },
      data: {
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        amountDue: dto.amountDue,
        amountPaid: dto.amountPaid,
        lateFee: dto.lateFee,
        status: dto.status,
        paymentMethod: dto.paymentMethod,
        referenceNumber: dto.referenceNumber,
        notes: dto.notes,
        paidAt:
          dto.status === PaymentStatus.PAID
            ? existingPayment.paidAt ?? new Date()
            : dto.status
              ? null
              : undefined
      }
    });
  }

  async remove(id: string) {
    const existingPayment = await this.prisma.payment.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!existingPayment) {
      throw new NotFoundException("Payment not found");
    }

    await this.prisma.payment.delete({
      where: { id }
    });

    return { success: true };
  }

  private validateAmounts(amountDue: number, amountPaid?: number) {
    if (amountDue <= 0) {
      throw new BadRequestException("Amount due must be greater than zero");
    }

    if (amountPaid !== undefined && amountPaid < 0) {
      throw new BadRequestException("Amount paid cannot be negative");
    }
  }
}
