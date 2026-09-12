import { CheckCircle2 } from "lucide-react";
import type { EvidenceReference } from "@/types/common";
import Link from "next/link";

/**
 * One "why" line, extracted from AIRecommendationCard so it can be reused
 * anywhere a single AI-sourced reason needs rendering with consistent
 * iconography — e.g. a future compact recommendation summary that doesn't
 * want the full card.
 */
export function AIReasonCard({ reason, evidence }: { reason: string; evidence?: EvidenceReference }) {
  return (
    <li className="flex items-start gap-2 text-sm text-ink-primary">
      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
      <span>
        {reason}
        {evidence?.href && (
          <Link href={evidence.href} className="ml-1.5 text-xs text-ai hover:underline">
            ({evidence.label})
          </Link>
        )}
      </span>
    </li>
  );
}
