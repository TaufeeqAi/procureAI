"use client";

import { forwardRef } from "react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "ai";
export type ButtonSize = "sm" | "md" | "icon";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-brand text-ink-inverse hover:bg-brand-strong disabled:bg-border-strong disabled:text-ink-tertiary",
  secondary:
    "bg-transparent text-ink-primary border border-border-strong hover:bg-surface-raised disabled:text-ink-tertiary disabled:border-border",
  ghost: "bg-transparent text-ink-secondary hover:bg-surface-raised hover:text-ink-primary",
  danger: "bg-danger text-ink-inverse hover:opacity-90 disabled:bg-border-strong",
  ai: "bg-ai-subtle text-ai border border-ai/30 hover:bg-ai/15",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  icon: "h-9 w-9 justify-center",
};

function buttonClasses(variant: ButtonVariant, size: ButtonSize, className?: string) {
  return cn(
    "inline-flex items-center rounded-md font-medium transition-colors duration-150",
    "disabled:cursor-not-allowed disabled:opacity-60",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  href?: undefined;
}

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href: string;
}

/**
 * Every consequential action renders through this component so
 * disabled/loading states stay consistent — see docs/architecture/
 * state-machines.md. When `href` is supplied it renders as a Next Link
 * styled identically to the button (never a <button> wrapping an <a>,
 * which is invalid HTML) — this is the one supported way to make a
 * navigation action look like a button.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", type = "button", loading = false, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses(variant, size, className)}
      {...props}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  { className, variant = "primary", size = "md", href, children, ...props },
  ref,
) {
  return (
    <Link ref={ref} href={href} className={buttonClasses(variant, size, className)} {...props}>
      {children}
    </Link>
  );
});