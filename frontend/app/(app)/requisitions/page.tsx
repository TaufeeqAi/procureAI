import Link from "next/link";
import { PRTable } from "@/components/procurement/PRTable";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/states";
import { filterRequisitions, type RequisitionFilter } from "@/lib/api/queries";
import { routes } from "@/lib/constants/routes";

export const metadata = { title: "Requisitions" };

const FILTERS: { value: RequisitionFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "awaiting-supplier", label: "Awaiting supplier" },
  { value: "awaiting-decision", label: "Awaiting decision" },
  { value: "exceptions", label: "Exceptions" },
];

export default async function RequisitionsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: rawFilter } = await searchParams;
  const filter = (FILTERS.some((f) => f.value === rawFilter) ? rawFilter : "all") as RequisitionFilter;
  const allRequisitions = await filterRequisitions("all");

  const filterRows = (rows: typeof allRequisitions, selected: RequisitionFilter) => {
    switch (selected) {
      case "awaiting-supplier":
        return rows.filter((pr) => pr.status === "RFQ_IN_PROGRESS");
      case "awaiting-decision":
        return rows.filter((pr) => pr.status === "ANALYSIS_READY" || pr.status === "RESPONSES_RECEIVED");
      case "exceptions":
        return rows.filter((pr) => pr.exceptions.length > 0);
      default:
        return rows;
    }
  };

  const requisitions = filterRows(allRequisitions, filter);

  return (
    <div>
      <PageHeader breadcrumbs={[{ label: "Requisitions", href: routes.requisitions() }]} title="Purchase Requisitions" />

      <div className="mb-4 flex gap-1 border-b border-border">
        {FILTERS.map((f) => {
          const count = filterRows(allRequisitions, f.value).length;
          const isActive = f.value === filter;
          return (
            <Link
              key={f.value}
              href={f.value === "all" ? routes.requisitions() : `${routes.requisitions()}?filter=${f.value}`}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors duration-150 ${
                isActive ? "border-brand font-medium text-ink-primary" : "border-transparent text-ink-secondary hover:text-ink-primary"
              }`}
            >
              {f.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[11px] tabular-nums ${isActive ? "bg-brand-subtle text-brand" : "bg-surface-raised text-ink-tertiary"}`}>
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {requisitions.length === 0 ? (
        <EmptyState title="No requisitions match this filter" />
      ) : (
        <div className="rounded-lg border border-border bg-surface">
          <PRTable requisitions={requisitions} />
        </div>
      )}
    </div>
  );
}

