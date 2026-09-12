"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/Button";

type ActionState = "idle" | "pending" | "success" | "error";

export interface AIActionButtonProps extends Omit<ButtonProps, "onClick" | "children" | "loading"> {
  label: string;
  pendingLabel?: string;
  successLabel?: string;
  /** Resolve when the (simulated) AI action completes; reject to show the
   *  error state. Phase 5 passes a real request here — the button doesn't
   *  care what's inside the promise. */
  onRun: () => Promise<void>;
  /** How long the success state lingers before resetting to idle. */
  successDurationMs?: number;
}

/**
 * Generalizes the idle → pending → success state machine that Phase 1
 * hand-rolled separately inside ApprovalConfirm and
 * NegotiationCopilotPanel. Every simple (non-multi-stage) AI trigger —
 * "Refresh ranking," "Re-extract fields" — should use this instead of a
 * bespoke useState trio, so the loading/success/error affordance stays
 * visually identical everywhere it appears.
 */
export function AIActionButton({
  label,
  pendingLabel = "Working…",
  successLabel = "Done",
  onRun,
  successDurationMs = 1800,
  variant = "ai",
  size = "sm",
  ...props
}: AIActionButtonProps) {
  const [state, setState] = useState<ActionState>("idle");

  async function handleClick() {
    if (state === "pending") return;
    setState("pending");
    try {
      await onRun();
      setState("success");
      setTimeout(() => setState("idle"), successDurationMs);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), successDurationMs);
    }
  }

  return (
    <Button
      variant={state === "error" ? "danger" : variant}
      size={size}
      onClick={handleClick}
      loading={state === "pending"}
      {...props}
    >
      {state === "idle" && (
        <>
          <Sparkles className="h-3.5 w-3.5" /> {label}
        </>
      )}
      {state === "pending" && pendingLabel}
      {state === "success" && (
        <>
          <Check className="h-3.5 w-3.5" /> {successLabel}
        </>
      )}
      {state === "error" && "Failed — try again"}
    </Button>
  );
}
