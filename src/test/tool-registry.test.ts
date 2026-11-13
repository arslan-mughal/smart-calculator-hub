import { describe, expect, it } from "vitest";
import { bySlug, calcs } from "@/lib/registry";

const defaults = (slug: string) => Object.fromEntries(bySlug[slug]!.inputs.map((input) => [input.key, input.def === "today" ? "2026-11-12" : input.def]));
const compute = (slug: string, values: Record<string, string> = {}) => bySlug[slug]!.compute({ ...defaults(slug), ...values });

describe("tool registry", () => {
  it("has unique page addresses and every standard tool returns a labelled result", () => {
    expect(new Set(calcs.map((tool) => tool.slug)).size).toBe(calcs.length);
    expect(calcs.length).toBeGreaterThanOrEqual(160);
    for (const tool of calcs) {
      if (tool.custom) continue;
      const result = tool.compute(defaults(tool.slug));
      expect(result.length, tool.slug).toBeGreaterThan(0);
      expect(result.every((item) => item.label.length > 0 && typeof item.value === "string"), tool.slug).toBe(true);
    }
  });

  it("solves x² - 5x + 6 = 0 as roots 3 and 2", () => {
    const result = compute("quadratic-formula-calculator", { a: "1", b: "-5", c: "6" });
    expect(result[0]?.value).toBe("3");
    expect(result[1]?.value).toBe("2");
  });

  it("converts one kilogram to 2.20462262 pounds", () => {
    const result = compute("weight-converter", { x: "1", u: "kg" });
    expect(result.find((item) => item.label.startsWith("Pounds"))?.value).toBe("2.20462262 lb");
  });

  it("counts three words and eleven characters without spaces", () => {
    const result = compute("word-counter", { text: "One two three" });
    expect(result.find((item) => item.label === "Words")?.value).toBe("3");
    expect(result.find((item) => item.label === "Characters (without spaces)")?.value).toBe("11");
  });

  it("encodes Hello as SGVsbG8= and decodes it back", () => {
    expect(compute("base64-encoder", { text: "Hello" })[0]?.value).toBe("SGVsbG8=");
    expect(compute("base64-decoder", { text: "SGVsbG8=" })[0]?.value).toBe("Hello");
  });

  it("finds GCD 12 and LCM 720 for 48 and 180", () => {
    expect(compute("gcd-calculator", { n: "48, 180" })[0]?.value).toBe("12");
    expect(compute("lcm-calculator", { n: "48, 180" })[0]?.value).toBe("720");
  });
});
