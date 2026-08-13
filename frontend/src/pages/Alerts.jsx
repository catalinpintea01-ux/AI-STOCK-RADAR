import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function Alerts() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  function load() {
    return api
      .getAlerts()
      .then((data) => setItems(data.items))
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleMarkAllRead() {
    await api.markAllAlertsRead();
    await load();
  }

  if (error) return <div className="page-message">Eroare: {error}</div>;
  if (!items) return <div className="page-message">Se încarcă...</div>;

  return (
    <div className="portfolio-page">
      <h1 className="page-title">Alerte</h1>
      <p className="cash">Știri noi apărute pentru acțiunile din watchlist-ul tău, de la ultima vizită.</p>

      {items.length > 0 && (
        <button className="logout" onClick={handleMarkAllRead} style={{ marginBottom: "1rem" }}>
          Marchează toate ca citite
        </button>
      )}

      <section className="holdings">
        {items.length === 0 ? (
          <p className="empty">Nu ai alerte momentan. Adaugă acțiuni în watchlist ca să primești alerte.</p>
        ) : (
          <ul className="holding-list">
            {items.map((a) => (
              <li key={a.id} className={a.citit ? "holding-row" : "holding-row alert-unread"}>
                <div>
                  <Link to={`/stock/${a.simbol}`} className="watch-row-link">
                    <strong>{a.simbol}</strong>
                  </Link>
                  <div>
                    <a href={a.url} target="_blank" rel="noreferrer" className="news-headline">
                      {a.headline}
                    </a>
                  </div>
                  <div className="muted" style={{ marginTop: "0.25rem" }}>
                    {a.sursa} · {new Date(a.createdAt).toLocaleString("ro-RO")}
                  </div>
                </div>
                {!a.citit && (
                  <button onClick={() => api.markAlertRead(a.id).then(load)}>Marchează citit</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
