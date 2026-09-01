import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useTraduse } from "../i18n/useTraduse.js";

// "Centrul radarului" — panoul mare din hero-ul dashboard-ului (zona cu
// mascota). 12 funcții într-un singur loc, toate din date deja existente
// (acuratete + harta vin din cache-uri publice; restul sosesc ca props din
// Watchlist — zero apeluri suplimentare grele):
//  1. statistica live de auto-evaluare      7. extremele zilei (linkuri)
//  2. ponderile de azi (bare)               8. VIX acum (link /vix)
//  3. simulatorul scorului (slidere)        9. sinteza watchlist-ului tău
//  4. auto-evaluările pe zile (grafic)     10. raportări în ≤7 zile
//  5. acuratețea pe verdict (bare)         11. ceasul pieței americane (live)
//  6. pulsul pieței (urcă/coboară/medie)   12. regula de potrivire, pe scurt

function oraNewYork() {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour12: false,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parti = Object.fromEntries(f.formatToParts(new Date()).map((p) => [p.type, p.value]));
  const ora = Number(parti.hour) * 60 + Number(parti.minute);
  const ziLucratoare = !["Sat", "Sun"].includes(parti.weekday);
  return {
    text: `${parti.hour}:${parti.minute}`,
    deschisa: ziLucratoare && ora >= 9 * 60 + 30 && ora < 16 * 60,
  };
}

export default function RadarCenter({ vix, statsWatch, raportari }) {
  const tt = useTraduse({
    titlu: "Centrul radarului",
    sub: "Radarul lucrează non-stop pentru tine — și își publică singur rezultatele.",
    statLinie: "din verdictele ultimelor 30 de zile s-au potrivit cu evoluția prețului",
    statColectare: "Primele evaluări se colectează chiar acum — cifrele apar aici în câteva zile.",
    ponderiTitlu: "Ponderile de azi",
    ponderiNota: "ajustate automat din evaluările zilnice",
    pMomentum: "Momentum",
    pAnalisti: "Analiști",
    pFundamente: "Fundamente",
    pRisc: "Risc",
    simTitlu: "Simulatorul scorului",
    simScor: "Scor compozit",
    vOptimist: "optimist",
    vNeutru: "neutru",
    vRezervat: "rezervat",
    zileTitlu: "Evaluările pe zile",
    accTitlu: "Potriviri pe verdict",
    din: "din",
    pulsTitlu: "Pulsul pieței",
    pulsUrca: "urcă",
    pulsCoboara: "coboară",
    pulsMedie: "media",
    extremeTitlu: "Extremele zilei",
    vixTitlu: "VIX acum",
    vixSub: "indicele fricii",
    watchTitlu: "Watchlist-ul tău",
    watchScorMediu: "scor mediu",
    watchOptimiste: "optimiste",
    watchNeutre: "neutre",
    watchRezervate: "rezervate",
    watchGol: "Adaugă acțiuni în watchlist și radarul le analizează automat.",
    raportariTitlu: "Raportări în 7 zile",
    raportariSub: "companii din watchlist-ul tău cu earnings în curând",
    ceasTitlu: "Piața americană",
    ceasDeschisa: "deschisă",
    ceasInchisa: "închisă",
    ceasOra: "ora New York",
    regulaTitlu: "Cum numărăm o potrivire",
    regulaText: "optimist: +0,5% sau mai mult în 5 zile · rezervat: −0,5% sau mai puțin · neutru: în banda de ±2,5%",
    disclaimer: "Statistici descriptive ale istoricului — nu garanții și nu sfaturi de investiții.",
    cumCalculam: "Cum calculăm scorul →",
  });

  const [acuratete, setAcuratete] = useState(null);
  const [puls, setPuls] = useState(null);
  const [ceas, setCeas] = useState(oraNewYork());
  const [sim, setSim] = useState({ momentum: 62, analist: 58, fundamental: 55, risc: 40 });

  useEffect(() => {
    api.getRadarAcuratete().then(setAcuratete).catch(() => {});
    api
      .getHarta()
      .then((d) => {
        const a = d.actiuni || [];
        if (a.length === 0) return;
        const urca = a.filter((x) => x.variatieProcent > 0).length;
        const medie = a.reduce((s, x) => s + (x.variatieProcent || 0), 0) / a.length;
        const best = a.reduce((m, x) => (x.variatieProcent > m.variatieProcent ? x : m));
        const worst = a.reduce((m, x) => (x.variatieProcent < m.variatieProcent ? x : m));
        setPuls({ urca, coboara: a.length - urca, medie, best, worst });
      })
      .catch(() => {});
    const t = setInterval(() => setCeas(oraNewYork()), 30000);
    return () => clearInterval(t);
  }, []);

  const ponderi = acuratete?.ponderi || { momentum: 30, analist: 30, fundamental: 20, risc: 20 };
  const scorSim = Math.round(
    (ponderi.momentum * sim.momentum +
      ponderi.analist * sim.analist +
      ponderi.fundamental * sim.fundamental +
      ponderi.risc * (100 - sim.risc)) /
      (ponderi.momentum + ponderi.analist + ponderi.fundamental + ponderi.risc)
  );
  const verdictSim = scorSim >= 60 ? tt("vOptimist") : scorSim <= 40 ? tt("vRezervat") : tt("vNeutru");

  const fmt = (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
  const numePilon = { momentum: tt("pMomentum"), analist: tt("pAnalisti"), fundamental: tt("pFundamente"), risc: tt("pRisc") };

  const areStat = acuratete?.procent != null && acuratete.total >= 20;

  return (
    <div className="radar-center">
      <div className="radar-center-head">
        <img src="/mascota/radar.png" alt="Mascota StockRadar AI" className="radar-center-mascota" loading="lazy" />
        <div>
          <h2>{tt("titlu")}</h2>
          <p>{tt("sub")}</p>
          {areStat ? (
            <p className="radar-center-stat">
              <strong>{acuratete.procent}%</strong> {tt("statLinie")} ({acuratete.total})
            </p>
          ) : (
            <p className="radar-center-stat radar-center-colectare">{tt("statColectare")}</p>
          )}
          <Link to="/metodologie" className="radar-vix-link">{tt("cumCalculam")}</Link>
        </div>
      </div>

      <div className="radar-center-grid">
        {/* 2. Ponderile de azi */}
        <div className="radar-app radar-mini">
          <h4>{tt("ponderiTitlu")}</h4>
          {["momentum", "analist", "fundamental", "risc"].map((k) => (
            <div key={k} className="acc-rand">
              <span className="acc-nume">{numePilon[k]}</span>
              <div className="acc-bara-fundal">
                <div className="acc-bara" style={{ width: `${(ponderi[k] / 40) * 100}%` }} />
              </div>
              <span className="acc-val">{ponderi[k]}%</span>
            </div>
          ))}
          <p className="radar-app-nota">{tt("ponderiNota")}</p>
        </div>

        {/* 3. Simulatorul */}
        <div className="radar-app radar-mini">
          <h4>{tt("simTitlu")}</h4>
          {["momentum", "analist", "fundamental", "risc"].map((k) => (
            <label key={k} className="sim-rand">
              <span className="sim-nume">{numePilon[k]}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={sim[k]}
                onChange={(e) => setSim({ ...sim, [k]: Number(e.target.value) })}
              />
              <span className="sim-val">{sim[k]}</span>
            </label>
          ))}
          <div className="sim-rezultat">
            <span>{tt("simScor")}</span>
            <strong>{scorSim}</strong>
            <em className="sim-verdict">{verdictSim}</em>
          </div>
        </div>

        {/* 4. Evaluările pe zile */}
        <div className="radar-app radar-mini">
          <h4>{tt("zileTitlu")}</h4>
          {acuratete?.zile?.length > 0 ? (
            <div className="zile-grafic zile-grafic-mic">
              {[...acuratete.zile].reverse().map((z) => (
                <div key={z.zi} className="zile-bara-wrap" title={`${z.zi}: ${z.potriviri} ${tt("din")} ${z.total}`}>
                  <div
                    className="zile-bara"
                    style={{ height: `${Math.max(8, Math.round((z.potriviri / Math.max(z.total, 1)) * 100))}%` }}
                  />
                  <span className="zile-eticheta">{z.zi.slice(8)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="radar-app-sub">{tt("statColectare")}</p>
          )}
        </div>

        {/* 5. Acuratețea pe verdict */}
        <div className="radar-app radar-mini">
          <h4>{tt("accTitlu")}</h4>
          {[
            ["optimist", tt("vOptimist")],
            ["neutru", tt("vNeutru")],
            ["rezervat", tt("vRezervat")],
          ].map(([k, nume]) => {
            const d = acuratete?.perVerdict?.[k];
            const procent = d && d.total > 0 ? Math.round((d.potriviri / d.total) * 100) : 0;
            return (
              <div key={k} className="acc-rand">
                <span className="acc-nume">{nume}</span>
                <div className="acc-bara-fundal">
                  <div className="acc-bara" style={{ width: `${procent}%` }} />
                </div>
                <span className="acc-val">{d && d.total > 0 ? `${d.potriviri} ${tt("din")} ${d.total}` : "—"}</span>
              </div>
            );
          })}
          <p className="radar-app-nota">{tt("disclaimer")}</p>
        </div>

        {/* 6+7. Pulsul + extremele */}
        <div className="radar-app radar-mini">
          <h4>{tt("pulsTitlu")}</h4>
          {puls ? (
            <>
              <p className="radar-cifra-rand">
                <strong className="harta-puls-vup">{puls.urca}</strong> {tt("pulsUrca")} ·{" "}
                <strong className="harta-puls-vdown">{puls.coboara}</strong> {tt("pulsCoboara")} · {tt("pulsMedie")}{" "}
                <strong className={puls.medie >= 0 ? "harta-puls-vup" : "harta-puls-vdown"}>{fmt(puls.medie)}</strong>
              </p>
              <p className="radar-app-sub radar-extreme-titlu">{tt("extremeTitlu")}</p>
              <div className="radar-extreme">
                <Link to={`/stock/${puls.best.simbol}`} className="harta-puls-chip harta-puls-best">
                  {puls.best.simbol} {fmt(puls.best.variatieProcent)}
                </Link>
                <Link to={`/stock/${puls.worst.simbol}`} className="harta-puls-chip harta-puls-worst">
                  {puls.worst.simbol} {fmt(puls.worst.variatieProcent)}
                </Link>
              </div>
            </>
          ) : (
            <p className="radar-app-sub">…</p>
          )}
        </div>

        {/* 8+11. VIX + ceasul pieței */}
        <div className="radar-app radar-mini">
          <h4>{tt("ceasTitlu")}</h4>
          <p className="radar-cifra-rand">
            <span className={`radar-ceas-punct ${ceas.deschisa ? "radar-ceas-on" : "radar-ceas-off"}`} />
            <strong>{ceas.deschisa ? tt("ceasDeschisa") : tt("ceasInchisa")}</strong> · {ceas.text} {tt("ceasOra")}
          </p>
          {typeof vix === "number" && (
            <Link to="/vix" className="radar-vix-link">
              {tt("vixTitlu")}: <strong>{vix.toFixed(1)}</strong> <span className="radar-app-sub-inline">({tt("vixSub")})</span>
            </Link>
          )}
        </div>

        {/* 9+10. Watchlist-ul tău + raportări */}
        <div className="radar-app radar-mini">
          <h4>{tt("watchTitlu")}</h4>
          {statsWatch && statsWatch.analizate > 0 ? (
            <>
              <p className="radar-cifra-rand">
                {tt("watchScorMediu")}: <strong className="sim-val">{statsWatch.scorMediu}</strong>
              </p>
              <p className="radar-cifra-rand radar-watch-verdicte">
                <strong>{statsWatch.optimiste}</strong> {tt("watchOptimiste")} · <strong>{statsWatch.neutre}</strong>{" "}
                {tt("watchNeutre")} · <strong>{statsWatch.rezervate}</strong> {tt("watchRezervate")}
              </p>
            </>
          ) : (
            <p className="radar-app-sub">{tt("watchGol")}</p>
          )}
          <p className="radar-cifra-rand">
            {tt("raportariTitlu")}: <strong className="sim-val">{raportari ?? 0}</strong>
          </p>
          <p className="radar-app-nota">{tt("raportariSub")}</p>
        </div>

        {/* 12. Regula de potrivire */}
        <div className="radar-app radar-mini">
          <h4>{tt("regulaTitlu")}</h4>
          <p className="radar-app-sub">{tt("regulaText")}</p>
          <p className="radar-app-nota">{tt("disclaimer")}</p>
        </div>
      </div>
    </div>
  );
}
