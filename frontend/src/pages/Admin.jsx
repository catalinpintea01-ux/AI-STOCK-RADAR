import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { SkeletonPage } from "../components/Skeleton.jsx";
import { Users, Star, Mail, TrendingUp } from "lucide-react";
import { useLang } from "../i18n/index.jsx";

// Panou de administrare — vizibil doar conturilor din ADMIN_EMAILS (serverul
// răspunde 403 pentru oricine altcineva). Doar în română: e pagina fondatorului,
// nu a utilizatorilor.
export default function Admin() {
  const { locale } = useLang();
  const [date, setDate] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getAdminRezumat().then(setDate).catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="portfolio-page">
        <h1 className="page-title">Administrare</h1>
        <p className="page-message">{error}</p>
        <Link to="/" className="methodology-link">← Înapoi la radar</Link>
      </div>
    );
  }
  if (!date) return <SkeletonPage />;

  const maxZi = Math.max(...date.peZile.map((z) => z.conturi), 1);
  const fmt = (d) => new Date(d).toLocaleString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="portfolio-page">
      <h1 className="page-title">Administrare</h1>
      <p className="cash">Conturile și lista de preînregistrare Premium — doar tu vezi pagina asta.</p>

      <div className="dash-stats admin-stats">
        <div className="stat-tile">
          <span className="stat-value"><Users size={16} className="ic" /> {date.totalConturi}</span>
          <span className="stat-label">Conturi în total</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value optimist">{date.conturiReale}</span>
          <span className="stat-label">Conturi reale (fără test)</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value"><Mail size={16} className="ic" /> {date.preinregistrati}</span>
          <span className="stat-label">Preînregistrați Premium</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value"><Star size={16} className="ic" /> {date.premiumActive}</span>
          <span className="stat-label">Premium activ</span>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Ultimele 14 zile</p>
            <h2><TrendingUp size={16} className="h2-ic" /> Conturi noi pe zi</h2>
          </div>
        </div>
        <div className="admin-zile">
          {date.peZile.map((z) => (
            <div key={z.zi} className="admin-zi" title={`${z.zi}: ${z.conturi} conturi`}>
              <span className="admin-zi-nr">{z.conturi > 0 ? z.conturi : ""}</span>
              <div className="admin-zi-bara" style={{ height: `${Math.max((z.conturi / maxZi) * 64, 3)}px` }} />
              <span className="admin-zi-eticheta">{z.zi.slice(8)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Viitorii clienți</p>
            <h2><Mail size={16} className="h2-ic" /> Lista de preînregistrare Premium</h2>
          </div>
        </div>
        {date.waitlist.length === 0 ? (
          <p className="empty">Încă nimeni pe listă — se umple după promovare.</p>
        ) : (
          <table className="admin-tabel">
            <thead>
              <tr><th>#</th><th>Email</th><th>Înscris</th></tr>
            </thead>
            <tbody>
              {date.waitlist.map((w) => (
                <tr key={w.pozitie} className={w.test ? "admin-rand-test" : ""}>
                  <td>{w.pozitie}</td>
                  <td>{w.email}{w.test && <span className="admin-badge-test">test</span>}</td>
                  <td>{fmt(w.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Cine s-a alăturat</p>
            <h2><Users size={16} className="h2-ic" /> Ultimele conturi create</h2>
          </div>
        </div>
        <table className="admin-tabel">
          <thead>
            <tr><th>Email</th><th>Creat</th></tr>
          </thead>
          <tbody>
            {date.conturiRecente.map((u) => (
              <tr key={u.email} className={u.test ? "admin-rand-test" : ""}>
                <td>{u.email}{u.test && <span className="admin-badge-test">test</span>}</td>
                <td>{fmt(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
