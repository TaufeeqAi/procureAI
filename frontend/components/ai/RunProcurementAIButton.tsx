"use client";

import { BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useProcurementAI } from "@/lib/hooks/useProcurementAI";

interface Props {
  prNumber: string;
}

/** Small reusable Phase 6 trigger for secondary surfaces. */
export function RunProcurementAIButton({ prNumber }: Props) {
  const ai = useProcurementAI(prNumber);

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button variant="primary" size="sm" onClick={() => void ai.start()} disabled={ai.phase === "running"}>
        <BrainCircuit className="mr-1.5 h-3.5 w-3.5" />
        {ai.phase === "running" ? "Running AI analysis…" : "Run AI analysis"}
      </Button>
      {ai.phase === "running" && ai.activity.length > 0 && (
        <p className="max-w-sm text-right text-[10px] text-steel-light">
          {ai.activity.at(-1)?.label}: {ai.activity.at(-1)?.detail}
        </p>
      )}
      {ai.error && <p className="max-w-xs text-right text-[11px] text-danger">{ai.error}</p>}
    </div>
  );
}