import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { getQuoteComparisonFor, listQuotes, listRequisitions } from "@/lib/api/queries";
import { formatMoney } from "@/lib/utils/format";
import { routes } from "@/lib/constants/routes";

export const metadata = { title: "Quotes" };

const VIEWS = [
  { value: "inbox", label: "Quote Inbox" },
  { value: "comparisons", label: "Comparisons" },
];

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view: rawView } = await searchParams;
  const view = rawView === "comparisons" ? "comparisons" : "inbox";

  const [quotes, requisitions] = await Promise.all([
    listQuotes(),
    listRequisitions("all"),
  ]);

  // Group quotes by PR
  const quotesByPR = quotes.reduce((acc, quote) => {
    const prId = quote.prId;
    if (!acc[prId]) {
      const req = requisitions.find((r) => r.id === prId);
      acc[prId] = {
        prNumber: req?.prNumber ?? "",
        materialName: req?.material?.materialName ?? "Unknown Material",
        quotes: [],
      };
    }
    // Use non-null assertion (!) since we guarantee it exists after the if block
    acc[prId]!.quotes.push(quote);
    return acc;
  }, {} as Record<string, { prNumber: string; materialName: string; quotes: typeof quotes }>);

  // Get PRs with quotes
  const prsWithQuotes = Object.entries(quotesByPR).map(([prId, data]) => ({
    prId,
    prNumber: data.prNumber,
    materialName: data.materialName,
    quoteCount: data.quotes.length,
    suppliers: data.quotes.map((q) => q.supplierName).join(", "),
  }));

  // For comparisons view
  const comparisonCandidates = requisitions.filter((pr) =>
    quotes.some((quote) => quote.prId === pr.id),
  );

  const comparisonPairs = await Promise.all(
    comparisonCandidates.map(async (pr) => ({
      pr,
      comparison: await getQuoteComparisonFor(pr.prNumber),
    })),
  );

  const prsWithComparisons = comparisonPairs
    .filter((entry) => entry.comparison)
    .map((entry) => ({
      pr: entry.pr,
      comparison: entry.comparison!,
    }));

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Quotes", href: routes.quotes() }]}
        title="Quotes"
      />

      <div className="mb-4 flex gap-1 border-b border-border">
        {VIEWS.map((v) => (
          <Link
            key={v.value}
            href={
              v.value === "inbox"
                ? routes.quotes()
                : `${routes.quotes()}?view=${v.value}`
            }
            className={`border-b-2 px-3 py-2 text-sm transition-colors duration-150 ${
              v.value === view
                ? "border-brand font-medium text-ink-primary"
                : "border-transparent text-ink-secondary hover:text-ink-primary"
            }`}
          >
            {v.label}
          </Link>
        ))}
      </div>

      {view === "inbox" ? (
        <div className="rounded-lg border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-tertiary">
                <th className="px-4 py-2.5 font-semibold">PR</th>
                <th className="px-4 py-2.5 font-semibold">Material</th>
                <th className="px-4 py-2.5 font-semibold">Suppliers</th>
                <th className="px-4 py-2.5 text-right font-semibold">Quotes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {prsWithQuotes.map((pr) => (
                <tr key={pr.prId} className="hover:bg-surface-raised">
                  <td className="px-4 py-3">
                    <Link
                      href={routes.requisitionQuotes(pr.prNumber)}
                      className="entity-code font-medium text-ink-primary hover:text-brand"
                    >
                      {pr.prNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-primary">{pr.materialName}</td>
                  <td className="px-4 py-3 text-ink-secondary">{pr.suppliers}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink-secondary">
                    {pr.quoteCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-tertiary">
                <th className="px-4 py-2.5 font-semibold">PR</th>
                <th className="px-4 py-2.5 font-semibold">Item</th>
                <th className="px-4 py-2.5 text-right font-semibold">Suppliers</th>
                <th className="px-4 py-2.5 font-semibold">AI result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {prsWithComparisons.map(({ pr, comparison }) => {
                const top = [...comparison.rows].sort(
                  (a, b) => b.deterministicScore - a.deterministicScore,
                )[0]!;
                return (
                  <tr key={pr.id} className="hover:bg-surface-raised">
                    <td className="px-4 py-3">
                      <Link
                        href={`${routes.requisitionQuotes(pr.prNumber)}?view=comparison`}
                        className="entity-code font-medium text-ink-primary hover:text-brand"
                      >
                        {pr.prNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-primary">
                      {pr.material.materialName}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-secondary">
                      {comparison.rows.length}
                    </td>
                    <td className="px-4 py-3 text-ai">
                      {top.quote.supplierName} · {top.deterministicScore.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}