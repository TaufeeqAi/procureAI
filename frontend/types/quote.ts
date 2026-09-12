import type { ISODate, ISODateTime, Money, RiskLevel } from "@/types/common";

export type QuoteValidationStatus = "VALID" | "NEEDS_REVIEW" | "INVALID";

export interface ExtractedQuoteField {
  field: string;
  label: string;
  value: string;
  /** 0–1. Extraction confidence from the Quote Intelligence agent. */
  confidence: number;
}

export interface QuoteFieldConflict {
  field: string;
  label: string;
  candidateValues: { value: string; sourceLocation: string }[];
}

export interface Quote {
  id: string;
  quoteReference: string;
  prId: string;
  supplierId: string;
  supplierName: string;
  sourceDocumentName: string;
  unitPrice: Money;
  quantity: number;
  freight: Money;
  taxRatePercent: number;
  leadTimeDays: number;
  paymentTermsDays: number;
  validityDays: number;
  extractedFields: ExtractedQuoteField[];
  conflicts: QuoteFieldConflict[];
  validationStatus: QuoteValidationStatus;
  receivedAt: ISODateTime;
}

/**
 * Landed cost is always computed server-side by the deterministic pricing
 * engine (quantity × unitPrice + freight, taxed) — the frontend renders
 * this value, it never recalculates it locally, so the UI can never drift
 * from the number a buyer will be held accountable for.
 */
export interface LandedCostBreakdown {
  subtotal: Money;
  freight: Money;
  taxAmount: Money;
  taxRatePercent: number;
  total: Money;
}

export interface QuoteComparisonRow {
  quote: Quote;
  landedCost: LandedCostBreakdown;
  qualityAcceptanceRate: number;
  onTimeDeliveryRate: number;
  riskLevel: RiskLevel;
  deterministicScore: number;
  scoreConfigVersion: string;
  riskScore: number;
}

export interface QuoteComparisonData {
  prId: string;
  rows: QuoteComparisonRow[];
  aiInterpretation?: string;
  generatedAt: ISODateTime;
}

export interface HistoricalPricePoint {
  date: ISODate;
  unitPrice: Money;
}