import { renderErrorPage } from "./lib/error-page";
import { calcs } from "./lib/registry";
import { listBlogPosts } from "./lib/blog.server";
import { readSettings } from "./lib/site-settings.server";

// Public origin used in sitemap/robots: the site URL from Site Settings when
// set, else VITE_SITE_URL (or SITE_URL), else the request origin.
async function siteOrigin(request: Request): Promise<string> {
  const fromSettings = (await readSettings().catch(() => null))?.siteUrl?.trim() ?? "";
  const configured =
    fromSettings || (process.env["VITE_SITE_URL"] ?? process.env["SITE_URL"] ?? "").trim();
  return (configured || new URL(request.url).origin).replace(/\/+$/, "");
}

function robotsTxt(origin: string): string {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /tools?",
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    "",
  ].join("\n");
}

function sitemapXml(origin: string, blogSlugs: string[]): string {
  const paths = [
    { loc: "/", priority: "1.0" },
    { loc: "/tools", priority: "0.9" },
    ...calcs.map((tool) => ({ loc: `/${tool.slug}`, priority: tool.popular ? "0.9" : "0.8" })),
    { loc: "/blog", priority: "0.8" },
    ...blogSlugs.map((slug) => ({ loc: `/blog/${slug}`, priority: "0.7" })),
    { loc: "/about", priority: "0.4" },
    { loc: "/privacy", priority: "0.3" },
  ];
  const urls = paths
    .map((p) => `  <url><loc>${origin}${p.loc}</loc><priority>${p.priority}</priority></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

async function seoFile(request: Request): Promise<Response | null> {
  const { pathname } = new URL(request.url);
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const origin = await siteOrigin(request);
  if (pathname === "/robots.txt") {
    return new Response(robotsTxt(origin), {
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
    });
  }
  if (pathname === "/sitemap.xml") {
    // Blog entries are best-effort: if the store is unreachable the sitemap
    // still serves with the tool pages (200+ blog URLs when present).
    const blogSlugs = await listBlogPosts()
      .then((posts) => posts.map((p) => p.slug))
      .catch(() => [] as string[]);
    return new Response(sitemapXml(origin, blogSlugs), {
      headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" },
    });
  }
  return null;
}

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// TanStack Start streams inline <script> tags (router state / hydration data) and React sets
// inline style attributes, so script-src/style-src need 'unsafe-inline'. In dev, Vite also injects
// an inline React-refresh preamble, <style> tags for CSS and uses a websocket for HMR; with a
// strict policy the page renders from SSR and then goes blank once hydration/HMR kicks in.
const isDev = Boolean(import.meta.env?.DEV);
// Google Analytics (GA4) loads gtag.js from googletagmanager.com and sends
// hits to google-analytics.com (region1 for some visitors); the GA script
// URL and beacons need those hosts in script/connect-src. Images are
// `https:` (any host) because post content links images by URL — a featured
// image or image block can point at any public host, and a host allow-list
// would block legitimate post images. Nothing else here changed — the CSP
// caused a blank screen in the past, so any further edit needs a
// real-browser check in dev AND production preview.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https:",
  `connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com${isDev ? " ws: wss: http://localhost:* http://127.0.0.1:*" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
].join("; ");

const SECURITY_HEADERS: Record<string, string> = {
  "content-security-policy": CSP,
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
};

function withSecurityHeaders(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(name)) headers.set(name, value);
  }
  // Never let browsers or proxies cache admin pages or auth responses.
  if (new URL(request.url).pathname.startsWith("/admin") || request.method !== "GET") {
    headers.set("cache-control", "no-store");
    headers.set("x-robots-tag", "noindex, nofollow");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;
  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;
  console.error("SSR error: unhandled server error");
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8", ...SECURITY_HEADERS },
  });
}

// Hosting compresses every response at the edge. Never compress a body (gzip, brotli,
// CompressionStream) or set content-encoding here or in a server route: the body gets encoded
// twice and renders garbled.
export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const seo = await seoFile(request);
      if (seo) return withSecurityHeaders(request, seo);
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return withSecurityHeaders(request, await normalizeCatastrophicSsrResponse(response));
    } catch {
      console.error("SSR error: unhandled server error");
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8", ...SECURITY_HEADERS },
      });
    }
  },
};
