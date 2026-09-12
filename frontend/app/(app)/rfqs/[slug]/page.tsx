import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { RFQStatusBadge } from "@/components/rfq/RFQTable";
import { getRFQDetail } from "@/lib/api/queries";
import { formatDateTime } from "@/lib/utils/format";
import { routes } from "@/lib/constants/routes";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: slug };
}

export default async function RFQDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rfq = await getRFQDetail(slug);
  if (!rfq) notFound();

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Sourcing", href: routes.rfqs() }, { label: slug }]}
        title={rfq.materialName}
        description={`For ${rfq.prNumber} · Due ${formatDateTime(rfq.dueDate)}`}
      />
      <div className="rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-tertiary">
              <th className="px-4 py-2.5 font-semibold">Supplier</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold">Sent</th>
              <th className="px-4 py-2.5 font-semibold">Responded</th>
              <th className="px-4 py-2.5 text-right font-semibold">Reminders</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rfq.recipients.map((r) => (
              <tr key={r.supplierId}>
                <td className="px-4 py-3 text-ink-primary">{r.supplierName}</td>
                <td className="px-4 py-3"><RFQStatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-ink-secondary">{r.sentAt ? formatDateTime(r.sentAt) : "—"}</td>
                <td className="px-4 py-3 text-ink-secondary">{r.respondedAt ? formatDateTime(r.respondedAt) : "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums text-ink-secondary">{r.remindersSent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

