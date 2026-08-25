import { Link } from "react-router-dom";

// Teme de investiții cu fotografii Unsplash (hotlink conform termenilor API,
// atribuire vizibilă). Texte pur descriptive; simbolurile sunt exemple de
// companii din fiecare temă, NU recomandări — nota apare sub secțiune.
const TEME = [
  {
    img: "https://images.unsplash.com/photo-1697577418970-95d99b5a55cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    titlu: "Inteligență artificială",
    text: "De la cipurile din centrele de date la asistenții din buzunar — cursa AI redesenează întreaga economie.",
    tickere: ["NVDA", "AMD", "MSFT"],
    autor: "Igor Omilaev",
    autorUrl: "https://unsplash.com/@omilaev",
  },
  {
    img: "https://images.unsplash.com/photo-1457364887197-9150188c107b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    titlu: "Economia spațială",
    text: "Rachete reutilizabile, constelații de sateliți și infrastructură orbitală — spațiul devine industrie.",
    tickere: ["RKLB", "LMT", "BA"],
    autor: "SpaceX",
    autorUrl: "https://unsplash.com/@spacex",
  },
  {
    img: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    titlu: "Drone și robotică",
    text: "Livrări autonome, agricultură de precizie, apărare — mașinile care zboară și lucrează singure.",
    tickere: ["AVAV", "TSLA", "DE"],
    autor: "Jason Mavrommatis",
    autorUrl: "https://unsplash.com/@jasonblackeye",
  },
  {
    img: "https://images.unsplash.com/photo-1651341050677-24dba59ce0fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    titlu: "Piețele globale",
    text: "Indicii, marile companii și pulsul zilnic al burselor — terenul pe care se joacă toate temele.",
    tickere: ["SPY", "QQQ", "AAPL"],
    autor: "Anne Nygård",
    autorUrl: "https://unsplash.com/@polarmermaid",
  },
];

// variant="app": tickerele duc direct la analiza acțiunii.
// variant="public": tickerele sunt chip-uri statice, CTA-ul e crearea contului.
export default function ThemeCards({ variant = "app" }) {
  return (
    <>
      <div className="theme-grid">
        {TEME.map((t) => (
          <div key={t.titlu} className="theme-card">
            <div className="theme-card-img">
              <img src={t.img} alt="" loading="lazy" />
              <span className="theme-card-title">{t.titlu}</span>
            </div>
            <div className="theme-card-body">
              <p>{t.text}</p>
              <div className="theme-tickers">
                {t.tickere.map((sym) =>
                  variant === "app" ? (
                    <Link key={sym} to={`/stock/${sym}`} className="theme-ticker">
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
        {TEME.map((t, i) => (
          <span key={t.autor}>
            <a href={t.autorUrl} target="_blank" rel="noopener noreferrer">
              {t.autor}
            </a>
            {i < TEME.length - 1 ? " · " : ""}
          </span>
        ))}{" "}
        / <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a>
      </p>
    </>
  );
}
