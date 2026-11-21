import { describe, expect, it } from "vitest";
import { bySlug } from "@/lib/registry";
import { batch29DevTools } from "@/lib/extra-tools/batch29-dev";
import { batch29SeoTools } from "@/lib/extra-tools/batch29-seo";
import { batch29PetTools } from "@/lib/extra-tools/batch29-pets";
import { batch29PlusTools } from "@/lib/extra-tools/batch29-plus";
import {
  ASCII_TABLE,
  beautifyCss,
  beautifyHtml,
  beautifyJs,
  formatYaml,
  htmlToMarkdown,
  jsonToYaml,
  minifyJs,
} from "@/lib/formatters";
import {
  chocolateToxicity,
  dogDueDate,
  dogLifeExpectancy,
  petInsuranceEstimate,
  predictPuppyAdultWeight,
  rawFeedingDailyGrams,
} from "@/lib/pets";
import { analyzeHeadline } from "@/lib/headline";
import { buildHreflangTags, buildRobotsTxt, buildSchemaJsonLd, buildSitemapXml } from "@/lib/seo-generators";
import { domainAge, formatAge, parseRdap } from "@/lib/rdap";
import { isValidDomain, parseDohResponse } from "@/lib/dns";
import { checkAuditUrl } from "@/lib/seo-audit";
import { fetchGuardedText, lookupDns, lookupRdap } from "@/lib/seo-audit.server";

const allBatch29 = [...batch29DevTools, ...batch29SeoTools, ...batch29PetTools, ...batch29PlusTools];

const compute = (slug: string, values: Record<string, string> = {}) => {
  const tool = bySlug[slug]!;
  const defaults = Object.fromEntries(
    tool.inputs.map((input) => [input.key, input.def === "today" ? "2026-11-12" : input.def]),
  );
  return tool.compute({ ...defaults, ...values });
};

describe("batch 29 — 25 tools (9 dev, 8 SEO, 6 pets, 2 plus)", () => {
  it("adds 25 complete tools, no duplicates, correct categories", () => {
    expect(allBatch29).toHaveLength(25);
    for (const tool of allBatch29) {
      expect(bySlug[tool.slug], tool.slug).toBeDefined();
      expect(tool.howToUse?.length, tool.slug).toBeGreaterThanOrEqual(3);
      expect(tool.details?.length, tool.slug).toBeGreaterThanOrEqual(2);
      expect(tool.faqs.length, tool.slug).toBeGreaterThanOrEqual(3);
      expect(tool.about.length, tool.slug).toBeGreaterThan(250);
      expect(tool.example.length, tool.slug).toBeGreaterThan(50);
    }
    expect(new Set(allBatch29.map((t) => t.about)).size).toBe(25);
    expect(new Set(allBatch29.map((t) => t.slug)).size).toBe(25);
    for (const tool of batch29DevTools) {
      expect(["Text Tools", "Web & Developer"], tool.slug).toContain(tool.category);
      expect(tool.custom, tool.slug).toBeDefined();
    }
    for (const tool of batch29SeoTools) expect(tool.category, tool.slug).toBe("SEO Audit");
    for (const tool of batch29PetTools) expect(tool.category, tool.slug).toBe("Random Tools");
    expect(bySlug["headline-analyzer"]!.custom).toBeUndefined();
    expect(bySlug["api-tester"]!.category).toBe("Web & Developer");
    expect(bySlug["dns-lookup"]!.category).toBe("Web & Developer");
  });

  it("does not duplicate the existing Random Name Picker (wheel was already there)", () => {
    expect(bySlug["random-name-picker"]).toBeDefined();
    expect(bySlug["random-name-picker"]!.name).toBe("Random Name Picker");
    expect(bySlug["json-to-yaml-converter"]).toBeDefined();
  });

  it("computes the pet tools", () => {
    // 4-month-old medium puppy at 6 kg is ~35% grown: 6 / 0.35 ≈ 17.1 kg.
    expect(compute("puppy-weight-predictor", { kg: "6", age: "4", size: "medium" })[0]?.value).toContain("17.1");
    expect(compute("dog-life-expectancy-calculator", { size: "small", age: "3" })[0]?.value).toContain("13.5");
    expect(compute("dog-pregnancy-calculator", { date: "2026-11-01" })[0]?.value).toContain("January 3, 2027");
    // 15 kg dog, 100 g milk chocolate: 230 mg / 15 kg = 15.3 mg/kg — mild.
    expect(compute("chocolate-toxicity-calculator", { kg: "15", type: "milk", grams: "100" })[0]?.value).toContain("15.33");
    expect(compute("chocolate-toxicity-calculator", { kg: "15", type: "cocoa", grams: "100" })[2]?.value).toContain("Severe");
    // 20 kg moderately active adult: 2.5% = 500 g/day.
    expect(compute("raw-feeding-calculator", { kg: "20", stage: "adult", activity: "moderate" })[0]?.value).toContain("500");
    // 3-year-old medium dog, standard cover, average area: $55/mo (fmt trims ".00").
    expect(compute("pet-insurance-calculator", { species: "dog", size: "medium", age: "3", coverage: "standard", location: "average" })[0]?.value).toContain("$55 per month");
  });

  it("scores headlines", () => {
    const good = analyzeHeadline("7 Proven Ways to Save Money on Your Weekly Groceries");
    expect(good.score).toBeGreaterThan(50);
    expect(good.hasNumber).toBe(true);
    expect(good.powerCount).toBeGreaterThan(0);
    expect(analyzeHeadline("").score).toBe(0);
    expect(compute("headline-analyzer")[0]?.value).toContain("/ 100");
  });
});

describe("formatters (batch 29 dev tools)", () => {
  it("minifies JS without changing meaning", () => {
    expect(minifyJs("const a = 1; // hi\nconst b = 2;").code).toBe("const a=1;const b=2;");
    expect(minifyJs("const s = \"// not a comment\";").code).toBe('const s="// not a comment";');
    expect(minifyJs("const r = /ab+c/gi;\nconst q = a / b;").code).toBe("const r=/ab+c/gi;const q=a/b;");
    expect(minifyJs("const s = `hi ${name}!`;").code).toBe("const s=`hi ${name}!`;");
    // ASI hazards: return + newline, and a line starting with (.
    expect(minifyJs("function f() {\n  return\n  42;\n}").code).toBe("function f(){return;42;}");
    expect(minifyJs("let a = b\n(c).call();").code).toBe("let a=b;(c).call();");
    // Minus-minus must not merge into a decrement.
    expect(minifyJs("let x = a - -b;").code).toBe("let x=a- -b;");
    const sample = "function greet(name) {\n  // Say hello\n  const message = `Hello, ${name}!`;\n  return message;\n}\nconsole.log(greet('world'));";
    const min = minifyJs(sample);
    expect(min.savedPercent).toBeGreaterThan(15);
    expect(min.code).toContain("console.log(greet('world'));");
  });

  it("beautifies JS", () => {
    expect(beautifyJs("function f(){return 1;}")).toBe("function f() {\n  return 1;\n}");
    expect(beautifyJs("if(x){y();}else{z();}")).toContain("} else {");
    expect(beautifyJs("const o={a:1,b:2};")).toContain("a: 1");
  });

  it("beautifies CSS and HTML", () => {
    expect(beautifyCss(".card{padding:16px;color:red}@media (max-width:600px){.card{padding:12px}}")).toBe(
      ".card {\n  padding: 16px;\n  color: red;\n}\n@media (max-width:600px) {\n  .card {\n    padding: 12px;\n  }\n}",
    );
    const html = beautifyHtml('<div><h2>Hello</h2><p>Text <strong>bold</strong> here.</p></div>');
    expect(html).toContain("  <h2>Hello</h2>");
    expect(html).toContain("  <p>Text <strong>bold</strong> here.</p>");
  });

  it("converts HTML to Markdown", () => {
    expect(htmlToMarkdown("<h1>Hello</h1><p>A <a href=\"https://example.com\">link</a>.</p>")).toBe(
      "# Hello\n\nA [link](https://example.com).",
    );
    expect(htmlToMarkdown("<ul><li>One</li><li>Two</li></ul>")).toContain("- One");
    expect(htmlToMarkdown("<script>alert(1)</script><p>Safe</p>")).toBe("Safe");
  });

  it("formats and validates YAML, and converts JSON to YAML", () => {
    const formatted = formatYaml("site: {name: My Site}\nfeatures: [blog, tools]");
    expect(formatted.ok).toBe(true);
    if (formatted.ok) {
      expect(formatted.output).toContain("site:");
      expect(formatted.output).toContain("name: My Site");
    }
    const bad = formatYaml("a:\n\tb: 1");
    expect(bad.ok).toBe(false);
    const converted = jsonToYaml('{"site": {"name": "My Site"}}');
    expect(converted.ok).toBe(true);
    if (converted.ok) expect(converted.output).toContain("name: My Site");
    expect(jsonToYaml("{not json").ok).toBe(false);
  });

  it("lists all 128 ASCII characters", () => {
    expect(ASCII_TABLE).toHaveLength(128);
    expect(ASCII_TABLE[65]).toEqual({ dec: 65, hex: "41", char: "A", name: "A" });
    expect(ASCII_TABLE[10]?.name).toBe("LF");
    expect(ASCII_TABLE[32]?.name).toBe("Space");
  });
});

describe("pet models", () => {
  it("predicts puppy adult weight from growth curves", () => {
    const r = predictPuppyAdultWeight(6, 4, "medium");
    expect(r.adultKg).toBeCloseTo(17.14, 1);
    expect(r.maturityMonths).toBe(14);
    expect(r.lowKg).toBeLessThan(r.adultKg);
    expect(r.highKg).toBeGreaterThan(r.adultKg);
  });

  it("computes life expectancy and due dates", () => {
    expect(dogLifeExpectancy("small", 3).median).toBe(13.5);
    expect(dogLifeExpectancy("giant", 3).median).toBe(8);
    const due = dogDueDate("2026-11-01");
    expect(due.due?.toISOString().slice(0, 10)).toBe("2027-01-03");
    expect(due.earliest?.toISOString().slice(0, 10)).toBe("2027-01-01");
    expect(due.latest?.toISOString().slice(0, 10)).toBe("2027-01-05");
    expect(dogDueDate("not-a-date").due).toBeNull();
  });

  it("scores chocolate toxicity from published theobromine figures", () => {
    expect(chocolateToxicity(15, "milk", 100).doseMgPerKg).toBeCloseTo(15.33, 1);
    expect(chocolateToxicity(15, "milk", 100).level).toBe("mild");
    expect(chocolateToxicity(15, "cocoa", 100).level).toBe("severe");
    expect(chocolateToxicity(30, "dark", 50).level).toBe("mild");
    expect(chocolateToxicity(10, "bakers", 50).level).toBe("severe");
  });

  it("computes raw feeding and insurance estimates", () => {
    expect(rawFeedingDailyGrams(20, "adult", "moderate").gramsPerDay).toBe(500);
    expect(rawFeedingDailyGrams(20, "adult", "low").gramsPerDay).toBe(400);
    expect(rawFeedingDailyGrams(5, "puppy", "moderate").gramsPerDay).toBe(300);
    const ins = petInsuranceEstimate("dog", "medium", 3, "standard", "average");
    expect(ins.monthly).toBe(55);
    expect(petInsuranceEstimate("cat", "small", 3, "standard", "average").monthly).toBe(30);
    expect(petInsuranceEstimate("dog", "medium", 12, "standard", "average").monthly).toBeGreaterThan(55);
  });
});

describe("SEO generators", () => {
  it("builds robots.txt", () => {
    const txt = buildRobotsTxt(
      [{ agent: "*", allow: ["/public/"], disallow: ["/admin/", "/search/"] }],
      "https://example.com/sitemap.xml",
    );
    expect(txt).toContain("User-agent: *");
    expect(txt).toContain("Disallow: /admin/");
    expect(txt).toContain("Allow: /public/");
    expect(txt).toContain("Sitemap: https://example.com/sitemap.xml");
  });

  it("builds and validates sitemaps", () => {
    const ok = buildSitemapXml([{ loc: "https://example.com/", changefreq: "weekly", priority: "1.0" }]);
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.xml).toContain("<loc>https://example.com/</loc>");
      expect(ok.xml).toContain("<changefreq>weekly</changefreq>");
    }
    expect(buildSitemapXml([{ loc: "not a url" }]).ok).toBe(false);
    expect(buildSitemapXml([]).ok).toBe(false);
  });

  it("builds JSON-LD schema and hreflang tags", () => {
    const article = buildSchemaJsonLd("Article", { headline: "Hello", author: "Jane" });
    expect(article.ok).toBe(true);
    if (article.ok) {
      expect(article.json).toContain('"@type": "Article"');
      expect(article.json).toContain("Hello");
    }
    expect(buildSchemaJsonLd("Article", {}).ok).toBe(false);
    const faq = buildSchemaJsonLd("FAQPage", { q1: "What?", a1: "This." });
    expect(faq.ok).toBe(true);
    const tags = buildHreflangTags([
      { url: "https://example.com/", lang: "en" },
      { url: "https://example.com/de/", lang: "de" },
    ]);
    expect(tags.ok).toBe(true);
    if (tags.ok) {
      expect(tags.tags).toContain('hreflang="en"');
      expect(tags.tags).toContain('hreflang="de"');
    }
    expect(buildHreflangTags([{ url: "https://example.com/", lang: "xx!" }]).ok).toBe(false);
  });
});

describe("RDAP and DNS parsers", () => {
  const RDAP_SAMPLE = JSON.stringify({
    ldhName: "example.com",
    entities: [
      {
        roles: ["registrar"],
        vcardArray: ["vcard", [["fn", {}, "text", "Example Registrar, Inc."]]],
      },
    ],
    events: [
      { eventAction: "registration", eventDate: "1995-08-14T04:00:00Z" },
      { eventAction: "expiration", eventDate: "2026-08-13T04:00:00Z" },
    ],
    nameservers: [{ ldhName: "a.iana-servers.net" }, { ldhName: "b.iana-servers.net" }],
    status: ["active"],
  });

  it("parses an RDAP record and computes domain age", () => {
    const info = parseRdap(RDAP_SAMPLE);
    expect(info?.domain).toBe("example.com");
    expect(info?.registrar).toBe("Example Registrar, Inc.");
    expect(info?.registered).toBe("1995-08-14T04:00:00Z");
    expect(info?.nameservers).toEqual(["a.iana-servers.net", "b.iana-servers.net"]);
    expect(info?.status).toEqual(["active"]);
    expect(parseRdap("not json")).toBeNull();
    const age = domainAge("1995-08-14T04:00:00Z", new Date("2026-11-21T00:00:00Z"));
    expect(age?.years).toBe(31);
    expect(age?.months).toBe(3);
    expect(formatAge({ years: 31, months: 3, days: 7 })).toBe("31 years, 3 months, 7 days");
    expect(domainAge("2999-01-01T00:00:00Z")).toBeNull();
  });

  it("parses DNS-over-HTTPS responses and validates domains", () => {
    const ok = parseDohResponse(
      JSON.stringify({
        Status: 0,
        Answer: [
          { name: "example.com.", type: 1, TTL: 300, data: "93.184.216.34" },
          { name: "example.com.", type: 1, TTL: 300, data: "93.184.216.35" },
        ],
      }),
    );
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.records).toHaveLength(2);
      expect(ok.records[0]?.data).toBe("93.184.216.34");
      expect(ok.records[0]?.type).toBe("A");
    }
    expect(parseDohResponse(JSON.stringify({ Status: 3 })).ok).toBe(false);
    expect(parseDohResponse(JSON.stringify({ Status: 0, Answer: [] })).ok).toBe(false);
    expect(isValidDomain("example.com")).toBe(true);
    expect(isValidDomain("sub.example.co.uk")).toBe(true);
    expect(isValidDomain("https://example.com/page")).toBe(false);
    expect(isValidDomain("not a domain")).toBe(false);
    expect(isValidDomain("localhost")).toBe(false);
  });
});

describe("SSRF guards for the batch 29 fetch tools", () => {
  it("rejects unsafe URLs before any fetch (same guards as v2.6)", () => {
    for (const bad of [
      "http://127.0.0.1/admin",
      "http://10.0.0.5/",
      "https://192.168.1.1/",
      "http://172.16.0.5/",
      "http://localhost:3000/",
      "http://[::1]/",
      "ftp://example.com/file",
      "file:///etc/passwd",
      "not a url",
      "",
    ]) {
      expect(checkAuditUrl(bad).ok, bad).toBe(false);
    }
    expect(checkAuditUrl("https://api.github.com/zen").ok).toBe(true);
    expect(checkAuditUrl("https://rdap.org/domain/example.com").ok).toBe(true);
    expect(checkAuditUrl("https://dns.google/resolve?name=example.com&type=1").ok).toBe(true);
  });

  it("refuses private targets without fetching (guarded fetch, no network)", async () => {
    const res = await fetchGuardedText("http://127.0.0.1:3000/admin");
    expect(res.ok).toBe(false);
    const rdap = await lookupRdap("not a domain");
    expect(rdap.ok).toBe(false);
    const dns = await lookupDns("not a domain", "A");
    expect(dns.ok).toBe(false);
  });
});
