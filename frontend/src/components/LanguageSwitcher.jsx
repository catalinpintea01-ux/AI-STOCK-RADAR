import { useEffect, useRef, useState } from "react";
import { useLang, LIMBI } from "../i18n/index.jsx";

// Selector de limbă cu steaguri (imagini flagcdn — emoji-urile de steag nu se
// randează pe Windows). Butonul arată steagul + codul limbii curente; panoul
// e un grid cu toate cele 10 limbi, închis la click în afară.
export default function LanguageSwitcher() {
  const { limba, setLimba, t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const curenta = LIMBI.find((l) => l.cod === limba) || LIMBI[0];

  return (
    <div className="lang-switcher" ref={ref}>
      <button
        type="button"
        className="lang-button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("nav.alegeLimba")}
        aria-expanded={open}
      >
        <img
          src={`https://flagcdn.com/w40/${curenta.steag}.png`}
          srcSet={`https://flagcdn.com/w80/${curenta.steag}.png 2x`}
          width="20"
          height="15"
          alt={curenta.nume}
        />
        <span className="lang-code">{curenta.cod.toUpperCase()}</span>
      </button>
      {open && (
        <div className="lang-panel" role="menu">
          {LIMBI.map((l) => (
            <button
              key={l.cod}
              type="button"
              role="menuitem"
              className={`lang-option ${l.cod === limba ? "active" : ""}`}
              onClick={() => {
                setLimba(l.cod);
                setOpen(false);
              }}
            >
              <img
                src={`https://flagcdn.com/w40/${l.steag}.png`}
                srcSet={`https://flagcdn.com/w80/${l.steag}.png 2x`}
                width="22"
                height="16"
                alt=""
              />
              <span>{l.nume}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
