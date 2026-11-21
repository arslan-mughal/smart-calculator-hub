import { describe, expect, it } from "vitest";
import { calcs, bySlug } from "@/lib/registry";
import { getToolSeo, PRIORITY_TOOL_SLUGS } from "@/lib/tool-seo";
import { buildToolGuidePost } from "@/lib/tool-seo";

describe("getToolSeo", () => {
  it("gives every tool a non-empty description, >=3 FAQs and related tools (never itself)", () => {
    expect(calcs.length).toBe(320);
    for (const tool of calcs) {
      const seo = getToolSeo(tool);
      expect(seo.longDescription.length, tool.slug).toBeGreaterThan(10);
      expect(seo.faqs.length, tool.slug).toBeGreaterThanOrEqual(3);
      expect(seo.faqs.length, tool.slug).toBeLessThanOrEqual(5);
      expect(seo.relatedSlugs.length, tool.slug).toBeGreaterThan(0);
      expect(seo.relatedSlugs.length, tool.slug).toBeLessThanOrEqual(6);
      expect(seo.relatedSlugs, tool.slug).not.toContain(tool.slug);
      for (const slug of seo.relatedSlugs) expect(bySlug[slug]).toBeDefined();
      expect(seo.howTo.length, tool.slug).toBeGreaterThan(0);
      // No invented formula: the formula is the tool's own, or empty.
      expect(seo.formula === tool.formula || seo.formula === "", tool.slug).toBe(true);
    }
  });

  it("gives priority tools the full 5 FAQs", () => {
    for (const slug of PRIORITY_TOOL_SLUGS) {
      const tool = bySlug[slug];
      if (!tool) continue;
      expect(getToolSeo(tool).faqs.length, slug).toBe(5);
    }
  });

  it("derives how-to steps from inputs when the tool has none", () => {
    const tool = bySlug["mortgage-calculator"]!;
    const seo = getToolSeo(tool);
    expect(seo.howTo.join(" ")).toContain("loan amount");
    expect(seo.howTo.join(" ")).toContain("interest rate");
  });
});

describe("buildToolGuidePost", () => {
  it("builds a unique, substantive guide per tool with valid internal links", () => {
    const posts = calcs.map((t) => buildToolGuidePost(t));
    expect(posts).toHaveLength(320);
    const slugs = new Set(posts.map((p) => p.slug));
    expect(slugs.size).toBe(320);
    for (const post of posts) {
      expect(post.slug.endsWith("-guide")).toBe(true);
      expect(post.excerpt.length).toBeLessThanOrEqual(160);
      // Substantive guides: 700–900 words (a little slack for tools with
      // detail sections or very short registry copy). The 1300 ceiling is
      // a guard against runaway padding, not the target — only the three
      // tools with multiple substantial detail sections run above 1050.
      const words = post.content.split(/\s+/).filter(Boolean).length;
      expect(words, post.slug).toBeGreaterThanOrEqual(650);
      expect(words, post.slug).toBeLessThanOrEqual(1300);
      expect(post.content).toContain(`](/`);
      // Inline links in the BODY (before "## Try it now"), not just the list:
      // the tool itself, >=3 related tools, >=2 other guide posts.
      const [body] = post.content.split("## Try it now");
      const toolSlug = post.slug.replace(/-guide$/, "");
      expect(body, post.slug).toContain(`](/${toolSlug})`);
      const toolLinks = new Set([...body!.matchAll(/\]\(\/([a-z0-9-]+)\)/g)].map((m) => m[1]));
      expect(toolLinks.size, post.slug).toBeGreaterThanOrEqual(4); // own + >=3 related
      const guideLinks = [...body!.matchAll(/\]\(\/blog\/([a-z0-9-]+)-guide\)/g)];
      expect(guideLinks.length, post.slug).toBeGreaterThanOrEqual(2);
      // No invented formula: the formula is the tool's own, or empty.
      const tool = bySlug[toolSlug]!;
      expect(post.content.includes(tool.formula) || tool.formula === "", post.slug).toBe(true);
    }
    // No near-duplicates: first 200 chars must differ.
    const heads = new Set(posts.map((p) => p.content.slice(0, 200)));
    expect(heads.size).toBe(320);
  });
});
