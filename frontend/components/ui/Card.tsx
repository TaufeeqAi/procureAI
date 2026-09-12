import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** A 2px top accent stripe, used by KPI tiles on the Command Center to
   *  carry status semantics without a full colored background. */
  accent?: "brand" | "ai" | "success" | "warning" | "danger" | "neutral";
}

const ACCENT_CLASSES: Record<NonNullable<CardProps["accent"]>, string> = {
  brand: "border-t-2 border-t-brand",
  ai: "border-t-2 border-t-ai",
  success: "border-t-2 border-t-success",
  warning: "border-t-2 border-t-warning",
  danger: "border-t-2 border-t-danger",
  neutral: "border-t-2 border-t-border-strong",
};

export function Card({ className, accent, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface",
        accent && ACCENT_CLASSES[accent],
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-between border-b border-border px-5 py-3.5", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-xs font-semibold uppercase tracking-wide text-ink-secondary", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}
