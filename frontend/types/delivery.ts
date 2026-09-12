import type { ISODate, ISODateTime, RiskLevel } from "@/types/common";

export type DeliveryStatus = "EXPECTED" | "AT_RISK" | "DISPATCHED" | "PARTIAL" | "RECEIVED";

export interface DeliveryTimelineStep {
  key: "PO_APPROVED" | "PO_SENT" | "ACKNOWLEDGED" | "DISPATCHED" | "DELIVERED";
  label: string;
  completed: boolean;
}

export interface DeliveryException {
  id: string;
  severity: RiskLevel;
  message: string;
  detectedAt: ISODateTime;
  suggestedActionLabel?: string;
}

export interface Delivery {
  id: string;
  poId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  materialName: string;
  expectedDate: ISODate;
  quantityOrdered: number;
  quantityReceived: number;
  status: DeliveryStatus;
  riskLevel: RiskLevel;
  timeline: DeliveryTimelineStep[];
  exceptions: DeliveryException[];
  lastSupplierCommunicationAt?: ISODateTime;
}

export interface GoodsReceiptRecord {
  id: string;
  deliveryId: string;
  quantityReceived: number;
  qualityAccepted: boolean;
  receivedAt: ISODateTime;
  recordedBy: string;
}
