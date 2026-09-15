import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Clock, AlertCircle, TrendingUp, ArrowRight } from "lucide-react";
import { apiGet } from "@/lib/api/client";
import { routes } from "@/lib/constants/routes";

interface AIActivityItem {
  id: string;
  pr_number: string;
  agent: string;
  label: string;
  status: string;
  detail: string;
  timestamp: string;
}

interface AIActivityResponse {
  activities: AIActivityItem[];
  total: number;
}

export const metadata = { 
  title: "AI Activity",
  description: "Historical audit trail of AI agent activities across all purchase requisitions."
};

function formatTimestamp(timestamp: string): { relative: string; absolute: string; date: string; time: string } {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  let relative = "";
  if (diffMins < 1) relative = "Just now";
  else if (diffMins < 60) relative = `${diffMins}m ago`;
  else if (diffHours < 24) relative = `${diffHours}h ago`;
  else if (diffDays < 7) relative = `${diffDays}d ago`;
  else relative = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return {
    relative,
    absolute: date.toISOString(),
    date: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
  };
}

function getScoreColor(score: number): string {
  if (score >= 85) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-danger";
}

function getScoreBadgeColor(score: number): string {
  if (score >= 85) return "bg-success-subtle text-success border-success/30";
  if (score >= 60) return "bg-warning-subtle text-warning border-warning/30";
  return "bg-danger-subtle text-danger border-danger/30";
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "complete":
    case "completed":
      return <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />;
    case "in_progress":
    case "running":
      return <Clock className="h-5 w-5 shrink-0 animate-pulse text-ai" />;
    case "failed":
      return <AlertCircle className="h-5 w-5 shrink-0 text-danger" />;
    default:
      return <TrendingUp className="h-5 w-5 shrink-0 text-ink-tertiary" />;
  }
}

function getStatusBadge(status: string) {
  const normalized = status.toLowerCase();
  const baseClasses = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide";
  
  if (normalized === "complete" || normalized === "completed") {
    return <span className={`${baseClasses} bg-success-subtle text-success border-success/30`}>Complete</span>;
  }
  if (normalized === "in_progress" || normalized === "running") {
    return <span className={`${baseClasses} bg-ai-subtle text-ai border-ai/30`}>In Progress</span>;
  }
  if (normalized === "failed") {
    return <span className={`${baseClasses} bg-danger-subtle text-danger border-danger/30`}>Failed</span>;
  }
  return <span className={`${baseClasses} bg-surface-raised text-ink-tertiary border-border-strong`}>{status}</span>;
}

// Properly narrow the type of scoreMatch[1] to satisfy parseFloat
function extractScores(detail: string): { score?: number; confidence?: number } {
  const result: { score?: number; confidence?: number } = {};
  
  const scoreMatch = detail.match(/Overall score:\s*([\d.]+)/i);
  if (scoreMatch && scoreMatch[1]) {
    result.score = parseFloat(scoreMatch[1]);
  }
  
  const confidenceMatch = detail.match(/Confidence:\s*([\d.]+)%/i);
  if (confidenceMatch && confidenceMatch[1]) {
    result.confidence = parseFloat(confidenceMatch[1]);
  }
  
  return result;
}

function formatDetailWithColors(detail: string): React.ReactNode {
  const { score, confidence } = extractScores(detail);
  
  if (score === undefined && confidence === undefined) {
    return <span className="text-ink-secondary">{detail}</span>;
  }

  const parts: React.ReactNode[] = [];
  let text = detail;
  
  if (score !== undefined) {
    const match = text.match(/(.*?)(Overall score:\s*)([\d.]+)(.*)/i);
    if (match && match[1] !== undefined && match[2] !== undefined && match[3] !== undefined && match[4] !== undefined) {
      parts.push(<span key="pre-score" className="text-ink-secondary">{match[1]}</span>);
      parts.push(
        <span key="score" className="font-semibold tabular-nums">
          {match[2]}<span className={getScoreColor(score)}>{match[3]}</span>
        </span>
      );
      text = match[4];
    }
  }

  if (confidence !== undefined) {
    const match = text.match(/(.*?)(Confidence:\s*)([\d.]+)%(.*)/i);
    if (match && match[1] !== undefined && match[2] !== undefined && match[3] !== undefined && match[4] !== undefined) {
      parts.push(<span key="pre-conf" className="text-ink-secondary">{match[1]}</span>);
      parts.push(
        <span key="conf" className="font-semibold tabular-nums">
          {match[2]}<span className={getScoreColor(confidence)}>{match[3]}%</span>
        </span>
      );
      text = match[4];
    }
  }

  if (text) {
    parts.push(<span key="remaining" className="text-ink-secondary">{text}</span>);
  }

  return <>{parts}</>;
}

export default async function AIActivityPage() {
  let activities: AIActivityItem[] = [];
  let total = 0;
  
  try {
    const data = await apiGet<AIActivityResponse>("/ai/activity?limit=50&days=30");
    activities = Array.isArray(data?.activities) ? data.activities : [];
    total = data?.total ?? activities.length;
  } catch (error) {
    console.error("Failed to load AI activity:", error);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: "AI Activity", href: routes.ai() }]}
        title="AI Activity"
        description="What each agent did, on which PR, and what it produced — action-visible, not chain-of-thought."
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-success/20 bg-success-subtle/10">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums text-ink-primary">{total}</p>
              <p className="text-xs font-medium text-ink-tertiary">Total Activities (30d)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-ai/20 bg-ai-subtle/10">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ai/10">
              <TrendingUp className="h-6 w-6 text-ai" />
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums text-ink-primary">{activities.length}</p>
              <p className="text-xs font-medium text-ink-tertiary">Showing Now</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border-strong bg-surface">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-raised">
              <Clock className="h-6 w-6 text-ink-tertiary" />
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums text-ink-primary">30</p>
              <p className="text-xs font-medium text-ink-tertiary">Day Window</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity List */}
      <Card className="border-border-strong">
        <CardContent className="p-0">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-raised">
                <TrendingUp className="h-10 w-10 text-ink-tertiary" />
              </div>
              <h3 className="text-lg font-semibold text-ink-primary">No AI activity recorded yet</h3>
              <p className="mt-3 max-w-md text-sm text-ink-secondary">
                Run an AI analysis on a purchase requisition to see agent activity, recommendations, and audit trails here.
              </p>
              <Link 
                href={routes.requisitions()} 
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                Browse Requisitions
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {activities.map((item) => {
                const timeInfo = formatTimestamp(item.timestamp);
                const { score, confidence } = extractScores(item.detail);
                
                return (
                  <Link
                    key={item.id}
                    href={`/requisitions/${encodeURIComponent(item.pr_number)}/decision`}
                    className="group block transition-all duration-200 hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                    aria-label={`View AI activity for ${item.pr_number}: ${item.label}`}
                  >
                    <div className="flex items-start gap-5 p-6">
                      {getStatusIcon(item.status)}
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-sm font-semibold text-ink-primary group-hover:text-ai transition-colors">
                            {item.label}
                          </h3>
                          <span className="rounded-md bg-surface-raised px-2.5 py-1 font-mono text-[11px] font-medium text-ink-tertiary">
                            {item.pr_number}
                          </span>
                          {getStatusBadge(item.status)}
                        </div>
                        
                        <p className="mt-2.5 text-sm leading-relaxed text-ink-secondary">
                          {formatDetailWithColors(item.detail)}
                        </p>
                        
                        <div className="mt-3 flex items-center gap-3 text-xs text-ink-tertiary">
                          <time 
                            dateTime={timeInfo.absolute}
                            className="inline-flex items-center gap-1.5"
                            title={`${timeInfo.date} at ${timeInfo.time}`}
                          >
                            <Clock className="h-3.5 w-3.5" />
                            {/* Only show date/time if relative time is not already a full date */}
                            {timeInfo.relative}
                            {!timeInfo.relative.match(/\d{4}/) && ( // Check if relative doesn't contain a year
                              <>
                                <span className="mx-1 text-ink-tertiary/50">·</span>
                                {timeInfo.date} at {timeInfo.time}
                              </>
                            )}
                          </time>
                          
                          {(score !== undefined || confidence !== undefined) && (
                            <div className="flex items-center gap-2">
                              <span className="text-ink-tertiary/50">·</span>
                              {score !== undefined && (
                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getScoreBadgeColor(score)}`}>
                                  Score: {score.toFixed(1)}
                                </span>
                              )}
                              {confidence !== undefined && (
                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getScoreBadgeColor(confidence)}`}>
                                  Confidence: {confidence.toFixed(0)}%
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 opacity-0 transition-all duration-200 group-hover:opacity-100 group-focus:opacity-100"
                          tabIndex={-1}
                          aria-hidden="true"
                        >
                          View
                        </Button>
                        {score !== undefined && (
                          <div className={`rounded-md px-2.5 py-1 text-xs font-semibold ${getScoreBadgeColor(score)}`}>
                            {score.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer Info */}
      {activities.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border pt-5 text-xs text-ink-tertiary sm:flex-row">
          <p>
            Showing <span className="font-semibold text-ink-secondary">{activities.length}</span> of{" "}
            <span className="font-semibold text-ink-secondary">{total}</span> activities from the last 30 days
          </p>
          <p className="text-center sm:text-right">
            Data sourced from PostgreSQL audit trail · Deterministic Phase 4 + Phase 5/6 LangGraph runtime
          </p>
        </div>
      )}
    </div>
  );
}