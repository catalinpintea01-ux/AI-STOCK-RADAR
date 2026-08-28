import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { api } from "../api";
import { getTheme } from "../data/themes.js";
import StockLogo from "../components/StockLogo.jsx";
import LivePrice from "../components/LivePrice.jsx";
import PriceChart from "../components/PriceChart.jsx";
import VerdictTag from "../components/VerdictTag.jsx";
import Disclaimer from "../components/Disclaimer.jsx";
import { SkeletonRows, Skeleton } from "../components/Skeleton.jsx";
import { CalendarDays, Plus } from "lucide-react";
import { useLang } from "../i18n/index.jsx";
import { useTraduse } from "../i18n/useTraduse.js";

// Pagina dedicată unei teme de investiții: hero foto, indice tematic (media
// normalizată a coșului pe 30 de zile), companiile cu scoruri AI și
// raportările viitoare. Conținut descriptiv — nu recomandări.
export default function ThemePage() {
  const { slug } = useParams();
  const tema = getTheme(slug);
  const { t, locale } = useLang();
  const tt = useTraduse({
    descriere: tema?.descriere || "",
    ultimele30: "Ultimele 30 de zile · bază 100",
    indice: "Indicele temei",
    indiceGol: "Indicele temei se construiește — revino curând.",
    indiceNota:
      "Media normalizată a coșului de mai jos (fiecare companie pornește de la 100) — ilustrare descriptivă, nu un indice oficial.",
    companii: "{n} companii",
    cos: "Coșul temei",
    adaug: "Adaug...",
    urmaresteTot: "Urmărește toată tema",
    adaugate: "{n} acțiuni adăugate în radar.",
    oAdaugata: "1 acțiune adăugată în radar.",
    veziPremium: "Vezi ce include Premium →",
    calendar: "Calendar",
    raportari: "Raportări viitoare în temă",
    foto: "Fotografie:",
  });

  const [companii, setCompanii] = useState(null);
  const [indice, setIndice] = useState([]);
  const [raportari, setRaportari] = useState([]);
  const [urmarite, setUrmarite] = useState(new Set());
  const [adaug, setAdaug] = useState(false);
  const [mesajAdaugare, setMesajAdaugare] = useState("");
  const [adaugateCount, setAdaugateCount] = useState(0);

  useEffect(() => {
    if (!tema) return;
    setCompanii(null);
    api
      .getThemeData(tema.tickere)
      .then((data) => {
        setCompanii(data.companii);
        setIndice(data.indice);
        setRaportari(data.raportari);
      })
      .catch(() => setCompanii([]));
    api
      .getWatchlist()
      .then((data) => setUrmarite(new Set(data.items.map((i) => i.simbol))))
      .catch(() => {});
  }, [slug]);

  if (!tema) return <Navigate to="/" replace />;

  const variatieIndice =
    indice.length >= 2 ? ((indice[indice.length - 1].pret - indice[0].pret) / indice[0].pret) * 100 : null;

  async function urmaresteTema() {
    setAdaug(true);
    setMesajAdaugare("");
    setAdaugateCount(0);
    let adaugate = 0;
    let eroare = "";
    for (const simbol of tema.tickere) {
      if (urmarite.has(simbol)) continue;
      try {
        await api.addToWatchlist(simbol);
        adaugate++;
        setUrmarite((prev) => new Set([...prev, simbol]));
      } catch (err) {
        eroare = err.message;
        break;
      }
    }
    if (eroare) setMesajAdaugare(eroare);
    else if (adaugate > 0) setAdaugateCount(adaugate);
    setAdaug(false);
  }

  return (
    <div className="portfolio-page theme-page">
      <Link to="/" className="back-link">
        ← AI Stock Radar
      </Link>

      <div className="theme-hero" style={{ backgroundImage: `url(${tema.imgHero})` }}>
        <div className="theme-hero-overlay">
          <h1>{t(`teme.${tema.slug}.titlu`)}</h1>
          <p>{t(`teme.${tema.slug}.scurt`)}</p>
        </div>
      </div>
      <p className="landing-photo-credit theme-hero-credit">
        {tt("foto")}{" "}
        <a href={tema.autorUrl} target="_blank" rel="noopener noreferrer">
          {tema.autor}
        </a>{" "}
        / <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a>
      </p>

      <section className="holdings">
        <p className="theme-descriere">{tt("descriere")}</p>
      </section>

      <section className="holdings">
        <div className="panel-head">
          <div>
            <p className="eyebrow">{tt("ultimele30")}</p>
            <h2>{tt("indice")}</h2>
          </div>
          {variatieIndice !== null && (
            <span className={variatieIndice >= 0 ? "gain-positive theme-indice-var" : "gain-negative theme-indice-var"}>
              {variatieIndice >= 0 ? "+" : ""}
              {variatieIndice.toFixed(1)}%
            </span>
          )}
        </div>
        {companii === null ? (
          <Skeleton h={200} r="var(--radius-lg)" />
        ) : indice.length >= 2 ? (
          <PriceChart istoric={indice} />
        ) : (
          <p className="empty">{tt("indiceGol")}</p>
        )}
        <p className="calc-note">{tt("indiceNota")}</p>
      </section>

      <section className="holdings">
        <div className="panel-head">
          <div>
            <p className="eyebrow">{tt("companii", { n: tema.tickere.length })}</p>
            <h2>{tt("cos")}</h2>
          </div>
          <button className="add-watchlist-button" onClick={urmaresteTema} disabled={adaug}>
            <Plus size={13} className="ic" /> {adaug ? tt("adaug") : tt("urmaresteTot")}
          </button>
        </div>
        {(mesajAdaugare || adaugateCount > 0) && (
          <p className="muted" style={{ marginBottom: "0.6rem" }}>
            {mesajAdaugare || (adaugateCount === 1 ? tt("oAdaugata") : tt("adaugate", { n: adaugateCount }))}{" "}
            {mesajAdaugare.includes("Premium") && (
              <Link to="/premium" className="methodology-link">
                {tt("veziPremium")}
              </Link>
            )}
          </p>
        )}
        {companii === null ? (
          <SkeletonRows count={5} />
        ) : (
          <ul className="stock-list">
            {companii.map((c) => (
              <li key={c.simbol} className="stock-row">
                <Link to={`/stock/${c.simbol}`} className="watch-row-link">
                  <StockLogo simbol={c.simbol} />
                  <div>
                    <strong>{c.simbol}</strong>
                    <div className="muted">
                      {c.nume}
                      {c.radar && (
                        <>
                          {" · "}
                          <VerdictTag verdict={c.radar.verdict} />
                        </>
                      )}
                    </div>
                  </div>
                  {c.radar && <span className="tool-score">{c.radar.scorCompozit}</span>}
                  <div className="stock-right">
                    <div>
                      <LivePrice value={c.pret} />
                    </div>
                    <div className={c.variatieProcent >= 0 ? "gain-positive" : "gain-negative"}>
                      {c.variatieProcent >= 0 ? "+" : ""}
                      {c.variatieProcent.toFixed(1)}%
                    </div>
                  </div>
                  <span className="row-chevron">›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {raportari.length > 0 && (
        <section className="holdings">
          <div className="panel-head">
            <div>
              <p className="eyebrow">{tt("calendar")}</p>
              <h2>
                <CalendarDays size={16} className="h2-ic" /> {tt("raportari")}
              </h2>
            </div>
          </div>
          <ul className="stock-list">
            {raportari.map((r) => (
              <li key={r.simbol + r.data} className="stock-row">
                <Link to={`/stock/${r.simbol}`} className="watch-row-link">
                  <StockLogo simbol={r.simbol} />
                  <div>
                    <strong>{r.simbol}</strong>
                    <div className="muted">
                      {new Date(r.data).toLocaleDateString(locale, { day: "numeric", month: "long" })}
                    </div>
                  </div>
                  <span className="row-chevron">›</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Disclaimer />
    </div>
  );
}
