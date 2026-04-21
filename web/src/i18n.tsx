import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Lang = "es" | "en";
const STORAGE_KEY = "news-reader:lang";

const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  es: {
    brand: "News Reader",
    "filters.show": "Mostrar filtros",
    "filters.hide": "Ocultar filtros",
    "search.label": "Buscar",
    "search.placeholder": "AI, Apple, ciencia…",
    "search.button": "Buscar",
    "hint.searchUsed": "Usando búsqueda (categorías omitidas).",
    "hint.categorySelected": "Mostrando resultados para la categoría seleccionada. No se aplicó búsqueda por texto",
    "filtered": "• {count} filtrados",
    "categories.label": "Categorías",
    "category.tech": "Tech",
    "category.general": "General",
    "category.science": "Ciencia",
    "category.sports": "Deportes",
    "category.business": "Negocios",
    "category.health": "Salud",
    "category.entertainment": "Entretenimiento",
    "category.politics": "Política",
    "category.food": "Comida",
    "category.travel": "Viajes",
    "favorites.button": "Favoritos",
    "favorites.title.single": "1 Favorito",
    "favorites.title.multi": "{count} Favoritos",
    "favorites.empty": "No hay favoritos guardados.",
    "favorites.back": "Volver",
    "favorites.remove": "Eliminar",
    "favorites.removeAria": "Eliminar favorito",
    "article.read": "Ver artículo completo",
    "article.save": "Guardar en Favoritos",
    "article.saved": "Guardado",
    "article.noDescription": "Sin descripción.",
    "paginator.aria": "Paginación",
    "paginator.group": "Artículos en página",
    "paginator.first": "Primera página",
    "paginator.prev": "Anterior",
    "paginator.next": "Siguiente",
    "footer": "Datos de TheNewsApi · Interfaz: {lang} · Límite por página: {limit}",
  },
  en: {
    brand: "News Reader",
    "filters.show": "Show filters",
    "filters.hide": "Hide filters",
    "search.label": "Search",
    "search.placeholder": "AI, Apple, science…",
    "search.button": "Search",
    "hint.searchUsed": "Using search (categories omitted).",
    "hint.categorySelected": "Showing results for the selected category. No text search applied",
    "filtered": "• {count} filtered",
    "categories.label": "Categories",
    "category.tech": "Tech",
    "category.general": "General",
    "category.science": "Science",
    "category.sports": "Sports",
    "category.business": "Business",
    "category.health": "Health",
    "category.entertainment": "Entertainment",
    "category.politics": "Politics",
    "category.food": "Food",
    "category.travel": "Travel",
    "favorites.button": "Favorites",
    "favorites.title.single": "1 Favorite",
    "favorites.title.multi": "{count} Favorites",
    "favorites.empty": "No saved favorites.",
    "favorites.back": "Back",
    "favorites.remove": "Remove",
    "favorites.removeAria": "Remove favorite",
    "article.read": "Read full article",
    "article.save": "Save to Favorites",
    "article.saved": "Saved",
    "article.noDescription": "No description.",
    "paginator.aria": "Pagination",
    "paginator.group": "Articles on page",
    "paginator.first": "First page",
    "paginator.prev": "Previous",
    "paginator.next": "Next",
    "footer": "Data from TheNewsApi · Interface: {lang} · Limit per page: {limit}",
  },
};

type I18nContextShape = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  langDisplay: string;
};

const I18nContext = createContext<I18nContextShape | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangRaw] = useState<Lang>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "en" || v === "es") return v;
    } catch {}
    return "es";
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  }, [lang]);

  const setLang = (l: Lang) => setLangRaw(l);

  const t = (key: string, vars?: Record<string, string | number>) => {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.es;
    let txt = dict[key] ?? key;
    if (vars) {
      Object.keys(vars).forEach((k) => {
        txt = txt.replace(new RegExp(`\\{${k}\\}`, "g"), String(vars[k]));
      });
    }
    return txt;
  };

  const langDisplay = useMemo(() => (lang === "es" ? "Español" : "English"), [lang]);

  return <I18nContext.Provider value={{ lang, setLang, t, langDisplay }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside LanguageProvider");
  return ctx;
}
