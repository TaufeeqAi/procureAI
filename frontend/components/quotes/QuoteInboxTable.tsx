// frontend/components/quotes/QuoteInboxTable.tsx

import Link from "next/link";
import { formatMoney } from "@/lib/utils/format";
import { routes } from "@/lib/constants/routes";
import type { Quote } from "@/types/quote";

interface QuoteInboxTableProps {
  quotes: Quote[];
  prNumber: string;
}

export function QuoteInboxTable({ quotes, prNumber }: QuoteInboxTableProps) {
  if (quotes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border-strong bg-surface px-6 py-10 text-center">
        <p className="text-sm font-medium text-ink-primary">No quotes received yet</p>
        <p className="mt-1 text-sm text-ink-secondary">
          Quotes will appear here once suppliers respond to the RFQ.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-tertiary">
            <th className="px-4 py-2.5 font-semibold">Quote</th>
            <th className="px-4 py-2.5 font-semibold">Supplier</th>
            <th className="px-4 py-2.5 text-right font-semibold">Unit price</th>
            <th className="px-4 py-2.5 text-right font-semibold">Freight</th>
            <th className="px-4 py-2.5 text-right font-semibold">Lead time</th>
            <th className="px-4 py-2.5 text-right font-semibold">Validity</th>
            <th className="px-4 py-2.5 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {quotes.map((quote) => (
            <tr key={quote.id} className="hover:bg-surface-raised">
              <td className="px-4 py-3">
                <Link
                  href={routes.quote(quote.quoteReference)}
                  className="entity-code font-medium text-ink-primary hover:text-brand"
                >
                  {quote.quoteReference}
                </Link>
              </td>
              <td className="px-4 py-3 text-ink-primary">
                {quote.supplierName}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-ink-secondary">
                {formatMoney(quote.unitPrice)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-ink-secondary">
                {formatMoney(quote.freight)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-ink-secondary">
                {quote.leadTimeDays} days
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-ink-secondary">
                {quote.validityDays} days
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                    quote.validationStatus === "VALID"
                      ? "bg-success-subtle text-success"
                      : quote.validationStatus === "NEEDS_REVIEW"
                      ? "bg-warning-subtle text-warning"
                      : "bg-danger-subtle text-danger"
                  }`}
                >
                  {quote.validationStatus.replace("_", " ").toLowerCase()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}