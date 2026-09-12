import type { AgentKind, AgentRun, AgentRunStatus } from "@/types/ai";

/**
 * The simulated multi-agent run — this is the piece Phase 1 explicitly
 * deferred (see PHASE-1-SUMMARY.md § Handing off). Its shape is the actual
 * deliverable, not the setTimeout staging underneath it: Phase 5 replaces
 * `runMockAgentPipeline`'s body with a real streamed request (SSE or
 * polling against a LangGraph run), but every caller — the hook, the
 * overlay component — keeps working unchanged, because the contract is
 * "an ordered sequence of AgentRun updates delivered via callback," and
 * that contract doesn't care whether the updates come from a timer or a
 * network stream.
 */

export interface PipelineStageDefinition {
  agent: AgentKind;
  label: string;
  durationMs: number;
  summary: string;
}

export const ANALYSIS_PIPELINE: PipelineStageDefinition[] = [
  { agent: "REQUIREMENT_AGENT", label: "Requirement Agent", durationMs: 650, summary: "Requirement re-validated against current PR data." },
  { agent: "SUPPLIER_INTELLIGENCE_AGENT", label: "Supplier Intelligence Agent", durationMs: 900, summary: "Supplier shortlist re-scored against latest performance data." },
  { agent: "QUOTE_INTELLIGENCE_AGENT", label: "Quote Intelligence Agent", durationMs: 750, summary: "Quotations re-normalized, no field conflicts found." },
  { agent: "PROCUREMENT_ANALYST", label: "Procurement Analyst", durationMs: 850, summary: "Supplier scores recalculated." },
  { agent: "RISK_AGENT", label: "Risk Agent", durationMs: 500, summary: "Risk flags re-evaluated." },
];

export const EXTRACTION_PIPELINE: PipelineStageDefinition[] = [
  { agent: "QUOTE_INTELLIGENCE_AGENT", label: "Quote Intelligence Agent", durationMs: 900, summary: "Fields re-extracted from source document." },
];

export const RANKING_PIPELINE: PipelineStageDefinition[] = [
  { agent: "SUPPLIER_INTELLIGENCE_AGENT", label: "Supplier Intelligence Agent", durationMs: 800, summary: "Shortlist re-ranked against current supplier performance." },
];

function makeRun(prId: string, stage: PipelineStageDefinition, index: number, status: AgentRunStatus, startedAt: string, completedAt?: string): AgentRun {
  return {
    id: `sim-${prId}-${stage.agent}-${index}`,
    agent: stage.agent,
    label: stage.label,
    status,
    prId,
    summary: status === "COMPLETED" ? stage.summary : undefined,
    startedAt,
    completedAt,
  };
}

/**
 * Runs `stages` in sequence, calling `onUpdate` with the *complete*
 * current run list after every state transition (not just the delta) —
 * the same shape a real-time subscription would deliver, so
 * `useAgentPipeline` never needs to know whether it's reducing a stream
 * of diffs or a stream of snapshots.
 */
export async function runMockAgentPipeline(
  prId: string,
  stages: PipelineStageDefinition[],
  onUpdate: (runs: AgentRun[]) => void,
  signal?: AbortSignal,
): Promise<AgentRun[]> {
  const runs: AgentRun[] = stages.map((stage, i) => makeRun(prId, stage, i, "QUEUED", new Date().toISOString()));
  onUpdate([...runs]);

  for (let i = 0; i < stages.length; i++) {
    if (signal?.aborted) throw new DOMException("Analysis cancelled", "AbortError");

    const stage = stages[i]!;
    const startedAt = new Date().toISOString();
    runs[i] = makeRun(prId, stage, i, "RUNNING", startedAt);
    onUpdate([...runs]);

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, stage.durationMs);
      signal?.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("Analysis cancelled", "AbortError"));
      });
    });

    runs[i] = makeRun(prId, stage, i, "COMPLETED", startedAt, new Date().toISOString());
    onUpdate([...runs]);
  }

  return runs;
}
