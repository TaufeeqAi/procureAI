import type { Quote } from "@/types/quote";

/**
 * Three quotes for the hero PR (PR-2026-00983). Every number here is the
 * one that flows into the landed-cost figures shown across Quote
 * Comparison, the Decision screen, and the Purchase Order — computed via
 * lib/utils/pricing.ts, never re-typed at the display layer.
 */
export const heroQuotes: Quote[] = [
  {
    id: "quote-abc-9841",
    quoteReference: "ABC-9841",
    prId: "pr-00983",
    supplierId: "sup-abc",
    supplierName: "ABC Precision",
    sourceDocumentName: "quotation_abc_9841.pdf",
    unitPrice: { currency: "INR", amount: 1180 },
    quantity: 200,
    freight: { currency: "INR", amount: 3000 },
    taxRatePercent: 18,
    leadTimeDays: 19,
    paymentTermsDays: 45,
    validityDays: 30,
    extractedFields: [
      { field: "quantity", label: "Quantity", value: "200", confidence: 0.99 },
      { field: "unitPrice", label: "Unit price", value: "₹1,180", confidence: 0.99 },
      { field: "freight", label: "Freight", value: "₹3,000", confidence: 0.96 },
      { field: "deliveryDate", label: "Delivery", value: "23 Sep 2026", confidence: 0.93 },
      { field: "paymentTerms", label: "Payment", value: "45 days", confidence: 0.97 },
    ],
    conflicts: [],
    validationStatus: "VALID",
    receivedAt: "2026-09-04T09:32:00+05:30",
  },
  {
    id: "quote-xyz-7718",
    quoteReference: "XYZ-7718",
    prId: "pr-00983",
    supplierId: "sup-xyz",
    supplierName: "XYZ Industrial",
    sourceDocumentName: "quotation_xyz_7718.pdf",
    unitPrice: { currency: "INR", amount: 1150 },
    quantity: 200,
    freight: { currency: "INR", amount: 4500 },
    taxRatePercent: 18,
    leadTimeDays: 24,
    paymentTermsDays: 30,
    validityDays: 21,
    extractedFields: [
      { field: "quantity", label: "Quantity", value: "200", confidence: 0.98 },
      { field: "unitPrice", label: "Unit price", value: "₹1,150", confidence: 0.98 },
      { field: "freight", label: "Freight", value: "₹4,500", confidence: 0.9 },
      { field: "deliveryDate", label: "Delivery", value: "28 Sep 2026", confidence: 0.82 },
      { field: "paymentTerms", label: "Payment", value: "30 days", confidence: 0.95 },
    ],
    conflicts: [
      {
        field: "deliveryDate",
        label: "Delivery date",
        candidateValues: [
          { value: "28 Sep 2026", sourceLocation: "Page 1, line items" },
          { value: "30 Sep 2026", sourceLocation: "Page 2, delivery terms" },
        ],
      },
    ],
    validationStatus: "NEEDS_REVIEW",
    receivedAt: "2026-09-04T10:52:00+05:30",
  },
  {
    id: "quote-pqr-4811",
    quoteReference: "PQR-4811",
    prId: "pr-00983",
    supplierId: "sup-pqr",
    supplierName: "PQR Engineering",
    sourceDocumentName: "quotation_pqr_4811.pdf",
    unitPrice: { currency: "INR", amount: 1110 },
    quantity: 200,
    freight: { currency: "INR", amount: 2500 },
    taxRatePercent: 18,
    leadTimeDays: 31,
    paymentTermsDays: 30,
    validityDays: 15,
    extractedFields: [
      { field: "quantity", label: "Quantity", value: "200", confidence: 0.99 },
      { field: "unitPrice", label: "Unit price", value: "₹1,110", confidence: 0.99 },
      { field: "freight", label: "Freight", value: "₹2,500", confidence: 0.97 },
      { field: "deliveryDate", label: "Delivery", value: "05 Oct 2026", confidence: 0.95 },
      { field: "paymentTerms", label: "Payment", value: "30 days", confidence: 0.96 },
    ],
    conflicts: [],
    validationStatus: "VALID",
    receivedAt: "2026-09-03T16:10:00+05:30",
  },
];

export function getQuotesForPR(prId: string): Quote[] {
  return heroQuotes.filter((q) => q.prId === prId);
}

export function getQuote(quoteReference: string): Quote | undefined {
  return heroQuotes.find((q) => q.quoteReference === quoteReference);
}
