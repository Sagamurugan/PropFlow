import { Injectable } from "@nestjs/common";
import { MaintenanceStatus, PaymentStatus, UnitStatus } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [properties, units, pendingPayments, openMaintenance] = await Promise.all([
      this.prisma.property.count(),
      this.prisma.unit.groupBy({
        by: ["status"],
        _count: {
          _all: true
        }
      }),
      this.prisma.payment.count({
        where: {
          status: {
            in: [PaymentStatus.PENDING, PaymentStatus.LATE, PaymentStatus.PARTIAL]
          }
        }
      }),
      this.prisma.maintenanceRequest.count({
        where: {
          status: {
            in: [
              MaintenanceStatus.OPEN,
              MaintenanceStatus.ASSIGNED,
              MaintenanceStatus.IN_PROGRESS
            ]
          }
        }
      })
    ]);

    return {
      totalProperties: properties,
      occupiedUnits:
        units.find((item) => item.status === UnitStatus.OCCUPIED)?._count._all ?? 0,
      vacantUnits:
        units.find((item) => item.status === UnitStatus.VACANT)?._count._all ?? 0,
      pendingPayments,
      openMaintenance
    };
  }
}
