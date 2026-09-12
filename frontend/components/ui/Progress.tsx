import { cn } from "@/lib/utils/cn";

export interface ProgressProps {
  /** 0–1 */
  value: number;
  tone?: "brand" | "ai" | "success" | "warning" | "danger";
  className?: string;
  label?: string;
}

const TONE_CLASSES: Record<NonNullable<ProgressProps["tone"]>, string> = {
  brand: "bg-brand",
  ai: "bg-ai",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

/**
 * A single horizontal bar — used for the procurement pipeline funnel and
 * for score dimensions (quality, delivery) elsewhere. `value` is always a
 * fraction of a known maximum supplied by the caller; this component never
 * infers or normalizes a scale on its own.
 */
export function Progress({ value, tone = "brand", className, label }: ProgressProps) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-raised", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-300", TONE_CLASSES[tone])}
        style={{ width: `${clamped * 100}%` }}
      />
    </div>
  );
}
