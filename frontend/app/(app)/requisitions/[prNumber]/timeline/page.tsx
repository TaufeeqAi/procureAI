import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { TimelineList } from "@/components/procurement/ProcurementTimeline";
import { getPRTimelineFor } from "@/lib/api/queries";
import { routes } from "@/lib/constants/routes";

export async function generateMetadata({ params }: { params: Promise<{ prNumber: string }> }) {
  const { prNumber } = await params;
  return { title: `${prNumber} · Timeline` };
}

export default async function TimelinePage({ params }: { params: Promise<{ prNumber: string }> }) {
  const { prNumber } = await params;
  const timeline = await getPRTimelineFor(prNumber);
  if (!timeline) notFound();

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Requisitions", href: routes.requisitions() }, { label: prNumber, href: routes.requisition(prNumber) }, { label: "Timeline" }]}
        title="Timeline"
      />
      <div className="max-w-xl rounded-lg border border-border bg-surface px-5 py-5">
        <TimelineList entries={timeline.entries} />
      </div>
    </div>
  );
}

