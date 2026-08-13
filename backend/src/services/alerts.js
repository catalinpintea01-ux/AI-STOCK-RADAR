const prisma = require("../db");
const { getCompanyNews } = require("./news");

const MAX_ALERTS_PER_CHECK = 5; // evită un puhoi de alerte dacă simbolul are multe știri noi deodată

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

async function getAlerts(userId) {
  return prisma.alert.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

async function getUnreadCount(userId) {
  return prisma.alert.count({ where: { userId, citit: false } });
}

async function markAlertRead(userId, alertId) {
  await prisma.alert.updateMany({ where: { id: alertId, userId }, data: { citit: true } });
}

async function markAllRead(userId) {
  await prisma.alert.updateMany({ where: { userId, citit: false }, data: { citit: true } });
}

module.exports = { checkForNewAlerts, getAlerts, getUnreadCount, markAlertRead, markAllRead };
