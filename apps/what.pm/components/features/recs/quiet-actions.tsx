"use client";

import { useState, useTransition } from "react";

export interface QuietAction {
  label: string;
  action: (formData: FormData) => Promise<{ error: string | null }>;
  fields?: Record<string, string>;
}

export function QuietActions({
  actions,
  fields,
  subject,
}: {
  actions: QuietAction[];
  fields: Record<string, string>;
  subject: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = ({ action, fields: extra }: QuietAction) => {
    const formData = new FormData();
    for (const [name, value] of Object.entries({ ...fields, ...extra })) {
      formData.set(name, value);
    }
    setError(null);
    startTransition(async () => {
      const result = await action(formData).catch(() => ({
        error: "Couldn’t reach the server. Try again.",
      }));
      setError(result.error);
    });
  };

  return (
    <>
      {pending ? (
        <span aria-live="polite">saving…</span>
      ) : (
        actions.map((quiet) => (
          <button
            key={quiet.label}
            type="button"
            onClick={() => run(quiet)}
            aria-label={`${subject}: ${quiet.label}`}
            className="link cursor-pointer hover:text-ink"
          >
            {quiet.label}
          </button>
        ))
      )}
      {error && (
        <span role="alert" className="text-danger">
          {error}
        </span>
      )}
    </>
  );
}
