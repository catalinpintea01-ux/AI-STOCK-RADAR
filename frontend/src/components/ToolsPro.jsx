import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import StockLogo from "./StockLogo.jsx";
import ScoreRing from "./ScoreRing.jsx";

const VERDICT_CHIP = {
  optimist: "🔵 Optimist",
  neutru: "⚪ Neutru",
  rezervat: "🟠 Rezervat",
};

const SECTOARE = ["Tehnologie", "Financiar", "Sănătate", "Consum", "Energie", "Industrial", "Telecom"];

const SORT_OPTIONS = [
  { value: "compozit", label: "Scor AI (desc.)" },
  { value: "analist", label: "Analiști (desc.)" },
  { value: "momentum", label: "Momentum (desc.)" },
  { value: "fundamental", label: "Fundamentale (desc.)" },
  { value: "risc", label: "Risc scăzut întâi" },
];

// Rândurile tabelului comparator: cheia din răspuns + cum se decide valoarea
// "mai bună" (evidențiată doar factual — scor mai mare, respectiv risc mai mic).
const CMP_ROWS = [
  { key: "scorCompozit", label: "Scor AI", higherWins: true },
  { key: "scorAnalist", label: "Tendința analiștilor", higherWins: true },
  { key: "scorMomentum", label: "Momentum", higherWins: true },
  { key: "scorFundamental", label: "Fundamentale", higherWins: true },
  { key: "scorRisc", label: "Risc (mai mic = mai calm)", higherWins: false },
];

export default function ToolsPro() {
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

  async function handleUpgrade() {
    try {
      const data = await api.createCheckoutSession();
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
    }
  }

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
      <span className="badge-chip">⭐ Premium</span>
      <button className="landing-cta tools-locked-cta" onClick={handleUpgrade}>
        Deblochează cu Premium →
      </button>
    </div>
  );

  const rezultateVizibile =
    screenerRezultate === null ? null : screenerShowAll ? screenerRezultate : screenerRezultate.slice(0, 8);

  return (
    <section className="tools-section">
      <div className="tools-section-head">
        <div>
          <p className="eyebrow">Instrumente avansate</p>
          <h2>🧰 Tool-uri Pro</h2>
        </div>
        <span className="muted tools-note">Context educațional — nu recomandări de tranzacționare.</span>
      </div>

      <div className="tools-grid">
        <div className="panel tools-panel-top">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Ranking</p>
              <h2>🏆 Top scoruri AI</h2>
            </div>
          </div>
          <p className="tab-subtitle">Cele mai ridicate scoruri compozite din tot ce a analizat AI-ul până acum.</p>
          {top.length === 0 ? (
            <p className="empty">Încă nu există scoruri calculate.</p>
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
                        {s.sector} · {VERDICT_CHIP[s.verdict] || s.verdict}
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
              <p className="eyebrow">Față în față</p>
              <h2>⚖️ Comparator A vs B</h2>
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
              {compareLoading ? "Compar..." : "Compară"}
            </button>
          </form>
          {compareError && <div className="error">{compareError}</div>}
          {!comparatie && !compareLoading && !compareError && (
            <p className="tools-compare-hint muted">
              Introdu două simboluri și primești scorurile complete față în față: sub-scoruri, verdict, preț și
              variația zilei — cu valoarea mai ridicată evidențiată la fiecare criteriu.
            </p>
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
                    <span className="muted">{VERDICT_CHIP[r.verdict] || r.verdict}</span>
                    {r.pret !== null && (
                      <div className="tools-compare-price">
                        ${r.pret.toFixed(2)}{" "}
                        <span className={r.variatieProcent >= 0 ? "gain-positive" : "gain-negative"}>
                          {r.variatieProcent >= 0 ? "+" : ""}
                          {r.variatieProcent.toFixed(1)}%
                        </span>
                      </div>
                    )}
                    <span className="muted tools-compare-sector">{r.sector}</span>
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
                        <th>{row.label}</th>
                        <td className={bWins ? "cmp-win" : ""}>{vb}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="tools-compare-links">
                <Link to={`/stock/${comparatie.a.simbol}`} className="view-analysis-button">
                  Analiza {comparatie.a.simbol} →
                </Link>
                <Link to={`/stock/${comparatie.b.simbol}`} className="view-analysis-button">
                  Analiza {comparatie.b.simbol} →
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className={`panel tools-panel-screener ${blocat ? "tools-panel-locked" : ""}`}>
          {blocat && lockOverlay}
          <div className="panel-head">
            <div>
              <p className="eyebrow">Filtrare</p>
              <h2>🔎 Screener AI</h2>
            </div>
            {screenerRezultate !== null && (
              <span className="muted tools-note">
                {screenerRezultate.length} rezultate · {screenerTotal} acțiuni analizate
              </span>
            )}
          </div>
          <form className="tools-screener-form" onSubmit={handleScreener}>
            <select value={verdict} onChange={(e) => setVerdict(e.target.value)}>
              <option value="">Orice verdict</option>
              <option value="optimist">🔵 Optimist</option>
              <option value="neutru">⚪ Neutru</option>
              <option value="rezervat">🟠 Rezervat</option>
            </select>
            <select value={sector} onChange={(e) => setSector(e.target.value)}>
              <option value="">Orice sector</option>
              {SECTOARE.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select value={minScor} onChange={(e) => setMinScor(e.target.value)}>
              <option value="">Orice scor</option>
              <option value="50">Scor ≥ 50</option>
              <option value="60">Scor ≥ 60</option>
              <option value="70">Scor ≥ 70</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button type="submit" className="add-watchlist-button" disabled={screenerLoading}>
              {screenerLoading ? "Filtrez..." : "Filtrează"}
            </button>
          </form>
          {rezultateVizibile !== null &&
            (rezultateVizibile.length === 0 ? (
              <p className="empty">Nicio acțiune analizată nu se potrivește filtrelor.</p>
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
                            {s.sector} · {VERDICT_CHIP[s.verdict] || s.verdict}
                          </div>
                        </div>
                        <div className="screener-subs">
                          <span title="Analiști">A {s.scorAnalist}</span>
                          <span title="Momentum">M {s.scorMomentum}</span>
                          <span title="Fundamentale">F {s.scorFundamental}</span>
                          <span title="Risc">R {s.scorRisc}</span>
                        </div>
                        <span className="tool-score">{s.scorCompozit}</span>
                        <span className="row-chevron">›</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {screenerRezultate.length > 8 && !screenerShowAll && (
                  <button className="show-more-button" onClick={() => setScreenerShowAll(true)}>
                    Arată toate ({screenerRezultate.length})
                  </button>
                )}
              </>
            ))}
        </div>
      </div>
    </section>
  );
}
