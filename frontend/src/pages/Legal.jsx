import { Link } from "react-router-dom";

// Pagini legale (draft): Termeni și Politica de confidențialitate. Publice,
// fără autentificare. ATENȚIE: [DATELE FIRMEI] trebuie completate înainte de
// campanii plătite, iar textele revizuite de un specialist.
function LegalLayout({ titlu, actualizat, children }) {
  return (
    <div className="portfolio-page legal-page">
      <Link to="/" className="back-link">
        ← AI Stock Radar
      </Link>
      <h1 className="page-title">{titlu}</h1>
      <p className="cash">Ultima actualizare: {actualizat}</p>
      <section className="holdings legal-body">{children}</section>
    </div>
  );
}

export function Termeni() {
  return (
    <LegalLayout titlu="Termeni și condiții" actualizat="25 august 2026">
      <h2>1. Cine suntem</h2>
      <p>
        Platforma AI Stock Radar („Platforma", „noi") este operată de [DENUMIRE FIRMĂ SRL],
        înregistrată în România, [CUI / Nr. Reg. Com. / sediu]. Contact:{" "}
        <a href="mailto:contact@stockradarai.com">contact@stockradarai.com</a>.
      </p>

      <h2>2. Ce este Platforma — și ce NU este</h2>
      <p>
        AI Stock Radar este un instrument educațional de analiză a informațiilor publice despre
        piețele de acțiuni: scoruri generate algoritmic, rezumate de știri și un portofoliu virtual
        de exersare. Platforma NU oferă consultanță de investiții, recomandări personalizate,
        servicii de administrare de portofoliu sau intermediere de tranzacții, în sensul
        legislației aplicabile (inclusiv MiFID II și reglementările ASF). Nicio informație afișată
        nu constituie un îndemn de a cumpăra sau vinde instrumente financiare. Deciziile de
        investiții îți aparțin integral; pentru sfaturi personalizate, consultă un consultant
        autorizat.
      </p>

      <h2>3. Contul tău</h2>
      <p>
        Pentru folosirea Platformei este necesar un cont (email + parolă). Ești responsabil de
        confidențialitatea datelor de autentificare și de activitatea din cont. Poți solicita
        oricând ștergerea contului la adresa de contact.
      </p>

      <h2>4. Abonamente, perioada de probă și plăți</h2>
      <p>
        Planul gratuit include funcțiile de bază, cu limitele afișate în pagina „Planuri și
        prețuri". Abonamentul Premium (29,99 RON/lună) include o perioadă de probă gratuită de 3
        zile; cardul este colectat la activare prin procesatorul de plăți Stripe, iar facturarea
        începe automat la finalul perioadei de probă dacă abonamentul nu este anulat. Poți anula
        oricând din aplicație („Gestionează abonamentul"); anularea în perioada de probă nu
        implică niciun cost, iar după facturare păstrezi accesul până la finalul perioadei
        plătite. Prețurile pot fi modificate cu notificare prealabilă.
      </p>

      <h2>5. Sursele de date și acuratețea</h2>
      <p>
        Prețurile, indicatorii și știrile provin de la furnizori terți (Finnhub, Yahoo Finance,
        agenții de presă) și pot fi întârziate, incomplete sau eronate. Scorurile și textele
        generate de inteligența artificială sunt rezumate automate ale datelor publice și pot
        conține erori. Nu garantăm acuratețea, completitudinea sau actualitatea informațiilor.
      </p>

      <h2>6. Limitarea răspunderii</h2>
      <p>
        Platforma este furnizată „ca atare". În limita maximă permisă de lege, nu răspundem pentru
        pierderi directe sau indirecte rezultate din folosirea informațiilor afișate, inclusiv
        decizii de investiții luate pe baza lor, întreruperi ale serviciului sau erori ale
        surselor de date.
      </p>

      <h2>7. Utilizare acceptabilă și proprietate intelectuală</h2>
      <p>
        Nu este permisă extragerea automată de date, revânzarea conținutului sau folosirea
        Platformei în scopuri ilegale. Interfața, mascota, textele și elementele grafice ne
        aparțin sau sunt licențiate (fotografii Unsplash, cu atribuire).
      </p>

      <h2>8. Modificări și legea aplicabilă</h2>
      <p>
        Putem actualiza acești termeni; versiunea curentă este publicată pe această pagină.
        Contractul este guvernat de legea română; litigiile se soluționează de instanțele
        competente din România. Poți apela și la ANPC sau platforma europeană ODR.
      </p>

      <p className="legal-nota">
        Vezi și <Link to="/confidentialitate">Politica de confidențialitate</Link>.
      </p>
    </LegalLayout>
  );
}

export function Confidentialitate() {
  return (
    <LegalLayout titlu="Politica de confidențialitate" actualizat="25 august 2026">
      <h2>1. Operatorul datelor</h2>
      <p>
        [DENUMIRE FIRMĂ SRL], [sediu, CUI] — operator de date în sensul Regulamentului (UE)
        2016/679 (GDPR). Contact:{" "}
        <a href="mailto:contact@stockradarai.com">contact@stockradarai.com</a>.
      </p>

      <h2>2. Ce date prelucrăm și de ce</h2>
      <ul>
        <li>
          <strong>Date de cont</strong> (email, nume afișat, parolă criptată) — pentru crearea și
          funcționarea contului (temei: executarea contractului).
        </li>
        <li>
          <strong>Date de utilizare</strong> (watchlist, portofoliu virtual, preferințe) — pentru
          furnizarea funcțiilor aplicației (temei: executarea contractului).
        </li>
        <li>
          <strong>Date de plată</strong> — prelucrate exclusiv de Stripe; noi nu vedem și nu
          stocăm numărul cardului (temei: executarea contractului; obligații fiscale).
        </li>
        <li>
          <strong>Date tehnice agregate</strong> (pagini vizitate, tip dispozitiv) — statistici
          anonime de trafic, fără cookie-uri de urmărire (temei: interes legitim).
        </li>
      </ul>

      <h2>3. Cui transmitem date (persoane împuternicite)</h2>
      <p>
        Infrastructură și servicii: Vercel (găzduire frontend), Railway (backend și bază de date),
        Stripe (plăți), Finnhub și Yahoo Finance (date de piață — nu primesc datele tale
        personale), Anthropic (generarea textelor — nu primește date personale), Unsplash
        (imagini). Unii furnizori sunt în afara SEE; transferurile se bazează pe Clauze
        Contractuale Standard.
      </p>

      <h2>4. Cookie-uri și stocare locală</h2>
      <p>
        Folosim doar stocare locală strict necesară funcționării: token-ul de autentificare și
        preferința de temă (light/dark). Nu folosim cookie-uri de publicitate sau profilare;
        statisticile de trafic sunt anonime și fără cookie-uri.
      </p>

      <h2>5. Cât păstrăm datele</h2>
      <p>
        Pe durata existenței contului. La ștergerea contului, datele personale sunt eliminate în
        cel mult 30 de zile, cu excepția celor pe care legea ne obligă să le păstrăm (ex.
        documente de facturare).
      </p>

      <h2>6. Drepturile tale</h2>
      <p>
        Ai dreptul de acces, rectificare, ștergere, restricționare, portabilitate și opoziție,
        precum și dreptul de a depune plângere la ANSPDCP (dataprotection.ro). Scrie-ne la adresa
        de contact și răspundem în cel mult 30 de zile.
      </p>

      <p className="legal-nota">
        Vezi și <Link to="/termeni">Termenii și condițiile</Link>.
      </p>
    </LegalLayout>
  );
}
