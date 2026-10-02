import { useState, useEffect } from "react";

export default function VisitorCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // Check if we've already counted this session
    const hasVisited = sessionStorage.getItem("counted");

    if (hasVisited) {
      // Just fetch the count without incrementing
      fetch("/api/visitor-count")
        .then((res) => res.json())
        .then((data) => setCount(data.count))
        .catch(() => setCount(0));
    } else {
      // Increment and fetch
      fetch("/api/visitor-count", { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          setCount(data.count);
          sessionStorage.setItem("counted", "true");
        })
        .catch(() => setCount(0));
    }
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
