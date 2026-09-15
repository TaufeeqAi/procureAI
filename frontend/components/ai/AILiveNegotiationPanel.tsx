"use client";

import { useState } from "react";
import { Check, Copy, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/utils/format";
import type { AIGeneratedNegotiationDraft } from "@/types/ai";

export function AILiveNegotiationPanel({ draft }: { draft?: AIGeneratedNegotiationDraft | null }) {
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState(draft?.messageBody ?? "");

  if (!draft) return <p className="text-sm text-ink-tertiary">Run AI analysis to generate a grounded negotiation draft.</p>;

  async function copy() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-ai/20 bg-ai-subtle/40 px-3 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ai"><MessageSquareText className="h-3.5 w-3.5" /> AI negotiation position</div>
        <p className="mt-2 text-sm text-ink-primary">Target unit price <span className="font-semibold tabular-nums">{formatMoney({ currency: "INR", amount: draft.targetUnitPriceInr })}</span></p>
        <p className="mt-1 text-xs text-ink-secondary">{draft.anchorReason}</p>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">Draft message</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={9} className="w-full rounded-md border border-border-strong bg-canvas p-3 text-sm leading-6 text-ink-primary outline-none focus:border-ai" />
      </div>
      <div className="flex justify-end"><Button variant="secondary" size="sm" onClick={() => void copy()}>{copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy draft</>}</Button></div>
      <p className="text-[11px] text-ink-tertiary">This is a draft only. Sending to a supplier remains a human-controlled action.</p>
    </div>
  );
}
