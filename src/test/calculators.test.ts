import { describe, expect, it } from "vitest";
import { bmi, bmiCategory, emi, compound, ageBetween } from "@/lib/calculators";

describe("calculators", () => {
  it("bmi 70kg 175cm ≈ 22.9 healthy", () => {
    expect(bmi(70, 175)).toBeCloseTo(22.86, 1);
    expect(bmiCategory(22.86)).toBe("Healthy weight");
  });
  it("emi 100000 at 12% for 12 months ≈ 8884.88", () => {
    expect(emi(100000, 12, 12)).toBeCloseTo(8884.88, 1);
  });
  it("compound 1000 at 10% yearly 2y = 1210", () => {
    expect(compound(1000, 10, 2, 1)).toBeCloseTo(1210, 5);
  });
  it("age 2000-01-15 to 2026-03-10 = 26y 1m 23d", () => {
    const a = ageBetween(new Date(2000, 0, 15), new Date(2026, 2, 10));
    expect([a.y, a.m, a.d]).toEqual([26, 1, 23]);
  });
});
