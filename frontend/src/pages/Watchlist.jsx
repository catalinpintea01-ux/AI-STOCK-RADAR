import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import Disclaimer from "../components/Disclaimer.jsx";
import TickerTape from "../components/TickerTape.jsx";
import StockLogo from "../components/StockLogo.jsx";
import ScoreRing from "../components/ScoreRing.jsx";
import Sparkline from "../components/Sparkline.jsx";

const VERDICT_CHIP = {
  optimist: "🔵 Optimist",
  neutru: "⚪ Neutru",
  rezervat: "🟠 Rezervat",
};

function formatDelta(n) {
  const clasa = n > 0 ? "gain-positive" : n < 0 ? "gain-negative" : "muted";
  const semn = n > 0 ? `▲ +${n}` : n < 0 ? `▼ ${n}` : "→ 0";
  return <span className={clasa}>{semn}</span>;
}

const AUTO_REFRESH_MAX_ITEMS = 15; // peste acest prag, nu mai reîmprospătăm prețurile la 30s
// (un watchlist de 50 de acțiuni ar cere prea des Finnhub și ar lovi rate-limit-ul gratuit).

const MOMENT_LABEL = {
  bmo: "înainte de deschidere",
  amc: "după închidere",
  dmh: "în timpul ședinței",
};

function zileRamase(dataIso) {
  const azi = new Date();
  azi.setHours(0, 0, 0, 0);
  const data = new Date(dataIso);
  return Math.round((data - azi) / (24 * 60 * 60 * 1000));
}

function formatZileRamase(dataIso) {
  const zile = zileRamase(dataIso);
  if (zile === 0) return "azi";
  if (zile === 1) return "mâine";
  return `în ${zile} zile`;
}

const INTEREST_OPTIONS = [
  { value: "tehnologie", label: "Tehnologie" },
  { value: "energie", label: "Energie" },
  { value: "financiar", label: "Financiar / Bănci" },
  { value: "sanatate", label: "Sănătate" },
  { value: "consum", label: "Consum / Retail" },
  { value: "dividende", label: "Dividende stabile" },
];

const SORT_OPTIONS = [
  { value: "implicit", label: "Implicit (adăugate recent)" },
  { value: "scor", label: "Scor AI" },
  { value: "variatie", label: "Variație % azi" },
  { value: "alfabetic", label: "Alfabetic" },
];

function sortItems(items, sortBy) {
  const copie = [...items];
  if (sortBy === "scor") {
    return copie.sort((a, b) => (b.radar?.scorCompozit ?? -1) - (a.radar?.scorCompozit ?? -1));
  }
  if (sortBy === "variatie") {
    return copie.sort((a, b) => (b.variatieProcent ?? -Infinity) - (a.variatieProcent ?? -Infinity));
  }
  if (sortBy === "alfabetic") {
    return copie.sort((a, b) => a.simbol.localeCompare(b.simbol));
  }
  return copie;
}

export default function Watchlist() {
  const [items, setItems] = useState(null);
  const [holdings, setHoldings] = useState({});
  const [marketNews, setMarketNews] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [bulkAdding, setBulkAdding] = useState(false);
  const [sortBy, setSortBy] = useState("implicit");
  const [analyzing, setAnalyzing] = useState(new Set());
  const [bulkAnalyzing, setBulkAnalyzing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  const [dailyPicks, setDailyPicks] = useState([]);
  const [interese, setInterese] = useState([]);
  const [onboarding, setOnboarding] = useState(false);
  const [onboardError, setOnboardError] = useState("");
  const itemCountRef = useRef(0);

  function load() {
    return api
      .getWatchlist()
      .then((data) => {
        setItems(data.items);
        itemCountRef.current = data.items.length;
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
    api
      .getPortfolio()
      .then((data) => {
        const map = {};
        data.portfolio.holdings.forEach((h) => {
          map[h.simbol] = h.cantitate;
        });
        setHoldings(map);
      })
      .catch(() => {});
    api
      .getMarketNews()
      .then((data) => setMarketNews(data.news))
      .catch(() => {});
    api
      .getEarningsCalendar()
      .then((data) => setEarnings(data.earnings))
      .catch(() => {});
    api
      .getDailyPicks()
      .then((data) => setDailyPicks(data.picks))
      .catch(() => {});
  }, []);

  // Reîmprospătare automată a prețurilor la 30s — silențioasă, nu afișează
  // eroare dacă o cerere eșuează ocazional. Se oprește pentru watchlist-uri
  // mari (ex: după "adaugă top 50"), ca să nu bombardăm Finnhub la fiecare 30s.
  useEffect(() => {
    const id = setInterval(() => {
      if (itemCountRef.current > AUTO_REFRESH_MAX_ITEMS) return;
      api
        .getWatchlist()
        .then((data) => {
          setItems(data.items);
          itemCountRef.current = data.items.length;
        })
        .catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, []);

  async function handleBulkAdd() {
    setBulkAdding(true);
    try {
      await api.bulkAddTop50();
      await load();
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setBulkAdding(false);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    setSearchError("");
    setSearchLoading(true);
    try {
      const data = await api.searchStocks(searchQuery);
      setSearchResults(data.results);
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleAdd(simbol) {
    setSearchError("");
    try {
      await api.addToWatchlist(simbol);
      setSearchResults([]);
      setSearchQuery("");
      await load();
      analyzeOne(simbol); // pornește analiza imediat, în fundal — momentul de interes maxim al userului
    } catch (err) {
      setSearchError(err.message);
    }
  }

  async function handleAddFromDaily(simbol) {
    await handleAdd(simbol);
    setDailyPicks((prev) => prev.filter((p) => p.simbol !== simbol));
  }

  function toggleInteres(value) {
    setInterese((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  // Construiește watchlist-ul de start: Claude alege N acțiuni pe baza
  // intereselor, apoi analizăm fiecare secvențial (același pattern rate-limited
  // ca "Analizează tot"), ca userul să vadă scoruri, nu doar simboluri goale.
  async function handleOnboard() {
    setOnboardError("");
    setOnboarding(true);
    try {
      const data = await api.onboardWatchlist(interese);
      await load();
      for (const item of data.adaugate) {
        await analyzeOne(item.simbol);
        await new Promise((r) => setTimeout(r, 700));
      }
    } catch (err) {
      setOnboardError(err.message);
    } finally {
      setOnboarding(false);
    }
  }

  async function handleRemove(simbol) {
    await api.removeFromWatchlist(simbol);
    await load();
  }

  function markAnalyzing(simbol, activ) {
    setAnalyzing((prev) => {
      const next = new Set(prev);
      if (activ) next.add(simbol);
      else next.delete(simbol);
      return next;
    });
  }

  // Actualizează doar rândul analizat, local — un reload complet al listei
  // ar re-cere cotația live pentru TOATE simbolurile, inutil de scump aici.
  async function analyzeOne(simbol) {
    markAnalyzing(simbol, true);
    try {
      const data = await api.getRadar(simbol);
      setItems((prev) =>
        prev.map((it) => (it.simbol === simbol ? { ...it, radar: data.radar, schimbare: data.schimbare } : it))
      );
    } catch (err) {
      console.error(err);
    } finally {
      markAnalyzing(simbol, false);
    }
  }

  async function handleAnalyzeAll() {
    const deAnalizat = items.filter((i) => !i.radar).map((i) => i.simbol);
    if (deAnalizat.length === 0) return;

    setBulkAnalyzing(true);
    setBulkProgress({ done: 0, total: deAnalizat.length });
    for (const simbol of deAnalizat) {
      await analyzeOne(simbol);
      setBulkProgress((p) => ({ ...p, done: p.done + 1 }));
      await new Promise((r) => setTimeout(r, 700)); // nu bombardăm Finnhub/Claude
    }
    setBulkAnalyzing(false);
  }

  if (error) return <div className="page-message">Eroare: {error}</div>;
  if (!items) return <div className="page-message">Se încarcă...</div>;

  const briefItems = items
    .filter((i) => i.schimbare && i.schimbare.deltaCompozit !== 0)
    .sort((a, b) => Math.abs(b.schimbare.deltaCompozit) - Math.abs(a.schimbare.deltaCompozit))
    .slice(0, 5);
  const neanalizateCount = items.filter((i) => !i.radar).length;
  const optimisteCount = items.filter((i) => i.radar?.verdict === "optimist").length;
  const rezervateCount = items.filter((i) => i.radar?.verdict === "rezervat").length;
  const neutruCount = items.filter((i) => i.radar?.verdict === "neutru").length;
  const analizateCount = optimisteCount + rezervateCount + neutruCount;
  const raporteazaCurandCount = earnings.filter((e) => zileRamase(e.data) <= 7).length;

  return (
    <div className="portfolio-page">
      <TickerTape />

      <h1 className="page-title">AI Stock Radar</h1>
      <p className="cash">Urmărește acțiuni și primești context AI despre ele — nu recomandări de tranzacționare.</p>

      {items.length > 0 && (
        <section className="radar-snapshot">
          <h2 className="radar-snapshot-title">📡 Radar Snapshot</h2>
          {analizateCount === 0 ? (
            <p className="radar-snapshot-empty">
              Analiza AI pornește automat pentru cele {items.length} acțiuni urmărite — revino în câteva minute pentru primele scoruri.
            </p>
          ) : (
            <>
              <div className="radar-snapshot-stats">
                <div className="radar-snapshot-stat">
                  <span className="radar-snapshot-number optimist">{optimisteCount}</span>
                  <span className="radar-snapshot-label">optimiste</span>
                </div>
                <div className="radar-snapshot-stat">
                  <span className="radar-snapshot-number rezervat">{rezervateCount}</span>
                  <span className="radar-snapshot-label">rezervate</span>
                </div>
                <div className="radar-snapshot-stat">
                  <span className="radar-snapshot-number">{raporteazaCurandCount}</span>
                  <span className="radar-snapshot-label">raportează în 7 zile</span>
                </div>
              </div>
              {neanalizateCount > 0 && (
                <p className="radar-snapshot-pending">🔄 {neanalizateCount} încă în curs de analiză automată</p>
              )}
            </>
          )}
        </section>
      )}

      {dailyPicks.length > 0 && (
        <section className="holdings">
          <h2>🧭 Research zilnic — merită urmărite azi</h2>
          <ul className="stock-list">
            {dailyPicks.map((p) => (
              <li key={p.simbol} className="stock-row">
                <div className="stock-row-left">
                  <StockLogo simbol={p.simbol} />
                  <div>
                    <strong>{p.simbol}</strong>
                    <div className="muted">{p.motiv}</div>
                  </div>
                </div>
                <div className="stock-right">
                  <div>${p.pret.toFixed(2)}</div>
                  <div className={p.variatieProcent >= 0 ? "gain-positive" : "gain-negative"}>
                    {p.variatieProcent >= 0 ? "+" : ""}
                    {p.variatieProcent.toFixed(1)}%
                  </div>
                </div>
                <button onClick={() => handleAddFromDaily(p.simbol)}>+ Watchlist</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="search-section">
        <h2>Adaugă o acțiune</h2>
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Nume companie sau ticker (ex: Palantir, PLTR)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" disabled={searchLoading}>
            {searchLoading ? "Caut..." : "Caută"}
          </button>
        </form>
        {searchError && <div className="error">{searchError}</div>}

        <button className="why-button" onClick={handleBulkAdd} disabled={bulkAdding} style={{ marginBottom: "1rem" }}>
          {bulkAdding ? "Adaug..." : "⚡ Adaugă automat top 50 cele mai tranzacționate"}
        </button>

        {searchResults.length > 0 && (
          <ul className="stock-list">
            {searchResults.map((r) => (
              <li key={r.simbol} className="stock-row">
                <div className="stock-row-left">
                  <StockLogo simbol={r.simbol} />
                  <div>
                    <strong>{r.simbol}</strong>
                    <div className="muted">{r.nume}</div>
                  </div>
                </div>
                <button onClick={() => handleAdd(r.simbol)}>+ Watchlist</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="holdings">
        <div className="watchlist-header-row">
          <h2>🔍 Analizează o acțiune în detaliu</h2>
          <div className="watchlist-header-actions">
            {neanalizateCount > 0 && (
              <button className="analyze-all-button" onClick={handleAnalyzeAll} disabled={bulkAnalyzing}>
                {bulkAnalyzing
                  ? `Analizez ${bulkProgress.done}/${bulkProgress.total}...`
                  : `⚡ Analizează tot (${neanalizateCount})`}
              </button>
            )}
            {items.length > 1 && (
              <label className="sort-control">
                Sortează după{" "}
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>
        {items.length > 0 && (
          <p className="row-hint">👉 Atinge o acțiune pentru detalii complete, sau apasă Analizează pentru scor AI instant.</p>
        )}
        {items.length === 0 ? (
          <div className="onboarding-box">
            <p className="empty">Alege ce te interesează și îți construim un watchlist de start:</p>
            <div className="onboarding-chips">
              {INTEREST_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`onboarding-chip ${interese.includes(opt.value) ? "active" : ""}`}
                  onClick={() => toggleInteres(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {onboardError && <div className="error">{onboardError}</div>}
            <button className="why-button" onClick={handleOnboard} disabled={interese.length === 0 || onboarding}>
              {onboarding ? "Construiesc watchlist-ul..." : "⚡ Construiește-mi watchlist-ul"}
            </button>
          </div>
        ) : (
          <ul className="stock-list">
            {sortItems(items, sortBy).map((item) => (
              <li key={item.simbol} className="stock-row">
                <Link to={`/stock/${item.simbol}`} className="watch-row-link">
                  <StockLogo simbol={item.simbol} />
                  <div>
                    <strong>{item.simbol}</strong>
                    {holdings[item.simbol] && (
                      <span className="badge-chip" style={{ marginLeft: "0.5rem" }}>
                        📊 {holdings[item.simbol]} deținute
                      </span>
                    )}
                    <div className="muted">
                      {item.radar ? VERDICT_CHIP[item.radar.verdict] || item.radar.verdict : "Neanalizat încă"}
                    </div>
                  </div>
                  {item.radar && <ScoreRing score={item.radar.scorCompozit} verdict={item.radar.verdict} />}
                  <Sparkline puncte={item.istoricPret} />
                  {item.pret !== null && (
                    <div className="stock-right">
                      <div>${item.pret.toFixed(2)}</div>
                      <div className={item.variatieProcent >= 0 ? "gain-positive" : "gain-negative"}>
                        {item.variatieProcent >= 0 ? "+" : ""}
                        {item.variatieProcent.toFixed(1)}%
                      </div>
                    </div>
                  )}
                  <span className="row-chevron">›</span>
                </Link>
                {!item.radar && (
                  <button
                    className="analyze-button"
                    onClick={() => analyzeOne(item.simbol)}
                    disabled={analyzing.has(item.simbol)}
                  >
                    {analyzing.has(item.simbol) ? "Analizez..." : "⚡ Analizează"}
                  </button>
                )}
                <button className="logout" onClick={() => handleRemove(item.simbol)}>
                  Scoate
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {marketNews.length > 0 && (
        <section className="hero-news">
          {marketNews.map((n) => (
            <Link
              key={n.id}
              to={`/stiri/${n.id}`}
              className="hero-news-card"
              style={n.imagine ? { backgroundImage: `url(${n.imagine})` } : undefined}
            >
              <div className="hero-news-body">
                <span className="hero-news-source">{n.sursa} · Astăzi</span>
                <h3 className="hero-news-headline">{n.titluAI}</h3>
              </div>
            </Link>
          ))}
        </section>
      )}

      {briefItems.length > 0 && (
        <section className="holdings">
          <h2>🔥 Ce s-a schimbat</h2>
          <ul className="stock-list">
            {briefItems.map((item) => (
              <li key={item.simbol} className="stock-row">
                <Link to={`/stock/${item.simbol}`} className="watch-row-link">
                  <StockLogo simbol={item.simbol} />
                  <div>
                    <strong>{item.simbol}</strong>
                    <div className="muted">
                      Scor AI: {item.schimbare.scorAnterior} → {item.radar.scorCompozit}
                    </div>
                  </div>
                  {formatDelta(item.schimbare.deltaCompozit)}
                  <span className="row-chevron">›</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {earnings.length > 0 && (
        <section className="holdings">
          <h2>📅 Raportări apropiate</h2>
          <ul className="stock-list">
            {earnings.slice(0, 8).map((e) => (
              <li key={`${e.simbol}-${e.data}`} className="stock-row">
                <Link to={`/stock/${e.simbol}`} className="watch-row-link">
                  <StockLogo simbol={e.simbol} />
                  <div>
                    <strong>{e.simbol}</strong>
                    <div className="muted">
                      Raportează {formatZileRamase(e.data)}
                      {e.moment && MOMENT_LABEL[e.moment] ? ` · ${MOMENT_LABEL[e.moment]}` : ""}
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
