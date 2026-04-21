import type { NewsArticle } from "../lib/newsapi";
import { useI18n } from "../i18n";

type Props = {
  article: NewsArticle;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

export default function ArticleCard({ article, isFavorite, onToggleFavorite }: Props) {
  const { t, lang } = useI18n();
  const title = article.title || "Untitled";
  const imageSrc = article.image_url || "/placeholder.png";
  const alt = article.title ? `Imagen de: ${article.title}` : "Imagen de noticia";

  return (
    <article className="card" aria-label={title}>
      <div className="cardMedia" role="img" aria-label={alt}>
        <img
          className="cardImg"
          src={imageSrc}
          alt={alt}
          loading="eager"
          onError={(e) => {
            // fallback to placeholder if image fails to load
            try {
              (e.currentTarget as HTMLImageElement).src = "/placeholder.png";
            } catch {
              /* ignore */
            }
          }}
        />
        <div className="cardShade" />
      </div>

      <div className="cardOverlay">
        <div className="cardMeta">
          <span className="pill">{article.source || "TheNewsApi"}</span>
          {article.published_at ? (
            <span className="muted">{new Date(article.published_at).toLocaleString(lang === "es" ? "es-ES" : "en-US")}</span>
          ) : null}
        </div>

        <h1 className="cardTitle">{title}</h1>
        <p className="cardDesc">{article.description || article.snippet || t("article.noDescription")}</p>

        <div className="cardActions">
          <a className="btn primary" href={article.url} target="_blank" rel="noreferrer">
            {t("article.read")}
          </a>
          <button
            type="button"
            className={`btn ${isFavorite ? "ghost active" : "ghost"}`}
            onClick={onToggleFavorite}
            aria-pressed={isFavorite}
          >
            {isFavorite ? t("article.saved") : t("article.save")}
          </button>
        </div>
      </div>
    </article>
  );
}

