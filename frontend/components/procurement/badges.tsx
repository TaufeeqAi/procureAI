import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { PRStatus, ProcurementTaskPriority } from "@/types/procurement";
import type { RiskLevel } from "@/types/common";

const STATUS_LABEL: Record<PRStatus, string> = {
  RECEIVED: "Received",
  VALIDATING: "Validating",
  READY_FOR_SOURCING: "Ready for sourcing",
  RFQ_IN_PROGRESS: "RFQ in progress",
  RESPONSES_RECEIVED: "Responses received",
  ANALYSIS_READY: "Analysis ready",
  AWAITING_APPROVAL: "Awaiting approval",
  APPROVED: "Approved",
  PO_CREATED: "PO created",
  FULFILLMENT: "Fulfillment",
  COMPLETED: "Completed",
};

const STATUS_TONE: Record<PRStatus, BadgeTone> = {
  RECEIVED: "neutral",
  VALIDATING: "neutral",
  READY_FOR_SOURCING: "info",
  RFQ_IN_PROGRESS: "info",
  RESPONSES_RECEIVED: "ai",
  ANALYSIS_READY: "ai",
  AWAITING_APPROVAL: "warning",
  APPROVED: "success",
  PO_CREATED: "success",
  FULFILLMENT: "success",
  COMPLETED: "success",
};

export function PRStatusBadge({ status }: { status: PRStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>;
}

const PRIORITY_TONE: Record<ProcurementTaskPriority, BadgeTone> = {
  HIGH: "danger",
  MEDIUM: "warning",
  READY: "ai",
};

export function PriorityBadge({ priority }: { priority: ProcurementTaskPriority }) {
  return (
    <Badge tone={PRIORITY_TONE[priority]} emphasis>
      {priority}
    </Badge>
  );
}

const RISK_TONE: Record<RiskLevel, BadgeTone> = {
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "danger",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return <Badge tone={RISK_TONE[level]}>{level}</Badge>;
}
