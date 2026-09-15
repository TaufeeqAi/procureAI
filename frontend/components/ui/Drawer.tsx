"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  widthClassName?: string;
}

export function Drawer({ open, onClose, title, description, children, widthClassName = "w-full max-w-md" }: DrawerProps) {
  const onCloseRef = useRef(onClose);
  
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    }
    
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Don't render anything if not open
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-auto" aria-hidden={!open}>
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 transition-opacity duration-150 opacity-100"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute inset-y-0 right-0 flex flex-col border-l border-border bg-surface shadow-overlay transition-transform duration-200",
          widthClassName,
          "translate-x-0"
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-ink-primary">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-ink-secondary">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-md p-1.5 text-ink-tertiary hover:bg-surface-raised hover:text-ink-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="thin-scrollbar flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}