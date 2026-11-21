// Batch 29 — dev & text tools: JavaScript Minifier/Beautifier, CSS
// Beautifier, HTML Beautifier, YAML Formatter/Validator, Markdown Editor,
// HTML to Markdown Converter, CSS Box Shadow Generator, ASCII Table
// Reference, JSON to YAML Converter.
//
// All nine are custom components (src/components/batch29-custom-tools.tsx):
// the generic form renderer cannot express a code editor, a live preview
// or a copyable output block. Everything runs in the browser — code and
// text never leave the device. The minifier/beautifier are small
// hand-written tokenizers in src/lib/formatters.ts (no heavy formatter
// library is bundled).
import type { Calc } from "../tool-types";

const CODE_INPUT = (key: string, label: string, def: string) => ({
  key,
  label,
  type: "textarea" as const,
  def,
});

export const batch29DevTools: Calc[] = [
  {
    slug: "javascript-minifier-beautifier",
    name: "JavaScript Minifier/Beautifier",
    category: "Text Tools",
    short: "Minify JavaScript to shrink it, or beautify it back into readable code.",
    keywords:
      "javascript minifier, js minifier, javascript beautifier, js beautifier, minify javascript online, format javascript",
    custom: "javascript-minifier-beautifier",
    popular: true,
    inputs: [
      CODE_INPUT(
        "code",
        "JavaScript code",
        "function greet(name) {\n  // Say hello\n  const message = `Hello, ${name}!`;\n  return message;\n}\n\nconsole.log(greet('world'));",
      ),
    ],
    compute: () => [],
    about:
      "Minify JavaScript to make it smaller for production, or beautify minified code back into readable, indented JavaScript. The minifier strips comments and unneeded whitespace while keeping the code's meaning — it understands strings, template literals, regular expressions and the places where a newline matters, so minified code still runs exactly like the original. The beautifier re-indents code with two-space indentation. Everything runs in your browser; your code is never uploaded.",
    formula: "",
    example:
      "Minifying a 200-byte function with comments removes the comments and extra spaces, typically saving 20–40%. Beautifying the result restores the indentation and line breaks.",
    howToUse: [
      "Paste your JavaScript into the editor (or use the sample).",
      "Choose Minify to shrink it or Beautify to re-format it, then copy the result.",
      "Check the byte count and saving shown under the output.",
    ],
    details: [
      {
        heading: "What the minifier keeps intact",
        body: "Strings, template literals (including ${...} expressions), regular expressions and the newlines that JavaScript's automatic semicolon insertion depends on — for example after return. Minified code is safe to run as-is, but always test minified code before shipping it, as with any build step.",
      },
      {
        heading: "What it is not",
        body: "This is a straightforward minifier, not a full bundler or obfuscator: it does not rename variables, remove dead code or bundle modules. For a production build pipeline, a bundler such as esbuild, Rollup or webpack is still the right tool. This one is for quick one-off jobs and for reading minified code.",
      },
    ],
    tips: [
      "Minify a copy, not your only copy — keep the readable source safe.",
      "Test minified code before deploying it, especially if it uses unusual syntax.",
      "Use Beautify to read a minified file someone else sent you.",
    ],
    faqs: [
      {
        q: "What does a JavaScript minifier do?",
        a: "It removes comments and unnecessary whitespace from JavaScript so the file is smaller and loads faster, without changing what the code does.",
      },
      {
        q: "Is my code uploaded anywhere?",
        a: "No. The minifier and beautifier run entirely in your browser. Your code never leaves your device.",
      },
      {
        q: "Will minified code still work?",
        a: "Yes — the minifier preserves strings, template literals, regular expressions and the line breaks that matter for automatic semicolon insertion. As with any build step, test the result before shipping.",
      },
      {
        q: "What is the difference between minify and beautify?",
        a: "Minify shrinks code for production; beautify does the opposite, re-indenting compressed code so a human can read it again.",
      },
    ],
  },
  {
    slug: "css-beautifier",
    name: "CSS Beautifier",
    category: "Text Tools",
    short: "Format compressed or messy CSS into clean, indented stylesheets.",
    keywords: "css beautifier, format css, css formatter, beautify css online, pretty print css",
    custom: "css-beautifier",
    inputs: [
      CODE_INPUT(
        "code",
        "CSS code",
        ".card{padding:16px;border:1px solid #ddd;border-radius:8px}.card h2{margin:0 0 8px;font-size:20px}@media (max-width:600px){.card{padding:12px}}",
      ),
    ],
    compute: () => [],
    about:
      "Format compressed or messy CSS into a clean stylesheet with two-space indentation: one rule per block, one declaration per line, and media queries nested properly. Paste minified CSS from a production file, or a stylesheet you inherited, and get readable code back in one click. Everything runs in your browser — your code is never uploaded.",
    formula: "",
    example:
      "Beautifying `.card{padding:16px;border:1px solid #ddd}` produces a .card block with each declaration on its own indented line.",
    howToUse: [
      "Paste your CSS into the editor (or use the sample).",
      "Click Beautify — the formatted stylesheet appears below.",
      "Copy it and paste it into your project.",
    ],
    details: [
      {
        heading: "What it formats",
        body: "Rules, declarations, nested blocks such as @media queries, and CSS comments, which are kept on their own lines. Declaration values are spaced as `property: value`. Selectors are left exactly as written — only the layout changes.",
      },
      {
        heading: "What it does not do",
        body: "It does not validate your CSS, remove unused rules, or change any values. A declaration that was wrong stays wrong, just easier to read. For validation, check the stylesheet against the CSS specification or your browser's developer tools.",
      },
    ],
    tips: [
      "Beautify a minified production file to understand what it does before editing it.",
      "Keep your source CSS readable and let a build step minify it for production.",
      "Comments are preserved, so notes in the original CSS survive formatting.",
    ],
    faqs: [
      {
        q: "What does a CSS beautifier do?",
        a: "It re-formats CSS with consistent indentation and line breaks — one rule per block, one declaration per line — so compressed or messy stylesheets become readable.",
      },
      {
        q: "Does it change my CSS values?",
        a: "No. Only the layout changes: spacing, indentation and line breaks. Selectors, properties and values stay exactly as written.",
      },
      {
        q: "Is my CSS uploaded anywhere?",
        a: "No. Formatting runs entirely in your browser.",
      },
    ],
  },
  {
    slug: "html-beautifier",
    name: "HTML Beautifier",
    category: "Text Tools",
    short: "Format messy or minified HTML into clean, indented markup.",
    keywords: "html beautifier, format html, html formatter, beautify html online, pretty print html",
    custom: "html-beautifier",
    inputs: [
      CODE_INPUT(
        "code",
        "HTML code",
        "<div class=\"card\"><h2>Hello</h2><p>This is a <strong>sample</strong> page.</p><ul><li>One</li><li>Two</li></ul></div>",
      ),
    ],
    compute: () => [],
    about:
      "Format messy or minified HTML into clean markup with two-space indentation: block elements nested properly, inline elements kept on the text line so sentences are not broken apart. Paste HTML from a page, a template or an email and get readable markup back in one click. Everything runs in your browser — your code is never uploaded.",
    formula: "",
    example:
      "Beautifying `<div><h2>Hello</h2><p>Text</p></div>` puts the div, the heading and the paragraph on separate indented lines.",
    howToUse: [
      "Paste your HTML into the editor (or use the sample).",
      "Click Beautify — the formatted markup appears below.",
      "Copy it and paste it into your project.",
    ],
    details: [
      {
        heading: "How it indents",
        body: "Block elements (div, section, ul, table and friends) open a new indented line; inline elements (a, strong, em, span, code) stay on the same line as the surrounding text so sentences are not split. Void elements such as img, br and input are left as they are, and comments and the doctype get their own lines.",
      },
      {
        heading: "What it does not do",
        body: "It does not validate your HTML, close unclosed tags, or change attributes and text. Broken markup stays broken, just easier to read — run it through a validator if the page misbehaves.",
      },
    ],
    tips: [
      "Beautify a minified page source to understand its structure before editing it.",
      "Inline elements stay inline, so text with links and bold words is not split across lines.",
      "Copy the result straight into your editor — the indentation is two spaces throughout.",
    ],
    faqs: [
      {
        q: "What does an HTML beautifier do?",
        a: "It re-formats HTML with consistent indentation — block elements nested on their own lines — so compressed or messy markup becomes readable.",
      },
      {
        q: "Does it change my HTML?",
        a: "No. Only the layout changes: indentation and line breaks. Tags, attributes and text stay exactly as written.",
      },
      {
        q: "Is my HTML uploaded anywhere?",
        a: "No. Formatting runs entirely in your browser.",
      },
    ],
  },
  {
    slug: "yaml-formatter-validator",
    name: "YAML Formatter/Validator",
    category: "Web & Developer",
    short: "Format and validate YAML — clean indentation, clear error messages.",
    keywords: "yaml formatter, yaml validator, format yaml, validate yaml online, yaml lint, pretty print yaml",
    custom: "yaml-formatter-validator",
    inputs: [
      CODE_INPUT(
        "code",
        "YAML",
        "site:\n  name: My Site\n  url: https://example.com\nfeatures:\n  - blog\n  - tools\npublished: true",
      ),
    ],
    compute: () => [],
    about:
      "Format and validate YAML in one place: paste YAML and get it back with clean two-space indentation, or a clear error message pointing at the problem when it does not parse. YAML's indentation is its structure, so a single misplaced space breaks a file — this tool catches that before the file reaches your app. Everything runs in your browser; your content is never uploaded.",
    formula: "",
    example:
      "Formatting `site: {name: My Site}` expands the flow style into indented lines. A tab-indented line returns an error naming the line, because YAML does not allow tabs for indentation.",
    howToUse: [
      "Paste your YAML into the editor (or use the sample).",
      "Click Format & Validate — formatted YAML appears, or an error message explains the problem.",
      "Copy the formatted result.",
    ],
    details: [
      {
        heading: "Common YAML mistakes it catches",
        body: "Tabs used for indentation (YAML requires spaces), inconsistent indentation, unquoted values containing a colon, and duplicate keys. The error message names the line and the reason, which is usually enough to fix the file.",
      },
      {
        heading: "Where YAML shows up",
        body: "Configuration files, CI pipelines, Docker Compose, Kubernetes manifests, and front matter in Markdown files. Any of them breaks on a small indentation error, which is why validating before saving is worth the seconds it takes.",
      },
    ],
    tips: [
      "Use spaces, never tabs — YAML forbids tabs for indentation.",
      "Quote values that contain a colon or start with a special character.",
      "Validate a config file here before pasting it into your project.",
    ],
    faqs: [
      {
        q: "What does a YAML validator do?",
        a: "It parses your YAML and reports errors — bad indentation, tabs, duplicate keys — with the line number, so you can fix the file before it breaks your app.",
      },
      {
        q: "Why does YAML care about indentation?",
        a: "In YAML, indentation is the structure: it shows which values belong to which key. A line indented one space too far belongs to a different key, or to no key at all.",
      },
      {
        q: "Is my YAML uploaded anywhere?",
        a: "No. Parsing and formatting run entirely in your browser.",
      },
    ],
  },
  {
    slug: "markdown-editor",
    name: "Markdown Editor",
    category: "Text Tools",
    short: "Write Markdown and see the formatted result live, side by side.",
    keywords: "markdown editor, online markdown editor, markdown preview, write markdown, markdown live preview",
    custom: "markdown-editor",
    popular: true,
    inputs: [
      CODE_INPUT(
        "code",
        "Markdown",
        "# Hello\n\nWrite **bold** text, *italic* text, and [links](/bmi-calculator).\n\n- One\n- Two\n- Three\n\n> A quote to remember.",
      ),
    ],
    compute: () => [],
    about:
      "Write Markdown and watch the formatted result appear live beside it — headings, bold and italic text, links, lists, quotes and code, rendered as you type. It is the quick way to draft a README, a blog post or notes without opening a full editor. This is a public writing tool for visitors; it is separate from the site's admin post editor. Everything runs in your browser and nothing you type is saved or uploaded.",
    formula: "",
    example:
      "Typing `# Hello` shows a large heading in the preview; `**bold**` shows bold text; `- One` starts a bulleted list.",
    howToUse: [
      "Type or paste Markdown in the editor on the left.",
      "Read the formatted result in the preview on the right.",
      "Copy the Markdown (or the preview) when you are done.",
    ],
    details: [
      {
        heading: "What Markdown is supported",
        body: "Headings (#, ##, ###), bold and italic, links (including links to pages on this site), lists, blockquotes, inline code and fenced code blocks, horizontal rules and images. Raw HTML in the input is shown as text, never rendered — the preview is safe by construction.",
      },
      {
        heading: "Where Markdown is useful",
        body: "README files, documentation, blog posts, notes and messages on platforms that accept Markdown. It is plain text, so it works in any editor and in version control, and it converts cleanly to HTML when published.",
      },
    ],
    tips: [
      "Start a line with # for a heading, - for a bullet, > for a quote.",
      "Wrap text in ** for bold and * for italic.",
      "Links look like [text](/bmi-calculator).",
    ],
    faqs: [
      {
        q: "What is Markdown?",
        a: "A plain-text way to write formatted documents: # makes a heading, **bold** makes bold text, - makes a list item. It converts to HTML when published.",
      },
      {
        q: "Is anything I type saved?",
        a: "No. The editor is a public tool — what you type stays in your browser and is never saved or uploaded.",
      },
      {
        q: "Is this the same as the site's blog editor?",
        a: "No. This is a public writing tool for visitors. The site's blog posts are edited in the admin panel, which is a separate editor.",
      },
    ],
  },
  {
    slug: "html-to-markdown-converter",
    name: "HTML to Markdown Converter",
    category: "Text Tools",
    short: "Turn HTML into clean Markdown — headings, links, lists and code.",
    keywords:
      "html to markdown, convert html to markdown, html to md converter, html to markdown online",
    custom: "html-to-markdown-converter",
    inputs: [
      CODE_INPUT(
        "code",
        "HTML",
        "<h1>Hello</h1><p>This is a <strong>sample</strong> with a <a href=\"https://example.com\">link</a>.</p><ul><li>One</li><li>Two</li></ul>",
      ),
    ],
    compute: () => [],
    about:
      "Turn HTML into clean Markdown: headings become #, bold becomes **, links become Markdown links, lists become -, and code blocks become fenced blocks. It is the quick way to convert a page or a snippet into text you can paste into a README, a blog post or documentation. Scripts and styles are dropped, and the rest of the markup is stripped. Everything runs in your browser; your content is never uploaded.",
    formula: "",
    example:
      "Converting `<h1>Hello</h1><p>A <a href=\"https://example.com\">link</a>.</p>` gives `# Hello` followed by a paragraph with a link to example.com.",
    howToUse: [
      "Paste your HTML into the editor (or use the sample).",
      "Click Convert — the Markdown appears below.",
      "Copy it into your document.",
    ],
    details: [
      {
        heading: "What converts",
        body: "Headings h1–h6, paragraphs, bold and italic, links and images, unordered and ordered lists, inline code and fenced code blocks, blockquotes and horizontal rules. Tables and complex layouts are simplified to their text — Markdown has no native table support in this converter.",
      },
      {
        heading: "What is dropped",
        body: "Script and style blocks are removed entirely, and any tag the converter does not recognise is stripped while its text is kept. The result is plain, portable Markdown.",
      },
    ],
    tips: [
      "Convert a copied web page snippet before pasting it into a Markdown document.",
      "Check links after converting — their addresses are preserved as Markdown links.",
      "Code blocks come through as fenced blocks, ready for a README.",
    ],
    faqs: [
      {
        q: "What does HTML to Markdown do?",
        a: "It converts HTML markup into Markdown text: headings become #, links become Markdown links, lists become -, and so on — so the content works in any Markdown document.",
      },
      {
        q: "Are scripts and styles kept?",
        a: "No. Script and style blocks are removed, and unrecognised tags are stripped while their text is kept.",
      },
      {
        q: "Is my HTML uploaded anywhere?",
        a: "No. Conversion runs entirely in your browser.",
      },
    ],
  },
  {
    slug: "css-box-shadow-generator",
    name: "CSS Box Shadow Generator",
    category: "Web & Developer",
    short: "Design a box shadow with sliders and copy the CSS.",
    keywords:
      "css box shadow generator, box shadow css, shadow generator, css shadow maker, box-shadow tool",
    custom: "css-box-shadow-generator",
    inputs: [
      CODE_INPUT("code", "Preview note", "Adjust the sliders and watch the shadow change on the preview box."),
    ],
    compute: () => [],
    about:
      "Design a box shadow with sliders and copy the finished CSS: horizontal and vertical offset, blur, spread, colour and opacity, plus an inset option for inner shadows. A live preview shows the shadow on a sample box as you adjust it, so you can see the effect before pasting the code into your stylesheet. Everything runs in your browser.",
    formula: "box-shadow: offset-x offset-y blur-radius spread-radius color — for example, box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15).",
    example:
      "An offset of 0 horizontal and 8 vertical, with 24 blur and a black shadow at 20% opacity, gives box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2).",
    howToUse: [
      "Move the sliders for offset, blur, spread and opacity, and pick a colour.",
      "Watch the preview box update live.",
      "Copy the generated box-shadow CSS into your stylesheet.",
    ],
    details: [
      {
        heading: "The parts of a shadow",
        body: "Offset-x moves the shadow left or right, offset-y moves it up or down, blur softens the edge, spread grows or shrinks the shadow, and opacity controls how dark it is. A small blur with a small offset makes a crisp edge for cards; a large blur with a large offset makes a soft, floating look.",
      },
      {
        heading: "Inset shadows",
        body: "Turn on inset and the shadow draws inside the box instead of outside it — useful for pressed buttons, input fields and wells. The same sliders apply; only the direction changes.",
      },
    ],
    tips: [
      "Subtle shadows (low opacity, moderate blur) look more professional than heavy ones.",
      "Use a larger blur for a floating effect and a smaller blur for a crisp card edge.",
      "Copy the CSS straight from the output box — it is ready to paste.",
    ],
    faqs: [
      {
        q: "What is box-shadow in CSS?",
        a: "A CSS property that draws a shadow around an element: box-shadow: offset-x offset-y blur spread colour. It is how cards, buttons and panels get depth.",
      },
      {
        q: "What does inset do?",
        a: "It draws the shadow inside the element instead of outside it — the look of a pressed button or an input field.",
      },
      {
        q: "Can I use the generated CSS anywhere?",
        a: "Yes. The output is standard CSS and works in every modern browser.",
      },
    ],
  },
  {
    slug: "ascii-table-reference",
    name: "ASCII Table Reference",
    category: "Text Tools",
    short: "Every ASCII character 0–127 with decimal, hex and name.",
    keywords: "ascii table, ascii chart, ascii codes, ascii characters, ascii reference, ascii decimal hex",
    custom: "ascii-table-reference",
    inputs: [CODE_INPUT("code", "Search", "Type a character, name or number to filter the table.")],
    compute: () => [],
    about:
      "Every ASCII character from 0 to 127 with its decimal code, hexadecimal code, character and name — control characters (NUL, TAB, LF, ESC and the rest), punctuation, digits, upper- and lower-case letters, and DEL. Search by character, name or number to find a code in seconds. It is a reference, not a calculator: the table is fixed, so there is nothing to calculate.",
    formula: "",
    example:
      "The letter A is decimal 65 (hex 41); a newline (LF) is decimal 10; the space character is decimal 32.",
    howToUse: [
      "Scroll the table or type in the search box to filter it.",
      "Read the decimal and hex codes for any character.",
      "Use the codes in your code or documents wherever a character code is needed.",
    ],
    details: [
      {
        heading: "What ASCII is",
        body: "ASCII is the original 7-bit character set: 128 characters, each with a number from 0 to 127. The first 32 are control characters (things like TAB, LF for newline, and ESC), 32 is the space, 48–57 are the digits, 65–90 are A–Z, 97–122 are a–z, and 127 is DEL. Everything beyond 127 is not ASCII — it belongs to other encodings such as UTF-8.",
      },
      {
        heading: "Why the codes matter",
        body: "Character codes show up in programming (for example, checking whether a key press is Enter, code 13), in URLs and data formats (percent-encoding uses hex codes), and in old file formats. Knowing that A is 65 and a is 97 explains why sorting is case-sensitive in most systems.",
      },
    ],
    tips: [
      "Search for a name like TAB or a number like 65 to jump straight to it.",
      "Control characters 0–31 do not print — their names are shown instead.",
      "Hex codes are the same numbers in base 16, used in URLs and colour codes.",
    ],
    faqs: [
      {
        q: "What is ASCII?",
        a: "A 7-bit character set with 128 characters — control characters, punctuation, digits and letters — each with a number from 0 to 127. It is the basis of text in computing.",
      },
      {
        q: "What is the ASCII code for A?",
        a: "65 in decimal, 41 in hexadecimal. Lowercase a is 97 (61 in hex).",
      },
      {
        q: "Why are there control characters?",
        a: "The first 32 codes control devices and text flow rather than printing a character — TAB moves to the next tab stop, LF starts a new line, ESC starts an escape sequence.",
      },
    ],
  },
  {
    slug: "json-to-yaml-converter",
    name: "JSON to YAML Converter",
    category: "Web & Developer",
    short: "Convert JSON to YAML — paste JSON, get clean YAML back.",
    keywords: "json to yaml, convert json to yaml, json to yaml converter, json to yml online",
    custom: "json-to-yaml-converter",
    inputs: [
      CODE_INPUT("code", "JSON", '{\n  "site": {\n    "name": "My Site",\n    "url": "https://example.com"\n  },\n  "features": ["blog", "tools"],\n  "published": true\n}'),
    ],
    compute: () => [],
    about:
      "Convert JSON to YAML: paste JSON and get the same data back as clean, two-space-indented YAML — the format configuration files, CI pipelines and Docker Compose expect. It is the reverse of the YAML to JSON converter: together they let you move data between the two formats in either direction. Invalid JSON returns a clear error instead of a half-converted result. Everything runs in your browser; your data is never uploaded.",
    formula: "",
    example:
      "Converting `{\"site\": {\"name\": \"My Site\"}}` gives `site:` followed by `  name: My Site`.",
    howToUse: [
      "Paste your JSON into the editor (or use the sample).",
      "Click Convert — the YAML appears below.",
      "Copy it into your configuration file.",
    ],
    details: [
      {
        heading: "What converts cleanly",
        body: "Objects become indented mappings, arrays become dash lists, strings stay plain unless they need quoting, and numbers and booleans carry over unchanged. Values that would be ambiguous in YAML (a string that looks like a number, for example) are quoted automatically.",
      },
      {
        heading: "When to use YAML instead of JSON",
        body: "YAML is easier to read and write by hand, which is why configuration files use it. JSON is easier for machines to produce and parse, which is why APIs use it. Converting between them is a routine step when moving settings between systems.",
      },
    ],
    tips: [
      "Validate the JSON first — an error message names the problem.",
      "Use the YAML to JSON converter to go the other way.",
      "Check quoted values after converting — strings that look like numbers are quoted for safety.",
    ],
    faqs: [
      {
        q: "What does JSON to YAML do?",
        a: "It converts JSON data into YAML — the same data, written with indentation instead of braces, which is easier to read and is what configuration files use.",
      },
      {
        q: "Is my data uploaded anywhere?",
        a: "No. Conversion runs entirely in your browser.",
      },
      {
        q: "How do I convert YAML back to JSON?",
        a: "Use the YAML to JSON converter on this site — the two tools are a pair.",
      },
    ],
  },
];
