import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * The six status tones (design-system.md § Status semantics). `ai` and
 * `success` are visually adjacent (both cool/teal-green) but never the
 * same value — an AI interpretation must stay distinguishable from a
 * verified fact even in a theme where they share a family resemblance.
 */
export type BadgeTone = "success" | "warning" | "danger" | "info" | "neutral" | "ai";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Renders as an uppercase, letter-spaced pill — used for the HIGH /
   *  MEDIUM / READY priority badges. Default is a quieter inline pill. */
  emphasis?: boolean;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  danger: "bg-danger-subtle text-danger",
  info: "bg-brand-subtle text-brand",
  neutral: "bg-surface-raised text-ink-secondary border border-border",
  ai: "bg-ai-subtle text-ai",
};

export function Badge({ tone = "neutral", emphasis = false, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium leading-5",
        emphasis ? "text-[11px] font-bold uppercase tracking-wide" : "text-xs",
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  );
}
