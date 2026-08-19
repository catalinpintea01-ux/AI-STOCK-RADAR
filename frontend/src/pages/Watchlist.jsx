import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import Disclaimer from "../components/Disclaimer.jsx";
import TickerTape from "../components/TickerTape.jsx";
import StockLogo from "../components/StockLogo.jsx";

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

export default function Watchlist() {
  const [items, setItems] = useState(null);
  const [holdings, setHoldings] = useState({});
  const [marketNews, setMarketNews] = useState([]);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [bulkAdding, setBulkAdding] = useState(false);
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
    } catch (err) {
      setSearchError(err.message);
    }
  }

  async function handleRemove(simbol) {
    await api.removeFromWatchlist(simbol);
    await load();
  }

  if (error) return <div className="page-message">Eroare: {error}</div>;
  if (!items) return <div className="page-message">Se încarcă...</div>;

  const briefItems = items
    .filter((i) => i.schimbare && i.schimbare.deltaCompozit !== 0)
    .sort((a, b) => Math.abs(b.schimbare.deltaCompozit) - Math.abs(a.schimbare.deltaCompozit))
    .slice(0, 5);

  return (
    <div className="portfolio-page">
      <h1 className="page-title">AI Stock Radar</h1>
      <p className="cash">Urmărește acțiuni și primești context AI despre ele — nu recomandări de tranzacționare.</p>

      {marketNews.length > 0 && (
        <section className="hero-news">
          {marketNews.map((n, i) => (
            <a
              key={i}
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-news-card"
              style={n.imagine ? { backgroundImage: `url(${n.imagine})` } : undefined}
            >
              <div className="hero-news-body">
                <span className="hero-news-source">{n.sursa} · Astăzi</span>
                <h3 className="hero-news-headline">{n.headline}</h3>
              </div>
            </a>
          ))}
        </section>
      )}

      <TickerTape />

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
        <h2>Acțiunile tale urmărite</h2>
        {items.length > 0 && (
          <p className="row-hint">👉 Atinge o acțiune pentru scor AI, știri, indicatori financiari și tranzacții insideri.</p>
        )}
        {items.length === 0 ? (
          <p className="empty">Nu urmărești încă nicio acțiune. Caută una mai sus ca să începi.</p>
        ) : (
          <ul className="stock-list">
            {items.map((item) => (
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
                      {item.radar
                        ? `${VERDICT_CHIP[item.radar.verdict] || item.radar.verdict} · Scor AI: ${item.radar.scorCompozit}/100`
                        : "Neanalizat încă — dă click"}
                    </div>
                  </div>
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
                <button className="logout" onClick={() => handleRemove(item.simbol)}>
                  Scoate
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Disclaimer />
    </div>
  );
}
