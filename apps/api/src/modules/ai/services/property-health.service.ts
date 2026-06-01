import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { GeminiProvider } from '../providers/gemini.provider';

@Injectable()
export class PropertyHealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiProvider: GeminiProvider,
  ) {}

  async calculatePropertyHealth(propertyId: string, organizationId: string, apiKey?: string): Promise<any> {
    // 1. Verify property ownership and details
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, organizationId },
      include: {
        units: {
          include: {
            leases: {
              where: { status: 'ACTIVE' },
            },
          },
        },
        maintenance: {
          where: { status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] } },
        },
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found or access denied');
    }

    const totalUnits = property.units.length;

    // A: Occupancy Score (0-100)
    const occupiedUnits = property.units.filter((u) => u.status === 'OCCUPIED').length;
    const occupancyScore = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 100;

    // B: Maintenance Score (0-100)
    // Dynamic: start at 100, deduct 15 points per active maintenance ticket, minimum 30
    const activeTicketsCount = property.maintenance.length;
    const maintenanceScore = Math.max(30, 100 - activeTicketsCount * 15);

    // C: Lease Stability Score (0-100)
    // Check how many occupied units have active leases and how close they are to expiry
    let totalLeaseScore = 0;
    let unitsWithLeasesChecked = 0;
    const now = new Date();

    for (const unit of property.units) {
      if (unit.status === 'OCCUPIED') {
        unitsWithLeasesChecked++;
        const activeLease = unit.leases[0];
        if (!activeLease) {
          totalLeaseScore += 0; // Occupied with no active lease is high risk!
        } else {
          const endDate = new Date(activeLease.endDate);
          const diffTime = endDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays < 0) {
            totalLeaseScore += 0; // Lease expired but still occupied
          } else if (diffDays <= 30) {
            totalLeaseScore += 50; // Expiring within 30 days (warning)
          } else {
            totalLeaseScore += 100; // Stable
          }
        }
      }
    }
    const leaseScore = unitsWithLeasesChecked > 0 ? Math.round(totalLeaseScore / unitsWithLeasesChecked) : 100;

    // D: Financial Score (0-100)
    // Get rent payment records of the last 30 days for this property's units
    const rentRecords = await this.prisma.rentRecord.findMany({
      where: {
        lease: {
          unit: { propertyId },
        },
        dueDate: {
          gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // last 30 days
        },
      },
    });

    let totalDue = 0;
    let totalPaid = 0;
    for (const rec of rentRecords) {
      totalDue += Number(rec.amountDue);
      totalPaid += Number(rec.amountPaid);
    }
    const financialScore = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 100;

    // Combined Score (weighted average)
    // Occupancy (30%), Financial (30%), Maintenance (20%), Lease (20%)
    const score = Math.round(
      occupancyScore * 0.3 +
      financialScore * 0.3 +
      maintenanceScore * 0.2 +
      leaseScore * 0.2
    );

    // Save score in historical log
    await this.prisma.propertyHealthHistory.create({
      data: {
        propertyId,
        score,
        occupancyScore,
        financialScore,
        maintenanceScore,
        leaseScore,
      },
    });

    // Fetch AI interpretation from Gemini
    const systemInstruction = `
      You are a senior real estate portfolio strategist and asset manager.
      You analyze property operational analytics and write an executive briefing.
      Provide highly professional, premium SaaS feedback.
      Output format: Return a plain text with strictly three headers:
      - EXECUTIVE SUMMARY
      - CRITICAL OPERATIONS RISKS
      - ACTIONABLE NEXT STEPS
      Keep it brief (max 250 words total), bulleted, and impactful. Make recommendations local to the metrics provided (e.g. mention the exact score percentages and suggest concrete resolutions).
      CRITICAL: Do NOT use markdown bolding with double asterisks (e.g. **text**) or asterisk bullet points. Use standard clean text and simple dashes (-) for bullet points.
    `;

    const prompt = `
      Property: "${property.name}" (Type: ${property.propertyType}, Units: ${totalUnits})
      Operational Metrics:
      - Overall Health Score: ${score}/100
      - Occupancy Score: ${occupancyScore}/100 (Occupied Units: ${occupiedUnits}/${totalUnits})
      - Financial Rent Collection Score: ${financialScore}/100
      - Maintenance Tickets Score: ${maintenanceScore}/100 (Active Maintenance requests: ${activeTicketsCount})
      - Lease Stability Score: ${leaseScore}/100

      Please provide the executive property intelligence report.
    `;

    let interpretation = '';
    try {
      interpretation = await this.geminiProvider.generateText(systemInstruction, prompt, apiKey);
    } catch (err) {
      interpretation = `EXECUTIVE SUMMARY\nProperty overall health is calculated at ${score}%. Occupancy stands at ${occupancyScore}%, collection rate at ${financialScore}%, and maintenance ticket outstanding status at ${maintenanceScore}%.\n\nCRITICAL OPERATIONS RISKS\nUnresolved maintenance requests and/or upcoming lease expiries require close supervision.\n\nACTIONABLE NEXT STEPS\n- Resolve pending tenant maintenance requests.\n- Review tenant payment status for the current billing cycle.`;
    }

    return {
      propertyId,
      propertyName: property.name,
      score,
      breakdown: {
        occupancy: occupancyScore,
        financial: financialScore,
        maintenance: maintenanceScore,
        lease: leaseScore,
      },
      stats: {
        totalUnits,
        occupiedUnits,
        activeMaintenance: activeTicketsCount,
        recentRentDue: totalDue,
        recentRentPaid: totalPaid,
      },
      interpretation,
    };
  }

  async getHealthHistory(propertyId: string, organizationId: string): Promise<any> {
    // Verify access
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, organizationId },
    });
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return this.prisma.propertyHealthHistory.findMany({
      where: { propertyId },
      orderBy: { recordedAt: 'desc' },
      take: 12, // Last 12 records
    });
  }
}
