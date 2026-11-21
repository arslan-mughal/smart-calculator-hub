// Live SEO score for the post editor. Pure functions over the post fields —
// recomputed on every keystroke by the editor, and unit-tested here.
// Score is 0–100, weighted by check; each check carries a concrete
// suggestion so the writer knows what to fix.
import { countMarkdownWords } from "./blocks";

export type SeoCheckStatus = "pass" | "warn" | "fail";
export type SeoCheck = {
  id: string;
  label: string;
  status: SeoCheckStatus;
  detail: string;
};

export type SeoScoreResult = {
  score: number;
  checks: SeoCheck[];
  words: number;
  readingMinutes: number;
  chars: number;
  internalLinks: number;
  externalLinks: number;
  images: number;
  imagesWithoutAlt: number;
  headings: number;
};

export type SeoScoreInput = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  focusKeyword: string;
};

const INTERNAL_LINK_RE = /\[[^\]]+\]\(\/[^/\s][^\s)]*\)/g;
const EXTERNAL_LINK_RE = /\[[^\]]+\]\(https?:\/\/[^\s)]+\)/g;
const IMAGE_RE = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)(?:\s+"[^"]*")?\)/g;

function countSentences(text: string): { sentences: number; words: number } {
  const clean = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>*`]/g, " ");
  const sentences = clean
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return { sentences: sentences.length, words: clean.split(/\s+/).filter(Boolean).length };
}

export function scoreSeo(input: SeoScoreInput): SeoScoreResult {
  const title = input.title.trim();
  const slug = input.slug.trim();
  const excerpt = input.excerpt.trim();
  const content = input.content;
  const focus = input.focusKeyword.trim().toLowerCase();
  const words = countMarkdownWords(content);
  const chars = content.length;
  const internalLinks = (content.match(INTERNAL_LINK_RE) ?? []).length;
  const externalLinks = (content.match(EXTERNAL_LINK_RE) ?? []).length;
  const imageMatches = [...content.matchAll(IMAGE_RE)];
  const images = imageMatches.length;
  const imagesWithoutAlt = imageMatches.filter((m) => !(m[1] ?? "").trim()).length;

  // First paragraph: first non-heading, non-list block of text.
  const firstParagraph =
    content
      .split(/\n{2,}/)
      .map((b) => b.trim())
      .find((b) => b && !b.startsWith("#") && !/^[-*]\s/.test(b) && !/^\d+[.)]\s/.test(b)) ?? "";
  const headings = (content.match(/^#{2,3}\s+/gm) ?? []).length;
  const h2WithFocus = focus
    ? (content.match(/^##\s+.+$/gm) ?? []).some((h) => h.toLowerCase().includes(focus))
    : false;
  const { sentences, words: sentenceWords } = countSentences(content);
  const avgSentence = sentences > 0 ? sentenceWords / sentences : 0;

  const checks: SeoCheck[] = [];
  const add = (
    id: string,
    label: string,
    status: SeoCheckStatus,
    detail: string,
  ) => checks.push({ id, label, status, detail });

  // Title length — 50–60 is the snippet sweet spot.
  if (title.length >= 50 && title.length <= 60)
    add("title-length", "Title length", "pass", `${title.length} characters — in the 50–60 sweet spot.`);
  else if (title.length >= 30 && title.length <= 70)
    add("title-length", "Title length", "warn", `${title.length} characters — aim for 50–60 so it fits search results.`);
  else
    add("title-length", "Title length", "fail", title.length === 0 ? "No title yet." : `${title.length} characters — aim for 50–60 so it fits search results.`);

  // Excerpt / meta description — 120–160.
  if (excerpt.length >= 120 && excerpt.length <= 160)
    add("excerpt-length", "Meta description", "pass", `${excerpt.length} characters — in the 120–160 sweet spot.`);
  else if (excerpt.length >= 100 && excerpt.length <= 200)
    add("excerpt-length", "Meta description", "warn", `${excerpt.length} characters — aim for 120–160.`);
  else
    add("excerpt-length", "Meta description", "fail", excerpt.length === 0 ? "No excerpt yet — search results will use page text." : `${excerpt.length} characters — aim for 120–160.`);

  // Focus keyword checks — all warn (not fail) when no keyword is set, so
  // a post without a keyword is never scored as broken for that reason.
  if (!focus) {
    add("focus-keyword", "Focus keyword", "warn", "Set a focus keyword to check title, slug and headings against it.");
  } else {
    const inTitle = title.toLowerCase().includes(focus);
    add(
      "keyword-title",
      "Keyword in title",
      inTitle ? "pass" : "fail",
      inTitle ? `“${input.focusKeyword.trim()}” is in the title.` : `Add “${input.focusKeyword.trim()}” to the title.`,
    );
    const slugHas = slug.toLowerCase().includes(focus.replace(/\s+/g, "-"));
    add(
      "keyword-slug",
      "Keyword in slug",
      slugHas ? "pass" : "warn",
      slugHas ? "The slug contains the keyword." : "Consider working the keyword into the slug.",
    );
    const inFirst = firstParagraph.toLowerCase().includes(focus);
    add(
      "keyword-first-para",
      "Keyword in first paragraph",
      inFirst ? "pass" : "warn",
      inFirst ? "The first paragraph mentions the keyword." : "Mention the keyword in the first paragraph.",
    );
    add(
      "keyword-h2",
      "Keyword in a heading",
      h2WithFocus ? "pass" : "warn",
      h2WithFocus ? "At least one H2 contains the keyword." : "Use the keyword in at least one H2 heading.",
    );
  }

  // Word count bands.
  if (words >= 600)
    add("word-count", "Word count", "pass", `${words.toLocaleString()} words — substantial.`);
  else if (words >= 300)
    add("word-count", "Word count", "warn", `${words.toLocaleString()} words — aim for 600+ for a full guide.`);
  else
    add("word-count", "Word count", "fail", words === 0 ? "No content yet." : `${words.toLocaleString()} words — aim for 600+ for a full guide.`);

  // Structure.
  add(
    "headings",
    "Subheadings",
    headings >= 1 ? "pass" : "fail",
    headings >= 1 ? `${headings} H2/H3 subheading${headings === 1 ? "" : "s"} — good structure.` : "Add at least one H2 subheading to break the text up.",
  );

  // Internal links.
  if (internalLinks >= 2)
    add("internal-links", "Internal links", "pass", `${internalLinks} links to other pages on this site.`);
  else if (internalLinks === 1)
    add("internal-links", "Internal links", "warn", "Only 1 internal link — add at least one more to a related tool or guide.");
  else
    add("internal-links", "Internal links", "fail", "No internal links — link to the tool and at least one related guide.");

  // Images + alt text.
  if (images === 0)
    add("images", "Images", "warn", "No images — one relevant image with alt text helps readers and search.");
  else if (imagesWithoutAlt === 0)
    add("images", "Images", "pass", `${images} image${images === 1 ? "" : "s"}, all with alt text.`);
  else
    add("images", "Images", "fail", `${imagesWithoutAlt} of ${images} image${images === 1 ? " has" : "s have"} no alt text — describe each image.`);

  // Readability — average sentence length.
  if (sentences === 0)
    add("readability", "Readability", "warn", "No sentences to measure yet.");
  else if (avgSentence <= 20)
    add("readability", "Readability", "pass", `Average sentence ${avgSentence.toFixed(1)} words — easy to read.`);
  else if (avgSentence <= 25)
    add("readability", "Readability", "warn", `Average sentence ${avgSentence.toFixed(1)} words — shorten some sentences.`);
  else
    add("readability", "Readability", "fail", `Average sentence ${avgSentence.toFixed(1)} words — break long sentences up.`);

  // Score: pass = 1, warn = 0.5, fail = 0, weighted equally.
  const points = checks.reduce(
    (sum, c) => sum + (c.status === "pass" ? 1 : c.status === "warn" ? 0.5 : 0),
    0,
  );
  const score = Math.round((points / checks.length) * 100);

  return {
    score,
    checks,
    words,
    readingMinutes: Math.max(1, Math.round(words / 200)),
    chars,
    internalLinks,
    externalLinks,
    images,
    imagesWithoutAlt,
    headings,
  };
}
