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
  // o transformă în scroll orizontal nativ (swipe cu inerție), iar aici o
  // împingem CONTINUU și lent (~22px/s, ca pe desktop). Setul e dublat, deci
  // când trecem de jumătate revenim cu exact o jumătate — buclă fără salturi.
  // Orice atingere oprește mișcarea 4s; apoi reia de unde a lăsat-o degetul.
  useEffect(() => {
    const el = marqueeRef.current;
    if (!el) return;
    const esteTouch = window.matchMedia("(pointer: coarse)").matches;
    if (!esteTouch) return;

    let pauzatPana = 0;
    const pauza = () => {
      pauzatPana = Date.now() + 4000;
    };
    el.addEventListener("touchstart", pauza, { passive: true });
    el.addEventListener("pointerdown", pauza, { passive: true });

    let rafId;
    let rest = 0; // fracțiunile de pixel se acumulează, altfel viteza mică s-ar pierde la rotunjire
    let ultim = performance.now();
    function pas(t) {
      const dt = Math.min(100, t - ultim);
      ultim = t;
      if (Date.now() >= pauzatPana) {
        rest += dt * 0.022; // ~22px/s
        const intregi = Math.floor(rest);
        if (intregi > 0) {
          rest -= intregi;
          const jumatate = el.scrollWidth / 2;
          let nou = el.scrollLeft + intregi;
          if (jumatate > 0 && nou >= jumatate) nou -= jumatate;
          el.scrollLeft = nou;
        }
      }
      rafId = requestAnimationFrame(pas);
    }
    rafId = requestAnimationFrame(pas);

    return () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener("touchstart", pauza);
      el.removeEventListener("pointerdown", pauza);
    };
  }, []);

  // Doar fapte reale despre produs — fără cifre de utilizatori sau venituri
  // inventate: pagina publică nu are voie să fabrice dovezi sociale.
  const stats = [
    { text: t("landing.statOrice"), label: t("landing.statOriceLabel") },
    { value: 4, label: t("landing.statSub") },
    { value: 7, label: t("landing.statStiri") },
    { value: 10, label: t("landing.statLimbi") },
    { value: 50, label: t("landing.statEducatie") },
    { value: 6, label: t("landing.statOre") },
  ];

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
          <a href="#cum-functioneaza" className="hero-cum-link">
            {t("heroCum")}
          </a>
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
                {/* 1. Analiza acțiunii: verdict + delta + sub-scoruri + factori */}
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
                    <div className="screen-delta">
                      <span className="gain-positive">▲ +5</span> {t("dash.ceSaSchimbat")}
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
                    <div className="screen-factori">
                      <span>{t("dash.factori.momentumPoz")}</span>
                      <span>{t("dash.factori.riscPoz")}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Graficul de preț: crosshair + tooltip + bare de volum + LIVE */}
                <div className="screen-card">
                  <div className="screen-topbar">
                    <span className="screen-dot" />
                    <span className="screen-dot" />
                    <span className="screen-dot" />
                    <span className="screen-topbar-title">{t("screens.grafic")}</span>
                    <span className="screen-live"><i /> LIVE</span>
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
                    <div className="screen-chart-wrap">
                      <svg viewBox="0 0 280 130" className="screen-chart" preserveAspectRatio="none" aria-hidden="true">
                        <defs>
                          <linearGradient id={`screen-grad-${setIdx}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2e7d5b" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#2e7d5b" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {[12, 36, 60, 84, 108, 132, 156, 180, 204, 228, 252].map((x, i) => (
                          <rect key={x} x={x} y={118 - [6, 9, 5, 11, 8, 13, 7, 10, 12, 9, 14][i]} width="14" height={[6, 9, 5, 11, 8, 13, 7, 10, 12, 9, 14][i]} fill="#8a6d4e" opacity="0.25" />
                        ))}
                        <path
                          d="M0,88 C30,83 45,62 70,66 C95,70 110,42 140,46 C170,50 185,32 215,28 C240,25 260,20 280,14 L280,130 L0,130 Z"
                          fill={`url(#screen-grad-${setIdx})`}
                        />
                        <path
                          d="M0,88 C30,83 45,62 70,66 C95,70 110,42 140,46 C170,50 185,32 215,28 C240,25 260,20 280,14"
                          fill="none"
                          stroke="#2e7d5b"
                          strokeWidth="2.5"
                        />
                        <line x1="196" y1="8" x2="196" y2="118" stroke="#9d968a" strokeWidth="1" strokeDasharray="3,3" />
                        <circle cx="196" cy="33" r="4.5" fill="#2e7d5b" stroke="#fff" strokeWidth="2" />
                      </svg>
                      <span className="screen-chart-tooltip">$228.40</span>
                    </div>
                    <div className="screen-range-row">
                      <span className="screen-range">1S</span>
                      <span className="screen-range screen-range-active">1L</span>
                      <span className="screen-range">6L</span>
                      <span className="screen-range">1A</span>
                      <span className="screen-minmax">$196 – $236</span>
                    </div>
                  </div>
                </div>

                {/* 3. Comparatorul: prețuri sub inele + verdictul comparației */}
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
                        <span className="screen-cmp-pret">$217.56 <em className="gain-positive">+2.1%</em></span>
                      </div>
                      <span className="screen-vs">vs</span>
                      <div className="screen-cmp-col">
                        <StockLogo simbol="TSLA" size={34} />
                        <strong>TSLA</strong>
                        <ScoreRing score={55} verdict="neutru" />
                        <span className="screen-cmp-pret">$342.10 <em className="gain-negative">-1.8%</em></span>
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
                    <div className="screen-cmp-verdict">NVDA · {t("screens.castigator")}</div>
                  </div>
                </div>

                {/* 4. Știrile: carduri cu sentiment + acțiunea afectată */}
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
                      <div className="screen-news-meta">
                        <em className="screen-news-chip gain-positive">NVDA +2.1%</em>
                        <em className="screen-news-chip screen-news-chip-verdict">{t("verdict.optimist")}</em>
                      </div>
                    </div>
                    <div className="screen-news screen-news-2">
                      <span>Bloomberg · {t("dash.azi")}</span>
                      <strong>{t("screens.stire2")}</strong>
                      <div className="screen-news-meta">
                        <em className="screen-news-chip">S&P 500</em>
                        <em className="screen-news-chip screen-news-chip-verdict">{t("verdict.neutru")}</em>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Research zilnic: bare de amplitudine + selecția zilei */}
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
                        {SCREEN_DAILY.cresteri.map((pk, i) => (
                          <div key={pk.simbol} className="screen-daily-item">
                            <div className="screen-daily-row">
                              <StockLogo simbol={pk.simbol} size={22} />
                              <strong>{pk.simbol}</strong>
                              <span className="gain-positive">+{pk.val.toFixed(1)}%</span>
                            </div>
                            <div className="screen-daily-bar screen-daily-bar-pos" style={{ width: `${[100, 72][i]}%` }} />
                          </div>
                        ))}
                      </div>
                      <div className="screen-daily-group">
                        <span className="screen-daily-label gain-negative">{t("dash.scaderi")}</span>
                        {SCREEN_DAILY.scaderi.map((pk, i) => (
                          <div key={pk.simbol} className="screen-daily-item">
                            <div className="screen-daily-row">
                              <StockLogo simbol={pk.simbol} size={22} />
                              <strong>{pk.simbol}</strong>
                              <span className="gain-negative">{pk.val.toFixed(1)}%</span>
                            </div>
                            <div className="screen-daily-bar screen-daily-bar-neg" style={{ width: `${[100, 48][i]}%` }} />
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

                {/* 6. Portofoliul virtual: valoare + donut de alocare */}
                <div className="screen-card">
                  <div className="screen-topbar">
                    <span className="screen-dot" />
                    <span className="screen-dot" />
                    <span className="screen-dot" />
                    <span className="screen-topbar-title">{t("nav.portofoliuVirtual")}</span>
                  </div>
                  <div className="screen-body">
                    <div className="screen-port-val">
                      <span className="screen-port-label">{t("screens.valoare")}</span>
                      <strong>$12,480</strong>
                      <span className="gain-positive">▲ +24.8%</span>
                    </div>
                    <div className="screen-port-donut">
                      <svg viewBox="0 0 110 110" aria-hidden="true">
                        <circle cx="55" cy="55" r="40" fill="none" stroke="#8a6d4e" strokeWidth="14" strokeDasharray="113 251.3" transform="rotate(-90 55 55)" />
                        <circle cx="55" cy="55" r="40" fill="none" stroke="#c9ab77" strokeWidth="14" strokeDasharray="63 251.3" strokeDashoffset="-113" transform="rotate(-90 55 55)" />
                        <circle cx="55" cy="55" r="40" fill="none" stroke="#5f5b52" strokeWidth="14" strokeDasharray="75.3 251.3" strokeDashoffset="-176" transform="rotate(-90 55 55)" />
                      </svg>
                      <div className="screen-port-legend">
                        <span><i style={{ background: "#8a6d4e" }} /> {t("sectoare.Tehnologie")} · 45%</span>
                        <span><i style={{ background: "#c9ab77" }} /> {t("sectoare.Sănătate")} · 25%</span>
                        <span><i style={{ background: "#5f5b52" }} /> {t("sectoare.Financiar")} · 30%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 7. Educație: progres + subiect deschis + mini-quiz */}
                <div className="screen-card">
                  <div className="screen-topbar">
                    <span className="screen-dot" />
                    <span className="screen-dot" />
                    <span className="screen-dot" />
                    <span className="screen-topbar-title">{t("nav.informare")}</span>
                  </div>
                  <div className="screen-body">
                    <div className="screen-edu-progres">
                      <div className="screen-score-label">
                        <span>12/50 {t("screens.progres")}</span>
                        <span>24%</span>
                      </div>
                      <div className="screen-score-track">
                        <div className="screen-score-fill" style={{ width: "24%" }} />
                      </div>
                    </div>
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
            <p className="landing-plan-price landing-plan-price-curand">{t("landing.inCurand")}</p>
            <p className="landing-plan-oferta">{t("landing.ofertaLansare")}</p>
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
