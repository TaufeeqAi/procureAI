import { Card, CardContent } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { AIConfidenceBadge } from "@/components/ai/AIConfidenceBadge";
import { AIReasonCard } from "@/components/ai/AIReasonCard";
import { formatPercent } from "@/lib/utils/format";
import type { ProcurementRecommendation } from "@/types/ai";

/**
 * The Decision screen's centerpiece. Every number here traces to
 * `evidence` or to a deterministic score dimension — see
 * docs/architecture/design-system.md's Fact/Calculated/AI/Human
 * separation. `reasons` and `tradeOff` are the AI's explanation of the
 * score; they never substitute for it.
 */
export function AIRecommendationCard({ recommendation }: { recommendation: ProcurementRecommendation }) {
  const dims = recommendation.dimensions;
  return (
    <Card accent="ai">
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ai">Deterministic procurement recommendation</p>
            <p className="mt-1 text-lg font-semibold text-ink-primary">★ {recommendation.supplierName}</p>
          </div>
          <AIConfidenceBadge confidence={recommendation.confidence} band={recommendation.confidenceBand} />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(
            [
              ["Price", dims.price],
              ["Quality", dims.quality],
              ["Delivery", dims.delivery],
              ["Commercial", dims.commercialTerms],
              ["Risk", dims.risk],
            ] as const
          ).map(([label, dim]) => (
            <div key={label} className="rounded-md border border-border bg-canvas p-3">
              <p className="text-[11px] uppercase tracking-wide text-ink-tertiary">{label}</p>
              <p className="mt-1 text-sm font-semibold tabular-nums text-ink-primary">
                {formatPercent(dim.value, { maximumFractionDigits: 0 })}
              </p>
              <Progress value={dim.value} tone="ai" className="mt-2" />
              {dim.detail && <p className="mt-1.5 text-xs text-ink-tertiary">{dim.detail}</p>}
            </div>
          ))}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">Why {recommendation.supplierName}?</p>
          <ul className="space-y-1.5">
            {recommendation.reasons.map((reason) => (
              <AIReasonCard key={reason} reason={reason} />
            ))}
          </ul>
        </div>

        {recommendation.tradeOff && (
          <div className="rounded-md border border-border bg-canvas px-3.5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Trade-off</p>
            <p className="mt-1 text-sm text-ink-secondary">{recommendation.tradeOff}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

