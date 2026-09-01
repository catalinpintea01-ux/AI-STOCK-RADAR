import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import RadarPrint from "./RadarPrint.jsx";
import { useTraduse } from "../i18n/useTraduse.js";

// "Amprenta watchlist-ului" — panou lat, în stilul Radar Center: spider-ul
// existent + 12 funcții calculate exclusiv din datele deja încărcate
// (items + earnings vin ca props; harta — un singur apel, servit din cache —
// dă sectorul și variația zilei pentru simbolurile urmărite).

export default function FootprintCenter({ items, earnings }) {
  const tt = useTraduse({
    titlu: "Amprenta watchlist-ului tău",
    sub: "Forma agregată a întregii tale liste — scoruri, sectoare, mișcări și ce urmează.",
    mediiTitlu: "Mediile pe piloni",
    pAnalisti: "Analiști",
    pMomentum: "Momentum",
    pFundamente: "Fundamente",
    pRisc: "Risc",
    scorTitlu: "Scorul mediu",
    verdicteTitlu: "Distribuția verdictelor",
    vOptimist: "optimist",
    vNeutru: "neutru",
    vRezervat: "rezervat",
    topTitlu: "Cele mai puternice scoruri",
    slabTitlu: "De ținut sub observație",
    miscariTitlu: "Mișcarea scorurilor",
    miscariUrca: "au urcat",
    miscariCoboara: "au coborât",
    miscariSalt: "cel mai mare salt",
    sectoareTitlu: "Sectoarele tale",
    sectoareDiv: "diversificare",
    sectoareNr: "sectoare",
    aziTitlu: "Azi în watchlist",
    aziVerde: "pe verde",
    aziRosu: "pe roșu",
    aziMiscat: "cel mai mișcat",
    incredereTitlu: "Încrederea analizelor",
    incRidicata: "ridicată",
    incMedie: "medie",
    incScazuta: "scăzută",
    raportariTitlu: "Următoarele raportări",
    raportariZile: "zile",
    raportariAzi: "azi",
    raportariGol: "Nicio raportare programată în listă.",
    neanalizateTitlu: "Neanalizate încă",
    neanalizateText: "Deschide-le pagina sau folosește „Analizează tot” — radarul le calculează scorul.",
    disclaimer: "Sinteze descriptive ale listei tale — nu recomandări de investiții.",
  });

  const [harta, setHarta] = useState(null); // simbol -> {sector, variatieProcent}
  useEffect(() => {
    api
      .getHarta()
      .then((d) => {
        const m = {};
        for (const a of d.actiuni || []) m[a.simbol] = { sector: a.sector, variatie: a.variatieProcent };
        setHarta(m);
      })
      .catch(() => {});
  }, []);

  const date = useMemo(() => {
    const analizate = items.filter((i) => i.radar);
    if (analizate.length === 0) return null;
    const medie = (f) => Math.round(analizate.reduce((s, i) => s + f(i.radar), 0) / analizate.length);

    const sortate = [...analizate].sort((a, b) => b.radar.scorCompozit - a.radar.scorCompozit);
    const cuSchimbare = analizate.filter((i) => i.schimbare && typeof i.schimbare.deltaCompozit === "number");
    const urcat = cuSchimbare.filter((i) => i.schimbare.deltaCompozit > 0).length;
    const coborat = cuSchimbare.filter((i) => i.schimbare.deltaCompozit < 0).length;
    const salt = cuSchimbare.length
      ? cuSchimbare.reduce((m, i) => (Math.abs(i.schimbare.deltaCompozit) > Math.abs(m.schimbare.deltaCompozit) ? i : m))
      : null;

    const sectoare = {};
    let verzi = 0;
    let rosii = 0;
    let miscat = null;
    if (harta) {
      for (const i of items) {
        const h = harta[i.simbol];
        if (!h) continue;
        sectoare[h.sector] = (sectoare[h.sector] || 0) + 1;
        if (h.variatie > 0) verzi += 1;
        else if (h.variatie < 0) rosii += 1;
        if (!miscat || Math.abs(h.variatie) > Math.abs(harta[miscat].variatie)) miscat = i.simbol;
      }
    }
    const topSectoare = Object.entries(sectoare).sort((a, b) => b[1] - a[1]).slice(0, 3);

    const incredere = { ridicata: 0, medie: 0, scazuta: 0 };
    for (const i of analizate) if (incredere[i.radar.incredere] !== undefined) incredere[i.radar.incredere] += 1;

    const urmatoarele = (earnings || [])
      .map((e) => ({ ...e, zile: Math.max(0, Math.ceil((new Date(e.data) - Date.now()) / 86400000)) }))
      .sort((a, b) => a.zile - b.zile)
      .slice(0, 3);

    return {
      analizate,
      neanalizate: items.length - analizate.length,
      medii: {
        analisti: medie((r) => r.scorAnalist),
        momentum: medie((r) => r.scorMomentum),
        fundamental: medie((r) => r.scorFundamental),
        risc: medie((r) => r.scorRisc),
        compozit: medie((r) => r.scorCompozit),
      },
      verdicte: {
        optimist: analizate.filter((i) => i.radar.verdict === "optimist").length,
        neutru: analizate.filter((i) => i.radar.verdict === "neutru").length,
        rezervat: analizate.filter((i) => i.radar.verdict === "rezervat").length,
      },
      top3: sortate.slice(0, 3),
      slabe3: sortate.slice(-3).reverse(),
      urcat,
      coborat,
      salt,
      topSectoare,
      nrSectoare: Object.keys(sectoare).length,
      verzi,
      rosii,
      miscat: miscat ? { simbol: miscat, variatie: harta[miscat].variatie } : null,
      incredere,
      urmatoarele,
    };
  }, [items, harta, earnings]);

  if (!date) return null;

  const fmt = (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
  const chipScor = (i) => (
    <Link key={i.simbol} to={`/stock/${i.simbol}`} className="harta-puls-chip footprint-chip">
      {i.simbol} <em>{i.radar.scorCompozit}</em>
    </Link>
  );

  return (
    <section className="panel radar-center-panel">
      <div className="radar-center">
        <div className="radar-center-head">
          <div className="footprint-spider">
            <RadarPrint
              analisti={date.medii.analisti}
              momentum={date.medii.momentum}
              fundamental={date.medii.fundamental}
              risc={date.medii.risc}
            />
          </div>
          <div>
            <h2>{tt("titlu")}</h2>
            <p>{tt("sub")}</p>
            <p className="radar-center-stat">
              {tt("scorTitlu")}: <strong>{date.medii.compozit}</strong> · {date.analizate.length}/{items.length}
            </p>
          </div>
        </div>

        <div className="radar-center-grid">
          {/* Mediile pe piloni */}
          <div className="radar-app radar-mini">
            <h4>{tt("mediiTitlu")}</h4>
            {[
              [tt("pAnalisti"), date.medii.analisti],
              [tt("pMomentum"), date.medii.momentum],
              [tt("pFundamente"), date.medii.fundamental],
              [tt("pRisc"), date.medii.risc],
            ].map(([nume, val]) => (
              <div key={nume} className="acc-rand">
                <span className="acc-nume">{nume}</span>
                <div className="acc-bara-fundal">
                  <div className="acc-bara" style={{ width: `${val}%` }} />
                </div>
                <span className="acc-val">{val}</span>
              </div>
            ))}
          </div>

          {/* Distribuția verdictelor */}
          <div className="radar-app radar-mini">
            <h4>{tt("verdicteTitlu")}</h4>
            {[
              [tt("vOptimist"), date.verdicte.optimist],
              [tt("vNeutru"), date.verdicte.neutru],
              [tt("vRezervat"), date.verdicte.rezervat],
            ].map(([nume, n]) => (
              <div key={nume} className="acc-rand">
                <span className="acc-nume">{nume}</span>
                <div className="acc-bara-fundal">
                  <div className="acc-bara" style={{ width: `${(n / date.analizate.length) * 100}%` }} />
                </div>
                <span className="acc-val">{n}</span>
              </div>
            ))}
            {date.neanalizate > 0 && (
              <p className="radar-app-nota">
                {tt("neanalizateTitlu")}: {date.neanalizate} · {tt("neanalizateText")}
              </p>
            )}
          </div>

          {/* Top / slabe */}
          <div className="radar-app radar-mini">
            <h4>{tt("topTitlu")}</h4>
            <div className="radar-extreme">{date.top3.map(chipScor)}</div>
            <p className="radar-app-sub radar-extreme-titlu">{tt("slabTitlu")}</p>
            <div className="radar-extreme">{date.slabe3.map(chipScor)}</div>
          </div>

          {/* Mișcarea scorurilor */}
          <div className="radar-app radar-mini">
            <h4>{tt("miscariTitlu")}</h4>
            <p className="radar-cifra-rand">
              <strong className="harta-puls-vup">{date.urcat}</strong> {tt("miscariUrca")} ·{" "}
              <strong className="harta-puls-vdown">{date.coborat}</strong> {tt("miscariCoboara")}
            </p>
            {date.salt && (
              <p className="radar-cifra-rand">
                {tt("miscariSalt")}:{" "}
                <Link to={`/stock/${date.salt.simbol}`} className="radar-vix-link">
                  {date.salt.simbol} {date.salt.schimbare.deltaCompozit > 0 ? "+" : ""}
                  {date.salt.schimbare.deltaCompozit}
                </Link>
              </p>
            )}
          </div>

          {/* Sectoarele tale */}
          <div className="radar-app radar-mini">
            <h4>{tt("sectoareTitlu")}</h4>
            {date.topSectoare.map(([sector, n]) => (
              <div key={sector} className="acc-rand">
                <span className="acc-nume">{sector}</span>
                <div className="acc-bara-fundal">
                  <div className="acc-bara" style={{ width: `${(n / items.length) * 100}%` }} />
                </div>
                <span className="acc-val">{n}</span>
              </div>
            ))}
            <p className="radar-app-nota">
              {tt("sectoareDiv")}: {date.nrSectoare} {tt("sectoareNr")}
            </p>
          </div>

          {/* Azi în watchlist */}
          <div className="radar-app radar-mini">
            <h4>{tt("aziTitlu")}</h4>
            <p className="radar-cifra-rand">
              <strong className="harta-puls-vup">{date.verzi}</strong> {tt("aziVerde")} ·{" "}
              <strong className="harta-puls-vdown">{date.rosii}</strong> {tt("aziRosu")}
            </p>
            {date.miscat && (
              <p className="radar-cifra-rand">
                {tt("aziMiscat")}:{" "}
                <Link to={`/stock/${date.miscat.simbol}`} className="radar-vix-link">
                  {date.miscat.simbol} {fmt(date.miscat.variatie)}
                </Link>
              </p>
            )}
          </div>

          {/* Încrederea analizelor */}
          <div className="radar-app radar-mini">
            <h4>{tt("incredereTitlu")}</h4>
            {[
              [tt("incRidicata"), date.incredere.ridicata],
              [tt("incMedie"), date.incredere.medie],
              [tt("incScazuta"), date.incredere.scazuta],
            ].map(([nume, n]) => (
              <div key={nume} className="acc-rand">
                <span className="acc-nume">{nume}</span>
                <div className="acc-bara-fundal">
                  <div className="acc-bara" style={{ width: `${(n / date.analizate.length) * 100}%` }} />
                </div>
                <span className="acc-val">{n}</span>
              </div>
            ))}
          </div>

          {/* Următoarele raportări */}
          <div className="radar-app radar-mini">
            <h4>{tt("raportariTitlu")}</h4>
            {date.urmatoarele.length > 0 ? (
              date.urmatoarele.map((e) => (
                <p key={`${e.simbol}-${e.data}`} className="radar-cifra-rand">
                  <Link to={`/stock/${e.simbol}`} className="radar-vix-link">{e.simbol}</Link>
                  <span>
                    {e.zile === 0 ? tt("raportariAzi") : `${e.zile} ${tt("raportariZile")}`}
                  </span>
                </p>
              ))
            ) : (
              <p className="radar-app-sub">{tt("raportariGol")}</p>
            )}
            <p className="radar-app-nota">{tt("disclaimer")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
