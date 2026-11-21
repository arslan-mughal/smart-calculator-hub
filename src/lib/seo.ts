// Central SEO helpers: absolute URLs, per-page head tags and JSON-LD builders.
// Set VITE_SITE_URL (e.g. https://calchub.com) so canonical/OG URLs are correct in production.
// Brand defaults come from site settings (DEFAULT_SETTINGS) — the single source
// of truth. Pages that know the live settings (via the root loader) pass the
// live values instead; everything else falls back to these defaults.
import { DEFAULT_SETTINGS, type SiteSettings } from "./site-settings";

/**
 * Read the live site settings out of a head()/loader `matches` array.
 * The root route's loader loads the settings, so every child route can use
 * the live brand name in its title instead of the hardcoded default.
 * Falls back to DEFAULT_SETTINGS when the match has no loader data
 * (e.g. during a test render).
 */
export function settingsFromMatches(
  matches: readonly { routeId?: string; loaderData?: unknown }[],
  routeId = "__root__",
): SiteSettings {
  const match = matches.find((m) => m.routeId === routeId);
  const settings = (match?.loaderData as { settings?: SiteSettings } | undefined)?.settings;
  return settings ?? DEFAULT_SETTINGS;
}

export function rootSettingsFromMatches(
  matches: readonly { routeId?: string; loaderData?: unknown }[],
): SiteSettings {
  return settingsFromMatches(matches, "__root__");
}

export const SITE_NAME = DEFAULT_SETTINGS.siteName;
export const SITE_TAGLINE = DEFAULT_SETTINGS.tagline;
export const DEFAULT_DESCRIPTION = DEFAULT_SETTINGS.description;
export const OG_IMAGE_PATH = "/og-image.png";

const rawSiteUrl =
  (import.meta.env?.["VITE_SITE_URL"] as string | undefined)?.trim() || "http://localhost:3000";
export const SITE_URL = rawSiteUrl.replace(/\/+$/, "");

export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

// Keep descriptions inside the ~160 character snippet limit without cutting a word in half.
export function clampDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 80 ? cut.lastIndexOf(" ") : cut.length)}…`;
}

type JsonLd = Record<string, unknown>;

export type SeoOptions = {
  title: string;
  description: string;
  path: string;
  keywords?: string;
  type?: "website" | "article";
  noindex?: boolean;
  jsonLd?: JsonLd[];
  /** Absolute image URL for og:image / twitter:image. Defaults to the site OG image. */
  image?: string;
};

export function buildHead(o: SeoOptions) {
  const description = clampDescription(o.description);
  const url = absoluteUrl(o.path);
  const image = o.image ?? absoluteUrl(OG_IMAGE_PATH);
  return {
    meta: [
      { title: o.title },
      { name: "description", content: description },
      ...(o.keywords ? [{ name: "keywords", content: o.keywords }] : []),
      {
        name: "robots",
        content: o.noindex
          ? "noindex, nofollow"
          : "index, follow, max-image-preview:large, max-snippet:-1",
      },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:type", content: o.type ?? "website" },
      { property: "og:title", content: o.title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: `${SITE_NAME} — ${SITE_TAGLINE}` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: o.title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: (o.jsonLd ?? []).map((data) => ({
      type: "application/ld+json",
      // "<" escaped so content can never close the script tag.
      children: JSON.stringify(data).replace(/</g, "\\u003c"),
    })),
  };
}

export const breadcrumbLd = (items: { name: string; path: string }[]): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

export const websiteLd = (): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: absoluteUrl("/"),
  description: DEFAULT_DESCRIPTION,
  inLanguage: "en",
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/tools")}?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
});

export const organizationLd = (): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: absoluteUrl("/"),
  logo: absoluteUrl("/favicon.ico"),
});

export const faqJsonLd = (faqs: { q: string; a: string }[]): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
});

export const articleLd = (o: {
  title: string;
  description: string;
  path: string;
  author?: string;
  datePublished?: string;
  dateModified?: string;
  image?: string;
}): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: o.title,
  description: clampDescription(o.description),
  url: absoluteUrl(o.path),
  image: o.image ?? absoluteUrl(OG_IMAGE_PATH),
  author: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
  publisher: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
  ...(o.datePublished ? { datePublished: o.datePublished } : {}),
  ...(o.dateModified ? { dateModified: o.dateModified } : {}),
  inLanguage: "en",
});
