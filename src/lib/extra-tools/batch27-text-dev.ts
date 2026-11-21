// Batch 27 — text & developer tools: JSON to CSV, CSV to JSON, diff
// checker, image to Base64, meta tag generator. All client-side —
// pasted text and files never leave the browser.
// The diff checker, image converter and meta tag generator are custom
// components (see src/components/batch27-custom-tools.tsx): the generic
// form renderer cannot express a file picker, a highlighted diff or a
// copyable code block.
import type { Calc } from "../tool-types";
import { csvToJson, jsonToCsv } from "../csv";
import { textArea } from "./shared";

export const batch27TextDevTools: Calc[] = [
  {
    slug: "json-to-csv-converter",
    name: "JSON to CSV Converter",
    category: "Web & Developer",
    short: "Convert JSON data to CSV — paste JSON, get a spreadsheet-ready file.",
    keywords:
      "json to csv, json to csv converter, convert json to csv online, json csv converter, export json to csv",
    inputs: [
      textArea(
        "text",
        "JSON input",
        '[\n  {"name": "Ana", "age": 30, "city": "Lahore"},\n  {"name": "Bilal", "age": 25, "city": "Karachi"}\n]',
      ),
    ],
    compute: (v) => {
      const input = String(v.text ?? "");
      if (input.trim() === "") return [{ label: "CSV output", value: "—" }];
      try {
        const csv = jsonToCsv(input);
        const rows = csv.split("\n").length;
        return [
          { label: "CSV output", value: csv },
          { label: "Rows", value: `${rows} (including the header row)` },
          { label: "Status", value: "Valid JSON" },
        ];
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return [{ label: "Error", value: message }];
      }
    },
    about:
      "Convert JSON data into CSV — the format spreadsheets and databases expect. Paste an array of objects (rows) and get back comma-separated values with a header row built from the object keys. Fields containing commas, quotes or new lines are quoted automatically, so the output opens cleanly in Excel, Google Sheets or any CSV reader. If the JSON has a syntax error, the tool says so instead of guessing.",
    formula: "",
    example:
      "An array of two objects — {\"name\": \"Ana\", \"age\": 30} and {\"name\": \"Bilal\", \"age\": 25} — becomes a CSV with the header “name,age” and two data rows.",
    howToUse: [
      "Paste your JSON — an array of objects, or a single object.",
      "Read the CSV output — the first row is the header.",
      "Copy the output and paste it into a spreadsheet, or save it as a .csv file.",
    ],
    details: [
      {
        heading: "What JSON shape works",
        body: "The tool expects an array of objects, where each object is one row and its keys are the columns — for example [{\"name\": \"Ana\", \"age\": 30}, {\"name\": \"Bilal\", \"age\": 25}]. A single object works too and becomes one data row. Nested objects and arrays are kept as JSON text inside the cell, so nothing is lost. A bare number, string or mixed array is rejected with a clear message.",
      },
      {
        heading: "Quoting rules",
        body: "CSV has one rule that matters: any field containing a comma, a quote or a new line must be wrapped in double quotes, and quotes inside it are doubled. The converter does this automatically — a name like “Ana, Jr.” becomes \"Ana, Jr.\" and a quote becomes \"\". That is what lets Excel open the file without splitting fields in the wrong places.",
      },
    ],
    tips: [
      "Arrays of objects convert best — one object per row.",
      "Fields with commas or quotes are quoted automatically.",
      "Open the result in Excel or Google Sheets to check the columns.",
    ],
    faqs: [
      {
        q: "What JSON can I convert to CSV?",
        a: "An array of objects (one object per row) or a single object. The keys become the column headers. Nested values are kept as JSON text inside the cell.",
      },
      {
        q: "How are commas inside values handled?",
        a: "The field is wrapped in double quotes, so “Ana, Jr.” becomes \"Ana, Jr.\" and the comma does not split the column. Quotes inside a field are doubled.",
      },
      {
        q: "Can I convert CSV back to JSON?",
        a: "Yes — the CSV to JSON converter on this site does the reverse, with the first row as the headers.",
      },
      {
        q: "Is my data uploaded anywhere?",
        a: "No. The conversion runs entirely in your browser — the JSON never leaves your device.",
      },
    ],
  },
  {
    slug: "csv-to-json-converter",
    name: "CSV to JSON Converter",
    category: "Web & Developer",
    short: "Convert CSV data to JSON — paste CSV, get structured JSON back.",
    keywords:
      "csv to json, csv to json converter, convert csv to json online, csv json converter, csv parser online",
    inputs: [
      textArea(
        "text",
        "CSV input",
        "name,age,city\nAna,30,Lahore\nBilal,25,Karachi",
      ),
    ],
    compute: (v) => {
      const input = String(v.text ?? "");
      if (input.trim() === "") return [{ label: "JSON output", value: "—" }];
      try {
        const json = csvToJson(input);
        const count = (JSON.parse(json) as unknown[]).length;
        return [
          { label: "JSON output", value: json },
          { label: "Rows", value: `${count} objects` },
          { label: "Status", value: "Valid CSV" },
        ];
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return [{ label: "Error", value: message }];
      }
    },
    about:
      "Convert CSV data into JSON — the format APIs and JavaScript code expect. Paste comma-separated values with a header row, and get back an array of objects keyed by the headers. Quoted fields (with commas, quotes or new lines inside) are parsed properly, so data exported from Excel or Google Sheets converts cleanly. If the CSV is malformed, the tool says so instead of guessing.",
    formula: "",
    example:
      "A CSV with the header “name,age,city” and the row “Ana,30,Lahore” becomes [{\"name\": \"Ana\", \"age\": \"30\", \"city\": \"Lahore\"}] — every value is text, as CSV carries no types.",
    howToUse: [
      "Paste your CSV — the first row must be the headers.",
      "Read the JSON output — an array of objects, pretty-printed.",
      "Copy the output into your code or API test.",
    ],
    details: [
      {
        heading: "What the converter expects",
        body: "The first row is the header row: its values become the keys of every object. Each following row is one object, and missing cells become empty strings. Values are kept as text — CSV has no types, so “30” stays the string \"30\" and your code can convert it. Empty lines are skipped, and quoted fields may contain commas, quotes (doubled) or new lines.",
      },
      {
        heading: "Why values stay as text",
        body: "A CSV file does not record whether 30 is a number, a date or a product code, so the converter does not guess: every cell becomes a string. That is the safe choice — guessing wrong would silently change your data. Convert numbers in your own code (for example, Number(obj.age) in JavaScript) where you know what each column means.",
      },
    ],
    tips: [
      "The first row must be the headers — they become the JSON keys.",
      "Values stay as text: convert numbers in your own code.",
      "Quoted fields with commas inside them parse correctly.",
    ],
    faqs: [
      {
        q: "What CSV can I convert to JSON?",
        a: "Any CSV with a header row: the first row becomes the keys, each following row becomes one object. Quoted fields with commas or new lines inside them work.",
      },
      {
        q: "Why are the numbers strings in the JSON?",
        a: "CSV has no types — 30 could be a number, a code or a date. The converter keeps every cell as text rather than guessing, and you convert in your own code.",
      },
      {
        q: "Can I convert JSON back to CSV?",
        a: "Yes — the JSON to CSV converter on this site does the reverse.",
      },
      {
        q: "Is my data uploaded anywhere?",
        a: "No. The conversion runs entirely in your browser — the CSV never leaves your device.",
      },
    ],
  },
  {
    slug: "diff-checker",
    name: "Diff Checker",
    category: "Web & Developer",
    short: "Compare two texts line by line — added, removed and unchanged lines highlighted.",
    keywords:
      "diff checker, text diff, compare text online, diff tool, find differences between two texts",
    custom: "diff-checker",
    inputs: [
      textArea("a", "Original text", "The quick brown fox\njumps over the lazy dog\nand runs away."),
      textArea("b", "Changed text", "The quick brown fox\nleaps over the lazy dog\nand runs away."),
    ],
    compute: () => [],
    about:
      "Compare two texts line by line and see exactly what changed: added lines in green, removed lines in red, unchanged lines in grey. It is the same idea as the diff in version control, for any two pieces of text — two drafts of a document, two versions of a config file, or a before-and-after of an edit. The comparison runs entirely in your browser, so the texts never leave your device.",
    formula: "",
    example:
      "Comparing “The quick brown fox / jumps over the lazy dog” with “The quick brown fox / leaps over the lazy dog” shows one removed line (“jumps…”) and one added line (“leaps…”), with the other lines unchanged.",
    howToUse: [
      "Paste the original text in the left box and the changed text in the right box.",
      "Read the highlighted diff — green lines were added, red lines were removed.",
      "Copy the diff or swap the two sides to see the change from the other direction.",
    ],
    details: [
      {
        heading: "How the diff works",
        body: "The tool compares the two texts line by line and finds the longest common subsequence — the lines that appear in both, in order. Everything else is an addition (in the new text only) or a removal (in the old text only). A changed line shows as one removal plus one addition, because the tool compares whole lines, not words inside a line.",
      },
      {
        heading: "What it is good for",
        body: "Checking what changed between two drafts, spotting accidental edits in a config file, comparing two versions of a document before publishing, or reviewing a student's revision. For code, a proper diff tool in your editor is better — it understands syntax — but for plain text this is the quick check.",
      },
    ],
    tips: [
      "A changed line shows as one removal plus one addition.",
      "Swap the two sides to read the change in the other direction.",
      "Very long texts (over 500 lines) are truncated to keep the page fast.",
    ],
    faqs: [
      {
        q: "What does a diff checker do?",
        a: "It compares two texts line by line and highlights what changed: added lines, removed lines, and lines that stayed the same.",
      },
      {
        q: "Why does a changed line show as two lines?",
        a: "The comparison works line by line, so an edited line is one removal (the old wording) plus one addition (the new wording).",
      },
      {
        q: "Can I compare files, not pasted text?",
        a: "Paste the file contents into the two boxes. The comparison runs in your browser, so the text never leaves your device.",
      },
      {
        q: "Is there a size limit?",
        a: "Each side is limited to 500 lines, so the comparison stays fast. For larger files, use a diff tool in your editor.",
      },
    ],
  },
  {
    slug: "image-to-base64-converter",
    name: "Image to Base64 Converter",
    category: "Web & Developer",
    short: "Turn an image into a Base64 data URI — for embedding in HTML and CSS.",
    keywords:
      "image to base64, image to base64 converter, base64 image encoder, convert image to data uri, png to base64",
    custom: "image-to-base64-converter",
    inputs: [
      {
        key: "file",
        label: "Image file",
        type: "text",
        def: "Choose an image file (up to 5 MB)",
      },
    ],
    compute: () => [],
    about:
      "Turn an image into a Base64 data URI — a long text string you can paste straight into HTML or CSS to embed the image without a separate file. Pick an image (up to 5 MB), and the tool reads it with the browser's FileReader and shows the data URI, its size, and a copy button. The file never leaves your browser: nothing is uploaded. Base64 makes the file about a third larger, so it suits small images — icons, logos and tiny illustrations — not photographs.",
    formula: "",
    example:
      "A 2 KB PNG logo becomes a data URI starting “data:image/png;base64,iVBORw0KGgo…” — about 2.7 KB of text, which you can paste into an <img src=\"…\"> or a CSS background.",
    howToUse: [
      "Choose an image file (PNG, JPG, GIF, SVG, WebP — up to 5 MB).",
      "Read the data URI and its size.",
      "Copy it and paste it into your HTML or CSS.",
    ],
    details: [
      {
        heading: "What a data URI is",
        body: "A data URI packs a whole file into a URL: data:image/png;base64, followed by the file's bytes encoded as text. The browser decodes it and shows the image, with no separate request. It is handy for tiny images that would cost more as a separate download than as text — a logo in an email signature, an icon in a single-file page, or a background in a stylesheet.",
      },
      {
        heading: "Why not to Base64 everything",
        body: "Base64 encoding makes a file about 37% larger, and the browser cannot cache it separately from the page — every page load re-downloads the image inside the HTML. For anything bigger than a few kilobytes, a normal image file is faster. As a rule of thumb: icons and small logos, yes; photographs, no.",
      },
    ],
    tips: [
      "Best for small images — icons and logos under a few kilobytes.",
      "The output is about a third larger than the original file.",
      "Use the CSS or HTML format button to get a ready-to-paste snippet.",
    ],
    faqs: [
      {
        q: "What is a Base64 data URI?",
        a: "A way to embed a whole image in a text string: data:image/png;base64, followed by the image bytes encoded as text. Paste it into an <img> tag or CSS and the browser shows the image with no separate file.",
      },
      {
        q: "Is my image uploaded anywhere?",
        a: "No. The file is read by your browser's FileReader and never leaves your device.",
      },
      {
        q: "Why is the output larger than the image?",
        a: "Base64 uses four text characters for every three bytes, so the output is about 37% larger than the original file.",
      },
      {
        q: "When should I use a data URI?",
        a: "For small images — icons, logos, tiny illustrations. For photographs or anything large, a normal image file is faster because the browser can cache it separately.",
      },
    ],
  },
  {
    slug: "meta-tag-generator",
    name: "Meta Tag Generator",
    category: "Web & Developer",
    short: "Generate the meta tags for a page — title, description, Open Graph and Twitter Card.",
    keywords:
      "meta tag generator, meta tags generator, og tags generator, open graph generator, twitter card generator, seo meta tags",
    custom: "meta-tag-generator",
    inputs: [
      { key: "title", label: "Page title", type: "text", def: "CalcHub — Free Online Calculators" },
      { key: "description", label: "Meta description", type: "text", def: "Free online calculators for finance, health, maths and more." },
    ],
    compute: () => [],
    about:
      "Generate the meta tags for a web page: the title, description, canonical link and the Open Graph and Twitter Card tags that control how the page looks when it is shared. Fill in the form and copy the ready-to-paste HTML into your page's <head>. The generator escapes everything properly, fills Open Graph fields from the title and description when you leave them blank, and only includes Twitter Card tags when you choose a card type. To check tags that already exist on a live page, use the Meta Tag Analyzer instead.",
    formula: "",
    example:
      "A page titled “CalcHub — Free Online Calculators” with the description “Free online calculators for finance, health, maths and more.” generates a <title>, a meta description, og:title, og:description, og:type and a twitter:card — ready to paste into the page head.",
    howToUse: [
      "Fill in the title, description and any other fields you need.",
      "Open Graph fields copy from the title and description when left blank.",
      "Copy the generated HTML and paste it into your page's <head>.",
    ],
    details: [
      {
        heading: "Which tags matter",
        body: "The title and meta description are what search results show, so they matter most. Open Graph tags (og:title, og:description, og:image) control the preview card on Facebook, LinkedIn and messaging apps; Twitter Card tags do the same for X. The canonical tag tells search engines which address is the preferred one when a page has several URLs. Keywords, by contrast, are ignored by Google and can be left out entirely.",
      },
      {
        heading: "Lengths that work",
        body: "Titles work best at roughly 50–60 characters and descriptions at 120–160 — longer ones get cut off in search results. The generator does not force a length, but the analyzer on this site will check yours. Open Graph images should be 1200×630 pixels for a full-size card.",
      },
    ],
    tips: [
      "Write the title and description first — the rest can copy from them.",
      "Add an og:image at 1200×630 for a proper share preview.",
      "Use the Meta Tag Analyzer to check the tags on a live page.",
    ],
    faqs: [
      {
        q: "What are meta tags?",
        a: "HTML in a page's <head> that describes the page: its title, description, canonical address, and the Open Graph and Twitter Card tags that control share previews.",
      },
      {
        q: "Do I need all of these tags?",
        a: "Title and description, yes. Open Graph and Twitter Card tags are worth adding if the page will ever be shared. Keywords can be skipped — Google ignores them.",
      },
      {
        q: "How long should the title and description be?",
        a: "Roughly 50–60 characters for the title and 120–160 for the description. Longer ones get cut off in search results.",
      },
      {
        q: "What is the difference between this and the Meta Tag Analyzer?",
        a: "This tool creates new tags for a page you are building. The Meta Tag Analyzer checks the tags that already exist on a live URL.",
      },
    ],
  },
];
