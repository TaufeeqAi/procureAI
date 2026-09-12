import type { ISODate, ISODateTime, Money } from "@/types/common";

const CURRENCY_LOCALE: Record<Money["currency"], string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "en-IE",
};

/**
 * Format a `Money` value using its own currency's locale conventions
 * (e.g. INR renders with the Indian digit-grouping convention: ₹2,36,000).
 * Never hardcode a currency symbol or grouping pattern outside this
 * function — every displayed amount must come from here.
 */
export function formatMoney(money: Money, options?: { maximumFractionDigits?: number }): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE[money.currency], {
    style: "currency",
    currency: money.currency,
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
  }).format(money.amount);
}

/** Compact form for dashboard tiles, e.g. "₹18.4L" style abbreviation for INR. */
export function formatMoneyCompact(money: Money): string {
  if (money.currency === "INR") {
    const { amount } = money;
    if (Math.abs(amount) >= 1_00_00_000) {
      return `₹${(amount / 1_00_00_000).toFixed(2)}Cr`;
    }
    if (Math.abs(amount) >= 1_00_000) {
      return `₹${(amount / 1_00_000).toFixed(1)}L`;
    }
    return formatMoney(money);
  }
  return new Intl.NumberFormat(CURRENCY_LOCALE[money.currency], {
    style: "currency",
    currency: money.currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(money.amount);
}

export function formatDate(value: ISODate | ISODateTime, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  }).format(new Date(value));
}

export function formatDateTime(value: ISODateTime): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatPercent(fraction: number, options?: { maximumFractionDigits?: number }): string {
  return new Intl.NumberFormat("en-IN", {
    style: "percent",
    maximumFractionDigits: options?.maximumFractionDigits ?? 1,
  }).format(fraction);
}

/** Relative time for activity feeds, e.g. "12 minutes ago". Falls back to
 *  an absolute date beyond 24 hours so stale-looking relative times don't
 *  linger in a procurement audit context. */
export function formatRelativeTime(value: ISODateTime, now: Date = new Date()): string {
  const then = new Date(value);
  const diffMs = now.getTime() - then.getTime();
  const diffMinutes = Math.round(diffMs / 60_000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  return formatDate(value);
}
