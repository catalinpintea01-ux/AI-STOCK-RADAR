import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { track } from "@vercel/analytics";
import { api } from "../api";
import { useLang } from "../i18n/index.jsx";

// "Continuă cu Google" — Google Identity Services, fluxul cu ID token:
// Google randează butonul (în limba interfeței), ne dă un JWT, îl trimitem la
// /auth/google, iar serverul îl verifică și întoarce tokenul nostru.
// Fără VITE_GOOGLE_CLIENT_ID componenta nu randează nimic — paginile de cont
// funcționează identic până când Client ID-ul e configurat.
//  simbol: acțiunea aleasă în demo — intră în watchlist după un cont nou
//  mod:    "register" | "login" (doar pentru evenimentele de pâlnie)
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

function incarcaScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const existent = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existent) {
      existent.addEventListener("load", () => resolve());
      existent.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export default function GoogleButton({ simbol, mod = "register", onError }) {
  const { t, limba } = useLang();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [gata, setGata] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let anulat = false;

    incarcaScript()
      .then(() => {
        if (anulat || !containerRef.current || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async ({ credential }) => {
            try {
              const data = await api.loginGoogle(credential);
              localStorage.setItem("token", data.token);
              if (data.nou) {
                track("inregistrare");
                api.eveniment("register_done", simbol);
                if (simbol) await api.addToWatchlist(simbol).catch(() => {});
              }
              navigate("/");
            } catch (err) {
              if (onError) onError(err.message);
            }
          },
          ux_mode: "popup",
          auto_select: false,
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text: mod === "login" ? "signin_with" : "continue_with",
          width: 300,
          locale: limba || "en",
        });
        setGata(true);
      })
      .catch(() => {
        // Scriptul Google blocat (adblock, rețea) — rămâne formularul clasic.
      });

    return () => {
      anulat = true;
    };
  }, [simbol, mod, limba, navigate, onError]);

  if (!CLIENT_ID) return null;

  return (
    <div className={`google-auth ${gata ? "google-auth-gata" : ""}`}>
      <div ref={containerRef} className="google-auth-buton" />
      <div className="auth-sau">
        <span>{t("auth.sau")}</span>
      </div>
    </div>
  );
}
