import { AlertTriangle } from "lucide-react";
import { RiskBadge } from "@/components/procurement/badges";
import type { RiskFlag } from "@/types/ai";

export function AIRiskList({ risks }: { risks: RiskFlag[] }) {
  if (risks.length === 0) {
    return <p className="text-sm text-ink-tertiary">No risks flagged.</p>;
  }
  return (
    <ul className="space-y-2">
      {risks.map((risk, i) => (
        <li key={i} className="flex items-start gap-2.5 rounded-md border border-border bg-canvas px-3 py-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink-primary">{risk.message}</p>
          </div>
          <RiskBadge level={risk.severity} />
        </li>
      ))}
    </ul>
  );
}
