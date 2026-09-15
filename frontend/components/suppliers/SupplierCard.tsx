"use client";

import { Star, CheckCircle2, AlertTriangle, ShieldAlert, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { SupplierShortlistCandidate } from "@/types/supplier";

interface SupplierCardProps {
  rank: number;
  candidate: SupplierShortlistCandidate;
  evidenceViewed: boolean;
  onViewEvidence: () => void;
  onSelect: () => void;
  selected: boolean;
}

// Helper for Risk Color Coding
function getRiskStyles(risk: string) {
  switch (risk?.toUpperCase()) {
    case "LOW":
      return { text: "text-success", bg: "bg-success/10", border: "border-success/20", icon: <CheckCircle2 className="h-3.5 w-3.5 text-success" /> };
    case "MEDIUM":
      return { text: "text-warning", bg: "bg-warning/10", border: "border-warning/20", icon: <AlertTriangle className="h-3.5 w-3.5 text-warning" /> };
    case "HIGH":
      return { text: "text-danger", bg: "bg-danger/10", border: "border-danger/20", icon: <ShieldAlert className="h-3.5 w-3.5 text-danger" /> };
    default:
      return { text: "text-ink-tertiary", bg: "bg-surface-raised", border: "border-border", icon: null };
  }
}

export function SupplierCard({ rank, candidate, evidenceViewed, onViewEvidence, onSelect, selected }: SupplierCardProps) {
  const { supplier } = candidate;
  
  // ✅ Use correct property names from your type definition
  const aiScore = candidate.deterministicScore;
  const price = candidate.quotedUnitPrice?.amount ?? 0;
  const historicalMedian = candidate.historicalMedianPrice?.amount ?? 0;
  
  // Calculate variance percentage
  const variance = historicalMedian > 0 ? ((price - historicalMedian) / historicalMedian) * 100 : 0;
  const varianceStyles = variance < 0 ? "text-success" : variance > 0 ? "text-danger" : "text-ink-tertiary";
  const absVariance = Math.abs(variance).toFixed(1);
  const isBelowBenchmark = variance < 0;
  
  // Get metrics from supplier performance
  const quality = supplier.performance?.qualityAcceptanceRate ?? 0;
  const delivery = supplier.performance?.onTimeDeliveryRate ?? 0;
  const riskLevel = supplier.riskLevel;
  const transactionCount = supplier.performance?.totalPurchases ?? 0;
  
  const riskStyles = getRiskStyles(riskLevel);

  return (
    <div className={`group relative overflow-hidden rounded-xl border bg-surface transition-all duration-200 ${
      selected 
        ? "border-ai shadow-lg shadow-ai/10 ring-1 ring-ai" 
        : "border-border-strong hover:border-border hover:shadow-md"
    }`}>
      
      {/* Rank Badge */}
      <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-br-xl bg-surface-raised text-xs font-bold text-ink-tertiary">
        #{rank}
      </div>

      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {rank === 1 && <Star className="h-5 w-5 fill-amber-400 text-amber-400" />}
            <div>
              <h3 className="text-lg font-bold text-ink-primary">{supplier.name}</h3>
              <p className="mt-0.5 text-xs text-ink-tertiary">
                {supplier.approvalStatus ?? "Approved"} · {transactionCount} previous transactions
              </p>
            </div>
          </div>
          
          {/* AI Score Badge */}
          <div className="flex flex-col items-end">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-tertiary">AI Score</span>
            <span className="text-2xl font-bold tabular-nums text-ink-primary">{aiScore.toFixed(1)}</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="mb-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-tertiary">Price</p>
            <p className="text-lg font-semibold tabular-nums text-ink-primary">₹{price.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-tertiary">Quality</p>
            <p className="text-lg font-semibold tabular-nums text-ink-primary">{(quality * 100).toFixed(1)}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-tertiary">Delivery</p>
            <p className="text-lg font-semibold tabular-nums text-ink-primary">{(delivery * 100).toFixed(0)}% OTD</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-tertiary">Risk</p>
            <div className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-sm font-semibold ${riskStyles.bg} ${riskStyles.text} ${riskStyles.border}`}>
              {riskStyles.icon}
              {riskLevel.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Insights / Badges */}
        <div className="mb-6 flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <div className="flex items-center gap-1.5 text-xs text-ink-secondary">
            <CheckCircle2 className="h-3.5 w-3.5 text-ai" />
            <span>AI score <span className="font-semibold text-ink-primary">{aiScore.toFixed(1)}</span></span>
          </div>
          
          <div className={`flex items-center gap-1.5 text-xs ${riskStyles.text}`}>
            {riskStyles.icon}
            <span className="font-medium">{riskLevel.toUpperCase()} risk</span>
          </div>

          <div className={`flex items-center gap-1.5 text-xs ${varianceStyles}`}>
            {isBelowBenchmark ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
            <span className="font-medium">
              Quote {absVariance}% {isBelowBenchmark ? "below" : "above"} historical benchmark
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <button className="text-sm font-medium text-ink-tertiary transition-colors hover:text-ink-primary">
            View supplier profile →
          </button>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onViewEvidence}
              className={evidenceViewed ? "text-success" : ""}
            >
              {evidenceViewed ? "✓ Evidence viewed" : "View evidence"}
            </Button>
            
            <Button 
              variant={selected ? "primary" : "secondary"} 
              size="sm" 
              onClick={onSelect}
              className={selected ? "bg-amber-500 text-black hover:bg-amber-600 border-amber-500" : ""}
            >
              {selected ? "Selected" : "Select supplier"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}