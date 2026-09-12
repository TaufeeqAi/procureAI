import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils/format";
import type { EvidenceReference } from "@/types/common";
import type { PolicyCheck } from "@/types/ai";
import { CheckCircle2, XCircle } from "lucide-react";

/**
 * Content for the Evidence Drawer overlay. Every figure the Decision
 * screen shows must be traceable through this component to a concrete
 * source and a timestamp — the whole point of this panel per Section 16
 * is that "AI says so" is never the end of the trail.
 */
export function AIEvidencePanel({ evidence, policyChecks = [] }: { evidence: EvidenceReference[]; policyChecks?: PolicyCheck[] }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">Sources</p>
        <ul className="space-y-1.5">
          {evidence.map((ref) => (
            <li key={ref.id} className="flex items-center justify-between rounded-md border border-border bg-canvas px-3 py-2 text-sm">
              <div>
                {ref.href ? (
                  <Link href={ref.href} className="flex items-center gap-1.5 font-medium text-ai hover:underline">
                    {ref.label} <ExternalLink className="h-3 w-3" />
                  </Link>
                ) : (
                  <span className="entity-code text-ink-primary">{ref.label}</span>
                )}
                <p className="text-xs text-ink-tertiary">{ref.type.replace("_", " ").toLowerCase()}</p>
              </div>
              <span className="text-xs text-ink-tertiary">as of {formatDate(ref.asOf)}</span>
            </li>
          ))}
        </ul>
      </div>

      {policyChecks.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">Policy checks</p>
          <ul className="space-y-1.5">
            {policyChecks.map((check) => (
              <li key={check.label} className="flex items-start gap-2 text-sm">
                {check.passed ? (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                ) : (
                  <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" />
                )}
                <div>
                  <span className="text-ink-primary">{check.label}</span>
                  {check.detail && <p className="text-xs text-ink-tertiary">{check.detail}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-ink-tertiary">
        Sample size and recency are shown wherever a confidence figure is quoted — an interpretation is only as strong as the
        evidence behind it.
      </p>
    </div>
  );
}
