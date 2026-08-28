import { createContext, useContext, useEffect, useState } from "react";
import ro from "./dict/ro.js";
import en from "./dict/en.js";
import es from "./dict/es.js";
import fr from "./dict/fr.js";
import de from "./dict/de.js";
import it from "./dict/it.js";
import pt from "./dict/pt.js";
import nl from "./dict/nl.js";
import pl from "./dict/pl.js";
import hu from "./dict/hu.js";

// Dicționarul român e sursa de adevăr: orice cheie lipsă într-o altă limbă
// cade înapoi pe română, ca interfața să nu afișeze niciodată chei goale.
export const DICTS = { ro, en, es, fr, de, it, pt, nl, pl, hu };

export const LIMBI = [
  { cod: "ro", nume: "Română", steag: "ro", locale: "ro-RO" },
  { cod: "en", nume: "English", steag: "gb", locale: "en-GB" },
  { cod: "es", nume: "Español", steag: "es", locale: "es-ES" },
  { cod: "fr", nume: "Français", steag: "fr", locale: "fr-FR" },
  { cod: "de", nume: "Deutsch", steag: "de", locale: "de-DE" },
  { cod: "it", nume: "Italiano", steag: "it", locale: "it-IT" },
  { cod: "pt", nume: "Português", steag: "pt", locale: "pt-PT" },
  { cod: "nl", nume: "Nederlands", steag: "nl", locale: "nl-NL" },
  { cod: "pl", nume: "Polski", steag: "pl", locale: "pl-PL" },
  { cod: "hu", nume: "Magyar", steag: "hu", locale: "hu-HU" },
];

function detecteazaLimba() {
  try {
    const salvata = localStorage.getItem("limba");
    if (salvata && DICTS[salvata]) return salvata;
    const browser = (navigator.language || "en").slice(0, 2).toLowerCase();
    if (DICTS[browser]) return browser;
  } catch {
    /* localStorage indisponibil (ex: mod privat strict) */
  }
  return "en";
}

function cauta(dict, cheie) {
  let nod = dict;
  for (const parte of cheie.split(".")) {
    if (nod == null) return undefined;
    nod = nod[parte];
  }
  return nod;
}

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [limba, setLimbaState] = useState(detecteazaLimba);

  useEffect(() => {
    document.documentElement.lang = limba;
  }, [limba]);

  function setLimba(cod) {
    if (!DICTS[cod]) return;
    setLimbaState(cod);
    try {
      localStorage.setItem("limba", cod);
    } catch {
      /* ignorăm — limba rămâne doar pe sesiunea curentă */
    }
  }

  // t("dash.actualizat", { timp: "..." }) — interpolare simplă {cheie}.
  // Valorile pot fi și array-uri (liste de fraze/feature-uri) — se întorc ca atare.
  function t(cheie, vars) {
    let val = cauta(DICTS[limba], cheie);
    if (val === undefined) val = cauta(DICTS.ro, cheie);
    if (val === undefined) return cheie;
    if (typeof val === "string" && vars) {
      for (const [k, v] of Object.entries(vars)) {
        val = val.replaceAll(`{${k}}`, String(v));
      }
    }
    return val;
  }

  const info = LIMBI.find((l) => l.cod === limba) || LIMBI[0];

  return (
    <LanguageContext.Provider value={{ limba, setLimba, t, locale: info.locale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
