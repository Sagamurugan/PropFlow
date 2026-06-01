// ==============================================================================
// PropFlow AI - Shared Types Package
// ==============================================================================

export type UserRole = 'SUPER_ADMIN' | 'PROPERTY_OWNER' | 'PROPERTY_MANAGER' | 'TENANT';

export interface UserSessionDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId?: string | null;
}

export interface PropertyHealthScorePayload {
  score: number;
  safetyMetrics: {
    fireAlarms: string;
    exitsBlocked: boolean;
    moldReport: string;
  };
  financialHealth: {
    occupancyRate: number;
    unpaidRentPercentage: number;
    roiDifferentiator: number;
  };
  maintenanceForecast: {
    predictedRoofRepairYear: number;
    minorAiringDuctFilterReplaceDue: string;
  };
}

export interface AILeaseAnalysisResult {
  leaseId: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  depositAmount: number;
  parties: {
    landlord: string;
    tenant: string;
  };
  terms: {
    lateFeePolicy: string;
    petPolicy: string;
    terminationNoticeDays: number;
  };
  detectedAnomalies: string[];
}
