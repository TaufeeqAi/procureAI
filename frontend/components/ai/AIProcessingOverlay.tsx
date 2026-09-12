"use client";

import { CheckCircle2, XCircle, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AIActivityTimeline } from "@/components/ai/AIActivityTimeline";
import type { PipelinePhase } from "@/lib/hooks/useAgentPipeline";
import type { AgentRun } from "@/types/ai";

export interface AIProcessingOverlayProps {
  title: string;
  phase: PipelinePhase;
  runs: AgentRun[];
  onCancel: () => void;
  onDismiss: () => void;
  completedMessage?: string;
}

/**
 * The "AI REQUEST → LOADING → RESULT" panel — this is what a buyer
 * watches while `useAgentPipeline` runs. It renders nothing for
 * phase === "idle" by design: the trigger action (a plain Button or
 * AIActionButton) lives with the caller, not here, so this component's
 * only job is showing progress and outcome, never deciding when to start.
 */
export function AIProcessingOverlay({ title, phase, runs, onCancel, onDismiss, completedMessage }: AIProcessingOverlayProps) {
  if (phase === "idle") return null;

  return (
    <Card accent="ai">
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ai">{title}</p>
          {phase === "running" ? (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          ) : (
            <button type="button" onClick={onDismiss} aria-label="Dismiss" className="rounded-md p-1 text-ink-tertiary hover:bg-surface-raised">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <AIActivityTimeline runs={runs} />

        {phase === "completed" && (
          <div className="flex items-center gap-2 rounded-md bg-success-subtle px-3 py-2.5 text-sm text-success">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {completedMessage ?? "Analysis complete."}
          </div>
        )}

        {phase === "failed" && (
          <div className="flex items-center gap-2 rounded-md bg-danger-subtle px-3 py-2.5 text-sm text-danger">
            <XCircle className="h-4 w-4 shrink-0" />
            Analysis failed. Try again.
          </div>
        )}

        {phase === "cancelled" && <p className="text-sm text-ink-tertiary">Analysis cancelled.</p>}
      </CardContent>
    </Card>
  );
}
