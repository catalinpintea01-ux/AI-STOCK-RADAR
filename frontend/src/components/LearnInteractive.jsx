import { useState } from "react";
import { useLang } from "../i18n/index.jsx";
import { useTraduse } from "../i18n/useTraduse.js";

// Elementele interactive din Informare: mini-quiz per subiect + calculatoare
// cu slidere pentru subiectele numerice. Totul e ilustrativ-educativ —
// randamentele din calculatoare sunt ipotetice, nu previziuni.
// Textele (inclusiv întrebările quiz-urilor) se traduc la cerere.

export function TopicQuiz({ quiz }) {
  const obiect = quiz
    ? {
        eyebrow: "Verifică-te",
        intrebare: quiz.intrebare,
        explicatie: quiz.explicatie,
        corect: "Corect!",
        nuChiar: "Nu chiar.",
        dinNou: "Încearcă din nou",
        ...Object.fromEntries(quiz.optiuni.map((o, i) => [`o${i}`, o])),
      }
    : { gol: "" };
  const tt = useTraduse(obiect);
  const [ales, setAles] = useState(null);

  if (!quiz) return null;
  const raspuns = ales !== null;
  const corect = ales === quiz.corect;

  return (
    <div className="quiz-box">
      <p className="quiz-eyebrow">{tt("eyebrow")}</p>
      <p className="quiz-question">{tt("intrebare")}</p>
      <div className="quiz-options">
        {quiz.optiuni.map((opt, i) => {
          let clasa = "quiz-option";
          if (raspuns) {
            if (i === quiz.corect) clasa += " quiz-correct";
            else if (i === ales) clasa += " quiz-wrong";
            else clasa += " quiz-dim";
          }
          return (
            <button key={i} className={clasa} onClick={() => !raspuns && setAles(i)} disabled={raspuns}>
              {tt(`o${i}`)}
            </button>
          );
        })}
      </div>
      {raspuns && (
        <div className={`quiz-feedback ${corect ? "quiz-feedback-ok" : "quiz-feedback-nu"}`}>
          <strong>{corect ? tt("corect") : tt("nuChiar")}</strong> {tt("explicatie")}
          <button className="quiz-retry" onClick={() => setAles(null)}>
            {tt("dinNou")}
          </button>
        </div>
      )}
    </div>
  );
}

// Calculator de dobândă compusă: o sumă unică, lăsată să crească N ani.
export function CompoundCalc() {
  const { locale } = useLang();
  const tt = useTraduse({
    eyebrow: "Joacă-te cu cifrele",
    suma: "Sumă inițială:",
    perioada: "Perioadă:",
    ani: "ani",
    randament: "Randament anual ipotetic:",
    lei: "lei",
    valoareFinala: "Valoare finală",
    castig: "Din care câștig compus",
    nota: "Ilustrare educativă cu randament constant ipotetic — piețele reale fluctuează, nimic nu e garantat.",
  });
  const [suma, setSuma] = useState(10000);
  const [ani, setAni] = useState(20);
  const [randament, setRandament] = useState(8);

  const formateaza = (n) => Math.round(n).toLocaleString(locale);
  const final = suma * Math.pow(1 + randament / 100, ani);
  const castig = final - suma;

  return (
    <div className="calc-box">
      <p className="quiz-eyebrow">{tt("eyebrow")}</p>
      <div className="calc-sliders">
        <label>
          {tt("suma")} <strong>{formateaza(suma)} {tt("lei")}</strong>
          <input type="range" min="1000" max="100000" step="1000" value={suma} onChange={(e) => setSuma(+e.target.value)} />
        </label>
        <label>
          {tt("perioada")} <strong>{ani} {tt("ani")}</strong>
          <input type="range" min="1" max="40" value={ani} onChange={(e) => setAni(+e.target.value)} />
        </label>
        <label>
          {tt("randament")} <strong>{randament}%</strong>
          <input type="range" min="1" max="15" value={randament} onChange={(e) => setRandament(+e.target.value)} />
        </label>
      </div>
      <div className="calc-result">
        <div>
          <span className="calc-result-label">{tt("valoareFinala")}</span>
          <span className="calc-result-value">{formateaza(final)} {tt("lei")}</span>
        </div>
        <div>
          <span className="calc-result-label">{tt("castig")}</span>
          <span className="calc-result-value calc-result-gain">+{formateaza(castig)} {tt("lei")}</span>
        </div>
      </div>
      <p className="calc-note">{tt("nota")}</p>
    </div>
  );
}

// Simulator DCA: contribuții lunare egale, creștere lunară constantă ipotetică.
export function DcaCalc() {
  const { locale } = useLang();
  const tt = useTraduse({
    eyebrow: "Simulator de investiție lunară",
    contributie: "Contribuție lunară:",
    perioada: "Perioadă:",
    ani: "ani",
    randament: "Randament anual ipotetic:",
    lei: "lei",
    depus: "Total depus",
    acumulat: "Valoare acumulată",
    nota: "Ilustrare educativă cu creștere lunară constantă ipotetică — nu o previziune sau garanție.",
  });
  const [lunar, setLunar] = useState(500);
  const [ani, setAni] = useState(15);
  const [randament, setRandament] = useState(8);

  const formateaza = (n) => Math.round(n).toLocaleString(locale);
  const luni = ani * 12;
  const r = randament / 100 / 12;
  const final = r > 0 ? lunar * ((Math.pow(1 + r, luni) - 1) / r) : lunar * luni;
  const depus = lunar * luni;

  return (
    <div className="calc-box">
      <p className="quiz-eyebrow">{tt("eyebrow")}</p>
      <div className="calc-sliders">
        <label>
          {tt("contributie")} <strong>{formateaza(lunar)} {tt("lei")}</strong>
          <input type="range" min="100" max="5000" step="100" value={lunar} onChange={(e) => setLunar(+e.target.value)} />
        </label>
        <label>
          {tt("perioada")} <strong>{ani} {tt("ani")}</strong>
          <input type="range" min="1" max="40" value={ani} onChange={(e) => setAni(+e.target.value)} />
        </label>
        <label>
          {tt("randament")} <strong>{randament}%</strong>
          <input type="range" min="1" max="15" value={randament} onChange={(e) => setRandament(+e.target.value)} />
        </label>
      </div>
      <div className="calc-result">
        <div>
          <span className="calc-result-label">{tt("depus")}</span>
          <span className="calc-result-value">{formateaza(depus)} {tt("lei")}</span>
        </div>
        <div>
          <span className="calc-result-label">{tt("acumulat")}</span>
          <span className="calc-result-value calc-result-gain">{formateaza(final)} {tt("lei")}</span>
        </div>
      </div>
      <p className="calc-note">{tt("nota")}</p>
    </div>
  );
}

// Ce subiect primește ce calculator (restul primesc doar quiz-ul).
export const CALCULATOARE = {
  "dobanda-compusa": CompoundCalc,
  "dollar-cost-averaging": DcaCalc,
  "cum-sa-investesti": DcaCalc,
};
