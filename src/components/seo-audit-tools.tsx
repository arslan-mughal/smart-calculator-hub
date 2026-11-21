// Custom components for the SEO Audit tools (batch 28). Each manages its
// own state — the generic form renderer in $slug.tsx cannot express a
// fetched audit report.
// URL modes fetch the page from this site's server (seo-audit.functions.ts,
// with the SSRF guards in seo-audit.server.ts). Pasted text and HTML are
// analysed in the browser and never leave the device.
import { useState } from "react";
import {
  analyzeRobotsTxt,
  analyzeSeo,
  analyzeSitemap,
  checkAuditUrl,
  extractPageInfo,
  keywordDensity,
} from "@/lib/seo-audit";
import { checkPageLinks, fetchPageForAudit } from "@/lib/seo-audit.functions";

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";
const btnPrimary =
  "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50";
const btnOutline =
  "inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary";

function ErrorBox({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
      {message}
    </p>
  );
}

function StatusPill({ status }: { status: "pass" | "warn" | "fail" }) {
  const cls =
    status === "pass"
      ? "bg-green-500/15 text-green-800 dark:text-green-300"
      : status === "warn"
        ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
        : "bg-red-500/15 text-red-800 dark:text-red-300";
  const label = status === "pass" ? "Passed" : status === "warn" ? "Warning" : "Failed";
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${cls}`}>
      {status === "pass" ? "✓" : status === "warn" ? "!" : "✕"} {label}
    </span>
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

/* ------------------------------------------------------------------ */
/* Website SEO Audit                                                   */
/* ------------------------------------------------------------------ */

export function WebsiteSeoAudit() {
  const [url, setUrl] = useState("https://example.com");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ReturnType<typeof analyzeSeo> & {
    info: ReturnType<typeof extractPageInfo>;
    finalUrl: string;
  } | null>(null);

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
      const res = await fetchPageForAudit({ data: { url } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const info = extractPageInfo(res.body);
      setResult({ ...analyzeSeo(info), info, finalUrl: res.finalUrl });
    } catch {
      setError("Could not reach the audit service — check your connection and try again.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <UrlField label="Page URL" value={url} onChange={setUrl} placeholder="https://example.com/page" />
      <div>
        <button type="button" onClick={run} disabled={running} className={btnPrimary}>
          {running ? "Auditing…" : "Run SEO audit"}
        </button>
      </div>
      {error && <ErrorBox message={error} />}
      {result && (
        <div className="space-y-4" aria-live="polite">
          <div className="rounded-xl bg-primary p-5 text-primary-foreground">
            <p className="text-xs font-medium text-primary-foreground/70">SEO score for {result.finalUrl}</p>
            <p className="mt-1 font-display text-4xl font-extrabold">
              {result.score}
              <span className="text-xl font-bold text-primary-foreground/70"> / 100</span>
            </p>
            <p className="mt-1 text-sm text-primary-foreground/80">
              {result.checks.filter((c) => c.status === "fail").length} failed ·{" "}
              {result.checks.filter((c) => c.status === "warn").length} warnings ·{" "}
              {result.checks.filter((c) => c.status === "pass").length} passed
            </p>
          </div>
          <div className="space-y-2">
            {result.checks.map((check) => (
              <div key={check.label} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-muted/60 p-4">
                <div>
                  <p className="text-sm font-bold">{check.label}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{check.detail}</p>
                </div>
                <StatusPill status={check.status} />
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-border bg-muted/60 p-4 text-sm">
            <p className="font-bold">What was found</p>
            <p className="mt-1 break-words">
              <span className="text-muted-foreground">Title: </span>
              {result.info.title ?? "—"}
            </p>
            <p className="mt-1 break-words">
              <span className="text-muted-foreground">Description: </span>
              {result.info.description ?? "—"}
            </p>
            <p className="mt-1">
              <span className="text-muted-foreground">Headings: </span>
              {result.info.headings.length === 0
                ? "none"
                : result.info.headings.map((h) => `H${h.level} “${h.text}”`).join(" · ")}
            </p>
            <p className="mt-1">
              <span className="text-muted-foreground">Images: </span>
              {result.info.images.total} total, {result.info.images.missingAlt} missing alt text
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            The page was fetched, checked and discarded — nothing about it is stored.
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Broken Link Checker                                                 */
/* ------------------------------------------------------------------ */

export function BrokenLinkChecker() {
  const [url, setUrl] = useState("https://example.com");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    pageUrl: string;
    totalFound: number;
    capped: boolean;
    checked: { url: string; status: number | null; error?: string }[];
  } | null>(null);

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
      const res = await checkPageLinks({ data: { url } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult(res);
    } catch {
      setError("Could not reach the audit service — check your connection and try again.");
    } finally {
      setRunning(false);
    }
  }

  const broken = result?.checked.filter((l) => l.status === null || l.status >= 400) ?? [];
  const okCount = result ? result.checked.length - broken.length : 0;

  return (
    <div className="space-y-4">
      <UrlField label="Page URL" value={url} onChange={setUrl} placeholder="https://example.com/page" />
      <div>
        <button type="button" onClick={run} disabled={running} className={btnPrimary}>
          {running ? "Checking links…" : "Check links"}
        </button>
      </div>
      {error && <ErrorBox message={error} />}
      {result && (
        <div className="space-y-3" aria-live="polite">
          <div className="rounded-xl bg-primary p-5 text-primary-foreground">
            <p className="text-xs font-medium text-primary-foreground/70">Links on {result.pageUrl}</p>
            <p className="mt-1 font-display text-2xl font-extrabold">
              {okCount} working · {broken.length} broken
            </p>
            <p className="mt-1 text-sm text-primary-foreground/80">
              {result.totalFound} links found{result.capped ? ` — first ${result.checked.length} checked (limit 50 per run)` : ""}
            </p>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            {result.checked.map((link) => {
              const isBroken = link.status === null || link.status >= 400;
              return (
                <div
                  key={link.url}
                  className={`flex items-start justify-between gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0 ${
                    isBroken ? "bg-red-500/5" : ""
                  }`}
                >
                  <span className="min-w-0 break-all">{link.url}</span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      link.status !== null && link.status < 300
                        ? "bg-green-500/15 text-green-800 dark:text-green-300"
                        : link.status !== null && link.status < 400
                          ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                          : "bg-red-500/15 text-red-800 dark:text-red-300"
                    }`}
                  >
                    {link.status === null ? (link.error ?? "Failed") : `HTTP ${link.status}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Keyword Density Checker                                             */
/* ------------------------------------------------------------------ */

export function KeywordDensityChecker() {
  const [mode, setMode] = useState<"text" | "url">("text");
  const [keyword, setKeyword] = useState("calculator");
  const [text, setText] = useState(
    "A calculator is a handy tool. This calculator helps you work out answers quickly, and every calculator on this site runs in your browser.",
  );
  const [url, setUrl] = useState("https://example.com");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ReturnType<typeof keywordDensity> | null>(null);

  function runText() {
    setError("");
    if (text.trim() === "") {
      setError("Paste some text to analyse first.");
      setResult(null);
      return;
    }
    setResult(keywordDensity(text, keyword));
  }

  async function runUrl() {
    setError("");
    setResult(null);
    const checked = checkAuditUrl(url);
    if (!checked.ok) {
      setError(checked.error);
      return;
    }
    setRunning(true);
    try {
      const res = await fetchPageForAudit({ data: { url } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult(keywordDensity(extractPageInfo(res.body).text, keyword));
    } catch {
      setError("Could not reach the audit service — check your connection and try again.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["text", "url"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setResult(null);
              setError("");
            }}
            className={
              mode === m
                ? "rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
                : "rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary"
            }
          >
            {m === "text" ? "Pasted text" : "Live URL"}
          </button>
        ))}
      </div>
      <label className="block">
        <span className="text-sm font-semibold">Keyword or phrase</span>
        <input className={`${inputCls} mt-1.5`} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
      </label>
      {mode === "text" ? (
        <label className="block">
          <span className="text-sm font-semibold">Text to analyse</span>
          <textarea
            className={`${inputCls} mt-1.5 font-mono leading-6`}
            rows={7}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
      ) : (
        <UrlField label="Page URL" value={url} onChange={setUrl} placeholder="https://example.com/page" />
      )}
      <div>
        <button
          type="button"
          onClick={mode === "text" ? runText : runUrl}
          disabled={running}
          className={btnPrimary}
        >
          {running ? "Fetching…" : "Check density"}
        </button>
      </div>
      {error && <ErrorBox message={error} />}
      {result && (
        <div className="space-y-3" aria-live="polite">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-primary p-4 text-primary-foreground">
              <p className="text-xs font-medium text-primary-foreground/70">Density</p>
              <p className="mt-1 font-display text-2xl font-extrabold">{result.density.toFixed(2)}%</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/60 p-4">
              <p className="text-xs font-medium text-muted-foreground">Words</p>
              <p className="mt-1 font-display text-2xl font-extrabold">{result.words.toLocaleString("en-US")}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/60 p-4">
              <p className="text-xs font-medium text-muted-foreground">Keyword appears</p>
              <p className="mt-1 font-display text-2xl font-extrabold">{result.occurrences} times</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {result.density >= 1 && result.density <= 2
              ? "Inside the usual 1–2% guide range for a target keyword."
              : result.density > 2
                ? "Above the usual 1–2% guide range — check it does not read as stuffing."
                : "Below 1% — the page may not be clearly about this keyword."}
          </p>
          {result.topWords.length > 0 && (
            <div className="rounded-xl border border-border bg-muted/60 p-4">
              <p className="text-sm font-bold">Most common words</p>
              <p className="mt-1 text-sm leading-7">
                {result.topWords.map((w) => `${w.word} (${w.count})`).join(" · ")}
              </p>
            </div>
          )}
          {mode === "text" && (
            <p className="text-xs text-muted-foreground">Pasted text is analysed in your browser — it never leaves your device.</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Heading Checker                                                     */
/* ------------------------------------------------------------------ */

export function HeadingChecker() {
  const [mode, setMode] = useState<"html" | "url">("html");
  const [html, setHtml] = useState(
    "<h1>Page title</h1>\n<h2>First section</h2>\n<h3>A detail</h3>\n<h2>Second section</h2>",
  );
  const [url, setUrl] = useState("https://example.com");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [headings, setHeadings] = useState<{ level: number; text: string }[] | null>(null);

  function runHtml() {
    setError("");
    if (html.trim() === "") {
      setError("Paste some HTML to check first.");
      setHeadings(null);
      return;
    }
    setHeadings(extractPageInfo(html).headings);
  }

  async function runUrl() {
    setError("");
    setHeadings(null);
    const checked = checkAuditUrl(url);
    if (!checked.ok) {
      setError(checked.error);
      return;
    }
    setRunning(true);
    try {
      const res = await fetchPageForAudit({ data: { url } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setHeadings(extractPageInfo(res.body).headings);
    } catch {
      setError("Could not reach the audit service — check your connection and try again.");
    } finally {
      setRunning(false);
    }
  }

  const h1Count = headings?.filter((h) => h.level === 1).length ?? 0;
  let skipped = false;
  let prev = 0;
  for (const h of headings ?? []) {
    if (prev > 0 && h.level > prev + 1) skipped = true;
    prev = h.level;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["html", "url"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setHeadings(null);
              setError("");
            }}
            className={
              mode === m
                ? "rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
                : "rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary"
            }
          >
            {m === "html" ? "Pasted HTML" : "Live URL"}
          </button>
        ))}
      </div>
      {mode === "html" ? (
        <label className="block">
          <span className="text-sm font-semibold">HTML to check</span>
          <textarea
            className={`${inputCls} mt-1.5 font-mono leading-6`}
            rows={7}
            value={html}
            onChange={(e) => setHtml(e.target.value)}
          />
        </label>
      ) : (
        <UrlField label="Page URL" value={url} onChange={setUrl} placeholder="https://example.com/page" />
      )}
      <div>
        <button
          type="button"
          onClick={mode === "html" ? runHtml : runUrl}
          disabled={running}
          className={btnPrimary}
        >
          {running ? "Fetching…" : "Check headings"}
        </button>
      </div>
      {error && <ErrorBox message={error} />}
      {headings && (
        <div className="space-y-3" aria-live="polite">
          <div className="flex flex-wrap gap-2">
            {headings.length === 0 && <StatusPill status="warn" />}
            {h1Count === 0 && (
              <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-bold text-red-800 dark:text-red-300">
                ✕ No H1 found
              </span>
            )}
            {h1Count > 1 && (
              <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                ! {h1Count} H1 headings — use one
              </span>
            )}
            {skipped && (
              <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                ! Skipped heading level
              </span>
            )}
            {headings.length > 0 && h1Count === 1 && !skipped && <StatusPill status="pass" />}
          </div>
          {headings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No headings found at all.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              {headings.map((h, i) => (
                <div
                  key={i}
                  className="flex items-baseline gap-3 border-b border-border px-4 py-2.5 text-sm last:border-b-0"
                >
                  <span className="w-10 shrink-0 font-mono font-bold text-primary">H{h.level}</span>
                  <span style={{ paddingLeft: `${(h.level - 1) * 12}px` }} className="min-w-0 break-words">
                    {h.text}
                  </span>
                </div>
              ))}
            </div>
          )}
          {mode === "html" && (
            <p className="text-xs text-muted-foreground">Pasted HTML is checked in your browser — it never leaves your device.</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Robots.txt Checker                                                  */
/* ------------------------------------------------------------------ */

export function RobotsTxtChecker() {
  const [url, setUrl] = useState("https://example.com");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [missing, setMissing] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof analyzeRobotsTxt> | null>(null);

  async function run() {
    setError("");
    setResult(null);
    setMissing(false);
    const checked = checkAuditUrl(url);
    if (!checked.ok) {
      setError(checked.error);
      return;
    }
    setRunning(true);
    try {
      const robotsUrl = `${checked.url.origin}/robots.txt`;
      const res = await fetchPageForAudit({ data: { url: robotsUrl } });
      if (!res.ok) {
        if (res.error.includes("404")) {
          setMissing(true);
        } else {
          setError(res.error);
        }
        return;
      }
      setResult(analyzeRobotsTxt(res.body));
    } catch {
      setError("Could not reach the audit service — check your connection and try again.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <UrlField label="Site URL" value={url} onChange={setUrl} placeholder="https://example.com" />
      <div>
        <button type="button" onClick={run} disabled={running} className={btnPrimary}>
          {running ? "Fetching…" : "Check robots.txt"}
        </button>
      </div>
      {error && <ErrorBox message={error} />}
      {missing && (
        <div className="rounded-xl border border-border bg-muted/60 p-4 text-sm" aria-live="polite">
          <p className="font-bold">No robots.txt file found</p>
          <p className="mt-1 text-muted-foreground">
            The site answered 404 for /robots.txt. That is not an error — crawlers assume everything is
            allowed — but a Sitemap line in a robots.txt is the easiest way to make sure crawlers find your
            sitemap.
          </p>
        </div>
      )}
      {result && (
        <div className="space-y-3" aria-live="polite">
          <div className="rounded-xl bg-primary p-5 text-primary-foreground">
            <p className="text-xs font-medium text-primary-foreground/70">robots.txt</p>
            <p className="mt-1 font-display text-2xl font-extrabold">
              {result.blocksAll ? "Blocks everything" : `${result.rules.length} crawler group(s)`}
            </p>
            <p className="mt-1 text-sm text-primary-foreground/80">
              {result.sitemapUrls.length > 0
                ? `Sitemap: ${result.sitemapUrls.join(", ")}`
                : "No Sitemap line"}
            </p>
          </div>
          {result.issues.length > 0 && (
            <div className="space-y-2">
              {result.issues.map((issue) => (
                <div key={issue} className="flex items-start gap-3 rounded-xl border border-border bg-muted/60 p-4">
                  <StatusPill status={result.blocksAll && issue.includes("blocks all") ? "fail" : "warn"} />
                  <p className="text-sm">{issue}</p>
                </div>
              ))}
            </div>
          )}
          {result.rules.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-border">
              {result.rules.map((group, i) => (
                <div key={i} className="border-b border-border px-4 py-3 text-sm last:border-b-0">
                  <p className="font-mono font-bold">User-agent: {group.agent}</p>
                  {group.rules.length === 0 ? (
                    <p className="mt-1 text-muted-foreground">No Allow/Disallow rules.</p>
                  ) : (
                    group.rules.map((rule) => (
                      <p key={rule} className="mt-0.5 font-mono text-muted-foreground">
                        {rule}
                      </p>
                    ))
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sitemap Checker                                                     */
/* ------------------------------------------------------------------ */

export function SitemapChecker() {
  const [url, setUrl] = useState("https://example.com/sitemap.xml");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ReturnType<typeof analyzeSitemap> | null>(null);

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
      const res = await fetchPageForAudit({ data: { url } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult(analyzeSitemap(res.body));
    } catch {
      setError("Could not reach the audit service — check your connection and try again.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <UrlField label="Sitemap URL" value={url} onChange={setUrl} placeholder="https://example.com/sitemap.xml" />
      <div>
        <button type="button" onClick={run} disabled={running} className={btnPrimary}>
          {running ? "Fetching…" : "Check sitemap"}
        </button>
      </div>
      {error && <ErrorBox message={error} />}
      {result && (
        <div className="space-y-3" aria-live="polite">
          <div className="rounded-xl bg-primary p-5 text-primary-foreground">
            <p className="text-xs font-medium text-primary-foreground/70">Sitemap</p>
            <p className="mt-1 font-display text-2xl font-extrabold">
              {result.urlCount.toLocaleString("en-US")} URLs · {result.locCount.toLocaleString("en-US")} locations
            </p>
            <p className="mt-1 text-sm text-primary-foreground/80">
              {result.issues.length === 0 ? "No problems found." : `${result.issues.length} issue(s) found.`}
            </p>
          </div>
          {result.issues.length > 0 && (
            <div className="space-y-2">
              {result.issues.map((issue) => (
                <div key={issue} className="flex items-start gap-3 rounded-xl border border-border bg-muted/60 p-4">
                  <StatusPill status="fail" />
                  <p className="text-sm">{issue}</p>
                </div>
              ))}
            </div>
          )}
          {result.sampleUrls.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-border">
              <p className="border-b border-border bg-muted/60 px-4 py-2 text-xs font-bold text-muted-foreground">
                SAMPLE URLS
              </p>
              {result.sampleUrls.map((u) => (
                <p key={u} className="break-all border-b border-border px-4 py-2.5 text-sm last:border-b-0">
                  {u}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Open Graph Checker                                                  */
/* ------------------------------------------------------------------ */

export function OpenGraphChecker() {
  const [url, setUrl] = useState("https://example.com");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    finalUrl: string;
    og: Record<string, string>;
    twitter: Record<string, string>;
  } | null>(null);

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
      const res = await fetchPageForAudit({ data: { url } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const info = extractPageInfo(res.body);
      setResult({ finalUrl: res.finalUrl, og: info.og, twitter: info.twitter });
    } catch {
      setError("Could not reach the audit service — check your connection and try again.");
    } finally {
      setRunning(false);
    }
  }

  const ogImage = result?.og["og:image"];
  const ogImageUrl = ogImage && result ? (() => {
    try {
      return new URL(ogImage, result.finalUrl).toString();
    } catch {
      return ogImage;
    }
  })() : null;
  const cardTitle = result?.og["og:title"] ?? result?.twitter["twitter:title"];
  const cardDesc = result?.og["og:description"] ?? result?.twitter["twitter:description"];

  return (
    <div className="space-y-4">
      <UrlField label="Page URL" value={url} onChange={setUrl} placeholder="https://example.com/page" />
      <div>
        <button type="button" onClick={run} disabled={running} className={btnPrimary}>
          {running ? "Fetching…" : "Preview share card"}
        </button>
      </div>
      {error && <ErrorBox message={error} />}
      {result && (
        <div className="space-y-3" aria-live="polite">
          <div className="overflow-hidden rounded-xl border border-border">
            {ogImageUrl && (
              <img src={ogImageUrl} alt="Share preview" className="aspect-[1200/630] w-full object-cover" />
            )}
            <div className="p-4">
              <p className="font-bold leading-snug">{cardTitle ?? "No og:title found"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {cardDesc ?? "No og:description found — shares will show a plain link."}
              </p>
              <p className="mt-2 truncate text-xs text-muted-foreground">{result.finalUrl}</p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              ["og:title", result.og["og:title"]],
              ["og:description", result.og["og:description"]],
              ["og:image", result.og["og:image"]],
              ["og:type", result.og["og:type"]],
              ["og:url", result.og["og:url"]],
              ["twitter:card", result.twitter["twitter:card"]],
              ["twitter:title", result.twitter["twitter:title"]],
              ["twitter:description", result.twitter["twitter:description"]],
              ["twitter:image", result.twitter["twitter:image"]],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-muted/60 px-4 py-3 text-sm">
                <span className="font-mono font-bold">{label}</span>
                <span className="min-w-0 break-all text-right text-muted-foreground">{value ?? "— missing"}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            This is how the page's tags read now — platforms cache previews, so after fixing tags, refresh
            their cache (Facebook Sharing Debugger / X Card Validator).
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Meta Tag Analyzer                                                   */
/* ------------------------------------------------------------------ */

function lengthVerdict(
  value: string | null,
  min: number,
  max: number,
  label: string,
): { status: "pass" | "warn" | "fail"; detail: string } {
  if (value === null || value === "") {
    return { status: "fail", detail: `No ${label} found.` };
  }
  if (value.length < min) {
    return { status: "warn", detail: `${value.length} characters — short. Aim for roughly ${min}–${max}.` };
  }
  if (value.length > max) {
    return { status: "warn", detail: `${value.length} characters — long. It will be cut off at about ${max}.` };
  }
  return { status: "pass", detail: `${value.length} characters — a good length.` };
}

export function MetaTagAnalyzer() {
  const [url, setUrl] = useState("https://example.com");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ReturnType<typeof extractPageInfo> & { finalUrl: string } | null>(null);

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
      const res = await fetchPageForAudit({ data: { url } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult({ ...extractPageInfo(res.body), finalUrl: res.finalUrl });
    } catch {
      setError("Could not reach the audit service — check your connection and try again.");
    } finally {
      setRunning(false);
    }
  }

  const titleVerdict = result ? lengthVerdict(result.title, 30, 60, "title tag") : null;
  const descVerdict = result ? lengthVerdict(result.description, 70, 160, "meta description") : null;

  return (
    <div className="space-y-4">
      <UrlField label="Page URL" value={url} onChange={setUrl} placeholder="https://example.com/page" />
      <div>
        <button type="button" onClick={run} disabled={running} className={btnPrimary}>
          {running ? "Fetching…" : "Analyse meta tags"}
        </button>
      </div>
      {error && <ErrorBox message={error} />}
      {result && titleVerdict && descVerdict && (
        <div className="space-y-3" aria-live="polite">
          <div className="rounded-xl border border-border bg-muted/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold">Title tag</p>
                <p className="mt-1 break-words text-sm">{result.title ?? "—"}</p>
                <p className="mt-1 text-sm text-muted-foreground">{titleVerdict.detail}</p>
              </div>
              <StatusPill status={titleVerdict.status} />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold">Meta description</p>
                <p className="mt-1 break-words text-sm">{result.description ?? "—"}</p>
                <p className="mt-1 text-sm text-muted-foreground">{descVerdict.detail}</p>
              </div>
              <StatusPill status={descVerdict.status} />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/60 p-4 text-sm">
            <p className="font-bold">Also found</p>
            <p className="mt-1 break-words">
              <span className="text-muted-foreground">Canonical: </span>
              {result.canonical ?? "—"}
            </p>
            <p className="mt-1 break-words">
              <span className="text-muted-foreground">Robots: </span>
              {result.robots ?? "—"}
            </p>
            <p className="mt-1 break-words">
              <span className="text-muted-foreground">Open Graph: </span>
              {Object.keys(result.og).length > 0 ? Object.keys(result.og).join(", ") : "none"}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            This checks the tags on a live page. To create new tags for a page you are building, use the
            Meta Tag Generator.
          </p>
        </div>
      )}
    </div>
  );
}
