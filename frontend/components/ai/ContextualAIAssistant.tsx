"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AIAskExchange } from "@/types/ai";

const SUGGESTED_QUESTIONS = [
  "Why not XYZ?",
  "Why is confidence only 93%?",
  "What if delivery becomes 7 days?",
  "Can we negotiate price?",
];

const CANNED_ANSWERS: Record<string, string> = {
  "Why not XYZ?":
    "XYZ is ₹30 cheaper per unit, but ABC has substantially stronger historical on-time delivery: 96% vs. 87%. The recommendation favors ABC based on the configured balance between price, quality, delivery, and commercial factors.",
  "Why is confidence only 93%?":
    "Confidence reflects both the model's score margin and the underlying sample size — 12 comparable transactions for ABC. It isn't capped at 100% by design; a wider price or delivery spread across the shortlisted suppliers would lower it further.",
  "What if delivery becomes 7 days?":
    "None of the three shortlisted suppliers can currently commit to a 7-day lead time based on their historical delivery performance. Open What-if Studio to see the full comparison.",
  "Can we negotiate price?":
    "Yes — ABC's quote is 5.4% above the historical benchmark for this material. Open Negotiation Copilot for a suggested target range and draft message.",
};

/**
 * Scoped to one PR, not a general-purpose chat surface — see
 * docs/architecture/ai-ux.md. Answers here are canned for Phase 1 (no
 * live model call yet); Phase 5 replaces CANNED_ANSWERS with a real
 * LangGraph response using the same AIAskExchange shape.
 */
export function ContextualAIAssistant({ prNumber }: { prNumber: string }) {
  const [exchanges, setExchanges] = useState<AIAskExchange[]>([]);

  function ask(question: string) {
    const answer = CANNED_ANSWERS[question] ?? "I don't have enough evidence on this PR to answer that yet.";
    setExchanges((prev) => [
      ...prev,
      { id: `${prev.length}`, question, answer, answeredAt: new Date().toISOString() },
    ]);
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-tertiary">Scoped to {prNumber}.</p>

      {exchanges.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <Button key={q} size="sm" variant="ai" onClick={() => ask(q)}>
              <Sparkles className="h-3 w-3" /> {q}
            </Button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {exchanges.map((exchange) => (
          <div key={exchange.id} className="space-y-1.5">
            <p className="text-sm font-medium text-ink-primary">{exchange.question}</p>
            <p className="rounded-md bg-ai-subtle px-3 py-2.5 text-sm text-ink-primary">{exchange.answer}</p>
          </div>
        ))}
      </div>

      {exchanges.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          {SUGGESTED_QUESTIONS.filter((q) => !exchanges.some((e) => e.question === q)).map((q) => (
            <Button key={q} size="sm" variant="ai" onClick={() => ask(q)}>
              {q}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
