import type { ISODate, ISODateTime, Money, RiskLevel } from "@/types/common";

export type SupplierApprovalStatus = "APPROVED" | "PENDING_APPROVAL" | "SUSPENDED";

export interface SupplierScoreBreakdown {
  /** 0–100 composite score produced by the deterministic truth engine
   *  (see docs/architecture/decisions/supplier-score.md) — never an LLM
   *  output. The AI layer explains this score; it does not invent it. */
  overall: number;
  price: number;
  quality: number;
  delivery: number;
  commercial: number;
  configVersion: string;
}

export interface SupplierPerformanceMetrics {
  onTimeDeliveryRate: number; // 0–1
  qualityAcceptanceRate: number; // 0–1
  responseRate: number; // 0–1
  averageUnitPrice?: Money;
  totalPurchases: number;
  sampleSizeUnits?: number;
  sampleSizeTransactions: number;
  measuredAt: ISODateTime;
}

export type PerformanceTrend = "IMPROVING" | "STABLE" | "DECLINING";

export interface SupplierPerformanceTrends {
  price: PerformanceTrend;
  delivery: PerformanceTrend;
  quality: PerformanceTrend;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  approvalStatus: SupplierApprovalStatus;
  riskLevel: RiskLevel;
  categories: string[];
  performance?: SupplierPerformanceMetrics;
  scoreBreakdown?: SupplierScoreBreakdown;
}

export interface SupplierListItem extends Supplier {
  performance: SupplierPerformanceMetrics;
}

export interface SupplierPricePoint {
  date: ISODate;
  unitPrice: Money;
  poReference: string;
}

export interface SupplierTransaction {
  id: string;
  poReference: string;
  materialName: string;
  unitPrice: Money;
  deliveredOnTime: boolean;
  qualityAccepted: boolean;
  occurredAt: ISODate;
}

/** Data contract for GET /suppliers/[slug] (Supplier Detail). */
export interface SupplierDetailData {
  supplier: Supplier;
  performance: SupplierPerformanceMetrics;
  scoreBreakdown: SupplierScoreBreakdown;
  trends: SupplierPerformanceTrends;
  priceHistory: SupplierPricePoint[];
  recentTransactions: SupplierTransaction[];
}

/** A single ranked candidate on the Supplier Intelligence screen. Distinct
 *  from `Supplier` because it is scoped to one PR's shortlisting run. */
export interface SupplierShortlistCandidate {
  supplier: Supplier;
  rank: number;
  deterministicScore: number;
  quotedUnitPrice?: Money;
  historicalMedianPrice?: Money;
  reasons: string[];
}


/** A single ranked candidate on the Supplier Intelligence screen. Distinct
 *  from `Supplier` because it is scoped to one PR's shortlisting run. */
export interface SupplierShortlistCandidate {
  supplier: Supplier;
  rank: number;
  deterministicScore: number; // <-- CHANGED from aiScore
  quotedUnitPrice?: Money;
  historicalMedianPrice?: Money;
  reasons: string[];
}
