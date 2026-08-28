import { useLang } from "../i18n/index.jsx";

export default function Disclaimer() {
  const { t } = useLang();
  return <p className="disclaimer">{t("disclaimer.app")}</p>;
}
