interface HighlightTextProps {
  text: string;
  query: string;
  className?: string;
}

export function HighlightText({ text, query, className }: HighlightTextProps) {
  if (!query.trim() || !text) return <>{text}</>;

  const regex = new RegExp(
    `(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} className="bg-movies px-0.5 text-white">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </span>
  );
}
