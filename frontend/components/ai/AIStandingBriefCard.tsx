import { Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { AIStandingBrief } from "@/types/procurement";

/**
 * The Command Center's synthesized cross-PR summary. Visually distinct
 * (ai accent, ai-tinted content) from the plain-fact Recent Activity feed
 * beside it — this is interpretation, not a log.
 */
export function AIStandingBriefCard({ brief }: { brief: AIStandingBrief }) {
  return (
    <Card accent="ai" className="bg-ai-subtle/40">
      <CardContent className="space-y-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ai">
          <Zap className="h-3.5 w-3.5" /> AI standing brief
        </p>
        {brief.paragraphs.map((p, i) => (
          <p key={i} className="text-sm text-ink-primary">
            {p}
          </p>
        ))}
        <div className="flex flex-wrap gap-2 pt-1">
          {brief.statusPills.map((pill) => (
            <Badge key={pill.label} tone={pill.tone} emphasis>
              {pill.label}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
