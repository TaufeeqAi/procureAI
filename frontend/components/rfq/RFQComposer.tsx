import { Badge } from "@/components/ui/Badge";
import type { RFQRecipient } from "@/types/rfq";

/**
 * A read-only preview of the AI-drafted RFQ email (Sourcing tab). There is
 * no send action wired in Phase 1 — recipients and the draft are already
 * shown as sent in the mock data, consistent with the hero scenario being
 * mid-flight rather than at its very first step.
 */
export function RFQComposer({ recipients, materialName, quantity, requiredDate }: {
  recipients: RFQRecipient[];
  materialName: string;
  quantity: number;
  requiredDate: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-secondary">Recipients</p>
        <div className="flex flex-wrap gap-2">
          {recipients.map((r) => (
            <Badge key={r.supplierId} tone={r.status === "RESPONDED" ? "success" : "neutral"}>
              {r.supplierName}
            </Badge>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-border bg-canvas p-4 text-sm text-ink-primary">
        <p className="mb-2 font-medium">RFQ — {materialName} — {quantity} Units</p>
        <p className="text-ink-secondary">Dear Supplier,</p>
        <p className="mt-2 text-ink-secondary">
          Please confirm whether you can supply {quantity} units of {materialName} by {requiredDate}.
        </p>
        <p className="mt-2 text-ink-secondary">Please provide: unit price, quantity available, confirmed delivery date, lead time, payment terms, freight terms, and quote validity.</p>
        <p className="mt-3 text-ink-secondary">Regards,<br />Elecon Procurement</p>
      </div>
      <p className="text-xs text-ai">AI-generated draft · Template: Standard RFQ v1</p>
    </div>
  );
}
