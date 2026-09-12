import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Building2,
  Compass,
  FileStack,
  FileText,
  Handshake,
  Inbox,
  Search,
  Send,
  Settings,
  Sparkles,
  Truck,
} from "lucide-react";
import type { NavCounts } from "@/types/procurement";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  group?: string;
  utility?: boolean;
  /** Key into NavCounts for a live badge count — resolved at render time
   *  by Sidebar, never hardcoded here. */
  countKey?: keyof NavCounts;
}

/**
 * Groups mirror the reference screenshot's sidebar (PROCUREMENT / SOURCING
 * / QUOTES / FULFILMENT / SYSTEM). The status-filtered items — Awaiting
 * Supplier, Awaiting Decision, Exceptions — route to the *same*
 * /requisitions page as PR Queue, pre-filtered via a query param, per
 * docs/architecture/information-architecture.md: this keeps the visual
 * shortcut the screenshot expects without the route proliferation that
 * doc explicitly argues against.
 */
export const PRIMARY_NAV: NavItem[] = [
  { label: "Command Center", href: "/dashboard", icon: Compass },

  { label: "PR Queue", href: "/requisitions", icon: FileStack, group: "Procurement", countKey: "prQueue" },
  { label: "Awaiting Supplier", href: "/requisitions?filter=awaiting-supplier", icon: Send, group: "Procurement", countKey: "awaitingSupplier" },
  { label: "Awaiting Decision", href: "/requisitions?filter=awaiting-decision", icon: Inbox, group: "Procurement", countKey: "awaitingDecision" },
  { label: "Exceptions", href: "/requisitions?filter=exceptions", icon: Sparkles, group: "Procurement", countKey: "exceptions" },

  { label: "Active RFQs", href: "/rfqs", icon: Send, group: "Sourcing" },
  { label: "Supplier Inbox", href: "/rfqs?view=inbox", icon: Inbox, group: "Sourcing", countKey: "supplierInbox" },
  { label: "Negotiations", href: "/rfqs?view=negotiations", icon: Handshake, group: "Sourcing" },

  { label: "Quote Inbox", href: "/quotes", icon: FileText, group: "Quotes" },
  { label: "Comparisons", href: "/quotes?view=comparisons", icon: FileText, group: "Quotes" },

  { label: "Suppliers", href: "/suppliers", icon: Building2, group: "Fulfilment" },
  { label: "Purchase Orders", href: "/purchase-orders", icon: FileText, group: "Fulfilment" },
  { label: "Deliveries", href: "/deliveries", icon: Truck, group: "Fulfilment" },

  { label: "AI Activity", href: "/ai", icon: Sparkles, group: "System" },
  { label: "Settings", href: "/settings", icon: Settings, group: "System" },
];

export const UTILITY_NAV: NavItem[] = [
  { label: "Notifications", href: "/notifications", icon: Bell, utility: true },
  { label: "Search", href: "/search", icon: Search, utility: true },
];

export const ALL_NAV: NavItem[] = [...PRIMARY_NAV, ...UTILITY_NAV];

export const NAV_GROUP_ORDER = ["Procurement", "Sourcing", "Quotes", "Fulfilment", "System"] as const;

export function navItemsByGroup(group: (typeof NAV_GROUP_ORDER)[number]): NavItem[] {
  return PRIMARY_NAV.filter((item) => item.group === group);
}

export function ungroupedNavItems(): NavItem[] {
  return PRIMARY_NAV.filter((item) => !item.group);
}

/** Active-match compares the pathname only — a nav item that carries a
 *  query string (e.g. a status filter) is still "active" whenever the
 *  base route matches, since the base route is what the sidebar highlight
 *  should track, not the specific filter selection. */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  const base = item.href.split("?")[0]!;
  if (base === "/dashboard") return pathname === "/dashboard";
  return pathname === base || pathname.startsWith(`${base}/`);
}