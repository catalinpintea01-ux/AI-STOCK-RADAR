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
import RadarSweep from "../components/RadarSweep.jsx";
import ThemeCards from "../components/ThemeCards.jsx";
import VerdictTag from "../components/VerdictTag.jsx";
import LivePrice from "../components/LivePrice.jsx";
import RadarPrint from "../components/RadarPrint.jsx";
import HartaPietei from "../components/HartaPietei.jsx";
import { Zap, Target, ClipboardList, Compass, Newspaper, Activity, CalendarDays, Lightbulb, Lock, Sunrise } from "lucide-react";
import { useLang } from "../i18n/index.jsx";
import { useTraduse } from "../i18n/useTraduse.js";



// Cei mai marcanți 2 factori din spatele scorului, derivați determinist din
// sub-scoruri — un "88" fără explicație nu inspiră încredere. Pragurile
// oglindesc verdictul din radar.js: ≥60 punct forte, ≤40 punct slab.
function factoriPrincipali(radar, t) {
  const factori = [
    { val: radar.scorAnalist, pozitiv: t("dash.factori.analistiPoz"), negativ: t("dash.factori.analistiNeg") },
    { val: radar.scorMomentum, pozitiv: t("dash.factori.momentumPoz"), negativ: t("dash.factori.momentumNeg") },
    { val: radar.scorFundamental, pozitiv: t("dash.factori.fundPoz"), negativ: t("dash.factori.fundNeg") },
    { val: 100 - radar.scorRisc, pozitiv: t("dash.factori.riscPoz"), negativ: t("dash.factori.riscNeg") },
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

function zileRamase(dataIso) {
  const azi = new Date();
  azi.setHours(0, 0, 0, 0);
  const data = new Date(dataIso);
  return Math.round((data - azi) / (24 * 60 * 60 * 1000));
}

function formatZileRamase(dataIso, t) {
  const zile = zileRamase(dataIso);
  if (zile === 0) return t("dash.zAzi");
  if (zile === 1) return t("dash.zMaine");
  return t("dash.zInZile", { n: zile });
}

function formatRelativeTime(date, now, t) {
  const secunde = Math.round((now.getTime() - date.getTime()) / 1000);
  if (secunde < 45) return t("dash.chiarAcum");
  const minute = Math.round(secunde / 60);
  if (minute < 60) return t("dash.acumMin", { n: minute });
  const ore = Math.round(minute / 60);
  return t("dash.acumOre", { n: ore });
}

const INTEREST_OPTIONS = ["tehnologie", "energie", "financiar", "sanatate", "consum", "dividende"];

const SORT_OPTIONS = ["implicit", "scor", "variatie", "alfabetic", "sector"];

const FILTER_OPTIONS = ["toate", "optimist", "neutru", "rezervat", "neanalizat"];

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
  const { t, locale } = useLang();
  const momentLabel = {
    bmo: t("dash.moment.bmo"),
    amc: t("dash.moment.amc"),
    dmh: t("dash.moment.dmh"),
  };
  const lectii = t("dash.lectii");
  const numeSector = (s) => {
    const v = t("sectoare." + s);
    return typeof v === "string" && v.startsWith("sectoare.") ? s : v;
  };

  const ttBrief = useTraduse({
    eyebrow: "AI Daily Brief",
    titlu: "Piața pe scurt, în această dimineață",
    mentionate: "În radar azi:",
  });

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
  const [daily, setDaily] = useState(null); // { cresteri, scaderi, premium }
  const [dailyTab, setDailyTab] = useState("piata");
  const [selectedDaily, setSelectedDaily] = useState(null); // simbolul coloanei selectate din grafic
  const [vix, setVix] = useState(null);
  const [brief, setBrief] = useState(null); // { zi, text, simboluri }
  const [universSugestii, setUniversSugestii] = useState([]);
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
      .getVix()
      .then(setVix)
      .catch(() => {});
    api
      .getBrief()
      .then(setBrief)
      .catch(() => {}); // fără brief nu se întâmplă nimic — cardul pur și simplu nu apare
    api
      .getTicker()
      .then((data) => {
        const actiuni = (data.ticker || []).filter((t) => !["SPY", "DIA", "QQQ"].includes(t.simbol));
        setUniversSugestii((prev) => {
          const existente = new Set(prev.map((p) => p.simbol));
          return [...prev, ...actiuni.filter((a) => !existente.has(a.simbol))];
        });
      })
      .catch(() => {});
    api
      .getDailyPicks()
      .then((data) => {
        setDaily(data);
        const toate = [...(data.cresteri || []), ...(data.scaderi || [])];
        setUniversSugestii((prev) => {
          const existente = new Set(prev.map((p) => p.simbol));
          return [...prev, ...toate.filter((p) => !existente.has(p.simbol))];
        });
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

  if (error) return <div className="page-message">{t("dash.eroare")} {error}</div>;
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
                {holdings[item.simbol]} {t("dash.detinute")}
              </span>
            )}
            <div className="muted">{item.radar ? <VerdictTag verdict={item.radar.verdict} /> : t("dash.neanalizat")}</div>
            {item.radar && factoriPrincipali(item.radar, t).length > 0 && (
              <div className="row-factors">{factoriPrincipali(item.radar, t).join(" · ")}</div>
            )}
          </div>
          {item.radar && <ScoreRing score={item.radar.scorCompozit} verdict={item.radar.verdict} />}
          <Sparkline puncte={item.istoricPret} />
          {item.pret !== null && (
            <div className="stock-right">
              <div><LivePrice value={item.pret} /></div>
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
            {t("dash.veziAnaliza")}
          </Link>
        ) : (
          <button className="analyze-button" onClick={() => analyzeOne(item.simbol)} disabled={analyzing.has(item.simbol)}>
            {analyzing.has(item.simbol) ? t("dash.analizez") : <><Zap size={13} className="ic" /> {t("dash.analizeaza")}</>}
          </button>
        )}
        <button className="logout" onClick={() => handleRemove(item.simbol)}>
          {t("dash.scoate")}
        </button>
      </li>
    );
  }

  // Research zilnic v2: mișcările din watchlist (client-side, cotațiile sunt
  // deja încărcate) + mișcările din toată piața (server, 2+2 gratuit / 5+5
  // Premium). Barele de amplitudine sunt relative la maximul grupului afișat.
  const wlMiscari = items.filter((i) => typeof i.variatieProcent === "number");
  const wlCresteri = wlMiscari
    .filter((i) => i.variatieProcent >= 0)
    .sort((a, b) => b.variatieProcent - a.variatieProcent)
    .slice(0, 5);
  const wlScaderi = wlMiscari
    .filter((i) => i.variatieProcent < 0)
    .sort((a, b) => a.variatieProcent - b.variatieProcent)
    .slice(0, 5);

  const pCresteri = daily?.cresteri || [];
  const pScaderi = daily?.scaderi || [];
  const dailySelectat =
    (selectedDaily && [...pCresteri, ...pScaderi].find((p) => p.simbol === selectedDaily)) ||
    pCresteri[0] ||
    pScaderi[0] ||
    null;

  // Când watchlist-ul are puține rânduri (plan gratuit), spațiul de sub listă
  // se umple cu sugestii de adăugare — utilizatorul are mereu un pas următor
  // (limita de 3 → puntea spre Premium).
  const simboluriUrmarite = new Set((items || []).map((i) => i.simbol));
  const sugestiiRadar =
    items && items.length > 0 && items.length < 6
      ? universSugestii
          .filter((s) => !simboluriUrmarite.has(s.simbol))
          .sort((a, b) => Math.abs(b.variatieProcent ?? 0) - Math.abs(a.variatieProcent ?? 0))
          .slice(0, 6)
      : [];


  return (
    <div className="portfolio-page dash">
      <TickerTape />

      <header className="mega-hero dash-hero dash-mega">
        <RadarSweep />
        <div className="hero-topright">
          <span className="hero-data">
            {new Date().toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" })}
          </span>
          {vix && (
            <Link to="/vix" className="vix-chip" title="Ce este indicele VIX?">
              VIX {vix.valoare.toFixed(1)}
              {vix.variatie !== null && (
                <span className={vix.variatie >= 0 ? "vix-chip-up" : "vix-chip-down"}>
                  {vix.variatie >= 0 ? "▲" : "▼"}{Math.abs(vix.variatie).toFixed(1)}%
                </span>
              )}
            </Link>
          )}
        </div>
        <div className="mega-hero-content dash-mega-content">
          <h1 className="mega-headline dash-mega-headline">
            AI Stock <span className="mega-headline-accent">Radar</span>
          </h1>
          <span className="typewriter-badge">
            <TypewriterText phrases={t("dash.taglines")} />
          </span>
          <p className="mega-sub dash-mega-sub">
            {t("dash.sub")} <Link to="/metodologie" className="methodology-link">{t("dash.cumCalculam")}</Link>
          </p>

        {items.length > 0 && analizateCount > 0 && (
          <div className="dash-stats">
            <div className="stat-tile">
              <span className="stat-value optimist">
                <AnimatedNumber value={optimisteCount} />
              </span>
              <span className="stat-label">{t("landing.optimiste")}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-value neutru">
                <AnimatedNumber value={neutruCount} />
              </span>
              <span className="stat-label">{t("landing.neutre")}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-value rezervat">
                <AnimatedNumber value={rezervateCount} />
              </span>
              <span className="stat-label">{t("landing.rezervate")}</span>
            </div>
            <button type="button" className="stat-tile stat-tile-link" onClick={scrollToEarnings}>
              <span className="stat-value">
                <AnimatedNumber value={raporteazaCurandCount} />
              </span>
              <span className="stat-label">{t("dash.raporteaza7")}</span>
            </button>
          </div>
        )}
        </div>
      </header>

      {brief && brief.text && (
        <section className="panel brief-panel">
          <div className="brief-head">
            <span className="brief-icon"><Sunrise size={18} /></span>
            <div>
              <p className="eyebrow">{ttBrief("eyebrow")}</p>
              <h2 className="brief-titlu">{ttBrief("titlu")}</h2>
            </div>
            <span className="brief-data">
              {new Date(brief.zi).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}
            </span>
          </div>
          <p className="brief-text">{brief.text}</p>
          {brief.simboluri?.length > 0 && (
            <div className="brief-simboluri">
              <span className="muted">{ttBrief("mentionate")}</span>
              {brief.simboluri.map((s) => (
                <Link key={s} to={`/stock/${s}`} className="brief-chip">
                  <StockLogo simbol={s} size={18} />
                  {s}
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {items.length > 0 && analizateCount === 0 && (
        <p className="dash-pending">{t("dash.pendingToate", { n: items.length })}</p>
      )}
      {neanalizateCount > 0 && analizateCount > 0 && (
        <p className="dash-pending">{t("dash.pendingPartial", { n: neanalizateCount })}</p>
      )}

      <div className="dash-grid">
        <main className="dash-main">
          <section className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">{t("dash.cautaAdauga")}</p>
                <h2>{t("dash.adaugaActiune")}</h2>
              </div>
            </div>
            <form className="search-form" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder={t("dash.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" disabled={searchLoading}>
                {searchLoading ? t("dash.caut") : t("dash.cauta")}
              </button>
            </form>
            {searchError && (
              <div className="error">
                {searchError}
                {searchError.includes("Premium") && (
                  <>
                    {" "}
                    <Link to="/premium" className="methodology-link">
                      {t("dash.veziPremium")}
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
                      {t("dash.plusWatchlist")}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <p className="search-hint muted">{t("dash.sfat")}</p>
          </section>

          <section className="panel workspace-panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow workspace-eyebrow">{t("dash.spatiulTau")}</p>
                <h2><ClipboardList size={16} className="h2-ic" /> {t("dash.watchlistulTau")}</h2>
                {lastLoadedAt && <p className="freshness-note">{t("dash.actualizat", { timp: formatRelativeTime(lastLoadedAt, now, t) })}</p>}
              </div>
              <div className="watchlist-header-actions">
                {items.length > 0 && (
                  <button type="button" className="onboarding-toggle-button" onClick={() => setOnboardingOpen((v) => !v)}>
                    <Target size={13} className="ic" /> {t("dash.analizeazaInterese")}
                  </button>
                )}
                {neanalizateCount > 0 && (
                  <button className="analyze-all-button" onClick={handleAnalyzeAll} disabled={bulkAnalyzing}>
                    {bulkAnalyzing && (
                      <span className="analyze-all-progress" style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }} />
                    )}
                    <span className="analyze-all-label">
                      {bulkAnalyzing ? t("dash.analizezProgres", { done: bulkProgress.done, total: bulkProgress.total }) : <><Zap size={13} className="ic" /> {t("dash.analizeazaTot", { n: neanalizateCount })}</>}
                    </span>
                  </button>
                )}
                {items.length > 1 && (
                  <label className="sort-control">
                    {t("dash.sorteaza")}{" "}
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {t(`dash.sortare.${opt}`)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            </div>

            {(items.length === 0 || onboardingOpen) && (
              <div className="onboarding-box">
                {items.length === 0 && (
                  <img src="/mascota/radar.png" alt="" className="mascota mascota-empty" loading="lazy" />
                )}
                <p className="empty">{items.length === 0 ? t("dash.onboardingStart") : t("dash.onboardingNou")}</p>
                <div className="onboarding-chips">
                  {INTEREST_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      aria-pressed={interese.includes(opt)}
                      className={`onboarding-chip ${interese.includes(opt) ? "active" : ""}`}
                      onClick={() => toggleInteres(opt)}
                    >
                      {t(`dash.interese.${opt}`)}
                    </button>
                  ))}
                </div>
                {onboardError && <div className="error">{onboardError}</div>}
                <div className="onboarding-actions">
                  <button className="why-button" onClick={handleOnboard} disabled={interese.length === 0 || onboarding}>
                    {onboarding ? t("dash.construiesc") : t("dash.construieste")}
                  </button>
                  {items.length > 0 && (
                    <button className="logout" onClick={() => setOnboardingOpen(false)} disabled={onboarding}>
                      {t("dash.renunta")}
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
                      key={opt}
                      type="button"
                      aria-pressed={filterBy === opt}
                      className={`filter-chip ${filterBy === opt ? "active" : ""}`}
                      onClick={() => {
                        setFilterBy(opt);
                        setShowAllRows(false);
                      }}
                    >
                      {t(`dash.filtru.${opt}`)} ({countForFilter(items, opt)})
                    </button>
                  ))}
                </div>

                {/* Zona listei are înălțime plafonată cu scroll intern pe desktop —
                    înălțimea coloanei nu mai depinde de câte acțiuni urmărești,
                    deci coloanele rămân mereu aliniate, fără goluri. */}
                <div className="workspace-scroll">
                {filteredItems.length === 0 ? (
                  <p className="empty">{t("dash.nicioPotrivire")}</p>
                ) : grupatePeSector ? (
                  Object.entries(grupatePeSector).map(([sector, grup]) => (
                    <div key={sector} className="sector-group">
                      <h3 className="sector-group-title">
                        {numeSector(sector)} <span className="muted">({grup.length})</span>
                      </h3>
                      <ul className="stock-list">{grup.map(renderStockRow)}</ul>
                    </div>
                  ))
                ) : (
                  <>
                    <ul className="stock-list">{vizibileItems.map(renderStockRow)}</ul>
                    {sortedItems.length > DEFAULT_VISIBLE_ROWS && !showAllRows && (
                      <button className="show-more-button" onClick={() => setShowAllRows(true)}>
                        {t("dash.arataToate", { n: sortedItems.length })}
                      </button>
                    )}
                    {items.length > 0 && items.length < 6 && sugestiiRadar.length === 0 && (
                      <div className="fill-suggestions">
                        <p className="eyebrow workspace-eyebrow">{t("dash.idei")}</p>
                        <div className="suggestion-grid">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="suggestion-card">
                              <div className="sk sk-avatar" />
                              <div className="suggestion-info">
                                <div className="sk" style={{ width: "40%", height: 11, borderRadius: 6 }} />
                                <div className="sk" style={{ width: "70%", height: 8, borderRadius: 6, marginTop: 5 }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {sugestiiRadar.length > 0 && (
                      <div className="fill-suggestions">
                        <p className="eyebrow workspace-eyebrow">{t("dash.idei")}</p>
                        <div className="suggestion-grid">
                          {sugestiiRadar.map((sug) => (
                            <div key={sug.simbol} className="suggestion-card">
                              <StockLogo simbol={sug.simbol} />
                              <div className="suggestion-info">
                                <strong>{sug.simbol}</strong>
                                <span className="muted">{sug.nume}</span>
                              </div>
                              <span className={sug.variatieProcent >= 0 ? "gain-positive" : "gain-negative"}>
                                {sug.variatieProcent >= 0 ? "+" : ""}
                                {(sug.variatieProcent ?? 0).toFixed(1)}%
                              </span>
                              <button className="add-watchlist-button" onClick={() => handleAdd(sug.simbol)}>
                                +
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                </div>
              </>
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">{t("dash.contextulZilei")}</p>
                <h2><Newspaper size={16} className="h2-ic" /> {t("dash.stiriRelevante")}</h2>
              </div>
            </div>
            {marketNews.length === 0 ? (
              <p className="empty">{t("dash.nicioStire")}</p>
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
                        <span className="hero-news-source">{n.sursa} · {t("dash.azi")}</span>
                        <h3 className="hero-news-headline">{n.titluAI}</h3>
                        {(n.simbol || n.sentiment) && (
                          <span className="hero-news-meta">
                            {n.simbol && <em className="hero-news-chip">{n.simbol}</em>}
                            {n.sentiment && (
                              <em className="hero-news-chip hero-news-chip-verdict">
                                {t(`verdict.${n.sentiment}`)}
                              </em>
                            )}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
                {marketNews.length > 3 && (
                  <button className="show-more-button" onClick={() => setShowAllNews((v) => !v)}>
                    {showAllNews ? t("dash.restrange") : t("dash.arataToate", { n: marketNews.length })}
                  </button>
                )}
                {marketNewsTotal > marketNews.length && (
                  <Link to="/premium" className="show-more-button news-premium-teaser">
                    <Lock size={12} className="ic" /> {t("dash.teaser", { n: marketNewsTotal - marketNews.length })}
                  </Link>
                )}
              </>
            )}
          </section>
        </main>

        <aside className="dash-side">
          <section className="panel research-panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">{t("dash.descopera")}</p>
                <h2><Compass size={16} className="h2-ic" /> {t("dash.researchZilnic")}</h2>
              </div>
            </div>
            <p className="tab-subtitle">{t("dash.researchSub")}</p>

            <div className="research-tabs">
              <button
                type="button"
                aria-pressed={dailyTab === "piata"}
                className={dailyTab === "piata" ? "active" : ""}
                onClick={() => setDailyTab("piata")}
              >
                {t("dash.researchPiata")}
              </button>
              <button
                type="button"
                aria-pressed={dailyTab === "watchlist"}
                className={dailyTab === "watchlist" ? "active" : ""}
                onClick={() => setDailyTab("watchlist")}
              >
                Watchlist
              </button>
            </div>

            {dailyTab === "watchlist" ? (
              wlCresteri.length + wlScaderi.length === 0 ? (
                <p className="empty">{t("dash.researchWlGol")}</p>
              ) : (
                <div className="research-groups">
                  {[
                    { lista: wlCresteri, eticheta: t("dash.cresteri"), poz: true },
                    { lista: wlScaderi, eticheta: t("dash.scaderi"), poz: false },
                  ].map(
                    (grup) =>
                      grup.lista.length > 0 && (
                        <div key={grup.eticheta} className="research-group">
                          <span className={`research-group-label ${grup.poz ? "gain-positive" : "gain-negative"}`}>
                            {grup.eticheta}
                          </span>
                          {grup.lista.map((it) => {
                            const maxAbs = Math.max(...grup.lista.map((x) => Math.abs(x.variatieProcent)), 0.1);
                            return (
                              <Link key={it.simbol} to={`/stock/${it.simbol}`} className="research-row">
                                <StockLogo simbol={it.simbol} size={22} />
                                <strong>{it.simbol}</strong>
                                <span className="research-row-bar">
                                  <i
                                    className={grup.poz ? "research-bar-pos" : "research-bar-neg"}
                                    style={{ width: `${(Math.abs(it.variatieProcent) / maxAbs) * 100}%` }}
                                  />
                                </span>
                                <span className={grup.poz ? "gain-positive" : "gain-negative"}>
                                  {grup.poz ? "+" : ""}
                                  {it.variatieProcent.toFixed(1)}%
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      )
                  )}
                </div>
              )
            ) : daily === null ? (
              <div className="skeleton-rows">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton skeleton-row-shape" />
                ))}
              </div>
            ) : pCresteri.length + pScaderi.length === 0 ? (
              <p className="daily-lesson">
                <Lightbulb size={14} className="ic" /> {lectii[Math.floor(Date.now() / 86400000) % lectii.length]}
              </p>
            ) : (
              <>
                <div className="research-groups">
                  {[
                    { lista: pCresteri, eticheta: t("dash.cresteri"), poz: true },
                    { lista: pScaderi, eticheta: t("dash.scaderi"), poz: false },
                  ].map(
                    (grup) =>
                      grup.lista.length > 0 && (
                        <div key={grup.eticheta} className="research-group">
                          <span className={`research-group-label ${grup.poz ? "gain-positive" : "gain-negative"}`}>
                            {grup.eticheta}
                          </span>
                          {grup.lista.map((it) => {
                            const maxAbs = Math.max(...grup.lista.map((x) => Math.abs(x.variatieProcent)), 0.1);
                            const activ = dailySelectat && dailySelectat.simbol === it.simbol;
                            return (
                              <button
                                key={it.simbol}
                                type="button"
                                className={`research-row ${activ ? "research-row-activ" : ""}`}
                                onClick={() => setSelectedDaily(it.simbol)}
                              >
                                <StockLogo simbol={it.simbol} size={22} />
                                <strong>{it.simbol}</strong>
                                <span className="research-row-bar">
                                  <i
                                    className={grup.poz ? "research-bar-pos" : "research-bar-neg"}
                                    style={{ width: `${(Math.abs(it.variatieProcent) / maxAbs) * 100}%` }}
                                  />
                                </span>
                                <span className={grup.poz ? "gain-positive" : "gain-negative"}>
                                  {grup.poz ? "+" : ""}
                                  {it.variatieProcent.toFixed(1)}%
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )
                  )}
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
                      {!simboluriUrmarite.has(dailySelectat.simbol) && (
                        <button
                          className="add-watchlist-button"
                          onClick={() => handleAddFromDaily(dailySelectat.simbol)}
                        >
                          {t("dash.urmareste")}
                        </button>
                      )}
                      <Link to={`/stock/${dailySelectat.simbol}`} className="view-analysis-button daily-selected-analysis">
                        {t("dash.veziAnaliza")}
                      </Link>
                    </div>
                  </div>
                )}

                {daily && !daily.premium && (
                  <Link to="/premium" className="show-more-button news-premium-teaser">
                    <Lock size={12} className="ic" /> {t("dash.veziPremium")}
                  </Link>
                )}
              </>
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">{t("dash.scoruriMiscare")}</p>
                <h2><Activity size={16} className="h2-ic" /> {t("dash.ceSaSchimbat")}</h2>
              </div>
            </div>
            <p className="tab-subtitle">{t("dash.schimbSub")}</p>
            {briefItems.length === 0 ? (
              <p className="empty">{t("dash.nicioSchimbare")}</p>
            ) : (
              <ul className="stock-list">
                {briefItems.map((item) => (
                  <li key={item.simbol} className="stock-row">
                    <Link to={`/stock/${item.simbol}`} className="watch-row-link">
                      <StockLogo simbol={item.simbol} />
                      <div>
                        <strong>{item.simbol}</strong>
                        <div className="muted">
                          {t("dash.scorAi")} {item.schimbare.scorAnterior} → {item.radar.scorCompozit}
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

          {analizateCount > 0 && (() => {
            // Amprenta watchlist-ului: media sub-scorurilor acțiunilor deja
            // analizate — forma agregată a întregii liste, dintr-o privire.
            const analizate = items.filter((i) => i.radar);
            const medie = (extrage) =>
              Math.round(analizate.reduce((s, i) => s + extrage(i.radar), 0) / analizate.length);
            return (
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <p className="eyebrow">{t("dash.spatiulTau")}</p>
                    <h2>{t("screens.amprenta")}</h2>
                  </div>
                </div>
                <p className="tab-subtitle">{t("screens.amprentaSub")}</p>
                <div className="radar-print-wrap">
                  <RadarPrint
                    analisti={medie((r) => r.scorAnalist)}
                    momentum={medie((r) => r.scorMomentum)}
                    fundamental={medie((r) => r.scorFundamental)}
                    risc={medie((r) => r.scorRisc)}
                  />
                </div>
              </section>
            );
          })()}

          <section className="panel mascota-panel">
            <img src="/mascota/radar.png" alt="" className="mascota mascota-sidebar" loading="lazy" />
            <div>
              <p className="mascota-panel-title">{t("dash.mascotaTitlu")}</p>
              <p className="muted mascota-panel-text">{t("dash.mascotaText")}</p>
              <Link to="/metodologie" className="methodology-link">
                {t("dash.cumCalculam")}
              </Link>
            </div>
          </section>
        </aside>
      </div>

      <HartaPietei />

      <section className="panel earnings-wide" id="earnings-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">{t("dash.calendar")}</p>
            <h2><CalendarDays size={16} className="h2-ic" /> {t("dash.raportari")}</h2>
          </div>
        </div>
        {earnings.length === 0 && earningsRecomandate.length > 0 ? (
          <>
            <p className="tab-subtitle">{t("dash.raportareRecomandate")}</p>
            <ul className="stock-list earnings-grid">
              {earningsRecomandate.map((e) => (
                <li key={`${e.simbol}-${e.data}`} className="stock-row">
                  <div className="stock-row-left">
                    <StockLogo simbol={e.simbol} />
                    <div>
                      <strong>{e.simbol}</strong>
                      <div className="muted">
                        {t("dash.raporteaza")} {formatZileRamase(e.data, t)}
                        {e.moment && momentLabel[e.moment] ? ` · ${momentLabel[e.moment]}` : ""}
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
          <p className="empty">{t("dash.nicioRaportare")}</p>
        ) : (
          <ul className="stock-list earnings-grid">
            {earnings.slice(0, 6).map((e) => (
              <li key={`${e.simbol}-${e.data}`} className="stock-row">
                <Link to={`/stock/${e.simbol}`} className="watch-row-link">
                  <StockLogo simbol={e.simbol} />
                  <div>
                    <strong>{e.simbol}</strong>
                    <div className="muted">
                      {t("dash.raporteaza")} {formatZileRamase(e.data, t)}
                      {e.moment && momentLabel[e.moment] ? ` · ${momentLabel[e.moment]}` : ""}
                    </div>
                  </div>
                  <span className="row-chevron">›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ToolsPro />

      <section className="dash-personas">
        <h2 className="dash-personas-title">{t("landing.temeTitlu")}</h2>
        <ThemeCards />
      </section>

      <Disclaimer />
    </div>
  );
}
