import { useEffect, useState } from "react";
import { SkeletonPage } from "../components/Skeleton.jsx";
import { Link } from "react-router-dom";
import { api } from "../api";
import StockLogo from "../components/StockLogo.jsx";
import EmptyState from "../components/EmptyState.jsx";

// Anti alert-fatigue: pagina e un digest zilnic ("3 schimbări importante azi"),
// nu un puț fără fund de notificări. Istoricul complet rămâne disponibil, dar
// restrâns; tot ce e afișat se marchează citit automat la deschidere.
export default function Alerts() {
  const [items, setItems] = useState(null);
  const [digest, setDigest] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getAlerts()
      .then((data) => {
        setItems(data.items);
        setDigest(data.digest || []);
        // Deschiderea paginii = citire: badge-ul clopoțelului pleacă de la 0
        // data viitoare, nu mai acumulăm sute de "necitite".
        return api.markAllAlertsRead().catch(() => {});
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="page-message">Eroare: {error}</div>;
  if (!items) return <SkeletonPage />;

  return (
    <div className="portfolio-page">
      <h1 className="page-title">Digest zilnic</h1>
      <p className="cash">
        {digest.length > 0
          ? `${digest.length} ${digest.length === 1 ? "schimbare importantă" : "schimbări importante"} azi în watchlist-ul tău.`
          : "Nicio schimbare importantă azi în watchlist-ul tău."}
      </p>

      {digest.length > 0 && (
        <section className="holdings">
          <ul className="holding-list">
            {digest.map((d) => (
              <li key={d.simbol} className="holding-row">
                <div className="digest-row">
                  <StockLogo simbol={d.simbol} />
                  <div className="digest-body">
                    <Link to={`/stock/${d.simbol}`} className="digest-symbol">
                      {d.simbol}
                      {d.stiri > 1 && <span className="muted"> · {d.stiri} știri noi azi</span>}
                    </Link>
                    <div>
                      <a href={d.url} target="_blank" rel="noreferrer" className="news-headline">
                        {d.headline}
                      </a>
                    </div>
                    <div className="muted" style={{ marginTop: "0.25rem" }}>
                      {d.sursa} · {new Date(d.createdAt).toLocaleString("ro-RO")}
                    </div>
                  </div>
                  <Link to={`/stock/${d.simbol}`} className="view-analysis-button">
                    Vezi analiza →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {items.length > 0 && (
        <button className="show-more-button" onClick={() => setShowHistory((v) => !v)}>
          {showHistory ? "Restrânge istoricul ↑" : `Istoric complet (${items.length})`}
        </button>
      )}

      {showHistory && (
        <section className="holdings" style={{ marginTop: "0.75rem" }}>
          <ul className="holding-list">
            {items.map((a) => (
              <li key={a.id} className="holding-row">
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
              </li>
            ))}
          </ul>
        </section>
      )}

      {items.length === 0 && (
        <section className="holdings">
          <EmptyState
            titlu="Radarul ascultă piața pentru tine"
            text="Adaugă acțiuni în watchlist și aici vei găsi, o dată pe zi, doar schimbările care contează."
            ctaText="Mergi la radar →"
            ctaTo="/"
          />
        </section>
      )}
    </div>
  );
}
