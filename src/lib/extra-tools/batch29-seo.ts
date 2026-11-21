// Batch 29 — SEO Audit extension: Robots.txt Generator, XML Sitemap
// Generator, Schema Markup Generator, Hreflang Tag Generator, Redirect
// Checker, Headline Analyzer, Domain Age Checker, WHOIS Lookup.
//
// The four generators are custom components that build text to copy.
// The Redirect Checker, Domain Age Checker and WHOIS Lookup fetch from
// the server behind the v2.6 SSRF guards (seo-audit.server.ts). The
// Headline Analyzer is a plain form tool: its score is computed in the
// browser from the headline alone.
import type { Calc } from "../tool-types";
import { analyzeHeadline } from "../headline";

const URL_INPUT = {
  key: "url",
  label: "Page URL",
  type: "text" as const,
  def: "https://example.com",
};

const DOMAIN_INPUT = {
  key: "domain",
  label: "Domain",
  type: "text" as const,
  def: "example.com",
};

export const batch29SeoTools: Calc[] = [
  {
    slug: "robots-txt-generator",
    name: "Robots.txt Generator",
    category: "SEO Audit",
    short: "Build a robots.txt file — allow and disallow rules, plus your sitemap.",
    keywords:
      "robots.txt generator, create robots.txt, robots txt maker, generate robots.txt file",
    custom: "robots-txt-generator",
    inputs: [
      {
        key: "agent",
        label: "User-agent ( * for all crawlers )",
        type: "text" as const,
        def: "*",
      },
    ],
    compute: () => [],
    about:
      "Build a robots.txt file without writing it by hand: add allow and disallow rules for the crawlers you care about, add your sitemap address, and copy the finished file to your site's root. A robots.txt tells search engines which parts of your site they may crawl — it is a request, not a lock, but every major crawler honours it. Everything runs in your browser; nothing is uploaded.",
    formula: "",
    example:
      "Disallowing /admin/ and /search/ for all crawlers, with a sitemap line, produces a robots.txt with `User-agent: *`, two `Disallow:` lines and a `Sitemap:` line.",
    howToUse: [
      "Add the paths you want to block (Disallow) and the ones to explicitly allow (Allow).",
      "Add your sitemap URL if you have one.",
      "Copy the generated robots.txt and save it as robots.txt at your site's root.",
    ],
    details: [
      {
        heading: "What robots.txt does — and does not do",
        body: "It asks well-behaved crawlers (Google, Bing and the rest) to skip the paths you list. It does not hide those pages: anyone who knows the address can still visit them, and a page that is linked from elsewhere can still be indexed without being crawled. For pages that must stay private, use a password or a noindex tag instead.",
      },
      {
        heading: "Common mistakes",
        body: "Blocking the whole site (`Disallow: /`) by accident is the classic one — check the generated file before uploading it. Blocking CSS and JavaScript files is another: search engines need them to render your pages properly. And a robots.txt belongs at the root of the site (example.com/robots.txt), nowhere else.",
      },
    ],
    tips: [
      "Always add a Sitemap line — it is the easiest way to make sure crawlers find your sitemap.",
      "Block admin, search-result and duplicate pages; leave CSS and JavaScript alone.",
      "Check the file with the Robots.txt Checker after uploading it.",
    ],
    faqs: [
      {
        q: "What is robots.txt?",
        a: "A small text file at the root of a website that tells search engine crawlers which pages they may and may not visit. It starts with a User-agent line, then Allow and Disallow rules.",
      },
      {
        q: "Does robots.txt hide pages from Google?",
        a: "No — it only asks crawlers not to visit them. A page that is linked from elsewhere can still be indexed. Use noindex or a password for pages that must stay private.",
      },
      {
        q: "Where does robots.txt go?",
        a: "At the root of the site — example.com/robots.txt. Anywhere else, crawlers will not find it.",
      },
    ],
  },
  {
    slug: "xml-sitemap-generator",
    name: "XML Sitemap Generator",
    category: "SEO Audit",
    short: "Build an XML sitemap from your page URLs — ready to submit to Google.",
    keywords:
      "xml sitemap generator, create sitemap, sitemap generator, generate sitemap xml, make sitemap",
    custom: "xml-sitemap-generator",
    inputs: [
      {
        key: "urls",
        label: "Page URLs (one per line)",
        type: "textarea" as const,
        def: "https://example.com/\nhttps://example.com/about\nhttps://example.com/blog",
      },
    ],
    compute: () => [],
    about:
      "Build an XML sitemap from a list of your page URLs: add optional last-modified dates, change frequencies and priorities, and copy or download the finished sitemap.xml. A sitemap tells search engines which pages exist on your site and how often they change, so new and updated pages get found faster. Everything runs in your browser; your URLs are never uploaded.",
    formula: "",
    example:
      "Three page URLs produce a sitemap.xml with three <url> entries, each with a <loc> — ready to upload and submit in Google Search Console.",
    howToUse: [
      "Paste your page URLs, one per line.",
      "Set last-modified dates, change frequency and priority where you know them (all optional).",
      "Copy or download the sitemap.xml, upload it to your site's root, and submit it in Search Console.",
    ],
    details: [
      {
        heading: "What goes in a sitemap",
        body: "Every page you want search engines to find, with its full address. Last-modified dates help crawlers spot updated pages; changefreq is a hint about how often a page changes; priority (0.0–1.0) says which pages matter most relative to each other. None of the three optional fields is required — a list of URLs alone is a valid sitemap.",
      },
      {
        heading: "Sitemap limits",
        body: "One sitemap holds up to 50,000 URLs and must stay under 50 MB uncompressed. Larger sites split their sitemaps and list them in a sitemap index file. If your site has more than a few hundred pages, generate the sitemap from your CMS or a crawler instead of typing URLs by hand.",
      },
    ],
    tips: [
      "Include only pages you want indexed — leave out admin, search and duplicate pages.",
      "Put the sitemap at your site's root and add its address to robots.txt.",
      "Submit it in Google Search Console and re-submit after big changes.",
    ],
    faqs: [
      {
        q: "What is an XML sitemap?",
        a: "A file listing a site's pages in a format search engines read, so they can find and crawl every page — especially new or rarely linked ones.",
      },
      {
        q: "Do I need lastmod, changefreq and priority?",
        a: "No. A sitemap with just URLs is valid. Last-modified dates are the most useful of the three; changefreq and priority are only hints.",
      },
      {
        q: "How many URLs can a sitemap hold?",
        a: "Up to 50,000 URLs and 50 MB uncompressed. Bigger sites use several sitemaps listed in a sitemap index file.",
      },
    ],
  },
  {
    slug: "schema-markup-generator",
    name: "Schema Markup Generator",
    category: "SEO Audit",
    short: "Generate JSON-LD schema markup — Article, FAQ, Product, Organization.",
    keywords:
      "schema markup generator, json-ld generator, structured data generator, schema.org generator, generate schema markup",
    custom: "schema-markup-generator",
    inputs: [
      {
        key: "type",
        label: "Schema type",
        type: "select" as const,
        def: "Article",
        options: [
          { v: "Article", l: "Article" },
          { v: "FAQPage", l: "FAQ Page" },
          { v: "Product", l: "Product" },
          { v: "Organization", l: "Organization" },
        ],
      },
    ],
    compute: () => [],
    about:
      "Generate JSON-LD schema markup — the structured data search engines read — for an Article, an FAQ page, a Product or an Organization. Fill in the fields and copy the finished <script type=\"application/ld+json\"> block into your page. Schema markup is what powers rich results: FAQ drop-downs, product prices and article details in search results. Everything runs in your browser; nothing is uploaded.",
    formula: "",
    example:
      "An Article with a headline, author and date produces a JSON-LD block with @type Article and those fields — paste it into the page's <head>.",
    howToUse: [
      "Pick the schema type that matches your page.",
      "Fill in the fields — only the required ones are mandatory.",
      "Copy the generated JSON-LD and paste it into your page's <head>.",
    ],
    details: [
      {
        heading: "What schema markup does",
        body: "It describes a page's content in a machine-readable format (schema.org vocabulary, written as JSON-LD). Search engines use it to understand what a page is — an article with an author and date, a product with a price, a page of questions and answers — and may show that information as a rich result. It does not guarantee a rich result, and it must describe content that is actually on the page.",
      },
      {
        heading: "Which type to use",
        body: "Article for blog posts and news; FAQPage for pages that list questions and answers (each question needs a visible answer on the page); Product for pages that sell something, with a price and currency; Organization for a company's home page, with its name, URL and logo.",
      },
    ],
    tips: [
      "Only mark up content that is visible on the page — hidden markup can get a manual penalty.",
      "Test the result in Google's Rich Results Test before publishing.",
      "FAQ markup needs at least one question and answer pair.",
    ],
    faqs: [
      {
        q: "What is schema markup?",
        a: "Structured data in JSON-LD format that describes a page's content to search engines — an article's headline and author, a product's price, a list of questions and answers.",
      },
      {
        q: "Does schema markup improve rankings?",
        a: "Not directly. It can earn rich results (FAQ drop-downs, prices, ratings) in search results, which can raise click-through rates.",
      },
      {
        q: "Where does the JSON-LD go?",
        a: "Inside a <script type=\"application/ld+json\"> block in the page's <head> (or anywhere in the body). It is invisible to visitors.",
      },
    ],
  },
  {
    slug: "hreflang-tag-generator",
    name: "Hreflang Tag Generator",
    category: "SEO Audit",
    short: "Generate hreflang tags for multilingual pages — one tag per language.",
    keywords:
      "hreflang generator, hreflang tag generator, generate hreflang tags, multilingual seo tags",
    custom: "hreflang-tag-generator",
    inputs: [
      {
        key: "entries",
        label: "URLs with language codes (one per line: URL, code)",
        type: "textarea" as const,
        def: "https://example.com/, en\nhttps://example.com/de/, de\nhttps://example.com/fr/, fr",
      },
    ],
    compute: () => [],
    about:
      "Generate hreflang tags for multilingual pages: enter each language version of a page with its language code, and copy the finished <link rel=\"alternate\" hreflang=\"…\"> tags into every version's <head>. Hreflang tells search engines which language and region each version is for, so visitors land on the right one. Use codes like en, de, fr, or en-US for a region. Everything runs in your browser; nothing is uploaded.",
    formula: "",
    example:
      "Three versions (en, de, fr) produce three link tags — one per language — to paste into the <head> of each version, including a self-referencing tag for the page itself.",
    howToUse: [
      "List each language version: its URL and its language code, one per line.",
      "Add an x-default entry for the fallback page if you have one.",
      "Copy the tags and paste them into the <head> of every language version.",
    ],
    details: [
      {
        heading: "Language codes",
        body: "Use ISO codes: en for English, de for German, fr for French, and optionally a region — en-US, en-GB, de-DE, fr-CA. x-default marks the fallback page shown when no language matches. Codes are case-sensitive in the usual form: language lowercase, region uppercase.",
      },
      {
        heading: "The rule everyone forgets",
        body: "Hreflang is reciprocal: every version of a page must link to every other version, including itself. If page A links to page B but B does not link back to A, search engines ignore the tags. Generate the full set once and paste the same set into every version.",
      },
    ],
    tips: [
      "Every version must link to every version, including itself.",
      "Use x-default for the page visitors see when no language matches.",
      "Check the result with the hreflang testing tool in Search Console.",
    ],
    faqs: [
      {
        q: "What is hreflang?",
        a: "An HTML tag that tells search engines a page has versions in different languages or for different regions, so the right version shows in each country's results.",
      },
      {
        q: "What language codes do I use?",
        a: "ISO codes such as en, de, fr — with an optional region, en-US or en-GB. x-default marks the fallback page.",
      },
      {
        q: "Do the tags go on every version?",
        a: "Yes. Each version of a page must carry the full set of tags, including a tag pointing at itself. One-way links are ignored.",
      },
    ],
  },
  {
    slug: "redirect-checker",
    name: "Redirect Checker",
    category: "SEO Audit",
    short: "Follow a URL's redirect chain — every hop, every status code.",
    keywords:
      "redirect checker, check redirects, redirect chain checker, url redirect test, follow redirects",
    custom: "redirect-checker",
    inputs: [URL_INPUT],
    compute: () => [],
    about:
      "Follow a URL's redirect chain hop by hop: enter a URL and see every redirect — 301, 302, 307, 308 — with each status code, up to the final page and its status. Redirect chains waste crawl budget and slow visitors down, and a chain that ends in an error page is a broken link in disguise. The check runs from this site's server with strict safety limits (public addresses only, 10-second timeout, at most 5 hops), and nothing is stored.",
    formula: "",
    example:
      "Checking a short link that redirects twice reports hop 1 (301), hop 2 (301), and the final page (200) — a chain of two redirects to fix by pointing the link at the final address.",
    howToUse: [
      "Paste the URL to check, starting with https://.",
      "Run the check — each hop is listed with its status code.",
      "Fix chains by linking directly to the final address.",
    ],
    details: [
      {
        heading: "301 vs 302 vs 307 vs 308",
        body: "301 is a permanent move (link value passes to the new address); 302 is temporary (the old address keeps its value); 307 is the temporary version that preserves the request method; 308 is the permanent version that preserves it. For a page that has moved for good, 301 (or 308) is the right choice; a 302 on a permanent move is a common mistake.",
      },
      {
        heading: "Why chains matter",
        body: "Every hop costs a round trip for the visitor and a slice of crawl budget for search engines. Google follows up to 5 redirects before giving up, and a chain that ends in a 404 is a dead end. One direct redirect is fine; two or more in a row should be flattened.",
      },
    ],
    tips: [
      "Link to the final address, not to a URL that redirects.",
      "A permanent move should be a 301, not a 302.",
      "Re-check after fixing — a mistyped replacement creates a new chain.",
    ],
    faqs: [
      {
        q: "What is a redirect chain?",
        a: "A series of redirects: URL A points to B, B points to C, and so on. Each hop costs time and crawl budget, so chains should be flattened to a single redirect.",
      },
      {
        q: "How many redirects are too many?",
        a: "More than one hop is worth fixing. Google stops following after 5 redirects, and a chain that ends in an error is a broken link.",
      },
      {
        q: "What is the difference between 301 and 302?",
        a: "301 means the page moved permanently and passes its ranking value to the new address; 302 means the move is temporary and the old address keeps its value.",
      },
    ],
  },
  {
    slug: "headline-analyzer",
    name: "Headline Analyzer",
    category: "SEO Audit",
    short: "Score a headline — length, word balance, emotion and power words.",
    keywords:
      "headline analyzer, headline checker, headline score, blog title analyzer, headline tester",
    inputs: [
      {
        key: "headline",
        label: "Headline",
        type: "textarea" as const,
        def: "7 Proven Ways to Save Money on Your Weekly Groceries",
      },
    ],
    compute: (v) => {
      const a = analyzeHeadline(String(v.headline ?? ""));
      return [
        { label: "Headline score", value: `${a.score} / 100 (${a.grade})` },
        { label: "Words", value: String(a.words) },
        { label: "Characters", value: String(a.chars) },
        { label: "Common words", value: `${a.commonPct}%` },
        { label: "Uncommon words", value: `${a.uncommonPct}%` },
        { label: "Emotional words", value: `${a.emotionalPct}%` },
        { label: "Power words", value: String(a.powerCount) },
        { label: "Contains a number", value: a.hasNumber ? "Yes" : "No" },
      ];
    },
    about:
      "Score a headline the way a headline tool does: length, word count, and the balance of common, uncommon, emotional and power words — the mix that makes people click. A strong headline is 6–12 words and 40–70 characters, with 20–30% common words, 10–20% uncommon words, 10–15% emotional words and at least one power word. The score is a writing guide, not a ranking promise: a great headline still needs a great page behind it. Everything runs in your browser.",
    formula:
      "Score out of 100: 25 points for 6–12 words, 15 for 40–70 characters, 15 each for common, uncommon and emotional word balance, 10 for a power word and 5 for a number.",
    example:
      "“7 Proven Ways to Save Money on Your Weekly Groceries” scores well: 9 words, a number, the power word “proven” and the emotional pull of saving money.",
    howToUse: [
      "Type or paste your headline.",
      "Read the score and the checks below it.",
      "Adjust the wording — add a number, a power word or an emotional word — and watch the score move.",
    ],
    details: [
      {
        heading: "What the score measures",
        body: "Six things: word count (6–12 is best), character length (40–70, so the headline fits in search results), common words (20–30%, for readability), uncommon words (10–20%, to catch the eye), emotional words (10–15%, to make people care) and power words (at least one — proven, free, secret, ultimate). A number and a question each help too.",
      },
      {
        heading: "What the score does not measure",
        body: "Whether the headline is true, whether it matches the page, or whether anyone will actually click it. A headline that promises what the page does not deliver earns bounces, not readers. Use the score to sharpen an honest headline, not to dress up a weak page.",
      },
    ],
    tips: [
      "Start with a number — list headlines get more clicks.",
      "One power word (proven, secret, free, ultimate) adds punch.",
      "Keep it under 70 characters so it is not cut off in search results.",
    ],
    faqs: [
      {
        q: "What makes a good headline?",
        a: "Six to twelve words, 40–70 characters, a mix of common words for readability, uncommon and emotional words for attention, and at least one power word. A number helps too.",
      },
      {
        q: "Does a high headline score guarantee clicks?",
        a: "No. It measures the headline's structure against what tends to work. The page behind it still has to deliver on the promise.",
      },
      {
        q: "How long should a headline be?",
        a: "Aim for 6–12 words and 40–70 characters — long enough to say something specific, short enough to fit in search results.",
      },
    ],
  },
  {
    slug: "domain-age-checker",
    name: "Domain Age Checker",
    category: "SEO Audit",
    short: "Find out when a domain was registered — its age in years and months.",
    keywords:
      "domain age checker, check domain age, how old is a domain, domain registration date, domain age tool",
    custom: "domain-age-checker",
    inputs: [DOMAIN_INPUT],
    compute: () => [],
    about:
      "Find out when a domain was registered and how old it is, in years, months and days. The registration date comes from the domain's RDAP record — the official registration data published by the registrar — so the age is a fact, not an estimate. Older domains are not automatically better, but age is a useful check when buying a domain or sizing up a competitor. The lookup runs from this site's server with strict safety limits, and nothing is stored.",
    formula: "",
    example:
      "Checking example.com reports it was registered in 1995, making it about 30 years old — one of the oldest domains still in use.",
    howToUse: [
      "Type a domain, like example.com (no http://, no path).",
      "Run the check — the registration date and age appear below.",
      "If no record is found, the domain may not be registered or the TLD may not publish RDAP data.",
    ],
    details: [
      {
        heading: "Where the date comes from",
        body: "RDAP (Registration Data Access Protocol), the modern replacement for WHOIS: the registry's own record of when the domain was created, which registrar holds it and when it expires. If a TLD does not publish RDAP data, the tool says so instead of guessing.",
      },
      {
        heading: "Does domain age help SEO?",
        body: "Age alone is a weak signal — Google has said so repeatedly. An old domain that has sat unused is worth little; what matters is the content, the links and the history. Age is useful context when buying a domain, not a ranking strategy.",
      },
    ],
    tips: [
      "Check a domain's age before buying it — a long history can hide a spammy past.",
      "A domain with no record may simply be unregistered — or its TLD may not publish RDAP data.",
      "Pair this with the WHOIS Lookup for the full registration record.",
    ],
    faqs: [
      {
        q: "How do you check a domain's age?",
        a: "From the domain's registration record (RDAP): the creation date is public, and the age is the time since that date.",
      },
      {
        q: "Does an older domain rank better?",
        a: "Not by itself. Age is a weak signal — content, links and history matter far more than the registration date.",
      },
      {
        q: "Why is there no record for my domain?",
        a: "Either the domain is not registered, or its TLD does not publish RDAP data. The tool reports that rather than guessing.",
      },
    ],
  },
  {
    slug: "whois-lookup",
    name: "WHOIS Lookup",
    category: "SEO Audit",
    short: "Look up a domain's registration — registrar, dates, name servers.",
    keywords:
      "whois lookup, whois checker, domain whois, lookup domain registration, whois search",
    custom: "whois-lookup",
    inputs: [DOMAIN_INPUT],
    compute: () => [],
    about:
      "Look up a domain's registration record: who the registrar is, when the domain was created and when it expires, its name servers and its status. The data comes from RDAP, the modern replacement for WHOIS — the registry's own record, fetched live. Registrant names are usually hidden by privacy protection, and the tool shows what the record actually contains rather than guessing. The lookup runs from this site's server with strict safety limits, and nothing is stored.",
    formula: "",
    example:
      "Looking up example.com shows its registrar, a 1995 registration date, its name servers and an active status — the public record, exactly as the registry publishes it.",
    howToUse: [
      "Type a domain, like example.com (no http://, no path).",
      "Run the lookup — the registration record appears below.",
      "If no record is found, the domain may not be registered or the TLD may not publish RDAP data.",
    ],
    details: [
      {
        heading: "What the record shows",
        body: "The registrar (the company the domain is registered with), the creation and expiry dates, the name servers (where the domain's DNS lives) and the domain's status codes (for example, clientTransferProhibited means transfers are locked). Registrant contact details are almost always redacted by privacy protection — that is normal, not a missing record.",
      },
      {
        heading: "RDAP vs WHOIS",
        body: "RDAP is the structured, machine-readable replacement for the old WHOIS protocol: same public registration data, in JSON instead of free text, served by the registry itself. Some country-code TLDs still do not run an RDAP service — for those, the tool reports that no data is available rather than showing a stale or invented record.",
      },
    ],
    tips: [
      "Check the expiry date before buying a domain — a domain expiring soon can be lost.",
      "Status codes like clientTransferProhibited mean the domain is locked against transfers.",
      "Pair this with the Domain Age Checker for the age in years and months.",
    ],
    faqs: [
      {
        q: "What is a WHOIS lookup?",
        a: "A query of a domain's public registration record: the registrar, creation and expiry dates, name servers and status. This tool reads it over RDAP, the modern replacement for WHOIS.",
      },
      {
        q: "Why is the owner's name hidden?",
        a: "Most registrars hide registrant details behind privacy protection. The record shows what the registry publishes — usually the registrar, dates and name servers, but not the owner's name.",
      },
      {
        q: "Why is there no record for my domain?",
        a: "Either the domain is not registered, or its TLD does not publish RDAP data. The tool reports that rather than guessing.",
      },
    ],
  },
];
