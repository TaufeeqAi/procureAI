"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { AIActionButton } from "@/components/ai/AIActionButton";
import { EXTRACTION_PIPELINE } from "@/lib/mock/agent-pipeline";
import { formatPercent } from "@/lib/utils/format";
import type { Quote } from "@/types/quote";

export function QuoteExtraction({ quote }: { quote: Quote }) {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-ink-tertiary">Source document</p>
          <p className="entity-code text-sm text-ink-primary">{quote.sourceDocumentName}</p>
        </div>
        <AIActionButton
          label="Re-extract fields"
          pendingLabel="Extracting…"
          successLabel="Re-extracted"
          onRun={() => new Promise((resolve) => setTimeout(resolve, EXTRACTION_PIPELINE[0]!.durationMs))}
        />
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">Extracted fields</p>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-border">
            {quote.extractedFields.map((field) => (
              <tr key={field.field}>
                <td className="py-2 text-ink-secondary">{field.label}</td>
                <td className="py-2 text-ink-primary">{field.value}</td>
                <td className="py-2 text-right tabular-nums text-xs text-ink-tertiary">
                  {formatPercent(field.confidence, { maximumFractionDigits: 0 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {quote.conflicts.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-warning">
            <AlertTriangle className="h-3.5 w-3.5" /> Field needs review
          </p>
          {quote.conflicts.map((conflict) => (
            <div key={conflict.field} className="rounded-md border border-warning/30 bg-warning-subtle px-3 py-2.5 text-sm">
              <p className="mb-1.5 text-ink-primary">{conflict.label} — conflicting values found:</p>
              <ul className="space-y-1">
                {conflict.candidateValues.map((cv) => (
                  <li key={cv.value} className="text-xs text-ink-secondary">
                    <span className="font-medium text-ink-primary">{cv.value}</span> — {cv.sourceLocation}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <Badge tone={quote.validationStatus === "VALID" ? "success" : quote.validationStatus === "NEEDS_REVIEW" ? "warning" : "danger"}>
          {quote.validationStatus === "VALID" && <CheckCircle2 className="h-3 w-3" />}
          {quote.validationStatus.replace("_", " ").toLowerCase()}
        </Badge>
      </div>
    </div>
  );
}