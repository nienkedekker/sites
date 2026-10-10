import { externalProps } from "@nienke/ui/external";
import type { Check, Link, Part, Status, Topology } from "../lib/nanami-report";

// Everything is laid out on a fixed grid and scaled to fit. Columns 1 to 4 sit
// inside nanami's outline, 0 and 5 outside it. The gap after column 2 is wider,
// so two buses can run through it. What goes where comes with nanami's report
const NODE = { w: 168, h: 58 };
const COLUMN_X = [16, 258, 486, 754, 982, 1230];
const rowY = (row: number) => 86 + row * 92;
const VIEW = { w: 1414, h: 632 };
const NANAMI = { x: 238, y: 16, w: 932, h: 600 };

const LIGHT: Record<Status | "unknown", string> = {
  ok: "fill-ok",
  warn: "fill-warn",
  down: "fill-down",
  unknown: "fill-none stroke-line-strong",
};

type Placed = Part & { at: [number, number] };

const box = ({ at: [column, row] }: Placed) => ({ x: COLUMN_X[column], y: rowY(row) });

// Right edge to left edge, bending once in the gap after `from` (or before `to`),
// or straight down within a column
function route(from: Placed, to: Placed, link: Link) {
  const a = box(from);
  const b = box(to);
  if (from.at[0] === to.at[0]) {
    const x = a.x + NODE.w / 2;
    const d = b.y > a.y ? `M${x} ${a.y + NODE.h} V${b.y}` : `M${x} ${a.y} V${b.y + NODE.h}`;
    return { d, labelAt: null };
  }
  // Links leave the side facing their target, so a few run right to left
  const rightward = to.at[0] > from.at[0];
  const start = {
    x: rightward ? a.x + NODE.w : a.x,
    y: a.y + NODE.h / 2 + (link.fromDy ?? 0),
  };
  const end = {
    x: rightward ? b.x : b.x + NODE.w,
    y: b.y + NODE.h / 2 + (link.toDy ?? 0),
  };
  const labelY = (y: number) => y + (link.labelBelow ? 14 : -7);
  if (start.y === end.y) {
    return {
      d: `M${start.x} ${start.y} H${end.x}`,
      labelAt: { x: (start.x + end.x) / 2, y: labelY(start.y) },
    };
  }
  // The bend sits in the gap beside `from` (or `to`), on the side the link heads
  const column = (link.bendIn === "to" ? to : from).at[0];
  const gapOnRight = rightward === (link.bendIn !== "to");
  const gapLeft = COLUMN_X[gapOnRight ? column : column - 1] + NODE.w;
  const gapRight = COLUMN_X[gapOnRight ? column + 1 : column];
  const bend = gapLeft + (gapRight - gapLeft) * (link.bend ?? 0.5);
  const atEnd = link.labelAt === "end";
  return {
    d: `M${start.x} ${start.y} H${bend} V${end.y} H${end.x}`,
    labelAt: {
      x: atEnd ? (bend + end.x) / 2 : (start.x + bend) / 2,
      y: labelY(atEnd ? end.y : start.y),
    },
  };
}

interface Props {
  checks: Record<string, Check>;
  topology: Topology;
}

// Geist Mono's letters are 0.6em wide, at the labels' 12px
const LABEL_CHAR = 7.2;

export default function NanamiDiagram({ checks, topology }: Props) {
  const network = checks.network;
  const placed = topology.stages
    .flatMap((stage) => stage.parts)
    .filter((part): part is Placed => !!part.at);
  const byId = new Map(placed.map((part) => [part.id, part]));
  const routed = topology.links.flatMap((link) => {
    const from = byId.get(link.from);
    const to = byId.get(link.to);
    return from && to ? [{ link, ...route(from, to, link) }] : [];
  });

  // The SVG is only a picture. A box's bold name that opens an app is a plain
  // HTML link laid over the box instead: links inside an SVG flicker between
  // cursors in Chrome and show no hand at all in Safari. Its size is in
  // container units, so it scales with the drawing
  return (
    <div className="relative" style={{ containerType: "inline-size" }}>
      <svg
        viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
        className="block h-auto w-full cursor-default select-none"
        aria-label="How nanami, the media server at home, fits together"
      >
        <defs>
          <marker
            id="nanami-arrow"
            viewBox="0 0 8 8"
            refX="8"
            refY="4"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L8 4 L0 8 z" className="fill-ink-faint" />
          </marker>
        </defs>

        <rect
          x={NANAMI.x}
          y={NANAMI.y}
          width={NANAMI.w}
          height={NANAMI.h}
          className="fill-none stroke-ink-faint"
          strokeDasharray="6 5"
        />
        <text x={NANAMI.x + 20} y={NANAMI.y + 28} className="fill-ink font-geist text-[15px]">
          nanami
        </text>
        {network && (
          <g>
            <rect
              x={NANAMI.x + 86}
              y={NANAMI.y + 18}
              width="9"
              height="9"
              className={LIGHT[network.status]}
            />
            <text
              x={NANAMI.x + 101}
              y={NANAMI.y + 27}
              className="fill-ink-soft font-mono text-[12px]"
            >
              Wi-Fi: {network.detail}
            </text>
          </g>
        )}

        {[
          ...topology.columns.map((text, column) => ({ text, x: COLUMN_X[column], y: 72 })),
          ...topology.subheadings.map(({ text, column, row }) => ({
            text,
            x: COLUMN_X[column],
            y: rowY(row) - 14,
          })),
        ].map(({ text, x, y }) => (
          <text
            key={text}
            x={x}
            y={y}
            className="fill-ink-faint font-mono text-[12px] uppercase"
            letterSpacing="0.06em"
          >
            {text}
          </text>
        ))}

        {/* Key for the dashed lines, in the bottom-left corner */}
        <g>
          <line
            x1={COLUMN_X[0]}
            x2={COLUMN_X[0] + 32}
            y1={rowY(5) + NODE.h / 2}
            y2={rowY(5) + NODE.h / 2}
            className="stroke-ink-faint"
            strokeWidth="1.25"
            strokeDasharray="4 4"
          />
          <text
            x={COLUMN_X[0] + 42}
            y={rowY(5) + NODE.h / 2 + 4}
            className="fill-ink-faint font-mono text-[12px]"
          >
            background work
          </text>
        </g>

        {routed.map(({ link, d }) => (
          <path
            key={`${link.from}-${link.to}`}
            d={d}
            fill="none"
            className="stroke-ink-faint"
            strokeWidth="1.25"
            strokeDasharray={link.dashed ? "4 4" : undefined}
            markerStart={link.twoWay ? "url(#nanami-arrow)" : undefined}
            markerEnd="url(#nanami-arrow)"
          />
        ))}

        {/* Labels go on top of every line, each on a patch of the card's colour.
            The font is monospaced, so a label is as wide as its letters */}
        {routed.map(({ link, labelAt }) => {
          if (!link.label || !labelAt) return null;
          const width = link.label.length * LABEL_CHAR + 10;
          return (
            <g key={`${link.from}-${link.to}-label`}>
              <rect
                x={labelAt.x - width / 2}
                y={labelAt.y - 12}
                width={width}
                height={16}
                className="fill-panel"
              />
              <text
                x={labelAt.x}
                y={labelAt.y}
                textAnchor="middle"
                className="fill-ink-faint font-mono text-[12px]"
              >
                {link.label}
              </text>
            </g>
          );
        })}

        {placed.map((part) => {
          const { x, y } = box(part);
          const status: Status | "unknown" | null = part.check
            ? (checks[part.check]?.status ?? "unknown")
            : null;
          const textX = x + (status ? 29 : 12);
          return (
            <g key={part.id}>
              <rect
                x={x}
                y={y}
                width={NODE.w}
                height={NODE.h}
                className={`fill-panel ${status === "down" ? "stroke-down" : "stroke-rule"}`}
                strokeWidth={status === "down" ? 2 : 1}
              />
              {status && (
                <rect x={x + 12} y={y + 16} width="9" height="9" className={LIGHT[status]} />
              )}
              {!part.href && (
                <text x={textX} y={y + 26} className="fill-ink text-[15px] font-medium">
                  {part.name}
                </text>
              )}
              <text x={textX} y={y + 45} className="fill-ink-faint font-mono text-[12px]">
                {part.role}
              </text>
            </g>
          );
        })}
      </svg>
      {placed
        .filter((part): part is Placed & { href: string } => !!part.href)
        .map((part) => {
          const { x, y } = box(part);
          const textX = x + (part.check ? 29 : 12);
          return (
            <a
              key={part.id}
              href={part.href}
              {...externalProps(part.href)}
              className="absolute leading-none font-medium whitespace-nowrap text-ink underline decoration-1 underline-offset-2"
              style={{
                left: `${(textX / VIEW.w) * 100}%`,
                // With a line height of 1, Inter's baseline sits about 0.87em down,
                // which puts it where the SVG names sit
                top: `${((y + 26 - 15 * 0.87) / VIEW.h) * 100}%`,
                fontSize: `${(15 / VIEW.w) * 100}cqw`,
              }}
            >
              {part.name}
            </a>
          );
        })}
    </div>
  );
}
