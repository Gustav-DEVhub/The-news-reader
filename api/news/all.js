const API_BASE = "https://api.thenewsapi.com/v1/news/all";
const LIMIT = 3;
const DEFAULT_LANGUAGE = "es";
const REQUEST_TIMEOUT_MS = 10_000;

function pickQueryString({ page, categories, search, token, language }) {
  const url = new URL(API_BASE);
  url.searchParams.set("api_token", token);
  url.searchParams.set("language", language || DEFAULT_LANGUAGE);
  url.searchParams.set("limit", "10"); // Aumentamos para margen de calidad
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
  return low;
}

module.exports = async function handler(req, res) {
  const token = process.env.THENEWSAPI_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "Server misconfigured: THENEWSAPI_TOKEN is missing." });
  }

  const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
  const categories = String(req.query.categories ?? "");
  const search = String(req.query.search ?? "");
  const languageRaw = String(req.query.language ?? DEFAULT_LANGUAGE).trim().toLowerCase();
  const language = languageRaw === "en" || languageRaw === "es" || languageRaw === "it" ? languageRaw : DEFAULT_LANGUAGE;

  const upstreamUrl = pickQueryString({ page, categories, search, token, language });
  console.log(`[vercel-proxy] GET ${upstreamUrl.toString().replace(token, "***")}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const upstreamRes = await fetch(upstreamUrl.toString(), { method: "GET", signal: controller.signal });
    const contentType = upstreamRes.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const body = isJson ? await upstreamRes.json() : await upstreamRes.text();

    if (!upstreamRes.ok) {
      const status = upstreamRes.status;
      return res.status(status).json(typeof body === "object" && body ? body : { error: "Upstream request failed.", status });
    }

    if (isJson && body && typeof body === "object" && Array.isArray(body.data)) {
      const originalCount = Array.isArray(body.data) ? body.data.length : 0;

      // 1. Filtro estricto de calidad: imagen y descripción/snippet
      body.data = body.data.filter(a => 
        a.image_url && 
        a.image_url.trim() !== "" && 
        (a.description || a.snippet)
      );

      // 2. Filtro de categorías (si aplica)
      if (categories) {
        try {
          const requested = String(categories)
            .split(",")
            .map((s) => toCanonicalName(s))
            .filter(Boolean);

          if (requested.length > 0) {
            body.data = body.data.filter((a) => {
              const cats = (Array.isArray(a.categories) ? a.categories : []).map((x) => toCanonicalName(x));
              return requested.some((rc) => cats.includes(rc));
            });
          }
        } catch (e) {
          console.warn("[vercel-proxy] category filtering failed", e);
        }
      }

      // 3. Limitar a los 3 mejores resultados
      body.data = body.data.slice(0, 3);

      if (body.meta && typeof body.meta === "object") {
        body.meta.returned = body.data.length;
        body.meta.filtered = Math.max(0, originalCount - body.data.length);
      }
      console.log(`[vercel-proxy] Quality filter: ${originalCount} -> ${body.data.length}`);
    }

    return res.status(200).json(body);
  } catch (err) {
    if (err && err.name === "AbortError") {
      return res.status(504).json({ error: "Upstream request timed out." });
    }
    return res.status(500).json({ error: "Upstream request failed." });
  } finally {
    clearTimeout(timeout);
  }
};
