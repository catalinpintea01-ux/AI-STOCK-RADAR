import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { useLang } from "./index.jsx";

// Cache pe sesiune: aceleași texte + aceeași limbă → nu mai cerem serverul.
const cacheClient = new Map(); // `${limba}|${hash}` -> array tradus

// Hash scurt și stabil pentru cheile de localStorage (djb2).
function hash(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

const LS_PREFIX = "trad:";
const LS_MAX_BYTES = 40_000; // nu umplem localStorage cu payload-uri uriașe

function citesteLS(cheie) {
  try {
    const brut = localStorage.getItem(LS_PREFIX + cheie);
    return brut ? JSON.parse(brut) : null;
  } catch {
    return null;
  }
}

function scrieLS(cheie, texte) {
  try {
    const brut = JSON.stringify(texte);
    if (brut.length > LS_MAX_BYTES) return;
    localStorage.setItem(LS_PREFIX + cheie, brut);
  } catch {
    // cotă plină — golim traducerile vechi și încercăm o singură dată
    try {
      for (const k of Object.keys(localStorage)) {
        if (k.startsWith(LS_PREFIX)) localStorage.removeItem(k);
      }
      localStorage.setItem(LS_PREFIX + cheie, JSON.stringify(texte));
    } catch {
      /* renunțăm — rămâne cache-ul de sesiune */
    }
  }
}

// Traducerea la cerere a textelor statice ale unei pagini. Primește un obiect
// { cheie: textRomânesc } și întoarce o funcție de lookup: tt("cheie") dă
// textul în limba interfeței (sau originalul, până sosește / dacă eșuează).
// Trei niveluri de cache: sesiune (Map) → localStorage (instant la revenire,
// fără flash de română) → serverul (memorie + Postgres, partajat între toți
// utilizatorii). Pe română nu se face nicio cerere.
export function useTraduse(obiect) {
  const { limba } = useLang();
  const chei = useMemo(() => Object.keys(obiect), [JSON.stringify(Object.keys(obiect))]);
  const texte = chei.map((k) => obiect[k]);
  const cheieCache = limba + "|" + hash(limba + JSON.stringify(texte));

  const [traduse, setTraduse] = useState(() => {
    if (limba === "ro") return null;
    return cacheClient.get(cheieCache) || citesteLS(cheieCache);
  });

  useEffect(() => {
    if (limba === "ro" || texte.length === 0) {
      setTraduse(null);
      return;
    }
    const dinSesiune = cacheClient.get(cheieCache);
    if (dinSesiune) {
      setTraduse(dinSesiune);
      return;
    }
    const dinLS = citesteLS(cheieCache);
    if (dinLS && dinLS.length === texte.length) {
      cacheClient.set(cheieCache, dinLS);
      setTraduse(dinLS);
      return;
    }
    let anulat = false;
    api
      .traduce(texte)
      .then((data) => {
        if (!anulat && Array.isArray(data.texte) && data.texte.length === texte.length) {
          cacheClient.set(cheieCache, data.texte);
          scrieLS(cheieCache, data.texte);
          setTraduse(data.texte);
        }
      })
      .catch(() => {
        /* rămânem pe română — pagina nu se blochează niciodată */
      });
    return () => {
      anulat = true;
    };
  }, [cheieCache, limba]);

  return (cheie, vars) => {
    const idx = chei.indexOf(cheie);
    let text = (traduse && traduse[idx]) || obiect[cheie] || cheie;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replaceAll(`{${k}}`, String(v));
      }
    }
    return text;
  };
}
