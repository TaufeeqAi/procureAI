"use client";

import { Check, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { AIActivityEntry } from "@/types/ai";

export function AILiveActivityTimeline({ activity }: { activity: AIActivityEntry[] }) {
  if (activity.length === 0) {
    return <p className="text-sm text-ink-tertiary">Waiting for the first agent update…</p>;
  }

  return (
    <ol className="space-y-0">
      {activity.map((item, index) => {
        const active = item.status === "in_progress" || item.status === "started";
        const done = item.status === "complete";
        return (
          <li key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
            {index < activity.length - 1 && <span className={cn("absolute left-[9px] top-5 h-full w-px", done ? "bg-success" : "bg-border")} />}
            <span className={cn("relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full", done && "bg-success text-ink-inverse", active && "bg-ai-subtle text-ai", item.status === "failed" && "bg-danger-subtle text-danger", !done && !active && item.status !== "failed" && "bg-surface-raised text-ink-tertiary")}>
              {done && <Check className="h-3 w-3" />}
              {active && <Loader2 className="h-3 w-3 animate-spin" />}
              {item.status === "failed" && <XCircle className="h-3 w-3" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm", active || done ? "font-medium text-ink-primary" : "text-ink-tertiary")}>{item.label}</p>
              <p className="mt-0.5 text-xs text-ink-secondary">{item.detail}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
