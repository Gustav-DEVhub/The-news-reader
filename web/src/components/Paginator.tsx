type Props = {
  currentPage: number;
  totalPages: number;
  onNext: () => void;
  onPrev: () => void;
  onFirst: () => void;
  ariaLabel?: string;
  firstLabel?: string;
  prevLabel?: string;
  nextLabel?: string;
  middle?: Array<{
    label: string;
    active?: boolean;
    onClick: () => void;
    ariaLabel?: string;
  }>;
};

export default function Paginator({
  currentPage,
  totalPages,
  onNext,
  onPrev,
  onFirst,
  middle,
  ariaLabel,
  firstLabel,
  prevLabel,
  nextLabel,
}: Props) {
  const nextDisabled = currentPage === totalPages || totalPages === 0;
  const prevDisabled = currentPage <= 1;

  return (
    <nav className="paginator" aria-label={ariaLabel || "Paginación"}>
      <button
        type="button"
        className="pgBtn"
        onClick={onFirst}
        disabled={prevDisabled}
        aria-label={firstLabel || "Primera página"}
      >
        «
      </button>
      <button type="button" className="pgBtn" onClick={onPrev} disabled={prevDisabled} aria-label={prevLabel || "Anterior"}>
        ‹
      </button>

      <div className="pgMid" role="group" aria-label="Artículos en página">
        {(middle || []).map((m) => (
          <button
            key={m.label}
            type="button"
            className={`pgDot ${m.active ? "active" : ""}`}
            onClick={m.onClick}
            aria-label={m.ariaLabel || m.label}
          >
            {m.label}
          </button>
        ))}
      </div>

      <button type="button" className="pgBtn" onClick={onNext} disabled={nextDisabled} aria-label={nextLabel || "Siguiente"}>
        ›
      </button>
    </nav>
  );
}

