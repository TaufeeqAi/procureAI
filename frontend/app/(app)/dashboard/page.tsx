import { Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { KPITile, DecisionQueueCard, PipelineWidget, ActivityFeed, AIOpportunityRow } from "@/components/procurement/dashboard-widgets";
import { AIStandingBriefCard } from "@/components/ai/AIStandingBriefCard";
import { getDashboardData, getProcurementPipeline } from "@/lib/api/queries";
import { formatDate, formatMoneyCompact } from "@/lib/utils/format";
import { routes } from "@/lib/constants/routes";

export const metadata = { title: "Command Center" };

export default async function DashboardPage() {
  const [data, pipeline] = await Promise.all([getDashboardData(), getProcurementPipeline()]);
  const today = "2026-09-04";

  return (
    <div>
      <div className="mb-1 flex items-center gap-2 text-xs text-ink-tertiary">
        <span className="tabular-nums">{formatDate(today, { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}</span>
        <span>·</span>
        <span className="flex items-center gap-1 text-ai">
          <span className="h-1.5 w-1.5 rounded-full bg-ai" /> AI active
        </span>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">Good morning, Procurement Team</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            {data.summary.pendingApprovals + data.decisionQueue.length > 0
              ? `${data.decisionQueue.length + data.summary.pendingApprovals} procurement decisions require your attention today`
              : "You're all caught up."}
          </p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href={routes.ai()} variant="secondary" size="sm">
            <Sparkles className="h-3.5 w-3.5" /> AI activity
          </ButtonLink>
          <ButtonLink href={routes.requisitions()} size="sm">
            Open PR queue
          </ButtonLink>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPITile value={String(data.summary.openPRs)} label="Open PRs" description={`${data.summary.openPRs} currently open`} accent="neutral" />
        <KPITile value={String(data.summary.recommendationsReady)} label="AI ready" description="Recommendation available" accent="ai" />
        <KPITile value={String(data.summary.pendingApprovals)} label="Review required" description="Risk or conflict detected" accent="danger" />
        <KPITile
  value={
    data.aiOpportunities.estimatedSavings
      ? formatMoneyCompact(data.aiOpportunities.estimatedSavings)
      : "—"
  }
  label="Opportunity detected"
  description={
    data.aiOpportunities.estimatedSavings
      ? "Negotiation + benchmark gap"
      : "Savings estimate arrives with Phase 4 truth engine"
  }
  accent="brand"
/>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Decision queue</h2>
              <p className="text-xs text-ink-tertiary">Ranked by procurement impact and time pressure</p>
            </div>
            <ButtonLink href={routes.requisitions()} variant="ghost" size="sm">
              View all
            </ButtonLink>
          </div>
          <div>
            {data.decisionQueue.map((task) => (
              <DecisionQueueCard key={task.id} task={task} />
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-surface px-5 py-4">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">AI opportunities</h2>
            <div className="space-y-0.5">
              <AIOpportunityRow label="Negotiations suggested" count={data.aiOpportunities.negotiationCount} href="/rfqs?view=negotiations" />
              <AIOpportunityRow label="Price anomalies" count={data.aiOpportunities.priceAnomalies} href="/quotes?view=comparisons" />
              <AIOpportunityRow label="Delivery risks" count={data.aiOpportunities.deliveryRisks} href="/deliveries" />
              <AIOpportunityRow label="Quality risks" count={data.aiOpportunities.qualityRisks} href="/suppliers" />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface px-5 py-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-secondary">Procurement pipeline</h2>
            <PipelineWidget stages={pipeline} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface px-5 py-4 lg:col-span-2">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-secondary">Recent activity</h2>
          <ActivityFeed events={data.recentActivity} />
        </div>

        <AIStandingBriefCard brief={data.standingBrief} />
      </div>
    </div>
  );
}

