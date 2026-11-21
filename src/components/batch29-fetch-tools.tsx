// Custom components for the batch 29 server-fetch tools: Redirect
// Checker, Domain Age Checker, WHOIS Lookup, API Tester, DNS Lookup.
// Each calls a server function (seo-audit.functions.ts) behind the v2.6
// SSRF guards — the browser cannot fetch arbitrary URLs itself (CORS),
// and the server fetch is hardened (public addresses only, 10 s
// timeout, 2 MB cap, 20 fetches per client per 5 min). Failures are
// shown as messages, never as invented data.
import { useState } from "react";
import { checkAuditUrl } from "@/lib/seo-audit";
import { domainAge, formatAge } from "@/lib/rdap";
import { isValidDomain } from "@/lib/dns";
import {
  checkRedirects,
  lookupDnsRecords,
  lookupDomainRdap,
  testApiEndpoint,
} from "@/lib/seo-audit.functions";

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";
const btnPrimary =
  "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50";
const btnOutline =
  "inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary";

function ErrorBox({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{message}</p>
  );
}

function UrlField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input
        className={`${inputCls} mt-1.5`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode="url"
        autoComplete="off"
      />
    </label>
  );
}

function DomainField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input
        className={`${inputCls} mt-1.5`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="example.com"
        autoComplete="off"
      />
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-border py-2 last:border-0">
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Redirect Checker                                                    */
/* ------------------------------------------------------------------ */

export function RedirectChecker() {
  const [url, setUrl] = useState("https://example.com");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Awaited<ReturnType<typeof checkRedirectChain>> | null>(null);

  async function run() {
    setError("");
    setResult(null);
    const checked = checkAuditUrl(url);
    if (!checked.ok) {
      setError(checked.error);
      return;
    }
    setRunning(true);
    try {
      const res = await checkRedirects({ data: { url } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult(res);
    } catch {
      setError("Could not reach the check service — check your connection and try again.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <UrlField label="URL to check" value={url} onChange={setUrl} placeholder="https://example.com" />
      <div>
        <button type="button" onClick={run} disabled={running} className={btnPrimary}>
          {running ? "Checking…" : "Check redirects"}
        </button>
      </div>
      {error && <ErrorBox message={error} />}
      {result && (
        <div className="space-y-3" aria-live="polite">
          <div className="rounded-xl bg-primary p-5 text-primary-foreground">
            <p className="text-xs font-medium text-primary-foreground/70">Redirect chain</p>
            <p className="mt-1 font-display text-2xl font-extrabold">
              {result.redirected ? `${result.hops.length - 1} redirect${result.hops.length > 2 ? "s" : ""}` : "No redirects"}
            </p>
            <p className="mt-1 text-sm text-primary-foreground/80">Final status: HTTP {result.finalStatus}</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            {result.hops.map((hop, i) => (
              <div key={i} className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 last:border-0">
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                  {i + 1}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    hop.status >= 200 && hop.status < 300
                      ? "bg-green-500/15 text-green-800 dark:text-green-300"
                      : hop.status >= 300 && hop.status < 400
                        ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                        : "bg-red-500/15 text-red-800 dark:text-red-300"
                  }`}
                >
                  {hop.status}
                </span>
                <span className="min-w-0 flex-1 break-all font-mono text-sm">{hop.url}</span>
              </div>
            ))}
          </div>
          {result.redirected && (
            <p className="text-sm text-muted-foreground">
              This URL redirects — link directly to the final address to save a round trip for visitors and crawlers.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Domain Age Checker / WHOIS Lookup (shared RDAP result)              */
/* ------------------------------------------------------------------ */

type RdapResult = Awaited<ReturnType<typeof lookupDomainRdap>>;

function useRdap() {
  const [domain, setDomain] = useState("example.com");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RdapResult | null>(null);

  async function run() {
    setError("");
    setResult(null);
    if (!isValidDomain(domain)) {
      setError("Enter a domain like example.com — no http://, no path.");
      return;
    }
    setRunning(true);
    try {
      const res = await lookupDomainRdap({ data: { domain } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult(res);
    } catch {
      setError("Could not reach the lookup service — check your connection and try again.");
    } finally {
      setRunning(false);
    }
  }
  return { domain, setDomain, running, error, result, run };
}

export function DomainAgeChecker() {
  const { domain, setDomain, running, error, result, run } = useRdap();
  const age = result?.ok && result.info.registered ? domainAge(result.info.registered) : null;
  return (
    <div className="space-y-4">
      <DomainField label="Domain" value={domain} onChange={setDomain} />
      <div>
        <button type="button" onClick={run} disabled={running} className={btnPrimary}>
          {running ? "Checking…" : "Check domain age"}
        </button>
      </div>
      {error && <ErrorBox message={error} />}
      {result?.ok && (
        <div className="space-y-3" aria-live="polite">
          <div className="rounded-xl bg-primary p-5 text-primary-foreground">
            <p className="text-xs font-medium text-primary-foreground/70">{result.info.domain}</p>
            <p className="mt-1 font-display text-2xl font-extrabold">
              {age ? formatAge(age) : "Registration date unknown"}
            </p>
            <p className="mt-1 text-sm text-primary-foreground/80">
              Registered {result.info.registered ? new Date(result.info.registered).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}
              {result.info.expires ? ` · Expires ${new Date(result.info.expires).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}` : ""}
            </p>
          </div>
          <div className="rounded-xl border border-border px-4 py-2">
            <InfoRow label="Registrar" value={result.info.registrar ?? "Not shown in the record"} />
            <InfoRow label="Name servers" value={result.info.nameservers.join(", ") || "—"} />
            <InfoRow label="Status" value={result.info.status.join(", ") || "—"} />
          </div>
        </div>
      )}
    </div>
  );
}

export function WhoisLookup() {
  const { domain, setDomain, running, error, result, run } = useRdap();
  return (
    <div className="space-y-4">
      <DomainField label="Domain" value={domain} onChange={setDomain} />
      <div>
        <button type="button" onClick={run} disabled={running} className={btnPrimary}>
          {running ? "Looking up…" : "Look up WHOIS"}
        </button>
      </div>
      {error && <ErrorBox message={error} />}
      {result?.ok && (
        <div className="space-y-3" aria-live="polite">
          <div className="rounded-xl bg-primary p-5 text-primary-foreground">
            <p className="text-xs font-medium text-primary-foreground/70">Domain</p>
            <p className="mt-1 break-all font-display text-2xl font-extrabold">{result.info.domain}</p>
            <p className="mt-1 text-sm text-primary-foreground/80">
              Registrar: {result.info.registrar ?? "Not shown in the record"}
            </p>
          </div>
          <div className="rounded-xl border border-border px-4 py-2">
            <InfoRow
              label="Registered"
              value={
                result.info.registered
                  ? new Date(result.info.registered).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                  : "Not shown in the record"
              }
            />
            <InfoRow
              label="Expires"
              value={
                result.info.expires
                  ? new Date(result.info.expires).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                  : "Not shown in the record"
              }
            />
            <InfoRow label="Name servers" value={result.info.nameservers.join(", ") || "—"} />
            <InfoRow label="Status" value={result.info.status.join(", ") || "—"} />
            <InfoRow label="Registrant" value={result.info.registrant ?? "Hidden by privacy protection"} />
          </div>
          <p className="text-sm text-muted-foreground">
            Data comes from the domain's RDAP record — the registry's own publication. Registrant details are
            usually hidden by privacy protection.
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* API Tester                                                          */
/* ------------------------------------------------------------------ */

const API_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export function ApiTester() {
  const [url, setUrl] = useState("https://api.github.com/zen");
  const [method, setMethod] = useState("GET");
  const [headersText, setHeadersText] = useState("");
  const [body, setBody] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Awaited<ReturnType<typeof testApiEndpoint>> | null>(null);

  function parseHeaders(): { headers: Record<string, string>; error?: string } {
    const headers: Record<string, string> = {};
    for (const line of headersText.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const idx = trimmed.indexOf(":");
      if (idx <= 0) return { headers, error: `Header line "${trimmed}" needs a Name: value format.` };
      headers[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
    return { headers };
  }

  async function run() {
    setError("");
    setResult(null);
    const checked = checkAuditUrl(url);
    if (!checked.ok) {
      setError(checked.error);
      return;
    }
    const parsed = parseHeaders();
    if (parsed.error) {
      setError(parsed.error);
      return;
    }
    setRunning(true);
    try {
      const res = await testApiEndpoint({ data: { url, method, headers: parsed.headers, body } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult(res);
    } catch {
      setError("Could not reach the test service — check your connection and try again.");
    } finally {
      setRunning(false);
    }
  }

  const prettyBody = (text: string) => {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[160px_1fr]">
        <label className="block">
          <span className="text-sm font-semibold">Method</span>
          <select className={`${inputCls} mt-1.5`} value={method} onChange={(e) => setMethod(e.target.value)}>
            {API_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <UrlField label="Request URL" value={url} onChange={setUrl} placeholder="https://api.example.com/data" />
      </div>
      <label className="block">
        <span className="text-sm font-semibold">Headers (optional, one per line: Name: value)</span>
        <textarea
          className={`${inputCls} mt-1.5 font-mono`}
          rows={3}
          value={headersText}
          onChange={(e) => setHeadersText(e.target.value)}
          placeholder={"Authorization: Bearer test-key\nAccept: application/json"}
        />
      </label>
      {method !== "GET" && (
        <label className="block">
          <span className="text-sm font-semibold">Request body (optional)</span>
          <textarea
            className={`${inputCls} mt-1.5 font-mono leading-6`}
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={'{"key": "value"}'}
          />
        </label>
      )}
      <div>
        <button type="button" onClick={run} disabled={running} className={btnPrimary}>
          {running ? "Sending…" : "Send request"}
        </button>
      </div>
      {error && <ErrorBox message={error} />}
      {result && (
        <div className="space-y-3" aria-live="polite">
          <div className="rounded-xl bg-primary p-5 text-primary-foreground">
            <p className="text-xs font-medium text-primary-foreground/70">Response</p>
            <p className="mt-1 font-display text-2xl font-extrabold">
              {result.status} {result.statusText}
            </p>
            <p className="mt-1 break-all text-sm text-primary-foreground/80">
              {result.finalUrl} · {result.timeMs} ms
            </p>
          </div>
          <div className="rounded-xl border border-border px-4 py-2">
            <InfoRow label="Content type" value={result.contentType || "—"} />
            <InfoRow label="Body size" value={`${result.body.length.toLocaleString()} characters shown`} />
          </div>
          {result.binary ? (
            <p className="text-sm text-muted-foreground">
              The response is a binary file ({result.contentType || "unknown type"}) — it cannot be shown as text.
            </p>
          ) : (
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Response body</span>
                <button
                  type="button"
                  className={btnOutline}
                  onClick={() => navigator.clipboard.writeText(result.body)}
                >
                  Copy body
                </button>
              </div>
              <pre className="mt-1.5 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-muted/40 p-3 font-mono text-sm leading-6">
                {prettyBody(result.body)}
              </pre>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Never send a real password or API key through an online tester — use a test key.
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DNS Lookup                                                          */
/* ------------------------------------------------------------------ */

const DNS_TYPE_OPTIONS = [
  { v: "A", l: "A — IPv4 address" },
  { v: "AAAA", l: "AAAA — IPv6 address" },
  { v: "MX", l: "MX — mail servers" },
  { v: "TXT", l: "TXT — text records" },
  { v: "NS", l: "NS — name servers" },
  { v: "CNAME", l: "CNAME — alias" },
  { v: "SOA", l: "SOA — start of authority" },
];

export function DnsLookup() {
  const [domain, setDomain] = useState("example.com");
  const [type, setType] = useState("A");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Awaited<ReturnType<typeof lookupDnsRecords>> | null>(null);

  async function run() {
    setError("");
    setResult(null);
    if (!isValidDomain(domain)) {
      setError("Enter a domain like example.com — no http://, no path.");
      return;
    }
    setRunning(true);
    try {
      const res = await lookupDnsRecords({ data: { domain, type } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult(res);
    } catch {
      setError("Could not reach the lookup service — check your connection and try again.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <DomainField label="Domain" value={domain} onChange={setDomain} />
        <label className="block">
          <span className="text-sm font-semibold">Record type</span>
          <select className={`${inputCls} mt-1.5`} value={type} onChange={(e) => setType(e.target.value)}>
            {DNS_TYPE_OPTIONS.map((o) => (
              <option key={o.v} value={o.v}>
                {o.l}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <button type="button" onClick={run} disabled={running} className={btnPrimary}>
          {running ? "Looking up…" : "Look up DNS"}
        </button>
      </div>
      {error && <ErrorBox message={error} />}
      {result && (
        <div className="space-y-3" aria-live="polite">
          <div className="rounded-xl bg-primary p-5 text-primary-foreground">
            <p className="text-xs font-medium text-primary-foreground/70">
              {type} records for {domain}
            </p>
            <p className="mt-1 font-display text-2xl font-extrabold">
              {result.records.length} record{result.records.length === 1 ? "" : "s"} found
            </p>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            {result.records.map((r, i) => (
              <div key={i} className="border-b border-border px-4 py-3 last:border-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold">{r.type}</span>
                  <span className="text-xs text-muted-foreground">TTL {r.ttl}s</span>
                </div>
                <p className="mt-1.5 break-all font-mono text-sm">{r.data}</p>
                <p className="mt-0.5 break-all text-xs text-muted-foreground">{r.name}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Answered by Google's public DNS resolver over HTTPS. Records are cached, so a change can take up to the
            TTL to show everywhere.
          </p>
        </div>
      )}
    </div>
  );
}
