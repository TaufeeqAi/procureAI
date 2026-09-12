import { RiskBadge } from "@/components/procurement/badges";
import { formatMoney } from "@/lib/utils/format";
import type { QuoteComparisonRow } from "@/types/quote";

/**
 * The main analytical screen's table. `landedCost` is never recalculated
 * here — it arrives already computed via lib/utils/pricing.ts so this
 * component can't introduce a second, possibly-inconsistent total.
 */
export function QuoteComparisonTable({ rows }: { rows: QuoteComparisonRow[] }) {
  const suppliers = rows.map((r) => r.quote.supplierName);

  const metricRows: { label: string; render: (row: QuoteComparisonRow) => React.ReactNode }[] = [
    { label: "Unit price", render: (r) => formatMoney(r.quote.unitPrice) },
    { label: "Quantity", render: (r) => r.quote.quantity },
    { label: "Freight", render: (r) => formatMoney(r.quote.freight) },
    { label: "Lead time", render: (r) => `${r.quote.leadTimeDays} days` },
    { label: "Payment", render: (r) => `${r.quote.paymentTermsDays} days` },
    { label: "Quality", render: (r) => `${(r.qualityAcceptanceRate * 100).toFixed(1)}%` },
    { label: "OTD", render: (r) => `${(r.onTimeDeliveryRate * 100).toFixed(0)}%` },
    { label: "Risk", render: (r) => <RiskBadge level={r.riskLevel} /> },
  ];

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-border bg-canvas text-left text-[11px] uppercase tracking-wide text-ink-tertiary">
            <th className="px-4 py-2.5 font-semibold">Metric</th>
            {suppliers.map((name) => (
              <th key={name} className="px-4 py-2.5 text-right font-semibold text-ink-secondary">
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {metricRows.map((metric) => (
            <tr key={metric.label}>
              <td className="px-4 py-2.5 text-ink-tertiary">{metric.label}</td>
              {rows.map((row) => (
                <td key={row.quote.id} className="px-4 py-2.5 text-right tabular-nums text-ink-primary">
                  {metric.render(row)}
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-t-2 border-border-strong bg-canvas font-medium">
            <td className="px-4 py-3 text-ink-primary">Landed cost</td>
            {rows.map((row) => (
              <td key={row.quote.id} className="px-4 py-3 text-right tabular-nums text-ink-primary">
                {formatMoney(row.landedCost.total)}
              </td>
            ))}
          </tr>
          <tr>
            <td className="px-4 py-2.5 text-ink-tertiary">AI score</td>
            {rows.map((row) => (
              <td key={row.quote.id} className="px-4 py-2.5 text-right tabular-nums text-ai">
                {row.deterministicScore.toFixed(1)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}