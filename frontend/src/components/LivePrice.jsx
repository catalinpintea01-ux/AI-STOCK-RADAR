import { useEffect, useRef, useState } from "react";

// Efect "odometru" pe prețurile live: la refresh, cifra alunecă animat de la
// valoarea veche la cea nouă și primește un puls scurt verde/roșu după
// direcție — feedback-ul de piață vie din aplicațiile de brokeraj moderne.
export default function LivePrice({ value, prefix = "$", decimals = 2 }) {
  const [display, setDisplay] = useState(value);
  const [flash, setFlash] = useState(null); // "up" | "down" | null
  const prev = useRef(value);

  useEffect(() => {
    if (value == null) return;
    const from = prev.current;
    prev.current = value;
    if (from == null || from === value) {
      setDisplay(value);
      return;
    }

    setFlash(value > from ? "up" : "down");
    const start = performance.now();
    const durata = 600;
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / durata);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const t = setTimeout(() => setFlash(null), 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [value]);

  if (value == null || display == null) return null;

  return (
    <span className={`live-price${flash ? ` price-flash-${flash}` : ""}`}>
      {prefix}
      {Number(display).toFixed(decimals)}
    </span>
  );
}
