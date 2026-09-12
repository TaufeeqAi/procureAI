import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ApprovalConfirm } from "@/components/procurement/ApprovalConfirm";
import { EmptyState } from "@/components/shared/states";
import { getRequisitionByNumber, getRecommendationFor } from "@/lib/api/queries";
import { formatMoney } from "@/lib/utils/format";
import { routes } from "@/lib/constants/routes";

export async function generateMetadata({ params }: { params: Promise<{ prNumber: string }> }) {
  const { prNumber } = await params;
  return { title: `${prNumber} · Approval` };
}

export default async function ApprovalPage({ params }: { params: Promise<{ prNumber: string }> }) {
  const { prNumber } = await params;
  const requisition = await getRequisitionByNumber(prNumber);
  if (!requisition) notFound();
  const recommendation = await getRecommendationFor(prNumber);

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Requisitions", href: routes.requisitions() }, { label: prNumber, href: routes.requisition(prNumber) }, { label: "Approval" }]}
        title="Confirm Procurement Decision"
        description="This is the record an audit will pull — it stays complete and immutable once submitted."
      />
      {!recommendation ? (
        <EmptyState title="No recommendation to approve yet" />
      ) : (
        <div className="max-w-xl space-y-5">
          <div className="rounded-lg border border-border bg-surface px-5 py-4">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-ai" />
              <p className="text-sm font-semibold text-ink-primary">{recommendation.supplierName}</p>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-ink-tertiary">AI score</dt><dd className="tabular-nums text-ink-primary">{recommendation.overallScore.toFixed(1)}</dd></div>
              <div><dt className="text-ink-tertiary">Value</dt><dd className="tabular-nums text-ink-primary">{requisition.estimatedValue ? formatMoney(requisition.estimatedValue) : "—"}</dd></div>
            </dl>
          </div>

          <ApprovalConfirm
            supplierName={recommendation.supplierName}
            totalValue={requisition.estimatedValue ?? { currency: "INR", amount: 0 }}
            risks={recommendation.risks}
          />
        </div>
      )}
    </div>
  );
}

