// Derives the SEO content for a tool page (and its guide post) from the
// tool's own registry data. Nothing is invented: where a tool has no formula
// or no worked example, the corresponding section is empty and the page
// hides it. Generic FAQs only state facts that are true of every tool here
// (free, no sign-up, runs in the browser, results are estimates).
import { bySlug, calcs, type Calc } from "./registry";
import { DEFAULT_SETTINGS } from "./site-settings";

export type ToolFaq = { q: string; a: string };

export type ToolSeo = {
  longDescription: string;
  howTo: string[];
  formula: string;
  faqs: ToolFaq[];
  relatedSlugs: string[];
  primaryKeyword: string;
};

/** Tools the keyword research prioritised (US monthly volume). Their pages
 *  and guide posts get the full 5-FAQ treatment; see SEO.md. */
export const PRIORITY_TOOL_SLUGS = [
  "bmi-calculator",
  "percentage-calculator",
  "age-calculator",
  "tdee-calculator",
  "calorie-calculator",
  "gpa-calculator",
  "mortgage-calculator",
  "time-zone-converter",
  "sales-tax-calculator",
  "loan-calculator",
  "compound-interest-calculator",
  "days-between-dates-calculator",
  "macro-calculator",
  "car-loan-calculator",
  "body-fat-calculator",
  "salary-calculator",
  "refinance-calculator",
  "profit-margin-calculator",
  "roi-calculator",
  "break-even-calculator",
  // Batch 25 priority tools (keyword gaps with real search volume).
  "paycheck-calculator",
  "invoice-generator",
  "currency-converter",
  "length-converter",
  "income-tax-calculator",
  "tax-refund-calculator",
  "investment-calculator",
  "salary-to-hourly-calculator",
  "yaml-to-json",
  // Batch 26 priority tools (keyword gaps with real search volume).
  "final-grade-calculator",
  "salary-conversion-calculator",
] as const;

/** Long-tail FAQ extras for priority tools (research: "how to calculate…",
 *  "how to raise GPA", "what is a good profit margin/ROI"). Only added
 *  where the answer is honest general guidance, never a tool fact. */
const PRIORITY_EXTRA_FAQS: Record<string, ToolFaq> = {
  "gpa-calculator": {
    q: "How can I raise my GPA?",
    a: "GPA is a weighted average, so the fastest way up is higher grades in your remaining and heaviest-weighted courses. Where your school allows it, retaking a failed course can also lift the average.",
  },
  "percentage-calculator": {
    q: "How do you calculate a percentage increase?",
    a: "Subtract the old value from the new value, divide by the old value, then multiply by 100. For example, going from 40 to 50 is (50 − 40) ÷ 40 × 100 = 25%.",
  },
  "days-between-dates-calculator": {
    q: "How do I calculate the number of days between two dates?",
    a: "Enter the start date and the end date and the calculator counts the days between them. It handles leap years and month lengths for you, so you don't have to count by hand.",
  },
  "profit-margin-calculator": {
    q: "What is a good profit margin?",
    a: "It varies a lot by industry — as a rough guide, around 10% is often considered average and 20% good, while under 5% is usually thin. Compare against businesses like yours, not against other industries.",
  },
  "roi-calculator": {
    q: "What is a good ROI?",
    a: "There is no single good number — it depends on the risk and the time period. As a rough guide, many investors look for an annual return comfortably above inflation and above what a savings account would pay, after accounting for risk.",
  },
  "body-fat-calculator": {
    q: "How accurate is a body fat calculator?",
    a: "Estimates from measurements are useful for tracking trends over time, but they are less precise than a DEXA scan or hydrostatic weighing. Use the same method and the same measurements each time for comparable results.",
  },
  "refinance-calculator": {
    q: "When does refinancing make sense?",
    a: "Usually when the new rate is meaningfully lower than your current rate and you will stay in the home long enough for the monthly savings to cover the closing costs. Compare the total cost, not just the monthly payment.",
  },
  "tdee-calculator": {
    q: "What is TDEE?",
    a: "TDEE (Total Daily Energy Expenditure) is the total number of calories your body burns in a day, including your basal metabolic rate and all activity. It is the starting point for setting a calorie target to maintain, lose or gain weight.",
  },
};

const brand = (text: string, siteName: string): string =>
  siteName === DEFAULT_SETTINGS.siteName ? text : text.replace(/\bCalcHub\b/g, siteName);

function describeInput(input: Calc["inputs"][number]): string {
  const label = input.label.toLowerCase();
  if (input.type === "select") return `Choose your ${label} from the list.`;
  if (input.type === "date") return `Pick your ${label}.`;
  if (input.type === "textarea" || input.type === "text")
    return `Type or paste your ${label}.`;
  return `Enter your ${label}${"suffix" in input && input.suffix ? ` (${input.suffix})` : ""}.`;
}

function deriveHowTo(tool: Calc): string[] {
  if (tool.howToUse?.length) return tool.howToUse;
  const steps = tool.inputs.map(describeInput);
  steps.push("Check the result — it updates instantly as you type.");
  steps.push("Use Reset to start over with the default values.");
  return steps.slice(0, 6);
}

function genericFaqs(tool: Calc): ToolFaq[] {
  const name = tool.name;
  const out: ToolFaq[] = [];
  if (tool.formula) {
    out.push({
      q: `What formula does the ${name} use?`,
      a: tool.formula,
    });
  }
  const labels = tool.inputs.map((i) => i.label).filter(Boolean);
  if (labels.length > 0) {
    const list = labels.length > 1 ? `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}` : labels[0];
    out.push({
      q: `What do I need to use the ${name}?`,
      a: `Just ${list}. Enter those values and the result appears straight away — no account or download needed.`,
    });
  }
  out.push({
    q: `Is the ${name} free to use?`,
    a: `Yes. The ${name} is free to use as often as you like, with no sign-up.`,
  });
  out.push({
    q: `Does the ${name} save or send my data?`,
    a: `No. The ${name} runs entirely in your browser — the values you enter never leave your device.`,
  });
  out.push({
    q: `How accurate is the ${name}?`,
    a: tool.formula
      ? `It applies the standard formula to the values you enter, so the result is as accurate as your inputs. Treat it as an estimate for informational use.`
      : `The result follows directly from the values you enter. Treat it as an estimate for informational use, and check important figures against an authoritative source.`,
  });
  return out;
}

// Topic groups for FAQ de-duplication: two questions on the same topic are
// the same question, however phrased. The tool name is stripped first —
// otherwise every question about the "Quadratic Formula Calculator" would
// count as "about the formula".
const TOPICS: Record<string, string[]> = {
  formula: ["formula"],
  free: ["free", "cost", "pay", "price"],
  privacy: ["stored", "store", "save", "send", "data", "private", "entries", "track"],
  accuracy: ["accurate", "accuracy", "correct", "precise"],
  inputs: ["need", "input", "enter", "required", "values"],
};

function topicsOf(question: string, toolName: string): Set<string> {
  const words = question
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(toolName.toLowerCase(), "")
    .split(" ")
    .filter(Boolean);
  const found = new Set<string>();
  for (const [topic, keywords] of Object.entries(TOPICS)) {
    if (keywords.some((k) => words.includes(k))) found.add(topic);
  }
  return found;
}

function similar(a: string, b: string, toolName: string): boolean {
  const norm = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(toolName.toLowerCase(), "").replace(/\s+/g, " ").trim();
  const firstWords = (s: string) => norm(s).split(" ").slice(0, 4).join(" ");
  if (firstWords(a) === firstWords(b)) return true;
  const ta = topicsOf(a, toolName);
  const tb = topicsOf(b, toolName);
  for (const t of ta) if (tb.has(t)) return true;
  return false;
}

function deriveFaqs(tool: Calc, siteName: string): ToolFaq[] {
  const faqs: ToolFaq[] = tool.faqs.map((f) => ({ q: brand(f.q, siteName), a: brand(f.a, siteName) }));
  const isPriority = (PRIORITY_TOOL_SLUGS as readonly string[]).includes(tool.slug);
  const target = isPriority ? 5 : 4;
  const extra = PRIORITY_EXTRA_FAQS[tool.slug];
  if (extra && !faqs.some((f) => similar(f.q, extra.q, tool.name))) faqs.push(extra);
  for (const g of genericFaqs(tool)) {
    if (faqs.length >= target) break;
    if (faqs.some((f) => similar(f.q, g.q, tool.name))) continue;
    faqs.push({ q: g.q, a: brand(g.a, siteName) });
  }
  return faqs.slice(0, 5);
}

function deriveRelated(tool: Calc): string[] {
  const picked: string[] = [];
  for (const t of calcs) {
    if (picked.length >= 6) break;
    if (t.category === tool.category && t.slug !== tool.slug) picked.push(t.slug);
  }
  if (picked.length < 6) {
    for (const t of calcs) {
      if (picked.length >= 6) break;
      if (t.popular && t.slug !== tool.slug && !picked.includes(t.slug)) picked.push(t.slug);
    }
  }
  if (picked.length < 6) {
    for (const t of calcs) {
      if (picked.length >= 6) break;
      if (t.slug !== tool.slug && !picked.includes(t.slug)) picked.push(t.slug);
    }
  }
  return picked;
}

export function getToolSeo(tool: Calc, siteName: string = DEFAULT_SETTINGS.siteName): ToolSeo {
  const longDescription =
    tool.about.trim() !== ""
      ? brand(tool.about, siteName)
      : brand(`${tool.name} — ${tool.short}`, siteName);
  return {
    longDescription,
    howTo: deriveHowTo(tool).map((s) => brand(s, siteName)),
    formula: brand(tool.formula, siteName),
    faqs: deriveFaqs(tool, siteName),
    relatedSlugs: deriveRelated(tool),
    primaryKeyword: tool.keywords.split(",")[0]?.trim() || tool.name.toLowerCase(),
  };
}

/** Convenience lookup by slug (undefined for unknown slugs). */
export function getToolSeoBySlug(slug: string, siteName?: string): ToolSeo | undefined {
  const tool = bySlug[slug];
  return tool ? getToolSeo(tool, siteName) : undefined;
}

function clampText(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 40 ? lastSpace : cut.length)}…`;
}

const countWords = (text: string): number => text.split(/\s+/).filter(Boolean).length;

function oxford(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0]!;
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

function lowerFirst(label: string): string {
  // Keep acronyms (APR, BMI) intact; lowercase an ordinary leading capital.
  if (/^[A-Z]{2,}/.test(label)) return label;
  return label.charAt(0).toLowerCase() + label.slice(1);
}

/** Gerund phrase for the how-to intro, e.g. "entering your weight (kg)". */
function inputGerund(input: Calc["inputs"][number]): string {
  const label = lowerFirst(input.label);
  if (input.type === "select") return `choosing your ${label} from the list`;
  if (input.type === "date") return `picking your ${label}`;
  if (input.type === "textarea" || input.type === "text") return `typing or pasting your ${label}`;
  return `entering your ${label}${"suffix" in input && input.suffix ? ` (${input.suffix})` : ""}`;
}

/** Display value for an input's default (the option label for selects). */
function defaultDisplay(input: Calc["inputs"][number]): string {
  if (input.type === "select") {
    return input.options.find((o) => o.v === input.def)?.l ?? input.def;
  }
  return input.def;
}

/** Second sentence(s) appended to short FAQ answers so every answer is
 *  2–3 sentences of real guidance. Each one states a fact that is true
 *  of every tool here (free, no sign-up, runs in the browser) or points
 *  back at the tool itself — nothing is invented about the topic. */
function faqExtension(faq: ToolFaq, tool: Calc): string {
  const topics = topicsOf(faq.q, tool.name);
  const toolLink = `[${tool.name}](/${tool.slug})`;
  if (topics.has("formula"))
    return `You can see it in action in the ${toolLink} — enter your own values and the result updates as you type.`;
  if (topics.has("free"))
    return `There is no limit on how often you use it, nothing to install, and no account to create — open the ${toolLink} and start straight away.`;
  if (topics.has("privacy"))
    return `You can use it as often as you like, and because nothing is uploaded, stored or tracked, there is nothing to delete afterwards.`;
  if (topics.has("accuracy"))
    return `For figures that matter, such as money, health or legal deadlines, check the result against an authoritative source before acting on it.`;
  if (topics.has("inputs"))
    return `If you are unsure about a value, try a rough figure first and then refine it — the result updates instantly.`;
  return `Try it with your own numbers in the ${toolLink} — the result updates as you type, so you can test a few scenarios in seconds.`;
}

function expandFaqAnswer(faq: ToolFaq, tool: Calc): string {
  const answer = faq.a.trim();
  if (countWords(answer) >= 50) return answer;
  return `${answer} ${faqExtension(faq, tool)}`;
}

/** The tool's outputs at its default values, with unusable values
 *  (empty, "—", NaN) dropped. A date default of "today" means today, so
 *  it is resolved to the current date before computing. Returns null when
 *  the tool has no usable default result (date tools, QR/image
 *  generators, the scientific calculator). */
function defaultResult(tool: Calc): { inputSummary: string; outputSummary: string } | null {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const defaults = Object.fromEntries(
      tool.inputs.map((i) => [i.key, i.type === "date" && i.def === "today" ? today : i.def]),
    );
    const outputs = tool
      .compute(defaults)
      .filter((o) => o.value && o.value !== "—" && !/NaN/.test(o.value));
    if (outputs.length === 0) return null;
    // Summaries are embedded inline in a paragraph, so multi-line
    // defaults (textarea inputs such as the YAML example) must collapse
    // to one line — a bare "  - item" line mid-paragraph is re-parsed
    // as a list item by the block editor and the round-trip loses
    // content (yaml-to-json-guide failed the blocks test this way).
    const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();
    const inputSummary = oneLine(
      tool.inputs
        .map(
          (i) =>
            `${i.label}: ${defaultDisplay(i)}${"suffix" in i && i.suffix && i.type !== "select" ? ` ${i.suffix}` : ""}`,
        )
        .join(", "),
    );
    return {
      inputSummary,
      outputSummary: oneLine(outputs.map((o) => `${o.label}: ${o.value}`).join(", ")),
    };
  } catch {
    return null;
  }
}

/**
 * Build the tool-guide blog post for a tool (used by
 * scripts/generate-tool-posts.mjs). Slug is `<tool-slug>-guide`, so it never
 * collides with the tool's own route. Content is assembled ONLY from the
 * tool's own registry data and the derived SEO above — nothing invented.
 * Target length is 700–900 words: two substantial intro paragraphs,
 * 60–90-word body paragraphs, 2–3-sentence FAQ answers, and inline links
 * in the body (own tool, related tools, other guides) — not just the
 * link list at the end. Returns the post without status/author/dates
 * (the generator adds those).
 */
export function buildToolGuidePost(
  tool: Calc,
  siteName: string = DEFAULT_SETTINGS.siteName,
): {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
} {
  const seo = getToolSeo(tool, siteName);
  const slug = `${tool.slug}-guide`;
  const title = `${tool.name}: how it works, formula and examples`;
  const excerpt = clampText(
    `${tool.name}: ${tool.short} Learn how to use it, the formula behind it, a worked example and answers to common questions.`,
    160,
  );
  const keywordTags = tool.keywords
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length >= 3 && k.length <= 30)
    .slice(0, 3);
  const tags = [...new Set([tool.category, ...keywordTags])].slice(0, 5);
  const related = seo.relatedSlugs
    .slice(0, 4)
    .map((s) => bySlug[s])
    .filter((t): t is Calc => Boolean(t));
  const relatedLinks = related.map((t) => `[${t.name}](/${t.slug})`);
  const guideLinks = related.slice(0, 2).map((t) => `[${t.name}](/blog/${t.slug}-guide)`);
  const categoryLink = `[${tool.category} tools](/tools?category=${encodeURIComponent(tool.category)})`;
  const ownLink = `[${tool.name}](/${tool.slug})`;

  // ---- Intro paragraph 1 (60–90 words): links to the tool itself. ----
  const labels = tool.inputs.map((i) => lowerFirst(i.label));
  const inputsList = oxford(labels);
  const p1: string[] = [
    `The ${ownLink} is a free online tool on ${siteName}.`,
    brand(tool.short.trim(), siteName),
    tool.inputs.length > 0
      ? `Enter your ${inputsList} and the result appears straight away — no account or download needed.`
      : `Open it and start straight away — no account or download needed.`,
    `Because it runs entirely in your browser, the values you type never leave your device, and you can use it as often as you like.`,
  ];
  const alsoKnownAs = tool.keywords
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length >= 3 && k.toLowerCase() !== tool.name.toLowerCase())
    .slice(0, 3);
  if (countWords(p1.join(" ")) < 60) {
    p1.push(`It is one of the ${categoryLink} on ${siteName} — the others work the same way.`);
  }
  if (countWords(p1.join(" ")) < 60 && alsoKnownAs.length > 0) {
    p1.push(`People also look for this tool as ${alsoKnownAs.map((k) => `"${k}"`).join(", ")}.`);
  }
  const intro1 = p1.join(" ");

  // ---- Intro paragraph 2 (60–90 words): the long description. ----
  const p2: string[] = [seo.longDescription];
  const introGuideSentence = `This guide explains how to use it, the formula it applies, and a worked example you can follow with your own numbers.`;
  if (countWords(p2.join(" ")) + countWords(introGuideSentence) <= 95) p2.push(introGuideSentence);
  if (countWords(p2.join(" ")) < 60 && relatedLinks.length >= 2) {
    p2.push(`Related ${tool.category} tools include ${oxford(relatedLinks.slice(0, 3))}.`);
  }
  if (countWords(p2.join(" ")) < 60 && alsoKnownAs.length > 0) {
    p2.push(`People also look for this tool as ${alsoKnownAs.map((k) => `"${k}"`).join(", ")}.`);
  }
  const intro2 = p2.join(" ");

  // ---- How to use: prose intro + the numbered steps. ----
  const gerunds = tool.inputs.map(inputGerund);
  let howToIntro: string;
  if (gerunds.length === 0) {
    // A few tools (scientific calculator, QR generator, image resizer)
    // have no form inputs — the steps below describe using them directly.
    howToIntro = `Open the ${ownLink} and start straight away — there is no form to fill in first. The result updates as you work, so you can try different settings and see the change straight away.`;
  } else if (gerunds.length === 1) howToIntro = `Start by ${gerunds[0]}.`;
  else if (gerunds.length === 2) howToIntro = `Start by ${gerunds[0]}, then ${gerunds[1]}.`;
  else
    howToIntro = `Start by ${gerunds[0]}, then ${gerunds.slice(1, -1).join(", ")} and finally ${gerunds.at(-1)}.`;
  if (gerunds.length > 0) {
    howToIntro += ` The result updates as you type, so adjust any value and watch the answer change. If the answer is not what you expected, check the value you entered first — a missing digit or a wrong unit is the usual cause. When you want a clean slate, Reset restores the defaults.`;
  }
  if (gerunds.length === 1) {
    howToIntro += ` The steps below walk through each input in order.`;
  }
  const howToSection = `## How to use the ${tool.name}\n\n${howToIntro}\n\n${seo.howTo.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;

  // ---- Formula (every tool in the catalogue has one; the fallback is
  // for future tools that do not). Never invented — the tool's own. ----
  const formulaSection =
    seo.formula !== ""
      ? `## Formula\n\n${seo.formula}\n\nThat is the standard formula for this calculation, and it is the same one the ${ownLink} applies to the values you enter. You can work it out by hand, but the calculator is faster when you want to try several values, and it removes the risk of a slip in the arithmetic. If the figures look wrong, check your inputs first — a misplaced decimal point is the usual culprit.`
      : `## How it works\n\nThe ${ownLink} works straight from the values you enter: change an input and the result updates immediately, with no page reload and no waiting. Everything happens in your browser, so your entries never leave your device. Try it with a few different values and you will quickly get a feel for how the inputs move the result.`;

  // ---- Worked example: the tool's own example, as prose. ----
  const exampleSection = `## Worked example\n\nHere is a typical example. ${brand(tool.example, siteName)} Try the same figures in the ${ownLink} and you will get the same result — then change one value at a time to see how the answer moves. The steps are the same whatever numbers you use; only the figures change.`;

  // ---- What the result shows: real output figures at default values. ----
  const result = defaultResult(tool);
  const resultSection = result
    ? `## What the result shows\n\nWith the default values (${result.inputSummary}), the ${ownLink} returns ${result.outputSummary}. The first figure is the headline result, and the rest break it down so you can see how the total is made up. Change any value and every figure updates instantly.${relatedLinks[0] ? ` If you want to compare with a related calculation, the ${relatedLinks[0]} is worth a look before you finish.` : ""}`
    : `## Trying it out\n\nThe fastest way to see what the ${ownLink} does is to open it and enter values you already know the answer for. Change one input at a time and watch how the result responds — that tells you more than any description. Everything runs in your browser, so you can experiment freely: nothing is saved, sent or tracked.`;

  // ---- Tool details (only 27 tools have these; bodies are substantial). ----
  const detailSections = (tool.details ?? []).map(
    (d) => `## ${d.heading}\n\n${brand(d.body, siteName)}`,
  );

  // ---- Tips: intro + bullets + outro. ----
  const tipsOutro = `Keep these in mind and the figures will be as useful as the numbers you put in.`;
  const tipsSection = `## Tips\n\nA few things worth knowing before you rely on the result — most of them are about the numbers you put in, rather than the tool itself:\n\n${tool.tips.map((t) => `- ${brand(t, siteName)}`).join("\n")}\n\n${tipsOutro}`;

  // ---- FAQ: every answer expanded to 2–3 sentences. ----
  const faqSection = `## Frequently asked questions\n\n${seo.faqs.map((f) => `### ${f.q}\n\n${expandFaqAnswer(f, tool)}`).join("\n\n")}`;

  // ---- Related tools: inline links to related tools AND other guides. ----
  // (The catalogue always yields 6 related tools, so both guide links
  // exist; the fallback is only for a much smaller future catalogue.)
  const guideSentence =
    guideLinks.length >= 2
      ? ` For more detail, read the guides to the ${guideLinks[0]} and ${guideLinks[1]}, which explain how those calculations work and when to use them.`
      : "";
  const guideSentenceShort =
    guideLinks.length >= 2
      ? ` Read the guides to the ${guideLinks[0]} and ${guideLinks[1]} for more detail on how those work.`
      : "";
  const relatedFull = `## Related tools\n\nIf this calculation is part of a bigger job, the other ${tool.category} tools on ${siteName} can help. The ${oxford(relatedLinks.slice(0, 4))} all work the same way — enter your values and the result appears instantly, free and with no sign-up.${guideSentence}`;
  const relatedShort = `## Related tools\n\nThe ${oxford(relatedLinks.slice(0, 4))} cover related calculations in the same category.${guideSentenceShort}`;

  // ---- Try it now: the link list (unchanged). ----
  const tryItSection = `## Try it now\n\n- [Open the ${tool.name}](/${tool.slug})\n${related
    .map((t) => `- [${t.name}](/${t.slug})`)
    .join("\n")}\n- [Browse all ${tool.category} tools](/tools?category=${encodeURIComponent(tool.category)})\n- [More guides](/blog)`;

  const sections = [
    intro1,
    intro2,
    howToSection,
    formulaSection,
    exampleSection,
    resultSection,
    ...detailSections,
    tipsSection,
    faqSection,
    relatedFull,
    tryItSection,
  ];

  // Keep the post in the 700–900-word band: if the long related section
  // pushes it over, swap in the short variant; if still over, drop the
  // tips outro, then trim one generic sentence at a time from the formula,
  // example, result and how-to prose. (Tools with detail sections are the
  // ones that need this; the detail content itself is never cut.)
  const trimSentences = [
    " If the figures look wrong, check your inputs first — a misplaced decimal point is the usual culprit.",
    " The steps are the same whatever numbers you use; only the figures change.",
    " Change any value and every figure updates instantly.",
    " When you want a clean slate, Reset restores the defaults.",
  ];
  let content = sections.join("\n\n");
  if (countWords(content) > 950) {
    content = content.split(relatedFull).join(relatedShort);
  }
  if (countWords(content) > 950) {
    content = content.split(`\n\n${tipsOutro}`).join("");
  }
  for (const sentence of trimSentences) {
    if (countWords(content) > 950) content = content.split(sentence).join("");
  }

  return { slug, title, excerpt, content, category: tool.category, tags };
}
