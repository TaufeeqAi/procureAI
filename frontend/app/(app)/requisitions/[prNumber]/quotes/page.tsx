import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { QuoteComparisonTable } from "@/components/quotes/QuoteComparisonTable";
import { QuoteInboxTable } from "@/components/quotes/QuoteInboxTable";
import { EmptyState } from "@/components/shared/states";
import { ButtonLink } from "@/components/ui/Button";
import { getRequisitionByNumber, getQuoteComparisonFor, getQuotesForPR } from "@/lib/api/queries";
import { routes } from "@/lib/constants/routes";

export async function generateMetadata({ params }: { params: Promise<{ prNumber: string }> }) {
  const { prNumber } = await params;
  return { title: `${prNumber} · Quotes` };
}

export default async function QuotesTabPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ prNumber: string }>; 
  searchParams?: Promise<{ view?: string }> 
}) {
  const { prNumber } = await params;
  const query = searchParams ? await searchParams : {};
  const view = query.view === "comparison" ? "comparison" : "inbox";

  const requisition = await getRequisitionByNumber(prNumber);
  if (!requisition) notFound();

  const comparison = await getQuoteComparisonFor(prNumber);
  const quotes = await getQuotesForPR(prNumber);

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Requisitions", href: routes.requisitions() },
          { label: prNumber, href: routes.requisition(prNumber) },
          { label: "Quotes" },
        ]}
        title="Quotes"
        actions={
          comparison && (
            <ButtonLink href={routes.requisitionDecision(prNumber)} size="sm">
              Open decision
            </ButtonLink>
          )
        }
      />

      <div className="mb-4 flex gap-1 border-b border-border">
        <Link
          href={routes.requisitionQuotes(prNumber)}
          className={`border-b-2 px-3 py-2 text-sm transition-colors duration-150 ${
            view === "inbox"
              ? "border-brand font-medium text-ink-primary"
              : "border-transparent text-ink-secondary hover:text-ink-primary"
          }`}
        >
          Quote Inbox ({quotes.length})
        </Link>
        <Link
          href={`${routes.requisitionQuotes(prNumber)}?view=comparison`}
          className={`border-b-2 px-3 py-2 text-sm transition-colors duration-150 ${
            view === "comparison"
              ? "border-brand font-medium text-ink-primary"
              : "border-transparent text-ink-secondary hover:text-ink-primary"
          }`}
        >
          Comparison
        </Link>
      </div>

      {!comparison || quotes.length === 0 ? (
        <EmptyState
          title="No quotes received yet"
          description="Quotes will appear here once suppliers respond to the RFQ."
        />
      ) : view === "inbox" ? (
        <QuoteInboxTable quotes={quotes} prNumber={prNumber} />
      ) : (
        <div className="space-y-4">
          <QuoteComparisonTable rows={comparison.rows} />
          {comparison.aiInterpretation && (
            <p className="rounded-md bg-ai-subtle px-4 py-3 text-sm text-ink-primary">
              {comparison.aiInterpretation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}