import { useEffect, useState } from "react";
import CardHead from "@nienke/ui/card-head";
import TagLink from "@nienke/ui/tag-link";
import SharedMediaChart from "@nienke/ui/media-chart";
import { getSummary, type Summary } from "../lib/whatpm";

export default function MediaChart({
  initial,
  builtAt,
}: {
  initial?: Summary;
  builtAt: number;
}) {
  const [summary, setSummary] = useState<Summary | null>(initial ?? null);
  const [failed, setFailed] = useState(false);
  const [now, setNow] = useState(() => new Date(builtAt));

  useEffect(() => {
    setNow(new Date());
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

      <SharedMediaChart summary={summary} now={now} failed={failed} />
    </div>
  );
}
