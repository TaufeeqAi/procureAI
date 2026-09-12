"use client";

import { useState } from "react";
import { SupplierCard } from "@/components/suppliers/SupplierCard";
import { RFQComposer } from "@/components/rfq/RFQComposer";
import { Drawer } from "@/components/ui/Drawer";
import { AIEvidencePanel } from "@/components/ai/AIEvidencePanel";
import { AIActionButton } from "@/components/ai/AIActionButton";
import type { SupplierShortlistCandidate } from "@/types/supplier";
import type { RFQRecipient } from "@/types/rfq";
import type { EvidenceReference } from "@/types/common";

/**
 * Orchestrates the evidence-before-select rule across the whole shortlist
 * (docs/architecture/ai-ux.md) — client-side because the "has this
 * session's evidence been viewed" state is inherently ephemeral UI state,
 * never something a server round-trip should own.
 */
export function SourcingWorkspace({
  candidates,
  recipients,
  materialName,
  quantity,
  requiredDate,
  evidenceBySupplier,
}: {
  candidates: SupplierShortlistCandidate[];
  recipients: RFQRecipient[];
  materialName: string;
  quantity: number;
  requiredDate: string;
  evidenceBySupplier: Record<string, EvidenceReference[]>;
}) {
  const [viewedEvidence, setViewedEvidence] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [drawerSupplierId, setDrawerSupplierId] = useState<string | null>(null);

  const drawerCandidate = candidates.find((c) => c.supplier.id === drawerSupplierId);

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">AI shortlist</h2>
          <AIActionButton
            label="Refresh deterministic ranking"
            pendingLabel="Recomputing…"
            successLabel="Ranking refreshed"
            onRun={async () => Promise.resolve()}
          />
        </div>
        <div className="space-y-3">
          {candidates.map((candidate) => (
            <SupplierCard
              key={candidate.supplier.id}
              candidate={candidate}
              evidenceViewed={viewedEvidence.has(candidate.supplier.id)}
              onViewEvidence={() => setDrawerSupplierId(candidate.supplier.id)}
              onSelect={() => setSelected(candidate.supplier.id)}
              selected={selected === candidate.supplier.id}
            />
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface px-5 py-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-secondary">RFQ</h2>
        <RFQComposer recipients={recipients} materialName={materialName} quantity={quantity} requiredDate={requiredDate} />
      </div>

      <Drawer
        open={drawerCandidate !== null}
        onClose={() => {
          if (drawerSupplierId) setViewedEvidence((prev) => new Set(prev).add(drawerSupplierId));
          setDrawerSupplierId(null);
        }}
        title={`Evidence — ${drawerCandidate?.supplier.name ?? ""}`}
      >
        {drawerCandidate && (
          <AIEvidencePanel evidence={evidenceBySupplier[drawerCandidate.supplier.id] ?? []} policyChecks={[]} />
        )}
      </Drawer>
    </div>
  );
}

