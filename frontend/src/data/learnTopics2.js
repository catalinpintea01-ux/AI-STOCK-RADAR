// Încă 30 de subiecte educative (21-50) — același ton descriptiv, fără
// consultanță de investiții. Se concatenează cu TOPICS din learnTopics.js.
export const TOPICS_EXTRA = [
  {
    id: "dobanda-compusa",
    titlu: "Dobânda compusă — motorul tăcut al averilor pe termen lung",
    paragrafe: [
      "Dobânda compusă înseamnă că nu câștigi doar pe banii investiți inițial, ci și pe câștigurile acumulate anterior — câștig peste câștig, an după an. La început efectul pare neînsemnat: 8% dintr-o sumă mică e o sumă mică. Magia apare în timp: după 10, 20, 30 de ani, curba devine tot mai abruptă, pentru că baza pe care se aplică procentul crește constant.",
      "Un exemplu simplu: 10.000 de lei investiți la un randament mediu de 8% pe an devin aproximativ 21.600 lei în 10 ani, 46.600 lei în 20 de ani și 100.600 lei în 30 de ani — fără să mai adaugi nimic. Aceiași bani, ținuți sub saltea, rămân 10.000 de lei (și valorează mai puțin din cauza inflației). Diferența dintre 20 și 30 de ani e mai mare decât tot ce s-a acumulat în primii 20 — de aceea timpul în piață e considerat cel mai valoros ingredient.",
      "Concluzia practică pentru un începător: începutul devreme contează mai mult decât suma. Cineva care investește puțin la 25 de ani ajunge, de regulă, mai departe decât cineva care investește mult la 45. Folosește calculatorul de mai jos ca să vezi efectul cu propriile cifre — e educativ, nu o promisiune de randament.",
    ],
  },
  {
    id: "inflatia",
    titlu: "Inflația — de ce banii care stau pe loc pierd valoare",
    paragrafe: [
      "Inflația este creșterea generală a prețurilor în timp, ceea ce înseamnă că aceeași sumă de bani cumpără tot mai puțin. La o inflație de 5% pe an, 1.000 de lei de azi au puterea de cumpărare a doar ~950 de lei peste un an și a ~600 de lei peste 10 ani. E un cost invizibil: nu îl vezi în extrasul de cont, dar îl simți la coș.",
      "De aceea „a nu investi\" nu înseamnă „a nu risca\" — banii ținuți în numerar pierd garantat putere de cumpărare, an după an. Depozitele bancare acoperă de obicei doar o parte din inflație; istoric, clasele de active precum acțiunile au fost printre puținele care au depășit-o constant pe termen lung, cu prețul volatilității pe termen scurt.",
      "Când evaluezi orice randament, gândește-l „real\", nu „nominal\": un câștig de 7% într-un an cu inflație de 5% înseamnă un câștig real de doar ~2%. Iar când auzi „garantat 10% pe lună\" — vezi subiectul despre semnale de alarmă: astfel de promisiuni nu există în piețe legitime.",
    ],
  },
  {
    id: "brokerul",
    titlu: "Ce este un broker și pe ce criterii se compară",
    paragrafe: [
      "Brokerul este intermediarul autorizat prin care ordinele tale ajung la bursă — persoanele fizice nu pot tranzacționa direct. Astăzi, majoritatea brokerilor sunt platforme online: îți deschizi cont, alimentezi și plasezi ordine din aplicație. În România și UE, brokerii sunt supravegheați de autorități (ASF la noi, respectiv autoritățile din țara de origine pentru brokerii europeni pașaportați).",
      "Criteriile obiective de comparație includ: comisioanele (per tranzacție, de custodie, de retragere, de inactivitate), piețele accesibile (SUA, Europa, BVB), protecția contului (schemele de compensare a investitorilor și segregarea activelor), calitatea platformei și a raportărilor fiscale, plus moneda conturilor și costurile de conversie valutară.",
      "Un aspect des ignorat: brokerul nu „ține\" banii tăi ca o bancă — acțiunile cumpărate sunt proprietatea ta, înregistrate separat de activele firmei de brokeraj. Aceasta este o distincție importantă pentru înțelegerea riscurilor: falimentul unui broker reglementat nu șterge, în principiu, deținerile clienților. Această aplicație nu este un broker și nu intermediază tranzacții reale — portofoliul de aici este exclusiv simulat, pentru învățare.",
    ],
  },
  {
    id: "tipuri-de-ordine",
    titlu: "Ordinele de tranzacționare: market, limit și stop, pe înțelesul tuturor",
    paragrafe: [
      "Ordinul „market\" spune: cumpără/vinde ACUM, la cel mai bun preț disponibil. E rapid și sigur ca execuție, dar prețul exact poate diferi ușor de cel văzut pe ecran, mai ales la acțiuni puțin lichide sau în momente agitate — fenomen numit slippage.",
      "Ordinul „limit\" spune: cumpără doar la prețul X sau mai jos (respectiv vinde doar la X sau mai sus). Controlezi prețul, dar nu ai garanția execuției — dacă piața nu atinge nivelul tău, ordinul rămâne neexecutat. E instrumentul de bază al disciplinei: decizi în avans cât ești dispus să plătești, în loc să reacționezi impulsiv.",
      "Ordinul „stop\" devine activ abia când prețul atinge un nivel prestabilit — folosit tipic pentru limitarea pierderilor (stop-loss: vinde dacă scade sub X) sau pentru confirmarea unei mișcări (buy-stop). Important de înțeles: un stop-loss clasic devine ordin market la declanșare, deci în căderi bruște execuția poate fi sub nivelul setat. Nicio combinație de ordine nu elimină riscul — doar îl structurează.",
    ],
  },
  {
    id: "executie-si-decontare",
    titlu: "Ce se întâmplă după ce apeși „Cumpără\" — execuție și decontare",
    paragrafe: [
      "Când plasezi un ordin, brokerul îl transmite către bursă (sau către un sistem alternativ de tranzacționare), unde un motor de corelare îl împerechează cu ordine de sens opus. Execuția — momentul în care tranzacția se încheie la un preț — durează de regulă fracțiuni de secundă la acțiunile lichide.",
      "Decontarea — transferul efectiv al banilor și al acțiunilor — se întâmplă însă mai târziu: în SUA la o zi lucrătoare după tranzacție (T+1), în Europa de regulă la două (T+2). Practic, în ziua tranzacției se blochează sumele, iar proprietatea „se așază\" juridic în zilele următoare. De aceea unele retrageri de bani devin disponibile abia după decontare.",
      "Pentru investitorul pe termen lung, aceste mecanisme sunt aproape invizibile — dar înțelegerea lor explică de ce prețul „din ecran\" e o fotografie a ultimei tranzacții, nu o garanție pentru următoarea, și de ce lichiditatea (câți cumpărători și vânzători există în acel moment) contează atât de mult.",
    ],
  },
  {
    id: "spread-si-lichiditate",
    titlu: "Spread-ul bid-ask și lichiditatea — costul invizibil al fiecărei tranzacții",
    paragrafe: [
      "În orice moment, o acțiune are două prețuri: „bid\" — cel mai bun preț la care cineva vrea să cumpere, și „ask\" — cel mai bun preț la care cineva vrea să vândă. Diferența dintre ele este spread-ul. Cumperi la ask și vinzi la bid, deci spread-ul este un cost real al tranzacționării, chiar dacă nu apare pe factură.",
      "La companiile mari și intens tranzacționate (Apple, Microsoft), spread-ul e de obicei de câțiva cenți — neglijabil. La companiile mici sau în afara orelor de vârf, spread-ul se poate lărgi considerabil: intri și ieși „mai scump\" fără să-ți dai seama. Lichiditatea — volumul de ordine disponibil — determină cât de ușor poți tranzacționa cantități mari fără să miști prețul.",
      "Regula practică pentru începători: preferă instrumentele lichide, folosește ordine limit la tot ce nu e blue-chip și evită tranzacționarea în primele și ultimele minute ale ședinței, când spread-urile sunt cele mai instabile. Cu cât tranzacționezi mai des, cu atât aceste costuri invizibile se adună mai repede.",
    ],
  },
  {
    id: "stock-split",
    titlu: "Stock split — de ce „ieftinirea\" unei acțiuni nu îți dă nimic în plus",
    paragrafe: [
      "Un stock split împarte fiecare acțiune existentă în mai multe: la un split 4-la-1, o acțiune de 400 de dolari devine patru acțiuni de 100. Valoarea deținerii tale nu se schimbă deloc — ai mai multe „felii\" din aceeași pizza, tăiate mai subțire. Companiile fac split-uri, de regulă, ca acțiunea să pară mai accesibilă psihologic pentru micii investitori.",
      "Reverse split-ul e operațiunea inversă — zece acțiuni de 1 dolar devin una de 10 — folosită adesea de companii cu preț foarte scăzut, uneori pentru a rămâne conforme cu cerințele burselor. Un reverse split în sine nu e neapărat un semn rău, dar contextul în care apare merită întotdeauna analizat.",
      "Concluzia descriptivă: split-urile schimbă numărul și prețul unitar al acțiunilor, nu valoarea companiei sau a deținerii tale. Istoric, entuziasmul din jurul split-urilor a produs mișcări de preț pe termen scurt, dar fundamentele companiei rămân exact aceleași — un exemplu bun de diferență între zgomot și substanță.",
    ],
  },
  {
    id: "buyback-uri",
    titlu: "Răscumpărările de acțiuni (buybacks) — ce înseamnă când compania își cumpără propriile acțiuni",
    paragrafe: [
      "Un buyback înseamnă că o companie folosește o parte din profit pentru a-și cumpăra propriile acțiuni din piață și, de regulă, a le anula. Rezultatul aritmetic: rămân mai puține acțiuni în circulație, deci profitul pe acțiune (EPS) crește, iar fiecare acțiune rămasă reprezintă o felie mai mare din companie.",
      "Buyback-urile sunt, alături de dividende, una dintre cele două căi principale prin care companiile returnează bani acționarilor. Diferența: dividendul e numerar impozabil la încasare, în timp ce buyback-ul lucrează indirect, prin susținerea valorii pe acțiune. Companiile mari americane cheltuie anual sute de miliarde pe răscumpărări.",
      "Nuanța critică: un buyback creează valoare doar dacă acțiunile sunt cumpărate la prețuri rezonabile și dacă banii n-ar fi avut o utilizare mai bună (investiții în creștere, reducerea datoriilor). Răscumpărările finanțate din datorie sau făcute la prețuri umflate sunt privite sceptic de analiști — încă un exemplu de titlu de știre care cere context, nu reacție.",
    ],
  },
  {
    id: "free-float",
    titlu: "Free float și structura acționariatului — cine deține de fapt compania",
    paragrafe: [
      "Free float-ul este procentul din acțiunile unei companii disponibil efectiv la tranzacționare publică — excluzând pachetele deținute de fondatori, stat, insideri sau investitori strategici care nu vând. O companie poate avea capitalizare uriașă, dar float mic: puține acțiuni disponibile înseamnă mișcări de preț mai bruște la fluxuri egale de bani.",
      "Structura acționariatului spune multe: o companie dominată de fondator păstrează viziune unitară, dar concentrează și riscul deciziilor unei singure persoane; prezența masivă a fondurilor instituționale aduce scrutin profesionist; deținerile mari ale statului pot introduce obiective non-comerciale.",
      "Pentru un începător, două lecții practice: întâi, indicii ponderați „free-float\" (cum e S&P 500) cântăresc companiile după acțiunile efectiv tranzacționabile, nu după total; apoi, la companiile cu float foarte mic, volatilitatea extremă și cozile de la știri sunt norma, nu excepția — prudența cere poziții proporțional mai mici.",
    ],
  },
  {
    id: "obligatiunile",
    titlu: "Obligațiunile — partea „plictisitoare\" dar esențială a pieței financiare",
    paragrafe: [
      "O obligațiune este, în esență, un împrumut: tu împrumuți bani unui stat sau unei companii, iar emitentul se obligă să-ți plătească dobândă periodică (cupon) și să-ți returneze suma la scadență. Spre deosebire de acțiuni, nu deții o bucată din afacere — ești creditor, nu proprietar.",
      "Regula de aur a obligațiunilor: prețul lor se mișcă invers față de dobânzile din piață. Când băncile centrale urcă dobânzile, obligațiunile vechi (cu cupoane mici) valorează mai puțin; când dobânzile scad, ele se scumpesc. Riscul principal la obligațiunile de stat solide nu e falimentul, ci această sensibilitate la dobânzi plus inflația care erodează cupoanele fixe.",
      "În portofoliile clasice, obligațiunile joacă rolul amortizorului: fluctuează mai puțin decât acțiunile și adesea (nu întotdeauna) evoluează diferit de ele în crize. Faimoasa alocare „60/40\" (acțiuni/obligațiuni) e exact despre acest echilibru între creștere și stabilitate — un concept de înțeles, nu o rețetă universală.",
    ],
  },
  {
    id: "fonduri-mutuale-vs-etf",
    titlu: "Fonduri mutuale vs. ETF-uri — două ambalaje pentru aceeași idee",
    paragrafe: [
      "Ambele instrumente pun banii mai multor investitori la comun și îi investesc într-un coș de active. Diferența majoră e „ambalajul\": fondurile mutuale clasice se cumpără și se răscumpără direct de la administrator, o dată pe zi, la valoarea activului net; ETF-urile se tranzacționează la bursă ca orice acțiune, în timp real, la prețul pieței.",
      "A doua diferență mare: gestiunea. Fondurile mutuale sunt adesea administrate activ (o echipă alege activele, cu comisioane de 1-2%+ pe an), în timp ce majoritatea ETF-urilor urmăresc pasiv un indice, cu costuri de 10-20 de ori mai mici. Deceniile de date arată că, după comisioane, majoritatea fondurilor active nu bat indicele pe termen lung — motivul central al ascensiunii investiției pasive.",
      "Pentru contextul românesc: fondurile mutuale locale au avantajul simplității (RON, fără cont de broker), ETF-urile — al costurilor și transparenței. Nu e o alegere „bine vs. rău\", ci un compromis între comoditate, cost și control, care depinde de situația fiecăruia.",
    ],
  },
  {
    id: "reit-uri",
    titlu: "REIT-urile — cum poți „deține\" imobiliare printr-o acțiune",
    paragrafe: [
      "Un REIT (Real Estate Investment Trust) este o companie listată care deține și administrează imobiliare generatoare de venit — birouri, malluri, depozite, apartamente, chiar antene de telecomunicații sau centre de date. Cumpărând acțiuni REIT, obții expunere la chirii și la valoarea proprietăților fără să cumperi vreun metru pătrat.",
      "Particularitatea legală: în SUA, REIT-urile sunt obligate să distribuie cel puțin 90% din profitul impozabil ca dividende — de aceea randamentele lor de dividend sunt tipic peste media pieței. Prețul acestei generozități: sensibilitate ridicată la dobânzi (concurează cu obligațiunile pentru banii investitorilor de venit) și cicluri imobiliare proprii.",
      "Ca lecție de diversificare, REIT-urile ilustrează perfect ideea de „clasă de active\": se comportă parțial ca acțiunile, parțial ca imobiliarele, și nu perfect corelat cu niciuna. În România, echivalentul cel mai apropiat sunt companiile imobiliare listate la BVB — conceptul de REIT pur nu există încă în legislația locală.",
    ],
  },
  {
    id: "aur-si-marfuri",
    titlu: "Aurul și materiile prime — ce rol joacă într-un portofoliu",
    paragrafe: [
      "Aurul nu produce nimic: nu plătește dividende, nu are profituri, nu crește organic. Valoarea lui vine exclusiv din raritate și din încrederea colectivă acumulată în mii de ani — motiv pentru care e tratat ca „asigurare\" împotriva crizelor și a devalorizării monedelor, nu ca investiție productivă.",
      "Istoric, aurul a strălucit exact când restul sufereau: în inflații mari, crize geopolitice sau prăbușiri de încredere în monede. Între aceste episoade, a petrecut însă decenii întregi sub maximele anterioare. Materiile prime (petrol, cupru, grâu) sunt și mai ciclice — prețurile lor reflectă echilibre fragile de cerere și ofertă globală, greu de anticipat chiar și pentru profesioniști.",
      "Expunerea modernă se face rar prin lingouri: mai des prin ETF-uri pe aur fizic sau prin acțiunile producătorilor (mineri, petroliere) — care aduc însă și risc de companie peste riscul mărfii. Alocările tipice discutate în literatura de portofoliu sunt mici, de ordinul câtorva procente — rolul e de diversificare, nu de motor de creștere.",
    ],
  },
  {
    id: "cripto-vs-actiuni",
    titlu: "Criptomonedele vs. acțiunile — diferențe fundamentale, nu doar de volatilitate",
    paragrafe: [
      "O acțiune este o creanță asupra unei afaceri reale: fabrici, produse, clienți, profituri care pot fi distribuite. O criptomonedă este o înregistrare într-un registru digital descentralizat — valoarea ei depinde exclusiv de ce sunt dispuși alții să plătească, fără fluxuri de numerar subiacente care să ancoreze prețul.",
      "De aici decurge diferența de evaluare: la acțiuni există instrumente clasice (profituri, multipli, dividende) care leagă prețul de realitatea economică; la cripto, analiza fundamentală în sens tradițional nu are obiect, iar prețurile pot face ±50% în luni fără nicio schimbare „de business\". La asta se adaugă riscuri specifice: custodia (cheile pierdute sunt bani pierduți), platformele nereglementate și fraudele istorice de amploare.",
      "Aplicația aceasta acoperă exclusiv acțiuni — dar merită înțeles peisajul: reglementarea europeană MiCA a adus reguli pentru emitenți și platforme, iar ETF-urile pe Bitcoin au apropiat cripto de infrastructura clasică. Rămâne o clasă de active speculativă, în care regula veche se aplică dublu: nu aloca niciodată bani pe care nu-ți permiți să-i pierzi integral.",
    ],
  },
  {
    id: "dollar-cost-averaging",
    titlu: "Dollar-cost averaging în detaliu — investiția pe pilot automat",
    paragrafe: [
      "DCA înseamnă să investești aceeași sumă la intervale regulate — de exemplu 500 de lei în fiecare lună — indiferent de nivelul pieței. Când prețurile sunt jos, suma ta cumpără mai multe unități; când sunt sus, mai puține. Rezultatul: un preț mediu de achiziție rezonabil, obținut fără nicio decizie de „timing\".",
      "Avantajul principal nu e matematic, ci psihologic: elimină întrebarea paralizantă „e momentul potrivit?\" și transformă investiția într-un obicei automat, imun la titluri alarmiste. Statistic, investirea imediată a unei sume mari a bătut ușor DCA-ul în majoritatea perioadelor istorice (piețele cresc mai des decât scad) — dar DCA câștigă detașat la capitolul disciplină și confort emoțional.",
      "Folosește simulatorul de mai jos ca să vezi mecanica: contribuții lunare, creștere presupusă constantă, și diferența dintre banii depuși și valoarea acumulată. E o ilustrare educativă cu randament ipotetic — piețele reale nu cresc liniar, iar randamentele trecute nu garantează nimic.",
    ],
  },
  {
    id: "rebalansarea",
    titlu: "Rebalansarea portofoliului — cum îți păstrezi strategia pe șine",
    paragrafe: [
      "Dacă ți-ai propus o alocare — să zicem 70% acțiuni, 30% obligațiuni — piața ți-o va strica singură: după un an bun al acțiunilor, poți ajunge la 80/20 fără să fi făcut nimic. Rebalansarea înseamnă readucerea periodică a portofoliului la proporțiile alese, vânzând din ce a crescut peste țintă și cumpărând din ce a rămas în urmă.",
      "Efectul ascuns: rebalansarea te obligă mecanic să vinzi scump și să cumperi ieftin — exact opusul instinctelor. Nu maximizează randamentul în orice scenariu, dar ține riscul sub control: fără ea, portofoliul devine treptat tot mai concentrat în activele care au crescut recent, exact cele mai vulnerabile la o corecție.",
      "Practic, există două abordări: calendaristică (o dată pe an sau la 6 luni, simplu de respectat) și pe praguri (rebalansezi doar când o alocare deviază cu mai mult de X puncte procentuale). Pentru sume mici, rebalansarea prin contribuții noi — direcționezi banii proaspeți spre clasa rămasă în urmă — evită și vânzările, și eventualele taxe.",
    ],
  },
  {
    id: "taxele-in-romania",
    titlu: "Impozitarea câștigurilor din investiții în România — cadrul general",
    paragrafe: [
      "În România, câștigurile din vânzarea acțiunilor sunt venituri din investiții impozabile. Cadrul din ultimii ani: pentru tranzacțiile făcute prin intermediari români sau înregistrați fiscal aici, impozitul se reține la sursă — 1% pentru deținerile de peste un an și 3% pentru cele sub un an — iar procesul e în mare parte automat.",
      "Pentru conturile la brokeri străini fără reprezentant fiscal local, regimul clasic se aplică în continuare: declari singur câștigurile anual (declarația unică) și plătești impozitul aferent; dividendele au propriul impozit reținut de regulă la sursă, iar peste anumite praguri de venit se datorează și CASS.",
      "Important: acesta e un rezumat educativ al cadrului general, care se schimbă frecvent — nu este consultanță fiscală. Înainte de decizii cu miză, verifică legislația curentă pe anaf.ro sau discută cu un consultant fiscal; câteva sute de lei plătite unui specialist pot economisi mult mai mult în erori evitate.",
    ],
  },
  {
    id: "protectia-investitorului",
    titlu: "Ce protecții ai ca investitor — segregare, compensare, reglementare",
    paragrafe: [
      "Prima linie de protecție e segregarea activelor: brokerii reglementați sunt obligați să țină instrumentele financiare ale clienților separate de banii firmei. Acțiunile tale sunt proprietatea ta — în caz de faliment al brokerului, ele nu intră în masa credală, ci se transferă către alt intermediar.",
      "A doua linie: schemele de compensare. În UE, dacă un broker autorizat eșuează și se descoperă că activele clienților lipsesc (fraudă, erori), fondurile de compensare despăgubesc investitorii până la un plafon — 20.000 EUR în schema europeană standard. Atenție la nuanță: compensarea acoperă dispariția activelor, NU pierderile din scăderea pieței — nimeni nu te despăgubește că o acțiune a scăzut.",
      "A treia linie: reglementarea însăși. Un broker autorizat (verificabil în registrele ASF sau ale autorității din țara lui) răspunde unor cerințe de capital, raportare și conduită. Platformele nereglementate care promit „acces exclusiv\" la randamente miraculoase stau exact în afara acestor protecții — combinația de promisiuni mari și reglementare zero e cel mai clar semnal de fugă.",
    ],
  },
  {
    id: "short-selling",
    titlu: "Short selling — cum se „pariază\" pe scădere și de ce e joc asimetric",
    paragrafe: [
      "Vânzarea în lipsă înseamnă să vinzi acțiuni pe care nu le deții: le împrumuți de la broker, le vinzi la prețul curent și speri să le răscumperi mai ieftin înainte să le returnezi. Diferența e profitul tău. E mecanismul prin care piața poate „vota\" și împotriva unei companii, nu doar pentru ea.",
      "Asimetria e ce trebuie înțeles: cumpărând o acțiune, poți pierde maximum ce ai investit; vânzând în lipsă, pierderea e teoretic nelimitată, pentru că un preț poate crește oricât. Episoadele de „short squeeze\" (GameStop 2021 e exemplul clasic) au arătat cum vânzătorii în lipsă forțați să-și închidă pozițiile pot împinge prețul vertical, în spirală.",
      "Pentru investitorul obișnuit, valoarea acestui subiect e informativă, nu practică: datele despre „short interest\" (câte acțiuni sunt vândute în lipsă) apar în știri și pot explica mișcări violente aparent fără sens. Ca activitate, shortingul rămâne teritoriul profesioniștilor cu management strict al riscului.",
    ],
  },
  {
    id: "levier-si-marja",
    titlu: "Efectul de levier și contul în marjă — amplificatorul care taie în ambele sensuri",
    paragrafe: [
      "Tranzacționarea în marjă înseamnă să investești și bani împrumutați de la broker, folosind portofoliul drept garanție. Cu levier 2x, o creștere de 10% a pieței îți aduce 20% — dar o scădere de 10% îți șterge 20%. Levierul nu îmbunătățește deciziile; le amplifică doar consecințele.",
      "Pericolul specific e apelul în marjă (margin call): dacă valoarea garanției scade sub pragul cerut, brokerul îți poate lichida pozițiile automat, la prețurile momentului — adesea cele mai proaste. Astfel, o scădere temporară pe care un investitor fără levier ar fi traversat-o liniștit devine, cu levier, pierdere definitivă și forțată.",
      "Statisticile publicate de reglementatori pentru produsele cu levier de retail (CFD-uri) sunt constant sumbre: în jur de 70-80% dintre conturi pierd bani — cifră pe care platformele sunt obligate legal să o afișeze. Pentru construirea de avere pe termen lung, dobânda compusă fără levier rămâne calea cu istoricul cel mai solid.",
    ],
  },
  {
    id: "derivatele",
    titlu: "Opțiuni și derivate — ce sunt, la ce folosesc, de ce nu sunt pentru început",
    paragrafe: [
      "Un derivat este un contract a cărui valoare derivă din prețul altui activ. Opțiunile — cele mai cunoscute — dau dreptul (nu obligația) de a cumpăra („call\") sau vinde („put\") un activ la un preț fixat, până la o scadență. Pentru acest drept plătești o primă, care e tot ce poți pierde drept cumpărător.",
      "Utilizările legitime sunt două: asigurare (un put pe portofoliu funcționează ca o poliță împotriva scăderilor — plătești prima, dormi liniștit) și venit (vânzarea de opțiuni acoperite de acțiuni deținute). În jurul lor s-a construit însă și un uriaș cazinou de speculație pe termen scurt, unde efectul de levier implicit al opțiunilor face ravagii.",
      "De ce nu pentru începători: prețul unei opțiuni depinde simultan de direcția activului, de timp (valoarea se topește zilnic) și de volatilitate — poți avea dreptate despre direcție și totuși să pierzi tot. Înțelege-le conceptual (apar constant în știri: „volumul de call-uri\", „scadența opțiunilor\"), dar tratează-le ca pe un instrument avansat, nu ca pe o scurtătură.",
    ],
  },
  {
    id: "sezonul-de-earnings",
    titlu: "Sezonul de earnings — cele patru săptămâni care mișcă piețele",
    paragrafe: [
      "De patru ori pe an, la câteva săptămâni după închiderea fiecărui trimestru, companiile listate publică în valuri rezultatele financiare — „sezonul de earnings\". În aceste ferestre de câteva săptămâni se concentrează cele mai multe mișcări mari de preț individuale: o raportare poate muta o acțiune cu 10-20% într-o singură zi.",
      "Mecanica surprizei: piața nu reacționează la cifre în absolut, ci la diferența față de așteptări. Un profit în creștere cu 20% poate fi pedepsit dacă analiștii așteptau 25%; o pierdere poate fi premiată dacă e mai mică decât consensul. La fel de important ca cifrele trecute e „ghidajul\" — ce estimează compania pentru trimestrele următoare.",
      "Practic, în aplicație: calendarul de raportări îți arată când raportează companiile urmărite, iar scorurile se recalculează după publicare. Lecția de disciplină: volatilitatea din ziua raportării e loterie pe termen scurt chiar și pentru profesioniști — investitorul pe termen lung citește raportul pentru sănătatea afacerii, nu pentru fiorul zilei.",
    ],
  },
  {
    id: "politica-monetara",
    titlu: "Băncile centrale și dobânzile — de ce o frază de la Fed mișcă totul",
    paragrafe: [
      "Băncile centrale (Fed în SUA, BCE în zona euro, BNR la noi) stabilesc dobânda de referință — prețul banilor în economie. Când inflația urcă, ele scumpesc creditul ca să răcească cererea; când economia îngheață, îl ieftinesc ca să o stimuleze. Acest ciclu al dobânzilor e metronomul din spatele piețelor.",
      "Legătura cu acțiunile are două fire: unul economic (dobânzi mari = credite scumpe = consum și investiții mai mici = profituri sub presiune) și unul de evaluare (când depozitele și obligațiunile plătesc mult, investitorii pretind prețuri mai mici pentru fluxurile viitoare ale acțiunilor — de aceea companiile de creștere, cu profituri îndepărtate în timp, sufereau cel mai tare la urcările de dobândă).",
      "De aici obsesia piețelor pentru fiecare cuvânt al șefilor de bănci centrale: nu decizia curentă contează cel mai mult, ci indiciile despre traiectoria viitoare. Pentru un începător, e suficient să înțeleagă direcția relației — restul e zgomot de interpretare pe care nici profesioniștii nu-l nimeresc constant.",
    ],
  },
  {
    id: "recesiunile",
    titlu: "Recesiunile și crizele — ce ne învață un secol de căderi de piață",
    paragrafe: [
      "Recesiunea — scăderea susținută a activității economice — vine aproape întotdeauna la pachet cu o piață bear. Istoria modernă e o colecție de episoade dureroase: crahul din 1929, șocurile petroliere din anii '70, bula dot-com (2000-2002, Nasdaq -78%), criza financiară din 2008 (S&P 500 -57%), prăbușirea-fulger din pandemie (-34% într-o lună).",
      "Tiparul care se repetă: fiecare criză a părut, în momentul ei, „diferită\" și fără ieșire — și fiecare a fost urmată, mai devreme sau mai târziu, de reveniri complete și de noi maxime. Recuperările au durat de la câteva luni (2020) la peste un deceniu (1929, dot-com pentru Nasdaq) — de aceea orizontul de timp și diversificarea nu sunt sloganuri, ci echipament de supraviețuire.",
      "Lecția statistică cea mai contraintuitivă: cele mai bune zile ale bursei se îngrămădesc chiar în mijlocul crizelor. Cine a ratat doar cele mai bune 10 zile din ultimele decenii și-a înjumătățit randamentul total — argumentul clasic împotriva vânzării în panică și al încercării de a „ghici\" fundul pieței.",
    ],
  },
  {
    id: "randamente-realiste",
    titlu: "La ce randamente să te aștepți realist — repere istorice, nu promisiuni",
    paragrafe: [
      "Reperul cel mai citat: piața americană de acțiuni (S&P 500) a produs istoric, pe perioade lungi, în jur de 9-10% pe an nominal — aproximativ 6-7% după inflație, cu dividendele reinvestite. Asta include toate crizele: cifra e media unui drum cu gropi de -30% și ani de +30%, nu o linie dreaptă.",
      "Media ascunde dispersie uriașă: în orice an individual, rezultatul e aproape imprevizibil; abia pe ferestre de 15-20 de ani intervalele istorice se strâng spre acea medie. De aceea aceleași procente înseamnă lucruri diferite pentru bani de care ai nevoie în 2 ani versus 20 de ani.",
      "Folosește aceste repere ca test de realism, în ambele direcții: cine îți promite constant 20-30% pe an fie își asumă riscuri enorme, fie te minte (adesea ambele — vezi subiectul despre semnale de alarmă); dar și așteptarea de câștiguri rapide din propriile alegeri „inspirate\" se lovește de aceeași statistică. Randamentele trecute nu garantează viitorul — sunt doar cea mai bună hartă disponibilă.",
    ],
  },
  {
    id: "comisioane-si-costuri",
    titlu: "Comisioanele și costurile — de ce fiecare procent anual contează enorm",
    paragrafe: [
      "Costurile investiției par mărunte — 1% aici, 0,5% acolo — dar se compun exact ca randamentele, doar că împotriva ta. Diferența dintre un cost total de 0,2% și unul de 2% pe an, la aceeași performanță brută, ajunge după 30 de ani la zeci de procente din avuția finală: practic, ani întregi de câștiguri predați intermediarilor.",
      "Inventarul costurilor de căutat: comisioane de tranzacționare, taxe de custodie sau administrare a contului, comisioane de administrare ale fondurilor (TER/expense ratio), costuri de conversie valutară (adesea cele mai bine ascunse), taxe de retragere sau inactivitate — plus spread-ul, costul invizibil discutat separat.",
      "Regulile practice: compară întotdeauna costul TOTAL anual, nu doar comisionul-vedetă din reclamă; la fonduri și ETF-uri, expense ratio-ul e publicat obligatoriu în documentul de informare (KID); și amintește-ți că tranzacționarea frecventă multiplică toate aceste costuri — cel mai ieftin ordin rămâne cel pe care nu-l dai fără motiv.",
    ],
  },
  {
    id: "termen-lung",
    titlu: "Investiția pe termen foarte lung — de ce timpul bate timing-ul",
    paragrafe: [
      "Datele istorice spun o poveste monotonă și puternică: pe orice zi individuală, șansa ca piața americană să crească a fost doar puțin peste 50% — un aproape-banal aruncat de monedă. Pe ferestre de 10 ani, procentul perioadelor pozitive urcă istoric spre 90%; pe 20 de ani, scăderile dispar practic din statistică.",
      "De aici formula-mantră: „time in the market beats timing the market\". Încercarea de a intra și ieși la momentele perfecte cere două decizii corecte la rând (când ieși ȘI când revii), iar ratarea celor câteva zile explozive — concentrate, cum am văzut, chiar în crize — distruge matematic avantajul căutat.",
      "Practic, „termen lung\" nu înseamnă a ignora portofoliul, ci a schimba întrebarea: nu „ce face piața azi?\", ci „mai e teza mea despre aceste afaceri valabilă?\". Exact rolul unui radar cu context — scoruri și explicații care se actualizează — față de un ticker care doar clipește roșu și verde.",
    ],
  },
  {
    id: "primul-watchlist",
    titlu: "Cum îți construiești primul watchlist — metodă, nu vânătoare de ponturi",
    paragrafe: [
      "Un watchlist bun e o listă scurtă de companii pe care le ÎNȚELEGI — nu o colecție de simboluri auzite pe TikTok. Punctul de plecare clasic (popularizat de Peter Lynch): uită-te la produsele și serviciile pe care tu și cei din jur le folosiți și le plătiți constant — apoi cercetează compania din spate.",
      "Pentru fiecare candidat, răspunde în scris la trei întrebări de un rând: Din ce face compania bani? De ce ar cumpăra lumea de la ea și peste 5 ani? Ce ar putea strica povestea? Dacă nu poți răspunde simplu, nu e o companie potrivită pentru lista TA — indiferent cât de promițătoare pare pe grafice.",
      "Apoi lasă instrumentele să lucreze: 5-10 acțiuni în radar, analiza AI pornește automat, digestul zilnic îți aduce doar schimbările importante, iar raportările apar în calendar. Lista se rafinează în timp — scoți ce nu mai înțelegi, adaugi ce ai ajuns să înțelegi. Un watchlist e un caiet de studiu viu, nu un bilet de loterie.",
    ],
  },
  {
    id: "semnale-de-alarma",
    titlu: "Semnale de alarmă — cum recunoști schemele și „guru\" de carton",
    paragrafe: [
      "Regula zero a fraudelor financiare: promisiunea de câștig mare, rapid și „garantat\". Randamentele garantate nu există în piețe reale — cine le promite fie rulează o schemă Ponzi (plătește vechii clienți din banii celor noi, până se prăbușește), fie vinde cursuri și „semnale\" în care singurul câștig sigur e al vânzătorului.",
      "Checklist-ul de recunoaștere: presiune de timp („doar azi\", „ultimele locuri\"), afișare ostentativă de lux drept „dovadă\", cerere de a recruta alți membri, plăți către conturi personale sau cripto, platforme fără autorizație verificabilă (registrul ASF e public), și — clasicul — grupuri de Telegram/WhatsApp unde „mentorul\" tranzacționează în locul tău. Fiecare bifă e un motiv de ieșire; două bife sunt certitudine.",
      "Reflexele sănătoase: verifică autorizarea intermediarului la ASF sau ESMA înainte de orice transfer, nu da nimănui acces la contul tău, tratează orice DM nesolicitat despre investiții ca spam și amintește-ți asimetria: dacă cineva ar avea într-adevăr o metodă de 30% lunar, ar folosi-o în tăcere, nu ți-ar vinde-o pe 500 de lei. Educația — exact ce faci acum — e cel mai bun vaccin.",
    ],
  },
  {
    id: "adr-uri",
    titlu: "ADR-uri și acțiuni internaționale — cum cumperi lumea de pe o singură bursă",
    paragrafe: [
      "Un ADR (American Depositary Receipt) e un certificat listat în SUA care reprezintă acțiuni ale unei companii străine — așa poți cumpăra „Toyota\" sau „Nestlé\" în dolari, pe bursele americane, fără cont în Japonia sau Elveția. O bancă depozitară ține acțiunile originale și emite certificatele corespunzătoare.",
      "Ce trebuie știut: expunerea valutară nu dispare (ADR-ul unei companii japoneze încorporează și evoluția yenului), dividendele pot suferi rețineri fiscale în țara de origine, iar nivelurile de listare diferă — de la ADR-uri „sponsorizate\" cu raportări complete conform standardelor SUA, la cele nesponsorizate, tranzacționate marginal.",
      "Imaginea mare pentru un investitor european: diversificarea geografică reduce dependența de o singură economie, iar accesul tehnic azi e banal — brokerii oferă piețe multiple, ETF-urile globale împachetează mii de companii din zeci de țări într-un singur instrument. Bariera reală nu mai e accesul, ci înțelegerea a ceea ce cumperi — valabilă pe orice meridian.",
    ],
  },
];
