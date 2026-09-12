"use client";

import { useCallback, useRef, useState } from "react";
import type { AgentRun } from "@/types/ai";
import type { PipelineStageDefinition } from "@/lib/mock/agent-pipeline";
import { runMockAgentPipeline } from "@/lib/mock/agent-pipeline";

export type PipelinePhase = "idle" | "running" | "completed" | "failed" | "cancelled";

export interface UseAgentPipelineResult {
  phase: PipelinePhase;
  runs: AgentRun[];
  /** Start the pipeline. No-op if one is already running. */
  start: () => void;
  /** Cancel a running pipeline — resolves to "cancelled", not "failed";
   *  a buyer closing the overlay isn't the same event as the AI erroring. */
  cancel: () => void;
  reset: () => void;
}

/**
 * Owns one pipeline run's lifecycle (idle → running → completed/failed/
 * cancelled) plus its in-flight AgentRun snapshots. This is the reusable
 * seam Phase 5 targets: swap `runMockAgentPipeline` for a real request and
 * every component using this hook (AIProcessingOverlay, AIActionButton)
 * keeps working unchanged, because they only ever see `phase` and `runs`.
 */
export function useAgentPipeline(prId: string, stages: PipelineStageDefinition[]): UseAgentPipelineResult {
  const [phase, setPhase] = useState<PipelinePhase>("idle");
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const controllerRef = useRef<AbortController | null>(null);

  const start = useCallback(() => {
    if (phase === "running") return;

    const controller = new AbortController();
    controllerRef.current = controller;
    setPhase("running");
    setRuns([]);

    runMockAgentPipeline(prId, stages, setRuns, controller.signal)
      .then(() => {
        if (!controller.signal.aborted) setPhase("completed");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          setPhase("cancelled");
        } else {
          setPhase("failed");
        }
      });
  }, [phase, prId, stages]);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    setPhase("idle");
    setRuns([]);
  }, []);

  return { phase, runs, start, cancel, reset };
}
