import { Injectable, BadRequestException } from '@nestjs/common';
import { GeminiProvider } from '../providers/gemini.provider';
import { SchemaType } from '@google/generative-ai';

// pdf-parse doesn't have native TS exports; import via require to prevent compiler issues
const pdfParse = require('pdf-parse');

const LeaseExtractionSchema: any = {
  type: SchemaType.OBJECT,
  properties: {
    leaseNumber: { type: SchemaType.STRING, description: 'Extract the unique lease agreement number or reference code' },
    rentAmount: { type: SchemaType.NUMBER, description: 'Monthly rent amount' },
    securityDeposit: { type: SchemaType.NUMBER, description: 'Security deposit amount' },
    startDate: { type: SchemaType.STRING, description: 'Lease start date formatted as YYYY-MM-DD' },
    endDate: { type: SchemaType.STRING, description: 'Lease end/expiry date formatted as YYYY-MM-DD' },
    noticePeriodDays: { type: SchemaType.INTEGER, description: 'Lease notice period in days (default to 30 if not specified)' },
    penaltyClauses: { type: SchemaType.STRING, description: 'Summary of late fee/penalty stipulations' },
    keyTerms: { 
      type: SchemaType.ARRAY, 
      items: { type: SchemaType.STRING }, 
      description: 'List of critical rules or obligations extracted from the lease agreement' 
    },
    riskFlags: { 
      type: SchemaType.ARRAY, 
      items: { type: SchemaType.STRING }, 
      description: 'List of potential risk alerts identified (e.g. sub-letting penalties, termination rules)' 
    },
    renewalRecommendations: { type: SchemaType.STRING, description: 'Renewal pricing or action strategy recommendation' }
  },
  required: ['leaseNumber', 'rentAmount', 'securityDeposit', 'startDate', 'endDate', 'noticePeriodDays']
};

@Injectable()
export class LeaseIntelligenceService {
  constructor(private geminiProvider: GeminiProvider) {}

  /**
   * Extracts raw text from lease PDF and parses structured terms via Gemini
   */
  async parseLeasePdf(pdfBuffer: Buffer, apiKey?: string): Promise<any> {
    let extractedText = '';
    try {
      const parsedData = await pdfParse(pdfBuffer);
      extractedText = parsedData.text;
    } catch (err) {
      throw new BadRequestException('Failed to extract text from the lease PDF. Make sure it is not a scanned raster image without OCR.');
    }

    if (!extractedText || extractedText.trim().length < 50) {
      throw new BadRequestException('Extracted lease PDF text content is too short or empty.');
    }

    const systemInstruction = `
      You are an expert real estate SaaS legal counsel. You analyze residential property lease contracts, tenancy agreements, and rent statements.
      Extract critical specifications, financial matrices, key obligations, risk flags, and renewal recommendations from the lease contract.
      Extract strictly according to the requested JSON response schema. Format dates strictly as YYYY-MM-DD.
    `;

    const prompt = `
      Here is the raw text content extracted from the tenancy lease agreement PDF:
      === LEASE CONTRACT CONTENT START ===
      ${extractedText}
      === LEASE CONTRACT CONTENT END ===

      Analyze this lease text and return the structured JSON terms.
    `;

    return this.geminiProvider.generateJson(systemInstruction, prompt, LeaseExtractionSchema, apiKey);
  }
}
