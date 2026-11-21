import { describe, expect, it } from "vitest";
import { findLocalTool, recommendLocalTool } from "@/lib/local-finder";

describe("local tool finder", () => {
  it("matches a mortgage query to the mortgage calculator", () => {
    expect(findLocalTool("I want a mortgage of $350,000 at 6.5% for 30 years. What will I pay monthly?")?.slug).toBe(
      "mortgage-calculator",
    );
    const result = recommendLocalTool("I want a mortgage of $350,000 at 6.5% for 30 years.");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.recommendation.slug).toBe("mortgage-calculator");
      expect(result.recommendation.inputGuidance.map((i) => i.key)).toEqual(["p", "r", "y"]);
    }
  });

  it("matches a calorie query to the calorie calculator", () => {
    expect(findLocalTool("How many calories should a 75 kg person eat per day to maintain weight?")?.slug).toBe(
      "calorie-calculator",
    );
  });

  it("never returns an invented tool", () => {
    expect(findLocalTool("teleportation device for travelling to Mars instantly")).toBeNull();
    const result = recommendLocalTool("teleportation device for travelling to Mars instantly");
    expect(result.ok).toBe(false);
  });

  it("rejects too-short and too-long queries", () => {
    expect(recommendLocalTool("loan")).toEqual({
      ok: false,
      error: "Describe the calculation in a little more detail (at least 8 characters).",
    });
    expect(recommendLocalTool("x".repeat(601)).ok).toBe(false);
  });

  it("only returns alternatives that are real tools", () => {
    const result = recommendLocalTool("I want a mortgage of $350,000 at 6.5% for 30 years.");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.recommendation.alternatives.length).toBeLessThanOrEqual(2);
      for (const alt of result.recommendation.alternatives) {
        expect(alt.slug).not.toBe(result.recommendation.slug);
      }
    }
  });
});
