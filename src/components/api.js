const API_BASE = "http://20.244.56.144/evaluation-service/stocks"; // Replace with your actual API base URL

// Cache structure: { key: { timestamp: number, data: any } }
const cache = {};
const CACHE_DURATION_MS = 60 * 1000; // 1 minute cache duration

// Helper to check if cache is valid
function isCacheValid(key) {
  if (!cache[key]) return false;
  return Date.now() - cache[key].timestamp < CACHE_DURATION_MS;
}


export async function fetchAllStocks() {
  const cacheKey = "allStocks";
  if (isCacheValid(cacheKey)) {
    return cache[cacheKey].data;
  }

  const response = await fetch(`${API_BASE}/stocks`);
  if (!response.ok) {
    throw new Error("Failed to fetch stocks");
  }
  const data = await response.json();

  cache[cacheKey] = { timestamp: Date.now(), data };
  return data;
}

/**
 * Fetch price history for a single stock over last minutes.
 * Example endpoint: GET /stocks/{symbol}/prices?minutes={minutes}
 * @param {string} symbol - Stock symbol, e.g. "AAPL"
 * @param {number} minutes - Last minutes interval
 */
export async function fetchStockPrices(symbol, minutes) {
  const cacheKey = `prices_${symbol}_${minutes}`;
  if (isCacheValid(cacheKey)) {
    return cache[cacheKey].data;
  }

  const response = await fetch(`${API_BASE}/stocks/${symbol}/prices?minutes=${minutes}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch prices for ${symbol}`);
  }
  const data = await response.json();

  cache[cacheKey] = { timestamp: Date.now(), data };
  return data;
}

/**
 * Fetch price history for multiple stocks in parallel.
 * @param {string[]} symbols - Array of stock symbols
 * @param {number} minutes - Last minutes interval
 * @returns {Promise<Object>} - Object mapping symbol -> price data array
 */
export async function fetchMultipleStocksPrices(symbols, minutes) {
  const promises = symbols.map((sym) => fetchStockPrices(sym, minutes));
  const results = await Promise.all(promises);

  return symbols.reduce((acc, sym, idx) => {
    acc[sym] = results[idx];
    return acc;
  }, {});
}