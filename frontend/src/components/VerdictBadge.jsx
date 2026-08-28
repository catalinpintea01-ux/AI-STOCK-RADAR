import { useLang } from "../i18n/index.jsx";

export default function VerdictBadge({ verdict, incredere }) {
  const { t } = useLang();
  const v = ["optimist", "neutru", "rezervat"].includes(verdict) ? verdict : "neutru";

  return (
    <div className={`verdict-badge verdict-${v}`}>
      <span>
        <span className={`vdot vdot-${v}`} /> {t("verdictB.sentiment")} {String(t(`verdict.${v}`)).toLowerCase()}
      </span>
      {incredere && (
        <span className="verdict-confidence">
          {t("verdictB.incredere")} {t(`verdictB.${incredere}`)}
        </span>
      )}
    </div>
  );
}
