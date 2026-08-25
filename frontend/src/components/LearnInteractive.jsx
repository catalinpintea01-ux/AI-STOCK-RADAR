import { useState } from "react";

// Elementele interactive din Informare: mini-quiz per subiect + calculatoare
// cu slidere pentru subiectele numerice. Totul e ilustrativ-educativ —
// randamentele din calculatoare sunt ipotetice, nu previziuni.

export function TopicQuiz({ quiz }) {
  const [ales, setAles] = useState(null);

  if (!quiz) return null;
  const raspuns = ales !== null;
  const corect = ales === quiz.corect;

  return (
    <div className="quiz-box">
      <p className="quiz-eyebrow">Verifică-te</p>
      <p className="quiz-question">{quiz.intrebare}</p>
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
              {opt}
            </button>
          );
        })}
      </div>
      {raspuns && (
        <div className={`quiz-feedback ${corect ? "quiz-feedback-ok" : "quiz-feedback-nu"}`}>
          <strong>{corect ? "Corect!" : "Nu chiar."}</strong> {quiz.explicatie}
          <button className="quiz-retry" onClick={() => setAles(null)}>
            Încearcă din nou
          </button>
        </div>
      )}
    </div>
  );
}

function formateaza(n) {
  return Math.round(n).toLocaleString("ro-RO");
}

// Calculator de dobândă compusă: o sumă unică, lăsată să crească N ani.
export function CompoundCalc() {
  const [suma, setSuma] = useState(10000);
  const [ani, setAni] = useState(20);
  const [randament, setRandament] = useState(8);

  const final = suma * Math.pow(1 + randament / 100, ani);
  const castig = final - suma;

  return (
    <div className="calc-box">
      <p className="quiz-eyebrow">Joacă-te cu cifrele</p>
      <div className="calc-sliders">
        <label>
          Sumă inițială: <strong>{formateaza(suma)} lei</strong>
          <input type="range" min="1000" max="100000" step="1000" value={suma} onChange={(e) => setSuma(+e.target.value)} />
        </label>
        <label>
          Perioadă: <strong>{ani} ani</strong>
          <input type="range" min="1" max="40" value={ani} onChange={(e) => setAni(+e.target.value)} />
        </label>
        <label>
          Randament anual ipotetic: <strong>{randament}%</strong>
          <input type="range" min="1" max="15" value={randament} onChange={(e) => setRandament(+e.target.value)} />
        </label>
      </div>
      <div className="calc-result">
        <div>
          <span className="calc-result-label">Valoare finală</span>
          <span className="calc-result-value">{formateaza(final)} lei</span>
        </div>
        <div>
          <span className="calc-result-label">Din care câștig compus</span>
          <span className="calc-result-value calc-result-gain">+{formateaza(castig)} lei</span>
        </div>
      </div>
      <p className="calc-note">Ilustrare educativă cu randament constant ipotetic — piețele reale fluctuează, nimic nu e garantat.</p>
    </div>
  );
}

// Simulator DCA: contribuții lunare egale, creștere lunară constantă ipotetică.
export function DcaCalc() {
  const [lunar, setLunar] = useState(500);
  const [ani, setAni] = useState(15);
  const [randament, setRandament] = useState(8);

  const luni = ani * 12;
  const r = randament / 100 / 12;
  const final = r > 0 ? lunar * ((Math.pow(1 + r, luni) - 1) / r) : lunar * luni;
  const depus = lunar * luni;

  return (
    <div className="calc-box">
      <p className="quiz-eyebrow">Simulator de investiție lunară</p>
      <div className="calc-sliders">
        <label>
          Contribuție lunară: <strong>{formateaza(lunar)} lei</strong>
          <input type="range" min="100" max="5000" step="100" value={lunar} onChange={(e) => setLunar(+e.target.value)} />
        </label>
        <label>
          Perioadă: <strong>{ani} ani</strong>
          <input type="range" min="1" max="40" value={ani} onChange={(e) => setAni(+e.target.value)} />
        </label>
        <label>
          Randament anual ipotetic: <strong>{randament}%</strong>
          <input type="range" min="1" max="15" value={randament} onChange={(e) => setRandament(+e.target.value)} />
        </label>
      </div>
      <div className="calc-result">
        <div>
          <span className="calc-result-label">Total depus</span>
          <span className="calc-result-value">{formateaza(depus)} lei</span>
        </div>
        <div>
          <span className="calc-result-label">Valoare acumulată</span>
          <span className="calc-result-value calc-result-gain">{formateaza(final)} lei</span>
        </div>
      </div>
      <p className="calc-note">Ilustrare educativă cu creștere lunară constantă ipotetică — nu o previziune sau garanție.</p>
    </div>
  );
}

// Ce subiect primește ce calculator (restul primesc doar quiz-ul).
export const CALCULATOARE = {
  "dobanda-compusa": CompoundCalc,
  "dollar-cost-averaging": DcaCalc,
  "cum-sa-investesti": DcaCalc,
};
