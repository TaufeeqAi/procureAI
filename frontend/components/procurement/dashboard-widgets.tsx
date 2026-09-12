import Link from "next/link";
import { ArrowRight, Link2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { PriorityBadge } from "@/components/procurement/badges";
import type { ProcurementTask, ActivityEvent } from "@/types/procurement";
import type { Money } from "@/types/common";

/** One Command Center summary tile — big number, uppercase label, short
 *  description, and a colored top accent carrying the tile's semantic. */
export function KPITile({
  value,
  label,
  description,
  accent,
}: {
  value: string;
  label: string;
  description: string;
  accent: "neutral" | "ai" | "danger" | "brand";
}) {
  return (
    <Card accent={accent} className="px-5 py-4">
      <p className="text-2xl font-semibold tabular-nums text-ink-primary">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-secondary">{label}</p>
      <p className="mt-0.5 text-xs text-ink-tertiary">{description}</p>
    </Card>
  );
}

/** One row in the Decision Queue — priority, PR, headline, AI status line,
 *  and the primary action. The action button's variant itself carries
 *  meaning: "Decide" (primary/amber) for a ready recommendation, "Review"
 *  (secondary/outline) for anything still needing attention first. */
export function DecisionQueueCard({ task }: { task: ProcurementTask }) {
  const isReady = task.priority === "READY";
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-3.5 last:border-b-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <PriorityBadge priority={task.priority} />
          <Link href={`/requisitions/${task.prNumber}`} className="entity-code text-sm font-medium text-ink-primary hover:text-brand">
            {task.prNumber}
          </Link>
          <span className="text-sm text-ink-secondary">{task.materialName}</span>
        </div>
        <p className="mt-1 text-sm text-ink-secondary">{task.headline}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-ai">
          <Link2 className="h-3 w-3" aria-hidden="true" />
          {task.detail}
        </p>
      </div>
      <ButtonLink href={task.actionHref} variant={isReady ? "primary" : "secondary"} size="sm" className="shrink-0">
        {task.actionLabel}
      </ButtonLink>
    </div>
  );
}

export function PipelineWidget({ stages }: { stages: { label: string; value: number; max: number }[] }) {
  return (
    <div className="space-y-3">
      {stages.map((stage) => (
        <div key={stage.label} className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-xs text-ink-secondary">{stage.label}</span>
          <Progress value={stage.value / stage.max} tone="brand" className="flex-1" label={stage.label} />
          <span className="w-6 shrink-0 text-right text-xs tabular-nums text-ink-tertiary">{stage.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-tertiary">
          <th className="w-16 py-2 font-semibold">Time</th>
          <th className="py-2 font-semibold">Event</th>
          <th className="w-12 py-2" />
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {events.map((event) => (
          <tr key={event.id}>
            <td className="entity-code py-2.5 text-xs text-ink-tertiary">
              {new Date(event.occurredAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })}
            </td>
            <td className="py-2.5 text-ink-primary">{event.message}</td>
            <td className="py-2.5 text-right">
              {event.entityHref && (
                <Link href={event.entityHref} className="text-xs font-medium text-ai hover:underline">
                  Open
                </Link>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function AIOpportunityRow({ label, count, href }: { label: string; count: number; href: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-md px-1 py-2 text-sm hover:bg-surface-raised">
      <span className="text-ink-primary">{label}</span>
      <span className="flex items-center gap-1.5 text-ink-tertiary">
        <span className="rounded-full bg-ai-subtle px-1.5 py-0.5 text-xs font-semibold tabular-nums text-ai">{count}</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}

export function formatOpportunityValue(money?: Money): string {
  if (!money) return "—";
  if (money.currency === "INR" && money.amount >= 1_00_000) {
    return `₹${(money.amount / 1_00_000).toFixed(2)}L`;
  }
  return String(money.amount);
}
