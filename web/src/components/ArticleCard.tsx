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

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: article.description || "",
          url: article.url,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(article.url);
        alert("Enlace copiado al portapapeles");
      } catch (err) {
        console.error("Error copying:", err);
      }
    }
  };

  return (
    <article className="card" aria-label={title}>
      <div className="cardMedia" role="img" aria-label={alt}>
        <img
          className="cardImg"
          src={imageSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://placehold.co/800x600/1a1a1a/444444?text=Noticia+Sin+Imagen";
          }}
        />
        <div className="cardShade" />
      </div>

      <div className="cardOverlay">
        <h2 className="cardTitle">{title}</h2>
        <p className="cardDesc">
          {(() => {
            const text = article.description || article.snippet || "Sin descripción.";
            if (text === "Sin descripción.") return text;
            // Si el texto de la API termina abruptamente sin puntuación, le añadimos "..."
            return text.match(/[.!?]$/) ? text : `${text.trim()}...`;
          })()}
        </p>

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
          <button
            type="button"
            className="btn ghost icon-only"
            onClick={handleShare}
            title="Compartir artículo"
            aria-label="Compartir"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}

