const BASE_URL = `${import.meta.env.VITE_API_URL || ""}/api`;

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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
  bulkAddTop50: () => request("/watchlist/bulk-top50", { method: "POST" }),
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
  getBillingStatus: () => request("/billing/status"),
  createCheckoutSession: () => request("/billing/checkout", { method: "POST" }),
  openBillingPortal: () => request("/billing/portal", { method: "POST" }),
};

export { getToken };
