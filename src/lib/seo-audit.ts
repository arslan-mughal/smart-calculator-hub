// SEO audit helpers (pure — safe to run in the browser and on the
// server). URL safety (SSRF guards), HTML extraction, robots.txt and
// sitemap analysis, keyword density and the audit score.
// The server-side fetch itself lives in seo-audit.server.ts.

export type AuditUrlCheck = { ok: true; url: URL } | { ok: false; error: string };

const BLOCKED_HOSTNAMES = new Set(["localhost"]);

function isIPv4(ip: string): boolean {
  const parts = ip.split(".");
  return parts.length === 4 && parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255);
}

/** True for the private/loopback/link-local ranges the fetch must never touch. */
export function isPrivateIp(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 0) return true; // 0.0.0.0/8 — "this network"
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // 127.0.0.0/8 loopback
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local
    if (a === 172 && b! >= 16 && b! <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    return false;
  }
  // IPv6: strip a zone id (fe80::1%eth0) and brackets.
  const v6 = lower.replace(/%.*$/, "").replace(/^\[|\]$/g, "");
  if (v6 === "::1" || v6 === "::") return true;
  if (v6.startsWith("fe80:") || v6.startsWith("fe8") || v6.startsWith("fe9") || v6.startsWith("fea") || v6.startsWith("feb"))
    return true; // fe80::/10 link-local
  if (v6.startsWith("fc") || v6.startsWith("fd")) return true; // fc00::/7 unique-local
  return false;
}

/**
 * Validate a user-supplied audit URL before any fetch. Only http/https,
 * no localhost / .local hostnames, no private IP literals. DNS-resolved
 * addresses are checked separately on the server (see seo-audit.server.ts).
 */
export function checkAuditUrl(raw: string): AuditUrlCheck {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "Enter a URL to audit." };
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false, error: "That is not a valid URL — include the https:// part." };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, error: "Only http:// and https:// URLs can be audited." };
  }
  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith(".local")) {
    return { ok: false, error: "Local addresses cannot be audited." };
  }
  if (isPrivateIp(host)) {
    return { ok: false, error: "Private and loopback addresses cannot be audited." };
  }
  return { ok: true, url };
}

// ------------------------------------------------------------------ //
// HTML extraction (small, careful regexes — enough for an audit; the
// page itself is never rendered, only inspected).
// ------------------------------------------------------------------ //

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function stripTags(text: string): string {
  return decodeEntities(text.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
}

function attrValue(tag: string, name: string): string | null {
  const re = new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const m = tag.match(re);
  if (!m) return null;
  return decodeEntities(m[1] ?? m[2] ?? m[3] ?? "");
}

export type PageInfo = {
  title: string | null;
  description: string | null;
  canonical: string | null;
  robots: string | null;
  og: Record<string, string>;
  twitter: Record<string, string>;
  headings: { level: number; text: string }[];
  images: { total: number; missingAlt: number };
  links: string[];
  text: string;
};

export function extractPageInfo(html: string): PageInfo {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? stripTags(titleMatch[1]!) : null;

  let description: string | null = null;
  let robots: string | null = null;
  let canonical: string | null = null;
  const og: Record<string, string> = {};
  const twitter: Record<string, string> = {};
  for (const tag of html.match(/<meta[^>]*>/gi) ?? []) {
    const name = attrValue(tag, "name");
    const property = attrValue(tag, "property");
    const content = attrValue(tag, "content");
    if (content === null) continue;
    if (name === "description" && description === null) description = content;
    if (name === "robots" && robots === null) robots = content;
    if (property && property.toLowerCase().startsWith("og:")) og[property.toLowerCase()] = content;
    if (name && name.toLowerCase().startsWith("twitter:")) twitter[name.toLowerCase()] = content;
  }
  for (const tag of html.match(/<link[^>]*>/gi) ?? []) {
    if ((attrValue(tag, "rel") ?? "").toLowerCase() === "canonical") {
      canonical = attrValue(tag, "href");
      break;
    }
  }

  const headings: { level: number; text: string }[] = [];
  for (const m of html.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const text = stripTags(m[2]!);
    if (text) headings.push({ level: Number(m[1]), text });
  }

  const imgTags = html.match(/<img[^>]*>/gi) ?? [];
  let missingAlt = 0;
  for (const tag of imgTags) {
    const alt = attrValue(tag, "alt");
    if (alt === null || alt.trim() === "") missingAlt++;
  }

  const links: string[] = [];
  for (const tag of html.match(/<a[^>]*>/gi) ?? []) {
    const href = attrValue(tag, "href");
    if (href) links.push(href);
  }

  // Visible text: drop scripts/styles, then tags.
  const text = stripTags(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " "),
  );

  return {
    title,
    description,
    canonical,
    robots,
    og,
    twitter,
    headings,
    images: { total: imgTags.length, missingAlt },
    links,
    text,
  };
}

// ------------------------------------------------------------------ //
// Audit scoring
// ------------------------------------------------------------------ //

export type AuditCheck = { label: string; status: "pass" | "warn" | "fail"; detail: string };

export function analyzeSeo(info: PageInfo): { score: number; checks: AuditCheck[] } {
  const checks: AuditCheck[] = [];
  const push = (label: string, status: AuditCheck["status"], detail: string) => checks.push({ label, status, detail });

  if (info.title === null || info.title === "") {
    push("Title tag", "fail", "No <title> tag found. Every page needs a title — it is the link text in search results.");
  } else if (info.title.length < 30) {
    push("Title tag", "warn", `Title is ${info.title.length} characters — short. Aim for roughly 50–60 characters so it reads well in search results.`);
  } else if (info.title.length > 60) {
    push("Title tag", "warn", `Title is ${info.title.length} characters — long. Search results usually cut titles off at about 60 characters.`);
  } else {
    push("Title tag", "pass", `Title is ${info.title.length} characters — a good length.`);
  }

  if (info.description === null || info.description === "") {
    push("Meta description", "fail", "No meta description found. Without one, search engines write their own snippet from the page text.");
  } else if (info.description.length < 70) {
    push("Meta description", "warn", `Description is ${info.description.length} characters — short. Aim for roughly 120–160 characters.`);
  } else if (info.description.length > 160) {
    push("Meta description", "warn", `Description is ${info.description.length} characters — long. Search results usually cut it off at about 160 characters.`);
  } else {
    push("Meta description", "pass", `Description is ${info.description.length} characters — a good length.`);
  }

  const h1s = info.headings.filter((h) => h.level === 1);
  if (h1s.length === 0) {
    push("H1 heading", "fail", "No H1 found. A page should have one H1 that says what the page is about.");
  } else if (h1s.length > 1) {
    push("H1 heading", "warn", `${h1s.length} H1 headings found. A page should normally have exactly one H1.`);
  } else {
    push("H1 heading", "pass", `One H1: “${h1s[0]!.text}”.`);
  }

  let skipped = false;
  let prev = 0;
  for (const h of info.headings) {
    if (prev > 0 && h.level > prev + 1) skipped = true;
    prev = h.level;
  }
  if (info.headings.length === 0) {
    push("Heading structure", "warn", "No headings found at all — headings help readers and search engines scan the page.");
  } else if (skipped) {
    push("Heading structure", "warn", "Heading levels are skipped somewhere (for example H2 straight to H4). Keep levels in order: H1, then H2, then H3.");
  } else {
    push("Heading structure", "pass", `${info.headings.length} headings, in order.`);
  }

  if (info.images.total === 0) {
    push("Image alt text", "pass", "No images on the page, so nothing to describe.");
  } else if (info.images.missingAlt === 0) {
    push("Image alt text", "pass", `All ${info.images.total} images have alt text.`);
  } else {
    push(
      "Image alt text",
      "warn",
      `${info.images.missingAlt} of ${info.images.total} images are missing alt text. Alt text describes the image to screen readers and search engines.`,
    );
  }

  if (info.canonical) {
    push("Canonical tag", "pass", `Canonical points to ${info.canonical}.`);
  } else {
    push("Canonical tag", "warn", "No canonical tag. One is worth adding so search engines know the preferred address for this page.");
  }

  if (info.robots && /noindex/i.test(info.robots)) {
    push("Robots meta", "warn", `The robots meta says “${info.robots}” — this page tells search engines not to index it.`);
  } else {
    push("Robots meta", "pass", info.robots ? `Robots meta: “${info.robots}”.` : "No robots meta tag — the page is indexable by default.");
  }

  const ogTitle = info.og["og:title"];
  const ogDesc = info.og["og:description"];
  const ogImage = info.og["og:image"];
  if (ogTitle && ogDesc && ogImage) {
    push("Open Graph tags", "pass", "og:title, og:description and og:image are all present, so shares will show a proper preview.");
  } else {
    const missing = [
      ogTitle ? null : "og:title",
      ogDesc ? null : "og:description",
      ogImage ? null : "og:image",
    ].filter(Boolean);
    push("Open Graph tags", "warn", `Missing ${missing.join(", ")}. Without these, shared links show a plain link instead of a preview card.`);
  }

  let score = 100;
  for (const c of checks) {
    if (c.status === "fail") score -= 15;
    else if (c.status === "warn") score -= 5;
  }
  return { score: Math.max(0, score), checks };
}

// ------------------------------------------------------------------ //
// robots.txt
// ------------------------------------------------------------------ //

export type RobotsAnalysis = {
  exists: boolean;
  sitemapUrls: string[];
  blocksAll: boolean;
  rules: { agent: string; rules: string[] }[];
  issues: string[];
};

export function analyzeRobotsTxt(text: string): RobotsAnalysis {
  const issues: string[] = [];
  const sitemapUrls: string[] = [];
  const rules: { agent: string; rules: string[] }[] = [];
  let current: { agent: string; rules: string[] } | null = null;
  let blocksAll = false;
  let sawUserAgent = false;
  let sawAnyRule = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const colon = line.indexOf(":");
    if (colon === -1) {
      issues.push(`Line has no colon and is ignored: “${line}”.`);
      continue;
    }
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (key === "user-agent") {
      sawUserAgent = true;
      current = { agent: value || "*", rules: [] };
      rules.push(current);
    } else if (key === "sitemap") {
      sitemapUrls.push(value);
    } else if (key === "disallow" || key === "allow") {
      sawAnyRule = true;
      if (current) current.rules.push(`${key}: ${value}`);
      if (key === "disallow" && (value === "/" || value === "") && current?.agent === "*") {
        if (value === "/") blocksAll = true;
      }
      if (key === "disallow" && value === "") {
        // "Disallow:" with nothing after it means "allow everything" —
        // valid, but a common source of confusion; not an issue.
      }
    } else if (key === "crawl-delay" || key === "host") {
      if (current) current.rules.push(`${key}: ${value}`);
    } else {
      issues.push(`Unknown directive “${key}” — crawlers will ignore this line.`);
    }
  }
  if (!sawUserAgent) issues.push("No User-agent line found — a robots.txt without one has no rules at all.");
  if (sawUserAgent && !sawAnyRule) issues.push("User-agent groups have no Allow/Disallow rules.");
  if (sitemapUrls.length === 0) {
    issues.push("No Sitemap line — add one pointing at your sitemap so crawlers find it.");
  }
  if (blocksAll) {
    issues.push("This file blocks all crawlers from the whole site (Disallow: / for *). If that is not intentional, the site will not be indexed.");
  }
  return { exists: true, sitemapUrls, blocksAll, rules, issues };
}

// ------------------------------------------------------------------ //
// XML sitemap
// ------------------------------------------------------------------ //

export type SitemapAnalysis = {
  urlCount: number;
  locCount: number;
  issues: string[];
  sampleUrls: string[];
};

export function analyzeSitemap(xml: string): SitemapAnalysis {
  const issues: string[] = [];
  const trimmed = xml.trim();
  if (!trimmed.startsWith("<?xml") && !trimmed.startsWith("<urlset") && !trimmed.startsWith("<sitemapindex")) {
    issues.push("The file does not look like XML — a sitemap must start with an XML declaration or a <urlset> / <sitemapindex> element.");
  }
  if (!/<urlset[\s>]/.test(trimmed) && !/<sitemapindex[\s>]/.test(trimmed)) {
    issues.push("No <urlset> or <sitemapindex> element found — this is not a valid sitemap.");
  }
  const urlCount = (trimmed.match(/<url>/g) ?? []).length;
  const locMatches = [...trimmed.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((m) => m[1]!.trim());
  const locCount = locMatches.length;
  if (urlCount > 0 && locCount !== urlCount) {
    issues.push(`${urlCount} <url> entries but ${locCount} <loc> entries — every URL entry needs exactly one <loc>.`);
  }
  const badLocs = locMatches.filter((loc) => !/^https?:\/\//.test(loc));
  if (badLocs.length > 0) {
    issues.push(`${badLocs.length} <loc> value(s) are not absolute http(s) URLs — sitemap locations must be full URLs.`);
  }
  if (urlCount > 50000) {
    issues.push(`${urlCount.toLocaleString("en-US")} URLs — a single sitemap must hold at most 50,000 URLs; split it into several sitemaps.`);
  }
  if (urlCount === 0 && locCount === 0) {
    issues.push("No URLs found in the sitemap.");
  }
  return { urlCount, locCount, issues, sampleUrls: locMatches.slice(0, 5) };
}

// ------------------------------------------------------------------ //
// Keyword density
// ------------------------------------------------------------------ //

export type DensityResult = {
  words: number;
  occurrences: number;
  density: number;
  topWords: { word: string; count: number }[];
};

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with", "is", "are", "was", "were",
  "be", "by", "at", "as", "it", "this", "that", "from", "you", "your", "we", "our", "they", "their",
  "can", "will", "has", "have", "had", "not", "but", "if", "so", "do", "does", "did", "i", "he", "she",
  "his", "her", "its", "my", "me", "us", "them", "what", "which", "when", "where", "how", "all",
  "any", "an", "no", "yes", "into", "over", "under", "between", "through", "after", "before",
]);

export function keywordDensity(text: string, keyword: string): DensityResult {
  const words = text.toLowerCase().match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? [];
  const counts = new Map<string, number>();
  for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
  const kw = keyword.trim().toLowerCase();
  let occurrences = 0;
  if (kw) {
    if (/^[a-z0-9]+$/.test(kw)) {
      occurrences = counts.get(kw) ?? 0;
    } else {
      // Multi-word phrase: count it in the running text.
      const hay = ` ${words.join(" ")} `;
      const needle = ` ${kw} `;
      let idx = hay.indexOf(needle);
      while (idx !== -1) {
        occurrences++;
        idx = hay.indexOf(needle, idx + needle.length);
      }
    }
  }
  const topWords = [...counts.entries()]
    .filter(([w]) => !STOPWORDS.has(w) && w.length > 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));
  return {
    words: words.length,
    occurrences,
    density: words.length > 0 ? (occurrences / words.length) * 100 : 0,
    topWords,
  };
}
