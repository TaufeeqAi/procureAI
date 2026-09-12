import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { RequirementPanel } from "@/components/procurement/RequirementPanel";
import { EmptyState } from "@/components/shared/states";
import { getRequisitionByNumber, getRequirementValidationFor } from "@/lib/api/queries";
import { routes } from "@/lib/constants/routes";

export async function generateMetadata({ params }: { params: Promise<{ prNumber: string }> }) {
  const { prNumber } = await params;
  return { title: `${prNumber} · Requirement` };
}

export default async function RequirementPage({ params }: { params: Promise<{ prNumber: string }> }) {
  const { prNumber } = await params;
  const requisition = await getRequisitionByNumber(prNumber);
  if (!requisition) notFound();
  const validation = await getRequirementValidationFor(prNumber);

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Requisitions", href: routes.requisitions() }, { label: prNumber, href: routes.requisition(prNumber) }, { label: "Requirement" }]}
        title="Requirement Intelligence"
      />
      {validation ? (
        <div className="max-w-xl">
          <RequirementPanel validation={validation} />
        </div>
      ) : (
        <EmptyState title="No AI requirement analysis yet" description="This PR hasn't been processed by the Requirement Agent." />
      )}
    </div>
  );
}

