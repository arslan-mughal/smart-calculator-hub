import { describe, expect, it } from "vitest";
import { bySlug } from "@/lib/registry";
import { batch26FinanceTools } from "@/lib/extra-tools/batch26-finance";
import { batch26HealthTools } from "@/lib/extra-tools/batch26-health";
import { batch26MathTools } from "@/lib/extra-tools/batch26-math";
import { batch26TextDevTools } from "@/lib/extra-tools/batch26-text-dev";
import { md5Hex } from "@/lib/md5";
import { seededRandom } from "@/lib/extra-tools/shared";

const defaults = (slug: string) =>
  Object.fromEntries(bySlug[slug]!.inputs.map((input) => [input.key, input.def]));
const compute = (slug: string, values: Record<string, string> = {}) =>
  bySlug[slug]!.compute({ ...defaults(slug), ...values });
const result = (slug: string, label: string, values: Record<string, string> = {}) =>
  compute(slug, values).find((item) => item.label === label)?.value;

const allBatch26 = [
  ...batch26FinanceTools,
  ...batch26HealthTools,
  ...batch26MathTools,
  ...batch26TextDevTools,
];

describe("batch 26 — 25 new tools", () => {
  it("adds 25 complete tools with instructions, details, FAQs and unique copy", () => {
    expect(allBatch26).toHaveLength(25);
    for (const tool of allBatch26) {
      expect(bySlug[tool.slug], tool.slug).toBeDefined();
      expect(tool.howToUse?.length, tool.slug).toBeGreaterThanOrEqual(3);
      expect(tool.details?.length, tool.slug).toBeGreaterThanOrEqual(2);
      expect(tool.faqs.length, tool.slug).toBeGreaterThanOrEqual(3);
      expect(tool.about.length, tool.slug).toBeGreaterThan(250);
      expect(tool.example.length, tool.slug).toBeGreaterThan(50);
    }
    expect(new Set(allBatch26.map((tool) => tool.about)).size).toBe(25);
  });

  it("marks the crypto-random tools client-only so hydration never mismatches", () => {
    // Password, UUID and MAC addresses are generated with crypto randomness,
    // so the server and client renders differ — the tool page defers their
    // results until after mount (React error #418 without this).
    for (const slug of ["password-generator", "uuid-generator", "mac-address-generator"]) {
      expect(bySlug[slug]?.clientOnly, slug).toBe(true);
    }
    // No other batch-26 tool needs it: every other compute is deterministic.
    for (const tool of allBatch26) {
      if (tool.slug === "mac-address-generator") continue;
      expect(tool.clientOnly, tool.slug).toBeUndefined();
    }
  });

  it("needs 96% on the final for 88% now, 25% weight, 90% target", () => {
    expect(result("final-grade-calculator", "Grade needed on the final exam")).toBe("96%");
    expect(result("final-grade-calculator", "Highest grade possible (100% on the final)")).toBe("91%");
    expect(result("final-grade-calculator", "Grade with 0% on the final")).toBe("66%");
    // Impossible target is stated, not hidden.
    expect(result("final-grade-calculator", "Grade needed on the final exam", { target: "99" })).toContain(
      "not possible",
    );
  });

  it("converts $65,000 a year at 40 h/week to $31.25 an hour", () => {
    expect(result("salary-conversion-calculator", "Hourly rate")).toBe("$31.25");
    expect(result("salary-conversion-calculator", "Weekly pay")).toBe("$1,250");
    expect(result("salary-conversion-calculator", "Monthly pay")).toBe("$5,416.67");
    expect(result("salary-conversion-calculator", "Annual salary")).toBe("$65,000");
    // Same salary, fewer hours: a higher hourly rate.
    expect(result("salary-conversion-calculator", "Hourly rate", { hours: "35" })).toBe("$35.71");
    // Hourly input converts the other way.
    expect(
      result("salary-conversion-calculator", "Annual salary", { amount: "25", from: "hourly" }),
    ).toBe("$52,000");
  });

  it("computes RSD 74.95% for a spread-out list", () => {
    expect(result("relative-standard-deviation-calculator", "Mean")).toBe("18");
    expect(result("relative-standard-deviation-calculator", "Standard deviation (sample)")).toBe("13.49");
    expect(result("relative-standard-deviation-calculator", "Relative standard deviation (RSD)")).toBe("74.95%");
    // A tight list has a small RSD.
    expect(
      result("relative-standard-deviation-calculator", "Relative standard deviation (RSD)", {
        l: "98, 100, 101, 102, 99",
      }),
    ).toBe("1.58%");
  });

  it("counts digits in 12345 and in -12345.678", () => {
    expect(result("number-of-digits", "Digits before the decimal point")).toBe("5");
    expect(result("number-of-digits", "Total digits")).toBe("5");
    expect(result("number-of-digits", "Is an integer")).toBe("Yes");
    expect(result("number-of-digits", "Digits before the decimal point", { n: "-12345.678" })).toBe("5");
    expect(result("number-of-digits", "Digits after the decimal point", { n: "-12345.678" })).toBe("3");
    expect(result("number-of-digits", "Total digits", { n: "-12345.678" })).toBe("8");
    expect(result("number-of-digits", "Sign", { n: "-12345.678" })).toBe("Negative");
  });

  it("converts CALL-ME to 2255-63", () => {
    expect(result("word-to-phone-number-converter", "Phone number")).toBe("2255-63");
    expect(result("word-to-phone-number-converter", "Letters converted")).toBe("6");
    expect(result("word-to-phone-number-converter", "Phone number", { w: "1-800-FLOWERS" })).toBe(
      "1-800-3569377",
    );
  });

  it("converts 60 fps to a 16.67 ms frame time", () => {
    expect(result("fps-converter", "Frame time")).toBe("16.67 ms per frame");
    expect(result("fps-converter", "Frequency")).toBe("60 Hz");
    expect(result("fps-converter", "Frames per minute")).toBe("3,600");
    expect(result("fps-converter", "Frames per hour")).toBe("216,000");
    expect(result("fps-converter", "Frame time", { fps: "24" })).toBe("41.67 ms per frame");
  });

  it("converts 93 to BCD 1001 0011", () => {
    expect(result("decimal-to-bcd-converter", "BCD (4 bits per digit)")).toBe("1001 0011");
    expect(result("decimal-to-bcd-converter", "Packed BCD (hex)")).toBe("0x93");
    expect(result("decimal-to-bcd-converter", "BCD (4 bits per digit)", { n: "2026" })).toBe(
      "0010 0000 0010 0110",
    );
  });

  it("converts binary 1010 to Gray 1111 and back", () => {
    expect(result("binary-to-gray-code-converter", "Gray code")).toBe("1111");
    expect(result("binary-to-gray-code-converter", "Decimal value")).toBe("10");
    expect(result("binary-to-gray-code-converter", "Binary", { n: "1111", dir: "g2b" })).toBe("1010");
    expect(result("binary-to-gray-code-converter", "Result", { n: "102" })).toBe("Enter only 0s and 1s");
  });

  it("generates 6 locally administered unicast MAC addresses", () => {
    const value = result("mac-address-generator", "MAC addresses")!;
    const lines = value.split("\n");
    expect(lines).toHaveLength(6);
    for (const line of lines) {
      expect(line).toMatch(/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/);
      // Second hex digit of the first octet is 2, 6, A or E (locally administered).
      expect("26AE").toContain(line[1]!);
      // Multicast bit clear (first octet even).
      expect(parseInt(line.slice(0, 2), 16) % 2).toBe(0);
    }
    expect(new Set(lines).size).toBe(6);
    expect(result("mac-address-generator", "Type")).toBe("Locally administered, unicast");
    const dashed = result("mac-address-generator", "MAC addresses", { format: "dash", count: "2" })!;
    expect(dashed.split("\n")).toHaveLength(2);
    expect(dashed.split("\n")[0]).toMatch(/^([0-9A-F]{2}-){5}[0-9A-F]{2}$/);
  });

  it("picks a deterministic quote per seed from 30 attributed quotes", () => {
    // Seed 1 -> index 7 (seed is spread with a Knuth hash first): Einstein on imagination.
    expect(result("random-quote-generator", "Quote", { seed: "1" })).toBe(
      "“Imagination is more important than knowledge.”",
    );
    expect(result("random-quote-generator", "Author", { seed: "1" })).toBe("Albert Einstein");
    expect(result("random-quote-generator", "Quote", { seed: "1" })).toBe(
      result("random-quote-generator", "Quote", { seed: "1" }),
    );
    // Consecutive seeds give different quotes (the hash-spread seed works).
    expect(result("random-quote-generator", "Quote", { seed: "1" })).not.toBe(
      result("random-quote-generator", "Quote", { seed: "2" }),
    );
    // Every seed in 1..60 lands on a real quote with a real attribution.
    const seen = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) {
      const q = result("random-quote-generator", "Quote", { seed: String(seed) })!;
      const a = result("random-quote-generator", "Author", { seed: String(seed) })!;
      expect(q.length).toBeGreaterThan(10);
      expect(a.length).toBeGreaterThan(2);
      expect(q).not.toContain("undefined");
      seen.add(q);
    }
    expect(seen.size).toBe(30);
    // The seed mapping matches the shared seededRandom helper on a hashed seed.
    expect(Math.floor(seededRandom(((7 * 2654435761) >>> 0) || 1)() * 30)).toBe(11);
  });

  it("computes ERA 4.50 for 3 earned runs in 6 innings", () => {
    expect(result("era-calculator", "ERA")).toBe("4.5");
    expect(result("era-calculator", "ERA", { er: "3", inn: "9" })).toBe("3");
    // 6 innings + 1 out = 6 1/3 innings.
    expect(result("era-calculator", "ERA", { er: "3", inn: "6", outs: "1" })).toBe("4.26");
  });

  it("computes OPS .863 for the documented batting line", () => {
    expect(result("ops-calculator", "On-base percentage (OBP)")).toBe("0.363");
    expect(result("ops-calculator", "Slugging percentage (SLG)")).toBe("0.5");
    expect(result("ops-calculator", "OPS (OBP + SLG)")).toBe("0.863");
    expect(result("ops-calculator", "Total bases")).toBe("50");
    expect(result("ops-calculator", "Singles")).toBe("19");
  });

  it("projects the documented 401(k) to $1,493,034.35", () => {
    expect(result("401k-calculator", "Projected balance")).toBe("$1,493,034.35");
    expect(result("401k-calculator", "Your contributions + match")).toBe("$450,000");
    expect(result("401k-calculator", "Investment growth")).toBe("$1,033,034.35");
    expect(result("401k-calculator", "2025 contribution limit (under 50)")).toBe("$23,500");
  });

  it("projects the documented Roth IRA to $699,286.78", () => {
    expect(result("roth-ira-calculator", "Projected balance")).toBe("$699,286.78");
    expect(result("roth-ira-calculator", "Total contributions")).toBe("$210,000");
    expect(result("roth-ira-calculator", "Tax-free growth")).toBe("$484,286.78");
    expect(result("roth-ira-calculator", "2025 contribution limit (under 50)")).toBe("$7,000");
  });

  it("compares renting at $2,000 with buying a $400,000 home", () => {
    expect(result("rent-vs-buy-calculator", "Monthly mortgage payment")).toBe("$2,022.62");
    expect(result("rent-vs-buy-calculator", "Mortgage minus rent (monthly)")).toBe("$22.62");
    expect(result("rent-vs-buy-calculator", "Total rent over 5 years")).toBe("$120,000");
    expect(result("rent-vs-buy-calculator", "Total mortgage payments over 5 years")).toBe("$121,357.06");
    expect(result("rent-vs-buy-calculator", "Principal paid off")).toBe("$20,444.87");
    expect(result("rent-vs-buy-calculator", "Your equity after that time")).toBe("$100,444.87");
  });

  it("affords a $419,158.58 home on $100,000 income by the 28/36 rule", () => {
    expect(result("home-affordability-calculator", "Maximum monthly housing payment")).toBe("$2,333.33");
    expect(result("home-affordability-calculator", "Maximum mortgage")).toBe("$369,158.58");
    expect(result("home-affordability-calculator", "Maximum home price")).toBe("$419,158.58");
    // Debts cap the payment when they are large.
    expect(
      result("home-affordability-calculator", "Maximum monthly housing payment", { debts: "1500" }),
    ).toBe("$1,500");
  });

  it("pays $1,375 for a 50-hour week at $25 with time-and-a-half", () => {
    expect(result("overtime-pay-calculator", "Regular pay")).toBe("$1,000");
    expect(result("overtime-pay-calculator", "Overtime pay")).toBe("$375");
    expect(result("overtime-pay-calculator", "Total weekly pay")).toBe("$1,375");
    expect(result("overtime-pay-calculator", "Effective hourly rate")).toBe("$27.5");
    expect(result("overtime-pay-calculator", "Overtime pay", { mult: "2" })).toBe("$500");
  });

  it("taxes a $50,000 gain at $4,747.5 with $30,000 of other income", () => {
    expect(result("capital-gains-tax-calculator", "Estimated federal tax")).toBe("$4,747.5");
    expect(result("capital-gains-tax-calculator", "Taxed at 0%")).toBe("$18,350");
    expect(result("capital-gains-tax-calculator", "Taxed at 15%")).toBe("$31,650");
    expect(result("capital-gains-tax-calculator", "Taxed at 20%")).toBe("$0");
    expect(result("capital-gains-tax-calculator", "Effective rate on the gain")).toBe("9.5%");
    expect(result("capital-gains-tax-calculator", "After-tax gain")).toBe("$45,252.5");
    // A gain fully under the 0% threshold is untaxed.
    expect(
      result("capital-gains-tax-calculator", "Estimated federal tax", { gain: "10000", other: "20000" }),
    ).toBe("$0");
  });

  it("estimates VO2 max 47.7 for a 30-year-old with resting HR 60", () => {
    expect(result("vo2-max-calculator", "Estimated VO2 max")).toBe("47.7 ml/kg/min");
    expect(result("vo2-max-calculator", "Estimated maximum heart rate")).toBe("187 bpm");
    expect(result("vo2-max-calculator", "Fitness rating")).toBe("Excellent");
    // A higher resting rate means a lower estimate.
    expect(result("vo2-max-calculator", "Estimated VO2 max", { rest: "80" })).toBe("35.8 ml/kg/min");
  });

  it("gives Karvonen zones 136–149 moderate and 149–168 vigorous", () => {
    expect(result("target-heart-rate-calculator", "Maximum heart rate")).toBe("187 bpm");
    expect(result("target-heart-rate-calculator", "Heart rate reserve")).toBe("127 bpm");
    expect(result("target-heart-rate-calculator", "Light zone (50–60%)")).toBe("124–136 bpm");
    expect(result("target-heart-rate-calculator", "Moderate zone (60–70%)")).toBe("136–149 bpm");
    expect(result("target-heart-rate-calculator", "Vigorous zone (70–85%)")).toBe("149–168 bpm");
    expect(result("target-heart-rate-calculator", "Peak zone (85–95%)")).toBe("168–181 bpm");
  });

  it("paces 10 km in 50 minutes at 5:00/km and 8:03/mile", () => {
    expect(result("running-pace-calculator", "Pace per kilometre")).toBe("5:00 min/km");
    expect(result("running-pace-calculator", "Pace per mile")).toBe("8:03 min/mile");
    expect(result("running-pace-calculator", "Average speed")).toBe("12 km/h");
    expect(result("running-pace-calculator", "Time for a marathon (42.195 km)")).toBe("3:30:59");
    // Time mode: 10 km at 5:00/km takes 50 minutes.
    expect(result("running-pace-calculator", "Time", { mode: "time" })).toBe("50:00");
    expect(result("running-pace-calculator", "Time in minutes", { mode: "time" })).toBe("50");
  });

  it("targets 2,364 kcal/day to lose 10 kg in 20 weeks", () => {
    expect(result("weight-loss-calculator", "Maintenance calories")).toBe("2,914 kcal/day");
    expect(result("weight-loss-calculator", "Target daily calories")).toBe("2,364 kcal/day");
    expect(result("weight-loss-calculator", "Daily calorie deficit")).toBe("550 kcal/day");
    expect(result("weight-loss-calculator", "Weight to lose")).toBe("10 kg");
    expect(result("weight-loss-calculator", "Estimated time to goal")).toBe("20 weeks");
    expect(result("weight-loss-calculator", "Safety check")).toBe("Within the usual safe range");
    // A very aggressive plan trips the safety check.
    expect(
      result("weight-loss-calculator", "Safety check", { loss: "1", kg: "60", goal: "50" }),
    ).toContain("too low");
  });

  it("converts one phrase into all eight cases", () => {
    expect(result("case-converter", "UPPERCASE")).toBe("HELLO WORLD, THIS IS A TEST");
    expect(result("case-converter", "lowercase")).toBe("hello world, this is a test");
    expect(result("case-converter", "Title Case")).toBe("Hello World, This Is a Test");
    expect(result("case-converter", "Sentence case")).toBe("Hello world, this is a test");
    expect(result("case-converter", "camelCase")).toBe("helloWorldThisIsATest");
    expect(result("case-converter", "PascalCase")).toBe("HelloWorldThisIsATest");
    expect(result("case-converter", "snake_case")).toBe("hello_world_this_is_a_test");
    expect(result("case-converter", "kebab-case")).toBe("hello-world-this-is-a-test");
  });

  it("generates 3 lorem paragraphs, 5 sentences and exactly 50 words", () => {
    const paras = result("lorem-ipsum-generator", "Lorem ipsum")!;
    expect(paras.split("\n\n")).toHaveLength(3);
    expect(paras).toContain("Lorem ipsum dolor sit amet");
    const sentences = result("lorem-ipsum-generator", "Lorem ipsum", { type: "sentences", count: "5" })!;
    expect(sentences.split(/(?<=\.)\s+/)).toHaveLength(5);
    const words = result("lorem-ipsum-generator", "Lorem ipsum", { type: "words", count: "50" })!;
    expect(words.split(/\s+/).filter(Boolean)).toHaveLength(50);
    expect(result("lorem-ipsum-generator", "Words", { type: "words", count: "50" })).toBe("50");
  });
});

describe("md5Hex (RFC 1321 vectors)", () => {
  it("matches the RFC test suite", () => {
    expect(md5Hex("")).toBe("d41d8cd98f00b204e9800998ecf8427e");
    expect(md5Hex("a")).toBe("0cc175b9c0f1b6a831c399e269772661");
    expect(md5Hex("abc")).toBe("900150983cd24fb0d6963f7d28e17f72");
    expect(md5Hex("message digest")).toBe("f96b697d7cb7938d525a2f31aaf161d0");
    expect(md5Hex("abcdefghijklmnopqrstuvwxyz")).toBe("c3fcd3d76192e4007dfb496cca67e13b");
    expect(md5Hex("The quick brown fox jumps over the lazy dog")).toBe(
      "9e107d9d372bb6826bd81d3542a419d6",
    );
    expect(md5Hex("The quick brown fox jumps over the lazy dog.")).toBe(
      "e4d909c290d0fb1ca068ffaddf22cbd0",
    );
    // 56-byte input: exercises the multi-block path.
    expect(md5Hex("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq")).toBe(
      "8215ef0796a20bcaaae116d3876c664a",
    );
  });

  it("hashes through the tool the same way", () => {
    expect(result("md5-hash-generator", "MD5 hash")).toBe("900150983cd24fb0d6963f7d28e17f72");
    expect(result("md5-hash-generator", "MD5 hash", { text: "" })).toBe(
      "d41d8cd98f00b204e9800998ecf8427e",
    );
  });
});
