import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import StockLogo from "./StockLogo.jsx";
import ScoreRing from "./ScoreRing.jsx";
import VerdictTag from "./VerdictTag.jsx";
import { useLang } from "../i18n/index.jsx";

// Demo public în hero: vizitatorul vede un scor REAL pe o acțiune reală
// înainte să i se ceară ceva. Rutele /stocks/:simbol și /stocks/:simbol/radar
// sunt deja publice (fără token), deci nu costă nimic în plus.
//
// De ce există: campania din septembrie a adus 243 de vizitatori și 0 conturi.
// Pagina promitea („radarul scanează piața pentru tine") dar nu ARĂTA nimic —
// contul era zidul dinaintea oricărei valori. Acum valoarea vine prima.

const TICKERE = ["AAPL", "NVDA", "TSLA", "MSFT", "AMZN", "GOOGL"];

export default function DemoLive() {
  // Dicționar, NU useTraduse: /api/i18n/translate cere autentificare, deci
  // pentru un vizitator anonim traducerea la cerere eșuează în tăcere și
  // americanul din reclamă ar vedea etichete românești exact aici.
  const { t } = useLang();
  const tt = (cheie) => t(`demo.${cheie}`);

  const [simbol, setSimbol] = useState("AAPL");
  const [date, setDate] = useState(null);
  const [seIncarca, setSeIncarca] = useState(true);
  const [eroare, setEroare] = useState(false);

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
            onClick={() => setSimbol(s)}
          >
            <StockLogo simbol={s} size={18} />
            {s}
          </button>
        ))}
      </div>

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
                <p className="demo-live-rezumat">{radar.rezumat}</p>
              </>
            )}
          </>
        )}
      </div>

      <div className="demo-live-cta">
        <Link to="/register" className="landing-cta">
          {tt("cta")}
        </Link>
        <p className="demo-live-nota">{tt("ctaNota")}</p>
      </div>
      <p className="demo-live-disclaimer">{tt("educational")}</p>
    </div>
  );
}
