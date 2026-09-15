"use client";

import { useState } from "react";
import { BrainCircuit, HelpCircle, Layers, MessageCircleQuestion, MessageSquareText, RotateCcw } from "lucide-react";
import { AIRecommendationCard } from "@/components/ai/AIRecommendationCard";
import { AIRiskList } from "@/components/ai/AIRiskList";
import { AIEvidencePanel } from "@/components/ai/AIEvidencePanel";
import { AIProcessingOverlay } from "@/components/ai/AIProcessingOverlay";
import { AIQuestionPanel } from "@/components/ai/AIQuestionPanel";
import { AILiveNegotiationPanel } from "@/components/ai/AILiveNegotiationPanel";
import { WhatIfPanel } from "@/components/ai/WhatIfPanel";
import { Drawer } from "@/components/ui/Drawer";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useProcurementAI } from "@/lib/hooks/useProcurementAI";
import { getWhatIfScenario } from "@/lib/api/ai";
import type { ProcurementRecommendation } from "@/types/ai";
import type { WhatIfResponse } from "@/types/intelligence";


type DrawerKind = "evidence" | "whatif" | "negotiate" | "ask" | null;

export function AIEndToEndWorkspace({ prNumber, recommendation, whatIf, approvalHref, sourcingHref }: {
  prNumber: string;
  recommendation: ProcurementRecommendation;
  whatIf: WhatIfResponse;
  approvalHref: string;
  sourcingHref: string;
}) {
  const ai = useProcurementAI(prNumber);
  const [drawer, setDrawer] = useState<DrawerKind>(null);
  const [activeWhatIf, setActiveWhatIf] = useState(whatIf);
  const activeRecommendation = ai.run?.recommendation ?? recommendation;
  const isAIResult = Boolean(ai.run?.recommendation);

  return (
    <div className="space-y-5">
      <Card accent="ai" className="bg-ai-subtle/20">
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ai"><BrainCircuit className="h-3.5 w-3.5" /> Real AI decision workspace</p>
              <p className="mt-1 text-sm text-ink-secondary">AI-powered analysis with deterministic procurement intelligence and human oversight.</p>
            </div>
            <Button variant="ai" size="sm" onClick={() => void ai.start()} disabled={ai.phase === "running"}>
              <BrainCircuit className="h-3.5 w-3.5" /> {ai.phase === "running" ? "AI running…" : ai.run ? "Run again" : "Run AI analysis"}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-ink-tertiary sm:grid-cols-4">
            <span>Graph <b className="font-data text-ink-secondary">{ai.run?.graphVersion ?? "procurement-graph.v1"}</b></span>
            <span>Model <b className="font-data text-ink-secondary">{ai.run?.model ?? "qwen/qwen3-32b"}</b></span>
            <span>Source <b className="text-ink-secondary">{isAIResult ? "AI interpretation + deterministic truth" : "Deterministic truth"}</b></span>
            <span>Human control <b className="text-success">Required</b></span>
          </div>
        </CardContent>
      </Card>

      <AIProcessingOverlay
        title={`AI analysis — ${prNumber}`}
        phase={ai.phase}
        activity={ai.activity}
        onCancel={ai.cancel}
        onDismiss={ai.reset}
        completedMessage={ai.run ? `AI analysis complete. ${ai.run.recommendation.supplierName} remains the deterministic winner.` : undefined}
      />

      {ai.error && ai.phase !== "failed" && <p className="rounded-md bg-danger-subtle px-3 py-2 text-xs text-danger">{ai.error}</p>}

      <AIRecommendationCard recommendation={activeRecommendation} />

      {isAIResult && (
        <Card accent="ai">
          <CardContent className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-ai">Live AI interpretation</p>
            <p className="text-sm leading-6 text-ink-primary">{ai.run?.recommendation.reasons[0]}</p>
            {ai.run?.recommendation.tradeOff && <p className="text-sm leading-6 text-ink-secondary">{ai.run.recommendation.tradeOff}</p>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">Risks</h2>
          <AIRiskList risks={activeRecommendation.risks} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => setDrawer("evidence")}><Layers className="h-3.5 w-3.5" /> Evidence</Button>
        <Button variant="secondary" size="sm" onClick={() => setDrawer("whatif")}><HelpCircle className="h-3.5 w-3.5" /> What-if</Button>
        <Button variant="ai" size="sm" onClick={() => setDrawer("negotiate")}><MessageSquareText className="h-3.5 w-3.5" /> Negotiation copilot</Button>
        <Button variant="ai" size="sm" onClick={() => setDrawer("ask")}><MessageCircleQuestion className="h-3.5 w-3.5" /> Ask AI</Button>
        {ai.run && <Button variant="ghost" size="sm" onClick={ai.reset}><RotateCcw className="h-3.5 w-3.5" /> Clear AI run</Button>}
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
        <ButtonLink href={sourcingHref} variant="secondary">Modify sourcing</ButtonLink>
        <ButtonLink href={approvalHref}>Approve recommendation</ButtonLink>
      </div>

      <Drawer open={drawer === "evidence"} onClose={() => setDrawer(null)} title="Evidence for this decision">
        <AIEvidencePanel evidence={activeRecommendation.evidence} policyChecks={activeRecommendation.policyChecks} />
      </Drawer>

      <Drawer open={drawer === "whatif"} onClose={() => setDrawer(null)} title="What-if procurement simulation" widthClassName="w-full max-w-lg">
        <WhatIfPanel
          result={activeWhatIf}
          onScenarioChange={async ({ requiredDate }) => {
            const updated = await getWhatIfScenario(prNumber, requiredDate, activeWhatIf.scenario.quantity);
            setActiveWhatIf(updated);
          }}
        />
      </Drawer>

      <Drawer open={drawer === "negotiate"} onClose={() => setDrawer(null)} title="Negotiation copilot" widthClassName="w-full max-w-lg">
        <AILiveNegotiationPanel draft={ai.run?.negotiation} />
      </Drawer>

      <Drawer open={drawer === "ask"} onClose={() => setDrawer(null)} title="Ask AI about this procurement" widthClassName="w-full max-w-lg">
        <AIQuestionPanel exchanges={ai.questions} asking={ai.asking} onAsk={ai.ask} />
      </Drawer>
    </div>
  );
}
