import { useEffect, useState } from "react";
import { SkeletonRows } from "../components/Skeleton.jsx";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import ScoreBar from "../components/ScoreBar.jsx";
import VerdictBadge from "../components/VerdictBadge.jsx";
import Disclaimer from "../components/Disclaimer.jsx";
import PriceChart from "../components/PriceChart.jsx";
import LivePrice from "../components/LivePrice.jsx";
import { useLang } from "../i18n/index.jsx";
import { useTraduse } from "../i18n/useTraduse.js";

// Intervalele graficului de preț — serii zilnice (Yahoo), fără intraday.
const RANGES = [
  { zile: 7, label: "1S" },
  { zile: 30, label: "1L" },
  { zile: 180, label: "6L" },
  { zile: 365, label: "1A" },
];

function formatDelta(n, invert = false) {
  const bun = invert ? n < 0 : n > 0;
  const rau = invert ? n > 0 : n < 0;
  const clasa = bun ? "gain-positive" : rau ? "gain-negative" : "muted";
  const semn = n > 0 ? `▲ +${n}` : n < 0 ? `▼ ${n}` : "→ 0";
  return <span className={clasa}>{semn}</span>;
}

function nr(v, digite = 1) {
  return v == null ? "N/A" : v.toFixed(digite);
}

function pct(v, digite = 1) {
  return v == null ? "N/A" : `${v.toFixed(digite)}%`;
}

export default function StockDetail() {
  const { simbol } = useParams();
  const { t, locale } = useLang();
  const tt = useTraduse({
    scoateWL: "− Scoate din Watchlist",
    adaugaWL: "+ Adaugă în Watchlist",
    azi: "azi",
    paper: "Paper trading",
    detii: "Deții {n} buc. @ ${p} medie",
    nuDetii: "Nu deții încă această acțiune în portofoliul simulat.",
    numerar: "Numerar disponibil:",
    cumpara: "Cumpără",
    vinde: "Vinde",
    aiRadar: "AI Radar",
    cumCalculam: "Cum calculăm scorul →",
    analizam: "Analizăm acțiunea — poate dura câteva secunde...",
    schimbareDin: "Ce s-a schimbat față de analiza din {data}",
    scorCompozit: "Scor compozit",
    analisti: "Analiști",
    momentum: "Momentum",
    fundamental: "Fundamental",
    risc: "Risc",
    riscuri: "Riscuri",
    invalidare: "Ce ar invalida această perspectivă",
    nuScor: "Nu am putut calcula scorul AI momentan.",
    indicatori: "Indicatori financiari cheie",
    pe: "P/E (preț/profit)",
    cap: "Capitalizare piață",
    beta: "Beta (volatilitate)",
    dividend: "Randament dividend",
    eps: "EPS (profit/acțiune)",
    crestereVenituri: "Creștere venituri (an)",
    marja: "Marjă profit",
    trilioane: "trilioane",
    miliarde: "miliarde",
    milioane: "milioane",
    min52: "Minim 52 săpt:",
    max52: "Maxim 52 săpt:",
    pretCurent: "Preț curent:",
    recomandari: "Recomandările analiștilor",
    ultimaLuna: "Ultima lună disponibilă",
    rezultate: "Rezultate financiare recente",
    estimat: "Estimat",
    real: "Real",
    insideri: "Tranzacții recente ale insiderilor",
    insideriSursa: "Cumpărări/vânzări raportate de directori și angajați ai companiei (surse SEC, via Finnhub).",
    cumparare: "Cumpărare",
    vanzare: "Vânzare",
    bucSufix: "buc.",
    stiriRecente: "Știri recente",
    stiriSursa: "Surse financiare agregate (Reuters, Yahoo Finance, PR Newswire etc. via Finnhub).",
    nicioStire: "Nu am găsit știri recente pentru această acțiune.",
  });
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
  const [istoricChart, setIstoricChart] = useState([]);
  const [zileChart, setZileChart] = useState(30);
  const [chartLoading, setChartLoading] = useState(true);

  function formatCap(m) {
    if (m == null) return "N/A";
    if (m >= 1e6) return `$${(m / 1e6).toFixed(2)} ${tt("trilioane")}`;
    if (m >= 1e3) return `$${(m / 1e3).toFixed(1)} ${tt("miliarde")}`;
    return `$${m.toFixed(0)} ${tt("milioane")}`;
  }

  useEffect(() => {
    setChartLoading(true);
    api
      .getStockHistory(simbol, zileChart)
      .then((data) => setIstoricChart(data.istoric))
      .catch(() => setIstoricChart([]))
      .finally(() => setChartLoading(false));
  }, [simbol, zileChart]);

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

  if (error) return <div className="page-message">{t("dash.eroare")} {error}</div>;

  return (
    <div className="portfolio-page">
      <Link to="/" className="back-link">
        ← AI Stock Radar
      </Link>

      <div className="value-card stock-hero">
        <div className="stock-hero-top">
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {profile?.logo && <img src={profile.logo} alt="" className="stock-logo" style={{ width: 32, height: 32 }} />}
            <span className="label">{profile?.name || simbol.toUpperCase()}</span>
          </div>
          <button className="why-button" onClick={toggleWatchlist} disabled={watchlistLoading}>
            {inWatchlist ? tt("scoateWL") : tt("adaugaWL")}
          </button>
        </div>
        <span className="stock-hero-price">
          {quote ? <LivePrice value={quote.stock.pret} /> : "..."}
        </span>
        {quote && (
          <span className={quote.stock.variatieProcent >= 0 ? "gain-positive stock-hero-var" : "gain-negative stock-hero-var"}>
            {quote.stock.variatieProcent >= 0 ? "+" : ""}
            {quote.stock.variatieProcent.toFixed(2)}% {tt("azi")}
          </span>
        )}
        {profile && (
          <span className="cash">
            {profile.finnhubIndustry} · IPO {profile.ipo}
          </span>
        )}

        <div className="chart-range-row">
          {RANGES.map((r) => (
            <button
              key={r.zile}
              type="button"
              className={`chart-range-btn ${zileChart === r.zile ? "chart-range-active" : ""}`}
              onClick={() => setZileChart(r.zile)}
            >
              {r.label}
            </button>
          ))}
        </div>
        {chartLoading ? <div className="chart-skeleton" /> : <PriceChart istoric={istoricChart} />}
      </div>

      <section className="holdings">
        <h2>{tt("paper")}</h2>
        {holding ? (
          <p className="muted" style={{ marginBottom: "0.5rem" }}>
            {tt("detii", { n: holding.cantitate, p: holding.pretMediuAchizitie.toFixed(2) })}
          </p>
        ) : (
          <p className="muted" style={{ marginBottom: "0.5rem" }}>{tt("nuDetii")}</p>
        )}
        {cashBalance !== null && <p className="muted">{tt("numerar")} ${cashBalance.toFixed(2)}</p>}
        {tradeError && <div className="error">{tradeError}</div>}
        <div className="trade-controls" style={{ marginTop: "0.5rem" }}>
          <input type="number" min="1" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} />
          <button onClick={handleBuy}>{tt("cumpara")}</button>
          {holding && <button onClick={handleSell}>{tt("vinde")}</button>}
        </div>
      </section>

      <section className="holdings">
        <h2>
          {tt("aiRadar")}{" "}
          <Link to="/metodologie" className="methodology-link">
            {tt("cumCalculam")}
          </Link>
        </h2>
        {radarLoading ? (
          <div className="mascota-loading"><img src="/mascota/laptop.png" alt="" className="mascota mascota-mica" /><p className="data-source">{tt("analizam")}</p></div>
        ) : radar ? (
          <>
            <VerdictBadge verdict={radar.verdict} incredere={radar.incredere} />

            {schimbare && (
              <div className="explanation" style={{ marginTop: 0 }}>
                <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
                  {tt("schimbareDin", {
                    data: new Date(schimbare.dataAnterioara).toLocaleDateString(locale, { day: "numeric", month: "short" }),
                  })}
                </div>
                <div className="score-bar-label">
                  <span>{tt("scorCompozit")} ({schimbare.scorAnterior} → {radar.scorCompozit})</span>
                  {formatDelta(schimbare.deltaCompozit)}
                </div>
                <div className="score-bar-label">
                  <span>{tt("analisti")}</span>
                  {formatDelta(schimbare.deltaAnalist)}
                </div>
                <div className="score-bar-label">
                  <span>{tt("momentum")}</span>
                  {formatDelta(schimbare.deltaMomentum)}
                </div>
                <div className="score-bar-label">
                  <span>{tt("fundamental")}</span>
                  {formatDelta(schimbare.deltaFundamental)}
                </div>
                <div className="score-bar-label">
                  <span>{tt("risc")}</span>
                  {formatDelta(schimbare.deltaRisc, true)}
                </div>
              </div>
            )}

            <ScoreBar label={tt("analisti")} score={radar.scorAnalist} />
            <ScoreBar label={tt("momentum")} score={radar.scorMomentum} />
            <ScoreBar label={tt("fundamental")} score={radar.scorFundamental} />
            <ScoreBar label={tt("risc")} score={radar.scorRisc} />
            <p className="explanation">{radar.rezumat}</p>

            {radar.riscuri?.length > 0 && (
              <>
                <h2>{tt("riscuri")}</h2>
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
                <h2>{tt("invalidare")}</h2>
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
          <p className="empty">{tt("nuScor")}</p>
        )}
      </section>

      {detalii?.metrici && (
        <section className="holdings">
          <h2>{tt("indicatori")}</h2>
          <div className="metric-grid">
            <div className="metric-tile">
              <span className="muted">{tt("pe")}</span>
              <strong>{nr(detalii.metrici.pe, 1)}</strong>
            </div>
            <div className="metric-tile">
              <span className="muted">{tt("cap")}</span>
              <strong>{formatCap(detalii.metrici.capitalizarePiata)}</strong>
            </div>
            <div className="metric-tile">
              <span className="muted">{tt("beta")}</span>
              <strong>{nr(detalii.metrici.beta, 2)}</strong>
            </div>
            <div className="metric-tile">
              <span className="muted">{tt("dividend")}</span>
              <strong>{pct(detalii.metrici.randamentDividend, 2)}</strong>
            </div>
            <div className="metric-tile">
              <span className="muted">{tt("eps")}</span>
              <strong>${nr(detalii.metrici.eps, 2)}</strong>
            </div>
            <div className="metric-tile">
              <span className="muted">{tt("crestereVenituri")}</span>
              <strong>{pct(detalii.metrici.cresterVenituri, 1)}</strong>
            </div>
            <div className="metric-tile">
              <span className="muted">{tt("marja")}</span>
              <strong>{pct(detalii.metrici.marjaProfit, 1)}</strong>
            </div>
          </div>

          {detalii.metrici.low52Sapt != null && detalii.metrici.high52Sapt != null && quote && (
            <div style={{ marginTop: "1rem" }}>
              <div className="score-bar-label">
                <span>{tt("min52")} ${detalii.metrici.low52Sapt.toFixed(2)}</span>
                <span>{tt("max52")} ${detalii.metrici.high52Sapt.toFixed(2)}</span>
              </div>
              <div className="score-bar-track" style={{ position: "relative", height: "10px" }}>
                <div
                  className="range-marker"
                  style={{
                    left: `${Math.min(100, Math.max(0, ((quote.stock.pret - detalii.metrici.low52Sapt) / (detalii.metrici.high52Sapt - detalii.metrici.low52Sapt)) * 100))}%`,
                  }}
                />
              </div>
              <p className="muted" style={{ marginTop: "0.3rem" }}>{tt("pretCurent")} ${quote.stock.pret.toFixed(2)}</p>
            </div>
          )}
        </section>
      )}

      {detalii?.analisti && (
        <section className="holdings">
          <h2>{tt("recomandari")}</h2>
          <p className="muted">{tt("ultimaLuna")} ({detalii.analisti.period})</p>
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
          <h2>{tt("rezultate")}</h2>
          <ul className="holding-list">
            {detalii.earnings.map((e, i) => (
              <li key={i} className="holding-row">
                <div>
                  <strong>{e.period}</strong>
                  <div className="muted">
                    {tt("estimat")} ${e.estimate?.toFixed(2)} · {tt("real")} ${e.actual?.toFixed(2)}
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
          <h2>{tt("insideri")}</h2>
          <p className="data-source">{tt("insideriSursa")}</p>
          <ul className="holding-list">
            {detalii.tranzactiiInsideri.map((tr, i) => (
              <li key={i} className="holding-row">
                <div>
                  <strong>{tr.nume}</strong>
                  <div className="muted">
                    {new Date(tr.data).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
                <div className={tr.tip === "cumparare" ? "gain-positive" : "gain-negative"}>
                  {tr.tip === "cumparare" ? tt("cumparare") : tt("vanzare")} · {tr.actiuni.toLocaleString(locale)} {tt("bucSufix")}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="holdings">
        <h2>{tt("stiriRecente")}</h2>
        <p className="data-source">{tt("stiriSursa")}</p>
        {newsLoading ? (
          <SkeletonRows count={3} />
        ) : news.length === 0 ? (
          <p className="empty">{tt("nicioStire")}</p>
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
                    {n.sursa} · {new Date(n.data).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}
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
