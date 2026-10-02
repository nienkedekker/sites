export default function SiteMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`grid size-6 place-items-center bg-ink ${className}`}
      aria-hidden="true"
    >
      <span className="size-3 bg-movies" />
    </span>
  );
}
