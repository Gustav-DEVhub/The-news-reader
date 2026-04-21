import { useI18n } from "../i18n";

type Props = {
  currentPage: number;
  totalPages: number;
  onNext: () => void;
  onPrev: () => void;
  onFirst: () => void;
  middle?: Array<{
    label: string;
    active?: boolean;
    onClick: () => void;
    ariaLabel?: string;
  }>;
};

export default function Paginator({ currentPage, totalPages, onNext, onPrev, onFirst, middle }: Props) {
  const { t } = useI18n();
  const nextDisabled = currentPage === totalPages || totalPages === 0;
  const prevDisabled = currentPage <= 1;

  return (
    <nav className="paginator" aria-label={t("paginator.aria")}>
      <button type="button" className="pgBtn" onClick={onFirst} disabled={prevDisabled} aria-label={t("paginator.first")}>
        «
      </button>
      <button type="button" className="pgBtn" onClick={onPrev} disabled={prevDisabled} aria-label={t("paginator.prev")}>
        ‹
      </button>

      <div className="pgMid" role="group" aria-label={t("paginator.group")}>
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

      <button type="button" className="pgBtn" onClick={onNext} disabled={nextDisabled} aria-label={t("paginator.next")}>
        ›
      </button>
    </nav>
  );
}

