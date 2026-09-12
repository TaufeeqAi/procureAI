import type { ISODate, ISODateTime, Money, RiskLevel } from "@/types/common";

export interface PriceBenchmark {
  materialName: string;
  benchmark?: Money;
  sampleSize: number;
  minPrice?: Money;
  maxPrice?: Money;
  asOf: ISODateTime;
}

export interface DeterministicRiskFinding {
  code: string;
  severity: RiskLevel;
  message: string;
}

export interface DeterministicRiskAssessment {
  level: RiskLevel;
  score: number;
  expectedDeliveryDate: ISODate;
  deliverySlackDays: number;
  findings: DeterministicRiskFinding[];
}

export interface DeterministicSupplierAssessment {
  supplierId: string;
  supplierName: string;
  quoteReference?: string;
  priceScore: number;
  qualityScore: number;
  deliveryScore: number;
  commercialScore: number;
  riskScore: number;
  overallScore: number;
  scoreConfigVersion: string;
  riskLevel: RiskLevel;
  priceVariancePercent?: number;
  historicalSampleSize: number;
  riskAssessment?: DeterministicRiskAssessment;
}

export interface DeterministicRecommendation {
  supplierId: string;
  supplierName: string;
  overallScore: number;
  confidence: number;
  confidenceBand: "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT_DATA";
  recommendationState: "READY" | "REVIEW_REQUIRED" | "INSUFFICIENT_DATA";
  rationale: string[];
  alternatives: string[];
  scoreConfigVersion: string;
}

export interface ProcurementTruth {
  prId: string;
  prNumber: string;
  materialName: string;
  quantity: number;
  requiredDate: ISODate;
  benchmark: PriceBenchmark;
  suppliers: DeterministicSupplierAssessment[];
  recommendation?: DeterministicRecommendation;
  generatedAt: ISODateTime;
}

export interface WhatIfWeights {
  price: number;
  quality: number;
  delivery: number;
  commercial: number;
  risk: number;
}

export interface WhatIfScenarioInput {
  requiredDate: ISODate;
  quantity: number;
  weights: WhatIfWeights;
}

export interface WhatIfSupplierResult {
  supplierId: string;
  supplierName: string;
  baselineScore: number;
  scenarioScore: number;
  baselineLandedCost: Money;
  scenarioLandedCost: Money;
  feasible: boolean;
  warning?: string;
}

export interface WhatIfResponse {
  prId: string;
  scenario: WhatIfScenarioInput;
  results: WhatIfSupplierResult[];
  generatedAt: ISODateTime;
}