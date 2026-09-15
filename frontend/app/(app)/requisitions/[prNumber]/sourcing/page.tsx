import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { SourcingWorkspace } from "@/components/procurement/SourcingWorkspace";
import { getRequisitionByNumber, getSupplierShortlistFor, getRFQsFor, getRecommendationFor } from "@/lib/api/queries";
import { routes } from "@/lib/constants/routes";
import { CheckCircle2, TrendingUp, AlertTriangle, Package } from "lucide-react";
import type { EvidenceReference } from "@/types/common";

export async function generateMetadata({ params }: { params: Promise<{ prNumber: string }> }) {
  const { prNumber } = await params;
  return { 
    title: `${prNumber} · Sourcing`,
    description: "AI-powered supplier evaluation and RFQ management"
  };
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
  const respondedCount = recipients.filter(r => r.status === "RESPONDED").length;
  const pendingCount = recipients.filter(r => r.status === "SENT" || r.status === "NO_RESPONSE").length;

  const evidenceBySupplier: Record<string, EvidenceReference[]> = {};
  for (const candidate of candidates) {
    evidenceBySupplier[candidate.supplier.id] =
      candidate.supplier.id === recommendation?.supplierId && (recommendation.evidence?.length ?? 0) > 0
        ? recommendation.evidence
        : [{ id: `ev-${candidate.supplier.id}`, type: "QUOTE", label: candidate.supplier.name, asOf: requisition.updatedAt }];
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Requisitions", href: routes.requisitions() }, 
          { label: prNumber, href: routes.requisition(prNumber) }, 
          { label: "Sourcing" }
        ]}
        title="Sourcing"
        description="AI-powered supplier evaluation and RFQ management for this requirement."
      />

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="border-border-strong bg-surface">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ai-subtle/20">
              <TrendingUp className="h-6 w-6 text-ai" />
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums text-ink-primary">{candidates.length}</p>
              <p className="text-xs font-medium text-ink-tertiary">Suppliers Shortlisted</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-success/20 bg-success-subtle/10">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums text-ink-primary">{respondedCount}</p>
              <p className="text-xs font-medium text-ink-tertiary">Responses Received</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-warning/20 bg-warning-subtle/10">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums text-ink-primary">{pendingCount}</p>
              <p className="text-xs font-medium text-ink-tertiary">Awaiting Response</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border-strong bg-surface">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-raised">
              <Package className="h-6 w-6 text-ink-tertiary" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-ink-primary line-clamp-1">
                {requisition.material.materialName}
              </p>
              <p className="text-xs font-medium text-ink-tertiary">Material</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requirement Details */}
      <Card className="border-border-strong bg-surface">
        <CardContent className="p-6">
          <h3 className="mb-4 text-sm font-semibold text-ink-primary">Requirement Details</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-tertiary">Material</p>
              <p className="mt-1.5 text-sm font-medium text-ink-primary">{requisition.material.materialName}</p>
              {requisition.material.partCode && (
                <p className="mt-0.5 text-xs text-ink-tertiary font-mono">{requisition.material.partCode}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-tertiary">Quantity Required</p>
              <p className="mt-1.5 text-sm font-medium text-ink-primary">
                {requisition.material.quantity.toLocaleString()} units
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-tertiary">Required By</p>
              <p className="mt-1.5 text-sm font-medium text-ink-primary">
                {new Date(requisition.requiredDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sourcing Workspace */}
      <SourcingWorkspace
        candidates={candidates}
        recipients={recipients}
        materialName={requisition.material.materialName}
        quantity={requisition.material.quantity}
        requiredDate={requisition.requiredDate}
        evidenceBySupplier={evidenceBySupplier}
      />

      {/* Footer Info */}
      <div className="flex flex-col items-center justify-between gap-3 border-t border-border pt-5 text-xs text-ink-tertiary sm:flex-row">
        <p>
          AI shortlist generated using deterministic supplier scoring ·{" "}
          <span className="text-ink-secondary">AI powered procurement intelligence</span>
        </p>
        <p className="text-center sm:text-right">
          Last updated: {new Date(requisition.updatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}