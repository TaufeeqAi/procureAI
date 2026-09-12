import { redirect } from "next/navigation";
import { routes } from "@/lib/constants/routes";

/**
 * Phase 0 has no session/auth layer yet, so the root route always starts
 * the demo journey at Login (see docs/architecture/user-journey.md,
 * "Login → Command Center"). Phase 3 introduces a real session check here.
 */
export default function RootPage() {
  redirect(routes.login());
}
