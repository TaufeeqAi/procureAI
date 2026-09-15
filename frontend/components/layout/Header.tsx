"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Menu, Search } from "lucide-react";
import { currentUser } from "@/lib/mock";
import { routes } from "@/lib/constants/routes";
import { ProcurementAIChat } from "@/components/ai/ProcurementAIChat";

export interface HeaderProps {
  onMenuClick: () => void;
  unreadNotifications: number;
}

function initials(name: string): string {
  return name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

export function Header({ onMenuClick, unreadNotifications }: HeaderProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-sidebar px-4 md:px-5">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onMenuClick} aria-label="Open navigation" className="rounded-md p-1.5 text-ink-secondary hover:bg-surface-raised md:hidden">
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand text-xs font-bold text-ink-inverse">E</div>
            <span className="hidden text-[13px] font-semibold uppercase tracking-wide text-ink-primary sm:inline">
              Elecon Procurement AI
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={routes.search()}
            className="hidden items-center gap-2 rounded-md border border-border-strong bg-canvas px-3 py-1.5 text-sm text-ink-tertiary hover:border-ink-tertiary sm:flex"
          >
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Search</span>
            <kbd className="ml-4 rounded border border-border-strong px-1 font-mono text-[10px] text-ink-tertiary">⌘K</kbd>
          </Link>

          <Link href={routes.notifications()} aria-label="Notifications" className="relative rounded-md p-2 text-ink-secondary hover:bg-surface-raised">
            <Bell className="h-4.5 w-4.5" />
            {unreadNotifications > 0 && (
              <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-ink-inverse">
                {unreadNotifications}
              </span>
            )}
          </Link>

          <button
            onClick={() => setIsChatOpen(true)}
            className="hidden items-center gap-1.5 rounded-md bg-surface-raised px-2.5 py-1 text-xs font-medium text-ink-secondary transition-colors hover:bg-surface hover:text-ai lg:flex"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-ai" aria-hidden="true" />
            Procurement AI
          </button>

          <Link href={routes.settings()} className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-ink-inverse">
            {initials(currentUser.name)}
          </Link>
        </div>
      </header>

      {/* Delegate chat logic to the dedicated component */}
      <ProcurementAIChat open={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}