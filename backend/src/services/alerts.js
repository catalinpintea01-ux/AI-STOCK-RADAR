const prisma = require("../db");
const { getCompanyNews } = require("./news");

const MAX_ALERTS_PER_CHECK = 2; // evită un puhoi de alerte dacă simbolul are multe știri noi deodată
const DIGEST_SIZE = 3; // clopoțelul promite puțin și valoros, nu sute de notificări

// Verifică fiecare acțiune urmărită de utilizator pentru știri apărute după
// ultima verificare și creează alerte noi. Rulează la cerere (când utilizatorul
// deschide aplicația), nu pe un scheduler — nu există infrastructură de tip
// cron/push în acest MVP.
async function checkForNewAlerts(userId) {
  const watchlist = await prisma.watchlist.findMany({ where: { userId } });
  let createdCount = 0;

  for (const entry of watchlist) {
    const news = await getCompanyNews(entry.simbol);
    const stiriNoi = news
      .filter((n) => new Date(n.data) > entry.lastAlertCheck)
      .slice(0, MAX_ALERTS_PER_CHECK);

    for (const n of stiriNoi) {
      try {
        await prisma.alert.create({
          data: { userId, simbol: entry.simbol, headline: n.headline, url: n.url, sursa: n.sursa },
        });
        createdCount += 1;
      } catch (err) {
        // P2002 = constrângere unică încălcată (alertă deja creată la o verificare anterioară,
        // posibil concurentă) — ignorăm duplicatul, orice altă eroare se propagă mai departe.
        if (err.code !== "P2002") throw err;
      }
    }

    await prisma.watchlist.update({
      where: { id: entry.id },
      data: { lastAlertCheck: new Date() },
    });
  }

  return createdCount;
}

// Praguri pentru alertele de scor: verdictul schimbat e mereu relevant; o
// mișcare de compozit sub 10 puncte e zgomot statistic, nu semnal.
const SCOR_DELTA_MIN = 10;

// Creează alerte "scor" pentru toți utilizatorii care urmăresc simbolul, când
// recalculul radarului aduce o schimbare notabilă. Chemată din radar.js după
// upsert — url-ul poartă ziua, deci constrângerea unică [userId, simbol, url]
// limitează natural la o singură alertă de scor pe simbol pe zi per user.
async function creeazaAlerteScor(simbol, vechi, nou) {
  const verdictSchimbat = vechi.verdict !== nou.verdict;
  const delta = nou.scorCompozit - vechi.scorCompozit;
  if (!verdictSchimbat && Math.abs(delta) < SCOR_DELTA_MIN) return 0;

  const watchers = await prisma.watchlist.findMany({ where: { simbol }, select: { userId: true } });
  if (watchers.length === 0) return 0;

  // Headline structurat (JSON) — frontend-ul compune propoziția în limba
  // utilizatorului; un text fix în română nu s-ar putea traduce fiabil.
  const headline = JSON.stringify({
    vechi: vechi.scorCompozit,
    nou: nou.scorCompozit,
    verdictVechi: vechi.verdict,
    verdictNou: nou.verdict,
  });
  const url = `scor:${new Date().toISOString().slice(0, 10)}`;

  let create = 0;
  for (const w of watchers) {
    try {
      await prisma.alert.create({
        data: { userId: w.userId, simbol, headline, url, sursa: "AI Radar", tip: "scor" },
      });
      create += 1;
    } catch (err) {
      if (err.code !== "P2002") throw err; // duplicat pe ziua curentă — deja alertat
    }
  }
  if (create > 0) {
    console.log(`[alerts] ${simbol}: scor ${vechi.scorCompozit}→${nou.scorCompozit} — ${create} alerte de scor create`);
  }
  return create;
}

async function getAlerts(userId) {
  return prisma.alert.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

// Digest zilnic anti-oboseală: alertele din ultimele 24h, grupate pe simbol,
// maximum DIGEST_SIZE simboluri (cele mai recente). Clopoțelul numără aceste
// grupuri, nu alertele individuale — "3 schimbări azi", nu "513 notificări".
async function getDigest(userId) {
  const deLa = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recente = await prisma.alert.findMany({
    where: { userId, createdAt: { gte: deLa } },
    orderBy: { createdAt: "desc" },
  });

  const grupuri = new Map();
  for (const a of recente) {
    if (!grupuri.has(a.simbol)) {
      grupuri.set(a.simbol, { simbol: a.simbol, stiri: 0, necitite: 0, ultima: a });
    }
    const g = grupuri.get(a.simbol);
    g.stiri += 1;
    if (!a.citit) g.necitite += 1;
  }

  const digest = [...grupuri.values()].slice(0, DIGEST_SIZE).map((g) => ({
    simbol: g.simbol,
    stiri: g.stiri,
    headline: g.ultima.headline,
    url: g.ultima.url,
    sursa: g.ultima.sursa,
    tip: g.ultima.tip,
    createdAt: g.ultima.createdAt,
  }));

  // Badge-ul = câte grupuri din digest mai au ceva necitit (0-3).
  const unreadCount = [...grupuri.values()].slice(0, DIGEST_SIZE).filter((g) => g.necitite > 0).length;

  return { digest, unreadCount };
}

async function markAlertRead(userId, alertId) {
  await prisma.alert.updateMany({ where: { id: alertId, userId }, data: { citit: true } });
}

async function markAllRead(userId) {
  await prisma.alert.updateMany({ where: { userId, citit: false }, data: { citit: true } });
}

module.exports = { checkForNewAlerts, creeazaAlerteScor, getAlerts, getDigest, markAlertRead, markAllRead };
