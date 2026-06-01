import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { LeaseStatus, UnitStatus, PaymentStatus, MaintenanceStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getMonthlyData(organizationId: string) {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Occupancy metrics
    const totalUnits = await this.prisma.unit.count({
      where: { organizationId, property: { isDeleted: false } },
    });
    const occupiedUnits = await this.prisma.unit.count({
      where: { organizationId, status: UnitStatus.OCCUPIED, property: { isDeleted: false } },
    });
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    // Financial metrics
    const rentRecords = await this.prisma.rentRecord.findMany({
      where: { lease: { organizationId }, month: currentMonthStr },
    });
    const expected = rentRecords.reduce((sum, r) => sum + Number(r.amountDue) + Number(r.lateFee), 0);
    const collected = rentRecords.reduce((sum, r) => sum + Number(r.amountPaid), 0);
    const collectionRate = expected > 0 ? (collected / expected) * 100 : 100;
    const overdue = rentRecords.filter(r => r.paymentStatus === PaymentStatus.OVERDUE).reduce((sum, r) => sum + Number(r.balance), 0);

    // Maintenance metrics
    const tickets = await this.prisma.maintenanceRequest.findMany({
      where: { organizationId },
    });
    const totalTickets = tickets.length;
    const resolvedTickets = tickets.filter(t => t.status === MaintenanceStatus.RESOLVED || t.status === MaintenanceStatus.CLOSED).length;
    const openTickets = totalTickets - resolvedTickets;

    // Lease Activity
    const leasesCreated = await this.prisma.lease.count({
      where: {
        organizationId,
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
        },
      },
    });

    return {
      monthName: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
      occupancy: {
        totalUnits,
        occupiedUnits,
        occupancyRate: Math.round(occupancyRate * 10) / 10,
      },
      finance: {
        expected,
        collected,
        overdue,
        collectionRate: Math.round(collectionRate * 10) / 10,
      },
      maintenance: {
        totalTickets,
        resolvedTickets,
        openTickets,
      },
      leaseActivity: {
        leasesCreated,
      },
    };
  }

  async exportReport(format: 'pdf' | 'excel', organizationId: string) {
    const data = await this.getMonthlyData(organizationId);
    const now = new Date();

    if (format === 'excel') {
      // Create a beautifully structured CSV that Excel can open perfectly
      const csvRows = [
        ['PROPFLOW AI - MONTHLY PERFORMANCE REPORT'],
        ['Organization Context', organizationId],
        ['Date Generated', now.toLocaleDateString()],
        ['Report Period', data.monthName],
        [],
        ['SECTION', 'METRIC', 'VALUE'],
        ['Occupancy', 'Total Units', data.occupancy.totalUnits],
        ['Occupancy', 'Occupied Units', data.occupancy.occupiedUnits],
        ['Occupancy', 'Occupancy Rate (%)', `${data.occupancy.occupancyRate}%`],
        [],
        ['Finance', 'Expected Rent', `₹${data.finance.expected.toFixed(2)}`],
        ['Finance', 'Collected Rent', `₹${data.finance.collected.toFixed(2)}`],
        ['Finance', 'Overdue Rent', `₹${data.finance.overdue.toFixed(2)}`],
        ['Finance', 'Collection Rate (%)', `${data.finance.collectionRate}%`],
        [],
        ['Maintenance', 'Total Tickets', data.maintenance.totalTickets],
        ['Maintenance', 'Resolved Tickets', data.maintenance.resolvedTickets],
        ['Maintenance', 'Open Tickets', data.maintenance.openTickets],
        [],
        ['Leases', 'Leases Created This Month', data.leaseActivity.leasesCreated],
      ];

      const csvContent = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      return {
        filename: `propflow_report_${data.monthName.replace(/\s+/g, '_').toLowerCase()}.csv`,
        contentType: 'text/csv',
        content: Buffer.from(csvContent, 'utf-8'),
      };
    } else {
      // Create a premium beautifully structured plain text report for PDF
      const border = '='.repeat(60);
      const subBorder = '-'.repeat(60);

      const pdfContent = [
        border,
        '                  PROPFLOW AI REPORT STATEMENT',
        '               MONTHLY OPERATIONAL & FINANCIAL AUDIT',
        border,
        `Organization Context : ${organizationId}`,
        `Date Generated       : ${now.toLocaleString()}`,
        `Report Period        : ${data.monthName}`,
        subBorder,
        '',
        '1. OCCUPANCY METRICS',
        `   - Total Units               : ${data.occupancy.totalUnits}`,
        `   - Occupied Units            : ${data.occupancy.occupiedUnits}`,
        `   - Portfolio Occupancy Rate  : ${data.occupancy.occupancyRate}%`,
        '',
        '2. FINANCIAL METRICS',
        `   - Expected Monthly Rent     : ₹${data.finance.expected.toFixed(2)}`,
        `   - Collected Monthly Rent    : ₹${data.finance.collected.toFixed(2)}`,
        `   - Portfolio Overdue Rent    : ₹${data.finance.overdue.toFixed(2)}`,
        `   - Revenue Collection Rate   : ${data.finance.collectionRate}%`,
        '',
        '3. MAINTENANCE OPERATIONS',
        `   - Total Service Requests    : ${data.maintenance.totalTickets}`,
        `   - Resolved Tickets          : ${data.maintenance.resolvedTickets}`,
        `   - Open Active Tickets       : ${data.maintenance.openTickets}`,
        '',
        '4. LEASE STABILITY & LIFECYCLE',
        `   - New Leases Executed       : ${data.leaseActivity.leasesCreated}`,
        '',
        border,
        '                    CONFIDENTIAL PLATFORM REPORT',
        '              Generated securely by PropFlow AI Core Engine',
        border,
      ].join('\n');

      return {
        filename: `propflow_report_${data.monthName.replace(/\s+/g, '_').toLowerCase()}.txt`,
        contentType: 'text/plain',
        content: Buffer.from(pdfContent, 'utf-8'),
      };
    }
  }
}
