import { useState } from "react";
import { Link } from "react-router-dom";
import AnimatedNumber from "../components/AnimatedNumber.jsx";
import TypewriterText from "../components/TypewriterText.jsx";
import StockLogo from "../components/StockLogo.jsx";
import ScoreRing from "../components/ScoreRing.jsx";
import RadarViz from "../components/RadarViz.jsx";
import PersonaCards from "../components/PersonaCards.jsx";
import VerdictTag from "../components/VerdictTag.jsx";
import { Radar, TrendingUp, Newspaper, CalendarDays, Compass, Bell, Briefcase } from "lucide-react";

// Fotografie Unsplash aleasă manual (hotlink direct, conform termenilor API),
// cu atribuire vizibilă pe pagină. Persona-urile cu poze stau în PersonaCards,
// partajate cu dashboard-ul logat.
const FOTO_CTA = {
  url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600",
  autor: "Maxim Hopman",
  autorUrl: "https://unsplash.com/@nampoh",
};

const RADAR_FACTS = [
  { icon: Radar, text: "Scoruri AI recalculate automat la fiecare 6 ore, pentru tot ce e urmărit" },
  { icon: TrendingUp, text: "Prețuri live, reîmprospătate la fiecare 30 de secunde" },
  { icon: Newspaper, text: "Știrile pieței, re-analizate la fiecare 30 de minute" },
  { icon: CalendarDays, text: "Calendarul de raportări, actualizat de două ori pe zi" },
];

// Rânduri ilustrative pentru mockup-ul de produs din hero — construite din
// componentele reale ale aplicației (logo + ring), cu valori demonstrative.
const MOCKUP_ROWS = [
  { simbol: "AAPL", verdict: "optimist", scor: 67, pret: "$316.83", variatie: "+2.2%", pozitiv: true },
  { simbol: "NVDA", verdict: "optimist", scor: 63, pret: "$217.56", variatie: "-1.0%", pozitiv: false },
  { simbol: "CVX", verdict: "optimist", scor: 81, pret: "$205.76", variatie: "+1.5%", pozitiv: true },
];

const LOGO_WALL = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "GOOGL", "META", "NFLX", "JPM", "V", "KO", "DIS"];

const HERO_PHRASES = [
  "scor AI pentru fiecare acțiune",
  "context zilnic din piețe",
  "earnings, risc, momentum",
  "portofoliu virtual, fără risc real",
];

// Doar fapte reale despre produs — fără cifre de utilizatori sau venituri
// inventate: pagina publică nu are voie să fabrice dovezi sociale.
const STATS = [
  { value: 50, suffix: "+", label: "acțiuni în universul analizat" },
  { value: 4, suffix: "", label: "sub-scoruri în fiecare analiză AI" },
  { value: 10000, suffix: "", label: "USD virtuali la înscriere" },
  { value: 3, suffix: "", label: "știri de piață analizate AI zilnic" },
];

const STEPS = [
  {
    numar: "1",
    titlu: "Creează-ți contul",
    text: "Gratuit, în câteva secunde. Fără card bancar.",
  },
  {
    numar: "2",
    titlu: "Alege-ți interesele",
    text: "Tehnologie, energie, sănătate... AI-ul îți construiește watchlist-ul de start.",
  },
  {
    numar: "3",
    titlu: "Primești analiza",
    text: "Scoruri AI, știri relevante și calendar de raportări — actualizate automat, zi de zi.",
  },
];

const FEATURES = [
  {
    icon: Radar,
    titlu: "Scor AI 0-100",
    text: "Analiști, momentum, fundamental și risc — combinate într-un verdict descriptiv per acțiune.",
  },
  {
    icon: Compass,
    titlu: "Research zilnic",
    text: "Acțiunile care merită urmărite azi, cu motivul fiecăreia, alese de AI din mișcările pieței.",
  },
  {
    icon: Newspaper,
    titlu: "Știri analizate AI",
    text: "Cele mai relevante știri de piață ale zilei, traduse și explicate în română.",
  },
  {
    icon: CalendarDays,
    titlu: "Calendar de raportări",
    text: "Vezi din timp când raportează companiile pe care le urmărești.",
  },
  {
    icon: Bell,
    titlu: "Alerte de știri",
    text: "Când apare ceva nou despre acțiunile tale, afli direct în aplicație.",
  },
  {
    icon: Briefcase,
    titlu: "Portofoliu virtual",
    text: "Exersezi strategii cu 10.000 USD virtuali — înveți fără să riști bani reali.",
  },
];

const FAQ = [
  {
    intrebare: "AI Stock Radar oferă recomandări de investiții?",
    raspuns:
      "Nu. Tot conținutul este educațional și descriptiv — scorurile și textele explică contextul public al unei acțiuni, dar nu îți spun niciodată să cumperi sau să vinzi ceva. Pentru decizii de investiții, consultă un consultant autorizat.",
  },
  {
    intrebare: "Ce este scorul AI?",
    raspuns:
      "Un scor de la 0 la 100, calculat din 4 sub-scoruri (tendința analiștilor, momentumul prețului, semnale fundamentale și nivelul de risc), pe baza datelor publice de piață. Se recalculează automat, iar un text generat de AI îți explică pe scurt ce înseamnă.",
  },
  {
    intrebare: "Banii din portofoliu sunt reali?",
    raspuns:
      "Nu — primești 10.000 USD virtuali la înscriere, cu prețuri reale de piață. E un simulator: perfect ca să exersezi și să înveți, imposibil să pierzi bani reali.",
  },
  {
    intrebare: "Ce primesc în plus la Premium?",
    raspuns:
      "Watchlist nelimitat (planul gratuit e limitat la 3 acțiuni urmărite), toate cele 7 știri analizate AI pe zi, research zilnic complet și tool-urile Pro: screener cu filtre și comparatorul de acțiuni față în față. Primele 3 zile sunt gratuite — introduci cardul la activare și poți anula oricând înainte de prima plată.",
  },
  {
    intrebare: "Pot renunța oricând?",
    raspuns:
      "Da. Abonamentul se gestionează direct din aplicație, prin Stripe, și poate fi anulat oricând — rămâi cu acces până la finalul perioadei plătite.",
  },
];

const FREE_FEATURES = [
  "3 acțiuni urmărite",
  "Scoruri AI complete (4 sub-scoruri + verdict)",
  "3 știri analizate AI pe zi",
  "Digest zilnic și calendar de raportări",
  "Portofoliu virtual de 10.000 USD",
];

const PREMIUM_FEATURES = [
  "Primele 3 zile gratuite, anulezi oricând",
  "Watchlist nelimitat",
  "Toate cele 7 știri analizate AI + research complet",
  "Tool-uri Pro: screener și comparator A vs B",
  "Gestionare abonament direct din aplicație",
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="landing">
      <header className="landing-nav">
        <span className="navbar-brand">AI Stock Radar</span>
        <div className="landing-nav-actions">
          <Link to="/login" className="landing-nav-link">
            Autentificare
          </Link>
          <Link to="/register" className="landing-cta-small">
            Începe gratuit
          </Link>
        </div>
      </header>

      <section className="landing-hero landing-hero-grid">
        <div className="landing-hero-text">
          <span className="landing-badge">Platformă educațională de analiză bursieră</span>
          <h1 className="landing-headline">
            Radarul AI pentru <span className="landing-headline-accent">acțiunile tale</span>
          </h1>
          <p className="landing-typewriter">
            <TypewriterText phrases={HERO_PHRASES} />
          </p>
          <p className="landing-sub">
            Urmărește acțiuni, primești scoruri AI și context zilnic din piețe — și exersezi pe un portofoliu virtual.
            Fără risc real, fără recomandări de tranzacționare.
          </p>
          <div className="landing-hero-actions">
            <Link to="/register" className="landing-cta">
              Începe gratuit →
            </Link>
            <Link to="/login" className="landing-cta-secondary">
              Am deja cont
            </Link>
          </div>
          <p className="landing-hero-note">Nu îți cerem cardul. Contul gratuit include 5 acțiuni urmărite.</p>
        </div>

        <div className="landing-mockup-wrap" aria-hidden="true">
          <div className="landing-mockup">
            <div className="landing-mockup-bar">
              <span className="landing-mockup-dot" />
              <span className="landing-mockup-dot" />
              <span className="landing-mockup-dot" />
              <span className="landing-mockup-title">AI Stock Radar</span>
            </div>
            <div className="landing-mockup-stats">
              <div>
                <strong className="optimist-text">27</strong>
                <span>optimiste</span>
              </div>
              <div>
                <strong>11</strong>
                <span>neutre</span>
              </div>
              <div>
                <strong className="rezervat-text">1</strong>
                <span>rezervate</span>
              </div>
            </div>
            {MOCKUP_ROWS.map((r) => (
              <div key={r.simbol} className="landing-mockup-row">
                <StockLogo simbol={r.simbol} size={26} />
                <div className="landing-mockup-row-info">
                  <strong>{r.simbol}</strong>
                  <span><VerdictTag verdict={r.verdict} /></span>
                </div>
                <ScoreRing score={r.scor} verdict={r.verdict} />
                <div className="landing-mockup-row-price">
                  <strong>{r.pret}</strong>
                  <span className={r.pozitiv ? "gain-positive" : "gain-negative"}>{r.variatie}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="landing-mockup-caption">Interfața reală a aplicației · scoruri ilustrative</p>
        </div>
      </section>

      <section className="landing-logo-wall">
        <p className="landing-logo-wall-title">Urmărește companii pe care le cunoști deja</p>
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
        {STATS.map((s) => (
          <div key={s.label} className="landing-stat">
            <span className="landing-stat-number">
              <AnimatedNumber value={s.value} />
              {s.suffix}
            </span>
            <span className="landing-stat-label">{s.label}</span>
          </div>
        ))}
      </section>

      <section className="landing-section">
        <h2 className="landing-section-title">Cum funcționează</h2>
        <div className="landing-steps">
          {STEPS.map((s) => (
            <div key={s.numar} className="landing-step">
              <span className="landing-step-number">{s.numar}</span>
              <h3>{s.titlu}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <h2 className="landing-section-title">Tot ce ai nevoie, într-un singur radar</h2>
        <div className="landing-features">
          {FEATURES.map((f) => (
            <div key={f.titlu} className="landing-feature">
              <span className="landing-feature-icon"><f.icon size={20} /></span>
              <h3>{f.titlu}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-radar-band">
          <img src="/mascota/mascota-hero.png" alt="Mascota StockRadar AI" className="mascota mascota-band" loading="lazy" />
          <div className="landing-radar-text">
            <h2 className="landing-section-title landing-radar-title">Radarul lucrează non-stop</h2>
            <ul className="landing-radar-facts">
              {RADAR_FACTS.map((f) => (
                <li key={f.text}>
                  <span className="landing-fact-icon"><f.icon size={16} /></span>
                  {f.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <h2 className="landing-section-title">Gândit pentru oameni ca tine</h2>
        <PersonaCards variant="public" />
      </section>

      <section className="landing-section">
        <h2 className="landing-section-title">Prețuri simple</h2>
        <div className="landing-pricing">
          <div className="landing-plan">
            <h3>Gratuit</h3>
            <p className="landing-plan-price">
              0 <span>RON</span>
            </p>
            <ul>
              {FREE_FEATURES.map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
            <Link to="/register" className="landing-cta-secondary landing-plan-cta">
              Începe gratuit
            </Link>
          </div>
          <div className="landing-plan landing-plan-featured">
            <span className="landing-plan-badge">Cel mai popular</span>
            <h3>Premium</h3>
            <p className="landing-plan-price">
              29,99 <span>RON / lună</span>
            </p>
            <ul>
              {PREMIUM_FEATURES.map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
            <Link to="/register" className="landing-cta landing-plan-cta">
              Începe cu Premium →
            </Link>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <h2 className="landing-section-title">Întrebări frecvente</h2>
        <div className="landing-faq">
          {FAQ.map((item, i) => (
            <div key={item.intrebare} className="landing-faq-item">
              <button
                type="button"
                className="landing-faq-question"
                aria-expanded={openFaq === i}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                {item.intrebare}
                <span className="landing-faq-chevron">{openFaq === i ? "−" : "+"}</span>
              </button>
              {openFaq === i && <p className="landing-faq-answer">{item.raspuns}</p>}
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
        <h2>Gata să vezi piața mai clar?</h2>
        <p>Cont gratuit, watchlist construit de AI în câteva secunde.</p>
        <Link to="/register" className="landing-cta">
          Începe gratuit →
        </Link>
        <p className="landing-photo-credit landing-photo-credit-dark">
          Foto:{" "}
          <a href={FOTO_CTA.autorUrl} target="_blank" rel="noopener noreferrer">
            {FOTO_CTA.autor}
          </a>{" "}
          / <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a>
        </p>
      </section>

      <footer className="landing-footer">
        <span className="navbar-brand">AI Stock Radar</span>
        <div className="landing-footer-links">
          <Link to="/login">Autentificare</Link>
          <Link to="/register">Creează cont</Link>
        </div>
        <p className="landing-footer-disclaimer">
          Conținut educativ generat automat, nu este consultanță de investiții. Scorurile și textele din aplicație
          descriu context public, nu recomandări de cumpărare sau vânzare.
        </p>
      </footer>
    </div>
  );
}
