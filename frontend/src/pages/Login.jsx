import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import AuthLayout from "../components/AuthLayout.jsx";

export default function Login() {
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
        <h1>Autentificare</h1>
        <p className="subtitle">Intră în contul tău</p>
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
            placeholder="Parolă"
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
        <button type="submit" disabled={loading}>
          {loading ? "Se autentifică..." : "Autentificare"}
        </button>
        <p className="switch">
          Nu ai cont? <Link to="/register">Creează unul</Link>
        </p>
        <p className="auth-form-footer">Conținut educațional, nu recomandare de investiții.</p>
      </form>
    </AuthLayout>
  );
}
