import { useState, useEffect } from "react";

export default function VisitorCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const hasVisited = sessionStorage.getItem("counted");

    fetch("/api/visitor-count", hasVisited ? undefined : { method: "POST" })
      .then((res) => {
        if (!res.ok) throw new Error(`Visitor count route responded ${res.status}`);
        return res.json();
      })
      .then((data: { count: number }) => {
        setCount(data.count);
        if (!hasVisited) sessionStorage.setItem("counted", "true");
      })
      .catch(() => setCount(0));
  }, []);

  if (count === null) {
    return <div className="font-mono text-xs text-ink-soft">Loading...</div>;
  }

  const formattedCount = count.toString().padStart(6, "0");

  return (
    <div className="flex items-center gap-2 text-xs text-ink-soft">
      <span>You are visitor</span>
      <span className="bg-black px-2 py-0.5 font-mono tracking-widest text-green-400">
        #{formattedCount}
      </span>
    </div>
  );
}
