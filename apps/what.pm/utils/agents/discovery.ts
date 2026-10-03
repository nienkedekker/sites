import { SITE } from "@/utils/agents/negotiate";

export const DESCRIPTION =
  "what.pm is Nienke Dekker's public log of every book read, movie watched and TV season watched, organised by year.";

// https://llmstxt.org
export const LLMS_TXT = `# what.pm

> ${DESCRIPTION}

Every page below also answers in Markdown when requested with \`Accept: text/markdown\`. The what.pm API is public, read-only and needs no authentication.

## Pages

- [This year](${SITE}/): Everything logged so far this year, grouped into books, movies and TV shows
- [Year archive](${SITE}/year/2025): The log for one year; swap the year in the URL for any other
- [About](${SITE}/about): What what.pm is, with totals across every year

## what.pm API

- [OpenAPI spec](${SITE}/openapi.json): OpenAPI 3.1 description of the what.pm API
- [Year summary](${SITE}/api/v1/summary): JSON counts per type and month, plus the most recent books, movies and shows for a year. Query parameters: \`year\` (defaults to this year) and \`limit\` (1 to 20, default 5)
- [RSS feed](${SITE}/feed.xml): The 50 most recently logged items

## Optional

- [Source code](https://github.com/nienkedekker/sites): The monorepo behind what.pm and nienke.dev
- [Nienke Dekker](https://nienke.dev): The person keeping the log
`;

const count = { type: "integer", minimum: 0 };
const loggedAt = {
  type: ["string", "null"],
  format: "date-time",
  description: "When the item was logged",
};

export const OPENAPI = {
  openapi: "3.1.0",
  info: {
    title: "what.pm API",
    version: "1.0.0",
    description: `${DESCRIPTION} Read-only, no authentication, CORS open to every origin.`,
  },
  servers: [{ url: SITE }],
  externalDocs: { description: "what.pm for agents", url: `${SITE}/llms.txt` },
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
          "500": {
            description: "The log couldn't be read",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
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
        required: ["title", "author", "publishedYear", "reread", "loggedAt"],
        properties: {
          title: { type: "string" },
          author: { type: "string" },
          publishedYear: { type: "integer" },
          reread: { type: "boolean" },
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
  "@id": `${SITE}/#website`,
  name: "what.pm",
  alternateName: "what.",
  url: `${SITE}/`,
  description: DESCRIPTION,
  inLanguage: "en",
  author: {
    "@type": "Person",
    name: "Nienke Dekker",
    url: "https://nienke.dev",
    sameAs: ["https://github.com/nienkedekker"],
  },
};

// JSON.stringify leaves `<` alone, which would let a value close the script tag
export const jsonLdScript = (data: object) =>
  JSON.stringify(data).replace(/</g, "\\u003c");
