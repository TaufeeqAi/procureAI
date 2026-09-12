import { cn } from "@/lib/utils/cn";
import { formatPercent } from "@/lib/utils/format";
import type { ConfidenceBand } from "@/types/common";

const BAND_CLASSES: Record<ConfidenceBand, string> = {
  HIGH: "bg-ai-subtle text-ai",
  MEDIUM: "bg-warning-subtle text-warning",
  LOW: "bg-warning-subtle text-warning",
  INSUFFICIENT_DATA: "bg-surface-raised text-ink-tertiary",
};

/**
 * Confidence is never shown as a bare percentage — see
 * docs/architecture/decisions/confidence-thresholds.md. This component is
 * the one place a confidence figure is allowed to render, and it always
 * carries the band alongside the number so a viewer isn't left to guess
 * whether 93% here means the same thing as 93% somewhere backed by three
 * transactions.
 */
export function AIConfidenceBadge({ confidence, band }: { confidence: number; band: ConfidenceBand }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold", BAND_CLASSES[band])}>
      {formatPercent(confidence, { maximumFractionDigits: 0 })} confidence
      {band !== "HIGH" && <span className="font-normal opacity-80">({band.replace("_", " ").toLowerCase()})</span>}
    </span>
  );
}
