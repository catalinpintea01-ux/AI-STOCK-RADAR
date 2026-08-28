import { Link, useNavigate } from "react-router-dom";
import { THEMES } from "../data/themes.js";
import { useLang } from "../i18n/index.jsx";

// Teme de investiții cu fotografii Unsplash (hotlink conform termenilor API,
// atribuire vizibilă). Texte pur descriptive; simbolurile sunt exemple de
// companii din fiecare temă, NU recomandări — nota apare sub secțiune.
// Titlurile și descrierile scurte vin din dicționarele de limbă (apar și pe
// landing-ul public, unde traducerea la cerere nu e disponibilă).

// variant="app": tickerele duc direct la analiza acțiunii.
// variant="public": tickerele sunt chip-uri statice, CTA-ul e crearea contului.
export default function ThemeCards({ variant = "app" }) {
  const navigate = useNavigate();
  const { t } = useLang();
  return (
    <>
      <div className="theme-grid">
        {THEMES.map((tema) => (
          <div
            key={tema.slug}
            className="theme-card theme-card-clickable"
            role="button"
            tabIndex={0}
            onClick={() => navigate(variant === "app" ? `/tema/${tema.slug}` : "/register")}
            onKeyDown={(e) => {
              if (e.key === "Enter") navigate(variant === "app" ? `/tema/${tema.slug}` : "/register");
            }}
          >
            <div className="theme-card-img">
              <img src={tema.img} alt="" loading="lazy" />
              <span className="theme-card-title">{t(`teme.${tema.slug}.titlu`)}</span>
            </div>
            <div className="theme-card-body">
              <p>{t(`teme.${tema.slug}.scurt`)}</p>
              <div className="theme-tickers">
                {tema.tickere.map((sym) =>
                  variant === "app" ? (
                    <Link key={sym} to={`/stock/${sym}`} className="theme-ticker" onClick={(e) => e.stopPropagation()}>
                      {sym}
                    </Link>
                  ) : (
                    <span key={sym} className="theme-ticker">
                      {sym}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="landing-photo-credit">
        {t("temeNota")} ·{" "}
        {THEMES.map((tema, i) => (
          <span key={tema.autor}>
            <a href={tema.autorUrl} target="_blank" rel="noopener noreferrer">
              {tema.autor}
            </a>
            {i < THEMES.length - 1 ? " · " : ""}
          </span>
        ))}{" "}
        / <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a>
      </p>
    </>
  );
}
