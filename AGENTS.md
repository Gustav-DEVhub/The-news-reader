# AGENTS.md

## Setup

```bash
npm install
```

Create `server/.env`:
```env
THENEWSAPI_TOKEN=<your-api-key>
PORT=5177
```

## Run

```bash
npm run dev
```

- Server runs on `http://localhost:5177`
- Web on `http://localhost:5176`
- Server must start first; client connects to `/api/*`

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server + web in parallel |
| `npm run server:dev` | Express proxy only |
| `npm run web:dev` | Vite dev only |
| `npm run build` (in `web/`) | Typecheck + build |

> **Important**: Run `npm run dev` from root, not individual packages.

## Architecture

- **Two packages** (npm workspaces): `server/` (Express proxy), `web/` (React + Vite)
- **API key** stays on server - never commit `server/.env`
- **Serverless**: `api/news/all.js` for Vercel deployment (uses `process.env.THENEWSAPI_TOKEN`)

## Key Files

- `server/server.js` - Express proxy, category normalization
- `web/src/App.tsx` - Main UI, pagination
- `web/src/lib/newsapi.ts` - Client types (`Category`, `LIMIT`)

## Testing

No test framework configured.

## Gotchas

- Vite runs on port 5176, Express on 5177
- Server must be running first for frontend to work
- Favicon at `web/public/favicon.png` - restart Vite after replacing