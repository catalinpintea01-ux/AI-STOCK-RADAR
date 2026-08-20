import { useEffect, useState } from "react";

// Numără de la 0 până la valoarea reală la fiecare montare/schimbare — pur
// decorativ, nu întârzie afișarea datelor (acestea sunt deja disponibile).
export default function AnimatedNumber({ value, duration = 800 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf;
    const start = performance.now();

    function step(now) {
      const progres = Math.min((now - start) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progres, 3);
      setDisplay(Math.round(value * easeOut));
      if (progres < 1) raf = requestAnimationFrame(step);
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return display;
}
