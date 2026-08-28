import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import StockLogo from "./StockLogo.jsx";
import ScoreRing from "./ScoreRing.jsx";
import VerdictTag from "./VerdictTag.jsx";
import { Wrench, Trophy, Search, Scale, Star } from "lucide-react";
import { useLang } from "../i18n/index.jsx";
import { useTraduse } from "../i18n/useTraduse.js";

const SECTOARE = ["Tehnologie", "Financiar", "Sănătate", "Consum", "Energie", "Industrial", "Telecom"];

const SORT_KEYS = [
  { value: "compozit", cheie: "sortCompozit" },
  { value: "analist", cheie: "sortAnalisti" },
  { value: "momentum", cheie: "sortMomentum" },
  { value: "fundamental", cheie: "sortFundamentale" },
  { value: "risc", cheie: "sortRisc" },
];

// Rândurile tabelului comparator: cheia din răspuns + cum se decide valoarea
// "mai bună" (evidențiată doar factual — scor mai mare, respectiv risc mai mic).
const CMP_ROWS = [
  { key: "scorCompozit", cheie: "cmpScor", higherWins: true },
  { key: "scorAnalist", cheie: "cmpTendinta", higherWins: true },
  { key: "scorMomentum", cheie: "cmpMomentum", higherWins: true },
  { key: "scorFundamental", cheie: "cmpFundamentale", higherWins: true },
  { key: "scorRisc", cheie: "cmpRisc", higherWins: false },
];

export default function ToolsPro() {
  const { t } = useLang();
  const tt = useTraduse({
    instrumente: "Instrumente avansate",
    titlu: "Tool-uri Pro",
    nota: "Context educațional — nu recomandări de tranzacționare.",
    ranking: "Ranking",
    top: "Top scoruri AI",
    topSub: "Cele mai ridicate scoruri compozite din tot ce a analizat AI-ul până acum.",
    nimic: "Încă nu există scoruri calculate.",
    fataInFata: "Față în față",
    comparator: "Comparator A vs B",
    compar: "Compar...",
    compara: "Compară",
    hint: "Introdu două simboluri și primești scorurile complete față în față: sub-scoruri, verdict, preț și variația zilei — cu valoarea mai ridicată evidențiată la fiecare criteriu.",
    analiza: "Analiza {s} →",
    veziPremium: "Vezi ce include Premium →",
    filtrare: "Filtrare",
    screener: "Screener AI",
    rezultate: "{n} rezultate · {t} acțiuni analizate",
    oriceVerdict: "Orice verdict",
    oriceSector: "Orice sector",
    oriceScor: "Orice scor",
    scorMin: "Scor ≥ {n}",
    filtrez: "Filtrez...",
    filtreaza: "Filtrează",
    nicio: "Nicio acțiune analizată nu se potrivește filtrelor.",
    arataToate: "Arată toate ({n})",
    sortCompozit: "Scor AI (desc.)",
    sortAnalisti: "Analiști (desc.)",
    sortMomentum: "Momentum (desc.)",
    sortFundamentale: "Fundamentale (desc.)",
    sortRisc: "Risc scăzut întâi",
    cmpScor: "Scor AI",
    cmpTendinta: "Tendința analiștilor",
    cmpMomentum: "Momentum",
    cmpFundamentale: "Fundamentale",
    cmpRisc: "Risc (mai mic = mai calm)",
  });
  const numeSector = (s) => {
    const v = t("sectoare." + s);
    return typeof v === "string" && v.startsWith("sectoare.") ? s : v;
  };
  // Top-ul e vizibil pentru toți (teaser real); screener + comparator sunt
  // Premium — null = se verifică, true = deblocate, false = overlay de upgrade.
  const [deblocat, setDeblocat] = useState(null);
  const [top, setTop] = useState([]);

  const [verdict, setVerdict] = useState("");
  const [sector, setSector] = useState("");
  const [minScor, setMinScor] = useState("");
  const [sortBy, setSortBy] = useState("compozit");
  const [screenerRezultate, setScreenerRezultate] = useState(null);
  const [screenerTotal, setScreenerTotal] = useState(0);
  const [screenerLoading, setScreenerLoading] = useState(false);
  const [screenerShowAll, setScreenerShowAll] = useState(false);

  const [simbolA, setSimbolA] = useState("");
  const [simbolB, setSimbolB] = useState("");
  const [comparatie, setComparatie] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState("");
  const autoCompareRulat = useRef(false);

  async function runCompare(a, b) {
    setCompareError("");
    setCompareLoading(true);
    setComparatie(null);
    try {
      const data = await api.getToolCompare(a, b);
      setComparatie(data);
    } catch (err) {
      setCompareError(err.message);
    } finally {
      setCompareLoading(false);
    }
  }

  async function runScreener(filtre) {
    setScreenerLoading(true);
    try {
      const data = await api.getToolScreener(filtre);
      setScreenerRezultate(data.rezultate);
      setScreenerTotal(data.totalAnalizate ?? data.rezultate.length);
      setScreenerShowAll(false);
      setDeblocat(true);

      // La prima confirmare de Premium, comparatorul pornește singur cu o
      // pereche demonstrativă — fără panou gol până tastezi două simboluri.
      if (!autoCompareRulat.current) {
        autoCompareRulat.current = true;
        setSimbolA("AAPL");
        setSimbolB("MSFT");
        runCompare("AAPL", "MSFT");
      }
    } catch (err) {
      // 402 = cont gratuit: panourile rămân vizibile, dar sub overlay-ul
      // de upgrade — utilizatorul vede exact ce ar primi cu Premium.
      if (String(err.message).includes("Premium")) setDeblocat(false);
      else console.error(err);
    } finally {
      setScreenerLoading(false);
    }
  }

  // Top-ul se încarcă pentru toată lumea; primul apel de screener servește
  // și ca verificare de acces (402 → overlay), fără panouri goale la Premium.
  useEffect(() => {
    api
      .getToolTop()
      .then((data) => setTop(data.top))
      .catch(() => {});
    runScreener({ sort: "compozit" });
  }, []);

  function handleScreener(e) {
    e.preventDefault();
    const params = { sort: sortBy };
    if (verdict) params.verdict = verdict;
    if (sector) params.sector = sector;
    if (minScor) params.minScor = minScor;
    runScreener(params);
  }

  function handleCompare(e) {
    e.preventDefault();
    runCompare(simbolA, simbolB);
  }

  const blocat = deblocat === false;

  const lockOverlay = (
    <div className="tools-lock-overlay">
      <span className="badge-chip"><Star size={12} className="ic" /> Premium</span>
      <Link to="/premium" className="landing-cta tools-locked-cta">
        {tt("veziPremium")}
      </Link>
    </div>
  );

  const rezultateVizibile =
    screenerRezultate === null ? null : screenerShowAll ? screenerRezultate : screenerRezultate.slice(0, 8);

  return (
    <section className="tools-section">
      <div className="tools-section-head">
        <div>
          <p className="eyebrow">{tt("instrumente")}</p>
          <h2><Wrench size={16} className="h2-ic" /> {tt("titlu")}</h2>
        </div>
        <span className="muted tools-note">{tt("nota")}</span>
      </div>

      <div className="tools-grid">
        <div className="panel tools-panel-top">
          <div className="panel-head">
            <div>
              <p className="eyebrow">{tt("ranking")}</p>
              <h2><Trophy size={16} className="h2-ic" /> {tt("top")}</h2>
            </div>
          </div>
          <p className="tab-subtitle">{tt("topSub")}</p>
          {top.length === 0 ? (
            <p className="empty">{tt("nimic")}</p>
          ) : (
            <ul className="stock-list">
              {top.map((s, i) => (
                <li key={s.simbol} className="stock-row">
                  <Link to={`/stock/${s.simbol}`} className="watch-row-link">
                    <span className="tool-rank">{i + 1}</span>
                    <StockLogo simbol={s.simbol} />
                    <div>
                      <strong>{s.simbol}</strong>
                      <div className="muted">
                        {numeSector(s.sector)} · <VerdictTag verdict={s.verdict} />
                      </div>
                    </div>
                    <span className="tool-score">{s.scorCompozit}</span>
                    <span className="row-chevron">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={`panel tools-panel-compare ${blocat ? "tools-panel-locked" : ""}`}>
          {blocat && lockOverlay}
          <div className="panel-head">
            <div>
              <p className="eyebrow">{tt("fataInFata")}</p>
              <h2><Scale size={16} className="h2-ic" /> {tt("comparator")}</h2>
            </div>
          </div>
          <form className="tools-compare-form" onSubmit={handleCompare}>
            <input
              type="text"
              placeholder="ex: AAPL"
              value={simbolA}
              onChange={(e) => setSimbolA(e.target.value.toUpperCase())}
            />
            <span className="tools-vs">vs</span>
            <input
              type="text"
              placeholder="ex: MSFT"
              value={simbolB}
              onChange={(e) => setSimbolB(e.target.value.toUpperCase())}
            />
            <button type="submit" className="add-watchlist-button" disabled={compareLoading || !simbolA || !simbolB}>
              {compareLoading ? tt("compar") : tt("compara")}
            </button>
          </form>
          {compareError && <div className="error">{compareError}</div>}
          {!comparatie && !compareLoading && !compareError && (
            <p className="tools-compare-hint muted">{tt("hint")}</p>
          )}
          {comparatie && (
            <div className="tools-compare-result">
              <div className="tools-compare-cols">
                {[comparatie.a, comparatie.b].map((r) => (
                  <div key={r.simbol} className="tools-compare-col">
                    <div className="tools-compare-id">
                      <StockLogo simbol={r.simbol} />
                      <div>
                        <Link to={`/stock/${r.simbol}`} className="tools-compare-symbol">
                          {r.simbol}
                        </Link>
                        <div className="muted tools-compare-name">{r.nume}</div>
                      </div>
                    </div>
                    <ScoreRing score={r.scorCompozit} verdict={r.verdict} />
                    <span className="muted"><VerdictTag verdict={r.verdict} /></span>
                    {r.pret !== null && (
                      <div className="tools-compare-price">
                        ${r.pret.toFixed(2)}{" "}
                        <span className={r.variatieProcent >= 0 ? "gain-positive" : "gain-negative"}>
                          {r.variatieProcent >= 0 ? "+" : ""}
                          {r.variatieProcent.toFixed(1)}%
                        </span>
                      </div>
                    )}
                    <span className="muted tools-compare-sector">{numeSector(r.sector)}</span>
                  </div>
                ))}
              </div>

              <table className="cmp-table">
                <tbody>
                  {CMP_ROWS.map((row) => {
                    const va = comparatie.a[row.key];
                    const vb = comparatie.b[row.key];
                    const aWins = row.higherWins ? va > vb : va < vb;
                    const bWins = row.higherWins ? vb > va : vb < va;
                    return (
                      <tr key={row.key}>
                        <td className={aWins ? "cmp-win" : ""}>{va}</td>
                        <th>{tt(row.cheie)}</th>
                        <td className={bWins ? "cmp-win" : ""}>{vb}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="tools-compare-links">
                <Link to={`/stock/${comparatie.a.simbol}`} className="view-analysis-button">
                  {tt("analiza", { s: comparatie.a.simbol })}
                </Link>
                <Link to={`/stock/${comparatie.b.simbol}`} className="view-analysis-button">
                  {tt("analiza", { s: comparatie.b.simbol })}
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className={`panel tools-panel-screener ${blocat ? "tools-panel-locked" : ""}`}>
          {blocat && lockOverlay}
          <div className="panel-head">
            <div>
              <p className="eyebrow">{tt("filtrare")}</p>
              <h2><Search size={16} className="h2-ic" /> {tt("screener")}</h2>
            </div>
            {screenerRezultate !== null && (
              <span className="muted tools-note">
                {tt("rezultate", { n: screenerRezultate.length, t: screenerTotal })}
              </span>
            )}
          </div>
          <form className="tools-screener-form" onSubmit={handleScreener}>
            <select value={verdict} onChange={(e) => setVerdict(e.target.value)}>
              <option value="">{tt("oriceVerdict")}</option>
              <option value="optimist">{t("verdict.optimist")}</option>
              <option value="neutru">{t("verdict.neutru")}</option>
              <option value="rezervat">{t("verdict.rezervat")}</option>
            </select>
            <select value={sector} onChange={(e) => setSector(e.target.value)}>
              <option value="">{tt("oriceSector")}</option>
              {SECTOARE.map((s) => (
                <option key={s} value={s}>
                  {numeSector(s)}
                </option>
              ))}
            </select>
            <select value={minScor} onChange={(e) => setMinScor(e.target.value)}>
              <option value="">{tt("oriceScor")}</option>
              <option value="50">{tt("scorMin", { n: 50 })}</option>
              <option value="60">{tt("scorMin", { n: 60 })}</option>
              <option value="70">{tt("scorMin", { n: 70 })}</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              {SORT_KEYS.map((o) => (
                <option key={o.value} value={o.value}>
                  {tt(o.cheie)}
                </option>
              ))}
            </select>
            <button type="submit" className="add-watchlist-button" disabled={screenerLoading}>
              {screenerLoading ? tt("filtrez") : tt("filtreaza")}
            </button>
          </form>
          {rezultateVizibile !== null &&
            (rezultateVizibile.length === 0 ? (
              <p className="empty">{tt("nicio")}</p>
            ) : (
              <>
                <ul className="stock-list screener-list">
                  {rezultateVizibile.map((s) => (
                    <li key={s.simbol} className="stock-row">
                      <Link to={`/stock/${s.simbol}`} className="watch-row-link">
                        <StockLogo simbol={s.simbol} />
                        <div className="screener-id">
                          <strong>{s.simbol}</strong>
                          <div className="muted">
                            {numeSector(s.sector)} · <VerdictTag verdict={s.verdict} />
                          </div>
                        </div>
                        <div className="screener-subs">
                          <span>A {s.scorAnalist}</span>
                          <span>M {s.scorMomentum}</span>
                          <span>F {s.scorFundamental}</span>
                          <span>R {s.scorRisc}</span>
                        </div>
                        <span className="tool-score">{s.scorCompozit}</span>
                        <span className="row-chevron">›</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {screenerRezultate.length > 8 && !screenerShowAll && (
                  <button className="show-more-button" onClick={() => setScreenerShowAll(true)}>
                    {tt("arataToate", { n: screenerRezultate.length })}
                  </button>
                )}
              </>
            ))}
        </div>
      </div>
    </section>
  );
}
