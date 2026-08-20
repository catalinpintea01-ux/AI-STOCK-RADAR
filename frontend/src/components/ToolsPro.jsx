import { useEffect, useState } from "react";
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

const SUB_SCORURI = [
  { key: "scorAnalist", label: "Analiști" },
  { key: "scorMomentum", label: "Momentum" },
  { key: "scorFundamental", label: "Fundamental" },
  { key: "scorRisc", label: "Risc" },
];

export default function ToolsPro() {
  // null = necunoscut (se verifică), true = Premium activ, false = blocat
  const [deblocat, setDeblocat] = useState(null);
  const [top, setTop] = useState([]);

  const [verdict, setVerdict] = useState("");
  const [sector, setSector] = useState("");
  const [minScor, setMinScor] = useState("");
  const [screenerRezultate, setScreenerRezultate] = useState(null);
  const [screenerLoading, setScreenerLoading] = useState(false);

  const [simbolA, setSimbolA] = useState("");
  const [simbolB, setSimbolB] = useState("");
  const [comparatie, setComparatie] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState("");

  // O singură verificare de acces pentru toate cele 3 tool-uri: dacă /top
  // răspunde 402, arătăm cardul de deblocare în locul întregii secțiuni.
  useEffect(() => {
    api
      .getToolTop()
      .then((data) => {
        setTop(data.top);
        setDeblocat(true);
      })
      .catch((err) => {
        if (String(err.message).includes("Premium")) setDeblocat(false);
        else setDeblocat(true); // eroare pasageră, nu blocăm secțiunea
      });
  }, []);

  async function handleUpgrade() {
    try {
      const data = await api.createCheckoutSession();
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
    }
  }

  async function handleScreener(e) {
    e.preventDefault();
    setScreenerLoading(true);
    try {
      const params = {};
      if (verdict) params.verdict = verdict;
      if (sector) params.sector = sector;
      if (minScor) params.minScor = minScor;
      const data = await api.getToolScreener(params);
      setScreenerRezultate(data.rezultate);
    } catch (err) {
      console.error(err);
    } finally {
      setScreenerLoading(false);
    }
  }

  async function handleCompare(e) {
    e.preventDefault();
    setCompareError("");
    setCompareLoading(true);
    setComparatie(null);
    try {
      const data = await api.getToolCompare(simbolA, simbolB);
      setComparatie(data);
    } catch (err) {
      setCompareError(err.message);
    } finally {
      setCompareLoading(false);
    }
  }

  if (deblocat === null) return null;

  if (deblocat === false) {
    return (
      <section className="panel tools-locked">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Instrumente avansate</p>
            <h2>🧰 Tool-uri Pro</h2>
          </div>
          <span className="badge-chip">⭐ Premium</span>
        </div>
        <p className="tools-locked-text">
          Top scoruri AI din tot universul analizat, screener după verdict/sector/scor și comparator A vs B — incluse în
          abonamentul Premium.
        </p>
        <button className="landing-cta tools-locked-cta" onClick={handleUpgrade}>
          ⭐ Deblochează cu Premium →
        </button>
      </section>
    );
  }

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
        <div className="panel">
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

        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Filtrare</p>
              <h2>🔎 Screener AI</h2>
            </div>
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
            <button type="submit" className="add-watchlist-button" disabled={screenerLoading}>
              {screenerLoading ? "Filtrez..." : "Filtrează"}
            </button>
          </form>
          {screenerRezultate !== null &&
            (screenerRezultate.length === 0 ? (
              <p className="empty">Nicio acțiune analizată nu se potrivește filtrelor.</p>
            ) : (
              <ul className="stock-list">
                {screenerRezultate.slice(0, 8).map((s) => (
                  <li key={s.simbol} className="stock-row">
                    <Link to={`/stock/${s.simbol}`} className="watch-row-link">
                      <StockLogo simbol={s.simbol} />
                      <div>
                        <strong>{s.simbol}</strong>
                        <div className="muted">{s.sector}</div>
                      </div>
                      <span className="tool-score">{s.scorCompozit}</span>
                      <span className="row-chevron">›</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
        </div>

        <div className="panel">
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
          {comparatie && (
            <div className="tools-compare-result">
              <div className="tools-compare-cols">
                {[comparatie.a, comparatie.b].map((r) => (
                  <div key={r.simbol} className="tools-compare-col">
                    <Link to={`/stock/${r.simbol}`} className="tools-compare-symbol">
                      {r.simbol}
                    </Link>
                    <ScoreRing score={r.scorCompozit} verdict={r.verdict} />
                    <span className="muted">{VERDICT_CHIP[r.verdict] || r.verdict}</span>
                    <ul className="tools-compare-subs">
                      {SUB_SCORURI.map((s) => (
                        <li key={s.key}>
                          <span>{s.label}</span>
                          <strong>{r[s.key]}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <ul className="tools-compare-diffs">
                {comparatie.diferente.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
