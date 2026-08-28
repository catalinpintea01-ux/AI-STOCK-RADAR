import { useState } from "react";
import Disclaimer from "../components/Disclaimer.jsx";
import { TOPICS, DICTIONAR } from "../data/learnTopics.js";
import { TOPICS_EXTRA } from "../data/learnTopics2.js";
import { QUIZZES } from "../data/learnQuizzes.js";
import { TopicQuiz, CALCULATOARE } from "../components/LearnInteractive.jsx";
import { useTraduse } from "../i18n/useTraduse.js";

const TOATE_TOPICELE = [...TOPICS, ...TOPICS_EXTRA];

// Conținutul unui subiect, tradus la deschidere (o singură cerere per subiect
// per limbă; serverul ține cache 7 zile). Pe română se afișează direct.
function TopicBody({ topic }) {
  const obiect = {};
  topic.paragrafe.forEach((p, i) => {
    if (typeof p === "string") obiect[`p${i}`] = p;
    else {
      obiect[`p${i}t`] = p.titlu;
      obiect[`p${i}x`] = p.text;
    }
  });
  const tt = useTraduse(obiect);

  return (
    <>
      {topic.paragrafe.map((p, i) => (
        <p key={i} className="muted" style={{ fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "0.75rem" }}>
          {typeof p === "string" ? (
            tt(`p${i}`)
          ) : (
            <>
              <strong style={{ color: "var(--text)" }}>{tt(`p${i}t`)}:</strong> {tt(`p${i}x`)}
            </>
          )}
        </p>
      ))}
    </>
  );
}

// Dicționarul financiar, tradus integral la deschidere (termen + definiție).
function DictionarBody() {
  const obiect = {};
  DICTIONAR.forEach((d, i) => {
    obiect[`t${i}`] = d.termen;
    obiect[`d${i}`] = d.definitie;
  });
  const tt = useTraduse(obiect);

  return (
    <div className="accordion-body">
      {DICTIONAR.map((d, i) => (
        <div key={d.termen} style={{ marginBottom: "0.75rem" }}>
          <strong style={{ fontSize: "0.9rem" }}>{tt(`t${i}`)}</strong>
          <p className="muted" style={{ fontSize: "0.85rem", margin: "0.2rem 0 0" }}>
            {tt(`d${i}`)}
          </p>
        </div>
      ))}
    </div>
  );
}

// Titlurile tuturor subiectelor, traduse dintr-o singură cerere (sunt scurte).
function useTitluriTraduse() {
  const obiect = {};
  TOATE_TOPICELE.forEach((t) => {
    obiect[t.id] = t.titlu;
  });
  return useTraduse(obiect);
}

export default function Learn() {
  const tt = useTraduse({
    titlu: "Informare",
    sub: "Educație financiară pentru începători, în {n} subiecte plus dicționar — nu este consultanță de investiții.",
    cauta: "Caută un subiect (ex: dividende, risc, ETF)...",
    nicio: "Niciun subiect nu corespunde căutării.",
    dictionar: "Dicționar financiar ({n} termeni)",
  });
  const ttTitlu = useTitluriTraduse();
  const [expanded, setExpanded] = useState(null);
  const [filtru, setFiltru] = useState("");

  function toggle(id) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  const topiceFiltrate = TOATE_TOPICELE.filter((t) =>
    `${t.titlu} ${ttTitlu(t.id)}`.toLowerCase().includes(filtru.toLowerCase())
  );

  return (
    <div className="portfolio-page">
      <div className="learn-header">
        <div>
          <h1 className="page-title">{tt("titlu")}</h1>
          <p className="cash">{tt("sub", { n: TOATE_TOPICELE.length })}</p>
        </div>
        <img src="/mascota/prezinta.png" alt="" className="mascota mascota-learn" loading="lazy" />
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder={tt("cauta")}
          value={filtru}
          onChange={(e) => setFiltru(e.target.value)}
          style={{
            width: "100%",
            padding: "0.65rem 0.8rem",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            marginBottom: "1rem",
          }}
        />
      </div>

      <section className="holdings">
        {topiceFiltrate.length === 0 && <p className="empty">{tt("nicio")}</p>}
        {topiceFiltrate.map((topic) => (
          <div key={topic.id} className="accordion-item">
            <button className="accordion-header" onClick={() => toggle(topic.id)}>
              <span>{ttTitlu(topic.id)}</span>
              <span>{expanded === topic.id ? "−" : "+"}</span>
            </button>
            {expanded === topic.id && (
              <div className="accordion-body">
                <TopicBody topic={topic} />
                {CALCULATOARE[topic.id] &&
                  (() => {
                    const Calc = CALCULATOARE[topic.id];
                    return <Calc />;
                  })()}
                <TopicQuiz quiz={QUIZZES[topic.id]} />
              </div>
            )}
          </div>
        ))}

        <div className="accordion-item">
          <button className="accordion-header" onClick={() => toggle("dictionar")}>
            <span>{tt("dictionar", { n: DICTIONAR.length })}</span>
            <span>{expanded === "dictionar" ? "−" : "+"}</span>
          </button>
          {expanded === "dictionar" && <DictionarBody />}
        </div>
      </section>

      <Disclaimer />
    </div>
  );
}
