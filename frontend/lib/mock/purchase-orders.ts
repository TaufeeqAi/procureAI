import type { PurchaseOrder, POListItem } from "@/types/order";
import { computeLandedCost } from "@/lib/utils/pricing";

const abcCost = computeLandedCost(200, 1170, 2800, 18); // prior ABC cycle, not the hero PR
const xyzCost = computeLandedCost(100, 1140, 3600, 18);
const pqrCost = computeLandedCost(80, 2140, 2100, 18);

export const purchaseOrders: PurchaseOrder[] = [
  {
    id: "po-001288",
    poNumber: "PO-2026-001288",
    prId: "pr-00954",
    prNumber: "PR-2026-00954",
    supplierId: "sup-abc",
    supplierName: "ABC Precision",
    status: "ACKNOWLEDGED",
    lineItems: [
      { materialName: "Bearing Housing", quantity: 200, unitPrice: { currency: "INR", amount: 1170 }, lineValue: { currency: "INR", amount: 234000 }, expectedDelivery: "2026-09-14" },
    ],
    costBreakdown: abcCost,
    paymentTermsDays: 45,
    validationChecks: [
      { label: "Matches approved supplier", passed: true },
      { label: "Matches approved quantity", passed: true },
      { label: "Price matches approved quote", passed: true },
      { label: "Delivery matches approved commitment", passed: true },
    ],
    createdAt: "2026-09-04T09:50:00+05:30",
    sentAt: "2026-09-04T09:52:00+05:30",
    acknowledgedAt: "2026-09-04T11:18:00+05:30",
  },
  {
    id: "po-001274",
    poNumber: "PO-2026-001274",
    prId: "pr-00942",
    prNumber: "PR-2026-00942",
    supplierId: "sup-xyz",
    supplierName: "XYZ Industrial",
    status: "ACKNOWLEDGED",
    lineItems: [
      { materialName: "Gear Assembly", quantity: 100, unitPrice: { currency: "INR", amount: 1140 }, lineValue: { currency: "INR", amount: 114000 }, expectedDelivery: "2026-09-01" },
    ],
    costBreakdown: xyzCost,
    paymentTermsDays: 30,
    validationChecks: [
      { label: "Matches approved supplier", passed: true },
      { label: "Matches approved quantity", passed: true },
      { label: "Price matches approved quote", passed: true },
      { label: "Delivery matches approved commitment", passed: false },
    ],
    createdAt: "2026-08-20T10:00:00+05:30",
    sentAt: "2026-08-20T10:05:00+05:30",
    acknowledgedAt: "2026-08-21T09:00:00+05:30",
  },
  {
    id: "po-001261",
    poNumber: "PO-2026-001261",
    prId: "pr-00931",
    prNumber: "PR-2026-00931",
    supplierId: "sup-pqr",
    supplierName: "PQR Engineering",
    status: "DISPATCHED",
    lineItems: [
      { materialName: "Shaft Assembly", quantity: 80, unitPrice: { currency: "INR", amount: 2140 }, lineValue: { currency: "INR", amount: 171200 }, expectedDelivery: "2026-09-18" },
    ],
    costBreakdown: pqrCost,
    paymentTermsDays: 30,
    validationChecks: [
      { label: "Matches approved supplier", passed: true },
      { label: "Matches approved quantity", passed: true },
      { label: "Price matches approved quote", passed: true },
      { label: "Delivery matches approved commitment", passed: true },
    ],
    createdAt: "2026-08-25T09:00:00+05:30",
    sentAt: "2026-08-25T09:10:00+05:30",
    acknowledgedAt: "2026-08-26T09:00:00+05:30",
  },
];

export const poListItems: POListItem[] = purchaseOrders.map((po) => ({
  id: po.id,
  poNumber: po.poNumber,
  supplierName: po.supplierName,
  value: po.costBreakdown.total,
  expectedDelivery: po.lineItems[0]?.expectedDelivery ?? "",
  status: po.status,
}));

export function getPurchaseOrder(poNumber: string): PurchaseOrder | undefined {
  return purchaseOrders.find((po) => po.poNumber === poNumber);
}
