/**
 * Centralized, typed route builders. Every link to a dynamic route in this
 * app should be built here rather than string-templated at the call site —
 * it keeps the route shape (and any future param renaming) in one place.
 */
export const routes = {
  login: () => "/login",
  dashboard: () => "/dashboard",

  requisitions: () => "/requisitions",
  requisition: (prNumber: string) => `/requisitions/${prNumber}`,
  requisitionRequirement: (prNumber: string) => `/requisitions/${prNumber}/requirement`,
  requisitionSourcing: (prNumber: string) => `/requisitions/${prNumber}/sourcing`,
  requisitionCommunication: (prNumber: string) => `/requisitions/${prNumber}/communication`,
  requisitionQuotes: (prNumber: string) => `/requisitions/${prNumber}/quotes`,
  requisitionDecision: (prNumber: string) => `/requisitions/${prNumber}/decision`,
  requisitionApproval: (prNumber: string) => `/requisitions/${prNumber}/approval`,
  requisitionTimeline: (prNumber: string) => `/requisitions/${prNumber}/timeline`,

  suppliers: () => "/suppliers",
  supplier: (slug: string) => `/suppliers/${slug}`,

  rfqs: () => "/rfqs",
  rfq: (slug: string) => `/rfqs/${slug}`,

  quotes: () => "/quotes",
  quote: (slug: string) => `/quotes/${slug}`,

  purchaseOrders: () => "/purchase-orders",
  purchaseOrder: (poNumber: string) => `/purchase-orders/${poNumber}`,

  deliveries: () => "/deliveries",
  delivery: (slug: string) => `/deliveries/${slug}`,

  notifications: () => "/notifications",
  search: () => "/search",
  ai: () => "/ai",
  settings: () => "/settings",
} as const;

/** The seven tabs inside a PR Workspace, in display order — used by both
 *  the workspace's tab bar and Breadcrumbs. */
export function prWorkspaceTabs(prNumber: string) {
  return [
    { label: "Overview", href: routes.requisition(prNumber) },
    { label: "Requirement", href: routes.requisitionRequirement(prNumber) },
    { label: "Sourcing", href: routes.requisitionSourcing(prNumber) },
    { label: "Communication", href: routes.requisitionCommunication(prNumber) },
    { label: "Quotes", href: routes.requisitionQuotes(prNumber) },
    { label: "Decision", href: routes.requisitionDecision(prNumber) },
    { label: "Approval", href: routes.requisitionApproval(prNumber) },
    { label: "Timeline", href: routes.requisitionTimeline(prNumber) },
  ];
}
