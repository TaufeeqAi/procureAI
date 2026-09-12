import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { DecisionWorkspace } from "@/components/procurement/DecisionWorkspace";
import { EmptyState } from "@/components/shared/states";
import {
  getRequisitionByNumber,
  getRecommendationFor,
  getWhatIfFor,
  getNegotiationDraftFor,
} from "@/lib/api/queries";
import { routes } from "@/lib/constants/routes";

export async function generateMetadata({ params }: { params: Promise<{ prNumber: string }> }) {
  const { prNumber } = await params;
  return { title: `${prNumber} · Decision` };
}

/**
 * The product's hero screen. Evidence, What-if, Negotiation, and the
 * contextual assistant are overlays launched from here rather than
 * separate routes — see docs/architecture/information-architecture.md —
 * so the buyer never loses the decision context while inspecting them.
 */
export default async function DecisionPage({ params, searchParams }: { params: Promise<{ prNumber: string }>; searchParams?: Promise<{ whatIfDate?: string }> }) {
  const { prNumber } = await params;
  const query = searchParams ? await searchParams : {};
  const requisition = await getRequisitionByNumber(prNumber);
  if (!requisition) notFound();

  const recommendation = await getRecommendationFor(prNumber);
  const whatIf = await getWhatIfFor(prNumber, { requiredDate: query.whatIfDate });
  const negotiationDraft = await getNegotiationDraftFor(prNumber); // <-- Added 'await'

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Requisitions", href: routes.requisitions() }, { label: prNumber, href: routes.requisition(prNumber) }, { label: "Decision" }]}
        title="Procurement Decision"
      />
      {!recommendation || !whatIf || !negotiationDraft ? (
        <EmptyState
          title="Recommendation not ready"
          description="There is insufficient comparable supplier history to produce a high-confidence recommendation yet. Continue with manual review."
        />
      ) : (
        <DecisionWorkspace
          prNumber={prNumber}
          recommendation={recommendation}
          whatIf={whatIf}
          negotiationDraft={negotiationDraft}
          approvalHref={routes.requisitionApproval(prNumber)}
          sourcingHref={routes.requisitionSourcing(prNumber)}
        />
      )}
    </div>
  );
}