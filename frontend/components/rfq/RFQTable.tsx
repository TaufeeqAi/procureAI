import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils/format";
import { routes } from "@/lib/constants/routes";
import type { RFQ, RFQRecipientStatus } from "@/types/rfq";

const STATUS_TONE: Record<RFQRecipientStatus, "success" | "warning" | "danger" | "neutral" | "info"> = {
  SENT: "neutral",
  DELIVERED: "neutral",
  OPENED: "info",
  RESPONDED: "success",
  PARTIAL: "warning",
  NO_RESPONSE: "danger",
  ESCALATED: "danger",
};

export function RFQStatusBadge({ status }: { status: RFQRecipientStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{status.replace("_", " ").toLowerCase()}</Badge>;
}

export function RFQTable({ rfqs }: { rfqs: RFQ[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-tertiary">
          <th className="py-2.5 font-semibold">RFQ</th>
          <th className="py-2.5 font-semibold">PR</th>
          <th className="py-2.5 font-semibold">Material</th>
          <th className="py-2.5 text-right font-semibold">Responses</th>
          <th className="py-2.5 font-semibold">Due</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {rfqs.map((rfq) => {
          const responded = rfq.recipients.filter((r) => r.status === "RESPONDED").length;
          return (
            <tr key={rfq.id} className="hover:bg-surface-raised">
              <td className="py-3">
                <Link href={routes.rfq(rfq.rfqNumber)} className="entity-code font-medium text-ink-primary hover:text-brand">
                  {rfq.rfqNumber}
                </Link>
              </td>
              <td className="py-3">
                <Link href={routes.requisition(rfq.prNumber)} className="entity-code text-ink-secondary hover:text-brand">
                  {rfq.prNumber}
                </Link>
              </td>
              <td className="py-3 text-ink-primary">{rfq.materialName}</td>
              <td className="py-3 text-right tabular-nums text-ink-secondary">
                {responded} / {rfq.recipients.length}
              </td>
              <td className="py-3 text-ink-tertiary">{formatDateTime(rfq.dueDate)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
