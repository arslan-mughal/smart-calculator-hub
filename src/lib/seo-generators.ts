// Pure builders for the SEO generator tools (robots.txt, XML sitemap,
// JSON-LD schema markup, hreflang tags). Outputs are plain text the
// visitor copies — nothing is fetched or stored.

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export type RobotsRule = { agent: string; allow: string[]; disallow: string[] };

export function buildRobotsTxt(rules: RobotsRule[], sitemapUrl: string): string {
  const lines: string[] = [];
  for (const rule of rules) {
    lines.push(`User-agent: ${rule.agent.trim() || "*"}`);
    for (const path of rule.disallow) if (path.trim()) lines.push(`Disallow: ${path.trim()}`);
    for (const path of rule.allow) if (path.trim()) lines.push(`Allow: ${path.trim()}`);
    lines.push("");
  }
  if (sitemapUrl.trim()) lines.push(`Sitemap: ${sitemapUrl.trim()}`);
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

export type SitemapUrl = { loc: string; lastmod?: string; changefreq?: string; priority?: string };

const CHANGEFREQ = new Set(["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]);

export function buildSitemapXml(urls: SitemapUrl[]): { ok: true; xml: string } | { ok: false; error: string } {
  const valid = urls.map((u) => u.loc.trim()).filter(Boolean);
  if (valid.length === 0) return { ok: false, error: "Enter at least one page URL." };
  for (const loc of valid) {
    let parsed: URL;
    try {
      parsed = new URL(loc);
    } catch {
      return { ok: false, error: `"${loc}" is not a valid URL — include the https:// part.` };
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { ok: false, error: `"${loc}" must start with http:// or https://.` };
    }
  }
  const entries = urls
    .filter((u) => u.loc.trim())
    .map((u) => {
      const parts = [`    <loc>${xmlEscape(u.loc.trim())}</loc>`];
      if (u.lastmod?.trim()) parts.push(`    <lastmod>${xmlEscape(u.lastmod.trim())}</lastmod>`);
      if (u.changefreq?.trim() && CHANGEFREQ.has(u.changefreq.trim()))
        parts.push(`    <changefreq>${xmlEscape(u.changefreq.trim())}</changefreq>`);
      const p = Number(u.priority);
      if (u.priority?.trim() && Number.isFinite(p) && p >= 0 && p <= 1)
        parts.push(`    <priority>${p.toFixed(1)}</priority>`);
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");
  return {
    ok: true,
    xml: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`,
  };
}

export type SchemaType = "Article" | "FAQPage" | "Product" | "Organization";

export function buildSchemaJsonLd(
  type: SchemaType,
  fields: Record<string, string>,
): { ok: true; json: string } | { ok: false; error: string } {
  const clean = (v: string | undefined) => (v ?? "").trim();
  let obj: Record<string, unknown> = { "@context": "https://schema.org", "@type": type };
  if (type === "Article") {
    if (!clean(fields.headline)) return { ok: false, error: "An article needs a headline." };
    obj = {
      ...obj,
      headline: clean(fields.headline),
      ...(clean(fields.author) ? { author: { "@type": "Person", name: clean(fields.author) } } : {}),
      ...(clean(fields.datePublished) ? { datePublished: clean(fields.datePublished) } : {}),
      ...(clean(fields.image) ? { image: clean(fields.image) } : {}),
      ...(clean(fields.description) ? { description: clean(fields.description) } : {}),
    };
  } else if (type === "FAQPage") {
    const pairs: { question: string; answer: string }[] = [];
    for (let i = 1; i <= 4; i++) {
      const q = clean(fields[`q${i}`]);
      const a = clean(fields[`a${i}`]);
      if (q && a) pairs.push({ question: q, answer: a });
    }
    if (pairs.length === 0) return { ok: false, error: "An FAQ page needs at least one question and answer." };
    obj = {
      ...obj,
      mainEntity: pairs.map((p) => ({
        "@type": "Question",
        name: p.question,
        acceptedAnswer: { "@type": "Answer", text: p.answer },
      })),
    };
  } else if (type === "Product") {
    if (!clean(fields.name)) return { ok: false, error: "A product needs a name." };
    obj = {
      ...obj,
      name: clean(fields.name),
      ...(clean(fields.description) ? { description: clean(fields.description) } : {}),
      ...(clean(fields.price) && clean(fields.currency)
        ? {
            offers: {
              "@type": "Offer",
              priceCurrency: clean(fields.currency),
              price: clean(fields.price),
              availability: "https://schema.org/InStock",
            },
          }
        : {}),
      ...(clean(fields.rating) ? { aggregateRating: { "@type": "AggregateRating", ratingValue: clean(fields.rating) } } : {}),
    };
  } else {
    if (!clean(fields.name)) return { ok: false, error: "An organization needs a name." };
    obj = {
      ...obj,
      name: clean(fields.name),
      ...(clean(fields.url) ? { url: clean(fields.url) } : {}),
      ...(clean(fields.logo) ? { logo: clean(fields.logo) } : {}),
      ...(clean(fields.description) ? { description: clean(fields.description) } : {}),
    };
  }
  return { ok: true, json: JSON.stringify(obj, null, 2) };
}

export type HreflangEntry = { url: string; lang: string };

export function buildHreflangTags(entries: HreflangEntry[]): { ok: true; tags: string } | { ok: false; error: string } {
  const valid = entries.filter((e) => e.url.trim() && e.lang.trim());
  if (valid.length === 0) return { ok: false, error: "Enter at least one URL and language code." };
  for (const e of valid) {
    let parsed: URL;
    try {
      parsed = new URL(e.url.trim());
    } catch {
      return { ok: false, error: `"${e.url.trim()}" is not a valid URL — include the https:// part.` };
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { ok: false, error: `"${e.url.trim()}" must start with http:// or https://.` };
    }
    if (!/^[a-z]{2,3}(-[A-Z]{2})?$|^x-default$/.test(e.lang.trim())) {
      return { ok: false, error: `"${e.lang.trim()}" is not a language code — use en, en-US, de, fr or x-default.` };
    }
  }
  return {
    ok: true,
    tags: valid
      .map((e) => `<link rel="alternate" hreflang="${e.lang.trim()}" href="${e.url.trim()}" />`)
      .join("\n"),
  };
}
