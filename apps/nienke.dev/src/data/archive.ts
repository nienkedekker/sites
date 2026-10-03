import { ljIcons, ljIconsArchive } from "./lj-icons";
import { oldSiteId, oldSites } from "./old-sites";
import { fandoms, tumblrPosts } from "./tumblr-posts";

export const archiveIntro =
  "I (fortunately?) have a very long internet footprint. I've never been good at keeping backups but I trawled the Wayback Machine and found things going back all the way to 2002. Have a look!";

export interface Era {
  name: string;
  years: string;
  start: number;
  end: number;
  href: string;
  // For dates I only remember roughly.
  fuzzy?: boolean;
}

export interface Collection {
  slug: string;
  title: string;
  years: string;
  items: string;
  modified: string;
  description: string;
  eras: Era[];
}

const now = new Date();
const thisYear = now.getFullYear() + now.getMonth() / 12;

const yearSpan = (years: string) => {
  const [first, last = first] = years.split("–");
  return {
    start: Number(first),
    end: last === "now" ? thisYear : Number(last) + 1,
  };
};

const firstAndLast = (eras: { years: string }[]) =>
  `${eras[0].years.split("–")[0]}–${eras.at(-1)!.years.split("–").at(-1)}`;

const waybackTime = (url: string) =>
  url.replace(/^.*\/web\/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2}).*$/, "$1-$2-$3 $4:$5");

const tumblrBlogs = [
  { name: "vanderfield", years: "2010–2011" },
  { name: "sevenhells, later shinyhats", years: "2011–2015" },
];

const snapshots = oldSites.reduce((total, site) => total + site.snapshots.length, 0);

export const archiveCollections: Collection[] = [
  {
    slug: "old-sites",
    title: "Old sites",
    years: firstAndLast(oldSites),
    items: `${oldSites.length} sites · ${snapshots} snapshots`,
    modified: waybackTime(oldSites.at(-1)!.snapshots.at(-1)!.archive),
    description: "Every personal website, rebuilt from the Wayback Machine",
    eras: oldSites.map(({ domain, years }) => ({
      name: domain,
      years,
      ...yearSpan(years),
      href: `/old-sites#${oldSiteId(domain)}`,
    })),
  },
  {
    slug: "lj-icons",
    title: "LiveJournal icons",
    years: "Late 2000s–early 2010s",
    items: `${ljIcons.length} icons`,
    modified: waybackTime(ljIconsArchive),
    description: "LiveJournal icons",
    eras: [
      {
        name: "LiveJournal icons",
        years: "Late 2000s to early 2010s, roughly",
        start: 2006,
        end: 2013,
        href: "/lj-icons",
        fuzzy: true,
      },
    ],
  },
  {
    slug: "tumblr",
    title: "Tumblr",
    years: firstAndLast(tumblrBlogs),
    items: `${tumblrPosts.length} posts · ${fandoms.length} interests`,
    // The Tumblr export only has dates, not times.
    modified: tumblrPosts
      .map(({ date }) => date)
      .sort()
      .at(-1)!,
    description: "My Tumblr blogs",
    eras: tumblrBlogs.map((blog) => ({
      ...blog,
      ...yearSpan(blog.years),
      href: "/tumblr",
    })),
  },
];

export const archiveStart = Math.min(
  ...archiveCollections.flatMap(({ eras }) => eras.map(({ start }) => start))
);
export const archiveEnd = thisYear;
