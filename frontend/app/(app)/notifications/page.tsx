import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { listNotifications } from "@/lib/api/queries";
import { formatRelativeTime } from "@/lib/utils/format";
import { routes } from "@/lib/constants/routes";
import type { NotificationSeverity } from "@/types/common";

const SEVERITY_TONE: Record<NotificationSeverity, "danger" | "warning" | "info" | "success" | "neutral" | "ai"> = {
  ACTION_REQUIRED: "danger",
  WARNING: "warning",
  RISK: "warning",
  FINANCIAL: "info",
  SYSTEM: "neutral",
  INFORMATION: "ai",
};

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const notifications = await listNotifications();

  return (
    <div>
      <PageHeader breadcrumbs={[{ label: "Notifications", href: routes.notifications() }]} title="Notifications" />
      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        {notifications.map((n) => (
          <Link key={n.id} href={n.entityHref ?? "#"} className={`flex items-start gap-3 px-5 py-3.5 hover:bg-surface-raised ${!n.read ? "bg-canvas/40" : ""}`}>
            <Badge tone={SEVERITY_TONE[n.severity]} className="mt-0.5 shrink-0">
              {n.severity.replace("_", " ").toLowerCase()}
            </Badge>
            <div className="min-w-0 flex-1">
              <p className={`text-sm ${n.read ? "text-ink-secondary" : "font-medium text-ink-primary"}`}>{n.title}</p>
              <p className="mt-0.5 text-sm text-ink-tertiary">{n.message}</p>
            </div>
            <span className="shrink-0 text-xs text-ink-tertiary">{formatRelativeTime(n.createdAt, new Date("2026-09-04T11:30:00+05:30"))}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

