import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { AgentRun } from "@/types/ai";

/**
 * The *live* companion to AIActivityList (components/ai/AIActivityList.tsx),
 * which renders the historical, already-completed log with PR links and
 * "View" actions. This one renders a pipeline mid-flight: compact, no
 * navigation chrome (there's nothing to navigate to on a QUEUED step yet),
 * and the currently-running step gets a pulse so a buyer watching it can
 * tell it's alive, not stalled. Building a second component here — rather
 * than overloading AIActivityList with a `live` prop — keeps each one's
 * render logic honest about what state it actually handles.
 */
export function AIActivityTimeline({ runs }: { runs: AgentRun[] }) {
  return (
    <ol className="space-y-0">
      {runs.map((run, index) => {
        const isRunning = run.status === "RUNNING" || run.status === "ANALYZING";
        const isDone = run.status === "COMPLETED";
        const isFailed = run.status === "FAILED";

        return (
          <li key={run.id} className="relative flex gap-3 pb-4 last:pb-0">
            {index < runs.length - 1 && (
              <span className={cn("absolute left-[9px] top-6 h-full w-px", isDone ? "bg-success" : "bg-border")} />
            )}
            <span
              className={cn(
                "relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                isDone && "bg-success text-ink-inverse",
                isFailed && "bg-danger text-ink-inverse",
                isRunning && "bg-ai-subtle text-ai",
                !isDone && !isFailed && !isRunning && "bg-surface-raised text-ink-tertiary",
              )}
            >
              {isDone && <Check className="h-3 w-3" />}
              {isRunning && <Loader2 className="h-3 w-3 animate-spin" />}
              {!isDone && !isRunning && !isFailed && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
              {isFailed && <span className="text-[10px] font-bold">!</span>}
            </span>
            <div className={cn(isRunning && "animate-pulse")}>
              <p className={cn("text-sm", isDone ? "text-ink-primary" : isRunning ? "font-medium text-ink-primary" : "text-ink-tertiary")}>
                {run.label}
              </p>
              {run.summary && <p className="mt-0.5 text-xs text-ink-secondary">{run.summary}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
