// Headline Analyzer — a CoSchedule-style heuristic score (0–100) for a
// headline: length, word balance (common / uncommon / emotional / power
// words), and whether it uses a number or a question. Word lists are
// small, curated and shown on the page; the score is a writing guide,
// not a ranking promise.

export const HEADLINE_COMMON_WORDS = new Set(
  "a an the and or but if then so as at by for from in into of on to with without about after before between during how what when where which who why you your we our they their this that these those is are was were be been have has had do does did will would can could should may might must not no yes all any some more most other new old first last best top free easy simple quick".split(
    " ",
  ),
);

export const HEADLINE_UNCOMMON_WORDS = new Set(
  "actually amazing awesome baby beautiful brave brilliant clever curious daring dream discover effective efficient elegant exciting expert fabulous fantastic fascinating fresh genius gentle genuine hidden historic honest huge ideal important incredible innovative inspiring intelligent interesting joyful legendary lovely lucky magic magnificent marvellous massive meaningful memorable mighty miracle mysterious natural outstanding perfect powerful practical precious premium priceless proud proven rare remarkable robust secret sensitive serious shocking significant simple smart smooth special splendid stunning surprising terrific tremendous ultimate unique valuable vibrant vital vivid warm wealthy wonderful worthy".split(
    " ",
  ),
);

export const HEADLINE_EMOTIONAL_WORDS = new Set(
  "love hate fear happy sad angry amazing shocking incredible wonderful terrible stunning beautiful gorgeous awful horrible delightful exciting thrilled worried anxious proud ashamed guilty jealous lonely brave confident calm peaceful stressed overwhelmed relieved grateful hopeful inspired amazed surprised delighted furious devastated ecstatic".split(
    " ",
  ),
);

export const HEADLINE_POWER_WORDS = new Set(
  "proven guaranteed secret instant free new ultimate exclusive limited now today only best top easy simple fast quick powerful effective results success win save money free bonus discount offer deal sale special premium advanced complete step-by-step proven guaranteed".split(
    " ",
  ),
);

export type HeadlineCheck = { label: string; status: "pass" | "warn" | "fail"; detail: string };

export type HeadlineAnalysis = {
  score: number;
  grade: string;
  words: number;
  chars: number;
  commonPct: number;
  uncommonPct: number;
  emotionalPct: number;
  powerCount: number;
  hasNumber: boolean;
  isQuestion: boolean;
  checks: HeadlineCheck[];
};

function wordsOf(headline: string): string[] {
  return headline
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ""));
}

export function analyzeHeadline(headline: string): HeadlineAnalysis {
  const words = wordsOf(headline);
  const n = words.length;
  const chars = headline.trim().length;
  const count = (set: Set<string>) => words.filter((w) => set.has(w)).length;
  const common = count(HEADLINE_COMMON_WORDS);
  const uncommon = count(HEADLINE_UNCOMMON_WORDS);
  const emotional = count(HEADLINE_EMOTIONAL_WORDS);
  const power = count(HEADLINE_POWER_WORDS);
  const commonPct = n ? Math.round((common / n) * 100) : 0;
  const uncommonPct = n ? Math.round((uncommon / n) * 100) : 0;
  const emotionalPct = n ? Math.round((emotional / n) * 100) : 0;
  const hasNumber = /\d/.test(headline);
  const isQuestion = headline.trim().endsWith("?");

  const checks: HeadlineCheck[] = [];
  let score = 0;

  if (n === 0) {
    return {
      score: 0,
      grade: "Weak",
      words: 0,
      chars: 0,
      commonPct: 0,
      uncommonPct: 0,
      emotionalPct: 0,
      powerCount: 0,
      hasNumber: false,
      isQuestion: false,
      checks: [
        { label: "Word count", status: "fail", detail: "Enter a headline to analyse it." },
        { label: "Character length", status: "fail", detail: "0 characters — aim for 40–70." },
        { label: "Common words", status: "fail", detail: "No words to analyse yet." },
        { label: "Uncommon words", status: "fail", detail: "No words to analyse yet." },
        { label: "Emotional words", status: "fail", detail: "No words to analyse yet." },
        { label: "Power words", status: "fail", detail: "No words to analyse yet." },
      ],
    };
  }

  // Length: 6–12 words and 40–70 characters are the sweet spot.
  if (n >= 6 && n <= 12) {
    score += 25;
    checks.push({ label: "Word count", status: "pass", detail: `${n} words — in the 6–12 sweet spot.` });
  } else if (n >= 4 && n <= 15) {
    score += 15;
    checks.push({ label: "Word count", status: "warn", detail: `${n} words — aim for 6–12 words.` });
  } else {
    checks.push({
      label: "Word count",
      status: "fail",
      detail: n === 0 ? "Enter a headline to analyse it." : `${n} words — aim for 6–12 words.`,
    });
  }
  if (chars >= 40 && chars <= 70) {
    score += 15;
    checks.push({ label: "Character length", status: "pass", detail: `${chars} characters — in the 40–70 sweet spot.` });
  } else if (chars >= 20 && chars <= 100) {
    score += 8;
    checks.push({ label: "Character length", status: "warn", detail: `${chars} characters — aim for 40–70.` });
  } else {
    checks.push({ label: "Character length", status: "fail", detail: `${chars} characters — aim for 40–70.` });
  }

  // Word balance (CoSchedule-style targets).
  if (commonPct >= 20 && commonPct <= 30) {
    score += 15;
    checks.push({ label: "Common words", status: "pass", detail: `${commonPct}% common words (target 20–30%).` });
  } else {
    checks.push({
      label: "Common words",
      status: "warn",
      detail: `${commonPct}% common words (target 20–30%) — common words make a headline easy to read.`,
    });
    score += 5;
  }
  if (uncommonPct >= 10 && uncommonPct <= 20) {
    score += 15;
    checks.push({ label: "Uncommon words", status: "pass", detail: `${uncommonPct}% uncommon words (target 10–20%).` });
  } else {
    checks.push({
      label: "Uncommon words",
      status: "warn",
      detail: `${uncommonPct}% uncommon words (target 10–20%) — unusual words catch the eye.`,
    });
    score += 5;
  }
  if (emotionalPct >= 10 && emotionalPct <= 15) {
    score += 15;
    checks.push({ label: "Emotional words", status: "pass", detail: `${emotionalPct}% emotional words (target 10–15%).` });
  } else if (emotionalPct > 0) {
    score += 8;
    checks.push({
      label: "Emotional words",
      status: "warn",
      detail: `${emotionalPct}% emotional words (target 10–15%) — emotion makes people click.`,
    });
  } else {
    checks.push({
      label: "Emotional words",
      status: "warn",
      detail: "No emotional words — one feeling word (amazing, shocking, wonderful) lifts a headline.",
    });
  }
  if (power >= 1) {
    score += 10;
    checks.push({ label: "Power words", status: "pass", detail: `${power} power word(s) found (proven, free, secret, …).` });
  } else {
    checks.push({
      label: "Power words",
      status: "warn",
      detail: "No power words — one strong word (proven, secret, free, ultimate) adds punch.",
    });
  }
  if (hasNumber) {
    score += 5;
    checks.push({ label: "Number", status: "pass", detail: "Contains a number — list-style headlines get more clicks." });
  }
  if (isQuestion) {
    checks.push({ label: "Question", status: "pass", detail: "Phrased as a question — questions invite a click." });
  }

  score = Math.min(100, score);
  const grade = score >= 70 ? "Strong" : score >= 50 ? "Good" : score >= 30 ? "Needs work" : "Weak";
  return {
    score,
    grade,
    words: n,
    chars,
    commonPct,
    uncommonPct,
    emotionalPct,
    powerCount: power,
    hasNumber,
    isQuestion,
    checks,
  };
}
