import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { api } from "../api";
import AuthLayout from "../components/AuthLayout.jsx";
import { useLang } from "../i18n/index.jsx";

// Pagina de cont = punctul de conversie. Regulile ei:
//  - vorbește despre acțiunea aleasă în demo (?simbol=) și o pune în watchlist
//    imediat după înregistrare — utilizatorul nu pornește de la zero;
//  - doar email + parolă; fără "10.000 USD virtuali", fără fraza cu termenii
//    (linkurile legale rămân în subsolul paginii, ca peste tot);
//  - butonul spune REZULTATUL ("Urmărește NVDA — gratuit"), nu acțiunea.
export default function Register() {
  const { t } = useLang();
  const [searchParams] = useSearchParams();
  const simbolBrut = (searchParams.get("simbol") || "").toUpperCase();
  const simbol = /^[A-Z.]{1,6}$/.test(simbolBrut) ? simbolBrut : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.eveniment("register_view", simbol);
  }, [simbol]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.register(email, password);
      track("inregistrare");
      api.eveniment("register_done", simbol);
      localStorage.setItem("token", data.token);
      if (simbol) {
        // Best-effort: dacă adăugarea eșuează, contul e oricum creat.
        await api.addToWatchlist(simbol).catch(() => {});
      }
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const titlu = simbol
    ? t("auth.registerCuSimbol").replace("{simbol}", simbol)
    : t("auth.registerFaraSimbol");

  return (
    <AuthLayout mod="register" simbol={simbol}>
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="auth-mobile-brand">AI Stock Radar</p>
        <h1>{titlu}</h1>
        {error && <div className="error">{error}</div>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            placeholder={t("auth.parolaMin")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? t("auth.ascundeParola") : t("auth.arataParola")}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {password.length > 0 && (
          <p className={`password-hint ${password.length >= 8 ? "ok" : ""}`}>
            {password.length >= 8
              ? t("auth.lungimeOk")
              : t("auth.minCaractere", { n: password.length })}
          </p>
        )}
        <button type="submit" disabled={loading}>
          {loading ? t("auth.seCreeaza") : titlu}
        </button>
        <ul className="auth-trust">
          <li>{t("auth.trust1")}</li>
          <li>{t("auth.trust2")}</li>
          <li>{t("auth.trust3")}</li>
        </ul>
        <p className="switch">
          {t("auth.aiDejaCont")} <Link to="/login">{t("auth.autentificaTe")}</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
