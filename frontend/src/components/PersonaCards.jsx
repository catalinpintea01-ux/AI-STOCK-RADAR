// Carduri cu fotografii Unsplash alese manual (hotlink direct, conform
// termenilor API), cu atribuire vizibilă. Persona-urile sunt profiluri
// ILUSTRATIVE de utilizare, nu testimoniale — nu punem citate inventate
// în gura nimănui. Folosite pe landing și pe dashboard-ul logat.
const PERSONAS = [
  {
    img: "https://images.unsplash.com/photo-1676989880361-091e12efc056?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    titlu: "Profesionistul ocupat",
    text: "Nu are timp de rapoarte de 40 de pagini. Deschide radarul dimineața, vede scorurile AI și știrile esențiale pe scurt, în română.",
    autor: "lucas Favre",
    autorUrl: "https://unsplash.com/@we_are_rising",
  },
  {
    img: "https://images.unsplash.com/photo-1484863137850-59afcfe05386?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    titlu: "Începătoarea prudentă",
    text: "Vrea să învețe fără să riște bani reali. Exersează pe portofoliul virtual de 10.000 USD și urmărește cum evoluează scorurile în timp.",
    autor: "Brooke Cagle",
    autorUrl: "https://unsplash.com/@brookecagle",
  },
  {
    img: "https://images.unsplash.com/photo-1637589308599-3478cc55510d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    titlu: "Studentul curios",
    text: "Descoperă cum funcționează piețele: sub-scoruri explicate pe înțelesul lui, dicționar de termeni și context AI la fiecare acțiune.",
    autor: "Fotos",
    autorUrl: "https://unsplash.com/@fotospk",
  },
];

export default function PersonaCards() {
  return (
    <>
      <div className="landing-personas">
        {PERSONAS.map((p) => (
          <div key={p.titlu} className="landing-persona">
            <img src={p.img} alt="" loading="lazy" />
            <div className="landing-persona-body">
              <h3>{p.titlu}</h3>
              <p>{p.text}</p>
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
