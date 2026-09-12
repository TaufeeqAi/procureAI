import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { SourcingWorkspace } from "@/components/procurement/SourcingWorkspace";
import { getRequisitionByNumber, getSupplierShortlistFor, getRFQsFor, getRecommendationFor } from "@/lib/api/queries";
import { routes } from "@/lib/constants/routes";
import type { EvidenceReference } from "@/types/common";

export async function generateMetadata({ params }: { params: Promise<{ prNumber: string }> }) {
  const { prNumber } = await params;
  return { title: `${prNumber} · Sourcing` };
}

export default async function SourcingPage({ params }: { params: Promise<{ prNumber: string }> }) {
  const { prNumber } = await params;
  const requisition = await getRequisitionByNumber(prNumber);
  if (!requisition) notFound();

  const [candidates, rfqs, recommendation] = await Promise.all([
    getSupplierShortlistFor(prNumber),
    getRFQsFor(prNumber),
    getRecommendationFor(prNumber),
  ]);
  const recipients = rfqs.flatMap((r) => r.recipients);

  const evidenceBySupplier: Record<string, EvidenceReference[]> = {};
  for (const candidate of candidates) {
    evidenceBySupplier[candidate.supplier.id] =
      candidate.supplier.id === recommendation?.supplierId && (recommendation.evidence?.length ?? 0) > 0
        ? recommendation.evidence
        : [{ id: `ev-${candidate.supplier.id}`, type: "QUOTE", label: candidate.supplier.name, asOf: requisition.updatedAt }];
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Requisitions", href: routes.requisitions() }, { label: prNumber, href: routes.requisition(prNumber) }, { label: "Sourcing" }]}
        title="Sourcing"
        description="AI-ranked supplier shortlist and RFQ status for this requirement."
      />
      <SourcingWorkspace
        candidates={candidates}
        recipients={recipients}
        materialName={requisition.material.materialName}
        quantity={requisition.material.quantity}
        requiredDate={requisition.requiredDate}
        evidenceBySupplier={evidenceBySupplier}
      />
    </div>
  );
}

