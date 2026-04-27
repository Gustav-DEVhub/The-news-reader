export type Language = "es" | "en" | "it";

export const DEFAULT_LANGUAGE: Language = "es";

const STORAGE_KEY = "news-reader:language";

export const CATEGORIES: Record<Language, string[]> = {
  es: ["tecnología", "general", "ciencia", "deportes", "negocios", "salud", "entretenimiento", "política", "comida", "viajes"],
  en: ["tech", "general", "science", "sports", "business", "health", "entertainment", "politics", "food", "travel"],
  it: ["tecnologia", "generale", "scienza", "sport", "affari", "salute", "intrattenimento", "politica", "cibo", "viaggi"],
};

export const CATEGORY_KEYS = ["tech", "general", "science", "sports", "business", "health", "entertainment", "politics", "food", "travel"] as const;

export function readLanguage(): Language {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === "es" || raw === "en" || raw === "it") return raw;
  return DEFAULT_LANGUAGE;
}

export function writeLanguage(lang: Language) {
  localStorage.setItem(STORAGE_KEY, lang);
}

export function toLocale(lang: Language): string {
  switch (lang) {
    case "en":
      return "en-US";
    case "it":
      return "it-IT";
    case "es":
    default:
      return "es-ES";
  }
}

type Dict = Record<string, string>;

const dict: Record<Language, Dict> = {
  es: {
    appTitle: "News Reader",
    showFilters: "Mostrar filtros",
    hideFilters: "Ocultar filtros",
    search: "Buscar",
    go: "Ir",
    categories: "Categorías",
    favorites: "Favoritos",
    backToLive: "Volver",
    noFavorites: "Todavía no tienes favoritos.",
    remove: "Quitar",
    viewFullArticle: "Ver artículo completo",
    saveToFavorites: "Guardar en Favoritos",
    saved: "Guardado",
    loading: "Cargando…",
    retry: "Reintentar",
    noResults: "Sin resultados.",
    usingSearch: "Usando búsqueda (se omiten categorías).",
    usingCategory: "Usando categoría (se omite búsqueda).",
    language: "Idioma",
    changeLanguage: "Cambiar idioma",
    firstPage: "Primera página",
    previous: "Anterior",
    next: "Siguiente",
    pagination: "Paginación",
  },
  en: {
    appTitle: "News Reader",
    showFilters: "Show filters",
    hideFilters: "Hide filters",
    search: "Search",
    go: "Go",
    categories: "Categories",
    favorites: "Favorites",
    backToLive: "Back to Live",
    noFavorites: "No favorites saved yet.",
    remove: "Remove",
    viewFullArticle: "View Full Article",
    saveToFavorites: "Save to Favorites",
    saved: "Saved",
    loading: "Loading…",
    retry: "Retry",
    noResults: "No results.",
    usingSearch: "Using search (categories omitted).",
    usingCategory: "Using category (search omitted).",
    language: "Language",
    changeLanguage: "Change language",
    firstPage: "First page",
    previous: "Previous",
    next: "Next",
    pagination: "Pagination",
  },
  it: {
    appTitle: "News Reader",
    showFilters: "Mostra filtri",
    hideFilters: "Nascondi filtri",
    search: "Cerca",
    go: "Vai",
    categories: "Categorie",
    favorites: "Preferiti",
    backToLive: "Torna",
    noFavorites: "Nessun preferito salvato.",
    remove: "Rimuovi",
    viewFullArticle: "Apri articolo",
    saveToFavorites: "Salva nei Preferiti",
    saved: "Salvato",
    loading: "Caricamento…",
    retry: "Riprova",
    noResults: "Nessun risultato.",
    usingSearch: "Ricerca attiva (categorie escluse).",
    usingCategory: "Categoria attiva (ricerca esclusa).",
    language: "Lingua",
    changeLanguage: "Cambia lingua",
    firstPage: "Prima pagina",
    previous: "Precedente",
    next: "Successivo",
    pagination: "Paginazione",
  },
};

export function t(lang: Language, key: keyof (typeof dict)["es"]): string {
  const table = dict[lang] || dict[DEFAULT_LANGUAGE];
  return table[key] || dict[DEFAULT_LANGUAGE][key] || String(key);
}

