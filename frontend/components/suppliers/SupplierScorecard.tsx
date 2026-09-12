import { Progress } from "@/components/ui/Progress";
import type { SupplierScoreBreakdown } from "@/types/supplier";

/**
 * The dimension-by-dimension score breakdown, reused on both the Decision
 * screen and the Supplier Detail page. `overall` and every dimension here
 * come from the deterministic score, never an LLM — see
 * docs/architecture/decisions/supplier-score.md.
 */
export function SupplierScorecard({ score }: { score: SupplierScoreBreakdown }) {
  const rows: { label: string; value: number }[] = [
    { label: "Price", value: score.price },
    { label: "Quality", value: score.quality },
    { label: "Delivery", value: score.delivery },
    { label: "Commercial", value: score.commercial },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Overall score</p>
        <p className="text-lg font-semibold tabular-nums text-ink-primary">{score.overall.toFixed(1)}</p>
      </div>
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-xs text-ink-secondary">{row.label}</span>
          <Progress value={row.value / 100} tone="brand" className="flex-1" label={row.label} />
          <span className="w-10 shrink-0 text-right text-xs tabular-nums text-ink-tertiary">{row.value.toFixed(0)}</span>
        </div>
      ))}
      <p className="text-[11px] text-ink-tertiary">Config version: {score.configVersion}</p>
    </div>
  );
}
