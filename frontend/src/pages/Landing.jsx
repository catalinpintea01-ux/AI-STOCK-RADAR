import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StockLogo from "../components/StockLogo.jsx";
import ThemeCards from "../components/ThemeCards.jsx";
import RadarSweep from "../components/RadarSweep.jsx";
import DemoLive from "../components/DemoLive.jsx";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import { useLang } from "../i18n/index.jsx";
import { Radar, TrendingUp, Newspaper, CalendarDays, Compass, Bell, Briefcase } from "lucide-react";

// Fotografie Unsplash aleasă manual (hotlink direct, conform termenilor API),
// cu atribuire vizibilă pe pagină.
const FOTO_CTA = {
  url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600",
  autor: "Maxim Hopman",
  autorUrl: "https://unsplash.com/@nampoh",
};

const FACT_ICONS = [Radar, TrendingUp, Newspaper, CalendarDays];
const FEATURE_ICONS = [Radar, Compass, Newspaper, CalendarDays, Bell, Briefcase];

// Companiile din peretele interactiv de sub slide show — două benzi care
// rulează în direcții opuse, cu chip-uri mari (logo + nume), click → register.
const COMPANII_R1 = [
  ["AAPL", "Apple"],
  ["MSFT", "Microsoft"],
  ["NVDA", "NVIDIA"],
  ["TSLA", "Tesla"],
  ["AMZN", "Amazon"],
  ["GOOGL", "Alphabet"],
];
const COMPANII_R2 = [
  ["META", "Meta"],
  ["NFLX", "Netflix"],
  ["JPM", "JPMorgan"],
  ["V", "Visa"],
  ["KO", "Coca-Cola"],
  ["DIS", "Disney"],
];

export default function Landing() {
  const { t } = useLang();
  const [openFaq, setOpenFaq] = useState(null);

  // Ponderile curente + acuratețea evaluărilor zilnice (public, agregat).
  // Eșec = null: secțiunea cade elegant pe valorile statice din dicționar.
  const [acuratete, setAcuratete] = useState(null);
  useEffect(() => {
    import("../api.js")
      .then(({ api }) => api.getRadarAcuratete())
      .then(setAcuratete)
      .catch(() => {});
  }, []);

  // Simulatorul scorului: 4 slidere → compozitul live, cu ponderile reale de
  // azi (sau 30/30/20/20 până sosesc). Riscul intră inversat, ca în radar.js.
  const [sim, setSim] = useState({ momentum: 62, analist: 58, fundamental: 55, risc: 40 });
  const ponderiSim = acuratete?.ponderi || { momentum: 30, analist: 30, fundamental: 20, risc: 20 };
  const scorSim = Math.round(
    (ponderiSim.momentum * sim.momentum +
      ponderiSim.analist * sim.analist +
      ponderiSim.fundamental * sim.fundamental +
      ponderiSim.risc * (100 - sim.risc)) /
      (ponderiSim.momentum + ponderiSim.analist + ponderiSim.fundamental + ponderiSim.risc)
  );
  const verdictSim = scorSim >= 60 ? "verdictOptimist" : scorSim <= 40 ? "verdictRezervat" : "verdictNeutru";

  return (
    <div className="landing">
      <header className="landing-nav">
        <span className="navbar-brand">AI Stock Radar</span>
        <div className="landing-nav-actions">
          <ThemeToggle />
          <LanguageSwitcher />
          <Link to="/login" className="landing-nav-link">
            {t("landing.autentificare")}
          </Link>
          <Link to="/register" className="landing-cta-small">
            {t("landing.incepeSimplu")}
          </Link>
        </div>
      </header>

      <section className="mega-hero">
        <RadarSweep />
        <div className="mega-hero-content">
          <span className="landing-badge">{t("landing.badge")}</span>
          <h1 className="mega-headline">
            {t("landing.heroA")}
            <span className="mega-headline-accent">{t("landing.heroAccent")}</span>
            {t("landing.heroB")}
          </h1>
          <p className="mega-sub">{t("landing.sub")}</p>

          {/* Demo-ul înlocuiește butoanele duble și caseta de statistici:
              vizitatorul vede un scor real înainte să i se ceară un cont.
              Statistica de auto-evaluare a coborât în secțiunea de încredere
              — pentru un vizitator rece, un procent scos din context citit în
              primele 3 secunde lucra împotriva noastră. */}
          <DemoLive />
        </div>
      </section>

      <section className="landing-logo-wall">
        <p className="landing-logo-wall-title">{t("landing.logoWall")}</p>
        {[COMPANII_R1, COMPANII_R2].map((rand, idxRand) => (
          <div key={idxRand} className={`logo-marquee ${idxRand === 1 ? "logo-marquee-rev" : ""}`}>
            <div className="logo-marquee-track">
              {[0, 1].map((dup) => (
                <div className="logo-marquee-set" key={dup} aria-hidden={dup === 1}>
                  {rand.map(([simbol, nume]) => (
                    <Link key={simbol} to="/register" className="logo-chip-mare">
                      <StockLogo simbol={simbol} size={36} />
                      <span className="logo-chip-nume">
                        <strong>{simbol}</strong>
                        <span>{nume}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="landing-why">
        <p className="landing-why-1">{t("whyUs1")}</p>
        <p className="landing-why-2">{t("whyUs2")}</p>
      </section>

      <section className="landing-section" id="cum-functioneaza">
        <h2 className="landing-section-title">{t("landing.cumTitlu")}</h2>
        <div className="landing-steps">
          {t("landing.pasi").map((s, i) => (
            <div key={s.titlu} className="landing-step">
              <span className="landing-step-number">{i + 1}</span>
              <h3>{s.titlu}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <h2 className="landing-section-title">{t("landing.featuresTitlu")}</h2>
        <div className="landing-features">
          {t("landing.features").map((f, i) => {
            const Icon = FEATURE_ICONS[i] || Radar;
            return (
              <div key={f.titlu} className="landing-feature">
                <span className="landing-feature-icon"><Icon size={20} /></span>
                <h3>{f.titlu}</h3>
                <p>{f.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="landing-section">
        <h2 className="landing-section-title">{t("landing.temeTitlu")}</h2>
        <ThemeCards variant="public" />
      </section>

      <section className="landing-section">
        <h2 className="landing-section-title">{t("landing.preturiTitlu")}</h2>
        <div className="landing-pricing">
          <div className="landing-plan">
            <h3>{t("landing.gratuit")}</h3>
            <p className="landing-plan-price">
              0 <span>RON</span>
            </p>
            <ul>
              {t("landing.freeFeatures").map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
            <Link to="/register" className="landing-cta-secondary landing-plan-cta">
              {t("landing.incepeSimplu")}
            </Link>
          </div>
          <div className="landing-plan landing-plan-featured">
            <span className="landing-plan-badge">{t("landing.celMaiPopular")}</span>
            <h3>Premium</h3>
            <p className="landing-plan-price">
              $29 <span>{t("landing.peLuna")}</span>
            </p>
            <p className="landing-plan-oferta">{t("landing.sauAnual")}</p>
            <ul>
              {t("landing.premiumFeatures").map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
            <Link to="/register" className="landing-cta landing-plan-cta">
              {t("landing.incepePremium")}
            </Link>
          </div>
        </div>
      </section>

      <section className="landing-section landing-radar-wrap">
        <div className="landing-radar-band landing-radar-full">
          <div className="landing-radar-top">
            <img src="/mascota/mascota-hero.png" alt="Mascota StockRadar AI" className="mascota mascota-band" loading="lazy" />
            <div className="landing-radar-text">
              <h2 className="landing-section-title landing-radar-title">{t("landing.radarTitlu")}</h2>
              <ul className="landing-radar-facts">
                {t("landing.facts").map((text, i) => {
                  const Icon = FACT_ICONS[i] || Radar;
                  return (
                    <li key={text}>
                      <span className="landing-fact-icon"><Icon size={16} /></span>
                      {text}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="landing-invata">
              <h3>{t("landing.invataTitlu")}</h3>
              <p>{t("landing.invataText")}</p>
              {acuratete?.procent != null && acuratete.total >= 20 ? (
                <p className="landing-invata-stat">
                  {t("landing.invataStat")
                    .replace("{procent}", String(acuratete.procent))
                    .replace("{n}", String(acuratete.total))}
                </p>
              ) : (
                <p className="landing-invata-stat landing-invata-colectare">{t("landing.invataColectare")}</p>
              )}
              <p className="landing-invata-disclaimer">{t("landing.invataDisclaimer")}</p>
            </div>
          </div>

          <h3 className="landing-piloni-titlu">{t("landing.piloniTitlu")}</h3>
          <div className="landing-piloni">
            {t("landing.piloni").map((p, i) => {
              const chei = ["momentum", "analist", "fundamental", "risc"];
              const pondere = acuratete?.ponderi?.[chei[i]];
              return (
                <div key={p.titlu} className="landing-pilon">
                  <div className="landing-pilon-head">
                    <span className="landing-pilon-nume">{p.titlu}</span>
                    <span className="landing-pilon-pondere">{pondere ?? [30, 30, 20, 20][i]}%</span>
                  </div>
                  <p>{p.text}</p>
                </div>
              );
            })}
          </div>
          <p className="landing-piloni-nota">{t("landing.ponderiNota")}</p>

          <h3 className="landing-piloni-titlu landing-apps-titlu">{t("landing.appsTitlu")}</h3>
          <div className="landing-radar-apps">
            {/* App 1: simulatorul scorului — slidere → compozit live */}
            <div className="radar-app">
              <h4>{t("landing.simTitlu")}</h4>
              <p className="radar-app-sub">{t("landing.simText")}</p>
              {t("landing.piloni").map((p, i) => {
                const chei = ["momentum", "analist", "fundamental", "risc"];
                const cheie = chei[i];
                return (
                  <label key={cheie} className="sim-rand">
                    <span className="sim-nume">{p.titlu}</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sim[cheie]}
                      onChange={(e) => setSim({ ...sim, [cheie]: Number(e.target.value) })}
                    />
                    <span className="sim-val">{sim[cheie]}</span>
                  </label>
                );
              })}
              <div className="sim-rezultat">
                <span>{t("landing.simScorLabel")}</span>
                <strong>{scorSim}</strong>
                <em className={`sim-verdict sim-${verdictSim}`}>{t("landing." + verdictSim)}</em>
              </div>
            </div>

            {/* App 2: auto-evaluările pe zile — bare cu rata de potrivire */}
            <div className="radar-app">
              <h4>{t("landing.zileTitlu")}</h4>
              {acuratete?.zile?.length > 0 ? (
                <div className="zile-grafic">
                  {[...acuratete.zile].reverse().map((z) => (
                    <div
                      key={z.zi}
                      className="zile-bara-wrap"
                      title={`${z.zi}: ${z.potriviri} ${t("landing.accDin")} ${z.total}`}
                    >
                      <div
                        className="zile-bara"
                        style={{ height: `${Math.max(8, Math.round((z.potriviri / Math.max(z.total, 1)) * 100))}%` }}
                      />
                      <span className="zile-eticheta">{z.zi.slice(8)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="radar-app-sub">{t("landing.zileGol")}</p>
              )}
            </div>

            {/* App 3: acuratețea pe tip de verdict — bare de umplere */}
            <div className="radar-app">
              <h4>{t("landing.accTitlu")}</h4>
              {["optimist", "neutru", "rezervat"].map((v) => {
                const d = acuratete?.perVerdict?.[v];
                const cheieVerdict = v === "optimist" ? "verdictOptimist" : v === "neutru" ? "verdictNeutru" : "verdictRezervat";
                const procent = d && d.total > 0 ? Math.round((d.potriviri / d.total) * 100) : null;
                return (
                  <div key={v} className="acc-rand">
                    <span className="acc-nume">{t("landing." + cheieVerdict)}</span>
                    <div className="acc-bara-fundal">
                      <div className="acc-bara" style={{ width: `${procent ?? 0}%` }} />
                    </div>
                    <span className="acc-val">
                      {procent !== null ? `${d.potriviri} ${t("landing.accDin")} ${d.total}` : "—"}
                    </span>
                  </div>
                );
              })}
              <p className="radar-app-nota">{t("landing.invataDisclaimer")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <h2 className="landing-section-title">{t("landing.faqTitlu")}</h2>
        <div className="landing-faq">
          {t("landing.faq").map((item, i) => (
            <div key={item.q} className="landing-faq-item">
              <button
                type="button"
                className="landing-faq-question"
                aria-expanded={openFaq === i}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                {item.q}
                <span className="landing-faq-chevron">{openFaq === i ? "−" : "+"}</span>
              </button>
              {openFaq === i && <p className="landing-faq-answer">{item.a}</p>}
            </div>
          ))}
        </div>
      </section>

      <section
        className="landing-final-cta landing-final-cta-photo"
        style={{
          backgroundImage: `linear-gradient(rgba(18, 17, 15, 0.84), rgba(18, 17, 15, 0.92)), url(${FOTO_CTA.url})`,
        }}
      >
        <h2>{t("landing.finalTitlu")}</h2>
        <p>{t("landing.finalText")}</p>
        <Link to="/register" className="landing-cta">
          {t("landing.incepe")}
        </Link>
        <p className="landing-photo-credit landing-photo-credit-dark">
          {t("landing.foto")}{" "}
          <a href={FOTO_CTA.autorUrl} target="_blank" rel="noopener noreferrer">
            {FOTO_CTA.autor}
          </a>{" "}
          / <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a>
        </p>
      </section>

      <footer className="landing-footer">
        <span className="navbar-brand">AI Stock Radar</span>
        <div className="landing-footer-links">
          <Link to="/despre">{t("fDespre")}</Link>
          <a href="mailto:contact@stockradarai.com">{t("fContact")}</a>
          <Link to="/termeni">{t("landing.termeni")}</Link>
          <Link to="/confidentialitate">{t("landing.confidentialitate")}</Link>
          <Link to="/risc">{t("fRisc")}</Link>
        </div>
        <div className="landing-footer-links">
          <Link to="/login">{t("landing.autentificare")}</Link>
          <Link to="/register">{t("landing.creeazaCont")}</Link>
        </div>
        <p className="landing-footer-disclaimer">
          {t("disclaimer.footer")} {t("disclaimerRisc")}
        </p>
      </footer>
    </div>
  );
}
