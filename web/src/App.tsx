import { useEffect, useMemo, useRef, useState } from "react";
import ArticleCard from "./components/ArticleCard";
import FavoritesSidebar, { readFavorites, writeFavorites } from "./components/FavoritesSidebar";
import LanguageMenu from "./components/LanguageMenu";
import Paginator from "./components/Paginator";
import ThemeToggle from "./components/ThemeToggle";
import { readLanguage, t, toLocale, type Language, writeLanguage, CATEGORIES, CATEGORY_KEYS } from "./i18n/index";
import {
  DEFAULT_CATEGORY,
  LIMIT,
  type Category,
  type NewsApiResponse,
  type NewsArticle,
  fetchAllNews,
} from "./lib/newsapi";

type CacheKey = string;

function makeCacheKey(language: Language, category: Category, search: string, page: number): CacheKey {
  const q = search.trim();
  const base = q ? q : category;
  return `${language}-${base}-${page}`;
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
  const [language, setLanguage] = useState<Language>(() => readLanguage());

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
  const locale = toLocale(language);
  const publishedText = useMemo(() => {
    if (!article?.published_at) return undefined;
    try {
      return new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(new Date(article.published_at));
    } catch {
      return undefined;
    }
  }, [article?.published_at, locale]);

  async function loadPage(
    nextPage: number,
    opts: { hard: boolean; index: number; category: Category; search: string; language: Language }
  ) {
    const key = makeCacheKey(opts.language, opts.category, opts.search, nextPage);

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
            ? { page: nextPage, search: opts.search.trim(), language: opts.language }
            : { page: nextPage, category: opts.category, search: "", language: opts.language },
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

  async function prefetch(nextPage: number, opts: { category: Category; search: string; language: Language }) {
    if (nextPage < 1) return;
    if (totalPages && nextPage > totalPages) return;

    const myEpoch = epochRef.current;
    const key = makeCacheKey(opts.language, opts.category, opts.search, nextPage);
    if (cacheRef.current.has(key)) return;
    if (inflightRef.current.has(key)) return;

    const promise = fetchAllNews(
      opts.search.trim()
        ? { page: nextPage, search: opts.search.trim(), language: opts.language }
        : { page: nextPage, category: opts.category, search: "", language: opts.language }
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
    void loadPage(1, { hard: true, index: 0, category: DEFAULT_CATEGORY, search: "", language });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (!feed) return;
    if (currentIndex === 1 && page < totalPages) {
      void prefetch(page + 1, { category, search: searchValue, language });
    }
    if (currentIndex === 0 && page > 1) {
      void prefetch(page - 1, { category, search: searchValue, language });
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
    void loadPage(1, { hard: true, index: 0, category: next, search: nextSearch, language });
  }

  function applySearch() {
    const nextSearch = searchInput.trim();
    setPage(1);
    setCurrentIndex(0);
    setFiltersOpen(false);
    void loadPage(1, { hard: true, index: 0, category, search: nextSearch, language });
  }

  function goFirst() {
    void loadPage(1, { hard: false, index: 0, category, search: searchValue, language });
  }

  function goPrev() {
    if (safeIndex > 0) {
      setCurrentIndex((x) => Math.max(0, x - 1));
      return;
    }
    if (page > 1) {
      void loadPage(page - 1, { hard: false, index: LIMIT - 1, category, search: searchValue, language });
    }
  }

  function goNext() {
    if (safeIndex < pageArticles.length - 1) {
      setCurrentIndex((x) => Math.min(pageArticles.length - 1, x + 1));
      return;
    }
    if (totalPages && page < totalPages) {
      void loadPage(page + 1, { hard: false, index: 0, category, search: searchValue, language });
    }
  }

  const middle = useMemo(() => {
    return pageArticles.map((_a, idx) => {
      const abs = absoluteStart + idx + 1;
      return {
        label: String(abs),
        active: idx === safeIndex,
        ariaLabel: `Artículo ${abs}`,
        onClick: () => setCurrentIndex(idx),
      };
    });
  }, [absoluteStart, pageArticles, safeIndex]);

  const categories = CATEGORY_KEYS;
  const categoryLabels = CATEGORIES[language];

  const isFavorite = article ? favoritesUrlSet.has(article.url) : false;
  const langOptions: Array<{ value: Language; label: string }> = [
    { value: "es", label: "Español" },
    { value: "en", label: "English" },
    { value: "it", label: "Italiano" },
  ];

  function changeLanguage(next: Language) {
    setLanguage(next);
    writeLanguage(next);
    setPage(1);
    setCurrentIndex(0);
    void loadPage(1, { hard: true, index: 0, category, search: searchValue, language: next });
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand" role="banner">
          <span className="brandMark" aria-hidden="true">
            N
          </span>
          <span className="brandText">News Reader</span>
        </div>
        <div className="topActions">
          <ThemeToggle />
          <div className="mobileOnly">
            <LanguageMenu
              value={language}
              onChange={changeLanguage}
              options={langOptions}
              label={t(language, "language")}
              ariaLabel={t(language, "changeLanguage")}
              compact
            />
          </div>
          <button type="button" className="btn ghost mobileOnly" onClick={() => setFiltersOpen((x) => !x)}>
            {filtersOpen ? t(language, "hideFilters") : t(language, "showFilters")}
          </button>
          <div className="desktopOnly">
            <LanguageMenu
              value={language}
              onChange={changeLanguage}
              options={langOptions}
              label={t(language, "language")}
              ariaLabel={t(language, "changeLanguage")}
            />
          </div>
        </div>
      </header>

      <div className="shell">
        {filtersOpen ? (
          <button
            type="button"
            className="filtersBackdrop mobileOnly"
            aria-label={t(language, "hideFilters")}
            onClick={() => setFiltersOpen(false)}
          />
        ) : null}

        <aside className={`sidebar ${filtersOpen ? "open" : ""}`} aria-label="Filtros">
          <form
            className="searchBox"
            onSubmit={(e) => {
              e.preventDefault();
              applySearch();
            }}
          >
            <label className="label" htmlFor="search">
              {t(language, "search")}
            </label>
            <div className="searchRow">
              <input
                id="search"
                className="input"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="AI, Apple, ciencia…"
                aria-label="Buscar"
              />
              <button type="submit" className="btn primary">
                {t(language, "go")}
              </button>
            </div>
            <div className="hint">
              {searchValue ? t(language, "usingSearch") : t(language, "usingCategory")}
            </div>
          </form>

          <div className="catBox" role="group" aria-label="Categorías">
            <div className="label">{t(language, "categories")}</div>
            <div className="catGrid">
              {categories.map((c, idx) => (
                <button
                  key={c}
                  type="button"
                  className={`catBtn ${!searchValue && category === c ? "active" : ""}`}
                  onClick={() => applyCategory(c)}
                >
                  {categoryLabels[idx]}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebarFooter">
            <button type="button" className="btn ghost wide" onClick={() => setFavoritesOpen(true)}>
              {t(language, "favorites")}
            </button>
          </div>
        </aside>

        <main className="content" aria-label="Contenido">
          {hardLoading ? (
            <div className="fullscreen">
              <div className="spinner" role="status" aria-label="Cargando" />
              <div className="muted">{t(language, "loading")}</div>
            </div>
          ) : error ? (
            <div className="fullscreen" role="alert">
              <div className="errorTitle">Error</div>
              <div className="errorBody">{error}</div>
              <button
                type="button"
                className="btn primary"
                onClick={() => loadPage(1, { hard: true, index: 0, category, search: searchValue, language })}
              >
                {t(language, "retry")}
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
                <ArticleCard
                  article={article}
                  isFavorite={isFavorite}
                  onToggleFavorite={onToggleFavorite}
                  publishedText={publishedText}
                  ctaView={t(language, "viewFullArticle")}
                  ctaSave={t(language, "saveToFavorites")}
                  ctaSaved={t(language, "saved")}
                />
              </div>

              <div className="footerSpace">
                <Paginator
                  currentPage={page}
                  totalPages={totalPages}
                  onFirst={goFirst}
                  onPrev={goPrev}
                  onNext={goNext}
                  middle={middle}
                  ariaLabel={t(language, "pagination")}
                  firstLabel={t(language, "firstPage")}
                  prevLabel={t(language, "previous")}
                  nextLabel={t(language, "next")}
                />
              </div>
            </>
          ) : (
            <div className="fullscreen">
              <div className="muted">{t(language, "noResults")}</div>
            </div>
          )}
        </main>
      </div>

      <FavoritesSidebar
        isOpen={favoritesOpen}
        onClose={() => setFavoritesOpen(false)}
        onSelect={(a) => {
          window.open(a.url, "_blank", "noreferrer");
        }}
        title={`{count} ${t(language, "favorites")}`}
        backLabel={t(language, "backToLive")}
        emptyText={t(language, "noFavorites")}
        removeLabel={t(language, "remove")}
      />
    </div>
  );
}

