import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { PODetail, POStatusBadge } from "@/components/orders/PODetail";
import { getPurchaseOrderDetail } from "@/lib/api/queries";
import { routes } from "@/lib/constants/routes";

export async function generateMetadata({ params }: { params: Promise<{ poNumber: string }> }) {
  const { poNumber } = await params;
  return { title: poNumber };
}

export default async function PurchaseOrderDetailPage({ params }: { params: Promise<{ poNumber: string }> }) {
  const { poNumber } = await params;
  const po = await getPurchaseOrderDetail(poNumber);
  if (!po) notFound();

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Purchase Orders", href: routes.purchaseOrders() }, { label: poNumber }]}
        title={po.supplierName}
        status={<POStatusBadge status={po.status} />}
        description={`For ${po.prNumber}`}
      />
      <div className="max-w-2xl rounded-lg border border-border bg-surface px-5 py-5">
        <PODetail po={po} />
      </div>
    </div>
  );
}

