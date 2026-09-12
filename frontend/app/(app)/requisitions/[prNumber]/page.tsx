import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { WorkflowStepper } from "@/components/procurement/ProcurementTimeline";
import { RequirementPanel } from "@/components/procurement/RequirementPanel";
import { PRStatusBadge } from "@/components/procurement/badges";
import { ButtonLink } from "@/components/ui/Button";
import { getRequisitionDetail } from "@/lib/api/queries";
import { formatDate } from "@/lib/utils/format";
import { routes } from "@/lib/constants/routes";

export async function generateMetadata({ params }: { params: Promise<{ prNumber: string }> }) {
  const { prNumber } = await params;
  return { title: `${prNumber} · Overview` };
}

export default async function RequisitionOverviewPage({ params }: { params: Promise<{ prNumber: string }> }) {
  const { prNumber } = await params;
  const detail = await getRequisitionDetail(prNumber);
  if (!detail) notFound();

  const { requisition, requirementValidation, sourcingState, supplierSummary, workflowState } = detail;

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Requisitions", href: routes.requisitions() }, { label: prNumber }]}
        title={requisition.material.materialName}
        description={`${requisition.material.quantity} ${requisition.material.unit}s · Required ${formatDate(requisition.requiredDate)} · ${requisition.requestingDepartment}`}
        status={<PRStatusBadge status={requisition.status} />}
        actions={<ButtonLink href={routes.requisitionSourcing(prNumber)} size="sm">Continue to sourcing</ButtonLink>}
      />

      <div className="mb-6 rounded-lg border border-border bg-surface px-5 py-4">
        <WorkflowStepper workflow={workflowState} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface px-5 py-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-secondary">Requirement</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-ink-secondary">Material</dt><dd className="text-ink-primary">{requisition.material.materialName}</dd></div>
            {requisition.material.partCode && <div className="flex justify-between"><dt className="text-ink-secondary">Part code</dt><dd className="entity-code text-ink-primary">{requisition.material.partCode}</dd></div>}
            <div className="flex justify-between"><dt className="text-ink-secondary">Quantity</dt><dd className="tabular-nums text-ink-primary">{requisition.material.quantity}</dd></div>
            {requisition.material.application && <div className="flex justify-between"><dt className="text-ink-secondary">Application</dt><dd className="text-ink-primary">{requisition.material.application}</dd></div>}
            <div className="flex justify-between"><dt className="text-ink-secondary">Department</dt><dd className="text-ink-primary">{requisition.requestingDepartment}</dd></div>
          </dl>
        </div>

        <RequirementPanel validation={requirementValidation} />
      </div>

      <div className="rounded-lg border border-border bg-surface px-5 py-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-secondary">Supplier landscape</h2>
        <p className="mb-3 text-sm text-ink-secondary">
          {sourcingState.eligibleSupplierCount} approved suppliers identified · {sourcingState.contactedSupplierCount} contacted ·{" "}
          {sourcingState.respondedSupplierCount} responses received · {sourcingState.comparableHistoricalPurchases} comparable historical purchases
        </p>
        {supplierSummary.highlights.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {supplierSummary.highlights.map((h) => (
              <div key={h.label} className="rounded-md border border-border bg-canvas px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-wide text-ink-tertiary">{h.label.replace(/_/g, " ")}</p>
                <p className="text-sm font-medium text-ink-primary">{h.supplierName}</p>
                <p className="text-xs text-ink-secondary">{h.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

