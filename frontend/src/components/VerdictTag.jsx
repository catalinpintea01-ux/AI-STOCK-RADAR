import { useLang } from "../i18n/index.jsx";

// Eticheta de verdict folosită peste tot: punct colorat + text, în paleta
// proprie (albastru/gri/chihlimbar) — înlocuiește emoji-urile 🔵⚪🟠, ca tot
// UI-ul să aibă un singur stil de iconografie.
export default function VerdictTag({ verdict }) {
  const { t } = useLang();
  return (
    <span className="verdict-tag">
      <span className={`vdot vdot-${verdict}`} />
      {t(`verdict.${verdict}`) === `verdict.${verdict}` ? verdict : t(`verdict.${verdict}`)}
    </span>
  );
}
