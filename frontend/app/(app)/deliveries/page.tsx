import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DeliveryStatusBadge } from "@/components/delivery/DeliveryDetail";
import { listDeliveries } from "@/lib/api/queries";
import { formatDate } from "@/lib/utils/format";
import { routes } from "@/lib/constants/routes";

export const metadata = { title: "Deliveries" };

export default async function DeliveriesPage() {
  const deliveries = await listDeliveries();

  return (
    <div>
      <PageHeader breadcrumbs={[{ label: "Deliveries", href: routes.deliveries() }]} title="Delivery Monitor" />
      <div className="rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-tertiary">
              <th className="px-4 py-2.5 font-semibold">PO</th>
              <th className="px-4 py-2.5 font-semibold">Supplier</th>
              <th className="px-4 py-2.5 font-semibold">Item</th>
              <th className="px-4 py-2.5 font-semibold">Expected</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {deliveries.map((delivery) => (
              <tr key={delivery.id} className="hover:bg-surface-raised">
                <td className="px-4 py-3">
                  <Link href={routes.delivery(delivery.poNumber)} className="entity-code font-medium text-ink-primary hover:text-brand">
                    {delivery.poNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-primary">{delivery.supplierName}</td>
                <td className="px-4 py-3 text-ink-secondary">{delivery.materialName}</td>
                <td className="px-4 py-3 text-ink-secondary">{formatDate(delivery.expectedDate)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <DeliveryStatusBadge status={delivery.status} />
                    {delivery.exceptions.length > 0 && <AlertTriangle className="h-3.5 w-3.5 text-danger" />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

