import { useEffect, useRef, useState } from "react";
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
  const marqueeRef = useRef(null);

  // Pe touch (mobil), banda CSS animată se bate cap în cap cu degetul: CSS-ul
  // o transformă în scroll orizontal nativ (swipe + snap), iar aici adăugăm
  // avansul automat lent — un card la ~4s — care se oprește 8s după orice
  // atingere, ca utilizatorul să poată răsfoi singur fără să se lupte cu ea.
  useEffect(() => {
    const el = marqueeRef.current;
    if (!el) return;
    const esteTouch = window.matchMedia("(pointer: coarse)").matches;
    if (!esteTouch) return;

    let pauzatPana = 0;
    let anulaAnimatia = null;
    const pauza = () => {
      pauzatPana = Date.now() + 8000;
      if (anulaAnimatia) anulaAnimatia(); // degetul are întotdeauna prioritate
    };
    el.addEventListener("touchstart", pauza, { passive: true });
    el.addEventListener("pointerdown", pauza, { passive: true });

    // scrollTo({behavior:"smooth"}) e anulat de scroll-snap pe unele
    // browsere — animăm manual scrollLeft, cadru cu cadru, până exact în
    // poziția de snap a cardului țintă, ca snap-ul să nu aibă ce corecta.
    function animeazaSpre(target) {
      const start = el.scrollLeft;
      const distanta = target - start;
      const durata = 650;
      const t0 = performance.now();
      let oprit = false;
      anulaAnimatia = () => {
        oprit = true;
      };
      function pas(t) {
        if (oprit) return;
        const p = Math.min(1, (t - t0) / durata);
        const ease = 1 - Math.pow(1 - p, 3);
        el.scrollLeft = start + distanta * ease;
        if (p < 1) requestAnimationFrame(pas);
      }
      requestAnimationFrame(pas);
    }

    const timer = setInterval(() => {
      if (Date.now() < pauzatPana) return;
      const carduri = el.querySelectorAll('.screens-set:not([aria-hidden="true"]) .screen-card');
      if (carduri.length === 0) return;
      const maxim = el.scrollWidth - el.clientWidth;
      const tintaCentrata = (card) =>
        Math.max(0, Math.min(maxim, card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2));
      // Următorul card = primul a cărui poziție de snap e clar după poziția curentă.
      let target = null;
      for (const card of carduri) {
        const pozitie = tintaCentrata(card);
        if (pozitie > el.scrollLeft + 8) {
          target = pozitie;
          break;
        }
      }
      animeazaSpre(target === null ? 0 : target); // capăt de listă → înapoi la început
    }, 4000);

    return () => {
      clearInterval(timer);
      if (anulaAnimatia) anulaAnimatia();
      el.removeEventListener("touchstart", pauza);
      el.removeEventListener("pointerdown", pauza);
    };
  }, []);

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
              style={{ top: l.top, left: l.left, width: l.size, height: l.size }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ))}
        </div>

        <h2 className="landing-section-title screens-title">{t("screens.titlu")}</h2>

        {/* Slide show continuu, lent: setul de 6 ecrane e dublat, iar banda
            translatează -50% în buclă — mișcare infinită fără salturi. */}
        <div className="screens-marquee" ref={marqueeRef}>
          <div className="screens-track">
            {[0, 1].map((setIdx) => (
              <div className="screens-set" key={setIdx} aria-hidden={setIdx === 1}>
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

                <div className="screen-card">
                  <div className="screen-topbar">
                    <span className="screen-dot" />
                    <span className="screen-dot" />
                    <span className="screen-dot" />
                    <span className="screen-topbar-title">{t("screens.grafic")}</span>
                  </div>
                  <div className="screen-body">
                    <div className="screen-stock-head">
                      <StockLogo simbol="AAPL" size={30} />
                      <div className="screen-stock-id">
                        <strong>AAPL</strong>
                        <span>Apple</span>
                      </div>
                      <div className="screen-price">
                        $232.10 <span className="gain-positive">+1.4%</span>
                      </div>
                    </div>
                    <svg viewBox="0 0 280 110" className="screen-chart" preserveAspectRatio="none" aria-hidden="true">
                      <defs>
                        <linearGradient id={`screen-grad-${setIdx}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2e7d5b" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#2e7d5b" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,85 C30,80 45,60 70,64 C95,68 110,40 140,44 C170,48 185,30 215,26 C240,23 260,18 280,12 L280,110 L0,110 Z"
                        fill={`url(#screen-grad-${setIdx})`}
                      />
                      <path
                        d="M0,85 C30,80 45,60 70,64 C95,68 110,40 140,44 C170,48 185,30 215,26 C240,23 260,18 280,12"
                        fill="none"
                        stroke="#2e7d5b"
                        strokeWidth="2.5"
                      />
                    </svg>
                    <div className="screen-range-row">
                      <span className="screen-range">1S</span>
                      <span className="screen-range screen-range-active">1L</span>
                      <span className="screen-range">6L</span>
                      <span className="screen-range">1A</span>
                    </div>
                  </div>
                </div>

                <div className="screen-card screen-card-accent">
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
                    <span className="screen-topbar-title">{t("dash.stiriRelevante")}</span>
                  </div>
                  <div className="screen-body">
                    <div className="screen-news screen-news-1">
                      <span>Reuters · {t("dash.azi")}</span>
                      <strong>{t("screens.stire1")}</strong>
                    </div>
                    <div className="screen-news screen-news-2">
                      <span>Bloomberg · {t("dash.azi")}</span>
                      <strong>{t("screens.stire2")}</strong>
                    </div>
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
                        {SCREEN_DAILY.cresteri.map((pk) => (
                          <div key={pk.simbol} className="screen-daily-row">
                            <StockLogo simbol={pk.simbol} size={22} />
                            <strong>{pk.simbol}</strong>
                            <span className="gain-positive">+{pk.val.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                      <div className="screen-daily-group">
                        <span className="screen-daily-label gain-negative">{t("dash.scaderi")}</span>
                        {SCREEN_DAILY.scaderi.map((pk) => (
                          <div key={pk.simbol} className="screen-daily-row">
                            <StockLogo simbol={pk.simbol} size={22} />
                            <strong>{pk.simbol}</strong>
                            <span className="gain-negative">{pk.val.toFixed(1)}%</span>
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

                <div className="screen-card">
                  <div className="screen-topbar">
                    <span className="screen-dot" />
                    <span className="screen-dot" />
                    <span className="screen-dot" />
                    <span className="screen-topbar-title">{t("nav.informare")}</span>
                  </div>
                  <div className="screen-body">
                    <div className="screen-edu-row">
                      <span>{t("screens.ed1")}</span>
                      <span className="screen-edu-plus">+</span>
                    </div>
                    <div className="screen-edu-row screen-edu-open">
                      <div className="screen-edu-head">
                        <span>{t("screens.ed2")}</span>
                        <span className="screen-edu-plus">−</span>
                      </div>
                      <div className="screen-edu-lines">
                        <i style={{ width: "92%" }} />
                        <i style={{ width: "78%" }} />
                        <i style={{ width: "85%" }} />
                      </div>
                      <div className="screen-edu-quiz">
                        <span className="screen-quiz-chip screen-quiz-ok">A ✓</span>
                        <span className="screen-quiz-chip">B</span>
                        <span className="screen-quiz-chip">C</span>
                      </div>
                    </div>
                    <div className="screen-edu-row">
                      <span>{t("screens.ed3")}</span>
                      <span className="screen-edu-plus">+</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
