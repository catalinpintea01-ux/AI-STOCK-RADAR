import { useEffect, useState } from "react";

const TYPE_SPEED_MS = 45;
const DELETE_SPEED_MS = 25;
const PAUSE_MS = 1800;

// Ciclează prin fraze scurte, scriind/ștergând litere — pur decorativ,
// niciodată folosit pentru textul de conformitate (acela rămâne static).
export default function TypewriterText({ phrases }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const curent = phrases[index % phrases.length];
    let timeout;

    if (!deleting && text === curent) {
      timeout = setTimeout(() => setDeleting(true), PAUSE_MS);
    } else if (deleting && text === "") {
      setDeleting(false);
      setIndex((i) => i + 1);
    } else {
      timeout = setTimeout(
        () => setText((t) => (deleting ? curent.slice(0, t.length - 1) : curent.slice(0, t.length + 1))),
        deleting ? DELETE_SPEED_MS : TYPE_SPEED_MS
      );
    }

    return () => clearTimeout(timeout);
  }, [text, deleting, index, phrases]);

  return (
    <span className="typewriter">
      {text}
      <span className="typewriter-cursor">|</span>
    </span>
  );
}
