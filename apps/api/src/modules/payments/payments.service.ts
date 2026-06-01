import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { GenerateRentDto } from './dto/generate-rent.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { PaymentStatus, LeaseStatus, NotificationType } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async generateMonthlyRent(dto: GenerateRentDto, organizationId: string, userId: string) {
    const activeLeases = await this.prisma.lease.findMany({
      where: {
        organizationId,
        status: LeaseStatus.ACTIVE,
      },
    });

    let generatedCount = 0;

    for (const lease of activeLeases) {
      // Prevent double billing for same month & lease
      const existing = await this.prisma.rentRecord.findFirst({
        where: {
          leaseId: lease.id,
          month: dto.month,
        },
      });

      if (existing) continue;

      const dueDate = new Date(`${dto.month}-05`); // Due on 5th of the month

      await this.prisma.rentRecord.create({
        data: {
          month: dto.month,
          amountDue: lease.monthlyRent,
          balance: lease.monthlyRent,
          dueDate,
          paymentStatus: PaymentStatus.PENDING,
          tenantId: lease.tenantId,
          leaseId: lease.id,
          createdBy: userId,
        },
      });

      generatedCount++;
    }

    // Log notification
    await this.prisma.notification.create({
      data: {
        title: 'Monthly Rent Ledger Compiled',
        message: `Rent generation run complete for ${dto.month}. Scaffolded billing entries for ${generatedCount} active leases.`,
        type: NotificationType.PAYMENT,
        userId,
      },
    });

    return {
      message: `Rent ledger generation completed. Compiled ${generatedCount} active lease statements.`,
      generatedCount,
    };
  }

  async recordPayment(id: string, dto: RecordPaymentDto, organizationId: string, userId: string) {
    const record = await this.prisma.rentRecord.findUnique({
      where: { id },
      include: {
        tenant: true,
        lease: true,
      },
    });

    if (!record || record.lease.organizationId !== organizationId) {
      throw new NotFoundException('Rent record not found within your organization context');
    }

    const currentPaid = Number(record.amountPaid) + dto.amountPaid;
    const currentLateFee = dto.lateFee !== undefined ? dto.lateFee : Number(record.lateFee);
    const balance = (Number(record.amountDue) + currentLateFee) - currentPaid;

    let status: PaymentStatus = PaymentStatus.PENDING;
    if (balance <= 0) {
      status = PaymentStatus.PAID;
    } else if (currentPaid > 0) {
      status = PaymentStatus.PARTIAL;
    } else if (record.dueDate < new Date()) {
      status = PaymentStatus.OVERDUE;
    }

    const updated = await this.prisma.rentRecord.update({
      where: { id },
      data: {
        amountPaid: currentPaid,
        lateFee: currentLateFee,
        balance,
        paymentStatus: status,
        reference: dto.reference || record.reference,
        receiptUrl: dto.receiptUrl || record.receiptUrl,
        paidAt: balance <= 0 ? new Date() : record.paidAt,
        updatedBy: userId,
      },
    });

    // Notify user
    await this.prisma.notification.create({
      data: {
        title: 'Payment Received',
        message: `Recorded payment of $${dto.amountPaid} for tenant ${record.tenant.firstName} ${record.tenant.lastName} (${record.month}).`,
        type: NotificationType.PAYMENT,
        userId,
      },
    });

    return updated;
  }

  async findAll(organizationId: string) {
    return this.prisma.rentRecord.findMany({
      where: {
        lease: { organizationId },
      },
      include: {
        tenant: true,
        lease: {
          include: { unit: { include: { property: true } } },
        },
      },
      orderBy: { dueDate: 'desc' },
    });
  }

  async findTenantPayments(organizationId: string, email: string) {
    return this.prisma.rentRecord.findMany({
      where: {
        lease: { organizationId },
        tenant: { email },
      },
      include: {
        tenant: true,
        lease: {
          include: { unit: { include: { property: true } } },
        },
      },
      orderBy: { dueDate: 'desc' },
    });
  }

  /**
   * Check for overdue payments
   * Auto calculates days overdue and triggers notifications.
   */
  async checkOverdueRent() {
    const overdueRecords = await this.prisma.rentRecord.findMany({
      where: {
        dueDate: { lt: new Date() },
        paymentStatus: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] },
      },
      include: {
        tenant: true,
        lease: {
          include: {
            organization: {
              include: { users: { where: { role: 'OWNER' } } },
            },
          },
        },
      },
    });

    for (const record of overdueRecords) {
      await this.prisma.rentRecord.update({
        where: { id: record.id },
        data: { paymentStatus: PaymentStatus.OVERDUE },
      });

      const owner = record.lease.organization.users[0];
      if (owner) {
        await this.prisma.notification.create({
          data: {
            title: 'Rent Overdue Alert',
            message: `Rent for tenant ${record.tenant.firstName} ${record.tenant.lastName} (${record.month}) is now overdue. Due date was ${record.dueDate.toLocaleDateString()}.`,
            type: NotificationType.PAYMENT,
            userId: owner.id,
          },
        });
      }
    }

    return { checked: true, overdueCount: overdueRecords.length };
  }
}
