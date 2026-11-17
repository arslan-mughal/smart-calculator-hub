import { describe, expect, it } from "vitest";
import { normaliseRecommendation } from "@/lib/calculator-finder.server";
import type { ModelCalculatorRecommendation } from "@/lib/calculator-finder.shared";

const modelResult: ModelCalculatorRecommendation = {
  slug: "mortgage-calculator",
  explanation: "This fits a fixed-rate home loan payment comparison.",
  inputGuidance: [
    { key: "p", value: "350000", instruction: "Enter the amount borrowed." },
    { key: "r", value: "6.5", instruction: "Use the yearly interest rate." },
    { key: "y", value: "30", instruction: "Enter the full term in years." },
  ],
  alternatives: [
    { slug: "loan-calculator", reason: "Useful for a general fixed-rate loan." },
    { slug: "not-a-real-tool", reason: "This must not reach the page." },
  ],
  missingInformation: "Taxes and insurance are not included.",
};

describe("AI calculator recommendation safeguards", () => {
  it("keeps only real tools and maps guidance to every actual input", () => {
    const result = normaliseRecommendation(modelResult);
    expect(result?.slug).toBe("mortgage-calculator");
    expect(result?.inputGuidance.map((input) => input.key)).toEqual(["p", "r", "y"]);
    expect(result?.inputGuidance.map((input) => input.value)).toEqual(["350000", "6.5", "30"]);
    expect(result?.alternatives).toEqual([
      { slug: "loan-calculator", reason: "Useful for a general fixed-rate loan." },
    ]);
  });

  it("uses actual defaults for omitted fields and rejects an invented calculator", () => {
    const result = normaliseRecommendation({ ...modelResult, inputGuidance: [] });
    expect(result?.inputGuidance.map((input) => input.value)).toEqual(["350000", "6.5", "30"]);
    expect(normaliseRecommendation({ ...modelResult, slug: "invented-calculator" })).toBeNull();
  });
});
