"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { prWorkspaceTabs } from "@/lib/constants/routes";

export interface PRWorkspaceTabsProps {
  prNumber: string;
}

/**
 * Horizontal tab strip scoped to one PR workspace (Overview / Requirement /
 * Sourcing / Communication / Quotes / Decision / Approval / Timeline). This
 * is navigation, not domain content — it stays in components/layout rather
 * than components/procurement, which is reserved for data-rendering
 * components that arrive in Phase 1.
 */
export function PRWorkspaceTabs({ prNumber }: PRWorkspaceTabsProps) {
  const pathname = usePathname();
  const tabs = prWorkspaceTabs(prNumber);

  return (
    <nav aria-label="PR workspace sections" className="thin-scrollbar mb-6 overflow-x-auto border-b border-border">
      <ul className="flex min-w-max gap-1">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors duration-150",
                  active
                    ? "border-brand font-medium text-ink-primary"
                    : "border-transparent text-ink-secondary hover:text-ink-primary",
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}