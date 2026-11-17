import { describe, expect, it } from "vitest";
import { bySlug } from "@/lib/registry";
import { nextBatchCalcs } from "@/lib/next-batch";

const defaults = (slug: string) =>
  Object.fromEntries(bySlug[slug]!.inputs.map((input) => [input.key, input.def]));
const compute = (slug: string, values: Record<string, string> = {}) =>
  bySlug[slug]!.compute({ ...defaults(slug), ...values });
const result = (slug: string, label: string, values: Record<string, string> = {}) =>
  compute(slug, values).find((item) => item.label === label)?.value;

describe("next MiniWebTool-inspired batch", () => {
  it("adds 26 complete tools with instructions and two detailed editorial sections each", () => {
    expect(nextBatchCalcs).toHaveLength(26);
    for (const tool of nextBatchCalcs) {
      expect(tool.howToUse?.length, tool.slug).toBeGreaterThanOrEqual(3);
      expect(tool.details?.length, tool.slug).toBe(2);
      expect(tool.faqs.length, tool.slug).toBeGreaterThanOrEqual(3);
      expect(tool.about.length, tool.slug).toBeGreaterThan(250);
      expect(tool.example.length, tool.slug).toBeGreaterThan(50);
    }
    expect(new Set(nextBatchCalcs.map((tool) => tool.about)).size).toBe(26);
  });

  it("includes upfront loan fees when estimating APR", () => {
    expect(result("apr-calculator", "Estimated APR")).toBe("9.12%");
    expect(result("apr-calculator", "Net amount received")).toBe("19,250");
  });

  it("calculates total and housing-only DTI from 2,150 debts and 6,500 income", () => {
    expect(result("debt-to-income-ratio-calculator", "Total DTI")).toBe("33.1%");
    expect(result("debt-to-income-ratio-calculator", "Housing-only ratio")).toBe("24.6%");
  });

  it("splits the default lease into 338.89 depreciation and 101.15 finance charge", () => {
    expect(result("car-lease-calculator", "Base monthly lease payment")).toBe("440.04");
    expect(result("car-lease-calculator", "Monthly depreciation")).toBe("338.89");
    expect(result("car-lease-calculator", "Monthly finance charge")).toBe("101.15");
  });

  it("uses the higher blood-pressure category and calculates MAP", () => {
    expect(result("blood-pressure-calculator", "Reading category", { sys: "135", dia: "95" })).toBe("High blood pressure — stage 2");
    expect(result("blood-pressure-calculator", "Estimated mean arterial pressure")).toBe("90 mmHg");
  });

  it("calculates mean, median and mode for the documented example", () => {
    expect(result("mean-median-mode-calculator", "Mean")).toBe("20.875");
    expect(result("mean-median-mode-calculator", "Median")).toBe("20");
    expect(result("mean-median-mode-calculator", "Mode")).toBe("15");
  });

  it("calculates geometric mean four from two and eight", () => {
    expect(result("geometric-mean-calculator", "Geometric mean", { n: "2, 8" })).toBe("4");
    expect(result("geometric-mean-calculator", "Harmonic mean", { n: "2, 8" })).toBe("3.2");
  });

  it("solves the documented simultaneous equations as x=2 and y=3", () => {
    expect(result("simultaneous-equations-calculator", "x")).toBe("2");
    expect(result("simultaneous-equations-calculator", "y")).toBe("3");
    expect(result("matrix-determinant-calculator", "Determinant")).toBe("-7");
  });

  it("applies Gregorian century exceptions to leap years", () => {
    expect(result("leap-year-calculator", "2000 leap-year status", { year: "2000" })).toBe("Leap year — 366 days");
    expect(result("leap-year-calculator", "2100 leap-year status", { year: "2100" })).toBe("Common year — 365 days");
  });

  it("converts noon in New York to 22:00 in Karachi on 14 November 2026", () => {
    expect(result("time-zone-converter", "Exact UTC instant")).toBe("2026-11-14T17:00:00Z");
    expect(result("time-zone-converter", "Converted local time")).toContain("22:00");
  });

  it("converts 30 US MPG to 7.84049 L/100km", () => {
    expect(result("fuel-economy-converter", "Litres per 100 km")).toBe("7.84049 L/100km");
    expect(result("data-transfer-rate-converter", "Megabytes per second")).toBe("12.5 MB/s");
  });

  it("calculates a /24 network with 254 usable hosts", () => {
    expect(result("ip-subnet-calculator", "Network address")).toBe("192.168.1.0/24");
    expect(result("ip-subnet-calculator", "Usable hosts")).toBe("254");
    expect(result("ip-subnet-calculator", "Usable host range")).toBe("192.168.1.1 – 192.168.1.254");
  });

  it("converts 255 to binary 11111111 and hexadecimal FF", () => {
    expect(result("decimal-to-binary-converter", "Binary (base 2)")).toBe("11111111");
    expect(result("decimal-to-binary-converter", "Hexadecimal (base 16)")).toBe("FF");
  });
});
