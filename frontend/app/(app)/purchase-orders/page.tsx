import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { POStatusBadge } from "@/components/orders/PODetail";
import { listPurchaseOrders } from "@/lib/api/queries";
import { formatDate, formatMoney } from "@/lib/utils/format";
import { routes } from "@/lib/constants/routes";

export const metadata = { title: "Purchase Orders" };

export default async function PurchaseOrdersPage() {
  const pos = await listPurchaseOrders();

  return (
    <div>
      <PageHeader breadcrumbs={[{ label: "Purchase Orders", href: routes.purchaseOrders() }]} title="Purchase Orders" />
      <div className="rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-tertiary">
              <th className="px-4 py-2.5 font-semibold">PO</th>
              <th className="px-4 py-2.5 font-semibold">Supplier</th>
              <th className="px-4 py-2.5 text-right font-semibold">Value</th>
              <th className="px-4 py-2.5 font-semibold">Delivery</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pos.map((po) => (
              <tr key={po.id} className="hover:bg-surface-raised">
                <td className="px-4 py-3">
                  <Link href={routes.purchaseOrder(po.poNumber)} className="entity-code font-medium text-ink-primary hover:text-brand">
                    {po.poNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-primary">{po.supplierName}</td>
                <td className="px-4 py-3 text-right tabular-nums text-ink-secondary">{formatMoney(po.value)}</td>
                <td className="px-4 py-3 text-ink-secondary">{formatDate(po.expectedDelivery)}</td>
                <td className="px-4 py-3"><POStatusBadge status={po.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

