import { describe, expect, it } from "vitest";
import { bySlug } from "@/lib/registry";
import { batch27StatsTools } from "@/lib/extra-tools/batch27-stats";
import { batch27FinanceTools } from "@/lib/extra-tools/batch27-finance";
import { batch27HealthTools } from "@/lib/extra-tools/batch27-health";
import { batch27TextDevTools } from "@/lib/extra-tools/batch27-text-dev";
import { batch27MiscTools } from "@/lib/extra-tools/batch27-misc";
import { moonSign, risingSign, sunSign } from "@/lib/zodiac";
import { csvToJson, jsonToCsv, parseCsv } from "@/lib/csv";
import { diffLines, diffSummary, diffText } from "@/lib/diff";
import { hashHex } from "@/lib/hash";
import { buildMetaTags } from "@/lib/meta-tags";

const defaults = (slug: string) =>
  Object.fromEntries(bySlug[slug]!.inputs.map((input) => [input.key, input.def]));
const compute = (slug: string, values: Record<string, string> = {}) =>
  bySlug[slug]!.compute({ ...defaults(slug), ...values });
const result = (slug: string, label: string, values: Record<string, string> = {}) =>
  compute(slug, values).find((item) => item.label === label)?.value;

const allBatch27 = [
  ...batch27StatsTools,
  ...batch27FinanceTools,
  ...batch27HealthTools,
  ...batch27TextDevTools,
  ...batch27MiscTools,
];

describe("batch 27 — 25 new tools", () => {
  it("adds 25 complete tools with instructions, details, FAQs and unique copy", () => {
    expect(allBatch27).toHaveLength(25);
    for (const tool of allBatch27) {
      expect(bySlug[tool.slug], tool.slug).toBeDefined();
      expect(tool.howToUse?.length, tool.slug).toBeGreaterThanOrEqual(3);
      expect(tool.details?.length, tool.slug).toBeGreaterThanOrEqual(2);
      expect(tool.faqs.length, tool.slug).toBeGreaterThanOrEqual(3);
      expect(tool.about.length, tool.slug).toBeGreaterThan(250);
      expect(tool.example.length, tool.slug).toBeGreaterThan(50);
    }
    expect(new Set(allBatch27.map((tool) => tool.about)).size).toBe(25);
  });

  it("marks the unix time converter client-only (its 'now' mode reads the clock)", () => {
    expect(bySlug["unix-time-converter"]?.clientOnly).toBe(true);
    for (const tool of allBatch27) {
      if (tool.slug === "unix-time-converter") continue;
      expect(tool.clientOnly, tool.slug).toBeUndefined();
    }
  });

  it("computes the mean, sum and range of 4, 8, 15, 16, 23, 42", () => {
    expect(result("mean-calculator", "Mean (average)")).toBe("18");
    expect(result("mean-calculator", "Sum")).toBe("108");
    expect(result("mean-calculator", "Count")).toBe("6");
    expect(result("mean-calculator", "Smallest")).toBe("4");
    expect(result("mean-calculator", "Largest")).toBe("42");
  });

  it("computes the median 15.5 of an even list and 8 of an odd one", () => {
    expect(result("median-calculator", "Median")).toBe("15.5");
    expect(result("median-calculator", "Sorted numbers")).toBe("4, 8, 15, 16, 23, 42");
    expect(result("median-calculator", "Median", { l: "3, 8, 15" })).toBe("8");
  });

  it("finds the mode 7, a tie, and no mode for all-unique values", () => {
    expect(result("mode-calculator", "Mode")).toBe("7");
    expect(result("mode-calculator", "Times it appears")).toBe("3");
    expect(result("mode-calculator", "Mode", { l: "1, 1, 2, 2, 3" })).toBe("1, 2 (tied)");
    expect(result("mode-calculator", "Mode", { l: "1, 2, 3" })).toBe("No mode — every value appears once");
  });

  it("computes Pearson r 0.77 for the example pairs", () => {
    expect(result("correlation-coefficient-calculator", "Correlation (r)")).toBe("0.77");
    expect(result("correlation-coefficient-calculator", "Strength")).toBe(
      "Strong positive — as X rises, Y tends to rise",
    );
    expect(result("correlation-coefficient-calculator", "r² (variance explained)")).toBe("0.6");
    expect(
      result("correlation-coefficient-calculator", "Correlation (r)", { x: "1, 2", y: "1" }),
    ).toContain("must match");
  });

  it("computes the 3-4-5 hypotenuse and its angle", () => {
    expect(result("hypotenuse-calculator", "Hypotenuse (c)")).toBe("5");
    expect(result("hypotenuse-calculator", "Perimeter")).toBe("12");
    expect(result("hypotenuse-calculator", "Area")).toBe("6");
    expect(result("hypotenuse-calculator", "Angle at A")).toBe("36.9°");
  });

  it("measures 5 between (1, 2) and (4, 6), midpoint (2.5, 4)", () => {
    expect(result("distance-between-two-points-calculator", "Distance")).toBe("5");
    expect(result("distance-between-two-points-calculator", "Change in x")).toBe("3");
    expect(result("distance-between-two-points-calculator", "Change in y")).toBe("4");
    expect(result("distance-between-two-points-calculator", "Midpoint")).toBe("(2.5, 4)");
  });

  it("projects an HSA to $347,312.36 and checks the 2025 family limit", () => {
    expect(result("hsa-calculator", "Projected HSA balance")).toBe("$347,312.36");
    expect(result("hsa-calculator", "Your contributions")).toBe("$160,000");
    expect(result("hsa-calculator", "Investment growth")).toBe("$182,312.36");
    expect(result("hsa-calculator", "2025 contribution limit")).toBe("$8,550 — your contribution fits");
    expect(result("hsa-calculator", "2025 contribution limit", { contrib: "9000" })).toContain("over the limit");
    expect(result("hsa-calculator", "2025 contribution limit", { coverage: "self", contrib: "4300" })).toBe(
      "$4,300 — your contribution fits",
    );
    expect(result("hsa-calculator", "2025 contribution limit", { age: "55", contrib: "9550" })).toBe(
      "$9,550 — your contribution fits",
    );
  });

  it("computes a $1,000,000 FIRE number reached in about 16.2 years", () => {
    expect(result("fire-calculator", "Your FIRE number")).toBe("$1,000,000");
    expect(result("fire-calculator", "Years until FIRE")).toBe("16.2 years");
    expect(result("fire-calculator", "Already saved")).toBe("10% of your FIRE number");
    expect(result("fire-calculator", "Monthly income at FIRE (4% rule)")).toBe("$3,333.33 / month");
    expect(result("fire-calculator", "Years until FIRE", { saved: "1000000" })).toBe(
      "Already there — you have reached your FIRE number",
    );
  });

  it("withholds $221.12 per paycheck on $2,500 biweekly, single, 2025", () => {
    expect(result("w-4-withholding-calculator", "Federal withholding per paycheck")).toBe("$221.12");
    expect(result("w-4-withholding-calculator", "Annual federal tax (estimated)")).toBe("$5,749");
    expect(result("w-4-withholding-calculator", "Annual gross pay")).toBe("$65,000");
    expect(result("w-4-withholding-calculator", "Taxable income")).toBe("$49,250");
    expect(result("w-4-withholding-calculator", "Marginal bracket")).toBe("22%");
    // Two children under 17 cut the taxable income by $4,000.
    expect(
      result("w-4-withholding-calculator", "Annual federal tax (estimated)", { kids: "2" }),
    ).toBe("$5,191.5");
  });

  it("raises $65,000 by 5% to $68,250", () => {
    expect(result("salary-raise-calculator", "New annual salary")).toBe("$68,250");
    expect(result("salary-raise-calculator", "Increase per year")).toBe("$3,250");
    expect(result("salary-raise-calculator", "Increase per month")).toBe("$270.83");
    expect(result("salary-raise-calculator", "New monthly pay")).toBe("$5,687.5");
    expect(result("salary-raise-calculator", "New hourly rate")).toBe("$32.81");
  });

  it("taxes a $400,000 home at 1.1% — $4,400 a year", () => {
    expect(result("property-tax-calculator", "Annual property tax")).toBe("$4,400");
    expect(result("property-tax-calculator", "Monthly property tax")).toBe("$366.67");
    expect(result("property-tax-calculator", "Weekly property tax")).toBe("$84.62");
    expect(result("property-tax-calculator", "Tax per $1,000 of value")).toBe("$11");
  });

  it("suggests 11:16 PM bedtime for a 7:00 AM wake-up, 5 cycles", () => {
    expect(result("sleep-calculator", "Best choice")).toBe("11:16 PM for 5 cycles (7.5 hours of sleep)");
    expect(result("sleep-calculator", "Go to bed at")).toContain("6 cycles (9 h) — 9:46 PM");
    expect(result("sleep-calculator", "Go to bed at")).toContain("4 cycles (6 h) — 12:46 AM");
    expect(
      result("sleep-calculator", "Best choice", { mode: "sleep", time: "23:00" }),
    ).toBe("6:44 AM for 5 cycles (7.5 hours of sleep)");
  });

  it("computes keto macros: 2,711 kcal, 211 g fat, 169 g protein, 34 g carbs", () => {
    expect(result("keto-calculator", "Daily calories")).toBe("2,711 kcal");
    expect(result("keto-calculator", "Fat")).toBe("211 g / day (70% of calories)");
    expect(result("keto-calculator", "Protein")).toBe("169 g / day (25% of calories)");
    expect(result("keto-calculator", "Net carbs")).toBe("34 g / day (5% of calories)");
    expect(result("keto-calculator", "Daily calories", { goal: "lose" })).toBe("2,168 kcal");
  });

  it("plans 16:8 from noon: eat 12:00 PM – 8:00 PM", () => {
    expect(result("intermittent-fasting-calculator", "Eating window")).toBe("12:00 PM – 8:00 PM");
    expect(result("intermittent-fasting-calculator", "Fasting window")).toBe("8:00 PM – 12:00 PM");
    expect(result("intermittent-fasting-calculator", "Fasting hours")).toBe("16 hours a day");
    expect(
      result("intermittent-fasting-calculator", "Eating window", { plan: "18:6", start: "13:00" }),
    ).toBe("1:00 PM – 7:00 PM");
  });

  it("targets 2,414 kcal on a 500 kcal deficit and flags an unsafe one", () => {
    expect(result("calorie-deficit-calculator", "Daily calorie target")).toBe("2,414 kcal");
    expect(result("calorie-deficit-calculator", "Maintenance calories")).toBe("2,914 kcal / day");
    expect(result("calorie-deficit-calculator", "Expected loss")).toBe("About 0.45 kg / week");
    expect(result("calorie-deficit-calculator", "Safety check")).toBe("Within the usual safe range");
    expect(
      result("calorie-deficit-calculator", "Safety check", {
        sex: "f",
        age: "30",
        cm: "160",
        kg: "55",
        act: "1.2",
        deficit: "1000",
      }),
    ).toContain("too low to plan alone");
  });

  it("converts JSON to CSV with a header row and quoted fields", () => {
    expect(result("json-to-csv-converter", "CSV output")).toBe(
      "name,age,city\nAna,30,Lahore\nBilal,25,Karachi",
    );
    expect(result("json-to-csv-converter", "Rows")).toBe("3 (including the header row)");
    expect(result("json-to-csv-converter", "Error", { text: "{bad json" })).toContain("Invalid JSON");
    expect(jsonToCsv('[{"a": "x, y", "b": "say \\"hi\\""}]')).toBe('a,b\n"x, y","say ""hi"""');
  });

  it("converts CSV to JSON and parses quoted fields", () => {
    const out = result("csv-to-json-converter", "JSON output")!;
    expect(JSON.parse(out)).toEqual([
      { name: "Ana", age: "30", city: "Lahore" },
      { name: "Bilal", age: "25", city: "Karachi" },
    ]);
    expect(result("csv-to-json-converter", "Rows")).toBe("2 objects");
    expect(parseCsv('a,b\n"x, y","say ""hi"""\n')).toEqual([
      ["a", "b"],
      ["x, y", 'say "hi"'],
    ]);
    expect(csvToJson("name,age\nAna,30")).toContain('"name": "Ana"');
    expect(result("csv-to-json-converter", "JSON output", { text: "" })).toBe("—");
  });

  it("diffs two texts line by line", () => {
    const lines = diffLines(
      "The quick brown fox\njumps over the lazy dog\nand runs away.",
      "The quick brown fox\nleaps over the lazy dog\nand runs away.",
    );
    expect(lines).toEqual([
      { type: "same", text: "The quick brown fox" },
      { type: "del", text: "jumps over the lazy dog" },
      { type: "add", text: "leaps over the lazy dog" },
      { type: "same", text: "and runs away." },
    ]);
    expect(diffSummary(lines)).toEqual({ added: 1, removed: 1, unchanged: 2 });
    expect(diffText("a\nb", "a\nc")).toBe("  a\n- b\n+ c");
    expect(diffLines("same", "same")).toEqual([{ type: "same", text: "same" }]);
  });

  it("builds meta tags with escaping and Open Graph fallbacks", () => {
    const tags = buildMetaTags({
      title: 'Test "Page"',
      description: "A description.",
      keywords: "",
      canonical: "https://example.com/page",
      author: "",
      robots: "index, follow",
      ogTitle: "",
      ogDescription: "",
      ogImage: "https://example.com/og.png",
      ogUrl: "",
      ogType: "website",
      twitterCard: "summary_large_image",
      twitterTitle: "",
      twitterDescription: "",
      twitterImage: "",
    });
    expect(tags).toContain('<title>Test &quot;Page&quot;</title>');
    expect(tags).toContain('<meta property="og:title" content="Test &quot;Page&quot;">');
    expect(tags).toContain('<meta property="og:image" content="https://example.com/og.png">');
    expect(tags).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(tags).not.toContain("keywords");
    expect(
      buildMetaTags({
        title: "",
        description: "",
        keywords: "",
        canonical: "",
        author: "",
        robots: "",
        ogTitle: "",
        ogDescription: "",
        ogImage: "",
        ogUrl: "",
        ogType: "",
        twitterCard: "",
        twitterTitle: "",
        twitterDescription: "",
        twitterImage: "",
      }),
    ).toBe("");
  });

  it("hashes with SHA-1 and SHA-512 (RFC vectors)", async () => {
    expect(await hashHex("abc", "SHA-1")).toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
    expect(await hashHex("abc", "SHA-512")).toBe(
      "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f",
    );
    expect(await hashHex("Hello, world!", "SHA-1")).toBe("943a702d06f34599aee1f8da8ef9f7296031d699");
    expect(await hashHex("Hello, world!", "SHA-512")).toBe(
      "c1527cd893c124773d811911970c8fe6e857d6df5dc9226bd8a160614c0cd963a4ddea2b94bb7d36021ef9d865d5cea294a82dd49a0bb269f51f6e7a57f79421",
    );
  });

  it("converts 1700000000 to 2023-11-14T22:13:20Z and back", () => {
    expect(result("unix-time-converter", "UTC date")).toBe("2023-11-14T22:13:20.000Z");
    expect(result("unix-time-converter", "Readable (UTC)")).toContain("November 14, 2023");
    expect(result("unix-time-converter", "Readable (UTC)")).toContain("10:13:20 PM");
    expect(result("unix-time-converter", "Unix timestamp", { mode: "toUnix" })).toBe("1700000000");
    expect(
      result("unix-time-converter", "Unix timestamp", { mode: "toDate", ts: "1700000000000" }),
    ).toBe("1700000000");
    // "now" mode reads the live clock.
    const now = Number(result("unix-time-converter", "Current Unix timestamp", { mode: "now" }));
    expect(Math.abs(now - Math.floor(Date.now() / 1000))).toBeLessThan(5);
  });

  it("adds 5 business days from Friday 20 Nov 2026 to Friday 27 Nov 2026", () => {
    expect(result("add-business-days-to-date", "Result date")).toBe("Friday, November 27, 2026");
    expect(result("add-business-days-to-date", "Business days added")).toBe("5");
    expect(result("add-business-days-to-date", "Calendar days")).toBe("7");
    expect(result("add-business-days-to-date", "Weekend days skipped")).toBe("2");
    // A holiday on 25 Nov pushes the result to Monday 30 Nov.
    expect(
      result("add-business-days-to-date", "Result date", { holidays: "2026-11-25" }),
    ).toBe("Monday, November 30, 2026");
    expect(
      result("add-business-days-to-date", "Holidays skipped", { holidays: "2026-11-25" }),
    ).toBe("1");
  });

  it("finds sun, moon and rising signs for 15 June 1990, 08:30", () => {
    expect(result("sun-moon-rising-sign-calculator", "Sun sign")).toBe("Gemini (May 21 – Jun 20)");
    expect(result("sun-moon-rising-sign-calculator", "Moon sign")).toBe("Pisces (approximate)");
    expect(result("sun-moon-rising-sign-calculator", "Rising sign")).toBe(
      "Cancer (approximate — from birth time)",
    );
    expect(result("sun-moon-rising-sign-calculator", "Moon phase on that day")).toBe("Last Quarter");
    // Sign boundaries and the anchor new moon.
    expect(sunSign(3, 21)).toBe("Aries");
    expect(sunSign(12, 25)).toBe("Capricorn");
    expect(sunSign(1, 19)).toBe("Capricorn");
    expect(sunSign(1, 20)).toBe("Aquarius");
    expect(moonSign(new Date(Date.UTC(2000, 0, 6, 18, 14, 0)))).toBe("Capricorn");
    expect(risingSign("Gemini", 6, 0)).toBe("Gemini");
    expect(risingSign("Gemini", 8, 30)).toBe("Cancer");
    expect(risingSign("Gemini", 4, 0)).toBe("Taurus");
  });
});
