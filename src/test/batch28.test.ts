import { describe, expect, it } from "vitest";
import { bySlug } from "@/lib/registry";
import { batch28SeoTools } from "@/lib/extra-tools/batch28-seo";
import {
  analyzeRobotsTxt,
  analyzeSeo,
  analyzeSitemap,
  checkAuditUrl,
  extractPageInfo,
  isPrivateIp,
  keywordDensity,
} from "@/lib/seo-audit";
import { assertResolvable, checkAuditRateLimit, resetAuditRateLimitsForTests } from "@/lib/seo-audit.server";

const allBatch28 = [...batch28SeoTools];

const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<title>Example Domain</title>
<meta name="description" content="A short example description for testing the audit tools.">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://example.com/">
<meta property="og:title" content="Example Domain">
<meta property="og:description" content="An example page.">
<meta property="og:image" content="https://example.com/og.png">
<meta name="twitter:card" content="summary_large_image">
</head>
<body>
<h1>Example Domain</h1>
<p>This domain is for use in illustrative examples.</p>
<h2>More information</h2>
<img src="/logo.png" alt="Example logo">
<img src="/blank.png">
<a href="/about">About</a>
<a href="https://example.com/contact">Contact</a>
</body>
</html>`;

describe("batch 28 — 8 SEO audit tools", () => {
  it("adds 8 complete tools in the new SEO Audit category", () => {
    expect(allBatch28).toHaveLength(8);
    for (const tool of allBatch28) {
      expect(bySlug[tool.slug], tool.slug).toBeDefined();
      expect(tool.category, tool.slug).toBe("SEO Audit");
      expect(tool.custom, tool.slug).toBeDefined();
      expect(tool.howToUse?.length, tool.slug).toBeGreaterThanOrEqual(3);
      expect(tool.details?.length, tool.slug).toBeGreaterThanOrEqual(2);
      expect(tool.faqs.length, tool.slug).toBeGreaterThanOrEqual(3);
      expect(tool.about.length, tool.slug).toBeGreaterThan(250);
      expect(tool.example.length, tool.slug).toBeGreaterThan(50);
    }
    expect(new Set(allBatch28.map((tool) => tool.about)).size).toBe(8);
  });

  it("rejects unsafe audit URLs before any fetch (SSRF guards)", () => {
    for (const bad of [
      "http://127.0.0.1/admin",
      "http://127.5.6.7/",
      "http://10.0.0.5/",
      "https://192.168.1.1/",
      "http://172.16.0.5/",
      "http://172.31.255.255/",
      "http://169.254.1.1/",
      "http://localhost:3000/",
      "http://localhost/",
      "https://foo.local/",
      "http://[::1]/",
      "http://[fe80::1]/",
      "ftp://example.com/file",
      "file:///etc/passwd",
      "not a url",
      "",
    ]) {
      expect(checkAuditUrl(bad).ok, bad).toBe(false);
    }
    for (const good of [
      "https://example.com/",
      "https://example.com/page?x=1",
      "http://8.8.8.8/",
      "http://172.32.0.1/",
      "https://sub.example.co.uk/path",
    ]) {
      expect(checkAuditUrl(good).ok, good).toBe(true);
    }
  });

  it("classifies private and loopback IP ranges", () => {
    for (const ip of ["0.0.0.0", "10.1.2.3", "127.0.0.1", "169.254.10.20", "172.16.0.1", "172.31.255.255", "192.168.0.1", "::1", "::", "fe80::1", "febf::1", "fc00::1", "fd12:3456::1"]) {
      expect(isPrivateIp(ip), ip).toBe(true);
    }
    for (const ip of ["8.8.8.8", "1.1.1.1", "172.15.255.255", "172.32.0.1", "192.169.0.1", "2001:db8::1", "2606:4700:4700::1111"]) {
      expect(isPrivateIp(ip), ip).toBe(false);
    }
  });

  it("refuses to resolve localhost and accepts a public IP literal", async () => {
    expect(await assertResolvable("localhost")).toEqual({
      ok: false,
      error: "That address resolves to a private or loopback network and cannot be fetched.",
    });
    expect(await assertResolvable("8.8.8.8")).toEqual({ ok: true });
  });

  it("rate-limits audit fetches per client (20 per 5 minutes)", () => {
    resetAuditRateLimitsForTests();
    for (let i = 0; i < 20; i++) expect(checkAuditRateLimit("test-client")).toBe(true);
    expect(checkAuditRateLimit("test-client")).toBe(false);
    // A different client is unaffected.
    expect(checkAuditRateLimit("other-client")).toBe(true);
    resetAuditRateLimitsForTests();
    expect(checkAuditRateLimit("test-client")).toBe(true);
  });

  it("extracts title, description, headings, images and links from HTML", () => {
    const info = extractPageInfo(SAMPLE_HTML);
    expect(info.title).toBe("Example Domain");
    expect(info.description).toBe("A short example description for testing the audit tools.");
    expect(info.canonical).toBe("https://example.com/");
    expect(info.robots).toBe("index, follow");
    expect(info.og["og:title"]).toBe("Example Domain");
    expect(info.og["og:image"]).toBe("https://example.com/og.png");
    expect(info.twitter["twitter:card"]).toBe("summary_large_image");
    expect(info.headings).toEqual([
      { level: 1, text: "Example Domain" },
      { level: 2, text: "More information" },
    ]);
    expect(info.images).toEqual({ total: 2, missingAlt: 1 });
    expect(info.links).toEqual(["/about", "https://example.com/contact"]);
    expect(info.text).toContain("This domain is for use in illustrative examples.");
  });

  it("scores a page with a short title and one image missing alt text", () => {
    const { score, checks } = analyzeSeo(extractPageInfo(SAMPLE_HTML));
    // Title "Example Domain" is 14 chars (warn, -5); description is 56 chars
    // (warn, -5); one image missing alt text (warn, -5).
    expect(score).toBe(85);
    expect(checks.find((c) => c.label === "Title tag")?.status).toBe("warn");
    expect(checks.find((c) => c.label === "Meta description")?.status).toBe("warn");
    expect(checks.find((c) => c.label === "H1 heading")?.status).toBe("pass");
    expect(checks.find((c) => c.label === "Image alt text")?.status).toBe("warn");
    expect(checks.find((c) => c.label === "Canonical tag")?.status).toBe("pass");
    expect(checks.find((c) => c.label === "Open Graph tags")?.status).toBe("pass");
  });

  it("fails a page with no title, no description and no H1 (score 40)", () => {
    const { score, checks } = analyzeSeo(extractPageInfo("<html><body><p>Nothing here.</p></body></html>"));
    // Three failures (title, description, H1: -45) and three warnings
    // (no headings, no canonical, no Open Graph tags: -15).
    expect(score).toBe(40);
    expect(checks.find((c) => c.label === "Title tag")?.status).toBe("fail");
    expect(checks.find((c) => c.label === "Meta description")?.status).toBe("fail");
    expect(checks.find((c) => c.label === "H1 heading")?.status).toBe("fail");
    expect(checks.find((c) => c.label === "Image alt text")?.status).toBe("pass");
  });

  it("flags a robots.txt that blocks the whole site and one with no sitemap", () => {
    const blocked = analyzeRobotsTxt("User-agent: *\nDisallow: /");
    expect(blocked.blocksAll).toBe(true);
    expect(blocked.issues.some((i) => i.includes("blocks all crawlers"))).toBe(true);
    const plain = analyzeRobotsTxt("User-agent: *\nDisallow: /admin/\n");
    expect(plain.blocksAll).toBe(false);
    expect(plain.sitemapUrls).toEqual([]);
    expect(plain.issues.some((i) => i.includes("No Sitemap line"))).toBe(true);
    const good = analyzeRobotsTxt("User-agent: *\nDisallow: /admin/\n\nSitemap: https://example.com/sitemap.xml");
    expect(good.sitemapUrls).toEqual(["https://example.com/sitemap.xml"]);
    expect(good.issues).toEqual([]);
    const broken = analyzeRobotsTxt("User-agent *\nBogus-directive: x");
    expect(broken.issues.length).toBeGreaterThan(0);
  });

  it("validates sitemaps and flags mismatched entries", () => {
    const good = analyzeSitemap(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<url><loc>https://example.com/</loc></url>\n<url><loc>https://example.com/about</loc></url>\n</urlset>`,
    );
    expect(good.urlCount).toBe(2);
    expect(good.locCount).toBe(2);
    expect(good.issues).toEqual([]);
    expect(good.sampleUrls).toEqual(["https://example.com/", "https://example.com/about"]);
    const bad = analyzeSitemap("<urlset><url><loc>https://example.com/</loc></url><url></url></urlset>");
    expect(bad.urlCount).toBe(2);
    expect(bad.locCount).toBe(1);
    expect(bad.issues.some((i) => i.includes("exactly one <loc>"))).toBe(true);
    const notXml = analyzeSitemap("<html><body>Not a sitemap</body></html>");
    expect(notXml.issues.length).toBeGreaterThan(0);
  });

  it("measures keyword density: 6 of 300 words is 2%", () => {
    const text = `${"calculator ".repeat(6)}${"word ".repeat(294)}`;
    const result = keywordDensity(text, "calculator");
    expect(result.words).toBe(300);
    expect(result.occurrences).toBe(6);
    expect(result.density).toBeCloseTo(2, 5);
    expect(result.topWords).toContainEqual({ word: "calculator", count: 6 });
    const phrase = keywordDensity("the quick brown fox jumps over the lazy dog", "quick brown");
    expect(phrase.occurrences).toBe(1);
    expect(keywordDensity("hello world", "missing").occurrences).toBe(0);
  });
});
