// Eticheta de verdict folosită peste tot: punct colorat + text, în paleta
// proprie (albastru/gri/chihlimbar) — înlocuiește emoji-urile 🔵⚪🟠, ca tot
// UI-ul să aibă un singur stil de iconografie.
const LABELS = {
  optimist: "Optimist",
  neutru: "Neutru",
  rezervat: "Rezervat",
};

export default function VerdictTag({ verdict }) {
  return (
    <span className="verdict-tag">
      <span className={`vdot vdot-${verdict}`} />
      {LABELS[verdict] || verdict}
    </span>
  );
}
