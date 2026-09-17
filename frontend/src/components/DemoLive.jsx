import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import StockLogo from "./StockLogo.jsx";
import ScoreRing from "./ScoreRing.jsx";
import VerdictTag from "./VerdictTag.jsx";
import { useLang } from "../i18n/index.jsx";

// Demo public: un scor REAL pe o acțiune reală, înainte să i se ceară ceva
// vizitatorului. Rutele /stocks/:simbol și /stocks/:simbol/radar sunt publice.
//
// De ce există: campania din septembrie a adus 243 de vizitatori și 0 conturi.
// Pagina promitea, dar nu ARĂTA nimic — contul era zidul dinaintea valorii.
//
// Două moduri:
//  - complet (landing): eyebrow + butoane cu tickere + card + CTA. Butonul
//    duce la /register?simbol=X ca pagina de cont să vorbească despre EXACT
//    acțiunea aleasă și s-o pună în watchlist după înregistrare.
//  - compact (paginile de login/register): doar cardul, pentru acțiunea
//    primită prin simbolInitial — continuitatea demo → cont.

const TICKERE = ["AAPL", "NVDA", "TSLA", "MSFT", "AMZN", "GOOGL"];

export default function DemoLive({ compact = false, simbolInitial = "AAPL" }) {
  // Dicționar, NU useTraduse: /api/i18n/translate cere autentificare, deci
  // pentru un vizitator anonim traducerea la cerere eșuează în tăcere.
  const { t } = useLang();
  const tt = (cheie) => t(`demo.${cheie}`);

  const [simbol, setSimbol] = useState(simbolInitial);
  const [date, setDate] = useState(null);
  const [seIncarca, setSeIncarca] = useState(true);
  const [eroare, setEroare] = useState(false);

  useEffect(() => {
    if (!compact) api.eveniment("landing");
  }, [compact]);

  useEffect(() => {
    let anulat = false;
    setSeIncarca(true);
    setEroare(false);

    Promise.all([api.getRadar(simbol), api.getStockQuote(simbol).catch(() => null)])
      .then(([r, q]) => {
        if (anulat) return;
        setDate({ radar: r.radar || r, cotatie: q?.stock || null });
        setSeIncarca(false);
      })
      .catch(() => {
        if (anulat) return;
        setEroare(true);
        setSeIncarca(false);
      });

    return () => {
      anulat = true;
    };
  }, [simbol]);

  const radar = date?.radar;
  const cotatie = date?.cotatie;
  const bare = radar
    ? [
        [tt("analisti"), radar.scorAnalist],
        [tt("momentum"), radar.scorMomentum],
        [tt("fundamente"), radar.scorFundamental],
        [tt("risc"), radar.scorRisc],
      ]
    : [];

  const card = (
    <div className={`demo-live-card ${seIncarca ? "demo-live-card-incarca" : ""}`}>
      {eroare ? (
        <p className="demo-live-eroare">{tt("eroare")}</p>
      ) : (
        <>
          <div className="demo-live-head">
            <StockLogo simbol={simbol} size={40} />
            <div className="demo-live-nume">
              <strong>{simbol}</strong>
              <span>{cotatie?.nume || ""}</span>
            </div>
            {cotatie && (
              <div className="demo-live-pret">
                <strong>${cotatie.pret?.toFixed(2)}</strong>
                <span className={cotatie.variatieProcent >= 0 ? "demo-up" : "demo-down"}>
                  {cotatie.variatieProcent >= 0 ? "▲" : "▼"} {Math.abs(cotatie.variatieProcent).toFixed(2)}%
                </span>
              </div>
            )}
            {radar && (
              <div className="demo-live-scor">
                <ScoreRing score={radar.scorCompozit} verdict={radar.verdict} />
                <VerdictTag verdict={radar.verdict} />
              </div>
            )}
          </div>

          {radar && (
            <>
              <div className="demo-live-bare">
                {bare.map(([nume, val]) => (
                  <div key={nume} className="demo-bara-rand">
                    <span className="demo-bara-nume">{nume}</span>
                    <div className="demo-bara-fundal">
                      <div className="demo-bara" style={{ width: `${val}%` }} />
                    </div>
                    <span className="demo-bara-val">{val}</span>
                  </div>
                ))}
              </div>
              {!compact && <p className="demo-live-rezumat">{radar.rezumat}</p>}
            </>
          )}
        </>
      )}
    </div>
  );

  if (compact) return <div className="demo-live demo-live-compact">{card}</div>;

  return (
    <div className="demo-live">
      <p className="demo-live-eyebrow">{tt("eyebrow")}</p>

      <div className="demo-live-tickere" role="group" aria-label={tt("alege")}>
        {TICKERE.map((s) => (
          <button
            key={s}
            type="button"
            className={`demo-ticker ${s === simbol ? "active" : ""}`}
            aria-pressed={s === simbol}
            onClick={() => {
              setSimbol(s);
              api.eveniment("demo_ticker", s);
            }}
          >
            <StockLogo simbol={s} size={18} />
            {s}
          </button>
        ))}
      </div>

      {card}

      <div className="demo-live-cta">
        <Link
          to={`/register?simbol=${encodeURIComponent(simbol)}`}
          className="landing-cta"
          onClick={() => api.eveniment("demo_cta", simbol)}
        >
          {tt("cta").replace("{simbol}", simbol)}
        </Link>
        <p className="demo-live-nota">{tt("ctaNota")}</p>
      </div>
      <p className="demo-live-disclaimer">{tt("educational")}</p>
    </div>
  );
}
