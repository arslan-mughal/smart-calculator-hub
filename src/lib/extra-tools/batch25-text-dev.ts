// Batch 25 — text tools and developer tools: formatter, accent removal,
// prefix/suffix, phone extraction, HTML compression, YAML→JSON, SHA-256.
import type { Calc } from "../tool-types";
import { fmt } from "../calculators";
import { N, lines, words } from "./shared";
import yaml from "js-yaml";

const m = (n: number, d = 2) => fmt(n, d);

/** Title Case: capitalise the first letter of each word, except small
 *  words (a, an, the, and, or, of, in, on, to, for) unless first/last. */
function titleCase(text: string): string {
  const small = new Set(["a", "an", "the", "and", "or", "but", "of", "in", "on", "to", "for", "at", "by"]);
  const parts = text.toLowerCase().split(/(\s+)/);
  const wordIndexes = parts
    .map((p, i) => (/^\S+$/.test(p) ? i : -1))
    .filter((i) => i >= 0);
  const first = wordIndexes[0];
  const last = wordIndexes.at(-1);
  return parts
    .map((part, i) => {
      if (!/^\S+$/.test(part)) return part;
      const clean = part.replace(/[^a-z0-9']/gi, "");
      if (i !== first && i !== last && small.has(clean.toLowerCase())) return part.toLowerCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}

function sentenceCase(text: string): string {
  const lower = text.toLowerCase();
  return lower.replace(/(^\s*[a-z]|[.!?]\s+[a-z])/g, (s) => s.toUpperCase());
}

/** Minify HTML outside <pre>, <script> and <style> blocks, which are
 *  preserved verbatim. Strips comments and collapses whitespace. */
function minifyHtml(input: string): string {
  const preserved: string[] = [];
  const stash = (s: string) => {
    preserved.push(s);
    return `\u0000${preserved.length - 1}\u0000`;
  };
  let out = input.replace(/<(pre|script|style)(\s[^>]*)?>[\s\S]*?<\/\1>/gi, stash);
  out = out.replace(/<!--[\s\S]*?-->/g, "");
  out = out.replace(/>\s+</g, "><");
  out = out.replace(/\s{2,}/g, " ");
  out = out
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("");
  out = out.replace(/\u0000(\d+)\u0000/g, (_, i) => preserved[Number(i)] ?? "");
  return out.trim();
}

const PHONE_RE = /(?:\+\d{1,3}[\s().-]*)?(?:\(?\d{2,4}\)?[\s().-]*)?\d{3,4}[\s().-]*\d{3,4}/g;

function extractPhones(text: string): string[] {
  const found: string[] = [];
  for (const match of text.matchAll(PHONE_RE)) {
    const digits = match[0].replace(/\D/g, "");
    if (digits.length >= 7 && digits.length <= 15 && !found.includes(match[0].trim())) {
      found.push(match[0].trim());
    }
  }
  return found;
}

export const batch25TextDevTools: Calc[] = [
  {
    slug: "text-formatter",
    name: "Text Formatter",
    category: "Text Tools",
    short: "Change text case — UPPERCASE, lowercase, Title Case and Sentence case.",
    keywords:
      "text formatter, change case, uppercase converter, lowercase converter, title case converter, sentence case converter, text case converter",
    inputs: [
      {
        key: "text",
        label: "Text to format",
        type: "textarea",
        def: "the quick brown fox jumps over the lazy dog. it was a bright cold day in april.",
      },
      {
        key: "mode",
        label: "Format",
        type: "select",
        def: "title",
        options: [
          { v: "upper", l: "UPPERCASE" },
          { v: "lower", l: "lowercase" },
          { v: "title", l: "Title Case" },
          { v: "sentence", l: "Sentence case" },
          { v: "caps", l: "Capitalise Each Word" },
        ],
      },
    ],
    compute: (v) => {
      const text = String(v.text ?? "");
      let out: string;
      switch (v.mode) {
        case "upper":
          out = text.toUpperCase();
          break;
        case "lower":
          out = text.toLowerCase();
          break;
        case "title":
          out = titleCase(text);
          break;
        case "sentence":
          out = sentenceCase(text);
          break;
        default:
          out = text.replace(/\b\w/g, (c) => c.toUpperCase());
      }
      return [
        { label: "Formatted text", value: out },
        { label: "Words", value: fmt(words(text).length, 0) },
        { label: "Characters", value: fmt(text.length, 0) },
      ];
    },
    about:
      "Change the capitalisation of any text in one click: UPPERCASE, lowercase, Title Case, Sentence case, or Capitalise Each Word. Paste in a heading, a title, a paragraph or a whole document and get the reformatted version instantly — no retyping, no find-and-replace. Title Case follows the usual style-guide rule of leaving small words (a, an, the, and, of, in) lowercase unless they start or end the title.",
    formula: "",
    example:
      "“the quick brown fox jumps over the lazy dog” in Title Case becomes “The Quick Brown Fox Jumps Over the Lazy Dog”. The same sentence in UPPERCASE is “THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG”.",
    howToUse: [
      "Paste or type the text you want to reformat.",
      "Choose the case: UPPERCASE, lowercase, Title Case, Sentence case or Capitalise Each Word.",
      "Copy the formatted text from the result — the word and character counts are shown below it.",
    ],
    details: [
      {
        heading: "When to use each case",
        body: "UPPERCASE is for warnings, labels and emphasis — never for long passages, because it is harder to read. Title Case is the standard for headings, book titles and article titles. Sentence case (first word capitalised, the rest lowercase) is the norm for body text and for most website headings today. Lowercase is mostly for code, file names and identifiers, where capitals can break things.",
      },
      {
        heading: "How Title Case handles small words",
        body: "Style guides disagree on the details, but the common rule is: capitalise every word except a, an, the, and, but, or, of, in, on, to, for and similar short words — unless one of them is the first or last word of the title. This formatter follows that rule, so “The Lord of the Rings” stays correct, and “A Tale of Two Cities” keeps its leading A.",
      },
    ],
    tips: [
      "For headings, Title Case is the safe choice; for body text, use Sentence case.",
      "Check proper nouns after formatting — a formatter cannot know that 'iPhone' needs a lowercase i.",
      "Use the Word Counter for a fuller breakdown of the same text.",
    ],
    faqs: [
      {
        q: "What is Title Case?",
        a: "Capitalising the first letter of every major word in a title, while leaving small words (a, an, the, and, of, in) lowercase unless they start or end the title. For example: 'The Quick Brown Fox Jumps Over the Lazy Dog'.",
      },
      {
        q: "What is the difference between Title Case and Capitalise Each Word?",
        a: "Title Case leaves small words lowercase in the middle of a title; Capitalise Each Word capitalises every word without exception. Use Title Case for published headings and Capitalise Each Word for labels and lists.",
      },
      {
        q: "Does Sentence case change proper nouns?",
        a: "It lowercases everything except the first letter of each sentence, so a name like 'London' would become 'london'. Check proper nouns after formatting and fix them by hand.",
      },
    ],
  },
  {
    slug: "remove-accents",
    name: "Remove Accents",
    category: "Text Tools",
    short: "Strip accents and diacritics — café becomes cafe, résumé becomes resume.",
    keywords:
      "remove accents, remove diacritics, strip accents, accent remover, remove accents from text, normalize text",
    inputs: [
      {
        key: "text",
        label: "Text with accents",
        type: "textarea",
        def: "Café résumé naïve façade — São Paulo, Zürich, Łódź.",
      },
    ],
    compute: (v) => {
      const text = String(v.text ?? "");
      const stripped = text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ł/g, "l")
        .replace(/Ł/g, "L")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/ø/g, "o")
        .replace(/Ø/g, "O")
        .replace(/æ/g, "ae")
        .replace(/Æ/g, "AE")
        .replace(/œ/g, "oe")
        .replace(/Œ/g, "OE")
        .replace(/ß/g, "ss");
      // Length does not change when a mark is dropped (é is one code unit
      // before and after), so count the marks and special letters instead.
      const combining = (text.normalize("NFD").match(/[\u0300-\u036f]/g) ?? []).length;
      const special = (text.match(/[łŁđĐøØæÆœŒß]/g) ?? []).length;
      const removed = combining + special;
      return [
        { label: "Without accents", value: stripped },
        { label: "Characters changed", value: fmt(removed, 0) },
        { label: "Original length", value: fmt(text.length, 0) },
      ];
    },
    about:
      "Remove accents and diacritics from text: café becomes cafe, résumé becomes resume, naïve becomes naive. It handles the common Latin accents — acute, grave, circumflex, tilde, umlaut and cedilla — plus special letters such as ø, æ, œ, ł and ß, which are replaced with their closest plain equivalents. The result is plain ASCII-friendly text for file names, URLs, database fields and systems that cannot handle accented characters.",
    formula: "",
    example:
      "“Café résumé naïve façade — São Paulo, Zürich, Łódź” becomes “Cafe resume naive facade — Sao Paulo, Zurich, Lodz”.",
    howToUse: [
      "Paste or type the text with accents.",
      "Read the version without accents — the headline result.",
      "Check how many characters were changed, then copy the result.",
    ],
    details: [
      {
        heading: "How it works",
        body: "Accented letters in Unicode are often a base letter plus a combining mark (é is e + ´). Splitting them apart (Unicode normalisation form NFD) and dropping the marks leaves the plain letter. A few letters have no decomposed form — ł, ø, æ, œ and ß — so they are replaced directly: ł becomes l, ø becomes o, æ becomes ae, œ becomes oe and ß becomes ss.",
      },
      {
        heading: "When you need plain text",
        body: "Accents break things in surprising places: file names on old systems, URLs, email addresses, database columns with the wrong collation, and search indexes that treat 'resume' and 'résumé' as different words. Stripping accents is also the standard first step in text search and matching — compare the stripped versions and 'Zürich' matches 'Zurich'.",
      },
    ],
    tips: [
      "For URLs, remove accents first, then replace spaces with hyphens and lowercase everything.",
      "The meaning of a word can change without its accent (résumé vs resume), so check the result before publishing.",
      "For search, compare accent-stripped versions of both the query and the text.",
    ],
    faqs: [
      {
        q: "What is a diacritic?",
        a: "A mark added to a letter that changes its sound — the acute accent in café, the tilde in São, the umlaut in Zürich. This tool removes those marks and leaves the plain base letter.",
      },
      {
        q: "Does it work for non-Latin scripts?",
        a: "No — it handles Latin-based alphabets (French, Spanish, German, Polish, Portuguese and similar). Cyrillic, Greek, Arabic and Asian scripts are left unchanged.",
      },
      {
        q: "What happens to ß, ø and æ?",
        a: "They have no plain-letter decomposition, so they are replaced with their closest equivalents: ß becomes ss, ø becomes o, and æ becomes ae.",
      },
    ],
  },
  {
    slug: "add-prefix-suffix",
    name: "Add Prefix and Suffix",
    category: "Text Tools",
    short: "Add text to the start or end of every line — for lists, code and data.",
    keywords:
      "add prefix suffix, add prefix to each line, add suffix to lines, prefix suffix generator, add text to beginning of each line",
    inputs: [
      {
        key: "text",
        label: "Lines (one item per line)",
        type: "textarea",
        def: "apple\nbanana\ncherry",
      },
      { key: "prefix", label: "Prefix", type: "text", def: "• " },
      { key: "suffix", label: "Suffix", type: "text", def: "" },
    ],
    compute: (v) => {
      const prefix = String(v.prefix ?? "");
      const suffix = String(v.suffix ?? "");
      const ls = lines(v.text).filter((l) => l.trim() !== "");
      const out = ls.map((l) => `${prefix}${l}${suffix}`).join("\n");
      return [
        { label: "With prefix / suffix", value: out },
        { label: "Lines processed", value: fmt(ls.length, 0) },
      ];
    },
    about:
      "Add the same text to the start (prefix) or end (suffix) of every line at once. Paste a list — one item per line — and the tool wraps each line for you: bullet points, quotes around values, commas for code, HTML tags, file paths, or anything else you need repeated. Empty lines are skipped, and the original line order is preserved.",
    formula: "",
    example:
      "With the prefix “• ” the lines apple, banana, cherry become “• apple”, “• banana”, “• cherry”. With the prefix '\"' and the suffix '\",' the same lines become '\"apple\",', '\"banana\",', '\"cherry\",' — ready to paste into code.",
    howToUse: [
      "Paste your list, one item per line.",
      "Enter the prefix (added to the start of each line) and the suffix (added to the end).",
      "Copy the result — empty lines are skipped automatically.",
    ],
    details: [
      {
        heading: "What it is used for",
        body: "The most common uses are wrapping values in quotes for code (\"apple\", \"banana\"), adding commas to lists, prefixing file paths with a folder name, adding bullet characters or markdown list markers, and wrapping lines in HTML tags. Anything you would otherwise do by hand, line by line, is a candidate — the tool does in one click what would take minutes of repetitive editing.",
      },
      {
        heading: "Working with code lists",
        body: "To turn a plain list into a JavaScript array, set the prefix to a quote mark and the suffix to a quote mark plus a comma. To make a markdown list, use “- ” as the prefix. To build a SQL IN clause, use a quote as the prefix and “',” as the suffix, then wrap the result in parentheses. The same idea works for CSV rows, CSS selectors and test data.",
      },
    ],
    tips: [
      "One item per line — if your list is comma-separated, use the Sum Calculator's list format or replace commas with new lines first.",
      "Leave the prefix or suffix empty if you only need one of them.",
      "Use the Text Formatter afterwards to fix the case of the whole list.",
    ],
    faqs: [
      {
        q: "What is a prefix and a suffix?",
        a: "A prefix is text added to the beginning of each line; a suffix is text added to the end. For example, the prefix '• ' turns 'apple' into '• apple'.",
      },
      {
        q: "Are empty lines kept?",
        a: "No — blank lines are skipped so the output has no stray prefixes or suffixes on empty lines.",
      },
      {
        q: "Can I add HTML tags to each line?",
        a: "Yes — set the prefix to <li> and the suffix to </li> and each line becomes a list item. Wrap the result in <ul>…</ul> yourself.",
      },
    ],
  },
  {
    slug: "phone-number-extractor",
    name: "Phone Number Extractor",
    category: "Text Tools",
    short: "Find and list every phone number in a block of text.",
    keywords:
      "phone number extractor, extract phone numbers, find phone numbers in text, phone number finder, extract numbers from text",
    inputs: [
      {
        key: "text",
        label: "Text to search",
        type: "textarea",
        def: "Call the office on (415) 555-0132 or mobile +1 650-555-0147. The old fax 415.555.0199 is no longer in service.",
      },
    ],
    compute: (v) => {
      const found = extractPhones(v.text);
      return [
        {
          label: "Phone numbers found",
          value: found.length ? found.join("\n") : "No phone numbers found",
        },
        { label: "Count", value: fmt(found.length, 0) },
      ];
    },
    about:
      "Find every phone number hidden in a block of text — emails, documents, chat logs, web pages — and list them one per line. It recognises common formats: international numbers with a + country code, numbers in parentheses, and numbers separated by spaces, dashes or dots. Anything with 7 to 15 digits that looks like a phone number is picked up; short numbers such as years and order numbers are ignored.",
    formula: "",
    example:
      "From “Call the office on (415) 555-0132 or mobile +1 650-555-0147” it extracts (415) 555-0132 and +1 650-555-0147 — two numbers. The fax number 415.555.0199 is also found, making three in total.",
    howToUse: [
      "Paste the text that contains the phone numbers.",
      "Read the list — one number per line, in the order they appear.",
      "Copy the list into a spreadsheet or contact list.",
    ],
    details: [
      {
        heading: "What counts as a phone number",
        body: "A phone number is a run of 7 to 15 digits, optionally starting with a + country code, with spaces, dashes, dots or parentheses in between. That covers US numbers (415) 555-0132, international numbers such as +44 20 7946 0958, and plain digit strings. Short digit runs — years like 2026, order numbers, prices — are ignored because they have too few digits to be a phone number.",
      },
      {
        heading: "Cleaning up the results",
        body: "Extracted numbers keep their original formatting, so the same number can appear twice in different formats. Before importing into a contacts app, normalise them: strip spaces, dashes and parentheses, and add the country code if it is missing. A quick pass with the Remove Accents tool is not needed here — phone numbers are digits only — but a spreadsheet's find-and-replace will tidy the formatting fast.",
      },
    ],
    tips: [
      "Numbers need at least 7 digits to be picked up — short extensions are ignored.",
      "Check the count against what you expect; a missing number may be split across two lines in the source.",
      "Always confirm a number with the person before using it for anything important.",
    ],
    faqs: [
      {
        q: "Which phone number formats are recognised?",
        a: "International numbers with a + country code, numbers in parentheses like (415) 555-0132, and numbers separated by spaces, dashes or dots. The number needs 7 to 15 digits in total.",
      },
      {
        q: "Why was a number missed?",
        a: "Usually because it has fewer than 7 digits, or because it is split across a line break in the source text. Join the lines first and try again.",
      },
      {
        q: "Does it validate the numbers?",
        a: "No — it finds text that looks like a phone number; it does not check whether the number is real or in service. Always verify before calling or messaging.",
      },
    ],
  },
  {
    slug: "html-compressor",
    name: "HTML Compressor",
    category: "Text Tools",
    short: "Minify HTML — strip comments and extra whitespace, keep the page working.",
    keywords:
      "html compressor, minify html, html minifier, compress html online, html minify tool",
    inputs: [
      {
        key: "text",
        label: "HTML to compress",
        type: "textarea",
        def: "<!DOCTYPE html>\n<html>\n  <head>\n    <!-- Page title -->\n    <title>Hello World</title>\n  </head>\n  <body>\n    <h1>Hello World</h1>\n    <p>Welcome to my page.</p>\n  </body>\n</html>",
      },
    ],
    compute: (v) => {
      const input = String(v.text ?? "");
      const out = minifyHtml(input);
      const saved = input.length > 0 ? ((input.length - out.length) / input.length) * 100 : 0;
      return [
        { label: "Compressed HTML", value: out },
        { label: "Original size", value: `${fmt(input.length, 0)} bytes` },
        { label: "Compressed size", value: `${fmt(out.length, 0)} bytes` },
        { label: "Saved", value: `${fmt(saved, 1)}%` },
      ];
    },
    about:
      "Compress HTML by removing comments and unnecessary whitespace — the spaces, line breaks and indentation that make code readable but that browsers do not need. The compressed page works exactly the same, just with fewer bytes to download. Content inside <pre>, <script> and <style> blocks is left untouched, because whitespace there can change what the page shows or how the code runs.",
    formula: "",
    example:
      "A 179-byte example page with comments and indentation compresses to 126 bytes — about 30% smaller — with the same title, heading and paragraph.",
    howToUse: [
      "Paste the HTML you want to compress.",
      "Read the compressed result and the sizes before and after.",
      "Copy the compressed HTML into your page or build step.",
    ],
    details: [
      {
        heading: "What is removed — and what is kept",
        body: "Comments are stripped, whitespace between tags is collapsed, and leading and trailing space on each line is removed. What is never touched: the contents of <pre> blocks (where spaces are part of the content), <script> blocks (where a removed space can break the code) and <style> blocks (where whitespace can matter in selectors and values). Attribute values and text content are preserved exactly.",
      },
      {
        heading: "Why minify HTML",
        body: "Smaller pages download faster, which matters most on slow connections and for search rankings — page speed is a ranking factor. The saving on a single small page is modest, but across a whole site, and with the browser caching the result, it adds up. For the biggest wins, minify CSS and JavaScript too, and enable compression on your server.",
      },
    ],
    tips: [
      "Keep an uncompressed copy of your source — minified HTML is not meant to be edited.",
      "Test the compressed page in a browser before deploying it.",
      "Minifying works best combined with gzip or Brotli compression on the server.",
    ],
    faqs: [
      {
        q: "Will minifying break my page?",
        a: "It should not. Only comments and whitespace between tags are removed, and <pre>, <script> and <style> contents are preserved. Test the result in a browser before deploying, as with any build step.",
      },
      {
        q: "How much smaller will my HTML get?",
        a: "Typically 10–30%, depending on how much indentation and commenting the original has. Heavily formatted code compresses the most.",
      },
      {
        q: "Should I minify HTML by hand or in a build step?",
        a: "In a build step, for anything bigger than a single page. This tool is for quick one-off jobs and for checking how much a page can shrink.",
      },
    ],
  },
  {
    slug: "yaml-to-json",
    name: "YAML to JSON Converter",
    category: "Web & Developer",
    short: "Convert YAML to JSON — paste YAML, get valid JSON back.",
    keywords:
      "yaml to json, yaml to json converter, convert yaml to json online, yml to json, yaml parser online",
    inputs: [
      {
        key: "text",
        label: "YAML input",
        type: "textarea",
        def: "name: CalcHub\nversion: 2\nfeatures:\n  - calculators\n  - blog\n  - admin\nsettings:\n  theme: light\n  analytics: true",
      },
    ],
    compute: (v) => {
      const input = String(v.text ?? "");
      if (input.trim() === "") return [{ label: "JSON output", value: "—" }];
      try {
        const parsed: unknown = yaml.load(input);
        if (parsed === undefined) return [{ label: "JSON output", value: "Empty document" }];
        return [
          { label: "JSON output", value: JSON.stringify(parsed, null, 2) },
          { label: "Status", value: "Valid YAML" },
        ];
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return [{ label: "Error", value: message.replace(/\s+/g, " ").trim() }];
      }
    },
    about:
      "Convert YAML into JSON: paste YAML in, get pretty-printed JSON out. YAML is the format used for configuration files, CI pipelines and data exchange, and JSON is what most APIs and JavaScript code expect — this tool bridges the two. It handles nested maps, lists, quoted strings, numbers, booleans and nulls. If the YAML has a syntax error, the tool shows the error with its line number instead of guessing.",
    formula: "",
    example:
      "“name: CalcHub, version: 2, features: calculators, blog” becomes {\"name\": \"CalcHub\", \"version\": 2, \"features\": [\"calculators\", \"blog\"]}.",
    howToUse: [
      "Paste your YAML into the input box.",
      "Read the JSON output — it is pretty-printed with two-space indentation.",
      "If there is an error, read the message, fix the line it points to, and try again.",
    ],
    details: [
      {
        heading: "YAML basics",
        body: "YAML uses indentation to show structure: two spaces per level, never tabs. key: value makes a mapping, - item makes a list item, and # starts a comment. Strings usually need no quotes, but quote them if they contain a colon, a # or leading/trailing spaces. Numbers, true/false and null are read as their types, not as strings — so version: 2 becomes the number 2 in JSON, not \"2\".",
      },
      {
        heading: "Common YAML errors",
        body: "The two errors that catch almost everyone are tabs (YAML forbids them — use spaces) and inconsistent indentation (a child line must be indented further than its parent, by the same amount throughout). A colon inside an unquoted string also breaks parsing — “time: 10:30” needs quotes around the value. The error message names the line and column, which is usually enough to find the problem.",
      },
    ],
    tips: [
      "Use spaces, never tabs — YAML forbids tab indentation.",
      "Keep one indentation width (usually two spaces) through the whole file.",
      "Quote strings that contain a colon, a # or special characters.",
    ],
    faqs: [
      {
        q: "What is YAML used for?",
        a: "Mostly configuration: Docker Compose files, GitHub Actions workflows, Kubernetes manifests, and application settings. It is easier for humans to read than JSON, while JSON is easier for programs to parse — hence converting between them.",
      },
      {
        q: "Why does my YAML fail to parse?",
        a: "Almost always tabs or inconsistent indentation. YAML requires spaces and a consistent indent width. A colon inside an unquoted value is the next most common cause — quote the value.",
      },
      {
        q: "Does this support anchors and multi-line strings?",
        a: "Yes — the converter uses a full YAML parser, so anchors (&a), aliases (*a), and block scalars (| and >) all work, not just simple key-value pairs.",
      },
    ],
  },
  {
    slug: "sha256-hash-generator",
    name: "SHA-256 Hash Generator",
    category: "Web & Developer",
    short: "Generate a SHA-256 hash of any text — free, instant and private.",
    keywords:
      "sha256 hash generator, sha256 generator, sha-256 hash calculator, hash text online, sha256 online",
    custom: "sha256-hash-generator",
    inputs: [
      {
        key: "text",
        label: "Text to hash",
        type: "textarea",
        def: "Hello, world!",
      },
    ],
    compute: () => [],
    about:
      "Generate the SHA-256 hash of any text. SHA-256 is a cryptographic hash function: it turns any input into a fixed 64-character hexadecimal fingerprint, and the same input always produces the same hash, while even a one-character change produces a completely different one. It is used to verify file integrity, store passwords safely (with a salt), and sign data. The hashing runs in your browser with the Web Crypto API — your text is never uploaded or stored.",
    formula:
      "SHA-256 processes the input in 512-bit blocks through 64 rounds of mixing, and outputs a 256-bit digest shown as 64 hexadecimal characters. It is a one-way function: you cannot recover the input from the hash.",
    example:
      "The SHA-256 hash of “Hello, world!” is 315f5bdb76d078c43b8ac0064e4a0164612b1fce77c869345bfc94c75894edd3. Change one letter and the hash changes completely.",
    howToUse: [
      "Type or paste the text you want to hash.",
      "The SHA-256 hash appears instantly, in hexadecimal and in Base64.",
      "Copy the hash with the copy button.",
    ],
    details: [
      {
        heading: "What a hash is for",
        body: "A hash is a fingerprint: it lets you check that data has not changed without storing the data itself. Download a file, hash it, and compare with the hash the publisher lists — if they match, the file is intact. Password systems store hashes (with a unique salt per user) instead of passwords, so a leaked database does not expose the passwords. Git uses SHA-1 and now SHA-256 to identify every commit.",
      },
      {
        heading: "Why SHA-256 is trusted",
        body: "SHA-256 is part of the SHA-2 family standardised by NIST and used across the internet — in TLS certificates, Bitcoin, and software signing. No practical attack can reverse it or find two different inputs with the same hash. Short or common inputs are still vulnerable to guessing (an attacker can hash a dictionary and compare), which is why passwords need a salt and a slow hash function such as bcrypt or Argon2 rather than plain SHA-256.",
      },
    ],
    tips: [
      "The same input always gives the same hash — use that to verify downloads.",
      "Never use plain SHA-256 to store passwords; use bcrypt, scrypt or Argon2 with a salt.",
      "Hashing is one-way: you cannot turn a hash back into the original text.",
    ],
    faqs: [
      {
        q: "What is SHA-256?",
        a: "A cryptographic hash function that turns any input into a fixed 256-bit (64 hex character) fingerprint. It is deterministic, one-way, and a tiny change in the input produces a completely different hash.",
      },
      {
        q: "Is SHA-256 secure?",
        a: "Yes, for integrity checking and signatures. For password storage it is not enough on its own — use a slow, salted hash such as bcrypt or Argon2 instead, because plain SHA-256 is too fast for an attacker to brute-force.",
      },
      {
        q: "Is my text uploaded anywhere?",
        a: "No. Hashing runs in your browser using the Web Crypto API, and the text never leaves your device.",
      },
    ],
  },
];
