"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared/states";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Elecon Procurement UI error", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl py-10">
      <ErrorState
        title="Procurement data is temporarily unavailable"
        description="The backend request failed. Retry to request the current server state again."
        onRetry={reset}
      />
    </div>
  );
}
