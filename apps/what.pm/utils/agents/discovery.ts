import {
  IS_MINE,
  OWNER_FIRST_NAME,
  OWNER_NAME,
  OWNER_URL,
  SITE_NAME,
  SITE_URL,
  SOURCE_URL,
} from "@/utils/constants/site";

export const DESCRIPTION = `${SITE_NAME} is ${OWNER_NAME}'s public log of every book read, movie watched and TV season watched, organised by year.`;

// https://llmstxt.org
export const LLMS_TXT = `# ${SITE_NAME}

> ${DESCRIPTION}

Every page below also answers in Markdown when requested with \`Accept: text/markdown\`. The ${SITE_NAME} API is public, read-only and needs no authentication.

## Pages

- [This year](${SITE_URL}/): Everything logged so far this year, grouped into books, movies and TV shows
- [Year archive](${SITE_URL}/year/2025): The log for one year; swap the year in the URL for any other
- [About](${SITE_URL}/about): What ${SITE_NAME} is, with totals across every year

## ${SITE_NAME} API

- [OpenAPI spec](${SITE_URL}/openapi.json): OpenAPI 3.1 description of the ${SITE_NAME} API
- [Year summary](${SITE_URL}/api/v1/summary): JSON counts per type and month, plus the most recent books, movies and shows for a year. Query parameters: \`year\` (defaults to this year) and \`limit\` (1 to 20, default 5)
- [Up next movies](${SITE_URL}/api/v1/up-next/movies): JSON list of movies ${OWNER_FIRST_NAME} wants to watch, by TMDB id, in Radarr's Custom List format
- [Up next shows](${SITE_URL}/api/v1/up-next/shows): JSON list of shows ${OWNER_FIRST_NAME} wants to watch, by TheTVDB id, in Sonarr's Custom List format
- [Up next books](${SITE_URL}/api/v1/up-next/books): JSON list of books ${OWNER_FIRST_NAME} wants to read, with title, author and year
- [RSS feed](${SITE_URL}/feed.xml): The 50 most recently logged items

## Optional

- [Source code](${SOURCE_URL}): The monorepo behind what.pm and nienke.dev
- [${OWNER_NAME}](${OWNER_URL}): The person keeping the log
`;

const count = { type: "integer", minimum: 0 };
const failed = {
  description: "The log couldn't be read",
  content: {
    "application/json": { schema: { $ref: "#/components/schemas/Error" } },
  },
};

const upNextList = (operationId: string, summary: string, item: string) => ({
  get: {
    operationId,
    summary,
    responses: {
      "200": {
        description: "Everything in up next that isn't logged yet",
        content: {
          "application/json": {
            schema: {
              type: "array",
              items: { $ref: `#/components/schemas/${item}` },
            },
          },
        },
      },
      "500": failed,
    },
  },
});
const loggedAt = {
  type: ["string", "null"],
  format: "date-time",
  description: "When the item was logged",
};

export const OPENAPI = {
  openapi: "3.1.0",
  info: {
    title: `${SITE_NAME} API`,
    version: "1.0.0",
    description: `${DESCRIPTION} Read-only, no authentication, CORS open to every origin.`,
  },
  servers: [{ url: SITE_URL }],
  externalDocs: {
    description: `${SITE_NAME} for agents`,
    url: `${SITE_URL}/llms.txt`,
  },
  paths: {
    "/api/v1/summary": {
      get: {
        operationId: "getYearSummary",
        summary: "Summarise one year of the log",
        parameters: [
          {
            name: "year",
            in: "query",
            description: "Year to summarise. Defaults to the current year.",
            schema: { type: "integer", minimum: 1900 },
          },
          {
            name: "limit",
            in: "query",
            description: "How many recent items to return per type.",
            schema: { type: "integer", minimum: 1, maximum: 20, default: 5 },
          },
        ],
        responses: {
          "200": {
            description: "The year's summary",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SummaryResponse" },
              },
            },
          },
          "400": {
            description: "`year` or `limit` is out of range",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": failed,
        },
      },
    },
    "/api/v1/up-next/movies": upNextList(
      "getUpNextMovies",
      "Movies to watch next, as a Radarr Custom List",
      "UpNextMovie",
    ),
    "/api/v1/up-next/shows": upNextList(
      "getUpNextShows",
      "Shows to watch next, as a Sonarr Custom List",
      "UpNextShow",
    ),
    "/api/v1/up-next/books": upNextList(
      "getUpNextBooks",
      "Books to read next, with what a search needs",
      "UpNextBook",
    ),
  },
  components: {
    schemas: {
      Counts: {
        type: "object",
        required: ["books", "movies", "shows"],
        properties: { books: count, movies: count, shows: count },
      },
      MonthCounts: {
        type: "object",
        required: ["month", "books", "movies", "shows"],
        properties: {
          month: { type: "integer", minimum: 0, maximum: 11 },
          books: count,
          movies: count,
          shows: count,
        },
      },
      Book: {
        type: "object",
        required: [
          "title",
          "author",
          "publishedYear",
          "reread",
          "inProgress",
          "loggedAt",
        ],
        properties: {
          title: { type: "string" },
          author: { type: "string" },
          publishedYear: { type: "integer" },
          reread: { type: "boolean" },
          inProgress: { type: "boolean" },
          loggedAt,
        },
      },
      Movie: {
        type: "object",
        required: ["title", "director", "releaseYear", "loggedAt"],
        properties: {
          title: { type: "string" },
          director: { type: "string" },
          releaseYear: { type: "integer" },
          loggedAt,
        },
      },
      Show: {
        type: "object",
        required: ["title", "season", "inProgress", "loggedAt"],
        properties: {
          title: { type: "string" },
          season: { type: "integer" },
          inProgress: { type: "boolean" },
          loggedAt,
        },
      },
      SummaryResponse: {
        type: "object",
        required: ["year", "counts", "months", "recent", "url"],
        properties: {
          year: { type: "integer" },
          counts: { $ref: "#/components/schemas/Counts" },
          months: {
            type: "array",
            items: { $ref: "#/components/schemas/MonthCounts" },
          },
          recent: {
            type: "object",
            required: ["books", "movies", "shows"],
            properties: {
              books: {
                type: "array",
                items: { $ref: "#/components/schemas/Book" },
              },
              movies: {
                type: "array",
                items: { $ref: "#/components/schemas/Movie" },
              },
              shows: {
                type: "array",
                items: { $ref: "#/components/schemas/Show" },
              },
            },
          },
          url: { type: "string", format: "uri" },
        },
      },
      UpNextMovie: {
        type: "object",
        required: ["id", "title"],
        properties: {
          id: { type: "integer", description: "TMDB movie id" },
          title: { type: "string" },
        },
      },
      UpNextShow: {
        type: "object",
        required: ["tvdbId", "title"],
        properties: {
          tvdbId: { type: "integer", description: "TheTVDB series id" },
          title: { type: "string" },
        },
      },
      UpNextBook: {
        type: "object",
        required: ["id", "title", "author", "year"],
        properties: {
          id: {
            type: "string",
            description: "OpenLibrary work key or Google Books id",
          },
          title: { type: "string" },
          author: { type: ["string", "null"] },
          year: { type: ["integer", "null"] },
        },
      },
      Error: {
        type: "object",
        required: ["error"],
        properties: { error: { type: "string" } },
      },
    },
  },
};

export const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  alternateName: "what.",
  url: `${SITE_URL}/`,
  description: DESCRIPTION,
  inLanguage: "en",
  author: {
    "@type": "Person",
    name: OWNER_NAME,
    url: OWNER_URL,
    ...(IS_MINE && { sameAs: ["https://github.com/nienkedekker"] }),
  },
};

// JSON.stringify leaves `<` alone, which would let a value close the script tag
export const jsonLdScript = (data: object) =>
  JSON.stringify(data).replace(/</g, "\\u003c");
