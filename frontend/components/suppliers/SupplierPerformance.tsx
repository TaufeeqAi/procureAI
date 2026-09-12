import { Progress } from "@/components/ui/Progress";
import { formatDate, formatMoney } from "@/lib/utils/format";
import type { SupplierPerformanceMetrics, SupplierPerformanceTrends, SupplierPricePoint, SupplierTransaction } from "@/types/supplier";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";

const TREND_ICON = {
  IMPROVING: <ArrowUp className="h-3 w-3 text-success" />,
  STABLE: <ArrowRight className="h-3 w-3 text-ink-tertiary" />,
  DECLINING: <ArrowDown className="h-3 w-3 text-danger" />,
};

export function SupplierPerformancePanel({
  performance,
  trends,
}: {
  performance: SupplierPerformanceMetrics;
  trends: SupplierPerformanceTrends;
}) {
  const rows: { label: string; value: number; trend: keyof SupplierPerformanceTrends }[] = [
    { label: "Delivery", value: performance.onTimeDeliveryRate, trend: "delivery" },
    { label: "Quality", value: performance.qualityAcceptanceRate, trend: "quality" },
    { label: "Response", value: performance.responseRate, trend: "quality" },
  ];

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-xs text-ink-secondary">{row.label}</span>
          <Progress value={row.value} tone="success" className="flex-1" label={row.label} />
          <span className="flex w-16 shrink-0 items-center justify-end gap-1 text-xs tabular-nums text-ink-tertiary">
            {(row.value * 100).toFixed(0)}% {TREND_ICON[trends[row.trend]]}
          </span>
        </div>
      ))}
      <p className="text-[11px] text-ink-tertiary">
        Sample: {performance.sampleSizeTransactions} transactions
        {performance.sampleSizeUnits ? `, ${performance.sampleSizeUnits} units` : ""} · measured {formatDate(performance.measuredAt)}
      </p>
    </div>
  );
}

export function SupplierPriceHistoryTable({ history }: { history: SupplierPricePoint[] }) {
  if (history.length === 0) return <p className="text-sm text-ink-tertiary">No price history recorded.</p>;
  return (
    <table className="w-full text-sm">
      <tbody className="divide-y divide-border">
        {history.map((point) => (
          <tr key={point.poReference}>
            <td className="py-2 text-ink-secondary">{formatDate(point.date)}</td>
            <td className="entity-code py-2 text-ink-tertiary">{point.poReference}</td>
            <td className="py-2 text-right tabular-nums font-medium text-ink-primary">{formatMoney(point.unitPrice)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function SupplierTransactionsTable({ transactions }: { transactions: SupplierTransaction[] }) {
  if (transactions.length === 0) return <p className="text-sm text-ink-tertiary">No recent transactions recorded.</p>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-tertiary">
          <th className="py-2 font-semibold">PO</th>
          <th className="py-2 font-semibold">Material</th>
          <th className="py-2 text-right font-semibold">Price</th>
          <th className="py-2 text-right font-semibold">Delivery</th>
          <th className="py-2 text-right font-semibold">Quality</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {transactions.map((t) => (
          <tr key={t.id}>
            <td className="entity-code py-2.5 text-ink-tertiary">{t.poReference}</td>
            <td className="py-2.5 text-ink-primary">{t.materialName}</td>
            <td className="py-2.5 text-right tabular-nums text-ink-secondary">{formatMoney(t.unitPrice)}</td>
            <td className="py-2.5 text-right">
              <span className={t.deliveredOnTime ? "text-success" : "text-danger"}>{t.deliveredOnTime ? "On time" : "Late"}</span>
            </td>
            <td className="py-2.5 text-right">
              <span className={t.qualityAccepted ? "text-success" : "text-danger"}>{t.qualityAccepted ? "Accepted" : "Rejected"}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
