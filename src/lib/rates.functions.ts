// Live exchange rates for the Currency Converter, fetched server-side from
// the free no-key ExchangeRate-API endpoint (open.er-api.com). The browser
// only ever talks to this app's own server-function endpoint (same origin),
// so no CSP change is needed, and no user data is sent anywhere — the
// request carries no user input at all, just the base currency.
import { createServerFn } from "@tanstack/react-start";

const RATES_URL = "https://open.er-api.com/v6/latest/USD";
const CACHE_TTL_MS = 60 * 60 * 1000; // ~1 hour

type RatesCache = {
  at: number;
  rates: Record<string, number>;
  date: string;
};

let cache: RatesCache | null = null;

export type ExchangeRatesResponse =
  | { ok: true; base: "USD"; rates: Record<string, number>; date: string; stale?: boolean }
  | { ok: false; error: string };

export const getExchangeRates = createServerFn({ method: "GET" }).handler(
  async (): Promise<ExchangeRatesResponse> => {
    if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
      return { ok: true, base: "USD", rates: cache.rates, date: cache.date };
    }
    try {
      const res = await fetch(RATES_URL, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`rates service returned ${res.status}`);
      const json = (await res.json()) as {
        result?: string;
        rates?: Record<string, number>;
        time_last_update_utc?: string;
      };
      if (json.result !== "success" || !json.rates || typeof json.rates !== "object") {
        throw new Error("rates service returned an unexpected response");
      }
      cache = {
        at: Date.now(),
        rates: json.rates,
        date: json.time_last_update_utc ?? new Date().toISOString(),
      };
      return { ok: true, base: "USD", rates: cache.rates, date: cache.date };
    } catch {
      // A stale cache is better than nothing — but say so. With no cache
      // at all, fail openly so the converter shows a message, never a
      // stale or invented figure presented as live.
      if (cache) {
        return { ok: true, base: "USD", rates: cache.rates, date: cache.date, stale: true };
      }
      return {
        ok: false,
        error: "Live exchange rates are unavailable right now. Check your connection and try again.",
      };
    }
  },
);
