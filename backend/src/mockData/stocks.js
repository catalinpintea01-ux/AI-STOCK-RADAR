// Date mock — folosite doar ca fallback dacă API-ul de piață (Finnhub) e indisponibil
// sau lipsește cheia. Lista acoperă acțiuni populare de pe NYSE/NASDAQ.
const MOCK_STOCKS = [
  { simbol: "AAPL", nume: "Apple Inc.", pret: 227.5, variatieProcent: 1.2 },
  { simbol: "MSFT", nume: "Microsoft Corp.", pret: 421.3, variatieProcent: 0.6 },
  { simbol: "NVDA", nume: "NVIDIA Corp.", pret: 118.9, variatieProcent: 3.4 },
  { simbol: "TSLA", nume: "Tesla Inc.", pret: 248.2, variatieProcent: -2.1 },
  { simbol: "AMZN", nume: "Amazon.com Inc.", pret: 186.7, variatieProcent: 0.9 },
  { simbol: "GOOGL", nume: "Alphabet Inc.", pret: 176.4, variatieProcent: -0.4 },
  { simbol: "META", nume: "Meta Platforms Inc.", pret: 563.1, variatieProcent: 1.8 },
  { simbol: "NFLX", nume: "Netflix Inc.", pret: 682.9, variatieProcent: -1.1 },
  { simbol: "AMD", nume: "Advanced Micro Devices Inc.", pret: 152.4, variatieProcent: 2.0 },
  { simbol: "INTC", nume: "Intel Corp.", pret: 22.8, variatieProcent: -0.8 },
  { simbol: "CRM", nume: "Salesforce Inc.", pret: 258.6, variatieProcent: 0.5 },
  { simbol: "ORCL", nume: "Oracle Corp.", pret: 168.2, variatieProcent: 1.1 },
  { simbol: "ADBE", nume: "Adobe Inc.", pret: 502.3, variatieProcent: -0.3 },
  { simbol: "CSCO", nume: "Cisco Systems Inc.", pret: 58.4, variatieProcent: 0.4 },
  { simbol: "IBM", nume: "International Business Machines Corp.", pret: 231.6, variatieProcent: 0.2 },
  { simbol: "QCOM", nume: "Qualcomm Inc.", pret: 164.9, variatieProcent: -0.6 },
  { simbol: "UBER", nume: "Uber Technologies Inc.", pret: 71.2, variatieProcent: 1.4 },
  { simbol: "PYPL", nume: "PayPal Holdings Inc.", pret: 82.1, variatieProcent: -1.0 },
  { simbol: "SHOP", nume: "Shopify Inc.", pret: 78.9, variatieProcent: 2.3 },
  { simbol: "SQ", nume: "Block Inc.", pret: 68.5, variatieProcent: 0.7 },
  { simbol: "JPM", nume: "JPMorgan Chase & Co.", pret: 218.3, variatieProcent: 0.3 },
  { simbol: "BAC", nume: "Bank of America Corp.", pret: 41.7, variatieProcent: 0.1 },
  { simbol: "WFC", nume: "Wells Fargo & Co.", pret: 68.9, variatieProcent: -0.2 },
  { simbol: "GS", nume: "Goldman Sachs Group Inc.", pret: 542.8, variatieProcent: 0.6 },
  { simbol: "V", nume: "Visa Inc.", pret: 287.4, variatieProcent: 0.4 },
  { simbol: "MA", nume: "Mastercard Inc.", pret: 512.6, variatieProcent: 0.5 },
  { simbol: "AXP", nume: "American Express Co.", pret: 278.9, variatieProcent: -0.1 },
  { simbol: "JNJ", nume: "Johnson & Johnson", pret: 154.2, variatieProcent: 0.2 },
  { simbol: "PFE", nume: "Pfizer Inc.", pret: 26.8, variatieProcent: -0.5 },
  { simbol: "UNH", nume: "UnitedHealth Group Inc.", pret: 512.1, variatieProcent: -1.4 },
  { simbol: "MRK", nume: "Merck & Co. Inc.", pret: 98.6, variatieProcent: 0.3 },
  { simbol: "ABBV", nume: "AbbVie Inc.", pret: 178.4, variatieProcent: 0.6 },
  { simbol: "LLY", nume: "Eli Lilly and Co.", pret: 782.5, variatieProcent: 1.0 },
  { simbol: "KO", nume: "Coca-Cola Co.", pret: 63.2, variatieProcent: 0.1 },
  { simbol: "PEP", nume: "PepsiCo Inc.", pret: 168.7, variatieProcent: -0.2 },
  { simbol: "PG", nume: "Procter & Gamble Co.", pret: 168.9, variatieProcent: 0.2 },
  { simbol: "WMT", nume: "Walmart Inc.", pret: 82.3, variatieProcent: 0.5 },
  { simbol: "COST", nume: "Costco Wholesale Corp.", pret: 892.4, variatieProcent: 0.7 },
  { simbol: "MCD", nume: "McDonald's Corp.", pret: 292.6, variatieProcent: 0.1 },
  { simbol: "NKE", nume: "Nike Inc.", pret: 78.5, variatieProcent: -1.2 },
  { simbol: "SBUX", nume: "Starbucks Corp.", pret: 96.3, variatieProcent: 0.4 },
  { simbol: "DIS", nume: "Walt Disney Co.", pret: 112.7, variatieProcent: 0.3 },
  { simbol: "XOM", nume: "Exxon Mobil Corp.", pret: 118.2, variatieProcent: -0.4 },
  { simbol: "CVX", nume: "Chevron Corp.", pret: 158.6, variatieProcent: -0.3 },
  { simbol: "BA", nume: "Boeing Co.", pret: 172.4, variatieProcent: 1.6 },
  { simbol: "CAT", nume: "Caterpillar Inc.", pret: 392.8, variatieProcent: 0.5 },
  { simbol: "GE", nume: "General Electric Co.", pret: 182.3, variatieProcent: 0.9 },
  { simbol: "T", nume: "AT&T Inc.", pret: 22.4, variatieProcent: 0.1 },
  { simbol: "VZ", nume: "Verizon Communications Inc.", pret: 42.6, variatieProcent: -0.1 },
  { simbol: "SOFI", nume: "SoFi Technologies Inc.", pret: 14.8, variatieProcent: 2.8 },
];

function getMockStocks() {
  return MOCK_STOCKS;
}

function getMockStock(simbol) {
  return MOCK_STOCKS.find((s) => s.simbol === simbol.toUpperCase());
}

module.exports = { getMockStocks, getMockStock };
