interface MeterProps {
  value: number;
  max?: number;
  fill?: string;
  className?: string;
}

export default function Meter({
  value,
  max = 100,
  fill = "bg-accent",
  className = "",
}: MeterProps) {
  return (
    <span
      className={`block h-1 overflow-hidden bg-line ${className}`}
      aria-hidden="true"
    >
      <span
        className={`block h-full transition-[width] duration-700 ${fill}`}
        style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
      />
    </span>
  );
}
