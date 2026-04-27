import { useEffect, useMemo, useState } from "react";
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
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (article: NewsArticle) => void;
  title: string;
  backLabel: string;
  emptyText: string;
  removeLabel: string;
};

export default function FavoritesSidebar({ isOpen, onClose, onSelect, title, backLabel, emptyText, removeLabel }: Props) {
  const [items, setItems] = useState<NewsArticle[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setItems(safeParse(localStorage.getItem(STORAGE_KEY)));
  }, [isOpen]);

  const count = items.length;
  const computedTitle = useMemo(() => title.replace("{count}", String(count)), [count, title]);

  function remove(url: string) {
    const next = items.filter((x) => x.url !== url);
    setItems(next);
    safeWrite(next);
  }

  if (!isOpen) return null;

  return (
    <aside className="favOverlay" role="dialog" aria-modal="true" aria-label="Favorites">
      <div className="favPanel">
        <div className="favHeader">
          <h2 className="favTitle">{computedTitle}</h2>
          <button type="button" className="btn ghost" onClick={onClose}>
            {backLabel}
          </button>
        </div>

        {count === 0 ? (
          <div className="favEmpty">{emptyText}</div>
        ) : (
          <ul className="favList" aria-label="Lista de favoritos">
            {items.map((a) => (
              <li key={a.url} className="favItem">
                <button type="button" className="favPick" onClick={() => onSelect(a)}>
                  <img className="favThumb" src={a.image_url || "/placeholder.png"} alt={a.title || "Noticia"} />
                  <div className="favText">
                    <div className="favItemTitle">{a.title || "Untitled"}</div>
                    <div className="favItemMeta">{a.source || "TheNewsApi"}</div>
                  </div>
                </button>

                <button type="button" className="favRemove" onClick={() => remove(a.url)} aria-label="Remove favorite">
                  {removeLabel}
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

