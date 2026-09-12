import type { ISODateTime } from "@/types/common";

export type RFQRecipientStatus =
  | "SENT"
  | "DELIVERED"
  | "OPENED"
  | "RESPONDED"
  | "PARTIAL"
  | "NO_RESPONSE"
  | "ESCALATED";

export interface RFQRecipient {
  supplierId: string;
  supplierName: string;
  status: RFQRecipientStatus;
  sentAt?: ISODateTime;
  respondedAt?: ISODateTime;
  remindersSent: number;
}

export interface RFQ {
  id: string;
  rfqNumber: string;
  prId: string;
  prNumber: string;
  materialName: string;
  dueDate: ISODateTime;
  recipients: RFQRecipient[];
  createdAt: ISODateTime;
}

export type MessageSender = "ELECON" | "SUPPLIER" | "AI_DRAFT";

export interface CommunicationMessage {
  id: string;
  sender: MessageSender;
  body: string;
  sentAt: ISODateTime;
  /** Present when sender === "AI_DRAFT" and the message has not yet been
   *  sent — an unsent AI draft must never render identically to a sent
   *  message. */
  requiresApproval?: boolean;
}

export type ExtractedFieldStatus = "MATCHED" | "CONFLICT" | "MISSING";

export interface ExtractedResponseField {
  field: "quantity" | "unitPrice" | "deliveryDate" | "paymentTerms" | "freightTerms";
  label: string;
  value: string;
  status: ExtractedFieldStatus;
}

export type ResponseCompleteness = "COMPLETE" | "PARTIAL" | "AWAITING";

export interface SupplierResponseThread {
  supplierId: string;
  supplierName: string;
  rfqId: string;
  messages: CommunicationMessage[];
  extractedFields: ExtractedResponseField[];
  completeness: ResponseCompleteness;
}
