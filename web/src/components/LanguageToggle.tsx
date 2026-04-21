import { useState, useRef, useEffect } from "react";
import { useI18n } from "../i18n";

export default function LanguageToggle() {
  const { lang, setLang, t } = useI18n();
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

  function change(l: "es" | "en") {
    setLang(l);
    setOpen(false);
  }

  const label = lang === "es" ? "Cambiar idioma" : "Change language";

  return (
    <div ref={rootRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        className={`btn ghost langToggle`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        title={label}
      >
        <span className="chev" aria-hidden style={{ marginRight: 8 }}>
          ◀
        </span>
        <span className="desktopOnly">{label}</span>
      </button>

      <div className={`langMenu ${open ? "open" : ""}`} role="menu" aria-hidden={!open}>
        <button className="btn ghost" role="menuitem" onClick={() => change("es")}>
          Español
        </button>
        <button className="btn ghost" role="menuitem" onClick={() => change("en")}>
          English
        </button>
      </div>
    </div>
  );
}
