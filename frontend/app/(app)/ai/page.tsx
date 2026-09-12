import { PageHeader } from "@/components/layout/PageHeader";
import { AIActivityList } from "@/components/ai/AIActivityList";
import { listAllAgentRuns } from "@/lib/api/queries";
import { routes } from "@/lib/constants/routes";

export const metadata = { title: "AI Activity" };

export default async function AIActivityPage() {
  const runs = await listAllAgentRuns();

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "AI Activity", href: routes.ai() }]}
        title="AI Activity"
        description="What each agent did, on which PR, and what it produced — action-visible, not chain-of-thought."
      />
      <div className="rounded-lg border border-border bg-surface px-5">
        <AIActivityList runs={runs} showPR />
      </div>
    </div>
  );
}

