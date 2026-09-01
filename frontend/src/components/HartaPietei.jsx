import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
// "Map as IconHarta": importul gol ("Map") ar umbri constructorul global Map
// folosit mai jos la grupare — și ar crăpa întreaga pagină.
import { Map as IconHarta, Flame, TrendingUp, TrendingDown } from "lucide-react";
import { useLang } from "../i18n/index.jsx";
import { useTraduse } from "../i18n/useTraduse.js";

// Harta pieței (stil Finviz/SimplyWall.st): tot universul de acțiuni ca un
// mozaic pe sectoare — dimensiunea plăcii = capitalizarea companiei, culoarea
// = variația zilei (verde/roșu, convenția de preț) sau scorul AI (bronz,
// paleta neutră a verdictelor — NICIODATĂ verde/roșu, ca să nu pară semnal
// de tranzacționare). Click pe placă → analiza acțiunii.
// Deasupra mozaicului: "Pulsul pieței" (sinteza zilei + extremele) și
// chip-urile de sector (filtru cu un click, cu media fiecărui sector).

// Praguri de capitalizare (milioane USD) → 4 dimensiuni de plăci.
function nivelCap(cap) {
  if (typeof cap !== "number") return 3;
  if (cap >= 500000) return 1; // mega (>500 mld)
  if (cap >= 100000) return 2; // mare
  if (cap >= 20000) return 3; // medie
  return 4;
}

function culoareVariatie(v) {
  const intensitate = Math.min(Math.abs(v) / 3, 1); // ±3% = saturație maximă
  const alpha = 0.16 + 0.72 * intensitate;
  const baza = v >= 0 ? "46,125,91" : "191,68,56"; // --price-up / --price-down
  return { fundal: `rgba(${baza},${alpha})`, alb: alpha > 0.45 };
}

function culoareScor(scor) {
  if (typeof scor !== "number") return { fundal: "rgba(130,121,106,0.14)", alb: false };
  const alpha = 0.12 + 0.75 * (scor / 100);
  return { fundal: `rgba(138,109,78,${alpha})`, alb: alpha > 0.5 }; // bronzul temei
}

// Modul "Mișcări mari": doar |variația| ≥ 2% primește culoare — restul
// rămâne stins, ca mutările neobișnuite să sară în ochi.
const PRAG_EXTREME = 2;
function culoareExtreme(v) {
  if (Math.abs(v) < PRAG_EXTREME) return { fundal: "rgba(130,121,106,0.10)", alb: false, stins: true };
  return culoareVariatie(v);
}

export default function HartaPietei() {
  const { t } = useLang();
  const tt = useTraduse({
    eyebrow: "Tot universul, dintr-o privire",
    titlu: "Harta pieței",
    sub: "Fiecare placă e o acțiune: mărimea = capitalizarea companiei, culoarea = ce alegi mai jos. Apasă pe o placă pentru analiza completă.",
    modVariatie: "Variația zilei",
    modScor: "Scor AI",
    modExtreme: "Mișcări mari",
    legendaScadere: "scădere",
    legendaCrestere: "creștere",
    legendaScorMic: "scor mic",
    legendaScorMare: "scor mare",
    neanalizat: "gri = neanalizat încă",
    legendaExtreme: "colorat = mișcare de peste 2% azi",
    pulsUrca: "urcă",
    pulsCoboara: "coboară",
    pulsMedie: "media zilei",
    toate: "Toate",
  });
  const numeSector = (s) => {
    const v = t("sectoare." + s);
    return typeof v === "string" && v.startsWith("sectoare.") ? s : v;
  };

  const [actiuni, setActiuni] = useState(null);
  const [mod, setMod] = useState("variatie");
  const [sectorActiv, setSectorActiv] = useState(null); // null = toate

  // Reîncercări cu pauze crescătoare: un backend abia pornit (cache rece)
  // poate răspunde greu la primul apel — harta apare când datele sunt gata,
  // în loc să dispară definitiv la prima eroare.
  useEffect(() => {
    let anulat = false;
    let timer = null;
    const incearca = (ramase) => {
      api
        .getHarta()
        .then((data) => {
          if (!anulat) setActiuni(data.actiuni);
        })
        .catch(() => {
          if (!anulat && ramase > 0) {
            timer = setTimeout(() => incearca(ramase - 1), (4 - ramase) * 6000);
          } else if (!anulat) {
            setActiuni([]);
          }
        });
    };
    incearca(3);
    return () => {
      anulat = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const sectoare = useMemo(() => {
    if (!actiuni) return [];
    const grupuri = new Map();
    for (const a of actiuni) {
      if (!grupuri.has(a.sector)) grupuri.set(a.sector, []);
      grupuri.get(a.sector).push(a);
    }
    // Sectoarele mari primele; în interior, companiile mari primele.
    const totalCap = (lista) => lista.reduce((s, a) => s + (a.cap || 0), 0);
    return [...grupuri.entries()]
      .sort((a, b) => totalCap(b[1]) - totalCap(a[1]))
      .map(([sector, lista]) => ({
        sector,
        lista: lista.sort((a, b) => (b.cap || 0) - (a.cap || 0)),
        medie: lista.reduce((s, a) => s + (a.variatieProcent || 0), 0) / lista.length,
      }));
  }, [actiuni]);

  // "Pulsul pieței": sinteza zilei calculată din aceleași date — zero apeluri.
  const puls = useMemo(() => {
    if (!actiuni || actiuni.length === 0) return null;
    const urca = actiuni.filter((a) => a.variatieProcent > 0).length;
    const medie = actiuni.reduce((s, a) => s + (a.variatieProcent || 0), 0) / actiuni.length;
    const best = actiuni.reduce((m, a) => (a.variatieProcent > m.variatieProcent ? a : m));
    const worst = actiuni.reduce((m, a) => (a.variatieProcent < m.variatieProcent ? a : m));
    return { urca, coboara: actiuni.length - urca, medie, best, worst };
  }, [actiuni]);

  if (actiuni === null || actiuni.length === 0) return null;

  const sectoareVizibile = sectorActiv ? sectoare.filter((s) => s.sector === sectorActiv) : sectoare;

  const fmt = (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

  return (
    <section className="panel harta-panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">{tt("eyebrow")}</p>
          <h2><IconHarta size={16} className="h2-ic" /> {tt("titlu")}</h2>
        </div>
        <div className="harta-moduri">
          <button
            type="button"
            className={mod === "variatie" ? "active" : ""}
            aria-pressed={mod === "variatie"}
            onClick={() => setMod("variatie")}
          >
            {tt("modVariatie")}
          </button>
          <button
            type="button"
            className={mod === "extreme" ? "active" : ""}
            aria-pressed={mod === "extreme"}
            onClick={() => setMod("extreme")}
          >
            <Flame size={12} className="harta-mod-ic" /> {tt("modExtreme")}
          </button>
          <button
            type="button"
            className={mod === "scor" ? "active" : ""}
            aria-pressed={mod === "scor"}
            onClick={() => setMod("scor")}
          >
            {tt("modScor")}
          </button>
        </div>
      </div>

      {puls && (
        <div className="harta-puls">
          <span className="harta-puls-item">
            <TrendingUp size={14} className="harta-puls-up" />
            <strong>{puls.urca}</strong> {tt("pulsUrca")}
          </span>
          <span className="harta-puls-item">
            <TrendingDown size={14} className="harta-puls-down" />
            <strong>{puls.coboara}</strong> {tt("pulsCoboara")}
          </span>
          <span className="harta-puls-item">
            {tt("pulsMedie")}: <strong className={puls.medie >= 0 ? "harta-puls-vup" : "harta-puls-vdown"}>{fmt(puls.medie)}</strong>
          </span>
          <span className="harta-puls-sep" aria-hidden="true" />
          <Link to={`/stock/${puls.best.simbol}`} className="harta-puls-chip harta-puls-best">
            {puls.best.simbol} {fmt(puls.best.variatieProcent)}
          </Link>
          <Link to={`/stock/${puls.worst.simbol}`} className="harta-puls-chip harta-puls-worst">
            {puls.worst.simbol} {fmt(puls.worst.variatieProcent)}
          </Link>
        </div>
      )}

      <div className="harta-filtru-sectoare">
        <button
          type="button"
          className={`harta-sector-chip ${sectorActiv === null ? "active" : ""}`}
          onClick={() => setSectorActiv(null)}
        >
          {tt("toate")}
        </button>
        {sectoare.map((s) => (
          <button
            key={s.sector}
            type="button"
            className={`harta-sector-chip ${sectorActiv === s.sector ? "active" : ""}`}
            onClick={() => setSectorActiv(sectorActiv === s.sector ? null : s.sector)}
          >
            <span
              className="harta-sector-punct"
              style={{ background: culoareVariatie(s.medie).fundal }}
            />
            {numeSector(s.sector)}
            <em>{fmt(s.medie)}</em>
          </button>
        ))}
      </div>

      <div className="harta-sectoare" key={`${mod}-${sectorActiv || "toate"}`}>
        {sectoareVizibile.map(({ sector, lista }) => (
          <div key={sector} className="harta-sector">
            <span className="harta-sector-titlu">{numeSector(sector)}</span>
            <div className="harta-placi">
              {lista.map((a) => {
                const c =
                  mod === "variatie"
                    ? culoareVariatie(a.variatieProcent)
                    : mod === "extreme"
                      ? culoareExtreme(a.variatieProcent)
                      : culoareScor(a.scor);
                const valoare =
                  mod === "scor"
                    ? typeof a.scor === "number"
                      ? a.scor
                      : "—"
                    : `${a.variatieProcent >= 0 ? "+" : ""}${a.variatieProcent.toFixed(1)}%`;
                return (
                  <Link
                    key={a.simbol}
                    to={`/stock/${a.simbol}`}
                    className={`harta-tile harta-n${nivelCap(a.cap)} ${c.alb ? "harta-tile-alb" : ""} ${c.stins ? "harta-tile-stins" : ""}`}
                    style={{ background: c.fundal }}
                    title={`${a.nume} · ${a.variatieProcent >= 0 ? "+" : ""}${a.variatieProcent.toFixed(2)}%${typeof a.scor === "number" ? ` · Scor AI ${a.scor}` : ""}`}
                  >
                    <strong>{a.simbol}</strong>
                    <span>{valoare}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="harta-legenda">
        {mod === "scor" ? (
          <>
            <span className="harta-legenda-chip" style={{ background: "rgba(138,109,78,0.15)" }} />
            <span className="muted">{tt("legendaScorMic")}</span>
            <span className="harta-legenda-bara harta-legenda-scor" />
            <span className="muted">{tt("legendaScorMare")}</span>
            <span className="harta-legenda-chip" style={{ background: "rgba(138,109,78,0.87)" }} />
            <span className="muted harta-legenda-nota">· {tt("neanalizat")}</span>
          </>
        ) : mod === "extreme" ? (
          <span className="muted">{tt("legendaExtreme")}</span>
        ) : (
          <>
            <span className="harta-legenda-chip" style={{ background: "rgba(191,68,56,0.8)" }} />
            <span className="muted">{tt("legendaScadere")}</span>
            <span className="harta-legenda-bara harta-legenda-variatie" />
            <span className="muted">{tt("legendaCrestere")}</span>
            <span className="harta-legenda-chip" style={{ background: "rgba(46,125,91,0.8)" }} />
          </>
        )}
      </div>
    </section>
  );
}
