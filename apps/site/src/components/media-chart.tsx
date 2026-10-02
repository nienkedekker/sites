import { useEffect, useState } from "react";
import CardHead from "@nienke/ui/card-head";
import SharedMediaChart from "@nienke/ui/media-chart";
import { getSummary, type Summary } from "../lib/whatpm";

export default function MediaChart({ initial }: { initial?: Summary }) {
  const [summary, setSummary] = useState<Summary | null>(initial ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getSummary()
      .then(setSummary)
      .catch(() => setFailed(true));
  }, []);

  return (
    <div className="flex h-full flex-col">
      <CardHead
        as="h3"
        className="mb-5"
        tag={
          summary && (
            <a
              href={summary.url}
              target="_blank"
              rel="noopener noreferrer"
              className="tag whitespace-nowrap"
            >
              {summary.year} <span aria-hidden="true">↗</span>
            </a>
          )
        }
      >
        Month by month
      </CardHead>

      <SharedMediaChart summary={summary} failed={failed} />
    </div>
  );
}
