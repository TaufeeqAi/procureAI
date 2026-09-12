"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  children: (activeValue: string) => ReactNode;
  className?: string;
}

/**
 * A small uncontrolled-or-controlled tab strip for in-page filters (PR
 * Queue's All / My Queue / Exceptions, Purchase Orders' status filter).
 * Distinct from PRWorkspaceTabs, which is URL-driven navigation between
 * real routes — these tabs filter data on one page and never change the
 * URL, so they're a plain client state primitive, not a routing concern.
 */
export function Tabs({ items, defaultValue, value, onChange, children, className }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? items[0]?.value ?? "");
  const active = value ?? internalValue;

  function select(next: string) {
    if (value === undefined) setInternalValue(next);
    onChange?.(next);
  }

  return (
    <div className={className}>
      <div role="tablist" className="mb-4 flex flex-wrap gap-1 border-b border-border">
        {items.map((item) => {
          const isActive = item.value === active;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => select(item.value)}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors duration-150",
                isActive
                  ? "border-brand font-medium text-ink-primary"
                  : "border-transparent text-ink-secondary hover:text-ink-primary",
              )}
            >
              {item.label}
              {item.count !== undefined && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[11px] tabular-nums",
                    isActive ? "bg-brand-subtle text-brand" : "bg-surface-raised text-ink-tertiary",
                  )}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {children(active)}
    </div>
  );
}
