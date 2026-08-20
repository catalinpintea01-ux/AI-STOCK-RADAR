// Date mock — folosite doar ca fallback dacă API-ul de piață (Finnhub) e indisponibil
// sau lipsește cheia. Lista acoperă acțiuni populare de pe NYSE/NASDAQ.
// "sector" e o taxonomie proprie, simplificată (7 categorii) — folosită doar
// pentru gruparea vizuală din watchlist, nu e o clasificare GICS oficială.
const MOCK_STOCKS = [
  { simbol: "AAPL", nume: "Apple Inc.", pret: 227.5, variatieProcent: 1.2, sector: "Tehnologie" },
  { simbol: "MSFT", nume: "Microsoft Corp.", pret: 421.3, variatieProcent: 0.6, sector: "Tehnologie" },
  { simbol: "NVDA", nume: "NVIDIA Corp.", pret: 118.9, variatieProcent: 3.4, sector: "Tehnologie" },
  { simbol: "TSLA", nume: "Tesla Inc.", pret: 248.2, variatieProcent: -2.1, sector: "Consum" },
  { simbol: "AMZN", nume: "Amazon.com Inc.", pret: 186.7, variatieProcent: 0.9, sector: "Consum" },
  { simbol: "GOOGL", nume: "Alphabet Inc.", pret: 176.4, variatieProcent: -0.4, sector: "Tehnologie" },
  { simbol: "META", nume: "Meta Platforms Inc.", pret: 563.1, variatieProcent: 1.8, sector: "Tehnologie" },
  { simbol: "NFLX", nume: "Netflix Inc.", pret: 682.9, variatieProcent: -1.1, sector: "Tehnologie" },
  { simbol: "AMD", nume: "Advanced Micro Devices Inc.", pret: 152.4, variatieProcent: 2.0, sector: "Tehnologie" },
  { simbol: "INTC", nume: "Intel Corp.", pret: 22.8, variatieProcent: -0.8, sector: "Tehnologie" },
  { simbol: "CRM", nume: "Salesforce Inc.", pret: 258.6, variatieProcent: 0.5, sector: "Tehnologie" },
  { simbol: "ORCL", nume: "Oracle Corp.", pret: 168.2, variatieProcent: 1.1, sector: "Tehnologie" },
  { simbol: "ADBE", nume: "Adobe Inc.", pret: 502.3, variatieProcent: -0.3, sector: "Tehnologie" },
  { simbol: "CSCO", nume: "Cisco Systems Inc.", pret: 58.4, variatieProcent: 0.4, sector: "Tehnologie" },
  { simbol: "IBM", nume: "International Business Machines Corp.", pret: 231.6, variatieProcent: 0.2, sector: "Tehnologie" },
  { simbol: "QCOM", nume: "Qualcomm Inc.", pret: 164.9, variatieProcent: -0.6, sector: "Tehnologie" },
  { simbol: "UBER", nume: "Uber Technologies Inc.", pret: 71.2, variatieProcent: 1.4, sector: "Tehnologie" },
  { simbol: "PYPL", nume: "PayPal Holdings Inc.", pret: 82.1, variatieProcent: -1.0, sector: "Financiar" },
  { simbol: "SHOP", nume: "Shopify Inc.", pret: 78.9, variatieProcent: 2.3, sector: "Tehnologie" },
  { simbol: "SQ", nume: "Block Inc.", pret: 68.5, variatieProcent: 0.7, sector: "Financiar" },
  { simbol: "JPM", nume: "JPMorgan Chase & Co.", pret: 218.3, variatieProcent: 0.3, sector: "Financiar" },
  { simbol: "BAC", nume: "Bank of America Corp.", pret: 41.7, variatieProcent: 0.1, sector: "Financiar" },
  { simbol: "WFC", nume: "Wells Fargo & Co.", pret: 68.9, variatieProcent: -0.2, sector: "Financiar" },
  { simbol: "GS", nume: "Goldman Sachs Group Inc.", pret: 542.8, variatieProcent: 0.6, sector: "Financiar" },
  { simbol: "V", nume: "Visa Inc.", pret: 287.4, variatieProcent: 0.4, sector: "Financiar" },
  { simbol: "MA", nume: "Mastercard Inc.", pret: 512.6, variatieProcent: 0.5, sector: "Financiar" },
  { simbol: "AXP", nume: "American Express Co.", pret: 278.9, variatieProcent: -0.1, sector: "Financiar" },
  { simbol: "JNJ", nume: "Johnson & Johnson", pret: 154.2, variatieProcent: 0.2, sector: "Sănătate" },
  { simbol: "PFE", nume: "Pfizer Inc.", pret: 26.8, variatieProcent: -0.5, sector: "Sănătate" },
  { simbol: "UNH", nume: "UnitedHealth Group Inc.", pret: 512.1, variatieProcent: -1.4, sector: "Sănătate" },
  { simbol: "MRK", nume: "Merck & Co. Inc.", pret: 98.6, variatieProcent: 0.3, sector: "Sănătate" },
  { simbol: "ABBV", nume: "AbbVie Inc.", pret: 178.4, variatieProcent: 0.6, sector: "Sănătate" },
  { simbol: "LLY", nume: "Eli Lilly and Co.", pret: 782.5, variatieProcent: 1.0, sector: "Sănătate" },
  { simbol: "KO", nume: "Coca-Cola Co.", pret: 63.2, variatieProcent: 0.1, sector: "Consum" },
  { simbol: "PEP", nume: "PepsiCo Inc.", pret: 168.7, variatieProcent: -0.2, sector: "Consum" },
  { simbol: "PG", nume: "Procter & Gamble Co.", pret: 168.9, variatieProcent: 0.2, sector: "Consum" },
  { simbol: "WMT", nume: "Walmart Inc.", pret: 82.3, variatieProcent: 0.5, sector: "Consum" },
  { simbol: "COST", nume: "Costco Wholesale Corp.", pret: 892.4, variatieProcent: 0.7, sector: "Consum" },
  { simbol: "MCD", nume: "McDonald's Corp.", pret: 292.6, variatieProcent: 0.1, sector: "Consum" },
  { simbol: "NKE", nume: "Nike Inc.", pret: 78.5, variatieProcent: -1.2, sector: "Consum" },
  { simbol: "SBUX", nume: "Starbucks Corp.", pret: 96.3, variatieProcent: 0.4, sector: "Consum" },
  { simbol: "DIS", nume: "Walt Disney Co.", pret: 112.7, variatieProcent: 0.3, sector: "Consum" },
  { simbol: "XOM", nume: "Exxon Mobil Corp.", pret: 118.2, variatieProcent: -0.4, sector: "Energie" },
  { simbol: "CVX", nume: "Chevron Corp.", pret: 158.6, variatieProcent: -0.3, sector: "Energie" },
  { simbol: "BA", nume: "Boeing Co.", pret: 172.4, variatieProcent: 1.6, sector: "Industrial" },
  { simbol: "CAT", nume: "Caterpillar Inc.", pret: 392.8, variatieProcent: 0.5, sector: "Industrial" },
  { simbol: "GE", nume: "General Electric Co.", pret: 182.3, variatieProcent: 0.9, sector: "Industrial" },
  { simbol: "T", nume: "AT&T Inc.", pret: 22.4, variatieProcent: 0.1, sector: "Telecom" },
  { simbol: "VZ", nume: "Verizon Communications Inc.", pret: 42.6, variatieProcent: -0.1, sector: "Telecom" },
  { simbol: "SOFI", nume: "SoFi Technologies Inc.", pret: 14.8, variatieProcent: 2.8, sector: "Financiar" },
];

function getMockStocks() {
  return MOCK_STOCKS;
}

function getMockStock(simbol) {
  return MOCK_STOCKS.find((s) => s.simbol === simbol.toUpperCase());
}

module.exports = { getMockStocks, getMockStock };
