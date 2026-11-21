import { describe, expect, it } from "vitest";
import { bySlug } from "@/lib/registry";
import { batch25FinanceTools } from "@/lib/extra-tools/batch25-finance";
import { batch25ConversionTools } from "@/lib/extra-tools/batch25-conversion";
import { batch25MathTools } from "@/lib/extra-tools/batch25-math";
import { batch25TextDevTools } from "@/lib/extra-tools/batch25-text-dev";
import { sha256Base64, sha256Hex } from "@/lib/sha256";

const defaults = (slug: string) =>
  Object.fromEntries(bySlug[slug]!.inputs.map((input) => [input.key, input.def]));
const compute = (slug: string, values: Record<string, string> = {}) =>
  bySlug[slug]!.compute({ ...defaults(slug), ...values });
const result = (slug: string, label: string, values: Record<string, string> = {}) =>
  compute(slug, values).find((item) => item.label === label)?.value;

const allBatch25 = [
  ...batch25FinanceTools,
  ...batch25ConversionTools,
  ...batch25MathTools,
  ...batch25TextDevTools,
];

describe("batch 25 — 25 new tools", () => {
  it("adds 25 complete tools with instructions, details, FAQs and unique copy", () => {
    expect(allBatch25).toHaveLength(25);
    for (const tool of allBatch25) {
      expect(bySlug[tool.slug], tool.slug).toBeDefined();
      expect(tool.howToUse?.length, tool.slug).toBeGreaterThanOrEqual(3);
      expect(tool.details?.length, tool.slug).toBeGreaterThanOrEqual(2);
      expect(tool.faqs.length, tool.slug).toBeGreaterThanOrEqual(3);
      expect(tool.about.length, tool.slug).toBeGreaterThan(250);
      expect(tool.example.length, tool.slug).toBeGreaterThan(50);
    }
    expect(new Set(allBatch25.map((tool) => tool.about)).size).toBe(25);
  });

  it("estimates the documented biweekly California paycheck", () => {
    expect(result("paycheck-calculator", "Net pay per period")).toBe("1,755.13");
    expect(result("paycheck-calculator", "Federal income tax (estimate)")).toBe("221.12");
    expect(result("paycheck-calculator", "Social Security (6.2%)")).toBe("155");
    expect(result("paycheck-calculator", "Medicare (1.45%)")).toBe("36.25");
    expect(result("paycheck-calculator", "State tax (estimate)")).toBe("332.5");
    expect(result("paycheck-calculator", "Annual net pay")).toBe("45,633.5");
    expect(result("paycheck-calculator", "Annual gross pay")).toBe("65,000");
    // Texas has no state income tax.
    expect(result("paycheck-calculator", "State tax (estimate)", { state: "TX" })).toBe("0");
    expect(result("paycheck-calculator", "Net pay per period", { state: "TX" })).toBe("2,087.63");
  });

  it("estimates federal tax on $85,000 single as $10,149 (22% marginal)", () => {
    expect(result("income-tax-calculator", "Estimated federal tax")).toBe("10,149");
    expect(result("income-tax-calculator", "Effective tax rate")).toBe("11.94%");
    expect(result("income-tax-calculator", "Marginal tax bracket")).toBe("22%");
    expect(result("income-tax-calculator", "Taxable income")).toBe("69,250");
    expect(result("income-tax-calculator", "After-tax income")).toBe("74,851");
    // Below the standard deduction there is no tax.
    expect(result("income-tax-calculator", "Estimated federal tax", { income: "10000" })).toBe("0");
  });

  it("owes $949 when $9,200 was withheld against a $10,149 liability", () => {
    expect(result("tax-refund-calculator", "Estimated amount you owe")).toBe("949");
    expect(result("tax-refund-calculator", "Estimated tax liability")).toBe("10,149");
    expect(result("tax-refund-calculator", "Total withheld")).toBe("9,200");
    expect(
      result("tax-refund-calculator", "Estimated refund", { withheld: "12000" }),
    ).toBe("1,851");
  });

  it("grows $10,000 + $300/month at 7% for 20 years to $196,665.39", () => {
    expect(result("investment-calculator", "Future value")).toBe("196,665.39");
    expect(result("investment-calculator", "Total contributions")).toBe("82,000");
    expect(result("investment-calculator", "Investment growth")).toBe("114,665.39");
  });

  it("converts $65,000 a year to $31.25 an hour and back", () => {
    expect(result("salary-to-hourly-calculator", "Hourly rate")).toBe("31.25");
    expect(result("salary-to-hourly-calculator", "Weekly pay")).toBe("1,250");
    expect(result("salary-to-hourly-calculator", "Monthly pay")).toBe("5,416.67");
    expect(result("salary-to-hourly-calculator", "Annual salary")).toBe("65,000");
    expect(
      result("salary-to-hourly-calculator", "Annual salary", { mode: "h2s", a: "31.25" }),
    ).toBe("65,000");
  });

  it("compounds $10,000 at 8% for 10 years to $21,589.25", () => {
    expect(result("compound-growth-calculator", "Future value")).toBe("21,589.25");
    expect(result("compound-growth-calculator", "Growth")).toBe("11,589.25");
    expect(result("compound-growth-calculator", "Times your money")).toBe("2.16×");
  });

  it("converts 1 metre to feet, inches, kilometres and miles", () => {
    expect(result("length-converter", "Feet (ft)")).toBe("3.2808399 ft");
    expect(result("length-converter", "Inches (in)")).toBe("39.37007874 in");
    expect(result("length-converter", "Kilometres (km)")).toBe("0.001 km");
    expect(result("length-converter", "Miles (mi)")).toBe("0.00062137 mi");
    expect(result("length-converter", "Centimetres (cm)", { x: "2.54", u: "cm" })).toBe("2.54 cm");
    expect(result("length-converter", "Inches (in)", { x: "2.54", u: "cm" })).toBe("1 in");
  });

  it("converts 180 cm to 5 ft 10.87 in and back", () => {
    expect(result("cm-to-feet-and-inches-converter", "Feet and inches")).toBe("5 ft 10.87 in");
    expect(result("cm-to-feet-and-inches-converter", "Total inches")).toBe("70.87 in");
    expect(result("cm-to-feet-and-inches-converter", "Total feet (decimal)")).toBe("5.9055 ft");
    expect(result("feet-and-inches-to-cm-converter", "Centimetres")).toBe("177.8 cm");
    expect(result("feet-and-inches-to-cm-converter", "Millimetres")).toBe("1,778 mm");
  });

  it("takes 17 modulo 5 as remainder 2 and 100 divided by 7 as 14 remainder 2", () => {
    expect(result("modulo-calculator", "Remainder (a % b)")).toBe("2");
    expect(result("modulo-calculator", "Modulo (floored)")).toBe("2");
    expect(result("modulo-calculator", "Quotient")).toBe("3");
    expect(result("modulo-calculator", "Check")).toBe("17 = 3 × 5 + 2");
    expect(result("quotient-and-remainder-calculator", "Quotient")).toBe("14");
    expect(result("quotient-and-remainder-calculator", "Remainder")).toBe("2");
    expect(result("quotient-and-remainder-calculator", "Equation")).toBe("100 = 14 × 7 + 2");
    expect(result("quotient-and-remainder-calculator", "Decimal result")).toBe("14.285714");
  });

  it("sums and sorts the documented lists", () => {
    expect(result("sum-calculator", "Sum")).toBe("108");
    expect(result("sum-calculator", "Count")).toBe("6");
    expect(result("sum-calculator", "Average")).toBe("18");
    expect(result("sum-calculator", "Minimum")).toBe("4");
    expect(result("sum-calculator", "Maximum")).toBe("42");
    expect(result("sort-numbers", "Sorted (ascending)")).toBe("3, 7, 19, 25, 42");
    expect(result("sort-numbers", "Sorted (descending)")).toBe("42, 25, 19, 7, 3");
  });

  it("takes log10 of 1000 as 3 and converts 83 to octal 123", () => {
    expect(result("log-base-10-calculator", "log₁₀(x) — common log")).toBe("3");
    expect(result("log-base-10-calculator", "ln(x) — natural log")).toBe("6.90775528");
    expect(result("log-base-10-calculator", "log₂(x) — binary log")).toBe("9.96578428");
    expect(result("octal-calculator", "Octal")).toBe("123");
    expect(result("octal-calculator", "Hexadecimal")).toBe("0x53");
    expect(result("octal-calculator", "Binary")).toBe("1010011");
    expect(result("octal-calculator", "Decimal", { mode: "o2d", x: "123" })).toBe("83");
  });

  it("computes 12 AND 10 as 8 (binary 1000)", () => {
    expect(result("bitwise-calculator", "Result (AND)")).toBe("8");
    expect(result("bitwise-calculator", "Binary")).toBe("1000");
    expect(result("bitwise-calculator", "Hexadecimal")).toBe("0x8");
    expect(result("bitwise-calculator", "Result (OR)", { op: "|" })).toBe("14");
    expect(result("bitwise-calculator", "Result (XOR)", { op: "^" })).toBe("6");
  });

  it("formats the documented sentence in Title Case", () => {
    expect(result("text-formatter", "Formatted text")).toBe(
      "The Quick Brown Fox Jumps Over the Lazy Dog. It Was a Bright Cold Day in April.",
    );
    expect(result("text-formatter", "Words")).toBe("17");
    expect(result("text-formatter", "Characters")).toBe("79");
    expect(
      result("text-formatter", "Formatted text", { mode: "upper" }),
    ).toBe("THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG. IT WAS A BRIGHT COLD DAY IN APRIL.");
  });

  it("strips accents from the documented example", () => {
    expect(result("remove-accents", "Without accents")).toBe(
      "Cafe resume naive facade — Sao Paulo, Zurich, Lodz.",
    );
    expect(result("remove-accents", "Characters changed")).toBe("10");
    expect(result("remove-accents", "Original length")).toBe("51");
  });

  it("adds a bullet prefix to each line and extracts three phone numbers", () => {
    expect(result("add-prefix-suffix", "With prefix / suffix")).toBe(
      "• apple\n• banana\n• cherry",
    );
    expect(result("add-prefix-suffix", "Lines processed")).toBe("3");
    expect(result("phone-number-extractor", "Phone numbers found")).toBe(
      "(415) 555-0132\n+1 650-555-0147\n415.555.0199",
    );
    expect(result("phone-number-extractor", "Count")).toBe("3");
    expect(
      result("phone-number-extractor", "Phone numbers found", { text: "No numbers here" }),
    ).toBe("No phone numbers found");
  });

  it("compresses the documented HTML by about 30%", () => {
    expect(result("html-compressor", "Compressed HTML")).toBe(
      "<!DOCTYPE html><html><head><title>Hello World</title></head><body><h1>Hello World</h1><p>Welcome to my page.</p></body></html>",
    );
    expect(result("html-compressor", "Original size")).toBe("179 bytes");
    expect(result("html-compressor", "Compressed size")).toBe("126 bytes");
    expect(result("html-compressor", "Saved")).toBe("29.6%");
  });

  it("converts YAML to JSON and reports parse errors instead of guessing", () => {
    const json = result("yaml-to-json", "JSON output")!;
    expect(json).toContain('"name": "CalcHub"');
    expect(json).toContain('"version": 2');
    expect(json).toContain('"analytics": true');
    expect(result("yaml-to-json", "Status")).toBe("Valid YAML");
    expect(result("yaml-to-json", "Error", { text: "a: [unclosed" })).toBeDefined();
    expect(result("yaml-to-json", "JSON output", { text: "a: [unclosed" })).toBeUndefined();
  });

  it("hashes 'Hello, world!' with SHA-256 (Web Crypto)", async () => {
    expect(await sha256Hex("Hello, world!")).toBe(
      "315f5bdb76d078c43b8ac0064e4a0164612b1fce77c869345bfc94c75894edd3",
    );
    expect(await sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
    const b64 = await sha256Base64("Hello, world!");
    expect(b64).toHaveLength(44);
    expect(b64.endsWith("=")).toBe(true);
  });
});
