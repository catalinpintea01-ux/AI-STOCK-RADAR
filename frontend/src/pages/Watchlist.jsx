import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import Disclaimer from "../components/Disclaimer.jsx";
import TickerTape from "../components/TickerTape.jsx";
import StockLogo from "../components/StockLogo.jsx";
import ScoreRing from "../components/ScoreRing.jsx";
import Sparkline from "../components/Sparkline.jsx";
import AnimatedNumber from "../components/AnimatedNumber.jsx";
import TypewriterText from "../components/TypewriterText.jsx";
import ToolsPro from "../components/ToolsPro.jsx";
import RadarViz from "../components/RadarViz.jsx";
import PersonaCards from "../components/PersonaCards.jsx";
import VerdictTag from "../components/VerdictTag.jsx";
import { Zap, Target, ClipboardList, Compass, Newspaper, Activity, CalendarDays, Lightbulb, Lock } from "lucide-react";

const TAGLINE_PHRASES = [
  "scor AI pentru fiecare acțiune",
  "context zilnic din piețe",
  "earnings, risc, momentum",
  "watchlist care se analizează singur",
];



// Cei mai marcanți 2 factori din spatele scorului, derivați determinist din
// sub-scoruri — un "88" fără explicație nu inspiră încredere. Pragurile
// oglindesc verdictul din radar.js: ≥60 punct forte, ≤40 punct slab.
function factoriPrincipali(radar) {
  const factori = [
    { val: radar.scorAnalist, pozitiv: "analiști încrezători", negativ: "analiști rezervați" },
    { val: radar.scorMomentum, pozitiv: "momentum puternic", negativ: "momentum slab" },
    { val: radar.scorFundamental, pozitiv: "fundamentale solide", negativ: "fundamentale fragile" },
    { val: 100 - radar.scorRisc, pozitiv: "risc scăzut", negativ: "risc ridicat" },
  ];
  return factori
    .filter((f) => f.val >= 60 || f.val <= 40)
    .sort((a, b) => Math.abs(b.val - 50) - Math.abs(a.val - 50))
    .slice(0, 2)
    .map((f) => (f.val >= 60 ? f.pozitiv : f.negativ));
}

function formatDelta(n) {
  const clasa = n > 0 ? "gain-positive" : n < 0 ? "gain-negative" : "muted";
  const semn = n > 0 ? `▲ +${n}` : n < 0 ? `▼ ${n}` : "→ 0";
  return <span className={clasa}>{semn}</span>;
}

const AUTO_REFRESH_MAX_ITEMS = 15; // peste acest prag, nu mai reîmprospătăm prețurile la 30s
// (un watchlist de 50 de acțiuni ar cere prea des Finnhub și ar lovi rate-limit-ul gratuit).

const DEFAULT_VISIBLE_ROWS = 15; // restul se ascund după "Arată toate", ca lista să nu domine pagina

const MOMENT_LABEL = {
  bmo: "înainte de deschidere",
  amc: "după închidere",
  dmh: "în timpul ședinței",
};

// Micro-lecții pentru empty state-ul din "Research zilnic" — nu trimitem
// niciodată userul acasă cu mâna goală. Rotite pe zile, limbaj pur educativ.
const MICRO_LESSONS = [
  "Diversificarea înseamnă să nu depinzi de o singură acțiune sau un singur sector — un portofoliu variat amortizează șocurile individuale.",
  "Volatilitatea (beta) măsoară cât de mult oscilează o acțiune față de piață: beta peste 1 = mișcări mai ample, sub 1 = mai calme.",
  "Raportările trimestriale (earnings) sunt momentele în care prețurile se mișcă cel mai des — merită să știi când raportează companiile urmărite.",
  "Un P/E ridicat poate însemna așteptări mari de creștere, nu neapărat o acțiune scumpă — contextul sectorului contează.",
  "Tranzacțiile insiderilor (directori care cumpără sau vând propriile acțiuni) sunt raportate public și pot oferi context despre încrederea internă.",
  "Media analiștilor e doar o agregare de opinii — utilă ca reper, dar niciodată o garanție.",
  "Dollar-cost averaging înseamnă investiții periodice de sume egale, indiferent de preț — reduce impactul momentului ales.",
];

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

function formatRelativeTime(date, now) {
  const secunde = Math.round((now.getTime() - date.getTime()) / 1000);
  if (secunde < 45) return "chiar acum";
  const minute = Math.round(secunde / 60);
  if (minute < 60) return `acum ${minute} ${minute === 1 ? "minut" : "minute"}`;
  const ore = Math.round(minute / 60);
  return `acum ${ore} ${ore === 1 ? "oră" : "ore"}`;
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
  { value: "sector", label: "Grupează pe sector" },
];

const FILTER_OPTIONS = [
  { value: "toate", label: "Toate" },
  { value: "optimist", label: "Optimist" },
  { value: "neutru", label: "Neutru" },
  { value: "rezervat", label: "Rezervat" },
  { value: "neanalizat", label: "Neanalizat" },
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

function filterItems(items, filterBy) {
  if (filterBy === "toate") return items;
  if (filterBy === "neanalizat") return items.filter((i) => !i.radar);
  return items.filter((i) => i.radar?.verdict === filterBy);
}

function countForFilter(items, filterValue) {
  if (filterValue === "toate") return items.length;
  if (filterValue === "neanalizat") return items.filter((i) => !i.radar).length;
  return items.filter((i) => i.radar?.verdict === filterValue).length;
}

function groupBySector(items) {
  const grupuri = {};
  for (const item of items) {
    const sector = item.sector || "Altele";
    if (!grupuri[sector]) grupuri[sector] = [];
    grupuri[sector].push(item);
  }
  return grupuri;
}

export default function Watchlist() {
  const [items, setItems] = useState(null);
  const [holdings, setHoldings] = useState({});
  const [marketNews, setMarketNews] = useState([]);
  const [marketNewsTotal, setMarketNewsTotal] = useState(0);
  const [showAllNews, setShowAllNews] = useState(false);
  const [earnings, setEarnings] = useState([]);
  const [earningsRecomandate, setEarningsRecomandate] = useState([]);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [sortBy, setSortBy] = useState("implicit");
  const [filterBy, setFilterBy] = useState("toate");
  const [showAllRows, setShowAllRows] = useState(false);
  const [analyzing, setAnalyzing] = useState(new Set());
  const [bulkAnalyzing, setBulkAnalyzing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  const [dailyPicks, setDailyPicks] = useState([]);
  const [dailyMover, setDailyMover] = useState(null);
  const [selectedDaily, setSelectedDaily] = useState(null); // simbolul coloanei selectate din grafic
  const [interese, setInterese] = useState([]);
  const [onboarding, setOnboarding] = useState(false);
  const [onboardError, setOnboardError] = useState("");
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [justAnalyzed, setJustAnalyzed] = useState(new Set());
  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const itemCountRef = useRef(0);

  // Ceas separat pentru eticheta "Actualizat acum X" — poll-ul de prețuri se
  // oprește la liste mari (> AUTO_REFRESH_MAX_ITEMS), dar eticheta trebuie să
  // rămână onestă și atunci, nu înghețată pe "chiar acum".
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  // Marchează un rând ca "tocmai analizat" pentru un puls vizual scurt —
  // folosit atât la analiza declanșată de user, cât și când poll-ul de 30s
  // prinde un rezultat nou venit din scheduler-ul de fundal.
  function flashJustAnalyzed(simboluri) {
    if (simboluri.length === 0) return;
    setJustAnalyzed((prev) => {
      const next = new Set(prev);
      simboluri.forEach((s) => next.add(s));
      return next;
    });
    setTimeout(() => {
      setJustAnalyzed((prev) => {
        const next = new Set(prev);
        simboluri.forEach((s) => next.delete(s));
        return next;
      });
    }, 2000);
  }

  function scrollToEarnings() {
    document.getElementById("earnings-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function load() {
    return api
      .getWatchlist()
      .then((data) => {
        setItems(data.items);
        itemCountRef.current = data.items.length;
        setLastLoadedAt(new Date());
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
      .then((data) => {
        setMarketNews(data.news);
        setMarketNewsTotal(data.total ?? data.news.length);
      })
      .catch(() => {});
    api
      .getEarningsCalendar()
      .then((data) => {
        setEarnings(data.earnings);
        setEarningsRecomandate(data.recomandate || []);
      })
      .catch(() => {});
    api
      .getDailyPicks()
      .then((data) => {
        setDailyPicks(data.picks);
        setDailyMover(data.mover || null);
      })
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
          setItems((prev) => {
            const prevMap = new Map((prev || []).map((it) => [it.simbol, it]));
            const noiAnalizate = data.items
              .filter((it) => it.radar && !prevMap.get(it.simbol)?.radar)
              .map((it) => it.simbol);
            flashJustAnalyzed(noiAnalizate);
            return data.items;
          });
          itemCountRef.current = data.items.length;
          setLastLoadedAt(new Date());
        })
        .catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, []);

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
      setOnboardingOpen(false);
      setInterese([]);
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
      flashJustAnalyzed([simbol]);
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
  if (!items) {
    return (
      <div className="portfolio-page dash">
        <div className="skeleton skeleton-ticker" />
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-card" />
        <div className="skeleton-rows">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-row-shape" />
          ))}
        </div>
      </div>
    );
  }

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

  const filteredItems = filterItems(items, filterBy);
  const sortedItems = sortItems(filteredItems, sortBy);
  const vizibileItems = showAllRows ? sortedItems : sortedItems.slice(0, DEFAULT_VISIBLE_ROWS);
  const grupatePeSector = sortBy === "sector" ? groupBySector(filteredItems) : null;

  function renderStockRow(item) {
    return (
      <li key={item.simbol} className={`stock-row ${justAnalyzed.has(item.simbol) ? "just-analyzed" : ""}`}>
        <Link to={`/stock/${item.simbol}`} className="watch-row-link">
          <StockLogo simbol={item.simbol} />
          <div>
            <strong>{item.simbol}</strong>
            {holdings[item.simbol] && (
              <span className="badge-chip" style={{ marginLeft: "0.5rem" }}>
                {holdings[item.simbol]} deținute
              </span>
            )}
            <div className="muted">{item.radar ? <VerdictTag verdict={item.radar.verdict} /> : "Neanalizat încă"}</div>
            {item.radar && factoriPrincipali(item.radar).length > 0 && (
              <div className="row-factors">{factoriPrincipali(item.radar).join(" · ")}</div>
            )}
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
        {item.radar ? (
          <Link to={`/stock/${item.simbol}`} className="view-analysis-button">
            Vezi analiza →
          </Link>
        ) : (
          <button className="analyze-button" onClick={() => analyzeOne(item.simbol)} disabled={analyzing.has(item.simbol)}>
            {analyzing.has(item.simbol) ? "Analizez..." : <><Zap size={13} className="ic" /> Analizează</>}
          </button>
        )}
        <button className="logout" onClick={() => handleRemove(item.simbol)}>
          Scoate
        </button>
      </li>
    );
  }

  // Graficul din Research zilnic: câștigurile descrescător în stânga,
  // pierderile descrescător (după amploare) în dreapta; click pe o coloană
  // aduce acțiunea alături, cu motivul și butoanele de acțiune.
  const dailyCastiguri = dailyPicks
    .filter((p) => p.variatieProcent >= 0)
    .sort((a, b) => b.variatieProcent - a.variatieProcent)
    .slice(0, 4);
  const dailyPierderi = dailyPicks
    .filter((p) => p.variatieProcent < 0)
    .sort((a, b) => a.variatieProcent - b.variatieProcent)
    .slice(0, 4);
  const dailyMaxAbs = Math.max(
    1,
    ...dailyCastiguri.map((p) => Math.abs(p.variatieProcent)),
    ...dailyPierderi.map((p) => Math.abs(p.variatieProcent))
  );
  const dailySelectat =
    (selectedDaily && dailyPicks.find((p) => p.simbol === selectedDaily)) ||
    dailyCastiguri[0] ||
    dailyPierderi[0] ||
    null;

  function renderDailyCol(p) {
    const inaltime = 14 + (Math.abs(p.variatieProcent) / dailyMaxAbs) * 58;
    const selectat = dailySelectat && dailySelectat.simbol === p.simbol;
    return (
      <button
        key={p.simbol}
        type="button"
        className={`daily-col ${selectat ? "daily-col-selected" : ""}`}
        onClick={() => setSelectedDaily(p.simbol)}
        aria-label={`${p.simbol}: ${p.variatieProcent.toFixed(1)}%`}
      >
        <span className={`daily-col-val ${p.variatieProcent >= 0 ? "gain-positive" : "gain-negative"}`}>
          {p.variatieProcent >= 0 ? "+" : ""}
          {p.variatieProcent.toFixed(1)}
        </span>
        <span
          className={`daily-col-bar ${p.variatieProcent >= 0 ? "daily-col-bar-pos" : "daily-col-bar-neg"}`}
          style={{ height: `${inaltime}px` }}
        />
        <span className="daily-col-tick">{p.simbol}</span>
      </button>
    );
  }

  return (
    <div className="portfolio-page dash">
      <TickerTape />

      <header className="dash-header dash-hero">
        <div className="dash-header-left">
          <RadarViz size={190} />
          <div>
            <div className="page-title-row">
              <h1 className="page-title">AI Stock Radar</h1>
              <span className="typewriter-badge">
                <TypewriterText phrases={TAGLINE_PHRASES} />
              </span>
            </div>
            <p className="cash">
              Urmărește acțiuni și primești context AI despre ele — nu recomandări de
              tranzacționare. <Link to="/metodologie" className="methodology-link">Cum calculăm scorul →</Link>
            </p>
          </div>
        </div>

        {items.length > 0 && analizateCount > 0 && (
          <div className="dash-stats">
            <div className="stat-tile">
              <span className="stat-value optimist">
                <AnimatedNumber value={optimisteCount} />
              </span>
              <span className="stat-label">optimiste</span>
            </div>
            <div className="stat-tile">
              <span className="stat-value neutru">
                <AnimatedNumber value={neutruCount} />
              </span>
              <span className="stat-label">neutre</span>
            </div>
            <div className="stat-tile">
              <span className="stat-value rezervat">
                <AnimatedNumber value={rezervateCount} />
              </span>
              <span className="stat-label">rezervate</span>
            </div>
            <button type="button" className="stat-tile stat-tile-link" onClick={scrollToEarnings}>
              <span className="stat-value">
                <AnimatedNumber value={raporteazaCurandCount} />
              </span>
              <span className="stat-label">raportează în 7 zile →</span>
            </button>
          </div>
        )}
      </header>

      {items.length > 0 && analizateCount === 0 && (
        <p className="dash-pending">
          Analiza AI pornește automat pentru cele {items.length} acțiuni urmărite — revino în câteva minute pentru primele scoruri.
        </p>
      )}
      {neanalizateCount > 0 && analizateCount > 0 && (
        <p className="dash-pending">{neanalizateCount} încă în curs de analiză automată</p>
      )}

      <div className="dash-grid">
        <main className="dash-main">
          <section className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Caută &amp; adaugă</p>
                <h2>Adaugă o acțiune</h2>
              </div>
            </div>
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
            {searchError && (
              <div className="error">
                {searchError}
                {searchError.includes("Premium") && (
                  <>
                    {" "}
                    <Link to="/premium" className="methodology-link">
                      Vezi ce include Premium →
                    </Link>
                  </>
                )}
              </div>
            )}

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
                    <button className="add-watchlist-button" onClick={() => handleAdd(r.simbol)}>
                      + Watchlist
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <p className="search-hint muted">
              Sfat: un radar bun are 5-10 acțiuni alese de tine — mai puțin zgomot, context mai
              relevant. Poți porni și cu „Analizează pe interese".
            </p>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Portofoliul de urmărire</p>
                <h2><ClipboardList size={16} className="h2-ic" /> Watchlist-ul tău</h2>
                {lastLoadedAt && <p className="freshness-note">Actualizat {formatRelativeTime(lastLoadedAt, now)}</p>}
              </div>
              <div className="watchlist-header-actions">
                {items.length > 0 && (
                  <button type="button" className="onboarding-toggle-button" onClick={() => setOnboardingOpen((v) => !v)}>
                    <Target size={13} className="ic" /> Analizează pe interese
                  </button>
                )}
                {neanalizateCount > 0 && (
                  <button className="analyze-all-button" onClick={handleAnalyzeAll} disabled={bulkAnalyzing}>
                    {bulkAnalyzing && (
                      <span className="analyze-all-progress" style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }} />
                    )}
                    <span className="analyze-all-label">
                      {bulkAnalyzing ? `Analizez ${bulkProgress.done}/${bulkProgress.total}...` : <><Zap size={13} className="ic" /> Analizează tot ({neanalizateCount})</>}
                    </span>
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

            {(items.length === 0 || onboardingOpen) && (
              <div className="onboarding-box">
                <p className="empty">Alege ce te interesează și îți construim un watchlist {items.length === 0 ? "de start" : "nou"}:</p>
                <div className="onboarding-chips">
                  {INTEREST_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={interese.includes(opt.value)}
                      className={`onboarding-chip ${interese.includes(opt.value) ? "active" : ""}`}
                      onClick={() => toggleInteres(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {onboardError && <div className="error">{onboardError}</div>}
                <div className="onboarding-actions">
                  <button className="why-button" onClick={handleOnboard} disabled={interese.length === 0 || onboarding}>
                    {onboarding ? "Construiesc watchlist-ul..." : "Construiește-mi watchlist-ul"}
                  </button>
                  {items.length > 0 && (
                    <button className="logout" onClick={() => setOnboardingOpen(false)} disabled={onboarding}>
                      Renunță
                    </button>
                  )}
                </div>
              </div>
            )}

            {items.length === 0 ? null : (
              <>
                <div className="filter-chips">
                  {FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={filterBy === opt.value}
                      className={`filter-chip ${filterBy === opt.value ? "active" : ""}`}
                      onClick={() => {
                        setFilterBy(opt.value);
                        setShowAllRows(false);
                      }}
                    >
                      {opt.label} ({countForFilter(items, opt.value)})
                    </button>
                  ))}
                </div>

                {filteredItems.length === 0 ? (
                  <p className="empty">Nicio acțiune nu se potrivește acestui filtru.</p>
                ) : grupatePeSector ? (
                  Object.entries(grupatePeSector).map(([sector, grup]) => (
                    <div key={sector} className="sector-group">
                      <h3 className="sector-group-title">
                        {sector} <span className="muted">({grup.length})</span>
                      </h3>
                      <ul className="stock-list">{grup.map(renderStockRow)}</ul>
                    </div>
                  ))
                ) : (
                  <>
                    <ul className="stock-list">{vizibileItems.map(renderStockRow)}</ul>
                    {sortedItems.length > DEFAULT_VISIBLE_ROWS && !showAllRows && (
                      <button className="show-more-button" onClick={() => setShowAllRows(true)}>
                        Arată toate ({sortedItems.length})
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </section>
        </main>

        <aside className="dash-side">
          <section className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Descoperă</p>
                <h2><Compass size={16} className="h2-ic" /> Research zilnic</h2>
              </div>
            </div>
            <p className="tab-subtitle">Recomandări AI din afara watchlist-ului tău, pe baza mișcărilor de azi.</p>
            {dailyPicks.length === 0 ? (
              <div className="daily-empty">
                {dailyMover && (
                  <>
                    <p className="daily-empty-label">Cel mai mare mover al zilei:</p>
                    <ul className="stock-list">
                      <li className="stock-row">
                        <div className="stock-row-left">
                          <StockLogo simbol={dailyMover.simbol} />
                          <div>
                            <strong>{dailyMover.simbol}</strong>
                            <div className="muted">{dailyMover.nume}</div>
                          </div>
                        </div>
                        <div className="stock-right">
                          <div className={dailyMover.variatieProcent >= 0 ? "gain-positive" : "gain-negative"}>
                            {dailyMover.variatieProcent >= 0 ? "+" : ""}
                            {dailyMover.variatieProcent.toFixed(1)}%
                          </div>
                        </div>
                        <button className="add-watchlist-button" onClick={() => handleAdd(dailyMover.simbol)}>
                          +
                        </button>
                      </li>
                    </ul>
                  </>
                )}
                <p className="daily-lesson">
                  <Lightbulb size={14} className="ic" /> {MICRO_LESSONS[Math.floor(Date.now() / 86400000) % MICRO_LESSONS.length]}
                </p>
              </div>
            ) : (
              <>
                <div className="daily-chart">
                  <div className="daily-chart-group">
                    <span className="daily-chart-group-label gain-positive">Creșteri</span>
                    <div className="daily-chart-cols">
                      {dailyCastiguri.map((p) => renderDailyCol(p))}
                      {dailyCastiguri.length === 0 && <span className="daily-chart-none">—</span>}
                    </div>
                  </div>
                  <div className="daily-chart-divider" />
                  <div className="daily-chart-group">
                    <span className="daily-chart-group-label gain-negative">Scăderi</span>
                    <div className="daily-chart-cols">
                      {dailyPierderi.map((p) => renderDailyCol(p))}
                      {dailyPierderi.length === 0 && <span className="daily-chart-none">—</span>}
                    </div>
                  </div>
                </div>
                {dailySelectat && (
                  <div className="daily-selected">
                    <div className="stock-row-left">
                      <StockLogo simbol={dailySelectat.simbol} />
                      <div>
                        <strong>{dailySelectat.simbol}</strong>
                        <div className="muted">{dailySelectat.nume}</div>
                      </div>
                      <div
                        className={
                          dailySelectat.variatieProcent >= 0
                            ? "gain-positive daily-selected-var"
                            : "gain-negative daily-selected-var"
                        }
                      >
                        {dailySelectat.variatieProcent >= 0 ? "+" : ""}
                        {dailySelectat.variatieProcent.toFixed(1)}%
                      </div>
                    </div>
                    <p className="daily-selected-motiv">{dailySelectat.motiv}</p>
                    <div className="daily-selected-actions">
                      <button
                        className="add-watchlist-button"
                        onClick={() => handleAddFromDaily(dailySelectat.simbol)}
                      >
                        + Urmărește
                      </button>
                      <Link to={`/stock/${dailySelectat.simbol}`} className="view-analysis-button daily-selected-analysis">
                        Vezi analiza →
                      </Link>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Contextul zilei</p>
                <h2><Newspaper size={16} className="h2-ic" /> Știri relevante</h2>
              </div>
            </div>
            {marketNews.length === 0 ? (
              <p className="empty">Nicio știre relevantă momentan.</p>
            ) : (
              <>
                <div className="hero-news">
                  {(showAllNews ? marketNews : marketNews.slice(0, 3)).map((n) => (
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
                </div>
                {marketNews.length > 3 && (
                  <button className="show-more-button" onClick={() => setShowAllNews((v) => !v)}>
                    {showAllNews ? "Restrânge ↑" : `Arată toate (${marketNews.length})`}
                  </button>
                )}
                {marketNewsTotal > marketNews.length && (
                  <Link to="/premium" className="show-more-button news-premium-teaser">
                    <Lock size={12} className="ic" /> +{marketNewsTotal - marketNews.length} știri analizate azi, cu Premium →
                  </Link>
                )}
              </>
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Scoruri în mișcare</p>
                <h2><Activity size={16} className="h2-ic" /> Ce s-a schimbat</h2>
              </div>
            </div>
            <p className="tab-subtitle">Scorul AI (nu prețul) al acțiunilor tale, schimbat recent.</p>
            {briefItems.length === 0 ? (
              <p className="empty">Niciun scor AI nu s-a schimbat recent.</p>
            ) : (
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
            )}
          </section>

          <section className="panel" id="earnings-panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Calendar</p>
                <h2><CalendarDays size={16} className="h2-ic" /> Raportări apropiate</h2>
              </div>
            </div>
            {earnings.length === 0 && earningsRecomandate.length > 0 ? (
              <>
                <p className="tab-subtitle">
                  Nicio raportare apropiată în lista ta — dar acestea raportează curând:
                </p>
                <ul className="stock-list">
                  {earningsRecomandate.map((e) => (
                    <li key={`${e.simbol}-${e.data}`} className="stock-row">
                      <div className="stock-row-left">
                        <StockLogo simbol={e.simbol} />
                        <div>
                          <strong>{e.simbol}</strong>
                          <div className="muted">
                            Raportează {formatZileRamase(e.data)}
                            {e.moment && MOMENT_LABEL[e.moment] ? ` · ${MOMENT_LABEL[e.moment]}` : ""}
                          </div>
                        </div>
                      </div>
                      <button
                        className="add-watchlist-button"
                        onClick={async () => {
                          await handleAdd(e.simbol);
                          // Acțiunea abia adăugată are raportare apropiată — recitim
                          // calendarul ca să treacă din "recomandate" în lista reală.
                          const data = await api.getEarningsCalendar();
                          setEarnings(data.earnings);
                          setEarningsRecomandate(data.recomandate || []);
                        }}
                      >
                        +
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : earnings.length === 0 ? (
              <p className="empty">Nicio raportare apropiată printre acțiunile urmărite.</p>
            ) : (
              <ul className="stock-list">
                {earnings.slice(0, 5).map((e) => (
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
            )}
          </section>
        </aside>
      </div>

      <ToolsPro />

      <section className="dash-personas">
        <h2 className="dash-personas-title">Gândit pentru oameni ca tine</h2>
        <PersonaCards />
      </section>

      <Disclaimer />
    </div>
  );
}
