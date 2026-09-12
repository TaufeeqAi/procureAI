/**
 * Shared primitives used across every domain contract in this workspace.
 *
 * These types encode two rules that hold across the whole product:
 *
 * 1. Money is never a bare number. Every amount carries its currency and,
 *    where it matters, whether it is a stated fact, a calculated figure, or
 *    an AI-generated estimate — see `Provenance`.
 * 2. Every object a person can act on (approve, reject, override) carries
 *    enough provenance to answer "where did this come from?" without a
 *    follow-up query. See Section 16 / the Fact–Model–AI–Human separation
 *    in docs/architecture/design-system.md.
 */

/** ISO-8601 timestamp string, e.g. "2026-09-04T09:32:00+05:30". */
export type ISODateTime = string;

/** ISO-8601 calendar date string, e.g. "2026-09-25". */
export type ISODate = string;

export type CurrencyCode = "INR" | "USD" | "EUR";

export interface Money {
  currency: CurrencyCode;
  /** Amount in the currency's minor-agnostic decimal form, e.g. 236000.0 for ₹2,36,000. */
  amount: number;
}

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type ConfidenceBand = "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT_DATA";

/**
 * Distinguishes where a piece of data on screen came from. The UI must
 * render these differently (see components/ai/AIBadge and the Evidence
 * Panel) — an AI interpretation is never shown with the same visual
 * weight as a system-of-record fact.
 */
export type Provenance = "FACT" | "CALCULATED" | "AI_INTERPRETATION" | "HUMAN_DECISION";

export type ActorRole =
  | "BUYER"
  | "PURCHASE_MANAGER"
  | "SUPPLIER"
  | "IT_ADMIN"
  | "AUDITOR";

export interface Actor {
  id: string;
  name: string;
  role: ActorRole;
  /** Present only for role === "SUPPLIER". */
  supplierId?: string;
}

/** A single machine or human actor that produced a recommendation, sent a
 *  message, or performed an audited action. */
export type ActorType = "HUMAN" | "AI_AGENT";

export interface AgentActor {
  type: ActorType;
  /** Human actor id or AI agent identifier, e.g. "agent:procurement-analyst". */
  id: string;
  displayName: string;
  /** Present only for type === "AI_AGENT" — which model/prompt version produced this. */
  modelVersion?: string;
}

/**
 * A pointer to the underlying record(s) that support a claim shown on
 * screen — a price, a score, a risk flag. Every AI interpretation must be
 * traceable back to at least one EvidenceReference.
 */
export interface EvidenceReference {
  id: string;
  /** What kind of record this evidence points to. */
  type: "PURCHASE_ORDER" | "TRANSACTION" | "QUOTE" | "DELIVERY" | "QUALITY_EVENT" | "DOCUMENT";
  /** Human-readable label, e.g. "PO-2026-00192". */
  label: string;
  /** Route-relative link to the underlying record, when navigable. */
  href?: string;
  asOf: ISODateTime;
}

export interface AuditEvent {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actor: AgentActor;
  occurredAt: ISODateTime;
  metadata?: Record<string, unknown>;
}

export type NotificationSeverity =
  | "ACTION_REQUIRED"
  | "WARNING"
  | "RISK"
  | "FINANCIAL"
  | "SYSTEM"
  | "INFORMATION";

export interface NotificationEvent {
  id: string;
  severity: NotificationSeverity;
  title: string;
  message: string;
  entityHref?: string;
  createdAt: ISODateTime;
  read: boolean;
}

/** Generic paginated list envelope used by list-page contracts. */
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
}
