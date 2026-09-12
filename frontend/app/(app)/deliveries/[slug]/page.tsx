import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { DeliveryDetail, DeliveryStatusBadge } from "@/components/delivery/DeliveryDetail";
import { getDeliveryDetail } from "@/lib/api/queries";
import { routes } from "@/lib/constants/routes";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: slug };
}

export default async function DeliveryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const delivery = await getDeliveryDetail(slug);
  if (!delivery) notFound();

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Deliveries", href: routes.deliveries() }, { label: slug }]}
        title={`${delivery.supplierName} — ${delivery.materialName}`}
        status={<DeliveryStatusBadge status={delivery.status} />}
      />
      <div className="max-w-2xl rounded-lg border border-border bg-surface px-5 py-5">
        <DeliveryDetail delivery={delivery} />
      </div>
    </div>
  );
}

