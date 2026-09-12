import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { RFQTable } from "@/components/rfq/RFQTable";
import { SupplierInbox } from "@/components/rfq/SupplierInbox";
import { EmptyState } from "@/components/shared/states";
import { getThreadsFor, listRFQs } from "@/lib/api/queries";
import { heroNegotiationDraft } from "@/lib/mock/ai-recommendations";
import { NegotiationCopilotPanel } from "@/components/ai/NegotiationCopilotPanel";
import { routes } from "@/lib/constants/routes";

export const metadata = { title: "Sourcing" };

const VIEWS = [
  { value: "list", label: "Active RFQs" },
  { value: "inbox", label: "Supplier Inbox" },
  { value: "negotiations", label: "Negotiations" },
];

export default async function RFQsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view: rawView } = await searchParams;
  const view = VIEWS.some((v) => v.value === rawView) ? rawView! : "list";
  const rfqs = await listRFQs();
  const communicationPRNumbers = [...new Set(rfqs.map((rfq) => rfq.prNumber))];
  const threadGroups = await Promise.all(communicationPRNumbers.map((prNumber) => getThreadsFor(prNumber)));
  const threads = threadGroups.flat();

  // Same supplier can respond to multiple RFQs (e.g. XYZ on RFQ-00481 and
  // RFQ-00477) — give the inbox a human-readable RFQ label per thread so
  // duplicate suppliers stay distinguishable.
  const rfqLabelByThreadId: Record<string, string> = {};
  for (const rfq of rfqs) {
    for (const recipient of rfq.recipients) {
      rfqLabelByThreadId[`${rfq.id}:${recipient.supplierId}`] = rfq.rfqNumber;
    }
  }

  return (
    <div>
      <PageHeader breadcrumbs={[{ label: "Sourcing", href: routes.rfqs() }]} title="Sourcing" />
      <div className="mb-4 flex gap-1 border-b border-border">
        {VIEWS.map((v) => (
          <Link
            key={v.value}
            href={v.value === "list" ? routes.rfqs() : `${routes.rfqs()}?view=${v.value}`}
            className={`border-b-2 px-3 py-2 text-sm transition-colors duration-150 ${
              v.value === view ? "border-brand font-medium text-ink-primary" : "border-transparent text-ink-secondary hover:text-ink-primary"
            }`}
          >
            {v.label}
          </Link>
        ))}
      </div>
      {view === "list" && (
        <div className="rounded-lg border border-border bg-surface px-2">
          <RFQTable rfqs={rfqs} />
        </div>
      )}
      {view === "inbox" && <SupplierInbox threads={threads} rfqLabelByThreadId={rfqLabelByThreadId} />}
      {view === "negotiations" && (
        <div className="max-w-lg rounded-lg border border-border bg-surface px-5 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-secondary">PR-2026-00983 · ABC Precision</p>
          <NegotiationCopilotPanel draft={heroNegotiationDraft} />
        </div>
      )}
      {rfqs.length === 0 && <EmptyState title="No active RFQs" />}
    </div>
  );
}