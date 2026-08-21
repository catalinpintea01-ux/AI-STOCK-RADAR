import { Link } from "react-router-dom";
import Disclaimer from "../components/Disclaimer.jsx";
import { Users, TrendingUp, Layers, Shield } from "lucide-react";

// Transparența metodologiei: un scor fără explicație nu inspiră încredere.
// Conținut static, pur descriptiv — oglindește exact ce face radar.js.
const SUB_SCORES = [
  {
    icon: Users,
    nume: "Tendința analiștilor",
    pondere: "30%",
    text: "Agregăm evaluările lunare publicate de analiștii de pe Wall Street (strong buy / buy / hold / sell / strong sell, raportate public prin Finnhub). Cu cât raportul dintre evaluările pozitive și cele negative e mai favorabil, cu atât sub-scorul e mai mare. Nu preluăm recomandările în sine — doar măsurăm în ce direcție înclină consensul.",
  },
  {
    icon: TrendingUp,
    nume: "Momentum",
    pondere: "30%",
    text: "Măsurăm evoluția prețului pe trei orizonturi (5 zile, 13 săptămâni, 26 de săptămâni) și poziția față de maximul/minimul din ultimele 52 de săptămâni. Tendințele pozitive susținute ridică sub-scorul; scăderile prelungite îl coboară.",
  },
  {
    icon: Layers,
    nume: "Semnale fundamentale",
    pondere: "20%",
    text: "Combinăm surprizele din ultimele raportări trimestriale (profit peste sau sub estimări) cu tranzacțiile insiderilor (cumpărările și vânzările raportate la SEC de directorii companiei). Raportări peste așteptări și cumpărări interne ridică sub-scorul.",
  },
  {
    icon: Shield,
    nume: "Nivelul de risc",
    pondere: "20% (invers)",
    text: "Pornim de la volatilitatea acțiunii față de piață (beta) și de la amplitudinea intervalului din ultimele 52 de săptămâni. Un risc mai mare trage scorul compozit în jos — de aceea intră invers în formulă: contribuie 100 minus scorul de risc.",
  },
];

export default function Methodology() {
  return (
    <div className="portfolio-page methodology">
      <h1 className="page-title">Cum calculăm scorul AI</h1>
      <p className="cash">
        Fiecare acțiune primește un scor de la 0 la 100, construit din 4 sub-scoruri calculate
        exclusiv din date publice de piață. Nicio parte a scorului nu e o opinie ascunsă — mai jos
        e exact formula.
      </p>

      <section className="holdings">
        <h2 className="section-title">Cele 4 sub-scoruri</h2>
        <div className="methodology-grid">
          {SUB_SCORES.map((s) => (
            <div key={s.nume} className="methodology-card">
              <div className="methodology-card-head">
                <span className="methodology-icon"><s.icon size={22} /></span>
                <div>
                  <h3>{s.nume}</h3>
                  <span className="badge-chip">pondere {s.pondere}</span>
                </div>
              </div>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="holdings">
        <h2 className="section-title">Formula scorului compozit</h2>
        <p className="methodology-formula">
          Scor = 30% × analiști + 30% × momentum + 20% × fundamentale + 20% × (100 − risc)
        </p>
        <ul className="methodology-list">
          <li>
            <strong>Verdictul</strong> derivă direct din scor: <strong>60 sau peste</strong> →
            „optimist", <strong>40 sau sub</strong> → „rezervat", între ele → „neutru". Verdictul
            descrie tabloul datelor, nu este un îndemn la acțiune.
          </li>
          <li>
            <strong>Încrederea</strong> („ridicată / medie / scăzută") arată câte dintre cele 4
            surse aveau date reale pentru compania respectivă. Când o sursă lipsește (ex: companii
            mici, fără acoperire de analiști), sub-scorul rămâne neutru (50) și încrederea scade —
            nu ghicim niciodată.
          </li>
          <li>
            <strong>Prospețimea</strong>: scorurile se recalculează automat la cel mult 6 ore, iar
            istoricul schimbărilor e păstrat — secțiunea „Ce s-a schimbat" arată exact evoluția.
          </li>
          <li>
            <strong>Textul explicativ</strong> e generat de AI pornind de la aceste cifre, apoi
            trecut printr-un filtru automat care blochează orice limbaj de consiliere („cumpără",
            „vinde", „recomand"). Dacă filtrul respinge textul, afișăm o descriere generată
            determinist din cifre.
          </li>
        </ul>
      </section>

      <section className="holdings">
        <h2 className="section-title">Ce NU este scorul</h2>
        <p className="methodology-not">
          Scorul nu este o recomandare de investiții, nu prezice prețuri și nu ține cont de
          situația ta personală. Este un rezumat numeric al datelor publice, gândit ca punct de
          plecare pentru propria ta documentare.
        </p>
        <Link to="/" className="view-analysis-button">
          ← Înapoi la radar
        </Link>
      </section>

      <Disclaimer />
    </div>
  );
}
