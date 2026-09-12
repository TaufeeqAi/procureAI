import type { ProcurementRecommendation, WhatIfResult, NegotiationDraft } from "@/types/ai";

/**
 * The hero recommendation. Every figure here is sourced to an
 * EvidenceReference — no field exists that the Evidence Drawer can't
 * trace back to something concrete. See docs/architecture/decisions/
 * supplier-score.md: `overallScore` and `dimensions` are the deterministic
 * truth-engine output; `reasons` and `tradeOff` are the AI's explanation
 * of that output, never a replacement for it.
 */
export const heroRecommendation: ProcurementRecommendation = {
  id: "rec-pr-00983",
  prId: "pr-00983",
  supplierId: "sup-abc",
  supplierName: "ABC Precision",
  confidence: 0.93,
  confidenceBand: "HIGH",
  recommendationState: "READY",
  overallScore: 94.2,
  dimensions: {
    price: { value: 0.91, label: "Price", detail: "2.1% below historical median" },
    quality: { value: 0.984, label: "Quality", detail: "98.4% historical acceptance" },
    delivery: { value: 0.96, label: "Delivery", detail: "96% on-time delivery" },
    commercialTerms: { value: 0.88, label: "Commercial terms", detail: "45-day payment terms" },
    risk: { value: 0.9, label: "Risk", detail: "LOW overall risk" },
  },
  reasons: [
    "Approved supplier with 12 previous comparable transactions",
    "98.4% historical quality acceptance across 246 units",
    "96% historical on-time delivery",
    "Quote priced 2.1% below the historical median for this material",
    "Required quantity and delivery date both confirmed in the supplier's response",
  ],
  tradeOff:
    "XYZ Industrial is ₹30 cheaper per unit, but ABC Precision has substantially stronger historical delivery reliability (96% vs. 87% on-time).",
  risks: [
    {
      severity: "LOW",
      message: "ABC's proposed delivery (19 days) is close to its historical average lead time — not a deviation, but worth noting.",
    },
  ],
  evidence: [
    { id: "ev-1", type: "PURCHASE_ORDER", label: "PO-2026-00192", asOf: "2026-03-14T00:00:00+05:30" },
    { id: "ev-2", type: "PURCHASE_ORDER", label: "PO-2026-00271", asOf: "2026-05-02T00:00:00+05:30" },
    { id: "ev-3", type: "PURCHASE_ORDER", label: "PO-2026-00318", asOf: "2026-06-20T00:00:00+05:30" },
    { id: "ev-4", type: "QUOTE", label: "ABC-9841", href: "/quotes/ABC-9841", asOf: "2026-09-04T09:32:00+05:30" },
  ],
  policyChecks: [
    { label: "Supplier is approved", passed: true },
    { label: "Quantity matches requisition", passed: true },
    { label: "Delivery date satisfies required date", passed: true },
    { label: "PR value within buyer approval limit", passed: true, detail: "₹2.82L is below the ₹5L buyer threshold" },
  ],
  alternatives: [
    { supplierId: "sup-xyz", supplierName: "XYZ Industrial", overallScore: 89.7, noteworthyDifference: "₹30/unit cheaper, weaker delivery history" },
    { supplierId: "sup-pqr", supplierName: "PQR Engineering", overallScore: 78.1, noteworthyDifference: "Lowest price, materially higher risk" },
  ],
  generatedAt: "2026-09-04T10:21:05+05:30",
};

export const heroWhatIfBaseline: WhatIfResult = {
  prId: "pr-00983",
  scenario: {
    requiredDate: "2026-09-25",
    quantity: 200,
    weights: { price: 0.3, quality: 0.25, delivery: 0.25, commercial: 0.1, risk: 0.1 },
  },
  results: [
    { supplierId: "sup-abc", supplierName: "ABC Precision", baselineScore: 94.2, scenarioScore: 94.2, feasible: true },
    { supplierId: "sup-xyz", supplierName: "XYZ Industrial", baselineScore: 89.7, scenarioScore: 89.7, feasible: true },
    { supplierId: "sup-pqr", supplierName: "PQR Engineering", baselineScore: 78.1, scenarioScore: 78.1, feasible: true },
  ],
};

export const heroWhatIfEarlierDelivery: WhatIfResult = {
  prId: "pr-00983",
  scenario: {
    requiredDate: "2026-09-15",
    quantity: 200,
    weights: { price: 0.3, quality: 0.25, delivery: 0.25, commercial: 0.1, risk: 0.1 },
  },
  results: [
    { supplierId: "sup-abc", supplierName: "ABC Precision", baselineScore: 94.2, scenarioScore: 81.4, feasible: true, warning: "Delivery risk increases materially" },
    { supplierId: "sup-xyz", supplierName: "XYZ Industrial", baselineScore: 89.7, scenarioScore: 73.8, feasible: false, warning: "Cannot meet revised delivery date" },
    { supplierId: "sup-pqr", supplierName: "PQR Engineering", baselineScore: 78.1, scenarioScore: 69.2, feasible: false, warning: "Cannot meet revised delivery date" },
  ],
  aiInterpretation:
    "A 15 September requirement significantly increases delivery risk across all shortlisted suppliers. ABC remains the strongest feasible candidate, but requires confirmation.",
};

export const heroNegotiationDraft: NegotiationDraft = {
  id: "neg-pr-00983-abc",
  prId: "pr-00983",
  supplierId: "sup-abc",
  targetRange: {
    low: { currency: "INR", amount: 1130 },
    high: { currency: "INR", amount: 1150 },
    benchmark: { currency: "INR", amount: 1120 },
    variancePercent: 5.4,
  },
  draftMessage:
    "Dear ABC Precision,\n\nThank you for your quotation. Considering the requested quantity of 200 units and our previous procurement history, please review whether you can offer a revised price of ₹1,140 per unit while maintaining the proposed delivery date.\n\nRegards,\nElecon Procurement",
  status: "DRAFT",
  generatedAt: "2026-09-04T10:25:00+05:30",
};
