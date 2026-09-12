import type { Delivery } from "@/types/delivery";

export const deliveries: Delivery[] = [
  {
    id: "del-001288",
    poId: "po-001288",
    poNumber: "PO-2026-001288",
    supplierId: "sup-abc",
    supplierName: "ABC Precision",
    materialName: "Bearing Housing",
    expectedDate: "2026-09-14",
    quantityOrdered: 200,
    quantityReceived: 0,
    status: "EXPECTED",
    riskLevel: "LOW",
    timeline: [
      { key: "PO_APPROVED", label: "PO approved", completed: true },
      { key: "PO_SENT", label: "PO sent", completed: true },
      { key: "ACKNOWLEDGED", label: "Acknowledged", completed: true },
      { key: "DISPATCHED", label: "Dispatched", completed: false },
      { key: "DELIVERED", label: "Delivered", completed: false },
    ],
    exceptions: [],
    lastSupplierCommunicationAt: "2026-09-04T11:18:00+05:30",
  },
  {
    id: "del-001274",
    poId: "po-001274",
    poNumber: "PO-2026-001274",
    supplierId: "sup-xyz",
    supplierName: "XYZ Industrial",
    materialName: "Gear Assembly",
    expectedDate: "2026-09-01",
    quantityOrdered: 100,
    quantityReceived: 0,
    status: "AT_RISK",
    riskLevel: "HIGH",
    timeline: [
      { key: "PO_APPROVED", label: "PO approved", completed: true },
      { key: "PO_SENT", label: "PO sent", completed: true },
      { key: "ACKNOWLEDGED", label: "Acknowledged", completed: true },
      { key: "DISPATCHED", label: "Dispatched", completed: false },
      { key: "DELIVERED", label: "Delivered", completed: false },
    ],
    exceptions: [
      {
        id: "exc-001274-1",
        severity: "HIGH",
        message: "Dispatch confirmation is overdue with three days of cover remaining.",
        detectedAt: "2026-09-04T08:00:00+05:30",
        suggestedActionLabel: "Request dispatch update",
      },
    ],
    lastSupplierCommunicationAt: "2026-08-29T10:00:00+05:30",
  },
  {
    id: "del-001261",
    poId: "po-001261",
    poNumber: "PO-2026-001261",
    supplierId: "sup-pqr",
    supplierName: "PQR Engineering",
    materialName: "Shaft Assembly",
    expectedDate: "2026-09-18",
    quantityOrdered: 80,
    quantityReceived: 50,
    status: "PARTIAL",
    riskLevel: "MEDIUM",
    timeline: [
      { key: "PO_APPROVED", label: "PO approved", completed: true },
      { key: "PO_SENT", label: "PO sent", completed: true },
      { key: "ACKNOWLEDGED", label: "Acknowledged", completed: true },
      { key: "DISPATCHED", label: "Dispatched", completed: true },
      { key: "DELIVERED", label: "Delivered", completed: false },
    ],
    exceptions: [],
    lastSupplierCommunicationAt: "2026-09-02T14:00:00+05:30",
  },
];

export function getDelivery(poNumber: string): Delivery | undefined {
  return deliveries.find((d) => d.poNumber === poNumber);
}
