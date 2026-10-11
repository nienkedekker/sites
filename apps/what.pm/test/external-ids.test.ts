import { describe, expect, it } from "vitest";
import {
  isExternalId,
  isUnmatched,
  unmatchedId,
} from "@/utils/data/external-ids";

describe("unmatchedId", () => {
  it("keys a book by its title and author", () => {
    expect(unmatchedId("The Minimalist", "Brandon Taylor")).toBe(
      "unmatched:the-minimalist-brandon-taylor",
    );
  });

  it("gives the same key however the title is written", () => {
    expect(unmatchedId("The Minimalist: A Novel ", "Ébo")).toBe(
      unmatchedId("the minimalist — a novel", "Ebo"),
    );
  });

  it("fits what up next accepts as an id", () => {
    expect(unmatchedId("a".repeat(300), "b").length).toBeLessThanOrEqual(100);
  });

  it("is never taken for an id something can be looked up by", () => {
    const id = unmatchedId("The Minimalist", "Brandon Taylor");
    expect(isUnmatched(id)).toBe(true);
    expect(isExternalId("Book", id)).toBe(false);
    expect(isUnmatched("/works/OL1W")).toBe(false);
  });
});
