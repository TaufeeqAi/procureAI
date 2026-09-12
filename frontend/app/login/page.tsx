"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/constants/routes";

/**
 * Phase 0 authentication is intentionally not real: there is no session,
 * no password check, no backend call. Submitting takes the demo user
 * straight to the Command Center. Real auth arrives in Phase 3 alongside
 * FastAPI — this screen's job right now is only to open the user journey
 * at the correct place and prove the route exists.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("procurement@elecon-demo.com");
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(routes.dashboard());
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-brand text-base font-semibold text-ink-inverse">
            E
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-ink-primary">
            Elecon Procurement AI
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">Intelligent procurement workspace</p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-primary">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-ink-primary placeholder:text-ink-tertiary"
                placeholder="you@elecon-demo.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink-primary">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-ink-primary placeholder:text-ink-tertiary"
                placeholder="••••••••••"
              />
            </div>

            <Button type="submit" className="w-full justify-center">
              Continue to procurement
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-ink-tertiary">
            Demo environment — no credentials are verified in Phase 0.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-ink-tertiary">
          Prototype · Mock procurement data
        </p>
      </div>
    </div>
  );
}
