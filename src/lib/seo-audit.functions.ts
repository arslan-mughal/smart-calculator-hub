// Server functions for the SEO Audit tools. The browser only ever talks
// to this app's own server-function endpoint (same origin), so no CSP
// change is needed. The URL a visitor types is sent to the server —
// that is the point of these tools — but it is validated and fetched
// with the SSRF guards in seo-audit.server.ts. Pasted text and HTML
// never leave the browser: those modes run entirely client-side.
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { clientKey } from "./admin-auth.server";
import {
  checkAuditRateLimit,
  checkLinksOnPage,
  checkRedirectChain,
  fetchAuditPage,
  lookupDns,
  lookupRdap,
  testApiRequest,
  type ApiTestResult,
  type CheckLinksResult,
  type DnsLookupResult,
  type FetchAuditResult,
  type RdapLookupResult,
  type RedirectChainResult,
} from "./seo-audit.server";

const RATE_LIMIT_MESSAGE =
  "Too many audits from your connection right now — wait a few minutes and try again.";

function rateLimited(): boolean {
  let key = "local";
  try {
    key = clientKey(getRequest());
  } catch {
    key = "local";
  }
  return !checkAuditRateLimit(key);
}

export const fetchPageForAudit = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ({
    url: typeof input === "object" && input !== null ? String((input as { url?: unknown }).url ?? "") : "",
  }))
  .handler(async ({ data }): Promise<FetchAuditResult> => {
    if (rateLimited()) return { ok: false, error: RATE_LIMIT_MESSAGE };
    return fetchAuditPage(data.url);
  });

export const checkPageLinks = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ({
    url: typeof input === "object" && input !== null ? String((input as { url?: unknown }).url ?? "") : "",
  }))
  .handler(async ({ data }): Promise<CheckLinksResult> => {
    if (rateLimited()) return { ok: false, error: RATE_LIMIT_MESSAGE };
    return checkLinksOnPage(data.url);
  });

// ------------------------------------------------------------------ //
// Batch 29 — Redirect Checker, WHOIS Lookup / Domain Age Checker
// (RDAP), DNS Lookup (DoH) and API Tester. All go through the same
// SSRF guards and the same 20 fetches / 5 min rate limit as the audit
// tools. The URL/domain a visitor types is sent to the server — that
// is the point of these tools — but it is validated first.
// ------------------------------------------------------------------ //

export const checkRedirects = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ({
    url: typeof input === "object" && input !== null ? String((input as { url?: unknown }).url ?? "") : "",
  }))
  .handler(async ({ data }): Promise<RedirectChainResult> => {
    if (rateLimited()) return { ok: false, error: RATE_LIMIT_MESSAGE };
    return checkRedirectChain(data.url);
  });

export const lookupDomainRdap = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ({
    domain: typeof input === "object" && input !== null ? String((input as { domain?: unknown }).domain ?? "") : "",
  }))
  .handler(async ({ data }): Promise<RdapLookupResult> => {
    if (rateLimited()) return { ok: false, error: RATE_LIMIT_MESSAGE };
    return lookupRdap(data.domain);
  });

export const lookupDnsRecords = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ({
    domain: typeof input === "object" && input !== null ? String((input as { domain?: unknown }).domain ?? "") : "",
    type: typeof input === "object" && input !== null ? String((input as { type?: unknown }).type ?? "A") : "A",
  }))
  .handler(async ({ data }): Promise<DnsLookupResult> => {
    if (rateLimited()) return { ok: false, error: RATE_LIMIT_MESSAGE };
    return lookupDns(data.domain, data.type);
  });

export const testApiEndpoint = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const obj = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
    const headers: Record<string, string> = {};
    if (typeof obj.headers === "object" && obj.headers !== null) {
      for (const [key, value] of Object.entries(obj.headers as Record<string, unknown>)) {
        if (typeof value === "string" && key.trim()) headers[key.trim()] = value;
      }
    }
    return {
      url: String(obj.url ?? ""),
      method: String(obj.method ?? "GET"),
      headers,
      body: typeof obj.body === "string" ? obj.body : "",
    };
  })
  .handler(async ({ data }): Promise<ApiTestResult> => {
    if (rateLimited()) return { ok: false, error: RATE_LIMIT_MESSAGE };
    return testApiRequest(data);
  });
