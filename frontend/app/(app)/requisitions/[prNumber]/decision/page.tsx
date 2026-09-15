import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { AIEndToEndWorkspace } from "@/components/ai/AIEndToEndWorkspace";
import { EmptyState } from "@/components/shared/states";
import {
  getRequisitionByNumber,
  getRecommendationFor,
  getWhatIfFor,
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
export default async function DecisionPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ prNumber: string }>; 
  searchParams?: Promise<{ whatIfDate?: string }> 
}) {
  const { prNumber } = await params;
  const query = searchParams ? await searchParams : {};
  const requisition = await getRequisitionByNumber(prNumber);
  if (!requisition) notFound();

  // Fetch deterministic baseline data in parallel
  const [recommendation, whatIf] = await Promise.all([
    getRecommendationFor(prNumber),
    getWhatIfFor(prNumber, { requiredDate: query.whatIfDate }),
  ]);

  // Require both deterministic recommendation and what-if baseline 
  // before the real AI workspace can run safely.
  if (!recommendation || !whatIf) {
    return (
      <div>
        <PageHeader
          breadcrumbs={[
            { label: "Requisitions", href: routes.requisitions() }, 
            { label: prNumber, href: routes.requisition(prNumber) }, 
            { label: "Decision" }
          ]}
          title="Procurement Decision"
        />
        <EmptyState
          title="Decision intelligence unavailable"
          description="AI recommendation and what-if baseline are both required before the real AI workspace can run safely."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Requisitions", href: routes.requisitions() }, 
          { label: prNumber, href: routes.requisition(prNumber) }, 
          { label: "Decision" }
        ]}
        title="Procurement Decision"
      />
      
      {/* AIEndToEndWorkspace now manages the "Run AI analysis" button, 
          live activity streaming, and the negotiation/question drawers internally. */}
      <AIEndToEndWorkspace
        prNumber={prNumber}
        recommendation={recommendation}
        whatIf={whatIf}
        approvalHref={routes.requisitionApproval(prNumber)}
        sourcingHref={routes.requisitionSourcing(prNumber)}
      />
    </div>
  );
}