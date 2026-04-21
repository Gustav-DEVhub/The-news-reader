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

function pickQueryString({ page, categories, search, token }) {
  const url = new URL(API_BASE);
  url.searchParams.set("api_token", token);
  url.searchParams.set("language", LANGUAGE);
  url.searchParams.set("limit", String(LIMIT));
  url.searchParams.set("page", String(page));

  const searchTrimmed = typeof search === "string" ? search.trim() : "";
  if (searchTrimmed) {
    url.searchParams.set("search", searchTrimmed);
    url.searchParams.set("sort", "relevance_score");
  } else if (typeof categories === "string" && categories.trim()) {
    url.searchParams.set("categories", categories.trim());
    url.searchParams.set("sort", "published_at");
  }

  return url;
}

// Category normalization map: map variant names (including Spanish) to canonical keys
const CATEGORY_MAP = {
  tech: ["tech", "technology", "tecnologia", "tecnologías"],
  general: ["general", "noticias"],
  science: ["science", "ciencia", "científico"],
  sports: ["sports", "deportes"],
  business: ["business", "negocios"],
  health: ["health", "salud"],
  entertainment: ["entertainment", "entretenimiento"],
  politics: ["politics", "politica", "política", "political"],
  food: ["food", "comida", "gastronomia", "gastronomía"],
  travel: ["travel", "viaje", "viajes", "turismo"],
};

function stripDiacritics(s) {
  return String(s || "").normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function toCanonicalName(raw) {
  const low = stripDiacritics(String(raw || "").toLowerCase()).trim();
  if (!low) return "";
  for (const [canon, variants] of Object.entries(CATEGORY_MAP)) {
    for (const v of variants) {
      if (stripDiacritics(v).toLowerCase() === low) return canon;
    }
  }
  // fallback: return normalized token (may not match canonical set)
  return low;
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

  const upstreamUrl = pickQueryString({ page, categories, search, token });

  // Debug: log proxy URL without token
  console.log(`[proxy] GET ${upstreamUrl.toString().replace(token, "***")}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const upstreamRes = await fetch(upstreamUrl.toString(), {
      method: "GET",
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

    // If the response is JSON and we requested a specific category (no search),
    // filter the returned page of articles to only those that include the
    // requested category in their `categories` array. This prevents articles
    // from other categories from appearing in a category view due to upstream
    // tagging inconsistencies.
    if (isJson && body && typeof body === "object" && Array.isArray(body.data) && categories) {
      try {
        const requested = String(categories)
          .split(",")
          .map((s) => toCanonicalName(s))
          .filter(Boolean);

        if (requested.length > 0) {
          const originalCount = Array.isArray(body.data) ? body.data.length : 0;
          body.data = body.data.filter((a) => {
            const cats = (Array.isArray(a.categories) ? a.categories : [])
              .map((x) => toCanonicalName(x));
            // keep article if any of its canonical categories matches any requested canonical category
            return requested.some((rc) => cats.includes(rc));
          });
          // update returned count to reflect filtered page
          if (body.meta && typeof body.meta === "object") {
            body.meta.returned = Array.isArray(body.data) ? body.data.length : 0;
            // expose how many items were removed by the proxy filter
            body.meta.filtered = Math.max(0, originalCount - (Array.isArray(body.data) ? body.data.length : 0));
          }
          console.log(`[proxy] filtered category=${categories} ${originalCount} -> ${body.data.length}`);
        }
      } catch (e) {
        // non-fatal: if filtering fails, return original body
        // eslint-disable-next-line no-console
        console.warn("[proxy] category filtering failed", e);
      }
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

