import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { currentUser } from "@/lib/api/queries";
import { routes } from "@/lib/constants/routes";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div>
      <PageHeader breadcrumbs={[{ label: "Settings", href: routes.settings() }]} title="Settings" />

      <div className="max-w-md space-y-6">
        <div className="rounded-lg border border-border bg-surface px-5 py-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-secondary">Profile</h2>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-ink-tertiary">Name</label>
              <input readOnly value={currentUser.name} className="w-full rounded-md border border-border-strong bg-canvas px-3 py-2 text-sm text-ink-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink-tertiary">Role</label>
              <input readOnly value={currentUser.role} className="w-full rounded-md border border-border-strong bg-canvas px-3 py-2 text-sm text-ink-primary" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface px-5 py-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-secondary">AI preferences</h2>
          <div className="space-y-2.5">
            {[
              { id: "evidence", label: "Show evidence by default" },
              { id: "confidence", label: "Show AI confidence" },
              { id: "risks", label: "Show procurement risks" },
            ].map((pref) => (
              <label key={pref.id} className="flex items-center gap-2.5 text-sm text-ink-primary">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border-strong accent-brand" />
                {pref.label}
              </label>
            ))}
          </div>
          <Button size="sm" className="mt-4">Save</Button>
        </div>
      </div>
    </div>
  );
}

