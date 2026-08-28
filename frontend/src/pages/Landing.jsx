import { useState } from "react";
import { Link } from "react-router-dom";
import AnimatedNumber from "../components/AnimatedNumber.jsx";
import TypewriterText from "../components/TypewriterText.jsx";
import StockLogo from "../components/StockLogo.jsx";
import ScoreRing from "../components/ScoreRing.jsx";
import ThemeCards from "../components/ThemeCards.jsx";
import RadarSweep from "../components/RadarSweep.jsx";
import VerdictTag from "../components/VerdictTag.jsx";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";
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

const LOGO_WALL = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "GOOGL", "META", "NFLX", "JPM", "V", "KO", "DIS"];

// Fundalul secțiunii de ecrane: sigle mari, estompate, ale unor companii
// cunoscute (SpaceX nu e listată — logo-ul vine direct de pe domeniul ei).
const finnhubLogo = (s) => `https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/${s}.png`;
const SCREENS_BG = [
  { src: finnhubLogo("NVDA"), top: "6%", left: "4%", size: 110 },
  { src: "https://logo.clearbit.com/spacex.com", top: "12%", left: "44%", size: 150 },
  { src: finnhubLogo("TSLA"), top: "8%", left: "82%", size: 100 },
  { src: finnhubLogo("AAPL"), top: "58%", left: "10%", size: 90 },
  { src: finnhubLogo("MSFT"), top: "70%", left: "38%", size: 100 },
  { src: finnhubLogo("AMZN"), top: "62%", left: "66%", size: 95 },
  { src: finnhubLogo("META"), top: "30%", left: "20%", size: 85 },
  { src: finnhubLogo("GOOGL"), top: "34%", left: "72%", size: 90 },
];

// Bare de sub-scoruri din "captura" de analiză — valori demonstrative.
const SCREEN_BARS = [
  { cheie: "analisti", val: 78 },
  { cheie: "momentum", val: 84 },
  { cheie: "fundamental", val: 71 },
  { cheie: "risc", val: 32 },
];

// Coloanele din "captura" de research zilnic — valori demonstrative.
const SCREEN_DAILY = {
  cresteri: [
    { simbol: "AVGO", val: 3.2 },
    { simbol: "META", val: 2.4 },
  ],
  scaderi: [
    { simbol: "TSLA", val: -1.8 },
    { simbol: "NKE", val: -0.9 },
  ],
};

export default function Landing() {
  const { t } = useLang();
  const [openFaq, setOpenFaq] = useState(null);

  // Doar fapte reale despre produs — fără cifre de utilizatori sau venituri
  // inventate: pagina publică nu are voie să fabrice dovezi sociale.
  const stats = [
    { text: t("landing.statOrice"), label: t("landing.statOriceLabel") },
    { value: 4, label: t("landing.statSub") },
    { value: 10000, label: t("landing.statUsd") },
    { value: 7, label: t("landing.statStiri") },
  ];

  return (
    <div className="landing">
      <header className="landing-nav">
        <span className="navbar-brand">AI Stock Radar</span>
        <div className="landing-nav-actions">
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
          <p className="landing-typewriter">
            <TypewriterText phrases={t("landing.taglines")} />
          </p>
          <p className="mega-sub">{t("landing.sub")}</p>
          <div className="landing-hero-actions mega-actions">
            <Link to="/register" className="landing-cta">
              {t("landing.incepe")}
            </Link>
            <Link to="/login" className="landing-cta-secondary">
              {t("landing.amCont")}
            </Link>
          </div>
          <p className="mega-note">{t("landing.nota")}</p>
        </div>
      </section>

      <section className="landing-screens">
        <div className="screens-bg" aria-hidden="true">
          {SCREENS_BG.map((l) => (
            <img
              key={l.src}
              src={l.src}
              alt=""
              loading="lazy"
              style={{ top: l.top, left: l.left, width: l.size, height: l.size }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ))}
        </div>

        <h2 className="landing-section-title screens-title">{t("screens.titlu")}</h2>

        <div className="screens-row">
          <div className="screen-card">
            <div className="screen-topbar">
              <span className="screen-dot" />
              <span className="screen-dot" />
              <span className="screen-dot" />
              <span className="screen-topbar-title">{t("screens.analiza")}</span>
            </div>
            <div className="screen-body">
              <div className="screen-stock-head">
                <StockLogo simbol="NVDA" size={30} />
                <div className="screen-stock-id">
                  <strong>NVDA</strong>
                  <span>NVIDIA</span>
                </div>
                <div className="screen-price">
                  $217.56 <span className="gain-positive">+2.1%</span>
                </div>
              </div>
              <div className="screen-verdict-row">
                <VerdictTag verdict="optimist" />
                <ScoreRing score={78} verdict="optimist" />
              </div>
              {SCREEN_BARS.map((b) => (
                <div key={b.cheie} className="screen-score">
                  <div className="screen-score-label">
                    <span>{t(`screens.${b.cheie}`)}</span>
                    <span>{b.val}/100</span>
                  </div>
                  <div className="screen-score-track">
                    <div className="screen-score-fill" style={{ width: `${b.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="screen-card screen-card-mid">
            <div className="screen-topbar">
              <span className="screen-dot" />
              <span className="screen-dot" />
              <span className="screen-dot" />
              <span className="screen-topbar-title">{t("screens.comparator")}</span>
            </div>
            <div className="screen-body">
              <div className="screen-cmp-cols">
                <div className="screen-cmp-col">
                  <StockLogo simbol="NVDA" size={34} />
                  <strong>NVDA</strong>
                  <ScoreRing score={78} verdict="optimist" />
                </div>
                <span className="screen-vs">vs</span>
                <div className="screen-cmp-col">
                  <StockLogo simbol="TSLA" size={34} />
                  <strong>TSLA</strong>
                  <ScoreRing score={55} verdict="neutru" />
                </div>
              </div>
              <table className="screen-cmp-table">
                <tbody>
                  <tr>
                    <td className="screen-win">78</td>
                    <th>{t("dash.sortare.scor")}</th>
                    <td>55</td>
                  </tr>
                  <tr>
                    <td className="screen-win">84</td>
                    <th>{t("screens.momentum")}</th>
                    <td>62</td>
                  </tr>
                  <tr>
                    <td>67</td>
                    <th>{t("screens.analisti")}</th>
                    <td className="screen-win">71</td>
                  </tr>
                  <tr>
                    <td className="screen-win">32</td>
                    <th>{t("screens.risc")}</th>
                    <td>48</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="screen-card">
            <div className="screen-topbar">
              <span className="screen-dot" />
              <span className="screen-dot" />
              <span className="screen-dot" />
              <span className="screen-topbar-title">{t("dash.researchZilnic")}</span>
            </div>
            <div className="screen-body">
              <div className="screen-daily">
                <div className="screen-daily-group">
                  <span className="screen-daily-label gain-positive">{t("dash.cresteri")}</span>
                  {SCREEN_DAILY.cresteri.map((p) => (
                    <div key={p.simbol} className="screen-daily-row">
                      <StockLogo simbol={p.simbol} size={22} />
                      <strong>{p.simbol}</strong>
                      <span className="gain-positive">+{p.val.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
                <div className="screen-daily-group">
                  <span className="screen-daily-label gain-negative">{t("dash.scaderi")}</span>
                  {SCREEN_DAILY.scaderi.map((p) => (
                    <div key={p.simbol} className="screen-daily-row">
                      <StockLogo simbol={p.simbol} size={22} />
                      <strong>{p.simbol}</strong>
                      <span className="gain-negative">{p.val.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="screen-daily-selected">
                <StockLogo simbol="AVGO" size={26} />
                <div className="screen-stock-id">
                  <strong>AVGO</strong>
                  <span>Broadcom</span>
                </div>
                <span className="screen-follow">{t("dash.urmareste")}</span>
              </div>
            </div>
          </div>
        </div>

        <p className="landing-mockup-caption screens-caption">{t("landing.mockupCaption")}</p>
      </section>

      <section className="landing-logo-wall">
        <p className="landing-logo-wall-title">{t("landing.logoWall")}</p>
        <div className="landing-logo-wall-grid">
          {LOGO_WALL.map((s) => (
            <span key={s} className="landing-logo-chip">
              <StockLogo simbol={s} size={22} />
              {s}
            </span>
          ))}
        </div>
      </section>

      <section className="landing-stats">
        {stats.map((s) => (
          <div key={s.label} className="landing-stat">
            <span className="landing-stat-number">
              {s.text ? s.text : <AnimatedNumber value={s.value} />}
            </span>
            <span className="landing-stat-label">{s.label}</span>
          </div>
        ))}
      </section>

      <section className="landing-section">
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
        <div className="landing-radar-band">
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
              29,99 <span>{t("landing.peLuna")}</span>
            </p>
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
          <Link to="/login">{t("landing.autentificare")}</Link>
          <Link to="/register">{t("landing.creeazaCont")}</Link>
          <Link to="/termeni">{t("landing.termeni")}</Link>
          <Link to="/confidentialitate">{t("landing.confidentialitate")}</Link>
        </div>
        <p className="landing-footer-disclaimer">{t("disclaimer.footer")}</p>
      </footer>
    </div>
  );
}
