const CELL = "[data-heat-cell]";

const filled = (cells: (HTMLElement | null)[]) =>
  cells.filter((cell): cell is HTMLElement => cell !== null);

export function bindHeatGrid(table: HTMLTableElement) {
  const grid = [...table.tBodies[0].rows].map((row) =>
    [...row.cells].map((cell) => cell.querySelector<HTMLElement>(CELL)),
  );
  const controller = new AbortController();
  const { signal } = controller;

  table.addEventListener(
    "focusin",
    (event) => {
      const focused = (event.target as HTMLElement).closest(CELL);
      if (!focused) return;
      table.querySelectorAll<HTMLElement>(CELL).forEach((cell) => {
        cell.tabIndex = cell === focused ? 0 : -1;
      });
    },
    { signal },
  );

  table.addEventListener(
    "keydown",
    (event) => {
      const cell = (event.target as HTMLElement).closest<HTMLElement>(CELL);
      if (!cell) return;
      const r = grid.findIndex((row) => row.includes(cell));
      const c = grid[r].indexOf(cell);
      const row = grid[r];
      const targets: Record<string, HTMLElement | null | undefined> = {
        ArrowLeft: filled(row.slice(0, c)).at(-1),
        ArrowRight: filled(row.slice(c + 1))[0],
        ArrowUp: grid[r - 1]?.[c],
        ArrowDown: grid[r + 1]?.[c],
        Home: filled(row)[0],
        End: filled(row).at(-1),
      };
      if (!(event.key in targets)) return;
      event.preventDefault();
      targets[event.key]?.focus();
    },
    { signal },
  );

  return () => controller.abort();
}
