import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { GeminiProvider } from '../providers/gemini.provider';
import { SchemaType } from '@google/generative-ai';

const AssistantIntentSchema: any = {
  type: SchemaType.OBJECT,
  properties: {
    intent: { 
      type: SchemaType.STRING, 
      description: 'The detected user query intent. Must be one of: LIST_PROPERTIES, LIST_VACANT_UNITS, LIST_OVERDUE_PAYMENTS, LIST_MAINTENANCE_TICKETS, PROPERTY_STATISTICS, GENERAL_HELP' 
    },
    filters: {
      type: SchemaType.OBJECT,
      properties: {
        propertyName: { type: SchemaType.STRING, description: 'Partial name of the property to filter by' },
        propertyId: { type: SchemaType.STRING, description: 'Specific property uuid if referenced' },
        unitStatus: { type: SchemaType.STRING, description: 'Unit status filter (VACANT, OCCUPIED, RESERVED, MAINTENANCE)' },
        unitType: { type: SchemaType.STRING, description: 'Unit type (BHK1, BHK2, BHK3, STUDIO, SHOP, OFFICE)' },
        paymentStatus: { type: SchemaType.STRING, description: 'Payment status (PENDING, PARTIAL, PAID, OVERDUE)' },
        maintenancePriority: { type: SchemaType.STRING, description: 'Ticket priority (LOW, MEDIUM, HIGH, CRITICAL)' },
        maintenanceStatus: { type: SchemaType.STRING, description: 'Ticket status (OPEN, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED)' },
        month: { type: SchemaType.STRING, description: 'Billing month formatted as YYYY-MM' }
      }
    },
    searchQuery: { type: SchemaType.STRING, description: 'A semantic search query string to search descriptions or text fields' }
  },
  required: ['intent']
};

@Injectable()
export class AssistantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiProvider: GeminiProvider,
  ) {}

  async processQuery(query: string, organizationId: string, apiKey?: string): Promise<any> {
    // 1. Detect Intent using Gemini responseSchema
    const systemInstruction = `
      You are the PropFlow AI Smart Assistant.
      Identify the user intent and parse relevant search parameters or filter criteria.
      Predefined intents:
      - LIST_PROPERTIES: User wants to list, count, or find properties (e.g. villa, apartment, city, name).
      - LIST_VACANT_UNITS: User wants to find vacant, empty, or unleased house units.
      - LIST_OVERDUE_PAYMENTS: User wants to find unpaid rent, late rent, overdue payments, or tenants who owe money.
      - LIST_MAINTENANCE_TICKETS: User wants to find work orders, repairs, maintenance tickets.
      - PROPERTY_STATISTICS: User wants a high-level operational summary of properties, occupancy, maintenance, and revenue.
      - GENERAL_HELP: User is asking about capabilities or general real estate management advice.
    `;

    const prompt = `
      User asked: "${query}"
      Detect the intent and populate the filters strictly matching the intent.
    `;

    const parsedJson = await this.geminiProvider.generateJson(systemInstruction, prompt, AssistantIntentSchema, apiKey);
    const { intent, filters = {}, searchQuery = '' } = parsedJson;

    let dbData: any = null;

    // 2. Safely query the database based on intent, fully scoped to caller's organizationId
    switch (intent) {
      case 'LIST_PROPERTIES':
        dbData = await this.prisma.property.findMany({
          where: {
            organizationId,
            isDeleted: false,
            ...(filters.propertyName ? { name: { contains: filters.propertyName, mode: 'insensitive' } } : {}),
            ...(filters.propertyId ? { id: filters.propertyId } : {})
          },
          orderBy: { name: 'asc' }
        });
        break;

      case 'LIST_VACANT_UNITS':
        dbData = await this.prisma.unit.findMany({
          where: {
            organizationId,
            status: 'VACANT',
            ...(filters.propertyId ? { propertyId: filters.propertyId } : {}),
            ...(filters.unitType ? { unitType: filters.unitType } : {})
          },
          include: {
            property: true
          },
          orderBy: { unitNumber: 'asc' }
        });
        break;

      case 'LIST_OVERDUE_PAYMENTS':
        dbData = await this.prisma.rentRecord.findMany({
          where: {
            lease: {
              organizationId
            },
            paymentStatus: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
            ...(filters.month ? { month: filters.month } : {})
          },
          include: {
            tenant: true,
            lease: {
              include: {
                unit: {
                  include: { property: true }
                }
              }
            }
          },
          orderBy: { dueDate: 'asc' }
        });
        break;

      case 'LIST_MAINTENANCE_TICKETS':
        dbData = await this.prisma.maintenanceRequest.findMany({
          where: {
            organizationId,
            ...(filters.maintenancePriority ? { priority: filters.maintenancePriority } : {}),
            ...(filters.maintenanceStatus ? { status: filters.maintenanceStatus } : {}),
            ...(filters.propertyId ? { propertyId: filters.propertyId } : {})
          },
          include: {
            property: true,
            unit: true,
            tenant: true
          },
          orderBy: { createdAt: 'desc' }
        });
        break;

      case 'PROPERTY_STATISTICS':
        const propertiesCount = await this.prisma.property.count({ where: { organizationId, isDeleted: false } });
        const unitsCount = await this.prisma.unit.count({ where: { organizationId } });
        const occupiedUnits = await this.prisma.unit.count({ where: { organizationId, status: 'OCCUPIED' } });
        const pendingPayments = await this.prisma.rentRecord.count({
          where: { lease: { organizationId }, paymentStatus: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } }
        });
        const openTickets = await this.prisma.maintenanceRequest.count({
          where: { organizationId, status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] } }
        });

        dbData = {
          propertiesCount,
          unitsCount,
          occupiedUnits,
          occupancyRate: unitsCount > 0 ? Math.round((occupiedUnits / unitsCount) * 100) : 0,
          pendingPaymentsCount: pendingPayments,
          openMaintenanceTickets: openTickets
        };
        break;

      default:
        dbData = null;
    }

    // 3. Generate structured AI text briefing explaining the database result in premium SaaS style
    const briefingSystemInstruction = `
      You are PropFlow AI, a premium virtual property assistant.
      Explain the returned database results or provide assistance.
      Use professional, helpful, Vercel-style typography. Keep it friendly and concise.
      If no database records are found, suggest helpful advice.
      In your response, mention that the search is 100% secure and isolated to their active organization.
      CRITICAL: Do NOT use markdown bolding with double asterisks (e.g. **text**) or asterisk bullet points. Write in clean, professional plain text paragraphs or use simple dashes (-) for lists.
    `;

    const briefingPrompt = `
      User Query: "${query}"
      Detected Intent: ${intent}
      Parsed Filters: ${JSON.stringify(filters)}
      Database Results: ${JSON.stringify(dbData)}

      Formulate a helpful and structured summary response explaining these results.
    `;

    const responseText = await this.geminiProvider.generateText(briefingSystemInstruction, briefingPrompt, apiKey);

    return {
      intent,
      filters,
      data: dbData,
      response: responseText
    };
  }
}
