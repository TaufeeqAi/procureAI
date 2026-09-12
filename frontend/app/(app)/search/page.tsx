import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/states";
import { search } from "@/lib/api/queries";
import { routes } from "@/lib/constants/routes";

export const metadata = { title: "Search" };

/**
 * A plain GET form — no client JavaScript required for the core
 * interaction. The query lives in the URL (?q=...), so results are
 * shareable and the back button works correctly, unlike a client-only
 * controlled input would give by default.
 */
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const results = await search(q);
  const hasResults = results.requisitions.length + results.suppliers.length + results.purchaseOrders.length + results.quotes.length > 0;

  return (
    <div>
      <PageHeader breadcrumbs={[{ label: "Search", href: routes.search() }]} title="Search" />

      <form action={routes.search()} method="get" className="mb-6">
        <div className="flex items-center gap-2 rounded-md border border-border-strong bg-surface px-3 py-2.5">
          <SearchIcon className="h-4 w-4 text-ink-tertiary" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search PR, supplier, material, PO…"
            className="flex-1 bg-transparent text-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none"
            autoFocus
          />
        </div>
      </form>

      {!q ? (
        <EmptyState title="Search across procurement" description="Try a PR number, supplier name, part code, or PO number." />
      ) : !hasResults ? (
        <EmptyState title={`No results for "${q}"`} />
      ) : (
        <div className="space-y-6">
          {results.requisitions.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">Purchase requisitions</h2>
              <ul className="space-y-1">
                {results.requisitions.map((pr) => (
                  <li key={pr.id}>
                    <Link href={routes.requisition(pr.prNumber)} className="text-sm text-ai hover:underline">
                      {pr.prNumber} — {pr.material.materialName}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {results.suppliers.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">Suppliers</h2>
              <ul className="space-y-1">
                {results.suppliers.map((s) => (
                  <li key={s.id}>
                    <Link href={routes.supplier(s.code)} className="text-sm text-ai hover:underline">
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {results.purchaseOrders.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">Purchase orders</h2>
              <ul className="space-y-1">
                {results.purchaseOrders.map((po) => (
                  <li key={po.id}>
                    <Link href={routes.purchaseOrder(po.poNumber)} className="text-sm text-ai hover:underline">
                      {po.poNumber} — {po.supplierName}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {results.quotes.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">Quotes</h2>
              <ul className="space-y-1">
                {results.quotes.map((q) => (
                  <li key={q.id}>
                    <Link href={routes.quote(q.quoteReference)} className="text-sm text-ai hover:underline">
                      {q.quoteReference} — {q.supplierName}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

