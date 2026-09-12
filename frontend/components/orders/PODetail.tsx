import { CheckCircle2, XCircle } from "lucide-react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatDate, formatMoney } from "@/lib/utils/format";
import { Badge } from "@/components/ui/Badge";
import type { PurchaseOrder, POStatus } from "@/types/order";

const PO_STEPS: { key: POStatus; label: string }[] = [
  { key: "DRAFT", label: "Created" },
  { key: "SENT", label: "Sent" },
  { key: "ACKNOWLEDGED", label: "Acknowledged" },
  { key: "DISPATCHED", label: "Dispatched" },
  { key: "RECEIVED", label: "Delivered" },
];

const STATUS_TONE: Record<POStatus, "success" | "warning" | "info" | "neutral"> = {
  DRAFT: "neutral",
  PENDING_APPROVAL: "warning",
  APPROVED: "info",
  SENT: "info",
  ACKNOWLEDGED: "success",
  DISPATCHED: "success",
  PARTIALLY_RECEIVED: "warning",
  RECEIVED: "success",
  CLOSED: "neutral",
};

export function POStatusBadge({ status }: { status: POStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{status.replace(/_/g, " ").toLowerCase()}</Badge>;
}

export function PODetail({ po }: { po: PurchaseOrder }) {
  const currentIndex = PO_STEPS.findIndex((s) => s.key === po.status) === -1
    ? po.status === "DISPATCHED" ? 3 : po.status === "PARTIALLY_RECEIVED" ? 3 : 1
    : PO_STEPS.findIndex((s) => s.key === po.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
        {PO_STEPS.map((step, index) => (
          <div key={step.key} className="flex items-center gap-2">
            <div className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
              index <= currentIndex ? "bg-success text-ink-inverse" : "bg-surface-raised text-ink-tertiary",
            )}>
              {index <= currentIndex ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </div>
            <span className={cn("text-xs", index <= currentIndex ? "text-ink-primary" : "text-ink-tertiary")}>{step.label}</span>
            {index < PO_STEPS.length - 1 && <span className="h-px w-6 bg-border-strong" />}
          </div>
        ))}
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-tertiary">
            <th className="py-2 font-semibold">Item</th>
            <th className="py-2 text-right font-semibold">Qty</th>
            <th className="py-2 text-right font-semibold">Unit price</th>
            <th className="py-2 text-right font-semibold">Value</th>
            <th className="py-2 text-right font-semibold">Delivery</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {po.lineItems.map((item, i) => (
            <tr key={i}>
              <td className="py-2.5 text-ink-primary">{item.materialName}</td>
              <td className="py-2.5 text-right tabular-nums text-ink-secondary">{item.quantity}</td>
              <td className="py-2.5 text-right tabular-nums text-ink-secondary">{formatMoney(item.unitPrice)}</td>
              <td className="py-2.5 text-right tabular-nums text-ink-primary">{formatMoney(item.lineValue)}</td>
              <td className="py-2.5 text-right text-ink-secondary">{formatDate(item.expectedDelivery)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto max-w-xs space-y-1.5 text-sm">
        <div className="flex justify-between text-ink-secondary">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatMoney(po.costBreakdown.subtotal)}</span>
        </div>
        <div className="flex justify-between text-ink-secondary">
          <span>Freight</span>
          <span className="tabular-nums">{formatMoney(po.costBreakdown.freight)}</span>
        </div>
        <div className="flex justify-between text-ink-secondary">
          <span>Tax ({po.costBreakdown.taxRatePercent}%)</span>
          <span className="tabular-nums">{formatMoney(po.costBreakdown.taxAmount)}</span>
        </div>
        <div className="flex justify-between border-t border-border-strong pt-1.5 font-semibold text-ink-primary">
          <span>Total</span>
          <span className="tabular-nums">{formatMoney(po.costBreakdown.total)}</span>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ai">AI validation</p>
        <ul className="space-y-1.5">
          {po.validationChecks.map((check) => (
            <li key={check.label} className="flex items-center gap-2 text-sm">
              {check.passed ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <XCircle className="h-3.5 w-3.5 text-danger" />}
              <span className="text-ink-primary">{check.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
