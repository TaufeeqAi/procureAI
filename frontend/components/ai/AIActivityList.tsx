"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import type { AgentRun } from "@/types/ai";

const STATUS_ICON: Record<string, React.ReactNode> = {
  COMPLETED: <CheckCircle2 className="h-4 w-4 text-success" />,
  RUNNING: <Loader2 className="h-4 w-4 animate-spin text-ai" />,
  FAILED: <XCircle className="h-4 w-4 text-danger" />,
  QUEUED: <Loader2 className="h-4 w-4 animate-spin text-ink-tertiary" />,
  complete: <CheckCircle2 className="h-4 w-4 text-success" />,
  in_progress: <Loader2 className="h-4 w-4 animate-spin text-ai" />,
  failed: <XCircle className="h-4 w-4 text-danger" />,
};

export function AIActivityList({ runs }: { runs: AgentRun[] | unknown }) {
  // ✅ Defensive check: Ensure runs is always an array
  const safeRuns = Array.isArray(runs) ? runs : [];

  if (safeRuns.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-ink-tertiary">
          No AI activity recorded yet.
        </p>
        <p className="mt-1 text-xs text-ink-tertiary">
          Run an analysis on a PR to see activity here.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {safeRuns.map((run: any) => (
        <li key={run.id || Math.random().toString(36).substring(7)} className="flex items-start gap-3 py-3.5">
          <span className="mt-0.5 shrink-0">
            {STATUS_ICON[run.status] || <span className="h-4 w-4 rounded-full bg-border" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink-primary">
              {run.label || run.agent || "Unknown Agent"}
            </p>
            <p className="mt-0.5 text-xs text-ink-secondary">
              {run.summary || run.detail || "No details available"}
            </p>
            <p className="mt-1 text-[10px] text-ink-tertiary">
              {run.startedAt || run.timestamp 
                ? new Date(run.startedAt || run.timestamp).toLocaleString() 
                : ""}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}