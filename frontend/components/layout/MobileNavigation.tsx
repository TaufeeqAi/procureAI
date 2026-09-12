"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ALL_NAV, isNavItemActive } from "@/lib/constants/nav";
import type { NavCounts } from "@/types/procurement";

export interface MobileNavigationProps {
  open: boolean;
  onClose: () => void;
  counts: NavCounts;
}

export function MobileNavigation({ open, onClose, counts }: MobileNavigationProps) {
  const pathname = usePathname();

  return (
    <div className={cn("fixed inset-0 z-40 md:hidden", open ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!open}>
      <div onClick={onClose} className={cn("absolute inset-0 bg-black/60 transition-opacity duration-150", open ? "opacity-100" : "opacity-0")} />

      <nav
        aria-label="Primary"
        className={cn(
          "absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar shadow-overlay transition-transform duration-150",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <span className="text-sm font-semibold text-ink-primary">Elecon Procurement AI</span>
          <button type="button" onClick={onClose} aria-label="Close navigation" className="rounded-md p-1.5 text-ink-secondary hover:bg-surface-raised">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <ul className="thin-scrollbar flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {ALL_NAV.map((item) => {
            const active = isNavItemActive(item, pathname);
            const Icon = item.icon;
            const count = item.countKey ? counts[item.countKey] : undefined;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-sm transition-colors duration-150",
                    active ? "bg-brand-subtle font-medium text-brand-strong" : "text-ink-secondary hover:bg-surface-raised",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="flex-1">{item.label}</span>
                  {count !== undefined && <span className="tabular-nums text-xs text-ink-tertiary">{count}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
