import type { 
  AIQuestionExchange, 
  AIQuestionRequest, 
  AIStreamEnvelope, 
  ProcurementAIRun,
  RecommendationState
} from "@/types/ai";
import type { ConfidenceBand } from "@/types/common";
import type { WhatIfResponse } from "@/types/intelligence";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

type StreamHandlers = {
  onEvent: (event: AIStreamEnvelope) => void;
};

function parseEnvelope(eventName: string, json: string): AIStreamEnvelope | null {
  try {
    const raw = JSON.parse(json) as Record<string, unknown>;
    return {
      type: (raw.type as AIStreamEnvelope["type"]) ?? (eventName as AIStreamEnvelope["type"]),
      runId: String(raw.run_id ?? ""),
      prNumber: String(raw.pr_number ?? ""),
      threadId: String(raw.thread_id ?? ""),
      sequence: Number(raw.sequence ?? 0),
      timestamp: String(raw.timestamp ?? new Date().toISOString()),
      data: (raw.data as Record<string, unknown>) ?? {},
    };
  } catch {
    return null;
  }
}

async function readSSE(
  stream: ReadableStream<Uint8Array>, 
  handlers: StreamHandlers, 
  signal?: AbortSignal
) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let eventName = "message";
  let dataLines: string[] = [];

  try {
    while (true) {
      if (signal?.aborted) throw new DOMException("Analysis cancelled", "AbortError");
      const { value, done } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      
      for (const line of lines) {
        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).trimStart());
        } else if (line === "") {
          if (dataLines.length > 0) {
            const envelope = parseEnvelope(eventName, dataLines.join("\n"));
            if (envelope) handlers.onEvent(envelope);
          }
          eventName = "message";
          dataLines = [];
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { Accept: "application/json", "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error?.message ?? `Request failed with HTTP ${response.status}`;
    throw new Error(message);
  }
  return payload as T;
}

export async function runProcurementAI(prNumber: string): Promise<ProcurementAIRun> {
  const payload = await request<Record<string, unknown>>(`/ai/procurement/${encodeURIComponent(prNumber)}`, { method: "POST" });
  return normalizeRun(payload);
}

export async function streamProcurementAI(
  prNumber: string,
  handlers: StreamHandlers,
  signal?: AbortSignal,
  threadId?: string,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/ai/procurement/${encodeURIComponent(prNumber)}/stream`, {
    method: "POST",
    headers: { Accept: "text/event-stream", "Content-Type": "application/json" },
    body: JSON.stringify(threadId ? { thread_id: threadId } : {}),
    cache: "no-store",
    signal,
  });

  if (!response.ok || !response.body) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message ?? `AI stream failed with HTTP ${response.status}`);
  }

  await readSSE(response.body, handlers, signal);
}

export async function getWhatIfScenario(
  prNumber: string,
  requiredDate: string,
  quantity?: number,
): Promise<WhatIfResponse> {
  const params = new URLSearchParams({ required_date: requiredDate });
  if (quantity) params.set("quantity", String(quantity));
  
  const response = await fetch(`${API_BASE_URL}/requisitions/${encodeURIComponent(prNumber)}/what-if?${params.toString()}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message ?? `What-if request failed with HTTP ${response.status}`);
  return payload as WhatIfResponse;
}

export async function askProcurementAI(prNumber: string, requestPayload: AIQuestionRequest): Promise<AIQuestionExchange> {
  const response = await fetch(`${API_BASE_URL}/ai/procurement/${encodeURIComponent(prNumber)}/ask`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ question: requestPayload.question, thread_id: requestPayload.threadId }),
    cache: "no-store",
  });
  
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message ?? `Question request failed with HTTP ${response.status}`);
  }
  
  return {
    id: String(payload.id ?? ""),
    threadId: String(payload.threadId ?? ""),
    prNumber: String(payload.prNumber ?? ""),
    question: String(payload.question ?? ""),
    answer: String(payload.answer ?? ""),
    uncertainty: payload.uncertainty ? String(payload.uncertainty) : undefined,
    // FIX 1: Explicitly type 'item' as 'unknown' to satisfy strict TypeScript
    evidence: Array.isArray(payload.evidence) ? payload.evidence.map((item: unknown) => ({
      id: String((item as Record<string, unknown>).id ?? ""),
      type: String((item as Record<string, unknown>).type ?? "UNKNOWN") as AIQuestionExchange["evidence"][number]["type"],
      label: String((item as Record<string, unknown>).label ?? ""),
      asOf: String((item as Record<string, unknown>).asOf ?? new Date().toISOString()),
    })) : [],
    graphVersion: String(payload.graphVersion ?? ""),
    promptVersion: String(payload.promptVersion ?? ""),
    model: String(payload.model ?? ""),
    answeredAt: new Date().toISOString(),
  };
}

function normalizeRun(payload: Record<string, unknown>): ProcurementAIRun {
  const rec = (payload.recommendation ?? {}) as Record<string, unknown>;
  
  return {
    runId: String(payload.runId ?? ""),
    threadId: String(payload.threadId ?? ""),
    prNumber: String(payload.prNumber ?? ""),
    status: payload.status === "failed" ? "failed" : "completed",
    graphVersion: String(payload.graphVersion ?? ""),
    promptVersion: String(payload.promptVersion ?? ""),
    model: String(payload.model ?? ""),
    // FIX 2: Explicitly map all required fields with safe fallbacks to prevent 'undefined' type errors
    recommendation: {
      id: String(rec.id ?? ""),
      prId: String(rec.prId ?? ""),
      supplierId: String(rec.supplierId ?? ""),
      supplierName: String(rec.supplierName ?? ""),
      confidence: Number(rec.confidence ?? 0),
      confidenceBand: String(rec.confidenceBand ?? "LOW") as ConfidenceBand,
      recommendationState: String(rec.recommendationState ?? "INSUFFICIENT_DATA") as RecommendationState,
      overallScore: Number(rec.overallScore ?? 0),
      generatedAt: String(rec.generatedAt ?? new Date().toISOString()),
      dimensions: (rec.dimensions as any) ?? {
        price: { value: 0, label: "Price" },
        quality: { value: 0, label: "Quality" },
        delivery: { value: 0, label: "Delivery" },
        commercialTerms: { value: 0, label: "Commercial terms" },
        risk: { value: 0, label: "Risk" },
      },
      reasons: Array.isArray(rec.reasons) ? rec.reasons : [],
      risks: Array.isArray(rec.risks) ? rec.risks : [],
      evidence: Array.isArray(rec.evidence) ? rec.evidence : [],
      policyChecks: Array.isArray(rec.policyChecks) ? rec.policyChecks : [],
      alternatives: Array.isArray(rec.alternatives) ? rec.alternatives : [],
      tradeOff: rec.tradeOff ? String(rec.tradeOff) : undefined,
    },
    negotiation: payload.negotiation as ProcurementAIRun["negotiation"],
    activity: Array.isArray(payload.activity) ? payload.activity : [],
    errors: Array.isArray(payload.errors) ? payload.errors : [],
  };
}




export { normalizeRun };