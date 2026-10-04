import { describe, expect, it } from "vitest";
import { bookGenres } from "@/utils/data/book-genres";

describe("bookGenres", () => {
  it("picks one genre out of OpenLibrary's other subjects", () => {
    expect(
      bookGenres([
        "FICTION / Mystery & Detective / General",
        "Married people",
        "FICTION / Thrillers",
        "New York Times bestseller",
        "Large type books",
      ]),
    ).toEqual(["Mystery & Crime"]);
  });

  it("reads Google Books categories", () => {
    expect(
      bookGenres(["Fiction / Historical / Renaissance", "Fiction / Literary"]),
    ).toEqual(["Historical Fiction"]);
  });

  it("counts manga as comics, whatever it's about", () => {
    expect(
      bookGenres([
        "Comics & graphic novels, manga, fantasy",
        "Comics & graphic novels, manga, horror",
      ]),
    ).toEqual(["Comics & Manga"]);
  });

  it("doesn't call a novel about history a history book", () => {
    expect(
      bookGenres(["African American Historical Fiction", "history", "slavery"]),
    ).toEqual(["Historical Fiction"]);
    expect(bookGenres(["History", "World War, 1939-1945"])).toEqual([
      "History",
    ]);
  });

  it("finds memoirs, but not in nonfiction-sounding fiction tags", () => {
    expect(bookGenres(["Biography & Autobiography / Memoirs"])).toEqual([
      "Memoir & Biography",
    ]);
    expect(bookGenres(["Nonfiction", "Essays"])).toEqual(["Essays"]);
  });

  it("skips bookshop shelves and medieval romances", () => {
    expect(
      bookGenres(["Science fiction, fantasy, horror", "Fiction, horror"]),
    ).toEqual(["Horror"]);
    expect(bookGenres(["Romance literature", "Arthurian romances"])).toEqual(
      [],
    );
  });

  it("calls fiction without a genre heading literary fiction", () => {
    expect(bookGenres(["Fiction", "Dublin (ireland), fiction"])).toEqual([
      "Literary Fiction",
    ]);
  });

  it("returns nothing when no subject says what it is", () => {
    expect(bookGenres(["Married people", "Honeymoons"])).toEqual([]);
    expect(bookGenres()).toEqual([]);
  });
});
