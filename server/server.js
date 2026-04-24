const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fetch = require("node-fetch");

dotenv.config();

const PORT = 5177;
const API_BASE = "https://api.thenewsapi.com/v1/news/all";
const LIMIT = 3;
const LANGUAGE = "es";
const REQUEST_TIMEOUT_MS = 10_000;

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5176"],
  })
);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

function pickQueryString({ page, categories, search }) {
  const url = new URL(API_BASE);
  url.searchParams.set("language", LANGUAGE);
  url.searchParams.set("limit", String(LIMIT));
  url.searchParams.set("page", String(page));

  const searchTrimmed = typeof search === "string" ? search.trim() : "";
  if (searchTrimmed) {
    url.searchParams.set("search", searchTrimmed);
  } else if (typeof categories === "string" && categories.trim()) {
    url.searchParams.set("categories", categories.trim());
  }

  return url;
}

app.get("/api/news/all", async (req, res) => {
  const token = process.env.THENEWSAPI_TOKEN;
  if (!token) {
    return res.status(500).json({
      error: "Server misconfigured: THENEWSAPI_TOKEN is missing.",
    });
  }

  const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
  const categories = String(req.query.categories ?? "");
  const search = String(req.query.search ?? "");

  const upstreamUrl = pickQueryString({ page, categories, search });

  // Debug: log proxy URL without token
  console.log(`[proxy] GET ${upstreamUrl.toString()}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const upstreamRes = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    const contentType = upstreamRes.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const body = isJson ? await upstreamRes.json() : await upstreamRes.text();

    if (!upstreamRes.ok) {
      const status = upstreamRes.status;
      return res.status(status).json(
        typeof body === "object" && body
          ? body
          : {
              error: "Upstream request failed.",
              status,
            }
      );
    }

    return res.json(body);
  } catch (err) {
    if (err && err.name === "AbortError") {
      return res.status(504).json({ error: "Upstream request timed out." });
    }
    return res.status(500).json({ error: "Upstream request failed." });
  } finally {
    clearTimeout(timeout);
  }
});

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});

