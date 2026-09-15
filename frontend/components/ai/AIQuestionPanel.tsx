"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  Database,
  Handshake,
  Loader2,
  MessageCircleQuestion,
  RotateCcw,
  Scale,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ChatMarkdown } from "@/components/ai/ChatMarkdown";
import { cn } from "@/lib/utils/cn";
import type { AIQuestionExchange } from "@/types/ai";

/** Suggestion taxonomy — every question is answerable from the Phase 4/5 facts payload. */
type SuggestionCategory = "Decision" | "Risk" | "Commercial" | "Evidence";

interface Suggestion {
  label: string;
  category: SuggestionCategory;
}

const SUGGESTED: Suggestion[] = [
  { label: "Why not the cheapest supplier?", category: "Decision" },
  { label: "What trade-offs justify the recommended supplier?", category: "Decision" },
  { label: "What is the main delivery risk?", category: "Risk" },
  { label: "Which supplier risks should I monitor post-award?", category: "Risk" },
  { label: "What should I negotiate first?", category: "Commercial" },
  { label: "How does the quote compare to the historical benchmark?", category: "Commercial" },
  { label: "What is the delivery slack on this PR?", category: "Commercial" },
  { label: "Which evidence supports the recommendation?", category: "Evidence" },
  { label: "Are any quotes excluded from ranking, and why?", category: "Evidence" },
  { label: "Is the recommended price within validation tolerance?", category: "Evidence" },
];

const CATEGORY_ICONS: Record<SuggestionCategory, LucideIcon> = {
  Decision: Scale,
  Risk: ShieldAlert,
  Commercial: Handshake,
  Evidence: ShieldCheck,
};

/** Mirrors the backend AIQuestionRequest contract (min 2, max 1000 chars). */
const MIN_QUESTION_LENGTH = 2;
const MAX_QUESTION_LENGTH = 1000;

/** Follow-up chips shown above the composer before the "show all" toggle. */
const COMPOSER_SUGGESTION_LIMIT = 4;

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function EvidenceChip({ item }: { item: AIQuestionExchange["evidence"][number] }) {
  const chip =
    "inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-surface-raised px-2 py-1 text-[11px] text-ink-secondary";
  const inner = (
    <>
      <Database className="h-3 w-3 shrink-0 text-ink-tertiary" aria-hidden="true" />
      <span className="truncate">{item.label}</span>
    </>
  );
  return item.href ? (
    <a href={item.href} className={cn(chip, "transition-colors hover:border-ai/40 hover:text-ai")} title={item.label}>
      {inner}
    </a>
  ) : (
    <span className={chip} title={item.label}>
      {inner}
    </span>
  );
}

function ExchangeCard({ exchange, index }: { exchange: AIQuestionExchange; index: number }) {
  const [copied, setCopied] = useState(false);

  async function copyAnswer() {
    await navigator.clipboard.writeText(exchange.answer);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="group rounded-lg border border-border bg-canvas p-3.5 transition-colors hover:border-border-strong">
      {/* Buyer question */}
      <div className="flex items-start gap-2.5">
        <span
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/15"
          title={`Question ${index}`}
        >
          <span className="text-[10px] font-bold text-brand">Q{index}</span>
        </span>
        <p className="min-w-0 flex-1 text-sm font-medium leading-6 text-ink-primary">{exchange.question}</p>
      </div>

      {/* Grounded AI answer */}
      <div className="mt-3 flex items-start gap-2.5">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ai/15">
          <Sparkles className="h-3 w-3 text-ai" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <ChatMarkdown content={exchange.answer} />

          {exchange.uncertainty && (
            <p className="mt-2 flex items-start gap-2 rounded-md border border-warning/25 bg-warning-subtle px-2.5 py-2 text-xs leading-5 text-warning">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{exchange.uncertainty}</span>
            </p>
          )}

          {exchange.evidence.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary">Grounded evidence</p>
              <div className="flex flex-wrap gap-1.5">
                {exchange.evidence.map((item) => (
                  <EvidenceChip key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Provenance + copy */}
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2">
            <p
              className="truncate text-[10px] uppercase tracking-wide text-ink-tertiary"
              title={`graph ${exchange.graphVersion} · prompts ${exchange.promptVersion}`}
            >
              {exchange.model}
              {formatTime(exchange.answeredAt) && ` · ${formatTime(exchange.answeredAt)}`}
            </p>
            <button
              type="button"
              onClick={() => void copyAnswer()}
              aria-label="Copy answer"
              className="rounded p-1 text-ink-tertiary opacity-0 transition-opacity hover:bg-surface-raised hover:text-ink-primary focus:opacity-100 group-hover:opacity-100"
            >
              {copied ? <Check className="h-3 w-3 text-success" aria-hidden="true" /> : <Copy className="h-3 w-3" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AIQuestionPanel({
  exchanges,
  asking,
  onAsk,
}: {
  exchanges: AIQuestionExchange[];
  asking: boolean;
  onAsk: (question: string) => Promise<unknown>;
}) {
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastFailed, setLastFailed] = useState<string | null>(null);
  const [clearedCount, setClearedCount] = useState(0);
  const [showAllFollowUps, setShowAllFollowUps] = useState(false);
  const [transcriptCopied, setTranscriptCopied] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(() => exchanges.slice(clearedCount), [exchanges, clearedCount]);

  const remainingSuggestions = useMemo(() => {
    const asked = new Set(visible.map((exchange) => exchange.question));
    return SUGGESTED.filter((item) => !asked.has(item.label));
  }, [visible]);

  /** Grouped starters for the empty state. */
  const suggestionGroups = useMemo(() => {
    const groups: { category: SuggestionCategory; items: string[] }[] = [];
    for (const suggestion of remainingSuggestions) {
      let group = groups.find((entry) => entry.category === suggestion.category);
      if (!group) {
        group = { category: suggestion.category, items: [] };
        groups.push(group);
      }
      group.items.push(suggestion.label);
    }
    return groups;
  }, [remainingSuggestions]);

  const followUpChips = showAllFollowUps
    ? remainingSuggestions
    : remainingSuggestions.slice(0, COMPOSER_SUGGESTION_LIMIT);

  // ✅ Drawer-level scrolling: the exchange list flows at natural height and the
  // Drawer body owns the scrollbar (as in the approved screenshot). Auto-scroll
  // simply brings the newest exchange into view inside that drawer scrollport.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [visible.length, asking]);

  async function submit(value = question) {
    const trimmed = value.trim();
    if (trimmed.length < MIN_QUESTION_LENGTH || asking) return;
    setError(null);
    setLastFailed(trimmed);
    try {
      await onAsk(trimmed);
      setQuestion("");
      setLastFailed(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The assistant could not answer right now.");
    }
  }

  /** Audit-friendly plain-text transcript of the visible conversation. */
  async function copyTranscript() {
    const text = visible
      .map((exchange, i) => {
        const lines = [
          `Q${i + 1}: ${exchange.question}`,
          `A${i + 1}: ${exchange.answer}`,
        ];
        if (exchange.uncertainty) lines.push(`Uncertainty: ${exchange.uncertainty}`);
        if (exchange.evidence.length > 0) {
          lines.push(`Evidence: ${exchange.evidence.map((item) => item.label).join("; ")}`);
        }
        lines.push(`Model: ${exchange.model} · graph ${exchange.graphVersion} · ${exchange.answeredAt}`);
        return lines.join("\n");
      })
      .join("\n\n");
    await navigator.clipboard.writeText(text);
    setTranscriptCopied(true);
    window.setTimeout(() => setTranscriptCopied(false), 1400);
  }

  const canSend = question.trim().length >= MIN_QUESTION_LENGTH && !asking;

  return (
    <Card accent="ai">
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <MessageCircleQuestion className="h-4 w-4 text-ai" aria-hidden="true" />
            Ask this procurement
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Conversation toolbar */}
        {visible.length > 0 && (
          <div className="flex items-center justify-between gap-2">
            <p className="flex min-w-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary">
              <ShieldCheck className="h-3 w-3 shrink-0 text-success" aria-hidden="true" />
              <span className="truncate">
                {visible[0]?.prNumber ? `${visible[0].prNumber} · ` : ""}
                {visible.length} exchange{visible.length === 1 ? "" : "s"} · evidence-grounded
              </span>
            </p>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => void copyTranscript()}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-ink-tertiary transition-colors hover:bg-surface-raised hover:text-ink-primary"
              >
                {transcriptCopied ? <Check className="h-3 w-3 text-success" aria-hidden="true" /> : <Copy className="h-3 w-3" aria-hidden="true" />}
                {transcriptCopied ? "Copied" : "Copy transcript"}
              </button>
              <button
                type="button"
                onClick={() => setClearedCount(exchanges.length)}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-ink-tertiary transition-colors hover:bg-surface-raised hover:text-ink-primary"
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Empty state — categorized starters */}
        {visible.length === 0 && !asking && (
          <div className="rounded-lg border border-dashed border-border bg-canvas px-4 py-6 text-center">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-ai/15">
              <MessageCircleQuestion className="h-5 w-5 text-ai" aria-hidden="true" />
            </span>
            <p className="mt-3 text-sm font-medium text-ink-primary">Ask anything about this procurement</p>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-ink-tertiary">
              Answers are grounded in the deterministic evidence catalog for this PR. When evidence is insufficient, the assistant says so plainly.
            </p>
            {suggestionGroups.length > 0 && (
              <div className="mt-5 space-y-3 text-left">
                {suggestionGroups.map((group) => {
                  const Icon = CATEGORY_ICONS[group.category];
                  return (
                    <div key={group.category}>
                      <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary">
                        <Icon className="h-3 w-3 text-ai" aria-hidden="true" />
                        {group.category}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {group.items.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => void submit(item)}
                            className="rounded-full border border-border bg-surface-raised px-2.5 py-1 text-[11px] text-ink-secondary transition-colors hover:border-ai/40 hover:text-ai"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ✅ Exchange history — natural height flow; the Drawer body scrollbar
            carries the conversation exactly like the approved screenshot. */}
        <div className="space-y-3" role="log" aria-live="polite" aria-busy={asking}>
          {visible.map((exchange, i) => (
            <ExchangeCard key={exchange.id} exchange={exchange} index={i + 1} />
          ))}

          {/* Thinking indicator */}
          {asking && (
            <div className="flex items-center gap-3 rounded-lg border border-ai/20 bg-ai-subtle/40 px-3.5 py-3">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-ai" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink-primary">Analyzing your question…</p>
                <p className="mt-0.5 text-xs text-ink-tertiary">Grounding the answer in facts and the evidence catalog.</p>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Failure banner with retry */}
        {error && (
          <div role="alert" className="flex items-start justify-between gap-3 rounded-lg border border-danger/25 bg-danger-subtle px-3.5 py-3">
            <div className="flex min-w-0 items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-danger">Question failed</p>
                <p className="mt-0.5 break-words text-xs text-danger/80">{error}</p>
              </div>
            </div>
            {lastFailed && (
              <Button variant="ghost" size="sm" onClick={() => void submit(lastFailed)} disabled={asking}>
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                Retry
              </Button>
            )}
          </div>
        )}

        {/* Composer */}
        <div className="space-y-2 border-t border-border pt-3">
          {visible.length > 0 && remainingSuggestions.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex flex-wrap gap-1.5">
                {followUpChips.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => void submit(item.label)}
                    disabled={asking}
                    className="rounded-full border border-border bg-canvas px-2.5 py-1 text-[11px] text-ink-secondary transition-colors hover:border-ai/40 hover:text-ai disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {remainingSuggestions.length > COMPOSER_SUGGESTION_LIMIT && (
                <button
                  type="button"
                  onClick={() => setShowAllFollowUps((current) => !current)}
                  className="text-[11px] font-medium text-ai transition-opacity hover:opacity-80"
                >
                  {showAllFollowUps
                    ? "Show fewer suggestions"
                    : `+${remainingSuggestions.length - COMPOSER_SUGGESTION_LIMIT} more suggestions`}
                </button>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void submit();
                }
                if (e.key === "Escape") setQuestion("");
              }}
              placeholder="Ask a question about this PR…"
              aria-label="Question about this procurement"
              maxLength={MAX_QUESTION_LENGTH}
              className="h-9 flex-1 rounded-md border border-border-strong bg-canvas px-3 text-sm text-ink-primary outline-none transition-colors focus:border-ai disabled:opacity-50"
              disabled={asking}
            />
            <Button variant="ai" size="icon" aria-label="Ask question" onClick={() => void submit()} disabled={!canSend}>
              {asking ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
            </Button>
          </div>
          <div className="flex items-center justify-between gap-2 text-[10px] text-ink-tertiary">
            <p>Enter to send · Esc to clear · Answers cite catalog evidence only</p>
            <p className={cn("tabular-nums", question.length >= MAX_QUESTION_LENGTH - 100 && "text-warning")}>
              {question.length}/{MAX_QUESTION_LENGTH}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
