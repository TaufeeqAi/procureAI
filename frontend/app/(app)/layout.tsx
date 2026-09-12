import { AppShell } from "@/components/layout/AppShell";
import { getNavCounts, listNotifications } from "@/lib/api/queries";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  // Fetched here (a Server Component) rather than inside AppShell itself,
  // which is a Client Component — this is the seam Phase 3 replaces with
  // a real request, without AppShell/Sidebar/Header needing to change.
  const [counts, notifications] = await Promise.all([getNavCounts(), listNotifications()]);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <AppShell counts={counts} unreadNotifications={unread}>
      {children}
    </AppShell>
  );
}

