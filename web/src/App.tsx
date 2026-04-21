import { useEffect, useMemo, useRef, useState } from "react";
import ArticleCard from "./components/ArticleCard";
import FavoritesSidebar, { readFavorites, writeFavorites } from "./components/FavoritesSidebar";
import Paginator from "./components/Paginator";
import LanguageToggle from "./components/LanguageToggle";
import { useI18n } from "./i18n";
import {
  DEFAULT_CATEGORY,
  LIMIT,
  type Category,
  type NewsApiResponse,
  type NewsArticle,
  fetchAllNews,
} from "./lib/newsapi";

type CacheKey = string;

function makeCacheKey(category: Category, search: string, page: number): CacheKey {
  const q = search.trim();
  const base = q ? q : category;
  return `${base}-${page}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalizeFavorite(a: NewsArticle): NewsArticle {
  return {
    title: a.title,
    url: a.url,
    description: a.description ?? null,
    snippet: a.snippet ?? null,
    image_url: a.image_url ?? null,
    published_at: a.published_at ?? null,
    source: a.source ?? null,
  };
}

export default function App() {
  const [category, setCategory] = useState<Category>(DEFAULT_CATEGORY);
  const [searchInput, setSearchInput] = useState("");
  const searchValue = searchInput.trim();

  const [page, setPage] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [feed, setFeed] = useState<NewsApiResponse | null>(null);
  const [hardLoading, setHardLoading] = useState(true);
  const [softLoading, setSoftLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [favoritesUrlSet, setFavoritesUrlSet] = useState<Set<string>>(() => {
    const urls = new Set(readFavorites().map((x) => x.url));
    return urls;
  });

  const cacheRef = useRef<Map<CacheKey, NewsApiResponse>>(new Map());
  const inflightRef = useRef<Map<CacheKey, Promise<NewsApiResponse>>>(new Map());
  const activeAbortRef = useRef<AbortController | null>(null);
  const epochRef = useRef(0);

  const totalPages = useMemo(() => {
    const found = feed?.meta?.found ?? 0;
    return found > 0 ? Math.ceil(found / LIMIT) : 0;
  }, [feed]);

  const pageArticles = feed?.data ?? [];
  const safeIndex = clamp(currentIndex, 0, Math.max(0, pageArticles.length - 1));
  const article = pageArticles[safeIndex];
  const absoluteStart = (page - 1) * LIMIT;

  const { t, lang, langDisplay } = useI18n();

  async function loadPage(
    nextPage: number,
    opts: { hard: boolean; index: number; category: Category; search: string }
  ) {
    const key = makeCacheKey(opts.category, opts.search, nextPage);

    if (opts.hard) {
      epochRef.current += 1;
      cacheRef.current.clear();
      inflightRef.current.clear();
      setFeed(null);
      setError(null);
      setHardLoading(true);
    } else {
      setSoftLoading(true);
      setError(null);
    }

    const myEpoch = epochRef.current;

    activeAbortRef.current?.abort();
    const controller = new AbortController();
    activeAbortRef.current = controller;

    try {
      const cached = cacheRef.current.get(key);
      if (cached) {
        setFeed(cached);
        setPage(nextPage);
        setCurrentIndex(opts.index);
        return;
      }

      const promise =
        inflightRef.current.get(key) ||
        fetchAllNews(
          opts.search.trim()
            ? { page: nextPage, search: opts.search.trim() }
            : { page: nextPage, category: opts.category, search: "" },
          controller.signal
        );

      inflightRef.current.set(key, promise);
      const data = await promise;
      if (epochRef.current !== myEpoch) return;
      cacheRef.current.set(key, data);
      inflightRef.current.delete(key);

      setFeed(data);
      setPage(nextPage);
      setCurrentIndex(opts.index);
    } catch (e) {
      if (epochRef.current !== myEpoch) return;
      const anyErr = e as { message?: string };
      setError(anyErr?.message || "Something went wrong. Please try again.");
      setFeed(null);
    } finally {
      if (epochRef.current !== myEpoch) return;
      setHardLoading(false);
      setSoftLoading(false);
    }
  }

  async function prefetch(nextPage: number, opts: { category: Category; search: string }) {
    if (nextPage < 1) return;
    if (totalPages && nextPage > totalPages) return;

    const myEpoch = epochRef.current;
    const key = makeCacheKey(opts.category, opts.search, nextPage);
    if (cacheRef.current.has(key)) return;
    if (inflightRef.current.has(key)) return;

    const promise = fetchAllNews(
      opts.search.trim()
        ? { page: nextPage, search: opts.search.trim() }
        : { page: nextPage, category: opts.category, search: "" }
    );

    inflightRef.current.set(key, promise);
    promise
      .then((data) => {
        if (epochRef.current !== myEpoch) return;
        cacheRef.current.set(key, data);
      })
      .catch(() => {
        // swallow prefetch errors (main flow will handle when user navigates)
      })
      .finally(() => {
        inflightRef.current.delete(key);
      });
  }

  function onToggleFavorite() {
    if (!article) return;
    const current = readFavorites();
    const exists = current.some((x) => x.url === article.url);
    const next = exists ? current.filter((x) => x.url !== article.url) : [normalizeFavorite(article), ...current];
    writeFavorites(next);
    setFavoritesUrlSet(new Set(next.map((x) => x.url)));
  }

  useEffect(() => {
    void loadPage(1, { hard: true, index: 0, category: DEFAULT_CATEGORY, search: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!feed) return;
    if (currentIndex === 1 && page < totalPages) {
      void prefetch(page + 1, { category, search: searchValue });
    }
    if (currentIndex === 0 && page > 1) {
      void prefetch(page - 1, { category, search: searchValue });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, page, totalPages, feed]);

  function applyCategory(next: Category) {
    const nextSearch = "";
    setCategory(next);
    setSearchInput(nextSearch);
    setPage(1);
    setCurrentIndex(0);
    setFiltersOpen(false);
    void loadPage(1, { hard: true, index: 0, category: next, search: nextSearch });
  }

  function applySearch() {
    const nextSearch = searchInput.trim();
    setPage(1);
    setCurrentIndex(0);
    setFiltersOpen(false);
    void loadPage(1, { hard: true, index: 0, category, search: nextSearch });
  }

  function goFirst() {
    void loadPage(1, { hard: false, index: 0, category, search: searchValue });
  }

  function goPrev() {
    if (safeIndex > 0) {
      setCurrentIndex((x) => Math.max(0, x - 1));
      return;
    }
    if (page > 1) {
      void loadPage(page - 1, { hard: false, index: LIMIT - 1, category, search: searchValue });
    }
  }

  function goNext() {
    if (safeIndex < pageArticles.length - 1) {
      setCurrentIndex((x) => Math.min(pageArticles.length - 1, x + 1));
      return;
    }
    if (totalPages && page < totalPages) {
      void loadPage(page + 1, { hard: false, index: 0, category, search: searchValue });
    }
  }

  const middle = useMemo(() => {
    return pageArticles.map((_a, idx) => {
      const abs = absoluteStart + idx + 1;
      return {
        label: String(abs),
        active: idx === safeIndex,
        ariaLabel: lang === "es" ? `Artículo ${abs}` : `Article ${abs}`,
        onClick: () => setCurrentIndex(idx),
      };
    });
  }, [absoluteStart, pageArticles, safeIndex]);

  const categories: Category[] = ([
    "tech",
    "general",
    "science",
    "sports",
    "business",
    "health",
    "entertainment",
    "politics",
    "food",
    "travel",
  ] as Category[])
    .slice()
    .sort((a, b) => a.localeCompare(b));

  const CATEGORY_LABELS = (c: Category) => t(`category.${c}`);

  const isFavorite = article ? favoritesUrlSet.has(article.url) : false;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand" role="banner">
          <span className="brandMark" aria-hidden="true">
            N
          </span>
          <span className="brandText">{t("brand")}</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <LanguageToggle />
          <button type="button" className="btn ghost mobileOnly" onClick={() => setFiltersOpen((x) => !x)}>
            {filtersOpen ? t("filters.hide") : t("filters.show")}
          </button>
        </div>
      </header>

      <div className="shell">
        <aside className={`sidebar ${filtersOpen ? "open" : ""}`} aria-label="Filtros">
          <div className="sidebarBody">
          <form
            className="searchBox"
            onSubmit={(e) => {
              e.preventDefault();
              applySearch();
            }}
          >
            <label className="label" htmlFor="search">
              {t("search.label")}
            </label>
            <div className="searchRow">
              <input
                id="search"
                className="input"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t("search.placeholder")}
                aria-label="Buscar"
              />
              <button type="submit" className="btn primary">
                  {t("search.button")}
              </button>
            </div>
            <div className="hint">
              {searchValue ? (
                t("hint.searchUsed")
              ) : (
                <>
                  {t("hint.categorySelected")}
                  {feed?.meta?.filtered ? (
                    <span style={{ marginLeft: 8, fontSize: 12, color: "var(--accent)" }} title={`${feed.meta.filtered} items were filtered by category`}>
                      {t("filtered", { count: String(feed.meta.filtered) })}
                    </span>
                  ) : null}
                </>
              )}
            </div>
          </form>

          <div className="catBox" role="group" aria-label={t("categories.label")}>
            <div className="label">{t("categories.label")}</div>
            <div className="catGrid">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`catBtn ${!searchValue && category === c ? "active" : ""}`}
                  onClick={() => applyCategory(c)}
                >
                  {CATEGORY_LABELS(c) ?? c}
                </button>
              ))}
            </div>
          </div>
          </div>

          <div className="sidebarFooter">
            <button type="button" className="btn ghost wide" onClick={() => setFavoritesOpen(true)}>
              {t("favorites.button")}
            </button>
          </div>
        </aside>

        <main className="content" aria-label="Contenido">
          {hardLoading ? (
            <div className="fullscreen">
              <div className="spinner" role="status" aria-label="Cargando" />
              <div className="muted">Loading…</div>
            </div>
          ) : error ? (
            <div className="fullscreen" role="alert">
              <div className="errorTitle">Error</div>
              <div className="errorBody">{error}</div>
              <button
                type="button"
                className="btn primary"
                onClick={() => loadPage(1, { hard: true, index: 0, category, search: searchValue })}
              >
                Retry
              </button>
            </div>
          ) : article ? (
            <>
              <div className="cardWrap">
                {softLoading ? (
                  <div className="softOverlay" aria-hidden="true">
                    <div className="spinner small" />
                  </div>
                ) : null}
                <ArticleCard article={article} isFavorite={isFavorite} onToggleFavorite={onToggleFavorite} />
              </div>

              <div className="footerSpace">
                <Paginator
                  currentPage={page}
                  totalPages={totalPages}
                  onFirst={goFirst}
                  onPrev={goPrev}
                  onNext={goNext}
                  middle={middle}
                />
                <div className="footerNote" aria-hidden="true">
                  {t("footer", { lang: langDisplay, limit: String(LIMIT) })}
                </div>
              </div>
            </>
          ) : (
            <div className="fullscreen">
              <div className="muted">No results.</div>
            </div>
          )}
        </main>
      </div>

      <FavoritesSidebar
        isOpen={favoritesOpen}
        onClose={() => setFavoritesOpen(false)}
        onSelect={(a) => {
          // Open favorite inside the app: show the article as the current feed
          const singleFeed = {
            data: [a],
            meta: {
              found: 1,
              returned: 1,
              limit: LIMIT,
              page: 1,
            },
          } as NewsApiResponse;

          cacheRef.current.clear();
          inflightRef.current.clear();
          epochRef.current += 1;
          setFeed(singleFeed);
          setPage(1);
          setCurrentIndex(0);
          // NOTE: keep the favorites sidebar open as requested
        }}
      />
    </div>
  );
}

