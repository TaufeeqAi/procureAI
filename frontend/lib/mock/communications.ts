import type { SupplierResponseThread } from "@/types/rfq";

/**
 * Message threads backing the Communication tab / Supplier Inbox for the
 * hero PR. XYZ's thread deliberately carries a conflict (two delivery
 * dates in one document) so the extraction-conflict empty/warning state
 * has something real to render against.
 */
export const heroThreads: SupplierResponseThread[] = [
  {
    supplierId: "sup-abc",
    supplierName: "ABC Precision",
    rfqId: "rfq-00481",
    messages: [
      {
        id: "msg-abc-1",
        sender: "ELECON",
        body: "Please confirm availability of 200 units of BH-2045 by 25 September 2026.",
        sentAt: "2026-09-01T09:32:00+05:30",
      },
      {
        id: "msg-abc-2",
        sender: "SUPPLIER",
        body: "We can supply 200 pcs at ₹1,180. Delivery 23 Sept. Payment 45 days. Quotation attached.",
        sentAt: "2026-09-04T09:32:00+05:30",
      },
    ],
    extractedFields: [
      { field: "quantity", label: "Quantity", value: "200", status: "MATCHED" },
      { field: "unitPrice", label: "Unit price", value: "₹1,180", status: "MATCHED" },
      { field: "deliveryDate", label: "Delivery", value: "23 Sep 2026", status: "MATCHED" },
      { field: "paymentTerms", label: "Payment terms", value: "45 days", status: "MATCHED" },
    ],
    completeness: "COMPLETE",
  },
  {
    supplierId: "sup-xyz",
    supplierName: "XYZ Industrial",
    rfqId: "rfq-00481",
    messages: [
      {
        id: "msg-xyz-1",
        sender: "ELECON",
        body: "Please confirm availability of 200 units of BH-2045 by 25 September 2026.",
        sentAt: "2026-09-01T09:32:00+05:30",
      },
      {
        id: "msg-xyz-2",
        sender: "ELECON",
        body: "Following up — could you share your quotation for BH-2045 this week?",
        sentAt: "2026-09-03T09:00:00+05:30",
      },
      {
        id: "msg-xyz-3",
        sender: "SUPPLIER",
        body: "Apologies for the delay. 200 units at ₹1,150/unit, freight ₹4,500. Quotation attached — please note our line-item delivery date differs slightly from the terms page; we'll confirm by phone.",
        sentAt: "2026-09-04T10:52:00+05:30",
      },
    ],
    extractedFields: [
      { field: "quantity", label: "Quantity", value: "200", status: "MATCHED" },
      { field: "unitPrice", label: "Unit price", value: "₹1,150", status: "MATCHED" },
      { field: "deliveryDate", label: "Delivery", value: "28 Sep 2026 or 30 Sep 2026", status: "CONFLICT" },
      { field: "paymentTerms", label: "Payment terms", value: "30 days", status: "MATCHED" },
    ],
    completeness: "PARTIAL",
  },
  {
    supplierId: "sup-pqr",
    supplierName: "PQR Engineering",
    rfqId: "rfq-00481",
    messages: [
      {
        id: "msg-pqr-1",
        sender: "ELECON",
        body: "Please confirm availability of 200 units of BH-2045 by 25 September 2026.",
        sentAt: "2026-09-01T09:32:00+05:30",
      },
      {
        id: "msg-pqr-2",
        sender: "SUPPLIER",
        body: "200 units available at ₹1,110/unit. Lead time 31 days from PO. Freight ₹2,500, 30-day payment terms.",
        sentAt: "2026-09-03T16:10:00+05:30",
      },
    ],
    extractedFields: [
      { field: "quantity", label: "Quantity", value: "200", status: "MATCHED" },
      { field: "unitPrice", label: "Unit price", value: "₹1,110", status: "MATCHED" },
      { field: "deliveryDate", label: "Delivery", value: "05 Oct 2026", status: "MATCHED" },
      { field: "paymentTerms", label: "Payment terms", value: "30 days", status: "MATCHED" },
    ],
    completeness: "COMPLETE",
  },
];

export function getThreadsForRFQ(rfqId: string): SupplierResponseThread[] {
  return heroThreads.filter((t) => t.rfqId === rfqId);
}
