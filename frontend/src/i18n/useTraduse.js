import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { useLang } from "./index.jsx";

// Cache pe sesiune: aceleași texte + aceeași limbă → nu mai cerem serverul.
const cacheClient = new Map(); // `${limba}|${json}` -> array tradus

// Traducerea la cerere a textelor statice ale unei pagini. Primește un obiect
// { cheie: textRomânesc } și întoarce o funcție de lookup: tt("cheie") dă
// textul în limba interfeței (sau originalul, până sosește / dacă eșuează).
// Pe română nu face nicio cerere. Serverul ține cache 7 zile per limbă, deci
// costul real e o singură traducere per pagină per limbă pe săptămână.
export function useTraduse(obiect) {
  const { limba } = useLang();
  const chei = useMemo(() => Object.keys(obiect), [JSON.stringify(Object.keys(obiect))]);
  const texte = chei.map((k) => obiect[k]);
  const cheieCache = limba + "|" + JSON.stringify(texte);

  const [traduse, setTraduse] = useState(() => cacheClient.get(cheieCache) || null);

  useEffect(() => {
    if (limba === "ro" || texte.length === 0) {
      setTraduse(null);
      return;
    }
    const existente = cacheClient.get(cheieCache);
    if (existente) {
      setTraduse(existente);
      return;
    }
    let anulat = false;
    api
      .traduce(texte)
      .then((data) => {
        if (!anulat && Array.isArray(data.texte) && data.texte.length === texte.length) {
          cacheClient.set(cheieCache, data.texte);
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
