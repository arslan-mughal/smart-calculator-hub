import { bySlug, calcs, type Calc } from "./registry";

export type LocalRecommendation = {
  slug: string;
  explanation: string;
  inputGuidance: { key: string; label: string; value: string; instruction: string }[];
  alternatives: { slug: string; reason: string }[];
  missingInformation: string;
};

export type LocalFinderResponse =
  | { ok: true; recommendation: LocalRecommendation }
  | { ok: false; error: string };

const STOPWORDS = new Set([
  "a", "an", "the", "i", "want", "need", "would", "like", "please", "how", "what", "is",
  "are", "to", "for", "of", "my", "me", "in", "on", "and", "or", "with", "per", "does",
  "do", "can", "you", "your", "this", "that", "it", "be", "will", "should", "get", "find",
  "calculator", "calculators", "calculate", "calculation", "tool", "tools", "online", "free",
  "use", "using", "tell", "give", "show", "help",
]);

function tokenise(text: string): string[] {
  const raw = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  const out = new Set<string>();
  for (const t of raw) {
    if (t.length < 2 || STOPWORDS.has(t)) continue;
    // Singularise in place (do NOT keep both forms — that double-counts):
    // "calories" -> "calorie", "years" -> "year".
    if (t === "calories") out.add("calorie");
    else if (t.endsWith("ies") && t.length > 4) out.add(`${t.slice(0, -3)}y`);
    else if (t.endsWith("s") && t.length > 3) out.add(t.slice(0, -1));
    else out.add(t);
  }
  return [...out];
}

function fieldTokens(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
}

// Exact match = full points; prefix match (token is a prefix of a field word,
// or vice versa for words of 4+ letters) = half points. No substring scoring:
// substring matches are too noisy across a 100+ tool catalogue.
function tokenScore(token: string, field: string[]): number {
  let best = 0;
  for (const f of field) {
    if (f === token) best = Math.max(best, 30);
    else if (token.length >= 3 && f.startsWith(token)) best = Math.max(best, 15);
    else if (f.length >= 4 && token.startsWith(f)) best = Math.max(best, 15);
  }
  return best;
}

function hasExactMatch(token: string, field: string[]): boolean {
  return field.includes(token);
}

function scoreTool(queryTokens: string[], tool: Calc): number {
  const name = fieldTokens(`${tool.name} ${tool.slug.replace(/-/g, " ")}`);
  const keywords = fieldTokens(tool.keywords);
  const short = fieldTokens(tool.short);
  const category = fieldTokens(tool.category);
  const inputs = fieldTokens(tool.inputs.map((i) => i.label).join(" "));
  // A tool only qualifies if at least one query token exactly matches its
  // name or keywords — otherwise incidental words (e.g. "year") win.
  const qualified = queryTokens.some((t) => hasExactMatch(t, name) || hasExactMatch(t, keywords));
  if (!qualified) return 0;
  let score = 0;
  for (const token of queryTokens) {
    score += tokenScore(token, name);
    score += Math.round(tokenScore(token, keywords) * 0.7);
    score += Math.round(tokenScore(token, short) * 0.4);
    score += Math.round(tokenScore(token, category) * 0.25);
    score += Math.round(tokenScore(token, inputs) * 0.2);
  }
  return score;
}

export function findLocalTool(query: string): Calc | null {
  const tokens = tokenise(query);
  if (!tokens.length) return null;
  let best: Calc | null = null;
  let bestScore = 0;
  for (const tool of calcs) {
    const score = scoreTool(tokens, tool);
    if (score > bestScore) {
      bestScore = score;
      best = tool;
    }
  }
  // Threshold: a generic word such as "calculator" alone must not match.
  return bestScore >= 25 ? best : null;
}

export function recommendLocalTool(query: string): LocalFinderResponse {
  const trimmed = query.trim();
  if (trimmed.length < 8) {
    return { ok: false, error: "Describe the calculation in a little more detail (at least 8 characters)." };
  }
  if (trimmed.length > 600) {
    return { ok: false, error: "Keep the description to 600 characters or fewer." };
  }
  const tokens = tokenise(trimmed);
  const ranked = calcs
    .map((tool) => ({ tool, score: scoreTool(tokens, tool) }))
    .filter((r) => r.score >= 10)
    .sort((a, b) => b.score - a.score);
  const top = ranked[0];
  if (!top || top.score < 25) {
    return {
      ok: false,
      error: "That did not match an available calculator. Try including the values and units involved, e.g. mortgage, calories, or miles per gallon.",
    };
  }
  const tool = top.tool;
  return {
    ok: true,
    recommendation: {
      slug: tool.slug,
      explanation: `${tool.name}: ${tool.short}`,
      inputGuidance: tool.inputs.map((input) => ({
        key: input.key,
        label: input.label,
        value: input.def === "today" ? "Today's date" : input.def,
        instruction: `Enter ${input.label.toLowerCase()}; the example value is ${input.def}.`,
      })),
      alternatives: ranked
        .slice(1, 3)
        .map((r) => ({ slug: r.tool.slug, reason: r.tool.short })),
      missingInformation: "",
    },
  };
}

export { bySlug };
