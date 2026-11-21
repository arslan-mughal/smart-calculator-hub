// Batch 28 — SEO Audit tools (new "SEO Audit" category): website SEO
// audit, broken link checker, keyword density, heading checker,
// robots.txt checker, sitemap checker, Open Graph checker, meta tag
// analyzer.
//
// These tools fetch a URL from the server (that is the point of them),
// with the SSRF guards in seo-audit.server.ts. Pasted text and HTML
// never leave the browser — those modes run entirely client-side.
// Each tool is a custom component (see src/components/seo-audit-tools.tsx):
// the generic form renderer cannot express a fetched audit report.
import type { Calc } from "../tool-types";

const URL_INPUT = {
  key: "url",
  label: "Page URL",
  type: "text" as const,
  def: "https://example.com",
};

export const batch28SeoTools: Calc[] = [
  {
    slug: "website-seo-audit",
    name: "Website SEO Audit",
    category: "SEO Audit",
    short: "Audit any web page like Screaming Frog — title, headings, images, tags and a score.",
    keywords:
      "website seo audit, seo audit tool, free seo audit, site audit checker, seo analysis tool, audit my website",
    custom: "website-seo-audit",
    popular: true,
    inputs: [URL_INPUT],
    compute: () => [],
    about:
      "Audit any public web page the way a site crawler does: fetch the page and check the title tag, meta description, heading structure, image alt text, canonical tag, robots meta and Open Graph tags, then score the page out of 100 with a list of what to fix. It is the Screaming Frog-style check for a single page — no crawl, no account, no install. The page is fetched from this site's server with strict safety limits (public addresses only, 10-second timeout, 2 MB cap), and nothing about the page is stored.",
    formula: "",
    example:
      "Auditing https://example.com reports a title of “Example Domain”, no meta description, one H1, and a score with the missing description flagged as the first fix.",
    howToUse: [
      "Paste the full URL of the page you want to audit, starting with https://.",
      "Run the audit and wait a few seconds while the page is fetched and checked.",
      "Read the score and work through the flagged items, worst first.",
    ],
    details: [
      {
        heading: "What the audit checks",
        body: "Eight things: the title tag (present, and 30–60 characters), the meta description (present, and 70–160 characters), exactly one H1, heading levels in order with none skipped, alt text on every image, a canonical tag, the robots meta (flagging noindex), and Open Graph tags for sharing. Each check passes, warns or fails, and the score starts at 100 and loses 15 points per failure and 5 per warning.",
      },
      {
        heading: "What it cannot see",
        body: "The audit reads the page as it is served — it does not run JavaScript, log in, or follow links. Pages that render their content with JavaScript will look nearly empty to it, and anything behind a login cannot be fetched at all. For a full site crawl with every page, a desktop crawler such as Screaming Frog is still the right tool; this one answers “is this page's SEO in order?” in seconds.",
      },
    ],
    tips: [
      "Fix failures before warnings — a missing title costs more than a long one.",
      "Check your most important pages first: home, key services, top blog posts.",
      "Re-run the audit after fixing things to confirm the score moved.",
    ],
    faqs: [
      {
        q: "What is an SEO audit?",
        a: "A check of a web page against the basics search engines look for: a good title, a meta description, one H1, headings in order, alt text on images, a canonical tag and share tags. This tool checks all of them and scores the page out of 100.",
      },
      {
        q: "Can I audit any website?",
        a: "Any public page over http or https. Pages behind a login, and private or local addresses, cannot be fetched — the tool says so rather than guessing.",
      },
      {
        q: "Is the page I audit stored anywhere?",
        a: "No. The page is fetched, checked and discarded. Nothing is saved, and the URL you enter is not logged with the result.",
      },
      {
        q: "Why is my score low if the page looks fine?",
        a: "Usually a missing meta description or title, or several images without alt text. Work through the failed checks first — each one is worth 15 points.",
      },
    ],
  },
  {
    slug: "broken-link-checker",
    name: "Broken Link Checker",
    category: "SEO Audit",
    short: "Find broken links on any page — every link checked, status reported.",
    keywords:
      "broken link checker, find broken links, dead link checker, check links on page, broken links finder",
    custom: "broken-link-checker",
    inputs: [URL_INPUT],
    compute: () => [],
    about:
      "Find the broken links on a web page: enter a URL, and the tool fetches the page, collects every link on it (up to 50 per run), and checks each one, reporting the HTTP status — 200 for working, 404 for not found, and so on. Broken links hurt visitors and search engines alike: a page full of dead links looks unmaintained and wastes crawl budget. The checks run from this site's server with the same safety limits as the other audit tools, and nothing is stored.",
    formula: "",
    example:
      "Checking a page with 12 links reports 11 working (200) and 1 broken (404) — the broken one is listed with its address so you can fix or remove it.",
    howToUse: [
      "Paste the full URL of the page to check, starting with https://.",
      "Run the check — up to 50 links are tested, a few seconds in total.",
      "Fix or remove any link that does not return a working status.",
    ],
    details: [
      {
        heading: "What counts as broken",
        body: "Any link that does not return a successful status: 404 (not found) is the usual one, but 500 errors, timeouts and connection failures count too. Redirects (301/302) are followed and reported with their final status, so a link that redirects to a working page is not flagged. Links starting with # (same-page anchors), mailto: and tel: are skipped — they are not web pages.",
      },
      {
        heading: "Why broken links matter",
        body: "A visitor who clicks a dead link hits an error page and often leaves. Search engines treat a page full of dead links as unmaintained, and every crawl of a dead link is crawl budget spent on nothing. Link rot is constant — sites move, rename and delete pages — so checking your important pages every few months is worth the few minutes it takes.",
      },
    ],
    tips: [
      "Check your most-linked pages first — home, top posts, resource pages.",
      "A link that redirects to a working page is fine; one that redirects to an error is not.",
      "Re-check after fixing — a mistyped replacement link is easy to miss.",
    ],
    faqs: [
      {
        q: "What is a broken link?",
        a: "A link that leads nowhere — usually a 404 (page not found), a server error, or a connection failure. This tool checks every link on a page and reports the status of each one.",
      },
      {
        q: "How many links does it check?",
        a: "Up to 50 links per run. If a page has more, the first 50 are checked and the tool says how many were found in total.",
      },
      {
        q: "Are redirects counted as broken?",
        a: "No. Redirects are followed to their final destination and reported with that page's status — only links that end in an error count as broken.",
      },
      {
        q: "Can I check a whole website?",
        a: "This tool checks one page at a time. For a whole site, run it on your most important pages, or use a desktop crawler for a full sweep.",
      },
    ],
  },
  {
    slug: "keyword-density-checker",
    name: "Keyword Density Checker",
    category: "SEO Audit",
    short: "Keyword density and word count from a URL or pasted text.",
    keywords:
      "keyword density checker, keyword density tool, keyword frequency checker, seo keyword density, word count checker",
    custom: "keyword-density-checker",
    inputs: [
      { key: "keyword", label: "Keyword or phrase", type: "text" as const, def: "calculator" },
      {
        key: "text",
        label: "Text to analyse (or a URL — choose below)",
        type: "textarea" as const,
        def: "Paste your page text here, or switch to URL mode to fetch a live page.",
      },
    ],
    compute: () => [],
    about:
      "Measure keyword density: how often a word or phrase appears in a piece of text, as a percentage of all words. Enter a keyword and either paste text or fetch a live page by URL, and the tool reports the word count, the number of times the keyword appears, its density, and the most common words in the text. Density of 1–2% is the usual rough guide for a target keyword — far above that usually reads as stuffing. Pasted text never leaves your browser; only URL mode fetches from the server.",
    formula:
      "Density = (times the keyword appears ÷ total words) × 100. For example, a keyword appearing 6 times in 300 words has a density of 2%.",
    example:
      "A 300-word text mentioning “calculator” 6 times has a keyword density of 2% — inside the usual 1–2% guide range.",
    howToUse: [
      "Enter the keyword or phrase you want to measure.",
      "Paste the text, or switch to URL mode and enter a page address.",
      "Read the density, the word count and the most common words.",
    ],
    details: [
      {
        heading: "What density is “right”?",
        body: "There is no official number — Google has never published one. The old rule of thumb is 1–2% for a target keyword: enough that the page is clearly about the topic, not so much that it reads unnaturally. Above 3–4% usually means the keyword is being repeated for the search engine rather than the reader, which is what keyword stuffing looks like. The most useful check is often the top-words list: if the top words are not your topic, the page is probably not about what you think it is.",
      },
      {
        heading: "Pasted text vs. a live URL",
        body: "Pasted text is analysed in your browser and never leaves your device — use it for drafts. URL mode fetches the live page from the server and analyses the visible text (scripts and styles are ignored). The two can differ: a live page includes navigation, footers and sidebars, which dilute the density of the article itself.",
      },
    ],
    tips: [
      "Aim for roughly 1–2% for a target keyword — more usually reads as stuffing.",
      "Check the top-words list: it should be your topic, not your navigation.",
      "Use pasted text for drafts — it never leaves your browser.",
    ],
    faqs: [
      {
        q: "What is keyword density?",
        a: "How often a word or phrase appears in a text, as a percentage of all words. A keyword appearing 6 times in 300 words has a density of 2%.",
      },
      {
        q: "What is a good keyword density?",
        a: "There is no official number, but 1–2% is the usual rough guide. Much above 3–4% usually reads as keyword stuffing.",
      },
      {
        q: "Does keyword density still matter for SEO?",
        a: "Less than it used to — search engines now understand topics, not just exact words. It is still a useful check that a page is actually about its target keyword.",
      },
      {
        q: "Is my pasted text uploaded anywhere?",
        a: "No. Pasted text is analysed in your browser and never leaves your device. Only URL mode fetches anything, from the server.",
      },
    ],
  },
  {
    slug: "heading-checker",
    name: "Heading Checker",
    category: "SEO Audit",
    short: "H1–H6 outline of a URL or pasted HTML — missing, duplicate and skipped levels flagged.",
    keywords:
      "heading checker, h1 checker, heading structure checker, html heading analyzer, h1 h2 h3 checker",
    custom: "heading-checker",
    inputs: [
      {
        key: "html",
        label: "HTML to check (or a URL — choose below)",
        type: "textarea" as const,
        def: "<h1>Page title</h1>\n<h2>First section</h2>\n<h3>A detail</h3>\n<h2>Second section</h2>",
      },
    ],
    compute: () => [],
    about:
      "See the heading outline of a page — every H1 to H6 in order — and get flagged for the three classic mistakes: no H1 at all, more than one H1, and skipped levels (an H2 jumping straight to an H4). Check a live page by URL or paste HTML directly. Headings are how readers and search engines scan a page, so a clean outline matters more than it looks. Pasted HTML never leaves your browser; only URL mode fetches from the server.",
    formula: "",
    example:
      "A page with H1, H2, H3, H2 passes cleanly. The same page with an H2 followed directly by an H4 is flagged for a skipped level.",
    howToUse: [
      "Paste HTML, or switch to URL mode and enter a page address.",
      "Read the outline — each heading with its level.",
      "Fix any flagged problems: add a missing H1, or fill in the skipped level.",
    ],
    details: [
      {
        heading: "The three heading mistakes",
        body: "No H1: the page never states its topic in a top-level heading. Multiple H1s: the page claims several topics at once — one H1 is the rule. Skipped levels: jumping from H2 to H4 breaks the outline, confusing screen readers and search engines alike. None of these is fatal on its own, but together they make a page harder to scan and harder to rank.",
      },
      {
        heading: "Headings are an outline, not decoration",
        body: "Think of headings as the table of contents of the page: H1 is the title, H2s are the chapters, H3s the sections inside them. A reader should be able to understand the whole page from the headings alone. If your outline reads like a list of unrelated phrases, the page structure needs work — and if you are choosing heading levels for their font size rather than their place in the outline, style them with CSS instead.",
      },
    ],
    tips: [
      "One H1 per page, stating what the page is about.",
      "Never skip a level — H2, then H3, then H4.",
      "Read the outline alone: it should summarise the whole page.",
    ],
    faqs: [
      {
        q: "What is a heading checker?",
        a: "A tool that lists every H1–H6 on a page in order and flags the classic mistakes: a missing H1, more than one H1, and skipped heading levels.",
      },
      {
        q: "How many H1 tags should a page have?",
        a: "One. It states what the page is about. More than one H1 splits the topic and confuses both readers and search engines.",
      },
      {
        q: "Can I skip from H2 to H4?",
        a: "You can, but you should not — it breaks the page outline. Fill in the missing level or restyle with CSS instead of misusing the heading.",
      },
      {
        q: "Is my pasted HTML uploaded anywhere?",
        a: "No. Pasted HTML is checked in your browser and never leaves your device. Only URL mode fetches anything, from the server.",
      },
    ],
  },
  {
    slug: "robots-txt-checker",
    name: "Robots.txt Checker",
    category: "SEO Audit",
    short: "Fetch and check a site's robots.txt — rules, sitemap line and common mistakes.",
    keywords:
      "robots.txt checker, robots txt validator, robots.txt tester, check robots.txt, robots file checker",
    custom: "robots-txt-checker",
    inputs: [
      { key: "url", label: "Site URL", type: "text" as const, def: "https://example.com" },
    ],
    compute: () => [],
    about:
      "Fetch a site's robots.txt and check it: does the file exist, which crawlers it addresses, what it allows and blocks, whether it points at a sitemap, and whether it makes any common mistakes — such as blocking the whole site by accident or using a directive crawlers do not understand. Enter any site address and the tool fetches the robots.txt from the site's root. The fetch runs from this site's server with the usual safety limits, and nothing is stored.",
    formula: "",
    example:
      "Checking https://example.com fetches its robots.txt, which allows all crawlers and lists no sitemap — the tool flags the missing Sitemap line.",
    howToUse: [
      "Enter the site address (the tool adds /robots.txt).",
      "Run the check and read the rules, grouped by crawler.",
      "Fix any flagged problems — especially a file that blocks everything.",
    ],
    details: [
      {
        heading: "What robots.txt does",
        body: "robots.txt is a file at the root of a site (example.com/robots.txt) that tells crawlers which parts of the site they may visit. It is a request, not a lock — well-behaved crawlers obey it, bad actors ignore it. Its two jobs are keeping crawlers out of places they should not go (admin pages, search results, duplicate content) and pointing them at the sitemap.",
      },
      {
        heading: "The mistake that deletes a site from search",
        body: "“User-agent: * / Disallow: /” blocks every crawler from every page. It is one character away from a normal file, and it is the most common catastrophic robots.txt mistake — usually left over from a staging site. If your site has vanished from search results, this is the first file to check, and this tool flags it in plain language.",
      },
    ],
    tips: [
      "Always include a Sitemap line pointing at your sitemap.",
      "Never copy a staging robots.txt to a live site — check for Disallow: / first.",
      "Test changes here before deploying them.",
    ],
    faqs: [
      {
        q: "What is robots.txt?",
        a: "A file at a site's root (example.com/robots.txt) that tells search-engine crawlers which pages they may visit, and where the sitemap is. It is a request crawlers obey, not a lock.",
      },
      {
        q: "What happens if robots.txt is missing?",
        a: "Nothing bad — crawlers assume everything is allowed and look for a sitemap elsewhere. The tool reports it as missing rather than as an error.",
      },
      {
        q: "Can robots.txt block my whole site from Google?",
        a: "Yes: “Disallow: /” for all crawlers blocks the entire site. It is the most common catastrophic robots.txt mistake, usually copied from a staging site.",
      },
      {
        q: "Do I need a Sitemap line in robots.txt?",
        a: "It is not required, but it is the easiest way to make sure crawlers find your sitemap — and this tool flags it when it is missing.",
      },
    ],
  },
  {
    slug: "sitemap-checker",
    name: "Sitemap Checker",
    category: "SEO Audit",
    short: "Validate an XML sitemap — URL count, errors and a sample of entries.",
    keywords:
      "sitemap checker, xml sitemap validator, sitemap validator, check sitemap, sitemap errors checker",
    custom: "sitemap-checker",
    inputs: [
      { key: "url", label: "Sitemap URL", type: "text" as const, def: "https://example.com/sitemap.xml" },
    ],
    compute: () => [],
    about:
      "Fetch an XML sitemap and validate it: is it really a sitemap, how many URLs does it list, does every entry have a location, are the locations full URLs, and is it under the 50,000-URL limit for a single sitemap. A broken sitemap means search engines cannot find your pages — this tool finds the problem in seconds. The fetch runs from this site's server with the usual safety limits, and nothing is stored.",
    formula: "",
    example:
      "Checking a sitemap with 240 <url> entries and 240 <loc> entries passes cleanly, with a sample of the first five URLs shown.",
    howToUse: [
      "Paste the full sitemap URL (usually yourdomain.com/sitemap.xml).",
      "Run the check and read the URL count and any errors.",
      "Fix the flagged problems and re-check.",
    ],
    details: [
      {
        heading: "What a valid sitemap needs",
        body: "An XML file starting with an XML declaration, a <urlset> element, and one <url> entry per page, each with exactly one <loc> holding the page's full address. Optional <lastmod>, <changefreq> and <priority> elements are allowed but ignored by most search engines. A single sitemap holds at most 50,000 URLs and 50 MB — bigger sites split into several sitemaps listed in a sitemap index file.",
      },
      {
        heading: "Common sitemap failures",
        body: "The usual failures are: not XML at all (a 404 page served as the sitemap), entries without a <loc>, relative URLs instead of full ones, and URLs that no longer exist. A sitemap full of dead or redirected URLs wastes crawl budget and teaches search engines to trust the file less — keep it to live, indexable pages only.",
      },
    ],
    tips: [
      "Keep sitemaps to live, indexable pages only — no 404s or redirects.",
      "One sitemap holds at most 50,000 URLs — split bigger sites.",
      "List your sitemap in robots.txt so crawlers find it.",
    ],
    faqs: [
      {
        q: "What is an XML sitemap?",
        a: "An XML file listing a site's pages for search engines, so they can find and crawl them. Each entry has a <loc> with the page's full address.",
      },
      {
        q: "How many URLs can a sitemap hold?",
        a: "At most 50,000 URLs and 50 MB per file. Bigger sites split into several sitemaps listed in a sitemap index.",
      },
      {
        q: "What if my sitemap URL returns a 404?",
        a: "Then there is no sitemap at that address — the tool says so. Check the address, and make sure your site actually generates one.",
      },
      {
        q: "Should a sitemap include every page?",
        a: "Every live, indexable page — but not 404s, redirects, admin pages or duplicates. A clean sitemap is trusted more than a big one.",
      },
    ],
  },
  {
    slug: "open-graph-checker",
    name: "Open Graph Checker",
    category: "SEO Audit",
    short: "Preview a page's Open Graph and Twitter Card tags as they appear when shared.",
    keywords:
      "open graph checker, og tag checker, twitter card checker, social share preview, facebook share preview checker",
    custom: "open-graph-checker",
    inputs: [URL_INPUT],
    compute: () => [],
    about:
      "See how a page will look when it is shared: fetch the URL and preview its Open Graph and Twitter Card tags — the title, description and image that Facebook, X, LinkedIn and messaging apps show in the share card. Missing tags mean a plain link instead of a preview, and a missing or wrong image is the most common share-preview failure. The fetch runs from this site's server with the usual safety limits, and nothing is stored.",
    formula: "",
    example:
      "Checking a page with og:title, og:description and a 1200×630 og:image shows a full preview card. Without an og:image, the preview shows text only.",
    howToUse: [
      "Paste the full URL of the page to preview, starting with https://.",
      "Run the check and read the share preview.",
      "Add any missing tags — usually og:image — and re-check.",
    ],
    details: [
      {
        heading: "Which tags make a share card",
        body: "og:title and og:description set the card's text, og:image sets the picture, og:type (usually “website” or “article”) and og:url complete it. Twitter Card tags (twitter:card, twitter:title, twitter:description, twitter:image) do the same for X — if they are missing, X falls back to the Open Graph tags. An og:image of 1200×630 pixels gives a full-size card; without one, the share shows a small thumbnail or none at all.",
      },
      {
        heading: "Why previews go wrong",
        body: "The usual failures are a missing og:image, an image that is too small or blocked, and tags that differ from the page's title and description. Social platforms also cache previews — after fixing tags, a page can still show the old card until the platform re-fetches it (Facebook's Sharing Debugger and X's Card Validator force a refresh). This tool shows the tags as they are now, so you can see what the platforms will see next time.",
      },
    ],
    tips: [
      "Use a 1200×630 image for a full-size share card.",
      "Check that the preview text matches the page — not a generic site slogan.",
      "After fixing tags, refresh the platform's cache (Sharing Debugger / Card Validator).",
    ],
    faqs: [
      {
        q: "What are Open Graph tags?",
        a: "Meta tags (og:title, og:description, og:image) that tell Facebook, LinkedIn and messaging apps what title, text and image to show when a page is shared.",
      },
      {
        q: "Why does my shared link show no image?",
        a: "Usually a missing og:image, an image that is too small, or one the platform cannot load. Add a 1200×630 og:image and re-check.",
      },
      {
        q: "What is the difference between Open Graph and Twitter Cards?",
        a: "Open Graph is the general standard; Twitter Card tags are X's version. If Twitter tags are missing, X falls back to the Open Graph tags.",
      },
      {
        q: "I fixed the tags but the share still looks old — why?",
        a: "Social platforms cache previews. Use Facebook's Sharing Debugger or X's Card Validator to force a fresh fetch after fixing tags.",
      },
    ],
  },
  {
    slug: "meta-tag-analyzer",
    name: "Meta Tag Analyzer",
    category: "SEO Audit",
    short: "Check a live page's title and description length and quality.",
    keywords:
      "meta tag analyzer, title tag checker, meta description checker, check meta tags, seo title checker",
    custom: "meta-tag-analyzer",
    inputs: [URL_INPUT],
    compute: () => [],
    about:
      "Check the meta tags that already exist on a live page: the title tag and meta description, their lengths, and whether they are missing, too short or too long — plus the canonical tag, robots meta and Open Graph tags for context. This tool CHECKS existing tags; the Meta Tag Generator on this site CREATES new ones for a page you are building. The fetch runs from this site's server with the usual safety limits, and nothing is stored.",
    formula: "",
    example:
      "Analyzing a page with a 42-character title and a 148-character description reports both as a good length, with the canonical tag and Open Graph tags listed for context.",
    howToUse: [
      "Paste the full URL of the page to analyse, starting with https://.",
      "Run the analysis and read the title and description lengths.",
      "Rewrite anything flagged as missing, short or long.",
    ],
    details: [
      {
        heading: "Lengths that work",
        body: "Titles work best at roughly 50–60 characters — longer ones get cut off in search results — and descriptions at 120–160 characters. Shorter is not automatically bad: a clear 45-character title beats a padded 60-character one. The analyzer flags anything outside the usual ranges so you can judge it, and it flags missing tags as failures, because a page with no title or description is leaving its search snippet to chance.",
      },
      {
        heading: "Analyzer vs. generator",
        body: "This tool reads the tags a live page already has. The Meta Tag Generator does the opposite: it writes new tags for a page you are building, from a form. Use the generator when creating a page, and this analyzer when checking one that is already live.",
      },
    ],
    tips: [
      "Titles: roughly 50–60 characters. Descriptions: 120–160.",
      "A missing title or description is a failure — fix it first.",
      "Write for people, not for the character count.",
    ],
    faqs: [
      {
        q: "What does a meta tag analyzer do?",
        a: "It fetches a live page and checks its title tag and meta description — whether they exist, how long they are, and whether they are in the range that displays well in search results.",
      },
      {
        q: "How long should a title tag be?",
        a: "Roughly 50–60 characters. Longer titles get cut off in search results; much shorter ones waste the space.",
      },
      {
        q: "How long should a meta description be?",
        a: "Roughly 120–160 characters. Longer descriptions get cut off, and a missing one leaves the snippet to the search engine.",
      },
      {
        q: "What is the difference from the Meta Tag Generator?",
        a: "The analyzer checks tags that already exist on a live page. The generator creates new tags for a page you are building.",
      },
    ],
  },
];
