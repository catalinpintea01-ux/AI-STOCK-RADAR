import { useEffect, useState } from "react";
import { SkeletonPage } from "../components/Skeleton.jsx";
import { Link } from "react-router-dom";
import { api } from "../api";
import StockLogo from "../components/StockLogo.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { useLang } from "../i18n/index.jsx";
import { useTraduse } from "../i18n/useTraduse.js";

// Anti alert-fatigue: pagina e un digest zilnic ("3 schimbări importante azi"),
// nu un puț fără fund de notificări. Istoricul complet rămâne disponibil, dar
// restrâns; tot ce e afișat se marchează citit automat la deschidere.
export default function Alerts() {
  const { t, locale } = useLang();
  const tt = useTraduse({
    titlu: "Digest zilnic",
    oSchimbare: "1 schimbare importantă azi în watchlist-ul tău.",
    schimbari: "{n} schimbări importante azi în watchlist-ul tău.",
    nicio: "Nicio schimbare importantă azi în watchlist-ul tău.",
    stiriNoi: "{n} știri noi azi",
    veziAnaliza: "Vezi analiza →",
    istoric: "Istoric complet ({n})",
    restrange: "Restrânge istoricul ↑",
    golTitlu: "Radarul ascultă piața pentru tine",
    golText: "Adaugă acțiuni în watchlist și aici vei găsi, o dată pe zi, doar schimbările care contează.",
    mergiRadar: "Mergi la radar →",
    scorUrcat: "Scorul AI a urcat de la {vechi} la {nou}",
    scorCoborat: "Scorul AI a coborât de la {vechi} la {nou}",
    verdictNou: "verdict nou:",
  });
  // Alertele de scor poartă un JSON structurat în headline (nu text fix) —
  // propoziția se compune aici, în limba utilizatorului.
  function ScorAlerta({ a }) {
    let date;
    try {
      date = JSON.parse(a.headline);
    } catch {
      return <span className="news-headline">{a.headline}</span>;
    }
    const urcat = date.nou >= date.vechi;
    return (
      <span className="news-headline scor-alerta">
        {urcat ? tt("scorUrcat", { vechi: date.vechi, nou: date.nou }) : tt("scorCoborat", { vechi: date.vechi, nou: date.nou })}
        {date.verdictNou !== date.verdictVechi && (
          <span className="scor-alerta-verdict"> · {tt("verdictNou")} {t(`verdict.${date.verdictNou}`)}</span>
        )}
      </span>
    );
  }

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

  if (error) return <div className="page-message">{t("dash.eroare")} {error}</div>;
  if (!items) return <SkeletonPage />;

  return (
    <div className="portfolio-page">
      <div className="learn-header">
        <div>
          <h1 className="page-title">{tt("titlu")}</h1>
          <p className="cash">
            {digest.length > 0
              ? digest.length === 1
                ? tt("oSchimbare")
                : tt("schimbari", { n: digest.length })
              : tt("nicio")}
          </p>
        </div>
        <img src="/mascota/oportunitate.png" alt="" className="mascota mascota-learn" loading="lazy" />
      </div>

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
                      {d.stiri > 1 && <span className="muted"> · {tt("stiriNoi", { n: d.stiri })}</span>}
                    </Link>
                    <div>
                      {d.tip === "scor" ? (
                        <Link to={`/stock/${d.simbol}`} className="news-headline-wrap">
                          <ScorAlerta a={d} />
                        </Link>
                      ) : (
                        <a href={d.url} target="_blank" rel="noreferrer" className="news-headline">
                          {d.headline}
                        </a>
                      )}
                    </div>
                    <div className="muted" style={{ marginTop: "0.25rem" }}>
                      {d.sursa} · {new Date(d.createdAt).toLocaleString(locale)}
                    </div>
                  </div>
                  <Link to={`/stock/${d.simbol}`} className="view-analysis-button">
                    {tt("veziAnaliza")}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {items.length > 0 && (
        <button className="show-more-button" onClick={() => setShowHistory((v) => !v)}>
          {showHistory ? tt("restrange") : tt("istoric", { n: items.length })}
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
                    {a.tip === "scor" ? (
                      <Link to={`/stock/${a.simbol}`} className="news-headline-wrap">
                        <ScorAlerta a={a} />
                      </Link>
                    ) : (
                      <a href={a.url} target="_blank" rel="noreferrer" className="news-headline">
                        {a.headline}
                      </a>
                    )}
                  </div>
                  <div className="muted" style={{ marginTop: "0.25rem" }}>
                    {a.sursa} · {new Date(a.createdAt).toLocaleString(locale)}
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
            titlu={tt("golTitlu")}
            text={tt("golText")}
            ctaText={tt("mergiRadar")}
            ctaTo="/"
          />
        </section>
      )}
    </div>
  );
}
