import { describe, expect, it } from "vitest";
import { googleCoverUrl } from "@/utils/server/covers";

describe("googleCoverUrl", () => {
  it("serves over https without the page curl", () => {
    expect(
      googleCoverUrl(
        "http://books.google.com/books/publisher/content?id=CeDGEQAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl",
      ),
    ).toBe(
      "https://books.google.com/books/publisher/content?id=CeDGEQAAQBAJ&printsec=frontcover&img=1&zoom=1",
    );
  });

  it("has nothing without a thumbnail", () => {
    expect(googleCoverUrl(undefined)).toBeNull();
  });
});
