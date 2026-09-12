import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { RiskBadge } from "@/components/procurement/badges";
import { Badge } from "@/components/ui/Badge";
import { SupplierScorecard } from "@/components/suppliers/SupplierScorecard";
import { SupplierPerformancePanel, SupplierPriceHistoryTable, SupplierTransactionsTable } from "@/components/suppliers/SupplierPerformance";
import { getSupplierDetailBySlug } from "@/lib/api/queries";
import { routes } from "@/lib/constants/routes";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: slug };
}

export default async function SupplierDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // ✅ FIXED: getSupplierDetailBySlug is async in lib/api/queries.ts —
  // without `await`, `detail` was a Promise (always truthy), so the
  // notFound() guard never fired and destructuring yielded undefined
  // fields, crashing on `supplier.name`.
  const detail = await getSupplierDetailBySlug(slug);
  if (!detail) notFound();

  const { supplier, performance, scoreBreakdown, trends, priceHistory, recentTransactions } = detail;

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Suppliers", href: routes.suppliers() }, { label: supplier.name }]}
        title={supplier.name}
        status={
          <div className="flex items-center gap-1.5">
            <Badge tone={supplier.approvalStatus === "APPROVED" ? "success" : "warning"}>{supplier.approvalStatus.replace("_", " ")}</Badge>
            <RiskBadge level={supplier.riskLevel} />
          </div>
        }
        description={supplier.categories.join(", ")}
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface px-5 py-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-secondary">Score breakdown</h2>
          <SupplierScorecard score={scoreBreakdown} />
        </div>
        <div className="rounded-lg border border-border bg-surface px-5 py-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-secondary">Performance</h2>
          <SupplierPerformancePanel performance={performance} trends={trends} />
        </div>
        <div className="rounded-lg border border-border bg-surface px-5 py-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-secondary">Price history</h2>
          <SupplierPriceHistoryTable history={priceHistory} />
        </div>
        <div className="rounded-lg border border-border bg-surface px-5 py-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-secondary">Recent transactions</h2>
          <SupplierTransactionsTable transactions={recentTransactions} />
        </div>
      </div>
    </div>
  );
}