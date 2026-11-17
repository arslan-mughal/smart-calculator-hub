import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import type { CalculatorFinderResponse } from "./calculator-finder.shared";
import { generateCalculatorRecommendation } from "./calculator-finder.server";

export type {
  CalculatorFinderResponse,
  CalculatorRecommendation,
  ModelCalculatorRecommendation,
} from "./calculator-finder.shared";

export const recommendCalculator = createServerFn({ method: "POST" })
  .inputValidator((input: { description?: unknown }) => ({
    description: String(input?.description ?? "").trim(),
  }))
  .handler(async ({ data }): Promise<CalculatorFinderResponse> => {
    if (data.description.length < 8) {
      return { ok: false, error: "Describe the calculation in a little more detail (at least 8 characters)." };
    }
    if (data.description.length > 600) {
      return { ok: false, error: "Keep the description to 600 characters or fewer." };
    }
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return { ok: false, error: "AI calculator recommendations are not configured right now." };
    }
    return generateCalculatorRecommendation(data.description, apiKey, getRequest());
  });
