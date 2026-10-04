// OpenLibrary subjects mix genres with everything else ("New York Times
// bestseller", "Dublin (ireland), fiction", "Large type books"), and Google
// Books categories read "Fiction / Fantasy / Epic". A book gets one genre:
// the first of these its subjects match, in this order.
const GENRES: [string, RegExp][] = [
  ["Comics & Manga", /comic|graphic novel|manga/],
  ["Fantasy", /fantasy/],
  ["Science Fiction", /science fiction|sci-fi|space opera|dystopia|cyberpunk/],
  ["Horror", /horror/],
  ["Mystery & Crime", /mystery|detective|crime fiction|fiction.{0,3}crime/],
  ["Thriller", /thriller|suspense/],
  ["Romance", /romance\b(?! literature)|love stories/],
  ["Historical Fiction", /historical fiction|fiction.{0,3}historical/],
  ["Literary Fiction", /literary fiction|fiction.{0,3}literary/],
  ["Short Stories", /short stories/],
  ["Poetry", /poetry|poems/],
  ["Humor", /humou?r/],
  ["Young Adult", /young adult|juvenile fiction/],
];

const NONFICTION_GENRES: [string, RegExp][] = [
  ["Memoir & Biography", /biography|memoir|autobiography/],
  ["History", /^history\b|[,/] ?history\b/],
  ["Essays", /essays/],
];

const isFiction = /(?<!non-?)fiction|novel/;
// A bookshop shelf, not a description of the book
const SHELF = /science fiction, fantasy, horror/;

export function bookGenres(subjects: string[] = []): string[] {
  const lower = subjects
    .map((subject) => subject.toLowerCase())
    .filter((subject) => !SHELF.test(subject));
  const fiction = lower.some((subject) => isFiction.test(subject));
  // A novel tagged "history" or "biography" is about those, not one of them
  const rules = fiction ? GENRES : [...GENRES, ...NONFICTION_GENRES];
  const match = rules.find(([, pattern]) =>
    lower.some((subject) => pattern.test(subject)),
  );
  if (match) return [match[0]];
  // Library catalogues give genre fiction a genre heading but literary novels
  // only "Fiction" and their topics
  return fiction ? ["Literary Fiction"] : [];
}
