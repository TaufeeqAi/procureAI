"use client";

import { CheckCircle2, XCircle, X, Radio } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AILiveActivityTimeline } from "@/components/ai/AILiveActivityTimeline";
import type { AIActivityEntry } from "@/types/ai";

export interface AIProcessingOverlayProps {
  title: string;
  phase: "idle" | "running" | "completed" | "failed" | "cancelled";
  activity: AIActivityEntry[];
  onCancel: () => void;
  onDismiss: () => void;
  completedMessage?: string;
}

/**
 * The "AI REQUEST → LOADING → RESULT" panel — this is what a buyer
 * watches while `useProcurementAI` runs the Phase 6 SSE stream. It renders
 * nothing for phase === "idle" by design: the trigger action (a plain
 * Button or RunProcurementAIButton) lives with the caller, not here, so
 * this component's only job is showing progress and outcome, never
 * deciding when to start.
 */
export function AIProcessingOverlay({ 
  title, 
  phase, 
  activity, 
  onCancel, 
  onDismiss, 
  completedMessage 
}: AIProcessingOverlayProps) {
  if (phase === "idle") return null;

  return (
    <Card accent="ai">
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ai">
            <Radio className={phase === "running" ? "h-3.5 w-3.5 animate-pulse" : "h-3.5 w-3.5"} />
            {title}
          </p>
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

        <AILiveActivityTimeline activity={activity} />

        {phase === "completed" && (
          <div className="flex items-center gap-2 rounded-md bg-success-subtle px-3 py-2.5 text-sm text-success">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {completedMessage ?? "Analysis complete."}
          </div>
        )}

        {phase === "failed" && (
          <div className="flex items-start gap-2 rounded-md bg-danger-subtle px-3 py-2.5 text-sm text-danger">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p>Analysis failed.</p>
              <p className="mt-0.5 text-xs opacity-80">The deterministic Phase 4 recommendation remains available.</p>
            </div>
          </div>
        )}

        {phase === "cancelled" && (
          <p className="text-sm text-ink-tertiary">Analysis cancelled. No procurement data was changed.</p>
        )}
      </CardContent>
    </Card>
  );
}