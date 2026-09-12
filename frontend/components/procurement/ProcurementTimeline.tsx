import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatDateTime } from "@/lib/utils/format";
import type { PRTimelineEntry, WorkflowState } from "@/types/procurement";

/** The horizontal PR-lifecycle stepper (PR Overview). */
export function WorkflowStepper({ workflow }: { workflow: WorkflowState }) {
  return (
    <div className="thin-scrollbar flex items-center gap-0 overflow-x-auto py-1">
      {workflow.steps.map((step, index) => (
        <div key={step.key} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
                step.completed && "bg-success text-ink-inverse",
                step.current && "bg-brand text-ink-inverse",
                !step.completed && !step.current && "bg-surface-raised text-ink-tertiary",
              )}
            >
              {step.completed ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </div>
            <span className={cn("whitespace-nowrap text-[11px]", step.current ? "font-medium text-ink-primary" : "text-ink-tertiary")}>
              {step.label}
            </span>
          </div>
          {index < workflow.steps.length - 1 && (
            <div className={cn("mx-1.5 h-px w-8", step.completed ? "bg-success" : "bg-border-strong")} />
          )}
        </div>
      ))}
    </div>
  );
}

/** The vertical, chronological event list (Timeline tab). */
export function TimelineList({ entries }: { entries: PRTimelineEntry[] }) {
  return (
    <ol className="space-y-0">
      {entries.map((entry, index) => (
        <li key={entry.id} className="relative flex gap-3 pb-5 last:pb-0">
          {index < entries.length - 1 && <span className="absolute left-[5px] top-3 h-full w-px bg-border" />}
          <span className="relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand" />
          <div>
            <p className="text-sm font-medium text-ink-primary">{entry.label}</p>
            {entry.description && <p className="mt-0.5 text-sm text-ink-secondary">{entry.description}</p>}
            <p className="mt-1 text-xs text-ink-tertiary">{formatDateTime(entry.occurredAt)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
