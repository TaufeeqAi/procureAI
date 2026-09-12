import type { ISODate, ISODateTime, Money } from "@/types/common";
import type { LandedCostBreakdown } from "@/types/quote";

export type POStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "SENT"
  | "ACKNOWLEDGED"
  | "DISPATCHED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CLOSED";

export interface POLineItem {
  materialName: string;
  quantity: number;
  unitPrice: Money;
  lineValue: Money;
  expectedDelivery: ISODate;
}

export interface POValidationCheck {
  label: string;
  passed: boolean;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  prId: string;
  prNumber: string;
  supplierId: string;
  supplierName: string;
  status: POStatus;
  lineItems: POLineItem[];
  costBreakdown: LandedCostBreakdown;
  paymentTermsDays: number;
  validationChecks: POValidationCheck[];
  createdAt: ISODateTime;
  sentAt?: ISODateTime;
  acknowledgedAt?: ISODateTime;
}

export interface POListItem {
  id: string;
  poNumber: string;
  supplierName: string;
  value: Money;
  expectedDelivery: ISODate;
  status: POStatus;
}
