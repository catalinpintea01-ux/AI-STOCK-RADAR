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

// Pagina dedicată unei teme de investiții: hero foto, indice tematic (media
// normalizată a coșului pe 30 de zile), companiile cu scoruri AI și
// raportările viitoare. Conținut descriptiv — nu recomandări.
export default function ThemePage() {
  const { slug } = useParams();
  const tema = getTheme(slug);

  const [companii, setCompanii] = useState(null);
  const [indice, setIndice] = useState([]);
  const [raportari, setRaportari] = useState([]);
  const [urmarite, setUrmarite] = useState(new Set());
  const [adaug, setAdaug] = useState(false);
  const [mesajAdaugare, setMesajAdaugare] = useState("");

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
    let adaugate = 0;
    for (const simbol of tema.tickere) {
      if (urmarite.has(simbol)) continue;
      try {
        await api.addToWatchlist(simbol);
        adaugate++;
        setUrmarite((prev) => new Set([...prev, simbol]));
      } catch (err) {
        setMesajAdaugare(err.message);
        break;
      }
    }
    if (adaugate > 0 && !mesajAdaugare) {
      setMesajAdaugare(`${adaugate} ${adaugate === 1 ? "acțiune adăugată" : "acțiuni adăugate"} în radar.`);
    }
    setAdaug(false);
  }

  return (
    <div className="portfolio-page theme-page">
      <Link to="/" className="back-link">
        ← AI Stock Radar
      </Link>

      <div className="theme-hero" style={{ backgroundImage: `url(${tema.imgHero})` }}>
        <div className="theme-hero-overlay">
          <h1>{tema.titlu}</h1>
          <p>{tema.scurt}</p>
        </div>
      </div>
      <p className="landing-photo-credit theme-hero-credit">
        Fotografie:{" "}
        <a href={tema.autorUrl} target="_blank" rel="noopener noreferrer">
          {tema.autor}
        </a>{" "}
        / <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a>
      </p>

      <section className="holdings">
        <p className="theme-descriere">{tema.descriere}</p>
      </section>

      <section className="holdings">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Ultimele 30 de zile · bază 100</p>
            <h2>Indicele temei</h2>
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
          <p className="empty">Indicele temei se construiește — revino curând.</p>
        )}
        <p className="calc-note">
          Media normalizată a coșului de mai jos (fiecare companie pornește de la 100) — ilustrare
          descriptivă, nu un indice oficial.
        </p>
      </section>

      <section className="holdings">
        <div className="panel-head">
          <div>
            <p className="eyebrow">{tema.tickere.length} companii</p>
            <h2>Coșul temei</h2>
          </div>
          <button className="add-watchlist-button" onClick={urmaresteTema} disabled={adaug}>
            <Plus size={13} className="ic" /> {adaug ? "Adaug..." : "Urmărește toată tema"}
          </button>
        </div>
        {mesajAdaugare && (
          <p className="muted" style={{ marginBottom: "0.6rem" }}>
            {mesajAdaugare}{" "}
            {mesajAdaugare.includes("Premium") && (
              <Link to="/premium" className="methodology-link">
                Vezi ce include Premium →
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
              <p className="eyebrow">Calendar</p>
              <h2>
                <CalendarDays size={16} className="h2-ic" /> Raportări viitoare în temă
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
                      {new Date(r.data).toLocaleDateString("ro-RO", { day: "numeric", month: "long" })}
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
