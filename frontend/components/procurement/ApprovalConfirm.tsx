"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { AIRiskList } from "@/components/ai/AIRiskList";
import { formatMoney } from "@/lib/utils/format";
import type { ProcurementRecommendation } from "@/types/ai";

type Stage = "reviewing" | "confirming" | "pending" | "confirmed";

/**
 * Implements the three-state unsafe-mutation pattern from
 * docs/architecture/state-machines.md even though Phase 1 has no real
 * backend to confirm against — `pending` is held briefly on purpose so
 * the pattern (and its loading affordance) is visibly correct before
 * Phase 3 wires a real request behind it.
 */
export function ApprovalConfirm({
  supplierName,
  totalValue,
  risks,
}: {
  supplierName: string;
  totalValue: { currency: "INR" | "USD" | "EUR"; amount: number };
  risks: ProcurementRecommendation["risks"];
}) {
  const [stage, setStage] = useState<Stage>("reviewing");
  const [note, setNote] = useState(`${supplierName} selected due to strongest combined price, quality, and delivery.`);

  function confirm() {
    setStage("pending");
    setTimeout(() => setStage("confirmed"), 700);
  }

  if (stage === "confirmed") {
    return (
      <div className="flex items-center gap-2.5 rounded-md border border-success/30 bg-success-subtle px-4 py-3.5 text-sm text-ink-primary">
        <CheckCircle2 className="h-4 w-4 text-success" />
        Decision confirmed. A purchase order will be generated from this approval.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-secondary">Risks</p>
        <AIRiskList risks={risks} />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">Decision note</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-border-strong bg-canvas p-3 text-sm text-ink-primary focus:border-brand"
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setStage("confirming")}>Confirm decision</Button>
      </div>

      <Dialog
        open={stage === "confirming" || stage === "pending"}
        onClose={() => setStage("reviewing")}
        title="Confirm procurement decision"
        footer={
          <>
            <Button variant="secondary" onClick={() => setStage("reviewing")} disabled={stage === "pending"}>
              Cancel
            </Button>
            <Button onClick={confirm} loading={stage === "pending"}>
              Confirm approval
            </Button>
          </>
        }
      >
        <p>
          You are authorizing the procurement workflow to proceed with <span className="font-medium text-ink-primary">{supplierName}</span> for{" "}
          <span className="font-medium tabular-nums text-ink-primary">{formatMoney(totalValue)}</span>.
        </p>
      </Dialog>
    </div>
  );
}
