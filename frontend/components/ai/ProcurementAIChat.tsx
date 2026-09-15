"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Check, Copy, RotateCcw, Send } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { ChatMarkdown } from "@/components/ai/ChatMarkdown";
import { askProcurementAI } from "@/lib/api/ai";
import { cn } from "@/lib/utils/cn";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  mode?: "contextual" | "general";
  createdAt: number;
  isError?: boolean;
}

const GENERAL_SUGGESTIONS = [
  "Show me PRs awaiting approval",
  "Analyze supplier risks",
  "Find cost-saving opportunities",
  "How many open PRs do we have?",
  "Which suppliers have delivery issues?",
  "What are the current price anomalies?",
  "Which RFQs are still awaiting responses?",
  "Summarize today's decision queue",
];

const CONTEXTUAL_SUGGESTIONS = [
  "Why is this the recommended supplier?",
  "What are the main risks?",
  "What should I negotiate?",
  "Which evidence supports this recommendation?",
  "How does the quote compare to benchmark?",
  "What is the delivery slack?",
];

/** Suggestions stay visible until this many user queries have been sent. */
const MAX_SUGGESTION_QUERIES = 5;

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label="Copy response"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      }}
      className="rounded p-1 text-ink-tertiary transition-colors hover:bg-surface-raised hover:text-ink-primary"
    >
      {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

interface ProcurementAIChatProps {
  open: boolean;
  onClose: () => void;
}

export function ProcurementAIChat({ open, onClose }: ProcurementAIChatProps) {
  const pathname = usePathname();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const lastUserTextRef = useRef<string | null>(null);

  // Detect if we're on a PR page (e.g., /requisitions/PR-2026-00983/decision)
  const prMatch = pathname?.match(/\/requisitions\/(PR-\d{4}-\d{5})\//);
  const currentPrNumber = prMatch?.[1] ?? null;
  const isContextualMode = Boolean(currentPrNumber);

  // ✅ Suggestion visibility: appear after the 1st user query, disappear at the 5th
  const userQueryCount = messages.reduce((count, m) => (m.role === "user" ? count + 1 : count), 0);
  const showInlineSuggestions = userQueryCount >= 1 && userQueryCount < MAX_SUGGESTION_QUERIES;

  // Smart auto-scroll: only follow the conversation if the user is near the bottom.
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  useEffect(() => {
    if (nearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isLoading]);

  // Reset chat state when drawer closes
  useEffect(() => {
    if (!open) {
      setMessages([]);
      setMessage("");
      setIsLoading(false);
    }
  }, [open]);

  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = (customMessage ?? message).trim();
    if (!textToSend || isLoading) return;

    lastUserTextRef.current = textToSend;
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", content: textToSend, createdAt: Date.now() },
    ]);
    setMessage("");
    setIsLoading(true);

    try {
      let answer = "";
      let mode: "contextual" | "general" = "general";

      if (isContextualMode && currentPrNumber) {
        const response = await askProcurementAI(currentPrNumber, { question: textToSend });
        answer = response.answer;
        mode = "contextual";
      } else {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
        const res = await fetch(`${apiBaseUrl}/ai/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: textToSend }),
        });
        if (!res.ok) throw new Error(`Assistant unavailable (HTTP ${res.status})`);
        const data = await res.json();
        answer = data.answer;
        mode = data.mode;
      }

      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, role: "ai", content: answer, mode, createdAt: Date.now() },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "ai",
          content: err instanceof Error ? err.message : "The assistant could not be reached.",
          createdAt: Date.now(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    const lastErrorIndex = messages.map((m) => m.isError).lastIndexOf(true);
    if (lastErrorIndex === -1) return;
    setMessages((prev) => prev.filter((_, i) => i !== lastErrorIndex));
    void handleSendMessage(lastUserTextRef.current ?? undefined);
  };

  const suggestions = isContextualMode ? CONTEXTUAL_SUGGESTIONS : GENERAL_SUGGESTIONS;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Procurement AI Assistant"
      description={
        isContextualMode
          ? `Contextual mode · grounded in ${currentPrNumber}`
          : "Ask me anything about your procurement data"
      }
      widthClassName="w-full max-w-md"
    >
      <div className="flex h-full flex-col">
        {/* Chat messages area */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          aria-live="polite"
          className="flex-1 overflow-y-auto px-5 py-4"
        >
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ai/20">
                  <span className="text-xs font-bold text-ai">AI</span>
                </div>
                <div className="rounded-lg bg-surface-raised px-4 py-3">
                  <p className="text-sm text-ink-primary">
                    {isContextualMode
                      ? `Hello! I'm analyzing ${currentPrNumber}. I can help you understand the recommendation, risks, and negotiation strategy for this specific PR.`
                      : "Hello! I'm your Procurement AI assistant. I can help you with:"}
                  </p>
                  {!isContextualMode && (
                    <ul className="mt-2 ml-5 list-disc space-y-1 text-sm text-ink-secondary">
                      <li>Analyzing purchase requisitions</li>
                      <li>Comparing supplier quotes</li>
                      <li>Identifying cost-saving opportunities</li>
                      <li>Risk assessment and compliance</li>
                    </ul>
                  )}
                  <p className="mt-2 text-sm text-ink-primary">What would you like to know?</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pl-11">
                {suggestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => void handleSendMessage(question)}
                    className="rounded-full border border-border bg-canvas px-3 py-1.5 text-xs text-ink-secondary transition-colors hover:border-ai hover:text-ai"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("group flex gap-3", msg.role === "user" && "flex-row-reverse")}>
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      msg.role === "ai" ? (msg.isError ? "bg-danger-subtle" : "bg-ai/20") : "bg-brand/20",
                    )}
                  >
                    <span className={cn("text-xs font-bold", msg.role === "ai" ? (msg.isError ? "text-danger" : "text-ai") : "text-brand")}>
                      {msg.role === "ai" ? (msg.isError ? "!" : "AI") : "You"}
                    </span>
                  </div>

                  <div className={cn("max-w-[85%]", msg.role === "user" && "text-right")}>
                    <div
                      className={cn(
                        "rounded-lg px-4 py-3 text-left",
                        msg.role === "ai"
                          ? msg.isError
                            ? "bg-danger-subtle"
                            : "bg-surface-raised"
                          : "bg-ai/10",
                      )}
                    >
                      {msg.isError ? (
                        <>
                          <p className="text-sm text-danger">{msg.content}</p>
                          <button
                            type="button"
                            onClick={handleRetry}
                            className="mt-2 flex items-center gap-1.5 rounded-md border border-danger/30 px-2 py-1 text-[11px] font-medium text-danger transition-colors hover:bg-danger/10"
                          >
                            <RotateCcw className="h-3 w-3" aria-hidden="true" />
                            Retry
                          </button>
                        </>
                      ) : msg.role === "ai" ? (
                        <ChatMarkdown content={msg.content} />
                      ) : (
                        <p className="whitespace-pre-wrap text-sm text-ink-primary">{msg.content}</p>
                      )}

                      {/* Message meta row */}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className="text-[10px] uppercase tracking-wide text-ink-tertiary">
                          {msg.role === "user"
                            ? formatTime(msg.createdAt)
                            : msg.mode === "contextual"
                              ? `Contextual · ${formatTime(msg.createdAt)}`
                              : msg.mode === "general"
                                ? `General · ${formatTime(msg.createdAt)}`
                                : formatTime(msg.createdAt)}
                        </p>
                        {msg.role === "ai" && !msg.isError && (
                          <div className="opacity-0 transition-opacity group-hover:opacity-100">
                            <CopyButton text={msg.content} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Thinking indicator */}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ai/20">
                    <span className="text-xs font-bold text-ai">AI</span>
                  </div>
                  <div className="rounded-lg bg-surface-raised px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-ai" />
                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-ai [animation-delay:0.15s]" />
                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-ai [animation-delay:0.3s]" />
                      </div>
                      <p className="text-xs text-ink-tertiary">
                        {isContextualMode ? "Reading deterministic facts…" : "Querying procurement data…"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Chat input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSendMessage();
          }}
          className="border-t border-border bg-surface p-4"
        >
          {/* ✅ Follow-up suggestions: visible from the 1st query until the 5th query */}
          {showInlineSuggestions && (
            <div className="thin-scrollbar -mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
              {suggestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => void handleSendMessage(question)}
                  disabled={isLoading}
                  className="shrink-0 rounded-full border border-border bg-canvas px-3 py-1.5 text-xs text-ink-secondary transition-colors hover:border-ai hover:text-ai disabled:opacity-50"
                >
                  {question}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isContextualMode ? `Ask about ${currentPrNumber}…` : "Ask me anything…"}
              disabled={isLoading}
              aria-label="Message the procurement assistant"
              className="min-h-[60px] flex-1 resize-none rounded-lg border border-border bg-canvas px-4 py-3 text-sm text-ink-primary placeholder:text-ink-tertiary focus:border-ai focus:outline-none focus:ring-1 focus:ring-ai disabled:opacity-50"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSendMessage();
                }
              }}
            />
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ai text-ink-inverse transition-colors hover:bg-ai/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </Drawer>
  );
}
