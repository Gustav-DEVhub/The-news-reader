import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../i18n";
import type { NewsArticle } from "../lib/newsapi";

const STORAGE_KEY = "news-reader:favorites";

function safeParse(raw: string | null): NewsArticle[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is NewsArticle => !!x && typeof x === "object" && "url" in x && "title" in x);
  } catch {
    return [];
  }
}

function safeWrite(items: NewsArticle[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  try {
    // Notify same-window listeners that favorites changed
    window.dispatchEvent(new Event("favorites-updated"));
  } catch {
    // ignore in non-browser environments
  }
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (article: NewsArticle) => void;
};

export default function FavoritesSidebar({ isOpen, onClose, onSelect }: Props) {
  const [items, setItems] = useState<NewsArticle[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setItems(safeParse(localStorage.getItem(STORAGE_KEY)));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onUpdated = () => setItems(safeParse(localStorage.getItem(STORAGE_KEY)));
    // Listen for same-window updates
    window.addEventListener("favorites-updated", onUpdated);
    // Also listen for cross-window/localStorage changes
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) onUpdated();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("favorites-updated", onUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, [isOpen]);

  const { t } = useI18n();
  const count = items.length;
  const title = useMemo(() => (count === 1 ? t("favorites.title.single") : t("favorites.title.multi", { count: String(count) })), [count, t]);

  function remove(url: string) {
    const next = items.filter((x) => x.url !== url);
    setItems(next);
    safeWrite(next);
  }

  if (!isOpen) return null;

  return (
    <aside className="favOverlay" role="dialog" aria-modal="true" aria-label={t("favorites.button")}>
      <div className="favPanel">
        <div className="favHeader">
          <h2 className="favTitle">{title}</h2>
          <button type="button" className="btn ghost" onClick={onClose}>
            {t("favorites.back")}
          </button>
        </div>

        {count === 0 ? (
          <div className="favEmpty">{t("favorites.empty")}</div>
        ) : (
          <ul className="favList" aria-label={t("favorites.button")}>
            {items.map((a) => (
              <li key={a.url} className="favItem">
                <button type="button" className="favPick" onClick={() => onSelect(a)}>
                  <img className="favThumb" src={a.image_url || "/placeholder.png"} alt={a.title || "Noticia"} />
                  <div className="favText">
                    <div className="favItemTitle">{a.title || "Untitled"}</div>
                    <div className="favItemMeta">{a.source || "TheNewsApi"}</div>
                  </div>
                </button>

                <button type="button" className="favRemove" onClick={() => remove(a.url)} aria-label="Eliminar favorito">
                  {t("favorites.remove")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="button" className="favBackdrop" aria-label="Cerrar" onClick={onClose} />
    </aside>
  );
}

export function readFavorites(): NewsArticle[] {
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

export function writeFavorites(items: NewsArticle[]) {
  safeWrite(items);
}

