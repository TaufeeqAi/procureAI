import type { ProcurementDashboardData, ProcurementTask, ActivityEvent, AIStandingBrief } from "@/types/procurement";
import type { NavCounts } from "@/types/procurement";

/**
 * Every number and line of copy here is quoted directly from the reference
 * screenshot (04 Sep 2026 Command Center) — this is the one dataset in the
 * mock layer that was authored top-down from a visual spec rather than
 * from the type contract outward.
 */

export const decisionQueue: ProcurementTask[] = [
  {
    id: "task-00983",
    prId: "pr-00983",
    prNumber: "PR-2026-00983",
    materialName: "Bearing Housing",
    priority: "HIGH",
    headline: "Current quote 12.4% above historical benchmark on two of three lines",
    detail: "AI recommendation ready · confidence 93%",
    actionLabel: "Review",
    actionHref: "/requisitions/PR-2026-00983/decision",
  },
  {
    id: "task-00976",
    prId: "pr-00976",
    prNumber: "PR-2026-00976",
    materialName: "Gear Assembly",
    priority: "MEDIUM",
    headline: "Supplier response indicates delivery risk",
    detail: "AI monitoring supplier responses",
    actionLabel: "Review",
    actionHref: "/requisitions/PR-2026-00976",
  },
  {
    id: "task-00971",
    prId: "pr-00971",
    prNumber: "PR-2026-00971",
    materialName: "Bearing Set",
    priority: "READY",
    headline: "ABC Precision ranked #1 — recommendation ready",
    detail: "AI recommendation ready · confidence 90%",
    actionLabel: "Decide",
    actionHref: "/requisitions/PR-2026-00971/decision",
  },
  {
    id: "task-00968",
    prId: "pr-00968",
    prNumber: "PR-2026-00968",
    materialName: "Shaft Assembly",
    priority: "MEDIUM",
    headline: "1 of 3 suppliers responded — reminder recommended",
    detail: "AI monitoring supplier responses",
    actionLabel: "Review",
    actionHref: "/requisitions/PR-2026-00968/sourcing",
  },
];

export const recentActivity: ActivityEvent[] = [
  { id: "act-1", message: "Supplier response received — ABC Precision", occurredAt: "2026-09-04T10:52:00+05:30", entityHref: "/requisitions/PR-2026-00983/communication" },
  { id: "act-2", message: "AI recommendation generated — PR-2026-00983", occurredAt: "2026-09-04T10:21:00+05:30", entityHref: "/requisitions/PR-2026-00983/decision" },
  { id: "act-3", message: "RFQ reminder sent — PR-2026-00968", occurredAt: "2026-09-04T09:58:00+05:30", entityHref: "/requisitions/PR-2026-00968/sourcing" },
  { id: "act-4", message: "PO-2026-001288 sent to ABC Precision", occurredAt: "2026-09-04T09:52:00+05:30", entityHref: "/purchase-orders/PO-2026-001288" },
];

export const standingBrief: AIStandingBrief = {
  paragraphs: [
    "Three quotations for PR-2026-00983 are extracted and normalised. ABC Precision ranks #1 at 94.2 with 93% confidence, priced 2.1% below its own historical median.",
    "One delivery exception is open on PO-2026-001274 — dispatch confirmation is overdue with three days of cover remaining.",
  ],
  statusPills: [
    { label: "Status: 2 ready", tone: "ai" },
    { label: "1 delivery exception", tone: "danger" },
  ],
  generatedAt: "2026-09-04T10:55:00+05:30",
};

export const dashboardData: ProcurementDashboardData = {
  summary: {
    openPRs: 42,
    recommendationsReady: 9,
    pendingApprovals: 6,
    exceptions: 4,
  },
  decisionQueue,
  aiOpportunities: {
    estimatedSavings: { currency: "INR", amount: 1840000 },
    negotiationCount: 7,
    priceAnomalies: 3,
    deliveryRisks: 4,
    qualityRisks: 2,
  },
  recentActivity,
  standingBrief,
};

export const navCounts: NavCounts = {
  prQueue: 42,
  awaitingSupplier: 12,
  awaitingDecision: 9,
  exceptions: 4,
  supplierInbox: 3,
};

export const procurementPipeline = [
  { label: "PRs", value: 42, max: 42 },
  { label: "RFQs", value: 31, max: 42 },
  { label: "Responses", value: 24, max: 42 },
  { label: "Decisions", value: 9, max: 42 },
  { label: "POs", value: 6, max: 42 },
];
