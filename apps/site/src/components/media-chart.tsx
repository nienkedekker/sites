import { useEffect, useState } from "react";
import CardHead from "@nienke/ui/card-head";
import TagLink from "@nienke/ui/tag-link";
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
        tag={summary && <TagLink href={summary.url}>{summary.year}</TagLink>}
      >
        Month by month
      </CardHead>

      <SharedMediaChart summary={summary} failed={failed} />
    </div>
  );
}
