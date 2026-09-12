import type { ReactNode } from "react";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/layout/Breadcrumbs";

export interface PageHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  description?: string;
  /** Rendered next to the title — typically a status Badge. */
  status?: ReactNode;
  /** Rendered right-aligned — primary/secondary Buttons for this page. */
  actions?: ReactNode;
}

/**
 * The header block every screen composes with (see the Global application
 * shell wireframe: "Breadcrumb / Title / Status / Actions"). Keeping this
 * as one component means every page's header spacing and hierarchy stays
 * identical without each page re-deriving it.
 */
export function PageHeader({ breadcrumbs, title, description, status, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-semibold tracking-tight text-ink-primary">{title}</h1>
          {status}
        </div>
        {description && <p className="mt-1 text-sm text-ink-secondary">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
