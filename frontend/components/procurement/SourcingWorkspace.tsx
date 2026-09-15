"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { SupplierCard } from "@/components/suppliers/SupplierCard";
import { RFQComposer } from "@/components/rfq/RFQComposer";
import { Drawer } from "@/components/ui/Drawer";
import { AIEvidencePanel } from "@/components/ai/AIEvidencePanel";
import { AIActionButton } from "@/components/ai/AIActionButton";
import { Card, CardContent } from "@/components/ui/Card";
import type { SupplierShortlistCandidate } from "@/types/supplier";
import type { RFQRecipient } from "@/types/rfq";
import type { EvidenceReference } from "@/types/common";

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
  const pathname = usePathname();
  const [viewedEvidence, setViewedEvidence] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [drawerSupplierId, setDrawerSupplierId] = useState<string | null>(null);

  const drawerCandidate = candidates.find((c) => c.supplier.id === drawerSupplierId);

  const handleDrawerClose = useCallback(() => {
    if (drawerSupplierId) {
      setViewedEvidence((prev) => new Set(prev).add(drawerSupplierId));
    }
    setDrawerSupplierId(null);
  }, [drawerSupplierId]);

  // ✅ FIX: Force close drawer on mount and route change
  useEffect(() => {
    setDrawerSupplierId(null);
  }, [pathname]);

  // ✅ FIX: Also close drawer when candidates change (fresh data)
  useEffect(() => {
    if (drawerSupplierId && !candidates.find(c => c.supplier.id === drawerSupplierId)) {
      setDrawerSupplierId(null);
    }
  }, [candidates, drawerSupplierId]);

  return (
    <div className="space-y-8">
      {/* AI Shortlist Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink-primary">AI Shortlist</h2>
            <p className="mt-1 text-sm text-ink-tertiary">
              Suppliers ranked by AI based on price, quality, delivery, and risk profile.
            </p>
          </div>
          <AIActionButton
            label="Refresh ranking"
            pendingLabel="Recomputing…"
            successLabel="Ranking refreshed"
            onRun={async () => Promise.resolve()}
          />
        </div>

        <div className="space-y-4">
          {candidates.map((candidate, index) => (
            <SupplierCard
              key={candidate.supplier.id}
              rank={index + 1}
              candidate={candidate}
              evidenceViewed={viewedEvidence.has(candidate.supplier.id)}
              onViewEvidence={() => {
                setDrawerSupplierId(candidate.supplier.id);
              }}
              onSelect={() => setSelected(candidate.supplier.id)}
              selected={selected === candidate.supplier.id}
            />
          ))}
        </div>
      </div>

      {/* RFQ Section */}
      <Card className="border-border-strong bg-surface">
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink-primary">Request for Quotation (RFQ)</h2>
          <RFQComposer 
            recipients={recipients} 
            materialName={materialName} 
            quantity={quantity} 
            requiredDate={requiredDate} 
          />
        </CardContent>
      </Card>

      {/* Evidence Drawer - Only render if we have a valid candidate */}
      {drawerCandidate && (
        <Drawer
          open={true}
          onClose={handleDrawerClose}
          title={`Evidence — ${drawerCandidate.supplier.name}`}
        >
          <AIEvidencePanel 
            evidence={evidenceBySupplier[drawerCandidate.supplier.id] ?? []} 
            policyChecks={[]} 
          />
        </Drawer>
      )}
    </div>
  );
}