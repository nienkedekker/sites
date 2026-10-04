import { prefersLessMotion } from "./motion";

// Letters near the pointer widen by up to this much; the rest of the line
// narrows to make room, so the line keeps its width.
const GROWTH = 0.2;

export interface SwellLetter {
  x: number;
  width: number;
  advance: number;
}

export interface SwellTransform {
  translate: number;
  scale: number;
}

export function swellLine(
  letters: SwellLetter[],
  pointerX: number,
  amount: number,
  radius: number
): SwellTransform[] {
  if (!letters.length) return [];
  const grow = letters.map(({ x, width }) => {
    const d = (x + width / 2 - pointerX) / radius;
    return 1 + GROWTH * amount * Math.exp(-d * d);
  });
  const total = letters.reduce((sum, l) => sum + l.advance, 0);
  const grown = letters.reduce((sum, l, i) => sum + l.advance * grow[i], 0);
  const fit = total / grown;

  let pos = letters[0].x;
  return letters.map((letter, i) => {
    const scale = grow[i] * fit;
    const translate = pos - letter.x;
    pos += letter.advance * scale;
    return { translate, scale };
  });
}

// Where the swell sits along a line on a touch screen: it travels from the
// start to the end of the line as the line scrolls from the bottom of the
// viewport to the top, and fades out near both edges.
export function scrollSwell(centerY: number, viewportHeight: number) {
  const progress = 1 - centerY / viewportHeight;
  const amount =
    progress > 0 && progress < 1
      ? Math.min(1, Math.sin(Math.PI * progress) * 1.6)
      : 0;
  return { progress, amount };
}

const POINTER_QUERY = "(hover: hover) and (pointer: fine)";
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function canSwell() {
  return !prefersLessMotion();
}

const followsPointer = () => matchMedia(POINTER_QUERY).matches;

export function subscribeSwell(onChange: () => void) {
  const queries = [matchMedia(POINTER_QUERY), matchMedia(MOTION_QUERY)];
  queries.forEach((q) => q.addEventListener("change", onChange));
  return () =>
    queries.forEach((q) => q.removeEventListener("change", onChange));
}

export function swellWords(text: string) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => [...word]);
}

// For markup no framework owns: rewrites each text node into words of letter
// spans, keeping the plain text for screen readers.
export function splitSwell(root: HTMLElement) {
  if (root.querySelector(".swell-l")) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);

  for (const node of nodes) {
    const text = node.data;
    if (!text.trim()) continue;
    const label = document.createElement("span");
    label.className = "sr-only";
    label.textContent = text;
    const visual = document.createElement("span");
    visual.setAttribute("aria-hidden", "true");
    if (/^\s/.test(text)) visual.append(" ");
    swellWords(text).forEach((letters, i) => {
      if (i > 0) visual.append(" ");
      const word = document.createElement("span");
      word.className = "swell-w";
      for (const ch of letters) {
        const letter = document.createElement("span");
        letter.className = "swell-l";
        letter.textContent = ch;
        word.append(letter);
      }
      visual.append(word);
    });
    if (/\s$/.test(text)) visual.append(" ");
    node.replaceWith(label, visual);
  }
}

let canvas: CanvasRenderingContext2D | null = null;

// Letters set as inline blocks lose kerning, so put it back as margins.
function kern(root: HTMLElement) {
  const first = root.querySelector<HTMLElement>(".swell-l");
  if (!first) return;
  canvas ??= document.createElement("canvas").getContext("2d");
  if (!canvas) return;
  const style = getComputedStyle(first);
  const size = parseFloat(style.fontSize);
  canvas.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  canvas.fontKerning = "normal";
  const width = (s: string) => canvas!.measureText(s).width;

  root.querySelectorAll(".swell-w").forEach((word) => {
    const letters = [...word.querySelectorAll<HTMLElement>(".swell-l")];
    letters.forEach((letter, i) => {
      const next = letters[i + 1];
      if (!next) return;
      const a = letter.textContent ?? "";
      const b = next.textContent ?? "";
      const pair = width(a + b) - width(a) - width(b);
      letter.style.marginRight =
        Math.abs(pair) > 0.05 ? `${pair / size}em` : "";
    });
  });
}

interface Line {
  top: number;
  bottom: number;
  els: HTMLElement[];
  letters: SwellLetter[];
  amount: number;
  pointerX: number;
  active: boolean;
}

interface Swell {
  root: HTMLElement;
  lines: Line[];
  radius: number;
}

const swells = new Set<Swell>();
let pointer: { x: number; y: number } | null = null;
let frame = 0;
let listening = false;

function reset(swell: Swell) {
  swell.lines.forEach((line) =>
    line.els.forEach((el) => (el.style.transform = ""))
  );
}

function measure(swell: Swell) {
  reset(swell);
  const box = swell.root.getBoundingClientRect();
  const els = [...swell.root.querySelectorAll<HTMLElement>(".swell-l")];
  const rects = els.map((el) => el.getBoundingClientRect());
  const size = els[0] ? parseFloat(getComputedStyle(els[0]).fontSize) : 16;
  swell.radius = size;

  const lines: Line[] = [];
  els.forEach((el, i) => {
    const r = rects[i];
    const top = r.top - box.top;
    let line = lines.find((l) => Math.abs(l.top - top) < size * 0.3);
    if (!line) {
      line = {
        top,
        bottom: r.bottom - box.top,
        els: [],
        letters: [],
        amount: 0,
        pointerX: 0,
        active: false,
      };
      lines.push(line);
    }
    line.els.push(el);
    line.letters.push({
      x: r.left - box.left,
      width: r.width,
      advance: r.width,
    });
  });
  for (const line of lines) {
    line.letters.forEach((l, i) => {
      const next = line.letters[i + 1];
      if (next) l.advance = next.x - l.x;
    });
  }
  swell.lines = lines;
}

function tick() {
  let busy = false;
  const pointerMode = followsPointer();
  for (const swell of swells) {
    if (!swell.root.isConnected) {
      swells.delete(swell);
      continue;
    }
    const box = swell.root.getBoundingClientRect();
    for (const line of swell.lines) {
      if (!pointerMode) {
        const top = box.top + line.top;
        const { progress, amount } = scrollSwell(
          top + (line.bottom - line.top) / 2,
          innerHeight
        );
        const first = line.letters[0];
        const last = line.letters[line.letters.length - 1];
        const start = first.x - swell.radius;
        const span = last.x + last.advance + swell.radius - start;
        line.pointerX = start + progress * span;
        line.amount = amount;
        paint(line, swell.radius);
        continue;
      }

      let target = 0;
      if (pointer) {
        const top = box.top + line.top;
        const bottom = box.top + line.bottom;
        const dy = Math.max(top - pointer.y, pointer.y - bottom, 0);
        target = Math.exp(-((dy / ((bottom - top) * 0.75)) ** 2));
        const x = pointer.x - box.left;
        line.pointerX =
          line.amount < 0.01 ? x : line.pointerX + (x - line.pointerX) * 0.3;
        if (Math.abs(x - line.pointerX) > 0.5) busy = true;
      }
      line.amount += (target - line.amount) * 0.15;
      if (Math.abs(target - line.amount) > 0.002) busy = true;

      paint(line, swell.radius);
    }
  }
  frame = busy ? requestAnimationFrame(tick) : 0;
}

function paint(line: Line, radius: number) {
  if (line.amount < 0.002) {
    if (line.active) line.els.forEach((el) => (el.style.transform = ""));
    line.active = false;
    return;
  }
  line.active = true;
  swellLine(line.letters, line.pointerX, line.amount, radius).forEach(
    ({ translate, scale }, i) => {
      line.els[i].style.transform =
        `translateX(${translate.toFixed(2)}px) scaleX(${scale.toFixed(4)})`;
    }
  );
}

function wake() {
  if (!frame) frame = requestAnimationFrame(tick);
}

function listen() {
  if (listening) return;
  listening = true;
  addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      pointer = { x: e.clientX, y: e.clientY };
      wake();
    },
    { passive: true }
  );
  document.documentElement.addEventListener("pointerleave", () => {
    pointer = null;
    wake();
  });
  addEventListener("scroll", wake, { passive: true });
  addEventListener("resize", wake, { passive: true });
}

// Kerns the letters inside `root` and makes them swell: under the pointer on
// devices with a mouse, along with the scroll on touch screens. Returns a
// cleanup function.
export function registerSwell(root: HTMLElement) {
  kern(root);
  if (!canSwell()) return () => {};
  listen();
  const swell: Swell = { root, lines: [], radius: 16 };
  measure(swell);
  swells.add(swell);
  wake();
  const observer = new ResizeObserver(() => {
    measure(swell);
    wake();
  });
  observer.observe(root);
  document.fonts.ready.then(() => {
    if (!swells.has(swell)) return;
    kern(root);
    measure(swell);
    wake();
  });
  return () => {
    observer.disconnect();
    swells.delete(swell);
    reset(swell);
  };
}
