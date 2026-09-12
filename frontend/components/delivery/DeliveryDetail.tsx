import { AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils/format";
import type { Delivery, DeliveryStatus } from "@/types/delivery";

const STATUS_TONE: Record<DeliveryStatus, "success" | "warning" | "danger" | "info"> = {
  EXPECTED: "info",
  AT_RISK: "danger",
  DISPATCHED: "success",
  PARTIAL: "warning",
  RECEIVED: "success",
};

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{status.replace("_", " ").toLowerCase()}</Badge>;
}

export function DeliveryDetail({ delivery }: { delivery: Delivery }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-ink-tertiary">Expected</p>
          <p className="text-sm font-medium text-ink-primary">{delivery.expectedDate}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-ink-tertiary">Received</p>
          <p className="text-sm font-medium tabular-nums text-ink-primary">
            {delivery.quantityReceived} / {delivery.quantityOrdered}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-ink-tertiary">Status</p>
          <DeliveryStatusBadge status={delivery.status} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-y border-border py-4">
        {delivery.timeline.map((step, i) => (
          <div key={step.key} className="flex items-center gap-2">
            <div className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold", step.completed ? "bg-success text-ink-inverse" : "bg-surface-raised text-ink-tertiary")}>
              {step.completed ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={cn("text-xs", step.completed ? "text-ink-primary" : "text-ink-tertiary")}>{step.label}</span>
            {i < delivery.timeline.length - 1 && <span className="h-px w-6 bg-border-strong" />}
          </div>
        ))}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ai">AI monitor</p>
        {delivery.exceptions.length === 0 ? (
          <p className="text-sm text-ink-secondary">No exception currently detected.</p>
        ) : (
          <div className="space-y-2">
            {delivery.exceptions.map((exception) => (
              <div key={exception.id} className="flex items-start justify-between gap-3 rounded-md border border-danger/30 bg-danger-subtle px-3.5 py-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                  <p className="text-sm text-ink-primary">{exception.message}</p>
                </div>
                {exception.suggestedActionLabel && (
                  <Button size="sm" variant="secondary" className="shrink-0">
                    {exception.suggestedActionLabel}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {delivery.lastSupplierCommunicationAt && (
        <p className="text-xs text-ink-tertiary">Last supplier communication: {formatDateTime(delivery.lastSupplierCommunicationAt)}</p>
      )}
    </div>
  );
}
