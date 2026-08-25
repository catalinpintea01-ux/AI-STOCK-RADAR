import { useState } from "react";
import Disclaimer from "../components/Disclaimer.jsx";
import { TOPICS, DICTIONAR } from "../data/learnTopics.js";
import { TOPICS_EXTRA } from "../data/learnTopics2.js";
import { QUIZZES } from "../data/learnQuizzes.js";
import { TopicQuiz, CALCULATOARE } from "../components/LearnInteractive.jsx";

const TOATE_TOPICELE = [...TOPICS, ...TOPICS_EXTRA];

export default function Learn() {
  const [expanded, setExpanded] = useState(null);
  const [filtru, setFiltru] = useState("");

  function toggle(id) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  const topiceFiltrate = TOATE_TOPICELE.filter((t) => t.titlu.toLowerCase().includes(filtru.toLowerCase()));

  return (
    <div className="portfolio-page">
      <div className="learn-header">
        <div>
          <h1 className="page-title">Informare</h1>
      <p className="cash">
        Educație financiară pentru începători, în {TOATE_TOPICELE.length} subiecte plus dicționar — nu este consultanță de
        investiții.
      </p>
        </div>
        <img src="/mascota/prezinta.png" alt="" className="mascota mascota-learn" loading="lazy" />
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="Caută un subiect (ex: dividende, risc, ETF)..."
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
        {topiceFiltrate.length === 0 && <p className="empty">Niciun subiect nu corespunde căutării.</p>}
        {topiceFiltrate.map((topic) => (
          <div key={topic.id} className="accordion-item">
            <button className="accordion-header" onClick={() => toggle(topic.id)}>
              <span>{topic.titlu}</span>
              <span>{expanded === topic.id ? "−" : "+"}</span>
            </button>
            {expanded === topic.id && (
              <div className="accordion-body">
                {topic.paragrafe.map((p, i) => (
                  <p key={i} className="muted" style={{ fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "0.75rem" }}>
                    {typeof p === "string" ? (
                      p
                    ) : (
                      <>
                        <strong style={{ color: "var(--text)" }}>{p.titlu}:</strong> {p.text}
                      </>
                    )}
                  </p>
                ))}
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
            <span>Dicționar financiar ({DICTIONAR.length} termeni)</span>
            <span>{expanded === "dictionar" ? "−" : "+"}</span>
          </button>
          {expanded === "dictionar" && (
            <div className="accordion-body">
              {DICTIONAR.map((d) => (
                <div key={d.termen} style={{ marginBottom: "0.75rem" }}>
                  <strong style={{ fontSize: "0.9rem" }}>{d.termen}</strong>
                  <p className="muted" style={{ fontSize: "0.85rem", margin: "0.2rem 0 0" }}>
                    {d.definitie}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Disclaimer />
    </div>
  );
}
