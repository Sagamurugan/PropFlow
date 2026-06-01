import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class ActivityLogService {
  constructor(private prisma: PrismaService) {}

  async log(action: string, entityType: string, entityId: string, performedBy: string, organizationId: string) {
    return this.prisma.activityLog.create({
      data: {
        action,
        entityType,
        entityId,
        performedBy,
        organizationId,
      },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.activityLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
