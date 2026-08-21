import { useState } from "react";
import { Link } from "react-router-dom";

// Carduri cu fotografii Unsplash alese manual (hotlink direct, conform
// termenilor API), cu atribuire vizibilă. Persona-urile sunt profiluri
// ILUSTRATIVE de utilizare, nu testimoniale — nu punem citate inventate
// în gura nimănui. Click pe un card deschide "traseul recomandat" pentru
// acel profil: 3 pași concreți cu link direct în aplicație.
const PERSONAS = [
  {
    img: "https://images.unsplash.com/photo-1676989880361-091e12efc056?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    titlu: "Profesionistul ocupat",
    text: "Nu are timp de rapoarte de 40 de pagini. Deschide radarul dimineața, vede scorurile AI și știrile esențiale pe scurt, în română.",
    autor: "lucas Favre",
    autorUrl: "https://unsplash.com/@we_are_rising",
    traseuTitlu: "Rutina de 5 minute pe zi",
    traseu: [
      { text: "Adaugă 5-10 acțiuni care te interesează — analiza AI pornește singură", to: "/" },
      { text: "Dimineața, deschide digestul zilnic: doar schimbările importante", to: "/alerte" },
      { text: "O privire pe topul scorurilor AI, direct pe prima pagină", to: "/" },
    ],
  },
  {
    img: "https://images.unsplash.com/photo-1484863137850-59afcfe05386?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    titlu: "Începătoarea prudentă",
    text: "Vrea să învețe fără să riște bani reali. Exersează pe portofoliul virtual de 10.000 USD și urmărește cum evoluează scorurile în timp.",
    autor: "Brooke Cagle",
    autorUrl: "https://unsplash.com/@brookecagle",
    traseuTitlu: "Învață fără niciun risc",
    traseu: [
      { text: "Pornește cu 10.000 USD virtuali în portofoliul de exersare", to: "/portofoliu" },
      { text: "Citește pe scurt cum se calculează scorul AI — fără jargon", to: "/metodologie" },
      { text: "Urmărește gratuit până la 3 acțiuni și compară-le în timp", to: "/" },
    ],
  },
  {
    img: "https://images.unsplash.com/photo-1637589308599-3478cc55510d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    titlu: "Studentul curios",
    text: "Descoperă cum funcționează piețele: sub-scoruri explicate pe înțelesul lui, dicționar de termeni și context AI la fiecare acțiune.",
    autor: "Fotos",
    autorUrl: "https://unsplash.com/@fotospk",
    traseuTitlu: "De la zero la fluent în piețe",
    traseu: [
      { text: "20 de lecții scurte + dicționarul de termeni, în română", to: "/informare" },
      { text: "Vezi exact formula din spatele scorului AI", to: "/metodologie" },
      { text: "Pune două companii față în față cu comparatorul", to: "/" },
    ],
  },
];

// variant="app" (dashboard, logat): pașii au link-uri reale către pagini.
// variant="public" (landing, nelogat): pașii sunt informativi, iar CTA-ul
// unic e crearea contului — rutele private oricum ar cere login.
export default function PersonaCards({ variant = "app" }) {
  const [deschis, setDeschis] = useState(null);

  return (
    <>
      <div className="landing-personas">
        {PERSONAS.map((p, i) => (
          <div
            key={p.titlu}
            className={`landing-persona landing-persona-clickable ${deschis === i ? "landing-persona-open" : ""}`}
            onClick={() => setDeschis(deschis === i ? null : i)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setDeschis(deschis === i ? null : i);
              }
            }}
          >
            <img src={p.img} alt="" loading="lazy" />
            <div className="landing-persona-body">
              <h3>{p.titlu}</h3>
              <p>{p.text}</p>
              <span className="persona-toggle">
                {deschis === i ? "Ascunde traseul ↑" : "Vezi traseul recomandat ↓"}
              </span>
              {deschis === i && (
                <div className="persona-path" onClick={(e) => e.stopPropagation()}>
                  <p className="persona-path-title">{p.traseuTitlu}</p>
                  <ol className="persona-path-steps">
                    {p.traseu.map((pas, j) => (
                      <li key={j}>
                        {variant === "app" ? <Link to={pas.to}>{pas.text}</Link> : <span>{pas.text}</span>}
                      </li>
                    ))}
                  </ol>
                  {variant === "public" && (
                    <Link to="/register" className="landing-cta persona-path-cta">
                      Începe gratuit →
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="landing-photo-credit">
        Profiluri ilustrative de utilizare · Fotografii:{" "}
        {PERSONAS.map((p, i) => (
          <span key={p.autor}>
            <a href={p.autorUrl} target="_blank" rel="noopener noreferrer">
              {p.autor}
            </a>
            {i < PERSONAS.length - 1 ? " · " : ""}
          </span>
        ))}{" "}
        / <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a>
      </p>
    </>
  );
}
