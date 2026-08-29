const BASE_URL = `${import.meta.env.VITE_API_URL || ""}/api`;

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, options = {}) {
  const token = getToken();
  // Limba interfeței — backend-ul livrează conținutul generat (narative
  // radar, știri, motive research) în această limbă. Citită la fiecare
  // cerere, ca poll-urile în curs să prindă imediat o schimbare de limbă.
  const limba = localStorage.getItem("limba") || "ro";
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Limba": limba,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "A apărut o eroare");
  }
  return data;
}

export const api = {
  traduce: (texte) => request("/i18n/translate", { method: "POST", body: JSON.stringify({ texte }) }),
  getToolInsideri: () => request("/tools/insideri"),
  getNarativa: (simbol) => request(`/narative/${encodeURIComponent(simbol)}`),
  saveNarativa: (simbol, teza) =>
    request(`/narative/${encodeURIComponent(simbol)}`, { method: "PUT", body: JSON.stringify({ teza }) }),
  register: (email, password) =>
    request("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) }),
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  getPortfolio: () => request("/portfolio"),
  explainPortfolio: () => request("/portfolio/explain"),
  getStocks: () => request("/stocks"),
  getTicker: () => request("/stocks/ticker"),
  getMarketNews: () => request("/stocks/market-news"),
  getMarketNewsDetail: (id) => request(`/stocks/market-news/${encodeURIComponent(id)}`),
  searchStocks: (query) => request(`/stocks/search?q=${encodeURIComponent(query)}`),
  getStockQuote: (simbol) => request(`/stocks/${encodeURIComponent(simbol)}`),
  buyStock: (simbol, cantitate) =>
    request("/portfolio/buy", { method: "POST", body: JSON.stringify({ simbol, cantitate }) }),
  sellStock: (simbol, cantitate) =>
    request("/portfolio/sell", { method: "POST", body: JSON.stringify({ simbol, cantitate }) }),
  getWatchlist: () => request("/watchlist"),
  addToWatchlist: (simbol) =>
    request("/watchlist", { method: "POST", body: JSON.stringify({ simbol }) }),
  getVix: () => request("/stocks/vix"),
  getThemeData: (tickere) => request(`/stocks/tema?simboluri=${tickere.join(",")}`),
  getStockHistory: (simbol, zile) =>
    request(`/stocks/${encodeURIComponent(simbol)}/history?zile=${zile}`),
  getEarningsCalendar: () => request("/watchlist/earnings"),
  getDailyPicks: () => request("/watchlist/daily-picks"),
  onboardWatchlist: (interese) =>
    request("/watchlist/onboard", { method: "POST", body: JSON.stringify({ interese }) }),
  removeFromWatchlist: (simbol) =>
    request(`/watchlist/${encodeURIComponent(simbol)}`, { method: "DELETE" }),
  getRadar: (simbol) => request(`/stocks/${encodeURIComponent(simbol)}/radar`),
  getCompanyProfile: (simbol) => request(`/stocks/${encodeURIComponent(simbol)}/profile`),
  getStockNews: (simbol) => request(`/stocks/${encodeURIComponent(simbol)}/news`),
  getPortfolioHealth: () => request("/portfolio/health"),
  checkAlerts: () => request("/alerts/check", { method: "POST" }),
  getAlerts: () => request("/alerts"),
  markAlertRead: (id) => request(`/alerts/${id}/read`, { method: "POST" }),
  markAllAlertsRead: () => request("/alerts/read-all", { method: "POST" }),
  getMyInviteCode: () => request("/community/me"),
  getFriends: () => request("/community/friends"),
  addFriend: (cod) => request("/community/friends", { method: "POST", body: JSON.stringify({ cod }) }),
  removeFriend: (friendId) => request(`/community/friends/${friendId}`, { method: "DELETE" }),
  getBrief: () => request("/brief"),
  getToolTop: () => request("/tools/top"),
  getToolScreener: (params) => request(`/tools/screener?${new URLSearchParams(params)}`),
  getToolCompare: (a, b) =>
    request(`/tools/compare?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`),
  forgotPassword: (email) =>
    request("/auth/forgot", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (token, password) =>
    request("/auth/reset", { method: "POST", body: JSON.stringify({ token, password }) }),
  getBillingStatus: () => request("/billing/status"),
  getWaitlist: () => request("/billing/waitlist"),
  joinWaitlist: (email) =>
    request("/billing/waitlist", { method: "POST", body: JSON.stringify({ email }) }),
  createCheckoutSession: () => request("/billing/checkout", { method: "POST" }),
  openBillingPortal: () => request("/billing/portal", { method: "POST" }),
};

export { getToken };
