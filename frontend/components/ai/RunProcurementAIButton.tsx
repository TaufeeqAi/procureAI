"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { runProcurementAI } from "@/lib/api/ai";

interface Props {
  prNumber: string;
}

export function RunProcurementAIButton({ prNumber }: Props) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<Array<{ label: string; status: string }>>([]);

  async function handleRun() {
    setRunning(true);
    setError(null);
    try {
      const run = await runProcurementAI(prNumber);
      setActivity(run.activity.map((item) => ({ label: item.label, status: item.status })));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI analysis failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button variant="primary" size="sm" onClick={handleRun} disabled={running}>
        {running ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <BrainCircuit className="mr-1.5 h-3.5 w-3.5" />}
        {running ? "Running AI analysis…" : "Run AI analysis"}
      </Button>
      {error && <p className="max-w-xs text-right text-[11px] text-danger">{error}</p>}
      {activity.length > 0 && (
        <div className="max-w-sm text-right text-[10px] text-steel-light">
          {activity.filter((item) => item.status === "complete").map((item) => item.label).join(" → ")}
        </div>
      )}
    </div>
  );
}

