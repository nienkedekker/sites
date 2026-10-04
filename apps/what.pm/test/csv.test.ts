import { describe, expect, it } from "vitest";
import { itemsToCSV } from "@/utils/export/csv";
import { book, movie } from "./items";

describe("itemsToCSV", () => {
  it("escapes quotes and newlines in every text field", () => {
    const [, bookRow, movieRow] = itemsToCSV([
      book({ title: "Kafka", author: 'Haruki "H" Murakami' }),
      movie({ title: "Dune", director: "Denis\nVilleneuve" }),
    ]).split("\n");

    expect(bookRow).toContain('"Haruki ""H"" Murakami"');
    expect(movieRow).toContain('"Denis Villeneuve"');
  });

  it("returns just the header row when there's nothing to export", () => {
    expect(itemsToCSV([])).toBe(
      "Title,Type,Author,Director,Season,Published Year,Year Logged,Re-read/Re-watched,Created At,Updated At",
    );
  });
});
