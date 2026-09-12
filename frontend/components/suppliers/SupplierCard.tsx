import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { formatMoney } from "@/lib/utils/format";
import { routes } from "@/lib/constants/routes";
import type { SupplierShortlistCandidate } from "@/types/supplier";

/**
 * A ranked shortlist card (Sourcing tab). The evidence link is
 * deliberately required, not optional visual chrome — see
 * docs/architecture/ai-ux.md's automation-bias countermeasure: `onSelect`
 * only fires once `evidenceViewed` is true, so a buyer can't select the
 * top-ranked card without opening evidence at least once this session.
 */
export function SupplierCard({
  candidate,
  evidenceViewed,
  onViewEvidence,
  onSelect,
  selected,
}: {
  candidate: SupplierShortlistCandidate;
  evidenceViewed: boolean;
  onViewEvidence: () => void;
  onSelect: () => void;
  selected: boolean;
}) {
  return (
    <Card accent={candidate.rank === 1 ? "ai" : "neutral"}>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-ink-tertiary">Rank #{candidate.rank}</p>
            <Link href={routes.supplier(candidate.supplier.code)} className="text-base font-semibold text-ink-primary hover:text-brand">
              {candidate.rank === 1 && "★ "}
              {candidate.supplier.name}
            </Link>
            <p className="text-xs text-ink-tertiary">
              {candidate.supplier.approvalStatus === "APPROVED" ? "Approved" : candidate.supplier.approvalStatus} ·{" "}
              {candidate.supplier.performance?.totalPurchases ?? 0} previous transactions
            </p>
          </div>
          <span className="rounded-md bg-surface-raised px-2 py-1 text-xs font-semibold text-ink-primary">Deterministic score {candidate.deterministicScore.toFixed(1)}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <p className="text-[11px] uppercase text-ink-tertiary">Price</p>
            <p className="font-medium tabular-nums text-ink-primary">{candidate.quotedUnitPrice ? formatMoney(candidate.quotedUnitPrice) : "—"}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase text-ink-tertiary">Quality</p>
            <p className="font-medium tabular-nums text-ink-primary">{((candidate.supplier.performance?.qualityAcceptanceRate ?? 0) * 100).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[11px] uppercase text-ink-tertiary">Delivery</p>
            <p className="font-medium tabular-nums text-ink-primary">{((candidate.supplier.performance?.onTimeDeliveryRate ?? 0) * 100).toFixed(0)}% OTD</p>
          </div>
          <div>
            <p className="text-[11px] uppercase text-ink-tertiary">Risk</p>
            <p className="font-medium text-ink-primary">{candidate.supplier.riskLevel}</p>
          </div>
        </div>

        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {candidate.reasons.map((reason) => (
            <li key={reason} className="flex items-center gap-1.5 text-xs text-ink-secondary">
              <CheckCircle2 className="h-3 w-3 text-success" /> {reason}
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
          <ButtonLink href={routes.supplier(candidate.supplier.code)} variant="ghost" size="sm">
            View supplier
          </ButtonLink>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onViewEvidence}>
              View evidence
            </Button>
            <Button
              size="sm"
              disabled={!evidenceViewed}
              onClick={onSelect}
              title={!evidenceViewed ? "Review evidence before selecting" : undefined}
            >
              {selected ? "Selected" : "Select"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}