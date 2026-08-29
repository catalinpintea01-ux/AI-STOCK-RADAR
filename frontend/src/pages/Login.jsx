import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import AuthLayout from "../components/AuthLayout.jsx";
import { useLang } from "../i18n/index.jsx";

export default function Login() {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login(email, password);
      localStorage.setItem("token", data.token);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="auth-mobile-brand">AI Stock Radar</p>
        <h1>{t("auth.loginTitlu")}</h1>
        <p className="subtitle">{t("auth.loginSub")}</p>
        {error && <div className="error">{error}</div>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            placeholder={t("auth.parola")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
        <p className="auth-forgot">
          <Link to="/resetare">{t("auth.uitatParola")}</Link>
        </p>
        <button type="submit" disabled={loading}>
          {loading ? t("auth.seAutentifica") : t("auth.loginTitlu")}
        </button>
        <p className="switch">
          {t("auth.nuAiCont")} <Link to="/register">{t("auth.creeazaUnul")}</Link>
        </p>
        <p className="auth-form-footer">{t("auth.footer")}</p>
      </form>
    </AuthLayout>
  );
}
