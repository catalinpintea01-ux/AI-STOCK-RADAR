import { useEffect, useState } from "react";
import { api } from "../api";
import StockLogo from "../components/StockLogo.jsx";

export default function Community() {
  const [inviteCode, setInviteCode] = useState("");
  const [friends, setFriends] = useState(null);
  const [codInput, setCodInput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function load() {
    return api
      .getFriends()
      .then((data) => setFriends(data.friends))
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    api.getMyInviteCode().then((data) => setInviteCode(data.inviteCode)).catch(() => {});
    load();
  }, []);

  function copyCode() {
    navigator.clipboard.writeText(inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    try {
      await api.addFriend(codInput.trim());
      setCodInput("");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemove(friendId) {
    await api.removeFriend(friendId);
    await load();
  }

  if (!friends) return <div className="page-message">Se încarcă...</div>;

  return (
    <div className="portfolio-page">
      <h1 className="page-title">Comunitate</h1>
      <p className="cash">
        Invită prieteni și vedeți reciproc portofoliile virtuale — toată lumea pornește de la aceiași 10.000 USD, deci
        comparația e corectă.
      </p>

      <div className="value-card">
        <span className="label">Codul tău de invitație</span>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.4rem" }}>
          <code style={{ fontSize: "0.75rem", wordBreak: "break-all", flex: 1 }}>{inviteCode}</code>
          <button className="logout" onClick={copyCode}>
            {copied ? "Copiat!" : "Copiază"}
          </button>
        </div>
        <p className="muted" style={{ marginTop: "0.5rem" }}>
          Trimite-l unui prieten. Când îl introduce mai jos, deveniți prieteni și vă vedeți reciproc portofoliile.
        </p>
      </div>

      <section className="search-section">
        <h2>Adaugă un prieten</h2>
        <form className="search-form" onSubmit={handleAdd}>
          <input
            type="text"
            placeholder="Lipește codul de invitație al prietenului"
            value={codInput}
            onChange={(e) => setCodInput(e.target.value)}
          />
          <button type="submit">Adaugă</button>
        </form>
        {error && <div className="error">{error}</div>}
      </section>

      <section className="holdings">
        <h2>Prietenii tăi</h2>
        {friends.length === 0 ? (
          <p className="empty">Nu ai încă niciun prieten adăugat. Trimite-i codul tău sau cere-i pe al lui.</p>
        ) : (
          <ul className="stock-list">
            {friends.map((f) => (
              <li key={f.id} className="accordion-item" style={{ padding: "1rem 1.1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong>{f.email}</strong>
                    {f.valoareTotala != null && (
                      <div className="muted">
                        Valoare totală: ${f.valoareTotala.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {f.randamentProcent != null && (
                      <div className={f.randamentProcent >= 0 ? "gain-positive" : "gain-negative"}>
                        {f.randamentProcent >= 0 ? "+" : ""}
                        {f.randamentProcent.toFixed(1)}%
                      </div>
                    )}
                    <button className="logout" onClick={() => handleRemove(f.id)} style={{ marginTop: "0.4rem" }}>
                      Elimină
                    </button>
                  </div>
                </div>

                {f.holdings && f.holdings.length > 0 && (
                  <ul className="holding-list" style={{ marginTop: "0.75rem" }}>
                    {f.holdings.map((h) => (
                      <li key={h.simbol} className="holding-row">
                        <div className="stock-row-left">
                          <StockLogo simbol={h.simbol} size={22} />
                          <div>
                            <strong>{h.simbol}</strong>
                            <div className="muted">
                              {h.cantitate} buc. @ ${h.pretMediuAchizitie.toFixed(2)} medie
                            </div>
                          </div>
                        </div>
                        <div>${(h.cantitate * h.pretCurent).toFixed(2)}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
