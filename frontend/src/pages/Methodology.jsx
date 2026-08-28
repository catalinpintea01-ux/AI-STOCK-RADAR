import { Link } from "react-router-dom";
import Disclaimer from "../components/Disclaimer.jsx";
import { Users, TrendingUp, Layers, Shield } from "lucide-react";
import { useTraduse } from "../i18n/useTraduse.js";

// Transparența metodologiei: un scor fără explicație nu inspiră încredere.
// Conținut static, pur descriptiv — oglindește exact ce face radar.js.
// Textele se traduc la cerere în limba interfeței.
const SUB_SCORES = [
  { icon: Users, cheieNume: "s1", cheiePondere: "s1p", cheieText: "s1t" },
  { icon: TrendingUp, cheieNume: "s2", cheiePondere: "s2p", cheieText: "s2t" },
  { icon: Layers, cheieNume: "s3", cheiePondere: "s3p", cheieText: "s3t" },
  { icon: Shield, cheieNume: "s4", cheiePondere: "s4p", cheieText: "s4t" },
];

export default function Methodology() {
  const tt = useTraduse({
    titlu: "Cum calculăm scorul AI",
    sub: "Fiecare acțiune primește un scor de la 0 la 100, construit din 4 sub-scoruri calculate exclusiv din date publice de piață. Nicio parte a scorului nu e o opinie ascunsă — mai jos e exact formula.",
    cele4: "Cele 4 sub-scoruri",
    pondere: "pondere",
    s1: "Tendința analiștilor",
    s1p: "30%",
    s1t: "Agregăm evaluările lunare publicate de analiștii de pe Wall Street (strong buy / buy / hold / sell / strong sell, raportate public prin Finnhub). Cu cât raportul dintre evaluările pozitive și cele negative e mai favorabil, cu atât sub-scorul e mai mare. Nu preluăm recomandările în sine — doar măsurăm în ce direcție înclină consensul.",
    s2: "Momentum",
    s2p: "30%",
    s2t: "Măsurăm evoluția prețului pe trei orizonturi (5 zile, 13 săptămâni, 26 de săptămâni) și poziția față de maximul/minimul din ultimele 52 de săptămâni. Tendințele pozitive susținute ridică sub-scorul; scăderile prelungite îl coboară.",
    s3: "Semnale fundamentale",
    s3p: "20%",
    s3t: "Combinăm surprizele din ultimele raportări trimestriale (profit peste sau sub estimări) cu tranzacțiile insiderilor (cumpărările și vânzările raportate la SEC de directorii companiei). Raportări peste așteptări și cumpărări interne ridică sub-scorul.",
    s4: "Nivelul de risc",
    s4p: "20% (invers)",
    s4t: "Pornim de la volatilitatea acțiunii față de piață (beta) și de la amplitudinea intervalului din ultimele 52 de săptămâni. Un risc mai mare trage scorul compozit în jos — de aceea intră invers în formulă: contribuie 100 minus scorul de risc.",
    formula: "Formula scorului compozit",
    formulaText: "Scor = 30% × analiști + 30% × momentum + 20% × fundamentale + 20% × (100 − risc)",
    f1: "Verdictul derivă direct din scor: 60 sau peste → „optimist”, 40 sau sub → „rezervat”, între ele → „neutru”. Verdictul descrie tabloul datelor, nu este un îndemn la acțiune.",
    f2: "Încrederea („ridicată / medie / scăzută”) arată câte dintre cele 4 surse aveau date reale pentru compania respectivă. Când o sursă lipsește (ex: companii mici, fără acoperire de analiști), sub-scorul rămâne neutru (50) și încrederea scade — nu ghicim niciodată.",
    f3: "Prospețimea: scorurile se recalculează automat la cel mult 6 ore, iar istoricul schimbărilor e păstrat — secțiunea „Ce s-a schimbat” arată exact evoluția.",
    f4: "Textul explicativ e generat de AI pornind de la aceste cifre, apoi trecut printr-un filtru automat care blochează orice limbaj de consiliere („cumpără”, „vinde”, „recomand”). Dacă filtrul respinge textul, afișăm o descriere generată determinist din cifre.",
    ceNu: "Ce NU este scorul",
    ceNuText: "Scorul nu este o recomandare de investiții, nu prezice prețuri și nu ține cont de situația ta personală. Este un rezumat numeric al datelor publice, gândit ca punct de plecare pentru propria ta documentare.",
    inapoi: "← Înapoi la radar",
  });

  return (
    <div className="portfolio-page methodology">
      <h1 className="page-title">{tt("titlu")}</h1>
      <p className="cash">{tt("sub")}</p>

      <section className="holdings">
        <h2 className="section-title">{tt("cele4")}</h2>
        <div className="methodology-grid">
          {SUB_SCORES.map((s) => (
            <div key={s.cheieNume} className="methodology-card">
              <div className="methodology-card-head">
                <span className="methodology-icon"><s.icon size={22} /></span>
                <div>
                  <h3>{tt(s.cheieNume)}</h3>
                  <span className="badge-chip">{tt("pondere")} {tt(s.cheiePondere)}</span>
                </div>
              </div>
              <p>{tt(s.cheieText)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="holdings">
        <h2 className="section-title">{tt("formula")}</h2>
        <p className="methodology-formula">{tt("formulaText")}</p>
        <ul className="methodology-list">
          <li>{tt("f1")}</li>
          <li>{tt("f2")}</li>
          <li>{tt("f3")}</li>
          <li>{tt("f4")}</li>
        </ul>
      </section>

      <section className="holdings">
        <h2 className="section-title">{tt("ceNu")}</h2>
        <p className="methodology-not">{tt("ceNuText")}</p>
        <Link to="/" className="view-analysis-button">
          {tt("inapoi")}
        </Link>
      </section>

      <Disclaimer />
    </div>
  );
}
