import type { RFQ } from "@/types/rfq";

export const rfqs: RFQ[] = [
  {
    id: "rfq-00481",
    rfqNumber: "RFQ-2026-00481",
    prId: "pr-00983",
    prNumber: "PR-2026-00983",
    materialName: "Bearing Housing",
    dueDate: "2026-09-12T18:00:00+05:30",
    recipients: [
      { supplierId: "sup-abc", supplierName: "ABC Precision", status: "RESPONDED", sentAt: "2026-09-01T09:32:00+05:30", respondedAt: "2026-09-04T09:32:00+05:30", remindersSent: 0 },
      { supplierId: "sup-xyz", supplierName: "XYZ Industrial", status: "RESPONDED", sentAt: "2026-09-01T09:32:00+05:30", respondedAt: "2026-09-04T10:52:00+05:30", remindersSent: 1 },
      { supplierId: "sup-pqr", supplierName: "PQR Engineering", status: "RESPONDED", sentAt: "2026-09-01T09:32:00+05:30", respondedAt: "2026-09-03T16:10:00+05:30", remindersSent: 0 },
    ],
    createdAt: "2026-09-01T09:30:00+05:30",
  },
  {
    id: "rfq-00477",
    rfqNumber: "RFQ-2026-00477",
    prId: "pr-00976",
    prNumber: "PR-2026-00976",
    materialName: "Gear Assembly",
    dueDate: "2026-09-10T18:00:00+05:30",
    recipients: [
      { supplierId: "sup-continental", supplierName: "Continental Gears", status: "RESPONDED", sentAt: "2026-08-30T09:00:00+05:30", respondedAt: "2026-09-03T11:00:00+05:30", remindersSent: 0 },
      { supplierId: "sup-vikram", supplierName: "Vikram Forge", status: "RESPONDED", sentAt: "2026-08-30T09:00:00+05:30", respondedAt: "2026-09-03T14:20:00+05:30", remindersSent: 0 },
      { supplierId: "sup-xyz", supplierName: "XYZ Industrial", status: "RESPONDED", sentAt: "2026-08-30T09:00:00+05:30", respondedAt: "2026-09-04T09:00:00+05:30", remindersSent: 1 },
      { supplierId: "sup-precision-tool", supplierName: "Precision Tool Works", status: "RESPONDED", sentAt: "2026-08-30T09:00:00+05:30", respondedAt: "2026-09-02T10:00:00+05:30", remindersSent: 0 },
    ],
    createdAt: "2026-08-30T08:55:00+05:30",
  },
  {
    id: "rfq-00472",
    rfqNumber: "RFQ-2026-00472",
    prId: "pr-00968",
    prNumber: "PR-2026-00968",
    materialName: "Shaft Assembly",
    dueDate: "2026-09-06T18:00:00+05:30",
    recipients: [
      { supplierId: "sup-vikram", supplierName: "Vikram Forge", status: "RESPONDED", sentAt: "2026-09-02T09:00:00+05:30", respondedAt: "2026-09-04T08:00:00+05:30", remindersSent: 0 },
      { supplierId: "sup-bharat", supplierName: "Bharat Bearings", status: "NO_RESPONSE", sentAt: "2026-09-02T09:00:00+05:30", remindersSent: 1 },
      { supplierId: "sup-lmn", supplierName: "LMN Components", status: "NO_RESPONSE", sentAt: "2026-09-02T09:00:00+05:30", remindersSent: 1 },
    ],
    createdAt: "2026-09-02T08:58:00+05:30",
  },
];

export function getRFQsForPR(prId: string): RFQ[] {
  return rfqs.filter((r) => r.prId === prId);
}

export function getRFQ(rfqNumber: string): RFQ | undefined {
  return rfqs.find((r) => r.rfqNumber === rfqNumber);
}
