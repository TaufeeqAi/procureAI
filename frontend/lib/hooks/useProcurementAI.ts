"use client";

import { useCallback, useRef, useState } from "react";
import { askProcurementAI, streamProcurementAI, normalizeRun } from "@/lib/api/ai";
import type { AIActivityEntry, AIQuestionExchange, AIStreamEnvelope, ProcurementAIRun, AIAgentName } from "@/types/ai";

type Phase = "idle" | "running" | "completed" | "failed" | "cancelled";

// Enterprise-grade defense: Safely resolve untrusted network payloads into strict union types.
// If the backend sends an unexpected agent name, we fall back to "graph" to prevent UI crashes.
const KNOWN_AGENTS = new Set<AIAgentName>([
  "requirement_agent",
  "supplier_agent",
  "quote_agent",
  "procurement_analyst",
  "risk_agent",
  "negotiation_agent",
  "question_agent",
  "human_decision",
  "graph",
]);

function resolveAgentName(raw: unknown): AIAgentName {
  if (typeof raw === "string" && KNOWN_AGENTS.has(raw as AIAgentName)) {
    return raw as AIAgentName;
  }
  return "graph";
}

export function useProcurementAI(prNumber: string) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [activity, setActivity] = useState<AIActivityEntry[]>([]);
  const [run, setRun] = useState<ProcurementAIRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<AIQuestionExchange[]>([]);
  const [asking, setAsking] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase((current) => current === "running" ? "cancelled" : current);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase("idle");
    setActivity([]);
    setRun(null);
    setError(null);
  }, []);

  const handleEvent = useCallback((event: AIStreamEnvelope) => {
    if (event.type === "run.started") {
      setPhase("running");
      return;
    }
    
    if (event.type === "activity") {
      const raw = event.data as Partial<{ 
        agent: string; 
        label: string; 
        detail: string; 
        status: string; 
        timestamp: string 
      }>;
      
      const next: AIActivityEntry = {
        id: `${event.runId}-${event.sequence}`,
        prNumber,
        // FIX: Use the resolver to safely cast the agent name
        agent: resolveAgentName(raw.agent),
        label: String(raw.label ?? "Unknown Agent"),
        detail: String(raw.detail ?? ""),
        status: (raw.status === "complete" ? "complete" : raw.status === "failed" ? "failed" : "in_progress"),
        timestamp: String(raw.timestamp ?? event.timestamp),
      };
      
      // Update existing agent entry instead of creating duplicates
      setActivity((current) => {
        const existingIndex = current.findIndex((item) => item.agent === next.agent);
        if (existingIndex >= 0) {
          const updated = [...current];
          updated[existingIndex] = next;
          return updated;
        }
        return [...current, next];
      });
      return;
    }
    
    if (event.type === "run.completed") {
      const nextRun = normalizeRun((event.data.run ?? {}) as Record<string, unknown>);
      setRun(nextRun);
      setPhase("completed");
      return;
    }
    
    if (event.type === "run.failed") {
      const data = event.data as { message?: string };
      setError(data.message ?? "AI analysis failed.");
      setPhase("failed");
    }
  }, [prNumber]);

  const start = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase("running");
    setActivity([]);
    setRun(null);
    setError(null);
    try {
      await streamProcurementAI(prNumber, { onEvent: handleEvent }, controller.signal);
      if (!controller.signal.aborted) {
        setPhase((current) => {
          if (current === "running") {
            setError("Stream ended before a completion event.");
            return "failed";
          }
          return current;
        });
      }
    } catch (err) {
      if (controller.signal.aborted) {
        setPhase("cancelled");
      } else {
        setError(err instanceof Error ? err.message : "AI analysis failed.");
        setPhase("failed");
      }
    } finally {
      abortRef.current = null;
    }
  }, [handleEvent, prNumber]);

  const ask = useCallback(async (question: string) => {
    setAsking(true);
    setError(null);
    try {
      const exchange = await askProcurementAI(prNumber, { question, threadId: run?.threadId });
      setQuestions((current) => [...current, exchange]);
      return exchange;
    } catch (err) {
      setError(err instanceof Error ? err.message : "The procurement assistant failed.");
      throw err;
    } finally {
      setAsking(false);
    }
  }, [prNumber, run?.threadId]);

  return { phase, activity, run, error, questions, asking, start, cancel, reset, ask };
}