import { PageHeader } from "@/components/layout/PageHeader";
import { SupplierTable } from "@/components/suppliers/SupplierTable";
import { listSuppliers } from "@/lib/api/queries";
import { routes } from "@/lib/constants/routes";

export const metadata = { title: "Suppliers" };

export default async function SuppliersPage() {
  const supplierRows = await listSuppliers();
  const suppliers = supplierRows.filter((s) => s.performance);

  return (
    <div>
      <PageHeader breadcrumbs={[{ label: "Suppliers", href: routes.suppliers() }]} title="Suppliers" description={`${suppliers.length} approved suppliers`} />
      <div className="rounded-lg border border-border bg-surface">
        <SupplierTable suppliers={suppliers} />
      </div>
    </div>
  );
}

