import { CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PartialState } from "@/components/shared/states";
import { formatPercent } from "@/lib/utils/format";
import type { RequirementValidation } from "@/types/procurement";

const STATUS_ICON = {
  CONFIRMED: <CheckCircle2 className="h-4 w-4 text-success" />,
  INFERRED: <HelpCircle className="h-4 w-4 text-ai" />,
  MISSING: <XCircle className="h-4 w-4 text-danger" />,
};

/**
 * Renders the AI requirement check. A MISSING field is never silently
 * skipped — it's the one state this panel is most careful to make loud,
 * per docs/architecture/state-machines.md's blocking-requirement rule.
 */
export function RequirementPanel({ validation }: { validation: RequirementValidation }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI requirement check</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {validation.fields.map((field) => (
            <li key={field.field} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-ink-primary">
                {STATUS_ICON[field.status]}
                {field.label}
              </span>
              <span className="text-xs text-ink-tertiary">
                {field.status === "MISSING" ? "Not provided" : field.confidence ? `${formatPercent(field.confidence, { maximumFractionDigits: 0 })} confidence` : null}
              </span>
            </li>
          ))}
        </ul>
        {validation.blockingIssues.length > 0 && (
          <PartialState message={validation.blockingIssues.join(" ")} />
        )}
      </CardContent>
    </Card>
  );
}
