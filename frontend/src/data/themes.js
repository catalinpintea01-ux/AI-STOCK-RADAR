// Temele de investiții — definițiile centrale folosite de cardurile de pe
// landing/dashboard și de paginile dedicate /tema/:slug. Texte descriptive;
// simbolurile sunt exemple de companii din temă, nu recomandări.
export const THEMES = [
  {
    slug: "inteligenta-artificiala",
    titlu: "Inteligență artificială",
    scurt: "De la cipurile din centrele de date la asistenții din buzunar — cursa AI redesenează întreaga economie.",
    descriere:
      "Inteligența artificială a devenit povestea centrală a piețelor: cererea de cipuri specializate, investițiile record în centre de date și integrarea asistenților AI în fiecare produs software au redesenat ierarhiile din tehnologie. Tema atinge întreg lanțul — proiectanții de procesoare, giganții cloud care le cumpără și companiile care transformă modelele în servicii.",
    img: "https://images.unsplash.com/photo-1697577418970-95d99b5a55cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    imgHero: "https://images.unsplash.com/photo-1697577418970-95d99b5a55cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600",
    autor: "Igor Omilaev",
    autorUrl: "https://unsplash.com/@omilaev",
    tickere: ["NVDA", "AMD", "MSFT", "GOOGL", "META", "AVGO"],
  },
  {
    slug: "economia-spatiala",
    titlu: "Economia spațială",
    scurt: "Rachete reutilizabile, constelații de sateliți și infrastructură orbitală — spațiul devine industrie.",
    descriere:
      "Costul unei lansări a scăzut de zeci de ori într-un deceniu, iar asta a transformat spațiul dintr-un program guvernamental într-o industrie: constelații de sateliți pentru internet și observarea Pământului, servicii de lansare la cerere și contracte de apărare tot mai orientate spre orbită. Tema combină pionierii pur-spațiali cu marii contractori aerospațiali.",
    img: "https://images.unsplash.com/photo-1457364887197-9150188c107b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    imgHero: "https://images.unsplash.com/photo-1457364887197-9150188c107b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600",
    autor: "SpaceX",
    autorUrl: "https://unsplash.com/@spacex",
    tickere: ["RKLB", "LMT", "BA", "NOC"],
  },
  {
    slug: "drone-si-robotica",
    titlu: "Drone și robotică",
    scurt: "Livrări autonome, agricultură de precizie, apărare — mașinile care zboară și lucrează singure.",
    descriere:
      "Roboții au ieșit din fabrici: dronele cartografiază culturi și livrează colete, chirurgia asistată robotic a devenit standard în mii de spitale, iar utilajele autonome schimbă agricultura și construcțiile. Tema cuprinde producători de drone, robotică medicală și companii industriale care automatizează lumea fizică.",
    img: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    imgHero: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600",
    autor: "Jason Mavrommatis",
    autorUrl: "https://unsplash.com/@jasonblackeye",
    tickere: ["AVAV", "TSLA", "DE", "ISRG"],
  },
  {
    slug: "pietele-globale",
    titlu: "Piețele globale",
    scurt: "Indicii, marile companii și pulsul zilnic al burselor — terenul pe care se joacă toate temele.",
    descriere:
      "Orice temă se tranzacționează, până la urmă, pe aceleași piețe: indicii mari dau ritmul, iar companiile-gigant concentrează o parte tot mai mare din capitalizarea globală. Acest coș combină ETF-urile pe marii indici americani cu câteva dintre cele mai urmărite acțiuni din lume — barometrul general al apetitului pentru risc.",
    img: "https://images.unsplash.com/photo-1651341050677-24dba59ce0fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    imgHero: "https://images.unsplash.com/photo-1651341050677-24dba59ce0fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600",
    autor: "Anne Nygård",
    autorUrl: "https://unsplash.com/@polarmermaid",
    tickere: ["SPY", "QQQ", "AAPL", "MSFT", "JPM"],
  },
];

export function getTheme(slug) {
  return THEMES.find((t) => t.slug === slug) || null;
}
