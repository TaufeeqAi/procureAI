import type { AgentRun } from "@/types/ai";

/**
 * Agent-run log for the hero PR — what the AI Activity screen and the
 * Decision screen's "how was this produced" trail both render from. Action
 * summaries only, no chain-of-thought — see docs/architecture/ai-ux.md.
 */
export const heroAgentRuns: AgentRun[] = [
  {
    id: "run-req-00983",
    agent: "REQUIREMENT_AGENT",
    label: "Requirement Agent",
    status: "COMPLETED",
    prId: "pr-00983",
    summary: "Parsed purchase requisition — 8 fields extracted, 1 warning (missing drawing revision).",
    outputHref: "/requisitions/PR-2026-00983/requirement",
    startedAt: "2026-09-01T08:10:30+05:30",
    completedAt: "2026-09-01T08:10:42+05:30",
  },
  {
    id: "run-sup-00983",
    agent: "SUPPLIER_INTELLIGENCE_AGENT",
    label: "Supplier Intelligence Agent",
    status: "COMPLETED",
    prId: "pr-00983",
    summary: "Evaluated 18 suppliers — 4 eligible, 3 shortlisted for RFQ.",
    outputHref: "/requisitions/PR-2026-00983/sourcing",
    startedAt: "2026-09-01T09:15:00+05:30",
    completedAt: "2026-09-01T09:15:51+05:30",
  },
  {
    id: "run-comm-00983",
    agent: "COMMUNICATION_AGENT",
    label: "Communication Agent",
    status: "COMPLETED",
    prId: "pr-00983",
    summary: "RFQ drafted and sent to 3 suppliers.",
    outputHref: "/requisitions/PR-2026-00983/communication",
    startedAt: "2026-09-01T09:30:00+05:30",
    completedAt: "2026-09-01T09:32:10+05:30",
  },
  {
    id: "run-quote-00983",
    agent: "QUOTE_INTELLIGENCE_AGENT",
    label: "Quote Intelligence Agent",
    status: "COMPLETED",
    prId: "pr-00983",
    summary: "3 quotations extracted, 24 fields normalized. 1 delivery-date conflict flagged (XYZ Industrial).",
    outputHref: "/requisitions/PR-2026-00983/quotes",
    startedAt: "2026-09-04T10:52:20+05:30",
    completedAt: "2026-09-04T10:52:44+05:30",
  },
  {
    id: "run-analyst-00983",
    agent: "PROCUREMENT_ANALYST",
    label: "Procurement Analyst",
    status: "COMPLETED",
    prId: "pr-00983",
    summary: "Supplier scores calculated. ABC Precision ranked #1 at 94.2, confidence 93%.",
    outputHref: "/requisitions/PR-2026-00983/decision",
    startedAt: "2026-09-04T10:20:40+05:30",
    completedAt: "2026-09-04T10:21:05+05:30",
  },
  {
    id: "run-risk-00983",
    agent: "RISK_AGENT",
    label: "Risk Agent",
    status: "COMPLETED",
    prId: "pr-00983",
    summary: "1 delivery-timing risk detected — ABC's proposed delivery is close to its historical average lead time.",
    outputHref: "/requisitions/PR-2026-00983/decision",
    startedAt: "2026-09-04T10:20:50+05:30",
    completedAt: "2026-09-04T10:21:00+05:30",
  },
  {
    id: "run-req-00976",
    agent: "RISK_AGENT",
    label: "Risk Agent",
    status: "COMPLETED",
    prId: "pr-00976",
    summary: "Delivery risk flagged from supplier response tone and historical OTD variance.",
    outputHref: "/requisitions/PR-2026-00976",
    startedAt: "2026-09-04T09:41:00+05:30",
    completedAt: "2026-09-04T09:41:20+05:30",
  },
  {
    id: "run-comm-00968",
    agent: "COMMUNICATION_AGENT",
    label: "Communication Agent",
    status: "WAITING_FOR_REVIEW",
    prId: "pr-00968",
    summary: "Reminder drafted for 2 non-responding suppliers — awaiting buyer approval to send.",
    outputHref: "/requisitions/PR-2026-00968/sourcing",
    startedAt: "2026-09-04T09:58:00+05:30",
  },
];

export function getAgentRunsForPR(prId: string): AgentRun[] {
  return heroAgentRuns.filter((r) => r.prId === prId);
}
