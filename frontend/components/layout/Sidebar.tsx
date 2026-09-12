"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { NAV_GROUP_ORDER, isNavItemActive, navItemsByGroup, ungroupedNavItems } from "@/lib/constants/nav";
import type { NavCounts } from "@/types/procurement";

export interface SidebarProps {
  counts: NavCounts;
}

const GROUP_LABELS: Record<(typeof NAV_GROUP_ORDER)[number], string> = {
  Procurement: "Procurement",
  Sourcing: "Sourcing",
  Quotes: "Quotes",
  Fulfilment: "Fulfilment",
  System: "System",
};

/**
 * Persistent on desktop, hidden on mobile in favor of MobileNavigation.
 * Counts are passed in from the server (see app/(app)/layout.tsx) rather
 * than computed here — a client component reaching into the mock data
 * layer directly would make the eventual API swap touch this file too.
 */
export function Sidebar({ counts }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside aria-label="Primary" className="hidden w-60 shrink-0 flex-col overflow-y-auto border-r border-border bg-sidebar md:flex">
      <nav className="thin-scrollbar flex-1 px-3 py-4">
        <ul className="mb-4 space-y-0.5">
          {ungroupedNavItems().map((item) => {
            const active = isNavItemActive(item, pathname);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors duration-150",
                    active ? "bg-surface-raised font-medium text-ink-primary" : "text-ink-secondary hover:bg-surface-raised hover:text-ink-primary",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {NAV_GROUP_ORDER.map((group) => {
          const items = navItemsByGroup(group);
          if (items.length === 0) return null;

          return (
            <div key={group} className="mb-5 last:mb-0">
              <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary">
                {GROUP_LABELS[group]}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = isNavItemActive(item, pathname);
                  const Icon = item.icon;
                  const count = item.countKey ? counts[item.countKey] : undefined;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors duration-150",
                          active
                            ? "bg-brand-subtle font-medium text-brand-strong"
                            : "text-ink-secondary hover:bg-surface-raised hover:text-ink-primary",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="flex-1">{item.label}</span>
                        {count !== undefined && (
                          <span className="tabular-nums text-xs text-ink-tertiary">{count}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
