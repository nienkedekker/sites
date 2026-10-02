import { useEffect, useState } from "react";
import SharedMediaChart from "@nienke/ui/media-chart";
import { getSummary, type Summary } from "../lib/whatpm";

// `initial` is fetched while the page is built; the chart refreshes it on load
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
      {/* Tag under the title, like the other cards. It links to the source. */}
      <div className="mb-5 flex flex-col items-start gap-2">
        <h3 className="font-medium tracking-[-0.01em]">Month by month</h3>
        {summary && (
          <a
            href={summary.url}
            target="_blank"
            rel="noopener noreferrer"
            className="tag whitespace-nowrap"
          >
            {summary.year} <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>

      <SharedMediaChart summary={summary} failed={failed} />
    </div>
  );
}
