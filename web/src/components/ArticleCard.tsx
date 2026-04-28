import type { NewsArticle } from "../lib/newsapi";

type Props = {
  article: NewsArticle;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  publishedText?: string;
  ctaView: string;
  ctaSave: string;
  ctaSaved: string;
};

export default function ArticleCard({ article, isFavorite, onToggleFavorite, publishedText, ctaView, ctaSave, ctaSaved }: Props) {
  const title = article.title || "Untitled";
  const imageSrc = article.image_url || "https://placehold.co/800x600/1a1a1a/444444?text=Noticia+Sin+Imagen";
  const alt = article.title ? `Imagen de: ${article.title}` : "Imagen de noticia";

  return (
    <article className="card" aria-label={title}>
      <div className="cardMedia" role="img" aria-label={alt}>
        <img className="cardImg" src={imageSrc} alt={alt} loading="eager" />
        <div className="cardShade" />
      </div>

      <div className="cardOverlay">
        <h2 className="cardTitle">{title}</h2>
        <p className="cardDesc">{article.description || article.snippet || "Sin descripción."}</p>

        <div className="cardMeta">
          <span className="pill">{article.source || "TheNewsApi"}</span>
          {publishedText ? <span className="muted">{publishedText}</span> : null}
        </div>

        <div className="cardActions">
          <a className="btn primary" href={article.url} target="_blank" rel="noreferrer">
            {ctaView}
          </a>
          <button
            type="button"
            className={`btn ${isFavorite ? "ghost active" : "ghost"}`}
            onClick={onToggleFavorite}
            aria-pressed={isFavorite}
          >
            {isFavorite ? ctaSaved : ctaSave}
          </button>
        </div>
      </div>
    </article>
  );
}

