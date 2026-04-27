import { useEffect, useRef, useState } from "react";
import type { Language } from "../i18n";

type Option = { value: Language; label: string };

type Props = {
  value: Language;
  onChange: (next: Language) => void;
  options: Option[];
  label: string; // visible label in desktop
  ariaLabel: string; // always used for accessibility
  compact?: boolean; // icon-only button (mobile)
};

export default function LanguageMenu({ value, onChange, options, label, ariaLabel, compact }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={rootRef} className="langRoot">
      <button
        type="button"
        className={`btn ghost langBtn ${open ? "open" : ""} ${compact ? "compact" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="langArrow" aria-hidden="true">
          ‹
        </span>
        {compact ? null : (
          <span className="langText">
            {label}: <strong className="langStrong">{options.find((o) => o.value === value)?.label || value}</strong>
          </span>
        )}
      </button>

      <div className={`langMenu ${open ? "open" : ""}`} role="menu" aria-label={ariaLabel}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`langItem ${o.value === value ? "active" : ""}`}
            role="menuitem"
            onClick={() => {
              onChange(o.value);
              setOpen(false);
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

