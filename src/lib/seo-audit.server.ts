// Server-only fetching for the SEO Audit tools (website-seo-audit,
// broken-link-checker, robots-txt-checker, sitemap-checker,
// open-graph-checker, meta-tag-analyzer).
//
// These tools fetch user-supplied URLs from the server, so the fetch is
// hardened against SSRF: only http/https, private/loopback/link-local
// targets are rejected (both IP literals and DNS-resolved addresses,
// re-checked on every redirect hop), 10 s total timeout, 2 MB size cap,
// at most 5 redirects, no credentials or cookies, CalcHub bot
// user-agent. A per-IP rate limit (20 fetches / 5 minutes) sits in
// front of the server functions.

import { lookup } from "node:dns/promises";
import { checkAuditUrl, extractPageInfo, isPrivateIp } from "./seo-audit";
import { parseRdap, type RdapInfo } from "./rdap";
import { parseDohResponse, type DnsResult } from "./dns";

export const AUDIT_FETCH_TIMEOUT_MS = 10_000;
export const AUDIT_MAX_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const BOT_UA = "CalcHubBot/1.0 (SEO audit tool)";

export type FetchAuditResult =
  | { ok: true; status: number; finalUrl: string; contentType: string; body: string }
  | { ok: false; error: string };

/** Resolve a hostname and reject it if ANY address is private. */
export async function assertResolvable(hostname: string): Promise<{ ok: true } | { ok: false; error: string }> {
  let addresses: { address: string }[];
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    return { ok: false, error: `Could not resolve ${hostname} — check the address and try again.` };
  }
  if (addresses.length === 0) return { ok: false, error: `Could not resolve ${hostname}.` };
  for (const { address } of addresses) {
    if (isPrivateIp(address)) {
      return { ok: false, error: "That address resolves to a private or loopback network and cannot be fetched." };
    }
  }
  return { ok: true };
}

function isTextContentType(contentType: string): boolean {
  const ct = contentType.toLowerCase();
  return (
    ct === "" ||
    ct.includes("text/") ||
    ct.includes("json") ||
    ct.includes("xml") ||
    ct.includes("html") ||
    ct.includes("javascript")
  );
}

/**
 * Fetch a URL with the SSRF guards applied. Follows at most 5 redirects,
 * re-validating and re-resolving every hop. Returns the body as text, or
 * a clear error — never an invented result.
 */
export async function fetchAuditPage(rawUrl: string): Promise<FetchAuditResult> {
  const checked = checkAuditUrl(rawUrl);
  if (!checked.ok) return { ok: false, error: checked.error };
  let current = checked.url;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AUDIT_FETCH_TIMEOUT_MS);
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const resolved = await assertResolvable(current.hostname);
      if (!resolved.ok) return resolved;
      let res: Response;
      try {
        res = await fetch(current.toString(), {
          signal: controller.signal,
          redirect: "manual",
          credentials: "omit",
          headers: { "user-agent": BOT_UA, accept: "text/html,application/xhtml+xml,text/plain,application/xml;q=0.9,*/*;q=0.8" },
        });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return { ok: false, error: "The request timed out after 10 seconds." };
        }
        return { ok: false, error: `Could not fetch this URL (${error instanceof Error ? error.message : "network error"}). Check the address and try again.` };
      }
      if ([301, 302, 303, 307, 308].includes(res.status)) {
        if (hop === MAX_REDIRECTS) return { ok: false, error: "Too many redirects (more than 5)." };
        const location = res.headers.get("location");
        if (!location) return { ok: false, error: "The server redirected without a destination." };
        let next: URL;
        try {
          next = new URL(location, current);
        } catch {
          return { ok: false, error: "The server redirected to an invalid URL." };
        }
        const nextChecked = checkAuditUrl(next.toString());
        if (!nextChecked.ok) return { ok: false, error: "The redirect target is not a fetchable public URL." };
        current = nextChecked.url;
        continue;
      }
      if (res.status < 200 || res.status >= 400) {
        return { ok: false, error: `The server answered with HTTP ${res.status}.` };
      }
      const contentType = res.headers.get("content-type") ?? "";
      if (!isTextContentType(contentType)) {
        return { ok: false, error: `The URL returned ${contentType || "a non-text file"} — an audit needs a web page or text file.` };
      }
      if (!res.body) return { ok: false, error: "The server returned an empty response." };
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let total = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > AUDIT_MAX_BYTES) {
          await reader.cancel();
          return { ok: false, error: "The page is larger than 2 MB — too big to audit." };
        }
        chunks.push(value);
      }
      const body = new TextDecoder("utf-8", { fatal: false }).decode(
        chunks.reduce((acc, c) => {
          const merged = new Uint8Array(acc.length + c.length);
          merged.set(acc);
          merged.set(c, acc.length);
          return merged;
        }, new Uint8Array(0)),
      );
      return { ok: true, status: res.status, finalUrl: current.toString(), contentType, body };
    }
    return { ok: false, error: "Too many redirects (more than 5)." };
  } finally {
    clearTimeout(timer);
  }
}

// ------------------------------------------------------------------ //
// Broken-link checking
// ------------------------------------------------------------------ //

export type LinkCheck = { url: string; status: number | null; error?: string };

async function checkOneLink(url: string): Promise<LinkCheck> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    let res: Response;
    try {
      res = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
        credentials: "omit",
        headers: { "user-agent": BOT_UA },
      });
    } catch {
      return { url, status: null, error: "Could not connect" };
    }
    if (res.status === 405 || res.status === 501) {
      try {
        res = await fetch(url, {
          method: "GET",
          signal: controller.signal,
          redirect: "follow",
          credentials: "omit",
          headers: { "user-agent": BOT_UA, range: "bytes=0-0" },
        });
      } catch {
        return { url, status: null, error: "Could not connect" };
      }
    }
    return { url, status: res.status };
  } catch {
    return { url, status: null, error: "Timed out" };
  } finally {
    clearTimeout(timer);
  }
}

export type CheckLinksResult =
  | {
      ok: true;
      pageUrl: string;
      totalFound: number;
      checked: LinkCheck[];
      capped: boolean;
    }
  | { ok: false; error: string };

const MAX_LINKS_PER_RUN = 50;

/** Fetch a page and check each link on it (up to 50), reporting the status. */
export async function checkLinksOnPage(rawUrl: string): Promise<CheckLinksResult> {
  const fetched = await fetchAuditPage(rawUrl);
  if (!fetched.ok) return fetched;
  const info = extractPageInfo(fetched.body);
  const seen = new Set<string>();
  const targets: string[] = [];
  for (const href of info.links) {
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:"))
      continue;
    let absolute: URL;
    try {
      absolute = new URL(href, fetched.finalUrl);
    } catch {
      continue;
    }
    if (absolute.protocol !== "http:" && absolute.protocol !== "https:") continue;
    absolute.hash = "";
    const key = absolute.toString();
    if (seen.has(key)) continue;
    seen.add(key);
    targets.push(key);
  }
  const capped = targets.length > MAX_LINKS_PER_RUN;
  const batch = targets.slice(0, MAX_LINKS_PER_RUN);
  const checked: LinkCheck[] = [];
  const CONCURRENCY = 5;
  for (let i = 0; i < batch.length; i += CONCURRENCY) {
    const slice = batch.slice(i, i + CONCURRENCY);
    const results = await Promise.all(slice.map((url) => checkOneLink(url)));
    checked.push(...results);
  }
  return { ok: true, pageUrl: fetched.finalUrl, totalFound: targets.length, checked, capped };
}

// ------------------------------------------------------------------ //
// Rate limit: 20 audit fetches per client per 5 minutes (in-memory).
// ------------------------------------------------------------------ //

const AUDIT_LIMIT = 20;
const AUDIT_WINDOW_MS = 5 * 60 * 1000;
const hits = new Map<string, number[]>();

export function checkAuditRateLimit(key: string): boolean {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < AUDIT_WINDOW_MS);
  if (list.length >= AUDIT_LIMIT) {
    hits.set(key, list);
    return false;
  }
  list.push(now);
  hits.set(key, list);
  return true;
}

export function resetAuditRateLimitsForTests(): void {
  hits.clear();
}

// ------------------------------------------------------------------ //
// Batch 29 — guarded fetch for the new fetch tools: Redirect Checker,
// WHOIS Lookup / Domain Age Checker (RDAP), DNS Lookup (DNS-over-HTTPS)
// and API Tester. Same SSRF guards as fetchAuditPage (only http/https,
// DNS-resolved private addresses rejected on every hop, 10 s timeout,
// 2 MB cap, max 5 redirects, no credentials), but the raw HTTP status
// is returned instead of treating 4xx as an error — a 404 is a real
// answer for a redirect chain, an RDAP lookup and an API test.
// ------------------------------------------------------------------ //

export type GuardedFetchResult =
  | {
      ok: true;
      status: number;
      finalUrl: string;
      contentType: string;
      body: string;
      binary: boolean;
      headers: Record<string, string>;
    }
  | { ok: false; error: string };

async function readCappedBody(res: Response): Promise<{ ok: true; body: string } | { ok: false; error: string }> {
  if (!res.body) return { ok: true, body: "" };
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > AUDIT_MAX_BYTES) {
      await reader.cancel();
      return { ok: false, error: "The response is larger than 2 MB — too big to show." };
    }
    chunks.push(value);
  }
  const body = new TextDecoder("utf-8", { fatal: false }).decode(
    chunks.reduce((acc, c) => {
      const merged = new Uint8Array(acc.length + c.length);
      merged.set(acc);
      merged.set(c, acc.length);
      return merged;
    }, new Uint8Array(0)),
  );
  return { ok: true, body };
}

/**
 * Guarded fetch that returns the raw status and body. `init` lets the API
 * Tester send other methods and a body; everything else is GET.
 */
export async function fetchGuardedText(
  rawUrl: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
): Promise<GuardedFetchResult> {
  const checked = checkAuditUrl(rawUrl);
  if (!checked.ok) return { ok: false, error: checked.error };
  if (init?.body && init.body.length > 100_000) {
    return { ok: false, error: "The request body is too large (over 100 KB)." };
  }
  const method = (init?.method ?? "GET").toUpperCase();
  if (!["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].includes(method)) {
    return { ok: false, error: `HTTP method ${method} is not supported here.` };
  }
  let current = checked.url;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AUDIT_FETCH_TIMEOUT_MS);
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const resolved = await assertResolvable(current.hostname);
      if (!resolved.ok) return resolved;
      let res: Response;
      try {
        res = await fetch(current.toString(), {
          method,
          signal: controller.signal,
          redirect: "manual",
          credentials: "omit",
          headers: {
            "user-agent": BOT_UA,
            accept: "text/html,application/xhtml+xml,application/json,text/plain,application/xml;q=0.9,*/*;q=0.8",
            ...(init?.headers ?? {}),
          },
          body: method === "GET" || method === "HEAD" ? undefined : init?.body,
        });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return { ok: false, error: "The request timed out after 10 seconds." };
        }
        return { ok: false, error: `Could not fetch this URL (${error instanceof Error ? error.message : "network error"}). Check the address and try again.` };
      }
      if ([301, 302, 303, 307, 308].includes(res.status)) {
        if (hop === MAX_REDIRECTS) return { ok: false, error: "Too many redirects (more than 5)." };
        const location = res.headers.get("location");
        if (!location) return { ok: false, error: "The server redirected without a destination." };
        let next: URL;
        try {
          next = new URL(location, current);
        } catch {
          return { ok: false, error: "The server redirected to an invalid URL." };
        }
        const nextChecked = checkAuditUrl(next.toString());
        if (!nextChecked.ok) return { ok: false, error: "The redirect target is not a fetchable public URL." };
        current = nextChecked.url;
        // A redirect after POST usually becomes a GET; keep it simple and safe.
        if (method === "POST" && (res.status === 301 || res.status === 302 || res.status === 303)) {
          return { ok: false, error: "The server redirected the request — re-send it to the final URL directly." };
        }
        continue;
      }
      const contentType = res.headers.get("content-type") ?? "";
      const binary = !isTextContentType(contentType);
      const headers: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        headers[key] = value;
      });
      if (method === "HEAD") {
        return { ok: true, status: res.status, finalUrl: current.toString(), contentType, body: "", binary, headers };
      }
      const read = await readCappedBody(res);
      if (!read.ok) return read;
      return {
        ok: true,
        status: res.status,
        finalUrl: current.toString(),
        contentType,
        body: binary ? "" : read.body,
        binary,
        headers,
      };
    }
    return { ok: false, error: "Too many redirects (more than 5)." };
  } finally {
    clearTimeout(timer);
  }
}

// ------------------------------------------------------------------ //
// Redirect chain
// ------------------------------------------------------------------ //

export type RedirectHop = { url: string; status: number };

export type RedirectChainResult =
  | { ok: true; hops: RedirectHop[]; finalUrl: string; finalStatus: number; redirected: boolean }
  | { ok: false; error: string };

/** Follow a URL's redirect chain (GET, headers only) and report every hop. */
export async function checkRedirectChain(rawUrl: string): Promise<RedirectChainResult> {
  const checked = checkAuditUrl(rawUrl);
  if (!checked.ok) return { ok: false, error: checked.error };
  let current = checked.url;
  const hops: RedirectHop[] = [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AUDIT_FETCH_TIMEOUT_MS);
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const resolved = await assertResolvable(current.hostname);
      if (!resolved.ok) return resolved;
      let res: Response;
      try {
        res = await fetch(current.toString(), {
          method: "GET",
          signal: controller.signal,
          redirect: "manual",
          credentials: "omit",
          headers: { "user-agent": BOT_UA, accept: "*/*" },
        });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return { ok: false, error: "The request timed out after 10 seconds." };
        }
        return { ok: false, error: `Could not fetch this URL (${error instanceof Error ? error.message : "network error"}).` };
      }
      hops.push({ url: current.toString(), status: res.status });
      if ([301, 302, 303, 307, 308].includes(res.status)) {
        if (hop === MAX_REDIRECTS) return { ok: false, error: "Too many redirects (more than 5)." };
        const location = res.headers.get("location");
        if (!location) return { ok: false, error: "The server redirected without a destination." };
        let next: URL;
        try {
          next = new URL(location, current);
        } catch {
          return { ok: false, error: "The server redirected to an invalid URL." };
        }
        const nextChecked = checkAuditUrl(next.toString());
        if (!nextChecked.ok) return { ok: false, error: "The redirect target is not a fetchable public URL." };
        current = nextChecked.url;
        await res.body?.cancel().catch(() => undefined);
        continue;
      }
      await res.body?.cancel().catch(() => undefined);
      return { ok: true, hops, finalUrl: current.toString(), finalStatus: res.status, redirected: hops.length > 1 };
    }
    return { ok: false, error: "Too many redirects (more than 5)." };
  } finally {
    clearTimeout(timer);
  }
}

// ------------------------------------------------------------------ //
// RDAP (WHOIS over HTTPS) — one lookup serves both WHOIS Lookup and
// Domain Age Checker. rdap.org redirects to the authoritative RDAP
// server for the TLD; fetchGuardedText follows and re-checks hops.
// A 404 means the domain is not registered or the TLD has no RDAP
// service — that is reported, never faked.
// ------------------------------------------------------------------ //

export type RdapLookupResult =
  | { ok: true; info: RdapInfo }
  | { ok: false; error: string; notRegistered?: boolean };

export async function lookupRdap(domain: string): Promise<RdapLookupResult> {
  const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!/^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))*$/.test(clean) || !clean.includes(".")) {
    return { ok: false, error: "Enter a domain like example.com — no http://, no path." };
  }
  const res = await fetchGuardedText(`https://rdap.org/domain/${clean}`);
  if (!res.ok) return res;
  if (res.status === 404) {
    return {
      ok: false,
      error: "No RDAP record found — the domain may not be registered, or this TLD has no RDAP service.",
      notRegistered: true,
    };
  }
  if (res.status !== 200) {
    return { ok: false, error: `The RDAP service answered with HTTP ${res.status}.` };
  }
  const info = parseRdap(res.body);
  if (!info) return { ok: false, error: "The RDAP service returned a response this tool could not read." };
  return { ok: true, info };
}

// ------------------------------------------------------------------ //
// DNS Lookup (DNS-over-HTTPS, dns.google — no key needed)
// ------------------------------------------------------------------ //

export type DnsLookupResult = DnsResult | { ok: false; error: string };

export async function lookupDns(domain: string, type: string): Promise<DnsLookupResult> {
  const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!/^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))*$/.test(clean) || !clean.includes(".")) {
    return { ok: false, error: "Enter a domain like example.com — no http://, no path." };
  }
  const typeCode = { A: 1, AAAA: 28, CNAME: 5, MX: 15, NS: 2, SOA: 6, TXT: 16 }[type] ?? 1;
  const res = await fetchGuardedText(
    `https://dns.google/resolve?name=${encodeURIComponent(clean)}&type=${typeCode}`,
  );
  if (!res.ok) return res;
  if (res.status !== 200) {
    return { ok: false, error: `The DNS service answered with HTTP ${res.status}.` };
  }
  return parseDohResponse(res.body);
}

// ------------------------------------------------------------------ //
// API Tester — a guarded request to a public URL. Any HTTP status is
// a result (404 is an answer, not a failure). Private targets are
// blocked by the same guards; the request body is capped at 100 KB.
// ------------------------------------------------------------------ //

export type ApiTestResult =
  | {
      ok: true;
      status: number;
      statusText: string;
      finalUrl: string;
      timeMs: number;
      contentType: string;
      body: string;
      binary: boolean;
      headers: Record<string, string>;
    }
  | { ok: false; error: string };

export async function testApiRequest(input: {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
}): Promise<ApiTestResult> {
  const started = Date.now();
  const res = await fetchGuardedText(input.url, {
    method: input.method,
    headers: input.headers,
    body: input.body,
  });
  if (!res.ok) return res;
  return {
    ok: true,
    status: res.status,
    statusText: res.status >= 200 && res.status < 300 ? "OK" : res.status >= 400 ? "Error" : "Redirect",
    finalUrl: res.finalUrl,
    timeMs: Date.now() - started,
    contentType: res.contentType,
    body: res.body.slice(0, 100_000),
    binary: res.binary,
    headers: res.headers,
  };
}
