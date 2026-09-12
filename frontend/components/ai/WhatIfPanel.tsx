"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/utils/format";
import type { WhatIfResponse } from "@/types/intelligence";

export function WhatIfPanel({ result, onScenarioChange }: {
  result: WhatIfResponse;
  onScenarioChange: (scenario: { requiredDate: string }) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState(result.scenario.requiredDate);

  const apply = async (requiredDate: string) => {
    setBusy(true);
    try {
      await onScenarioChange({ requiredDate });
      setDate(requiredDate);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-canvas p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Required date</p>
            <p className="mt-1 text-sm font-medium text-ink-primary">{date}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant={date === result.scenario.requiredDate ? "primary" : "secondary"} disabled={busy} onClick={() => apply(result.scenario.requiredDate)}>
              Current requirement
            </Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => apply("2026-09-15")}>
              Required 15 Sep
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-canvas">
        <table className="w-full min-w-[640px] text-sm">
          <thead><tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-tertiary">
            <th className="px-3 py-2">Supplier</th><th className="px-3 py-2 text-right">Baseline</th><th className="px-3 py-2 text-right">Scenario</th><th className="px-3 py-2 text-right">Scenario cost</th><th className="px-3 py-2">Feasibility</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {result.results.map((row) => (
              <tr key={row.supplierId}>
                <td className="px-3 py-2.5 text-ink-primary">{row.supplierName}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-ink-tertiary">{row.baselineScore.toFixed(1)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-medium">{row.scenarioScore.toFixed(1)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(row.scenarioLandedCost)}</td>
                <td className={`px-3 py-2.5 ${row.feasible ? "text-success" : "text-danger"}`}>
                  {row.feasible ? "Feasible" : "Infeasible"}
                  {row.warning && <p className="mt-0.5 text-xs text-warning">{row.warning}</p>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-ink-tertiary">Weights are normalized server-side. Results are deterministic; no LLM is involved.</p>
    </div>
  );
}
