import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import ScoreBar from "../components/ScoreBar.jsx";
import VerdictBadge from "../components/VerdictBadge.jsx";
import Disclaimer from "../components/Disclaimer.jsx";

function formatDelta(n, invert = false) {
  const bun = invert ? n < 0 : n > 0;
  const rau = invert ? n > 0 : n < 0;
  const clasa = bun ? "gain-positive" : rau ? "gain-negative" : "muted";
  const semn = n > 0 ? `▲ +${n}` : n < 0 ? `▼ ${n}` : "→ 0";
  return <span className={clasa}>{semn}</span>;
}

function formatCap(m) {
  if (m == null) return "N/A";
  if (m >= 1e6) return `$${(m / 1e6).toFixed(2)} trilioane`;
  if (m >= 1e3) return `$${(m / 1e3).toFixed(1)} miliarde`;
  return `$${m.toFixed(0)} milioane`;
}

function nr(v, digite = 1) {
  return v == null ? "N/A" : v.toFixed(digite);
}

function pct(v, digite = 1) {
  return v == null ? "N/A" : `${v.toFixed(digite)}%`;
}

export default function StockDetail() {
  const { simbol } = useParams();
  const [quote, setQuote] = useState(null);
  const [profile, setProfile] = useState(null);
  const [radar, setRadar] = useState(null);
  const [schimbare, setSchimbare] = useState(null);
  const [detalii, setDetalii] = useState(null);
  const [radarLoading, setRadarLoading] = useState(true);
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [cashBalance, setCashBalance] = useState(null);
  const [holding, setHolding] = useState(null);
  const [qty, setQty] = useState(1);
  const [tradeError, setTradeError] = useState("");
  const [error, setError] = useState("");

  function loadPortfolio() {
    return api.getPortfolio().then((data) => {
      setCashBalance(data.portfolio.cashBalance);
      setHolding(data.portfolio.holdings.find((h) => h.simbol === simbol.toUpperCase()) || null);
    });
  }

  useEffect(() => {
    setRadar(null);
    setRadarLoading(true);
    setError("");

    api.getStockQuote(simbol).then(setQuote).catch((err) => setError(err.message));
    api.getCompanyProfile(simbol).then((data) => setProfile(data.profile)).catch(() => {});
    api
      .getWatchlist()
      .then((data) => setInWatchlist(data.items.some((i) => i.simbol === simbol.toUpperCase())))
      .catch(() => {});
    setSchimbare(null);
    setDetalii(null);
    api
      .getRadar(simbol)
      .then((data) => {
        setRadar(data.radar);
        setSchimbare(data.schimbare);
        setDetalii(data.detalii);
      })
      .catch((err) => setError(err.message))
      .finally(() => setRadarLoading(false));

    setNews([]);
    setNewsLoading(true);
    api
      .getStockNews(simbol)
      .then((data) => setNews(data.news))
      .catch(() => {})
      .finally(() => setNewsLoading(false));

    setTradeError("");
    loadPortfolio().catch(() => {});

    // Reîmprospătare automată a prețului la 30s — restul (radar, știri) nu
    // se recalculează la fel de des, nu are sens să le mai cerem la fiecare 30s.
    const id = setInterval(() => {
      api.getStockQuote(simbol).then(setQuote).catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, [simbol]);

  async function handleBuy() {
    setTradeError("");
    try {
      await api.buyStock(simbol, qty);
      await loadPortfolio();
    } catch (err) {
      setTradeError(err.message);
    }
  }

  async function handleSell() {
    setTradeError("");
    try {
      await api.sellStock(simbol, qty);
      await loadPortfolio();
    } catch (err) {
      setTradeError(err.message);
    }
  }

  async function toggleWatchlist() {
    setWatchlistLoading(true);
    try {
      if (inWatchlist) {
        await api.removeFromWatchlist(simbol);
        setInWatchlist(false);
      } else {
        await api.addToWatchlist(simbol);
        setInWatchlist(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setWatchlistLoading(false);
    }
  }

  if (error) return <div className="page-message">Eroare: {error}</div>;

  return (
    <div className="portfolio-page">
      <Link to="/" className="back-link">
        ← AI Stock Radar
      </Link>

      <div className="value-card">
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {profile?.logo && <img src={profile.logo} alt="" className="stock-logo" style={{ width: 32, height: 32 }} />}
          <span className="label">{profile?.name || simbol.toUpperCase()}</span>
        </div>
        <span className="value">{quote ? `$${quote.stock.pret.toFixed(2)}` : "..."}</span>
        {quote && (
          <span className={quote.stock.variatieProcent >= 0 ? "gain-positive" : "gain-negative"}>
            {quote.stock.variatieProcent >= 0 ? "+" : ""}
            {quote.stock.variatieProcent.toFixed(1)}% azi
          </span>
        )}
        {profile && (
          <span className="cash">
            {profile.finnhubIndustry} · IPO {profile.ipo}
          </span>
        )}
        <button className="why-button" onClick={toggleWatchlist} disabled={watchlistLoading} style={{ marginTop: "0.75rem" }}>
          {inWatchlist ? "− Scoate din Watchlist" : "+ Adaugă în Watchlist"}
        </button>
      </div>

      <section className="holdings">
        <h2>Paper trading</h2>
        {holding ? (
          <p className="muted" style={{ marginBottom: "0.5rem" }}>
            Deții {holding.cantitate} buc. @ ${holding.pretMediuAchizitie.toFixed(2)} medie
          </p>
        ) : (
          <p className="muted" style={{ marginBottom: "0.5rem" }}>
            Nu deții încă această acțiune în portofoliul simulat.
          </p>
        )}
        {cashBalance !== null && <p className="muted">Numerar disponibil: ${cashBalance.toFixed(2)}</p>}
        {tradeError && <div className="error">{tradeError}</div>}
        <div className="trade-controls" style={{ marginTop: "0.5rem" }}>
          <input type="number" min="1" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} />
          <button onClick={handleBuy}>Cumpără</button>
          {holding && <button onClick={handleSell}>Vinde</button>}
        </div>
      </section>

      <section className="holdings">
        <h2>
          AI Radar{" "}
          <Link to="/metodologie" className="methodology-link">
            Cum calculăm scorul →
          </Link>
        </h2>
        {radarLoading ? (
          <p className="data-source">Se analizează acțiunea (poate dura câteva secunde)...</p>
        ) : radar ? (
          <>
            <VerdictBadge verdict={radar.verdict} incredere={radar.incredere} />

            {schimbare && (
              <div className="explanation" style={{ marginTop: 0 }}>
                <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
                  Ce s-a schimbat față de analiza din{" "}
                  {new Date(schimbare.dataAnterioara).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })}
                </div>
                <div className="score-bar-label">
                  <span>Scor compozit ({schimbare.scorAnterior} → {radar.scorCompozit})</span>
                  {formatDelta(schimbare.deltaCompozit)}
                </div>
                <div className="score-bar-label">
                  <span>Analiști</span>
                  {formatDelta(schimbare.deltaAnalist)}
                </div>
                <div className="score-bar-label">
                  <span>Momentum</span>
                  {formatDelta(schimbare.deltaMomentum)}
                </div>
                <div className="score-bar-label">
                  <span>Fundamental</span>
                  {formatDelta(schimbare.deltaFundamental)}
                </div>
                <div className="score-bar-label">
                  <span>Risc</span>
                  {formatDelta(schimbare.deltaRisc, true)}
                </div>
              </div>
            )}

            <ScoreBar label="Analiști" score={radar.scorAnalist} />
            <ScoreBar label="Momentum" score={radar.scorMomentum} />
            <ScoreBar label="Fundamental" score={radar.scorFundamental} />
            <ScoreBar label="Risc" score={radar.scorRisc} />
            <p className="explanation">{radar.rezumat}</p>

            {radar.riscuri?.length > 0 && (
              <>
                <h2>Riscuri</h2>
                <ul>
                  {radar.riscuri.map((r, i) => (
                    <li key={i} className="muted">
                      {r}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {radar.invalidare?.length > 0 && (
              <>
                <h2>Ce ar invalida această perspectivă</h2>
                <ul>
                  {radar.invalidare.map((r, i) => (
                    <li key={i} className="muted">
                      {r}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <Disclaimer />
          </>
        ) : (
          <p className="empty">Nu am putut calcula scorul AI momentan.</p>
        )}
      </section>

      {detalii?.metrici && (
        <section className="holdings">
          <h2>Indicatori financiari cheie</h2>
          <div className="metric-grid">
            <div className="metric-tile">
              <span className="muted">P/E (preț/profit)</span>
              <strong>{nr(detalii.metrici.pe, 1)}</strong>
            </div>
            <div className="metric-tile">
              <span className="muted">Capitalizare piață</span>
              <strong>{formatCap(detalii.metrici.capitalizarePiata)}</strong>
            </div>
            <div className="metric-tile">
              <span className="muted">Beta (volatilitate)</span>
              <strong>{nr(detalii.metrici.beta, 2)}</strong>
            </div>
            <div className="metric-tile">
              <span className="muted">Randament dividend</span>
              <strong>{pct(detalii.metrici.randamentDividend, 2)}</strong>
            </div>
            <div className="metric-tile">
              <span className="muted">EPS (profit/acțiune)</span>
              <strong>${nr(detalii.metrici.eps, 2)}</strong>
            </div>
            <div className="metric-tile">
              <span className="muted">Creștere venituri (an)</span>
              <strong>{pct(detalii.metrici.cresterVenituri, 1)}</strong>
            </div>
            <div className="metric-tile">
              <span className="muted">Marjă profit</span>
              <strong>{pct(detalii.metrici.marjaProfit, 1)}</strong>
            </div>
          </div>

          {detalii.metrici.low52Sapt != null && detalii.metrici.high52Sapt != null && quote && (
            <div style={{ marginTop: "1rem" }}>
              <div className="score-bar-label">
                <span>Minim 52 săpt: ${detalii.metrici.low52Sapt.toFixed(2)}</span>
                <span>Maxim 52 săpt: ${detalii.metrici.high52Sapt.toFixed(2)}</span>
              </div>
              <div className="score-bar-track" style={{ position: "relative", height: "10px" }}>
                <div
                  className="range-marker"
                  style={{
                    left: `${Math.min(100, Math.max(0, ((quote.stock.pret - detalii.metrici.low52Sapt) / (detalii.metrici.high52Sapt - detalii.metrici.low52Sapt)) * 100))}%`,
                  }}
                />
              </div>
              <p className="muted" style={{ marginTop: "0.3rem" }}>Preț curent: ${quote.stock.pret.toFixed(2)}</p>
            </div>
          )}
        </section>
      )}

      {detalii?.analisti && (
        <section className="holdings">
          <h2>Recomandările analiștilor</h2>
          <p className="muted">Ultima lună disponibilă ({detalii.analisti.period})</p>
          <div className="analyst-row">
            <div className="analyst-chip analyst-strongbuy">
              <strong>{detalii.analisti.strongBuy}</strong>
              <span>Strong Buy</span>
            </div>
            <div className="analyst-chip analyst-buy">
              <strong>{detalii.analisti.buy}</strong>
              <span>Buy</span>
            </div>
            <div className="analyst-chip analyst-hold">
              <strong>{detalii.analisti.hold}</strong>
              <span>Hold</span>
            </div>
            <div className="analyst-chip analyst-sell">
              <strong>{detalii.analisti.sell}</strong>
              <span>Sell</span>
            </div>
            <div className="analyst-chip analyst-strongsell">
              <strong>{detalii.analisti.strongSell}</strong>
              <span>Strong Sell</span>
            </div>
          </div>
        </section>
      )}

      {detalii?.earnings?.length > 0 && (
        <section className="holdings">
          <h2>Rezultate financiare recente</h2>
          <ul className="holding-list">
            {detalii.earnings.map((e, i) => (
              <li key={i} className="holding-row">
                <div>
                  <strong>{e.period}</strong>
                  <div className="muted">
                    Estimat ${e.estimate?.toFixed(2)} · Real ${e.actual?.toFixed(2)}
                  </div>
                </div>
                <div className={e.surprisePercent >= 0 ? "gain-positive" : "gain-negative"}>
                  {e.surprisePercent >= 0 ? "+" : ""}
                  {e.surprisePercent?.toFixed(1)}%
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {detalii?.tranzactiiInsideri?.length > 0 && (
        <section className="holdings">
          <h2>Tranzacții recente ale insiderilor</h2>
          <p className="data-source">Cumpărări/vânzări raportate de directori și angajați ai companiei (surse SEC, via Finnhub).</p>
          <ul className="holding-list">
            {detalii.tranzactiiInsideri.map((t, i) => (
              <li key={i} className="holding-row">
                <div>
                  <strong>{t.nume}</strong>
                  <div className="muted">
                    {new Date(t.data).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
                <div className={t.tip === "cumparare" ? "gain-positive" : "gain-negative"}>
                  {t.tip === "cumparare" ? "Cumpărare" : "Vânzare"} · {t.actiuni.toLocaleString("ro-RO")} buc.
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="holdings">
        <h2>Știri recente</h2>
        <p className="data-source">
          Surse financiare agregate (Reuters, Yahoo Finance, PR Newswire etc. via Finnhub) — nu includem încă X/Twitter
          sau CNN, care ar necesita integrări separate.
        </p>
        {newsLoading ? (
          <p className="empty">Se încarcă știrile...</p>
        ) : news.length === 0 ? (
          <p className="empty">Nu am găsit știri recente pentru această acțiune.</p>
        ) : (
          <ul className="holding-list">
            {news.map((n, i) => (
              <li key={i} className="holding-row" style={{ alignItems: "flex-start" }}>
                <div>
                  <a href={n.url} target="_blank" rel="noreferrer" className="news-headline">
                    {n.headline}
                  </a>
                  {n.rezumat && <div className="muted" style={{ marginTop: "0.25rem" }}>{n.rezumat}</div>}
                  <div className="muted" style={{ marginTop: "0.25rem" }}>
                    {n.sursa} · {new Date(n.data).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
