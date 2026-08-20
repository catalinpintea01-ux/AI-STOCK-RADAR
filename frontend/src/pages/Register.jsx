import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import AuthLayout from "../components/AuthLayout.jsx";

export default function Register() {
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
      const data = await api.register(email, password);
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
        <h1>Creează cont</h1>
        <p className="subtitle">
          Primești 10.000 USD virtuali — testează-ți strategia înainte să investești bani reali.
        </p>
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
            placeholder="Parolă (min. 8 caractere)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ascunde parola" : "Arată parola"}
          >
            {showPassword ? "🙈" : "👁"}
          </button>
        </div>
        {password.length > 0 && (
          <p className={`password-hint ${password.length >= 8 ? "ok" : ""}`}>
            {password.length >= 8 ? "✓ Lungime suficientă" : `Minim 8 caractere (${password.length}/8)`}
          </p>
        )}
        <button type="submit" disabled={loading}>
          {loading ? "Se creează contul..." : "Creează cont"}
        </button>
        <p className="switch">
          Ai deja cont? <Link to="/login">Autentifică-te</Link>
        </p>
        <p className="auth-form-footer">Conținut educațional, nu recomandare de investiții.</p>
      </form>
    </AuthLayout>
  );
}
