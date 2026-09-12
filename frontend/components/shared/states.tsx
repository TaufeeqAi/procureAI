import type { ReactNode } from "react";
import { AlertTriangle, Ban, Inbox, Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * The reusable non-happy-path states named in the Phase 1 build plan
 * (Loading / Empty / Error / Partial / AI-processing / Permission /
 * Conflict). Grouped in one file since each is a small, related export —
 * splitting these into seven files would add navigation cost with no
 * benefit. See docs/architecture roadmap for the source wireframes each
 * one implements.
 */

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-surface px-6 py-10 text-center">
      <Loader2 className="h-5 w-5 animate-spin text-ink-tertiary" />
      <p className="text-sm text-ink-secondary">{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border-strong bg-surface px-6 py-10 text-center">
      <Inbox className="h-5 w-5 text-ink-tertiary" />
      <div>
        <p className="text-sm font-medium text-ink-primary">{title}</p>
        {description && <p className="mt-1 text-sm text-ink-secondary">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-danger/30 bg-danger-subtle px-6 py-10 text-center">
      <AlertTriangle className="h-5 w-5 text-danger" />
      <div>
        <p className="text-sm font-medium text-ink-primary">{title}</p>
        {description && <p className="mt-1 text-sm text-ink-secondary">{description}</p>}
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" /> Try again
        </Button>
      )}
    </div>
  );
}

export function PartialState({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning-subtle px-4 py-3 text-sm text-ink-primary">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <p>{message}</p>
    </div>
  );
}

export function AIProcessingState({ steps }: { steps: { label: string; done: boolean }[] }) {
  return (
    <div className="rounded-lg border border-ai/25 bg-ai-subtle px-4 py-3.5">
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ai">Analyzing</p>
      <ul className="space-y-1.5">
        {steps.map((step) => (
          <li key={step.label} className="flex items-center gap-2 text-sm">
            {step.done ? (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ai" />
            ) : (
              <Loader2 className="h-3 w-3 shrink-0 animate-spin text-ink-tertiary" />
            )}
            <span className={step.done ? "text-ink-primary" : "text-ink-tertiary"}>{step.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PermissionState({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-ink-secondary">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-ink-tertiary" />
      <p>{message}</p>
    </div>
  );
}

export function ConflictState({ message, onRefresh }: { message: string; onRefresh: () => void }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning-subtle px-4 py-3 text-sm">
      <Ban className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <div className="flex-1">
        <p className="text-ink-primary">{message}</p>
        <Button variant="ghost" size="sm" className="mt-2 px-0" onClick={onRefresh}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>
    </div>
  );
}
