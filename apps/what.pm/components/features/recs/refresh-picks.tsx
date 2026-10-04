"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { unstable_rethrow } from "next/navigation";
import { refreshRecommendations } from "@/app/actions/recommendations";

function RefreshButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="link cursor-pointer text-ink disabled:cursor-wait disabled:text-ink-soft"
    >
      {pending ? "Asking Claude for new picks…" : label}
    </button>
  );
}

export function RefreshPicks({ label }: { label: string }) {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    try {
      const result = await refreshRecommendations();
      setError(result.error);
    } catch (err) {
      unstable_rethrow(err);
      setError(
        "Couldn’t reach the server. Check your connection and try again.",
      );
    }
  };

  return (
    <form action={handleSubmit} className="inline">
      <RefreshButton label={label} />
      {error && (
        <span role="alert" className="ml-3 text-danger">
          {error}
        </span>
      )}
    </form>
  );
}
