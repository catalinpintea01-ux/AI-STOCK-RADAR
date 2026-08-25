import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import Disclaimer from "../components/Disclaimer.jsx";
import { Skeleton } from "../components/Skeleton.jsx";

// Pagina de explicații a indicelui VIX — conținut educativ, descriptiv.
// Valoarea live vine din backend (Yahoo, cache 15 min).
const NIVELURI = [
  { max: 15, eticheta: "Calm", text: "Piața se așteaptă la fluctuații mici — perioadele lungi sub 15 sunt tipice piețelor bull liniștite.", culoare: "#2e7d5b" },
  { max: 25, eticheta: "Normal", text: "Zona obișnuită a indicelui — volatilitate moderată, fără stres deosebit în piață.", culoare: "#8a6d4e" },
  { max: 35, eticheta: "Tensionat", text: "Investitorii plătesc scump protecția — incertitudine ridicată, adesea în jurul unor evenimente majore.", culoare: "#d99b73" },
  { max: Infinity, eticheta: "Panică", text: "Niveluri atinse doar în crize (2008, martie 2020) — frică extremă și mișcări violente de preț.", culoare: "#bf4438" },
];

function nivelPentru(valoare) {
  return NIVELURI.find((n) => valoare < n.max) || NIVELURI[NIVELURI.length - 1];
}

export default function VixPage() {
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

      <h1 className="page-title">Indicele VIX — „indicele fricii"</h1>
      <p className="cash">
        Termometrul oficial al neliniștii din piața americană, publicat de bursa CBOE.
      </p>

      <section className="holdings vix-acum">
        <div className="panel-head">
          <div>
            <p className="eyebrow">
              Azi,{" "}
              {new Date().toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <h2>VIX acum</h2>
          </div>
        </div>
        {eroare ? (
          <p className="empty">Valoarea VIX nu e disponibilă momentan — revino în câteva minute.</p>
        ) : vix === null ? (
          <Skeleton h={70} w={260} />
        ) : (
          <div className="vix-valoare-rand">
            <span className="vix-valoare">{vix.valoare.toFixed(2)}</span>
            {vix.variatie !== null && (
              <span className={vix.variatie >= 0 ? "gain-negative vix-variatie" : "gain-positive vix-variatie"}>
                {vix.variatie >= 0 ? "+" : ""}
                {vix.variatie.toFixed(1)}% azi
              </span>
            )}
            <span className="vix-nivel" style={{ background: nivel.culoare }}>
              {nivel.eticheta}
            </span>
          </div>
        )}
        {nivel && <p className="muted vix-interpretare">{nivel.text}</p>}
      </section>

      <section className="holdings">
        <h2>Ce este VIX, de fapt?</h2>
        <p className="vix-text">
          VIX (CBOE Volatility Index) măsoară cât de mari se așteaptă piața să fie fluctuațiile
          indicelui S&amp;P 500 în următoarele 30 de zile. Nu e un sondaj de opinie — se calculează
          din prețurile reale ale opțiunilor pe S&amp;P 500: când investitorii plătesc mai mult
          pentru protecție (opțiuni put), VIX crește. De aceea i se spune „indicele fricii": e
          prețul pe care piața îl pune, în timp real, pe incertitudine.
        </p>
        <p className="vix-text">
          Relația cu bursa e de regulă inversă: când acțiunile scad brusc, VIX sare; când piețele
          urcă liniștit, VIX moțăie pe la 12-15. Nu e o regulă fizică — există și zile în care
          ambele urcă — dar corelația negativă e una dintre cele mai stabile din piețe.
        </p>
      </section>

      <section className="holdings">
        <h2>Cum se citesc nivelurile</h2>
        <ul className="vix-niveluri">
          {NIVELURI.map((n, i) => (
            <li key={n.eticheta}>
              <span className="vix-nivel" style={{ background: n.culoare }}>
                {n.eticheta}
              </span>
              <span className="vix-interval">
                {i === 0 ? "sub 15" : i === NIVELURI.length - 1 ? "peste 35" : `${NIVELURI[i - 1].max}–${n.max}`}
              </span>
              <span className="muted">{n.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="holdings">
        <h2>Cum îl folosesc investitorii informați</h2>
        <p className="vix-text">
          Ca termometru de context, nu ca semnal de tranzacționare: un VIX ridicat spune că piața
          e agitată și mișcările zilnice vor fi ample — moment în care deciziile impulsive costă
          cel mai scump. Istoric, vârfurile extreme de VIX au coincis adesea cu momente de panică
          maximă — iar panică maximă a însemnat, retrospectiv, apropierea de minimele pieței. La
          fel, perioade foarte lungi de VIX amorțit au precedat uneori corecții.
        </p>
        <p className="vix-text">
          Ce NU e VIX: o predicție a direcției. El măsoară amplitudinea așteptată a mișcărilor, nu
          sensul lor. Iar produsele de tranzacționare pe VIX (ETN-uri, futures) sunt instrumente
          complexe, cu erodare structurală, nepotrivite începătorilor.
        </p>
        <Link to="/informare" className="methodology-link">
          Continuă cu lecțiile despre volatilitate din Informare →
        </Link>
      </section>

      <Disclaimer />
    </div>
  );
}
