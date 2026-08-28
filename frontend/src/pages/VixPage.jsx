import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import Disclaimer from "../components/Disclaimer.jsx";
import { Skeleton } from "../components/Skeleton.jsx";
import { useLang } from "../i18n/index.jsx";
import { useTraduse } from "../i18n/useTraduse.js";

// Pagina de explicații a indicelui VIX — conținut educativ, descriptiv.
// Valoarea live vine din backend (Yahoo, cache 15 min); textele se traduc
// la cerere în limba interfeței.
const NIVELURI = [
  { max: 15, cheieEticheta: "nCalm", cheieText: "nCalmText", culoare: "#2e7d5b" },
  { max: 25, cheieEticheta: "nNormal", cheieText: "nNormalText", culoare: "#8a6d4e" },
  { max: 35, cheieEticheta: "nTensionat", cheieText: "nTensionatText", culoare: "#d99b73" },
  { max: Infinity, cheieEticheta: "nPanica", cheieText: "nPanicaText", culoare: "#bf4438" },
];

function nivelPentru(valoare) {
  return NIVELURI.find((n) => valoare < n.max) || NIVELURI[NIVELURI.length - 1];
}

export default function VixPage() {
  const { locale } = useLang();
  const tt = useTraduse({
    titlu: "Indicele VIX — „indicele fricii”",
    sub: "Termometrul oficial al neliniștii din piața americană, publicat de bursa CBOE.",
    azi: "Azi,",
    acum: "VIX acum",
    indisponibil: "Valoarea VIX nu e disponibilă momentan — revino în câteva minute.",
    aziSufix: "azi",
    nCalm: "Calm",
    nCalmText: "Piața se așteaptă la fluctuații mici — perioadele lungi sub 15 sunt tipice piețelor bull liniștite.",
    nNormal: "Normal",
    nNormalText: "Zona obișnuită a indicelui — volatilitate moderată, fără stres deosebit în piață.",
    nTensionat: "Tensionat",
    nTensionatText: "Investitorii plătesc scump protecția — incertitudine ridicată, adesea în jurul unor evenimente majore.",
    nPanica: "Panică",
    nPanicaText: "Niveluri atinse doar în crize (2008, martie 2020) — frică extremă și mișcări violente de preț.",
    ceEste: "Ce este VIX, de fapt?",
    ceEste1:
      "VIX (CBOE Volatility Index) măsoară cât de mari se așteaptă piața să fie fluctuațiile indicelui S&P 500 în următoarele 30 de zile. Nu e un sondaj de opinie — se calculează din prețurile reale ale opțiunilor pe S&P 500: când investitorii plătesc mai mult pentru protecție (opțiuni put), VIX crește. De aceea i se spune „indicele fricii”: e prețul pe care piața îl pune, în timp real, pe incertitudine.",
    ceEste2:
      "Relația cu bursa e de regulă inversă: când acțiunile scad brusc, VIX sare; când piețele urcă liniștit, VIX moțăie pe la 12-15. Nu e o regulă fizică — există și zile în care ambele urcă — dar corelația negativă e una dintre cele mai stabile din piețe.",
    niveluri: "Cum se citesc nivelurile",
    sub15: "sub 15",
    peste35: "peste 35",
    folosire: "Cum îl folosesc investitorii informați",
    folosire1:
      "Ca termometru de context, nu ca semnal de tranzacționare: un VIX ridicat spune că piața e agitată și mișcările zilnice vor fi ample — moment în care deciziile impulsive costă cel mai scump. Istoric, vârfurile extreme de VIX au coincis adesea cu momente de panică maximă — iar panică maximă a însemnat, retrospectiv, apropierea de minimele pieței. La fel, perioade foarte lungi de VIX amorțit au precedat uneori corecții.",
    folosire2:
      "Ce NU e VIX: o predicție a direcției. El măsoară amplitudinea așteptată a mișcărilor, nu sensul lor. Iar produsele de tranzacționare pe VIX (ETN-uri, futures) sunt instrumente complexe, cu erodare structurală, nepotrivite începătorilor.",
    lectii: "Continuă cu lecțiile despre volatilitate din Informare →",
  });
  const [vix, setVix] = useState(null);
  const [eroare, setEroare] = useState(false);

  useEffect(() => {
    api
      .getVix()
      .then(setVix)
      .catch(() => setEroare(true));
  }, []);

  const nivel = vix ? nivelPentru(vix.valoare) : null;

  return (
    <div className="portfolio-page vix-page">
      <Link to="/" className="back-link">
        ← AI Stock Radar
      </Link>

      <h1 className="page-title">{tt("titlu")}</h1>
      <p className="cash">{tt("sub")}</p>

      <section className="holdings vix-acum">
        <div className="panel-head">
          <div>
            <p className="eyebrow">
              {tt("azi")}{" "}
              {new Date().toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <h2>{tt("acum")}</h2>
          </div>
        </div>
        {eroare ? (
          <p className="empty">{tt("indisponibil")}</p>
        ) : vix === null ? (
          <Skeleton h={70} w={260} />
        ) : (
          <div className="vix-valoare-rand">
            <span className="vix-valoare">{vix.valoare.toFixed(2)}</span>
            {vix.variatie !== null && (
              <span className={vix.variatie >= 0 ? "gain-negative vix-variatie" : "gain-positive vix-variatie"}>
                {vix.variatie >= 0 ? "+" : ""}
                {vix.variatie.toFixed(1)}% {tt("aziSufix")}
              </span>
            )}
            <span className="vix-nivel" style={{ background: nivel.culoare }}>
              {tt(nivel.cheieEticheta)}
            </span>
          </div>
        )}
        {nivel && <p className="muted vix-interpretare">{tt(nivel.cheieText)}</p>}
      </section>

      <section className="holdings">
        <h2>{tt("ceEste")}</h2>
        <p className="vix-text">{tt("ceEste1")}</p>
        <p className="vix-text">{tt("ceEste2")}</p>
      </section>

      <section className="holdings">
        <h2>{tt("niveluri")}</h2>
        <ul className="vix-niveluri">
          {NIVELURI.map((n, i) => (
            <li key={n.cheieEticheta}>
              <span className="vix-nivel" style={{ background: n.culoare }}>
                {tt(n.cheieEticheta)}
              </span>
              <span className="vix-interval">
                {i === 0 ? tt("sub15") : i === NIVELURI.length - 1 ? tt("peste35") : `${NIVELURI[i - 1].max}–${n.max}`}
              </span>
              <span className="muted">{tt(n.cheieText)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="holdings">
        <h2>{tt("folosire")}</h2>
        <p className="vix-text">{tt("folosire1")}</p>
        <p className="vix-text">{tt("folosire2")}</p>
        <Link to="/informare" className="methodology-link">
          {tt("lectii")}
        </Link>
      </section>

      <Disclaimer />
    </div>
  );
}
