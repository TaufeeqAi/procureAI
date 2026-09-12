import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { SupplierInbox } from "@/components/rfq/SupplierInbox";
import { EmptyState } from "@/components/shared/states";
import { getRequisitionByNumber, getThreadsFor, getRFQsFor } from "@/lib/api/queries";
import { routes } from "@/lib/constants/routes";

export async function generateMetadata({ params }: { params: Promise<{ prNumber: string }> }) {
  const { prNumber } = await params;
  return { title: `${prNumber} · Communication` };
}

export default async function CommunicationPage({ params }: { params: Promise<{ prNumber: string }> }) {
  const { prNumber } = await params;
  const requisition = await getRequisitionByNumber(prNumber);
  if (!requisition) notFound();

  const [threads, rfqs] = await Promise.all([getThreadsFor(prNumber), getRFQsFor(prNumber)]);
  const rfqLabelByThreadId: Record<string, string> = {};
  for (const rfq of rfqs) {
    for (const recipient of rfq.recipients) {
      rfqLabelByThreadId[`${rfq.id}:${recipient.supplierId}`] = rfq.rfqNumber;
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Requisitions", href: routes.requisitions() }, { label: prNumber, href: routes.requisition(prNumber) }, { label: "Communication" }]}
        title="Supplier Communication"
      />
      {threads.length === 0 ? (
        <EmptyState title="No supplier responses yet" description="RFQ sent — responses will appear here as they're extracted." />
      ) : (
        <SupplierInbox threads={threads} rfqLabelByThreadId={rfqLabelByThreadId} />
      )}
    </div>
  );
}