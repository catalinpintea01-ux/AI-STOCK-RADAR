import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import AuthLayout from "../components/AuthLayout.jsx";
import { useLang } from "../i18n/index.jsx";

// Două stări pe aceeași pagină: fără token în URL — ceri linkul pe email;
// cu token (din emailul primit) — setezi parola nouă. Răspunsul la cerere e
// mereu același, indiferent dacă emailul există (anti-enumerare, ca pe server).
export default function Resetare() {
  const { t } = useLang();
  const { token } = useParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [trimis, setTrimis] = useState(false);
  const [gata, setGata] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCerere(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.forgotPassword(email);
      setTrimis(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetare(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.resetPassword(token, password);
      setGata(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <form className="auth-card" onSubmit={token ? handleResetare : handleCerere}>
        <p className="auth-mobile-brand">AI Stock Radar</p>
        <h1>{t("auth.resetTitlu")}</h1>

        {!token && !trimis && (
          <>
            <p className="subtitle">{t("auth.resetSub")}</p>
            {error && <div className="error">{error}</div>}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "..." : t("auth.resetTrimite")}
            </button>
          </>
        )}

        {!token && trimis && <p className="subtitle">{t("auth.resetTrimis")}</p>}

        {token && !gata && (
          <>
            <p className="subtitle">{t("auth.resetNouaSub")}</p>
            {error && <div className="error">{error}</div>}
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={t("auth.parolaNoua")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
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
            <button type="submit" disabled={loading}>
              {loading ? "..." : t("auth.resetSchimba")}
            </button>
          </>
        )}

        {token && gata && <p className="subtitle">✓ {t("auth.resetGata")}</p>}

        <p className="switch">
          <Link to="/login">{t("auth.inapoiLogin")}</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
