import { Link, useNavigate } from "react-router-dom";
import { THEMES } from "../data/themes.js";

// Teme de investiții cu fotografii Unsplash (hotlink conform termenilor API,
// atribuire vizibilă). Texte pur descriptive; simbolurile sunt exemple de
// companii din fiecare temă, NU recomandări — nota apare sub secțiune.

// variant="app": tickerele duc direct la analiza acțiunii.
// variant="public": tickerele sunt chip-uri statice, CTA-ul e crearea contului.
export default function ThemeCards({ variant = "app" }) {
  const navigate = useNavigate();
  return (
    <>
      <div className="theme-grid">
        {THEMES.map((t) => (
          <div
            key={t.titlu}
            className="theme-card theme-card-clickable"
            role="button"
            tabIndex={0}
            onClick={() => navigate(variant === "app" ? `/tema/${t.slug}` : "/register")}
            onKeyDown={(e) => {
              if (e.key === "Enter") navigate(variant === "app" ? `/tema/${t.slug}` : "/register");
            }}
          >
            <div className="theme-card-img">
              <img src={t.img} alt="" loading="lazy" />
              <span className="theme-card-title">{t.titlu}</span>
            </div>
            <div className="theme-card-body">
              <p>{t.scurt}</p>
              <div className="theme-tickers">
                {t.tickere.map((sym) =>
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
        Simbolurile sunt exemple descriptive de companii din fiecare temă, nu recomandări ·
        Fotografii:{" "}
        {THEMES.map((t, i) => (
          <span key={t.autor}>
            <a href={t.autorUrl} target="_blank" rel="noopener noreferrer">
              {t.autor}
            </a>
            {i < THEMES.length - 1 ? " · " : ""}
          </span>
        ))}{" "}
        / <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a>
      </p>
    </>
  );
}
