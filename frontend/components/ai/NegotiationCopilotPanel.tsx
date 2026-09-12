"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/utils/format";
import type { NegotiationDraft } from "@/types/ai";

/**
 * The draft here is never sent from this panel directly to a real
 * outbound channel — Phase 1 has no email integration, and per
 * docs/architecture/ai-ux.md, an AI-authored outbound message always
 * requires an explicit human send step regardless of how that step is
 * eventually wired up.
 */
export function NegotiationCopilotPanel({ draft }: { draft: NegotiationDraft }) {
  const [message, setMessage] = useState(draft.draftMessage);
  const [sent, setSent] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-ink-tertiary">Target low</p>
          <p className="font-medium tabular-nums text-ink-primary">{formatMoney(draft.targetRange.low)}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-ink-tertiary">Target high</p>
          <p className="font-medium tabular-nums text-ink-primary">{formatMoney(draft.targetRange.high)}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-ink-tertiary">Variance</p>
          <p className="font-medium tabular-nums text-warning">+{draft.targetRange.variancePercent}%</p>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ai">AI-drafted message</p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={8}
          className="w-full rounded-md border border-border-strong bg-canvas p-3 text-sm text-ink-primary focus:border-brand"
        />
      </div>

      {sent ? (
        <p className="rounded-md bg-success-subtle px-3 py-2.5 text-sm text-success">Sent for approval.</p>
      ) : (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setMessage(draft.draftMessage)}>
            Reset
          </Button>
          <Button size="sm" onClick={() => setSent(true)}>
            Send for approval
          </Button>
        </div>
      )}
    </div>
  );
}
