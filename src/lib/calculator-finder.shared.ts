export type ModelCalculatorRecommendation = {
  slug: string;
  explanation: string;
  inputGuidance: { key: string; value: string; instruction: string }[];
  alternatives: { slug: string; reason: string }[];
  missingInformation: string;
};

export type CalculatorRecommendation = {
  slug: string;
  explanation: string;
  inputGuidance: { key: string; label: string; value: string; instruction: string }[];
  alternatives: { slug: string; reason: string }[];
  missingInformation: string;
};

export type CalculatorFinderResponse =
  | { ok: true; recommendation: CalculatorRecommendation }
  | { ok: false; error: string };
