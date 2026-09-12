"use client";

import { useState, type ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import type { NavCounts } from "@/types/procurement";

export interface AppShellProps {
  children: ReactNode;
  counts: NavCounts;
  unreadNotifications: number;
}

/**
 * Full-width Header on top; Sidebar + main content as a row beneath it.
 * `counts` and `unreadNotifications` are fetched server-side in
 * app/(app)/layout.tsx and passed down — this client component never
 * reaches into the mock data layer itself, so swapping the data source in
 * Phase 3 touches the layout, not the shell.
 */
export function AppShell({ children, counts, unreadNotifications }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas">
      <Header onMenuClick={() => setMobileNavOpen(true)} unreadNotifications={unreadNotifications} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar counts={counts} />
        <MobileNavigation open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} counts={counts} />

        <main className="thin-scrollbar flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8 md:py-7">{children}</div>
        </main>
      </div>
    </div>
  );
}
