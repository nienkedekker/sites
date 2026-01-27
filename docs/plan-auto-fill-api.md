# Auto-fill from External APIs (TMDB/OpenLibrary)

## Overview

Add auto-fill functionality to the create item form using:
- **TMDB** (The Movie Database) for movies and TV shows
- **OpenLibrary** for books

When users type a title, suggestions appear. Selecting one auto-populates fields.

## UX Approach

**Debounced combobox/autocomplete pattern:**
- User types in title field
- After 300ms, dropdown shows search results (title, year, creator)
- Click result to auto-fill, or continue typing manually
- Escape dismisses dropdown, user can always ignore suggestions

## Fields Auto-Populated

| Type | Fields Filled |
|------|--------------|
| Book | title, author, published year |
| Movie | title, director, release year |
| TV Show | title, release year (season stays manual) |

## Architecture

- **Server Actions** for API calls (keeps API keys secure)
- **No cover images** for now (can add later)
- **Caching** with Next.js fetch cache (1 hour)

## Files to Create

```
apps/web/
├── app/actions/external-search.ts     # Server actions for TMDB/OpenLibrary
├── components/forms/title-autocomplete.tsx  # Autocomplete component
├── utils/hooks/use-debounce.ts        # Debounce hook
└── types/external-api.ts              # Type definitions
```

## Files to Modify

- `apps/web/components/forms/create-item-form.tsx` - Replace title Input with TitleAutocomplete
- `.env.local` - Add `TMDB_API_KEY`

## Getting a TMDB API Key (Free)

1. Go to https://www.themoviedb.org/signup and create an account
2. Go to Settings → API (or https://www.themoviedb.org/settings/api)
3. Click "Create" → Choose "Developer"
4. Fill in the form (use your app URL for "Application URL", any description works)
5. Copy the "API Key" (not the access token)
6. Add to `.env.local`: `TMDB_API_KEY=your_key_here`

## API Details

### OpenLibrary (Books) - No API key needed
```
GET https://openlibrary.org/search.json?q={query}&limit=8
Response: { docs: [{ title, author_name[], first_publish_year }] }
```

### TMDB (Movies/Shows) - Requires API key
```
GET https://api.themoviedb.org/3/search/movie?query={query}&api_key={key}
GET https://api.themoviedb.org/3/search/tv?query={query}&api_key={key}
GET https://api.themoviedb.org/3/movie/{id}/credits?api_key={key}  # For director
```

## Implementation Steps

### Phase 1: Setup
1. Get TMDB API key (see above) and add to `.env.local`
2. Create `types/external-api.ts` with result types
3. Create `utils/hooks/use-debounce.ts`

### Phase 2: Server Actions
4. Create `app/actions/external-search.ts`:
   - `searchBooks(query)` - OpenLibrary
   - `searchMovies(query)` - TMDB movies
   - `searchShows(query)` - TMDB TV
   - `getMovieDirector(tmdbId)` - TMDB credits (fetched on select)

### Phase 3: UI Components
5. Create `components/forms/title-autocomplete.tsx`:
   - Wraps Input with dropdown
   - Debounced search calls
   - Keyboard navigation (arrows, Enter, Escape)
   - Loading and error states

### Phase 4: Form Integration
6. Modify `create-item-form.tsx`:
   - Replace title Input with TitleAutocomplete
   - Handle `onSelectResult` to populate form fields
   - Pass `itemType` prop (Book/Movie/Show)

### Phase 5: Polish
7. Add loading states, error handling, accessibility

## Type Definitions

```typescript
interface ExternalSearchResult {
  externalId: string;
  title: string;
  year: number | null;
  creator: string | null;  // author/director
  source: 'tmdb' | 'openlibrary';
}
```

## Verification

- [ ] Book search populates title, author, year
- [ ] Movie search populates title, director, year
- [ ] TV show search populates title, year
- [ ] Manual entry still works (ignore suggestions)
- [ ] Keyboard navigation works
- [ ] Graceful fallback when API fails
- [ ] Tab switching resets search state
