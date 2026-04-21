# news-reader server

Express proxy that hides the `THENEWSAPI_TOKEN` from browsers.

## Setup

1. Copy `.env.example` to `.env`
2. Set `THENEWSAPI_TOKEN`

## Run

```bash
npm install
npm run dev
```

Server listens on `http://localhost:5177`.

## Routes

- `GET /api/health`
- `GET /api/news/all?categories=tech&page=1` (or `search=AI`)
