"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { formatDateTime } from "@/lib/utils/format";
import type { SupplierResponseThread } from "@/types/rfq";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";

const FIELD_STATUS_ICON = {
  MATCHED: <CheckCircle2 className="h-3.5 w-3.5 text-success" />,
  CONFLICT: <HelpCircle className="h-3.5 w-3.5 text-warning" />,
  MISSING: <XCircle className="h-3.5 w-3.5 text-danger" />,
};

/**
 * A thread's identity is (RFQ, supplier), not supplier alone — the same
 * supplier can hold threads against multiple RFQs (the backend's
 * RFQRecipient row doubles as the thread key). Keying on supplierId only
 * duplicates React keys the moment the inbox spans more than one RFQ.
 */
function threadKey(thread: SupplierResponseThread): string {
  return `${thread.rfqId}:${thread.supplierId}`;
}

export interface SupplierInboxProps {
  threads: SupplierResponseThread[];
  /** Optional `${rfqId}:${supplierId}` → RFQ number map, used to
   *  disambiguate a supplier appearing in more than one RFQ thread. */
  rfqLabelByThreadId?: Record<string, string>;
}

/**
 * Two-pane inbox: supplier list (left) + selected thread with AI-extracted
 * fields (right). Powers both /rfqs (view=inbox) and the PR's
 * Communication tab.
 */
export function SupplierInbox({ threads, rfqLabelByThreadId }: SupplierInboxProps) {
  const [selectedKey, setSelectedKey] = useState<string | undefined>(
    threads[0] ? threadKey(threads[0]) : undefined,
  );
  const selected = threads.find((t) => threadKey(t) === selectedKey) ?? threads[0];
  if (!selected) return <p className="text-sm text-ink-tertiary">No supplier communication yet.</p>;

  const supplierCounts = new Map<string, number>();
  for (const thread of threads) {
    supplierCounts.set(thread.supplierId, (supplierCounts.get(thread.supplierId) ?? 0) + 1);
  }

  return (
    <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-lg border border-border md:grid-cols-[220px_1fr]">
      <div className="divide-y divide-border border-b border-border bg-canvas md:border-b-0 md:border-r">
        {threads.map((thread) => {
          const key = threadKey(thread);
          const duplicated = (supplierCounts.get(thread.supplierId) ?? 0) > 1;
          const rfqLabel = rfqLabelByThreadId?.[key];
          return (
            <button
              key={key}
              onClick={() => setSelectedKey(key)}
              className={cn(
                "flex w-full items-center justify-between gap-2 px-3.5 py-3 text-left text-sm transition-colors duration-150",
                key === threadKey(selected) ? "bg-surface-raised" : "hover:bg-surface-raised",
              )}
            >
              <span className="min-w-0">
                <span className="block truncate text-ink-primary">{thread.supplierName}</span>
                {duplicated && (
                  <span className="entity-code block truncate text-[11px] text-ink-tertiary">
                    {rfqLabel ?? thread.rfqId}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "shrink-0 text-xs",
                  thread.completeness === "COMPLETE" && "text-success",
                  thread.completeness === "PARTIAL" && "text-warning",
                  thread.completeness === "AWAITING" && "text-ink-tertiary",
                )}
              >
                {thread.completeness === "COMPLETE" ? "✓" : thread.completeness === "PARTIAL" ? "⚠" : "○"}
              </span>
            </button>
          );
        })}
      </div>
      <div className="bg-surface p-4">
        <div className="thin-scrollbar mb-4 max-h-64 space-y-2 overflow-y-auto">
          {selected.messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "rounded-md px-3 py-2 text-sm",
                message.sender === "ELECON" ? "bg-canvas text-ink-secondary" : "bg-surface-raised text-ink-primary",
              )}
            >
              <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">
                {message.sender === "ELECON" ? "Elecon" : "Supplier"}
              </p>
              <p>{message.body}</p>
              <p className="mt-1 text-[11px] text-ink-tertiary">{formatDateTime(message.sentAt)}</p>
            </div>
          ))}
        </div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ai">AI-extracted response</p>
        <ul className="space-y-1.5">
          {selected.extractedFields.map((field) => (
            <li key={field.field} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-ink-secondary">
                {FIELD_STATUS_ICON[field.status]}
                {field.label}
              </span>
              <span className="text-ink-primary">{field.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}