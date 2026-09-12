"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Centered confirmation modal — used for consequential, unsafe-edge
 * actions (Confirm Approval, Confirm PO Release). Unlike Drawer, this
 * blocks interaction with the rest of the page entirely, which is the
 * point: a decision this consequential shouldn't be dismissible by
 * accident the way a side panel is.
 */
export function Dialog({ open, onClose, title, children, footer }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative w-full max-w-md rounded-lg border border-border bg-surface shadow-overlay",
        )}
      >
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-ink-primary">{title}</h2>
        </div>
        <div className="px-5 py-4 text-sm text-ink-secondary">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  );
}
