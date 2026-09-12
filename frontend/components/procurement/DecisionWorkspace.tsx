"use client";

import { useState } from "react";
import { HelpCircle, Layers, MessageSquareText, RefreshCcw, Sparkles } from "lucide-react";
import { AIRecommendationCard } from "@/components/ai/AIRecommendationCard";
import { AIRiskList } from "@/components/ai/AIRiskList";
import { AIEvidencePanel } from "@/components/ai/AIEvidencePanel";
import { WhatIfPanel } from "@/components/ai/WhatIfPanel";
import { NegotiationCopilotPanel } from "@/components/ai/NegotiationCopilotPanel";
import { ContextualAIAssistant } from "@/components/ai/ContextualAIAssistant";
import { AIProcessingOverlay } from "@/components/ai/AIProcessingOverlay";
import { Drawer } from "@/components/ui/Drawer";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useAgentPipeline } from "@/lib/hooks/useAgentPipeline";
import { ANALYSIS_PIPELINE } from "@/lib/mock/agent-pipeline";
import type { ProcurementRecommendation, NegotiationDraft } from "@/types/ai";
import type { WhatIfResponse } from "@/types/intelligence";
import { getWhatIfFor } from "@/lib/api/queries";

type DrawerKind = "evidence" | "whatif" | "negotiate" | "ask" | null;

export function DecisionWorkspace({
  prNumber,
  recommendation,
  whatIf,
  negotiationDraft,
  approvalHref,
  sourcingHref,
}: {
  prNumber: string;
  recommendation: ProcurementRecommendation;
  whatIf: WhatIfResponse;
  negotiationDraft: NegotiationDraft;
  approvalHref: string;
  sourcingHref: string;
}) {
  const [drawer, setDrawer] = useState<DrawerKind>(null);
  const [rejected, setRejected] = useState(false);
  const pipeline = useAgentPipeline(prNumber, ANALYSIS_PIPELINE);

  if (rejected) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-ink-primary">Recommendation rejected. This decision has been logged to the PR timeline.</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => setRejected(false)}>
            Undo
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <AIRecommendationCard recommendation={recommendation} />

      <Card>
        <CardContent>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">Risks</h2>
          <AIRiskList risks={recommendation.risks} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => setDrawer("evidence")}>
          <Layers className="h-3.5 w-3.5" /> Evidence
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setDrawer("whatif")}>
          <HelpCircle className="h-3.5 w-3.5" /> What-if
        </Button>
        <Button variant="ai" size="sm" onClick={() => setDrawer("negotiate")}>
          <MessageSquareText className="h-3.5 w-3.5" /> Negotiate
        </Button>
        <Button variant="ai" size="sm" onClick={() => setDrawer("ask")}>
          <Sparkles className="h-3.5 w-3.5" /> Ask about this decision
        </Button>
        <Button variant="ghost" size="sm" onClick={pipeline.start} disabled={pipeline.phase === "running"}>
          <RefreshCcw className="h-3.5 w-3.5" /> Re-analyze with latest data
        </Button>
      </div>

      <AIProcessingOverlay
        title={`Re-analyzing ${prNumber}`}
        phase={pipeline.phase}
        runs={pipeline.runs}
        onCancel={pipeline.cancel}
        onDismiss={pipeline.reset}
        completedMessage={`Recommendation confirmed — ${recommendation.supplierName} still ranks #1 at ${recommendation.overallScore.toFixed(1)}.`}
      />

      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
        <Button variant="danger" onClick={() => setRejected(true)}>
          Reject
        </Button>
        <ButtonLink href={sourcingHref} variant="secondary">
          Modify
        </ButtonLink>
        <ButtonLink href={approvalHref}>Approve recommendation</ButtonLink>
      </div>

      <Drawer open={drawer === "evidence"} onClose={() => setDrawer(null)} title="Evidence for recommendation">
        <AIEvidencePanel evidence={recommendation.evidence} policyChecks={recommendation.policyChecks} />
      </Drawer>

      <Drawer open={drawer === "whatif"} onClose={() => setDrawer(null)} title="What-if procurement simulation" widthClassName="w-full max-w-lg">
        <WhatIfPanel
          result={whatIf}
          onScenarioChange={async ({ requiredDate }) => {
            const updated = await getWhatIfFor(prNumber, { requiredDate });
            if (updated) window.location.assign(`${window.location.pathname}?whatIfDate=${encodeURIComponent(requiredDate)}`);
          }}
        />
      </Drawer>

      <Drawer open={drawer === "negotiate"} onClose={() => setDrawer(null)} title="Negotiation copilot" widthClassName="w-full max-w-lg">
        <NegotiationCopilotPanel draft={negotiationDraft} />
      </Drawer>

      <Drawer open={drawer === "ask"} onClose={() => setDrawer(null)} title="Ask about this procurement" widthClassName="w-full max-w-lg">
        <ContextualAIAssistant prNumber={prNumber} />
      </Drawer>
    </div>
  );
}

