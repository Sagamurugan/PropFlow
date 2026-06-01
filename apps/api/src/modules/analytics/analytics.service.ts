import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { LeaseStatus, UnitStatus, PaymentStatus, MaintenanceStatus, MaintenancePriority } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getSummary(organizationId: string) {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Basic Counts
    const totalProperties = await this.prisma.property.count({
      where: { organizationId, isDeleted: false },
    });

    const totalUnits = await this.prisma.unit.count({
      where: { organizationId, property: { isDeleted: false } },
    });

    const occupiedUnits = await this.prisma.unit.count({
      where: { organizationId, status: UnitStatus.OCCUPIED, property: { isDeleted: false } },
    });

    const vacantUnits = await this.prisma.unit.count({
      where: { organizationId, status: UnitStatus.VACANT, property: { isDeleted: false } },
    });

    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    const activeLeases = await this.prisma.lease.count({
      where: { organizationId, status: LeaseStatus.ACTIVE },
    });

    // Revenue calculations (current month)
    const monthlyRentRecords = await this.prisma.rentRecord.findMany({
      where: {
        lease: { organizationId },
        month: currentMonthStr,
      },
    });

    const monthlyRevenue = monthlyRentRecords.reduce((sum, record) => sum + Number(record.amountPaid), 0);

    // Overdue Rent sum
    const overdueRentRecords = await this.prisma.rentRecord.findMany({
      where: {
        lease: { organizationId },
        paymentStatus: { in: [PaymentStatus.OVERDUE, PaymentStatus.PENDING, PaymentStatus.PARTIAL] },
      },
    });
    const overdueRent = overdueRentRecords.reduce((sum, record) => sum + Number(record.balance), 0);

    // Open Maintenance Tickets
    const openTickets = await this.prisma.maintenanceRequest.count({
      where: {
        organizationId,
        status: { in: [MaintenanceStatus.OPEN, MaintenanceStatus.ASSIGNED, MaintenanceStatus.IN_PROGRESS] },
      },
    });

    // 6-Month Revenue Trend
    const revenueTrend = await this.getRevenueTrendData(organizationId, 6);

    // Maintenance Category Breakdown
    const maintenanceRequests = await this.prisma.maintenanceRequest.findMany({
      where: { organizationId },
      select: { category: true },
    });
    const maintenanceBreakdown = this.calculateMaintenanceCategoryBreakdown(maintenanceRequests);

    // Recent Activities
    const recentActivities = await this.prisma.activityLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Upcoming Lease Expiries (30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const upcomingLeases = await this.prisma.lease.findMany({
      where: {
        organizationId,
        status: LeaseStatus.ACTIVE,
        endDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        tenant: true,
        unit: true,
      },
      orderBy: { endDate: 'asc' },
      take: 5,
    });

    // Recent Overdue Payments
    const recentOverduePayments = await this.prisma.rentRecord.findMany({
      where: {
        lease: { organizationId },
        paymentStatus: PaymentStatus.OVERDUE,
      },
      include: {
        tenant: true,
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    });

    return {
      kpis: {
        totalProperties,
        totalUnits,
        occupiedUnits,
        vacantUnits,
        occupancyRate: Math.round(occupancyRate * 10) / 10,
        activeLeases,
        monthlyRevenue,
        overdueRent,
        openTickets,
      },
      charts: {
        revenueTrend,
        maintenanceBreakdown,
      },
      recentActivities,
      upcomingLeases: upcomingLeases.map(l => ({
        id: l.id,
        tenantName: `${l.tenant.firstName} ${l.tenant.lastName}`,
        unitNumber: l.unit.unitNumber,
        endDate: l.endDate,
        daysRemaining: Math.ceil((l.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      })),
      overduePayments: recentOverduePayments.map(p => ({
        id: p.id,
        tenantName: `${p.tenant.firstName} ${p.tenant.lastName}`,
        month: p.month,
        amountDue: Number(p.amountDue),
        balance: Number(p.balance),
        dueDate: p.dueDate,
      })),
    };
  }

  async getRevenueAnalytics(organizationId: string) {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentYearStr = `${now.getFullYear()}`;

    const rentRecords = await this.prisma.rentRecord.findMany({
      where: { lease: { organizationId } },
    });

    const monthlyRecords = rentRecords.filter(r => r.month === currentMonthStr);
    const yearlyRecords = rentRecords.filter(r => r.month.startsWith(currentYearStr));

    const monthlyRevenue = monthlyRecords.reduce((sum, r) => sum + Number(r.amountPaid), 0);
    const yearlyRevenue = yearlyRecords.reduce((sum, r) => sum + Number(r.amountPaid), 0);

    const collectedRent = rentRecords.reduce((sum, r) => sum + Number(r.amountPaid), 0);
    const overdueRecords = rentRecords.filter(r => r.paymentStatus === PaymentStatus.OVERDUE);
    const overdueRent = overdueRecords.reduce((sum, r) => sum + Number(r.balance), 0);

    const pendingRecords = rentRecords.filter(r => r.paymentStatus === PaymentStatus.PENDING || r.paymentStatus === PaymentStatus.PARTIAL);
    const pendingRent = pendingRecords.reduce((sum, r) => sum + Number(r.balance), 0);

    const totalExpected = rentRecords.reduce((sum, r) => sum + Number(r.amountDue) + Number(r.lateFee), 0);
    const collectionRate = totalExpected > 0 ? (collectedRent / totalExpected) * 100 : 100;

    const revenueTrend = await this.getRevenueTrendData(organizationId, 12);

    return {
      metrics: {
        monthlyRevenue,
        yearlyRevenue,
        collectedRent,
        pendingRent,
        overdueRent,
        collectionRate: Math.round(collectionRate * 10) / 10,
      },
      charts: {
        revenueTrend,
      },
    };
  }

  async getOccupancyAnalytics(organizationId: string) {
    const totalUnits = await this.prisma.unit.count({
      where: { organizationId, property: { isDeleted: false } },
    });

    const occupiedUnits = await this.prisma.unit.count({
      where: { organizationId, status: UnitStatus.OCCUPIED, property: { isDeleted: false } },
    });

    const vacantUnits = await this.prisma.unit.count({
      where: { organizationId, status: UnitStatus.VACANT, property: { isDeleted: false } },
    });

    const reservedUnits = await this.prisma.unit.count({
      where: { organizationId, status: UnitStatus.RESERVED, property: { isDeleted: false } },
    });

    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    // Property Comparison Comps
    const properties = await this.prisma.property.findMany({
      where: { organizationId, isDeleted: false },
      include: {
        units: true,
      },
    });

    const propertyComparison = properties.map(property => {
      const pTotal = property.units.length;
      const pOccupied = property.units.filter(u => u.status === UnitStatus.OCCUPIED).length;
      const pVacant = property.units.filter(u => u.status === UnitStatus.VACANT).length;
      const pReserved = property.units.filter(u => u.status === UnitStatus.RESERVED).length;
      const pRate = pTotal > 0 ? (pOccupied / pTotal) * 100 : 0;

      return {
        id: property.id,
        name: property.name,
        totalUnits: pTotal,
        occupiedUnits: pOccupied,
        vacantUnits: pVacant,
        reservedUnits: pReserved,
        occupancyRate: Math.round(pRate * 10) / 10,
      };
    });

    return {
      metrics: {
        totalUnits,
        occupiedUnits,
        vacantUnits,
        reservedUnits,
        occupancyRate: Math.round(occupancyRate * 10) / 10,
      },
      propertyComparison,
    };
  }

  async getLeaseAnalytics(organizationId: string) {
    const activeLeases = await this.prisma.lease.count({
      where: { organizationId, status: LeaseStatus.ACTIVE },
    });

    const expiredLeases = await this.prisma.lease.count({
      where: { organizationId, status: LeaseStatus.EXPIRED },
    });

    const renewedLeases = await this.prisma.lease.count({
      where: { organizationId, status: LeaseStatus.RENEWED },
    });

    const now = new Date();
    const getFutureDate = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d;
    };

    const exp7 = await this.prisma.lease.findMany({
      where: { organizationId, status: LeaseStatus.ACTIVE, endDate: { gte: now, lte: getFutureDate(7) } },
      include: { tenant: true, unit: true },
    });

    const exp15 = await this.prisma.lease.findMany({
      where: { organizationId, status: LeaseStatus.ACTIVE, endDate: { gte: now, lte: getFutureDate(15) } },
      include: { tenant: true, unit: true },
    });

    const exp30 = await this.prisma.lease.findMany({
      where: { organizationId, status: LeaseStatus.ACTIVE, endDate: { gte: now, lte: getFutureDate(30) } },
      include: { tenant: true, unit: true },
    });

    const upcomingExpirations = await this.prisma.lease.count({
      where: { organizationId, status: LeaseStatus.ACTIVE, endDate: { gte: now, lte: getFutureDate(30) } },
    });

    const mapper = (l: any) => ({
      id: l.id,
      leaseNumber: l.leaseNumber,
      tenantName: `${l.tenant.firstName} ${l.tenant.lastName}`,
      unitNumber: l.unit.unitNumber,
      endDate: l.endDate,
    });

    return {
      metrics: {
        activeLeases,
        expiredLeases,
        renewedLeases,
        upcomingExpirations,
      },
      alerts: {
        expiresIn7Days: exp7.map(mapper),
        expiresIn15Days: exp15.map(mapper),
        expiresIn30Days: exp30.map(mapper),
      },
    };
  }

  async getMaintenanceAnalytics(organizationId: string) {
    const totalTickets = await this.prisma.maintenanceRequest.count({
      where: { organizationId },
    });

    const openTickets = await this.prisma.maintenanceRequest.count({
      where: {
        organizationId,
        status: { in: [MaintenanceStatus.OPEN, MaintenanceStatus.ASSIGNED, MaintenanceStatus.IN_PROGRESS] },
      },
    });

    const resolvedTickets = await this.prisma.maintenanceRequest.count({
      where: {
        organizationId,
        status: { in: [MaintenanceStatus.RESOLVED, MaintenanceStatus.CLOSED] },
      },
    });

    const criticalTickets = await this.prisma.maintenanceRequest.count({
      where: { organizationId, priority: MaintenancePriority.CRITICAL },
    });

    // Average Resolution Time & SLA Compliance
    const resolvedList = await this.prisma.maintenanceRequest.findMany({
      where: {
        organizationId,
        status: { in: [MaintenanceStatus.RESOLVED, MaintenanceStatus.CLOSED] },
      },
    });

    let totalResolutionHours = 0;
    let compliantTickets = 0;

    resolvedList.forEach(ticket => {
      const created = ticket.createdAt.getTime();
      const updated = ticket.updatedAt.getTime();
      const diffHours = (updated - created) / (1000 * 60 * 60);
      totalResolutionHours += diffHours;

      // SLA Compliance check: resolved on or before target date OR resolved under 48 hours if no target date exists
      if (ticket.targetResolutionDate) {
        if (ticket.updatedAt <= ticket.targetResolutionDate) {
          compliantTickets++;
        }
      } else if (diffHours <= 72) {
        compliantTickets++;
      }
    });

    const averageResolutionTime = resolvedList.length > 0 ? totalResolutionHours / resolvedList.length : 0;
    const slaCompliance = resolvedList.length > 0 ? (compliantTickets / resolvedList.length) * 100 : 100;

    // Categories breakdown
    const allRequests = await this.prisma.maintenanceRequest.findMany({
      where: { organizationId },
      select: { category: true },
    });
    const categoryBreakdown = this.calculateMaintenanceCategoryBreakdown(allRequests);

    // Monthly Ticket Trends (last 6 months)
    const ticketTrend = await this.getMaintenanceTrendData(organizationId, 6);

    return {
      metrics: {
        openTickets,
        resolvedTickets,
        averageResolutionTime: Math.round(averageResolutionTime * 10) / 10, // in hours
        criticalTickets,
        slaCompliance: Math.round(slaCompliance * 10) / 10,
      },
      charts: {
        categoryBreakdown,
        ticketTrend,
      },
    };
  }

  async getPropertyScore(propertyId: string, organizationId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, organizationId, isDeleted: false },
      include: {
        units: {
          include: {
            leases: {
              where: { status: LeaseStatus.ACTIVE },
            },
          },
        },
        maintenance: true,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // 1. Occupancy Rate
    const totalUnits = property.units.length;
    const occupiedUnits = property.units.filter(u => u.status === UnitStatus.OCCUPIED).length;
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    // 2. Collection Rate (over last 6 months)
    const leaseIds = property.units.flatMap(u => u.leases.map(l => l.id));
    const rentRecords = await this.prisma.rentRecord.findMany({
      where: { leaseId: { in: leaseIds } },
    });

    const totalExpected = rentRecords.reduce((sum, r) => sum + Number(r.amountDue) + Number(r.lateFee), 0);
    const totalCollected = rentRecords.reduce((sum, r) => sum + Number(r.amountPaid), 0);
    const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 100;

    // 3. Maintenance Resolution SLA Compliance
    const resolvedTickets = property.maintenance.filter(t => t.status === MaintenanceStatus.RESOLVED || t.status === MaintenanceStatus.CLOSED);
    let compliantTickets = 0;
    resolvedTickets.forEach(ticket => {
      const diffHours = (ticket.updatedAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
      if (ticket.targetResolutionDate) {
        if (ticket.updatedAt <= ticket.targetResolutionDate) {
          compliantTickets++;
        }
      } else if (diffHours <= 72) {
        compliantTickets++;
      }
    });
    const maintenanceSLA = resolvedTickets.length > 0 ? (compliantTickets / resolvedTickets.length) * 100 : 100;

    // 4. Lease Stability (Occupied units with active leases vs total occupied units)
    const activeLeaseCount = property.units.filter(u => u.status === UnitStatus.OCCUPIED && u.leases.length > 0).length;
    const leaseStability = occupiedUnits > 0 ? (activeLeaseCount / occupiedUnits) * 100 : 100;

    // Scoring calculation:
    // Occupancy (35%), Collection (35%), Maintenance SLA (15%), Lease Stability (15%)
    const score = (0.35 * occupancyRate) + (0.35 * collectionRate) + (0.15 * maintenanceSLA) + (0.15 * Math.min(leaseStability, 100));

    return {
      propertyName: property.name,
      score: Math.round(score),
      breakdown: {
        occupancyRate: Math.round(occupancyRate * 10) / 10,
        collectionRate: Math.round(collectionRate * 10) / 10,
        maintenanceSLA: Math.round(maintenanceSLA * 10) / 10,
        leaseStability: Math.round(leaseStability * 10) / 10,
      },
    };
  }

  // --- Helper Methods ---

  private async getRevenueTrendData(organizationId: string, limitMonths: number) {
    const data = [];
    const now = new Date();

    for (let i = limitMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'short' });

      const records = await this.prisma.rentRecord.findMany({
        where: {
          lease: { organizationId },
          month: monthStr,
        },
      });

      const expected = records.reduce((sum, r) => sum + Number(r.amountDue) + Number(r.lateFee), 0);
      const collected = records.reduce((sum, r) => sum + Number(r.amountPaid), 0);
      const overdue = records.filter(r => r.paymentStatus === PaymentStatus.OVERDUE).reduce((sum, r) => sum + Number(r.balance), 0);

      data.push({
        month: monthStr,
        label,
        expected,
        collected,
        overdue,
      });
    }

    return data;
  }

  private async getMaintenanceTrendData(organizationId: string, limitMonths: number) {
    const data = [];
    const now = new Date();

    for (let i = limitMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en-US', { month: 'short' });

      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const count = await this.prisma.maintenanceRequest.count({
        where: {
          organizationId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      data.push({
        label,
        requests: count,
      });
    }

    return data;
  }

  private calculateMaintenanceCategoryBreakdown(requests: { category: string }[]) {
    const counts: Record<string, number> = {
      PLUMBING: 0,
      ELECTRICAL: 0,
      CLEANING: 0,
      SECURITY: 0,
      INTERNET: 0,
      OTHER: 0,
    };

    requests.forEach(r => {
      const cat = r.category.toUpperCase();
      if (counts[cat] !== undefined) {
        counts[cat]++;
      } else {
        counts.OTHER++;
      }
    });

    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0) + name.slice(1).toLowerCase(),
      value,
    }));
  }
}
