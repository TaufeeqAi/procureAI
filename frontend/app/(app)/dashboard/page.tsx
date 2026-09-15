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
  const today = new Date().toISOString();

  // The backend is returning "openPrs" (camelCase with capital P), not "open_prs" or "openPRs"
  const summary = data.summary as any;
  const openPRs = summary.openPrs ?? summary.open_prs ?? summary.openPRs ?? 0;
  const recommendationsReady = summary.recommendationsReady ?? summary.recommendations_ready ?? 0;
  const pendingApprovals = summary.pendingApprovals ?? summary.pending_approvals ?? 0;

  const opportunities = data.aiOpportunities as any;
  const estimatedSavings = opportunities.estimatedSavings ?? opportunities.estimated_savings;

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
            {pendingApprovals + data.decisionQueue.length > 0
              ? `${data.decisionQueue.length + pendingApprovals} procurement decisions require your attention today`
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
        <KPITile 
          value={String(openPRs)} 
          label="Open PRs" 
          description={`${openPRs} currently open`} 
          accent="neutral" 
        />
        <KPITile 
          value={String(recommendationsReady)} 
          label="AI ready" 
          description="Recommendation available" 
          accent="ai" 
        />
        <KPITile 
          value={String(pendingApprovals)} 
          label="Review required" 
          description="Risk or conflict detected" 
          accent="danger" 
        />
        
        <KPITile
          value={
            estimatedSavings && estimatedSavings.amount > 0
              ? formatMoneyCompact(estimatedSavings)
              : "—"
          }
          label="Opportunity detected"
          description={
            estimatedSavings && estimatedSavings.amount > 0
              ? "Negotiation + benchmark gap"
              : "Based on supplier performance and market analysis"
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
              <AIOpportunityRow label="Negotiations suggested" count={opportunities.negotiationCount ?? opportunities.negotiation_count} href="/rfqs?view=negotiations" />
              <AIOpportunityRow label="Price anomalies" count={opportunities.priceAnomalies ?? opportunities.price_anomalies} href="/quotes?view=comparisons" />
              <AIOpportunityRow label="Delivery risks" count={opportunities.deliveryRisks ?? opportunities.delivery_risks} href="/deliveries" />
              <AIOpportunityRow label="Quality risks" count={opportunities.qualityRisks ?? opportunities.quality_risks} href="/suppliers" />
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