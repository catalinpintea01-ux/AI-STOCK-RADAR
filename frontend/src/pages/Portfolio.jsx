import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { PortfolioChart, buildValueHistory } from "../PortfolioChart.jsx";
import StockLogo from "../components/StockLogo.jsx";

function priceOf(stocks, extraQuotes, simbol) {
  // extraQuotes se reîmprospătează individual la 30s pentru deținerile tale —
  // e mai proaspăt decât `stocks` (lista de 50, încărcată o singură dată).
  if (extraQuotes[simbol]?.pret) return extraQuotes[simbol].pret;
  const stock = stocks.find((s) => s.simbol === simbol);
  return stock ? stock.pret : extraQuotes[simbol]?.pret ?? 0;
}

const XP_PER_LEVEL = 100;

const BADGE_INFO = {
  "primul-pas": { emoji: "🎯", label: "Primul pas", descriere: "Prima ta tranzacție" },
  diversificare: { emoji: "🌐", label: "Diversificare", descriere: "3+ acțiuni diferite în portofoliu" },
  consecventa: { emoji: "🔥", label: "Consecvență", descriere: "7 zile streak" },
};

export default function Portfolio() {
  const [searchParams, setSearchParams] = useSearchParams();
  const plataStatus = searchParams.get("plata");
  const [portfolio, setPortfolio] = useState(null);
  const [user, setUser] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [stocksLoading, setStocksLoading] = useState(true);
  const [extraQuotes, setExtraQuotes] = useState({});
  const [qty, setQty] = useState({});
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [explanation, setExplanation] = useState(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [watchlistAdded, setWatchlistAdded] = useState(new Set());
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const fetchingSymbols = useRef(new Set());
  const portfolioRef = useRef(null);

  useEffect(() => {
    portfolioRef.current = portfolio;
  }, [portfolio]);

  // Reîmprospătare automată la 30s — DOAR pentru acțiunile deținute efectiv,
  // nu toată lista de 50 de simboluri (care ar epuiza rapid cota gratuită
  // Finnhub dacă am re-cere-o la fiecare 30s; lista mare rămâne "instant" —
  // se încarcă o dată la deschiderea paginii, ca înainte).
  useEffect(() => {
    const id = setInterval(() => {
      const simboluriDetinute = (portfolioRef.current?.holdings || []).map((h) => h.simbol);
      simboluriDetinute.forEach((simbol) => {
        api
          .getStockQuote(simbol)
          .then((data) => setExtraQuotes((prev) => ({ ...prev, [simbol]: data.stock })))
          .catch(() => {});
      });
    }, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    api
      .getPortfolio()
      .then((data) => {
        setPortfolio(data.portfolio);
        setUser(data.user);
      })
      .catch((err) => setError(err.message));

    api
      .getStocks()
      .then((data) => setStocks(data.stocks))
      .catch((err) => setError(err.message))
      .finally(() => setStocksLoading(false));

    api
      .getPortfolioHealth()
      .then(setHealth)
      .catch(() => {})
      .finally(() => setHealthLoading(false));
  }, []);

  // Acțiunile cumpărate prin căutare liberă (în afara listei curate) nu au
  // preț în `stocks` — le luăm individual, ca deținerile să aibă mereu valoare curentă.
  useEffect(() => {
    if (!portfolio || stocksLoading) return;

    const curatedSymbols = new Set(stocks.map((s) => s.simbol));
    const missing = portfolio.holdings
      .map((h) => h.simbol)
      .filter((simbol) => !curatedSymbols.has(simbol) && !(simbol in extraQuotes) && !fetchingSymbols.current.has(simbol));

    if (missing.length === 0) return;

    // Backoff crescător (5s, 10s, 15s, 20s) — planul gratuit Finnhub resetează
    // cota de cereri o dată pe minut, deci o reîncercare imediată nu ajută.
    function fetchQuote(simbol, attempt) {
      api
        .getStockQuote(simbol)
        .then((data) => {
          setExtraQuotes((prev) => ({ ...prev, [simbol]: data.stock }));
          fetchingSymbols.current.delete(simbol);
        })
        .catch(() => {
          if (attempt < 4) {
            setTimeout(() => fetchQuote(simbol, attempt + 1), attempt * 5000 + 5000);
          } else {
            setExtraQuotes((prev) => ({ ...prev, [simbol]: { pret: 0 } }));
            fetchingSymbols.current.delete(simbol);
          }
        });
    }

    missing.forEach((simbol) => {
      fetchingSymbols.current.add(simbol);
      fetchQuote(simbol, 0);
    });
  }, [portfolio, stocks, stocksLoading, extraQuotes]);

  async function handleAddWatchlist(simbol) {
    try {
      await api.addToWatchlist(simbol);
      setWatchlistAdded((prev) => new Set(prev).add(simbol));
    } catch (err) {
      setActionError(err.message);
    }
  }

  function getQty(simbol) {
    return qty[simbol] ?? 1;
  }

  function setQtyFor(simbol, value) {
    setQty((prev) => ({ ...prev, [simbol]: Math.max(1, Number(value) || 1) }));
  }

  async function handleBuy(simbol) {
    setActionError("");
    try {
      const data = await api.buyStock(simbol, getQty(simbol));
      setPortfolio(data.portfolio);
      setUser(data.user);
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleSell(simbol) {
    setActionError("");
    try {
      const data = await api.sellStock(simbol, getQty(simbol));
      setPortfolio(data.portfolio);
      setUser(data.user);
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleExplain() {
    setExplanationLoading(true);
    try {
      const data = await api.explainPortfolio();
      setExplanation(data.explicatie);
    } catch (err) {
      setExplanation(err.message);
    } finally {
      setExplanationLoading(false);
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

  if (error) return <div className="page-message">Eroare: {error}</div>;
  if (!portfolio) return <div className="page-message">Se încarcă...</div>;

  const holdingsValue = portfolio.holdings.reduce(
    (sum, h) => sum + h.cantitate * priceOf(stocks, extraQuotes, h.simbol),
    0
  );
  const totalValue = portfolio.cashBalance + holdingsValue;
  const history = buildValueHistory(portfolio, totalValue);

  return (
    <div className="portfolio-page">
      <h1 className="page-title">Portofoliu virtual</h1>
      <p className="cash">Testează-ți strategia cu bani virtuali, înainte să riști bani reali.</p>

      {plataStatus === "succes" && (
        <div className="value-card" style={{ borderColor: "var(--green)" }}>
          ✅ Plata a fost procesată — abonamentul Premium se activează în câteva secunde.
          <button className="logout" style={{ marginLeft: "1rem" }} onClick={() => setSearchParams({})}>
            Ascunde
          </button>
        </div>
      )}
      {plataStatus === "anulat" && (
        <div className="value-card">
          Plata a fost anulată — poți încerca din nou oricând din meniu.
          <button className="logout" style={{ marginLeft: "1rem" }} onClick={() => setSearchParams({})}>
            Ascunde
          </button>
        </div>
      )}

      <header className="portfolio-header">
        <span className="streak">🔥 {user?.streakCurent ?? 0} zile streak</span>
      </header>

      {!healthLoading && health?.health && (
        <div className="value-card">
          <span className="label">Sănătatea portofoliului (scor AI agregat)</span>
          <span className="value">{health.health.scorSanatate}/100</span>
          {health.health.avertismente.map((a, i) => (
            <p key={i} className="muted" style={{ marginTop: "0.25rem" }}>
              ⚠️ {a}
            </p>
          ))}
        </div>
      )}

      <div className="value-card">
        <span className="label">Valoare totală portofoliu</span>
        <span className="value">${totalValue.toFixed(2)}</span>
        <span className="cash">Numerar disponibil: ${portfolio.cashBalance.toFixed(2)}</span>
        <PortfolioChart points={history} />
      </div>

      <div className="xp-bar">
        <div className="xp-label">
          Nivel {user?.nivel ?? 1} — {(user?.xp ?? 0) % XP_PER_LEVEL}/{XP_PER_LEVEL} XP
        </div>
        <div className="xp-track">
          <div className="xp-fill" style={{ width: `${(user?.xp ?? 0) % XP_PER_LEVEL}%` }} />
        </div>
      </div>

      {user?.badges?.length > 0 && (
        <div className="badge-row">
          {user.badges.map((b) => {
            const info = BADGE_INFO[b.tipBadge] || { emoji: "🏅", label: b.tipBadge, descriere: "" };
            return (
              <span key={b.id} className="badge-chip" title={info.descriere}>
                {info.emoji} {info.label}
              </span>
            );
          })}
        </div>
      )}

      <button className="why-button" onClick={handleExplain} disabled={explanationLoading}>
        {explanationLoading ? "Analizez..." : "De ce a crescut/scăzut azi?"}
      </button>
      {explanation && <p className="explanation">{explanation}</p>}

      {actionError && <div className="error">{actionError}</div>}

      <section className="holdings">
        <h2>Acțiunile tale</h2>
        {portfolio.holdings.length > 0 && (
          <p className="row-hint">👉 Atinge o acțiune pentru scor AI, știri și indicatori financiari.</p>
        )}
        {portfolio.holdings.length === 0 ? (
          <p className="empty">Nu ai încă acțiuni. Cumpără mai jos din piața disponibilă.</p>
        ) : (
          <ul className="holding-list">
            {portfolio.holdings.map((h) => {
              const current = priceOf(stocks, extraQuotes, h.simbol);
              const gainPercent =
                ((current - h.pretMediuAchizitie) / h.pretMediuAchizitie) * 100;
              return (
                <li key={h.id} className="holding-row">
                  <Link to={`/stock/${h.simbol}`} className="watch-row-link">
                    <StockLogo simbol={h.simbol} />
                    <div>
                      <strong>{h.simbol}</strong>
                      <div className="muted">
                        {h.cantitate} buc. @ ${h.pretMediuAchizitie.toFixed(2)} medie
                      </div>
                    </div>
                    <div className="holding-right">
                      <div>${(h.cantitate * current).toFixed(2)}</div>
                      <div className={gainPercent >= 0 ? "gain-positive" : "gain-negative"}>
                        {gainPercent >= 0 ? "+" : ""}
                        {gainPercent.toFixed(1)}%
                      </div>
                    </div>
                    <span className="row-chevron">›</span>
                  </Link>
                  <div className="trade-controls">
                    <input
                      type="number"
                      min="1"
                      value={getQty(h.simbol)}
                      onChange={(e) => setQtyFor(h.simbol, e.target.value)}
                    />
                    <button onClick={() => handleSell(h.simbol)}>Vinde</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="search-section">
        <h2>Caută altă acțiune (SUA)</h2>
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
        {searchResults.length > 0 && (
          <ul className="stock-list">
            {searchResults.map((r) => (
              <li key={r.simbol} className="stock-row">
                <Link to={`/stock/${r.simbol}`} className="watch-row-link">
                  <StockLogo simbol={r.simbol} />
                  <div>
                    <strong>{r.simbol}</strong>
                    <div className="muted">{r.nume}</div>
                  </div>
                  <span className="row-chevron">›</span>
                </Link>
                <div className="trade-controls">
                  <button onClick={() => handleAddWatchlist(r.simbol)}>
                    {watchlistAdded.has(r.simbol) ? "✓ Watchlist" : "+ Watchlist"}
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={getQty(r.simbol)}
                    onChange={(e) => setQtyFor(r.simbol, e.target.value)}
                  />
                  <button onClick={() => handleBuy(r.simbol)}>Cumpără</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="market">
        <h2>Piață — acțiuni SUA</h2>
        {stocksLoading ? (
          <p className="data-source">Se încarcă prețurile pieței...</p>
        ) : (
          stocks.length > 0 && (
            <p className="data-source">
              {stocks[0].sursa === "finnhub"
                ? "Date live (Finnhub)"
                : "Date simulate (mock) — conectează o cheie API pentru prețuri live"}
            </p>
          )
        )}
        <ul className="stock-list">
          {stocks.map((s) => (
            <li key={s.simbol} className="stock-row">
              <Link to={`/stock/${s.simbol}`} className="watch-row-link">
                <StockLogo simbol={s.simbol} />
                <div>
                  <strong>{s.simbol}</strong>
                  <div className="muted">{s.nume}</div>
                </div>
                <div className="stock-right">
                  <div>${s.pret.toFixed(2)}</div>
                  <div className={s.variatieProcent >= 0 ? "gain-positive" : "gain-negative"}>
                    {s.variatieProcent >= 0 ? "+" : ""}
                    {s.variatieProcent.toFixed(1)}%
                  </div>
                </div>
                <span className="row-chevron">›</span>
              </Link>
              <div className="trade-controls">
                <button onClick={() => handleAddWatchlist(s.simbol)}>
                  {watchlistAdded.has(s.simbol) ? "✓" : "+ WL"}
                </button>
                <input
                  type="number"
                  min="1"
                  value={getQty(s.simbol)}
                  onChange={(e) => setQtyFor(s.simbol, e.target.value)}
                />
                <button onClick={() => handleBuy(s.simbol)}>Cumpără</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
