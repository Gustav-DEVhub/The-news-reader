# News Reader

News Reader is a lightweight news-reading web application that uses TheNewsAPI. The project includes:

- A React + Vite frontend located in `web/`.
- An Express proxy/server in `server/` that keeps the API key on the server.

Purpose

Allow users to explore news by category or search, save favorites, and navigate via pagination while keeping TheNewsAPI key secure on the backend.

Requirements

- Node.js 18+ (or a compatible version for the project's dependencies)
- A valid TheNewsAPI key (set in `server/.env`)

Environment variables

Create a `.env` file inside `server/` with:

```env
THENEWSAPI_TOKEN=your_api_token_here
PORT=5177
```

Running in development

From the project root:

```bash
npm install
npm run dev
```

This starts the proxy server and the web app (Vite). By default the frontend connects to `http://localhost:5177/api/...`.

Relevant structure

- `server/server.js` — Express proxy that forwards requests to TheNewsAPI, applies category normalization and defensive filtering. Keep the API key in `server/.env`.
- `web/src/lib/newsapi.ts` — helpers and shared client types (includes `Category`, `NewsApiResponse`, `LIMIT`).
- `web/src/App.tsx` — main UI controller and pagination logic.
- `web/src/components/` — UI components: `ArticleCard.tsx`, `FavoritesSidebar.tsx`, `Paginator.tsx`.
- `web/public/` — static assets (favicon, placeholder).

Localization / UI

The app supports Spanish and English for the user interface. Internal keys used with the API (e.g. category values) remain in English for compatibility with TheNewsAPI.

Development notes

- The proxy sends the key as `api_token` in the GET query and adjusts `sort` (relevance or `published_at`) depending on whether a search term is present.
- The proxy also normalizes category labels and adds `meta.filtered` to indicate how many items were filtered out for not matching canonical categories.
- The frontend uses caching and prefetching of pages for snappy navigation.

Favicon

The favicon is served from `web/public/favicon.png`. If you replace the file, restart the dev server and reload the browser (Ctrl+F5).

Next recommended steps

- Keep translation strings in `web/src/i18n.tsx` (already added) and continue extracting UI text to localization keys as you expand features.
- Consider adding server-side retry/backfill logic if you want the proxy to automatically refill pages after filtering (this can use API quota).

Contact / help

If you want, I can:

- Expand translations across more components.
- Add language switch persistence or additional languages.

Tell me which of those you'd like next.

---

Latest changes (summary)

- Added simple localization system (`web/src/i18n.tsx`) with Spanish and English translations.
- Added a language toggle component (`web/src/components/LanguageToggle.tsx`) and integrated it in the header (desktop) and next to the filters button on mobile.
- Replaced many visible strings with localized keys (header, search, categories, paginator, favorites, article actions, footer note).
- Implemented language persistence via `localStorage`.
- Translated the README to English.

If you want the README bilingual, or prefer `react-i18next` for richer i18n features, I can add that next.