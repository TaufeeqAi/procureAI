import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils/format";
import type { AgentRun, AgentRunStatus } from "@/types/ai";

const STATUS_ICON: Record<AgentRunStatus, React.ReactNode> = {
  QUEUED: <Clock className="h-4 w-4 text-ink-tertiary" />,
  RUNNING: <Loader2 className="h-4 w-4 animate-spin text-ai" />,
  ANALYZING: <Loader2 className="h-4 w-4 animate-spin text-ai" />,
  WAITING_FOR_EXTERNAL_EVENT: <Clock className="h-4 w-4 text-warning" />,
  WAITING_FOR_REVIEW: <Clock className="h-4 w-4 text-warning" />,
  COMPLETED: <CheckCircle2 className="h-4 w-4 text-success" />,
  FAILED: <CheckCircle2 className="h-4 w-4 text-danger" />,
};

const STATUS_LABEL: Record<AgentRunStatus, string> = {
  QUEUED: "Queued",
  RUNNING: "Running",
  ANALYZING: "Analyzing",
  WAITING_FOR_EXTERNAL_EVENT: "Waiting on supplier",
  WAITING_FOR_REVIEW: "Waiting for review",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

/**
 * Action-visible, not chain-of-thought-visible: each row is "what the tool
 * did," never a narrated reasoning trace. See docs/architecture/ai-ux.md.
 */
export function AIActivityList({ runs, showPR = false }: { runs: AgentRun[]; showPR?: boolean }) {
  return (
    <ul className="divide-y divide-border">
      {runs.map((run) => (
        <li key={run.id} className="flex items-start gap-3 py-3.5">
          <span className="mt-0.5 shrink-0">{STATUS_ICON[run.status]}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-ink-primary">{run.label}</p>
              {showPR && (
                <Link href={`/requisitions/${run.prId}`} className="entity-code text-xs text-ink-tertiary hover:text-brand">
                  {run.prId}
                </Link>
              )}
              <span className="text-xs text-ink-tertiary">{STATUS_LABEL[run.status]}</span>
            </div>
            {run.summary && <p className="mt-0.5 text-sm text-ink-secondary">{run.summary}</p>}
            <p className="mt-1 text-xs text-ink-tertiary">{formatDateTime(run.completedAt ?? run.startedAt)}</p>
          </div>
          {run.outputHref && (
            <Link href={run.outputHref} className="shrink-0 text-xs font-medium text-ai hover:underline">
              View
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
