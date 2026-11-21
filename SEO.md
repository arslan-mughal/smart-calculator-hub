# SEO — tool pages, FAQs, guide posts, internal linking

## How it works

Every tool page (`src/routes/$slug.tsx`) and every tool-guide blog post is
generated from the same source: the tool's own registry entry
(`src/lib/registry.ts` + `src/lib/extra-tools/*`) plus the derivation layer
in `src/lib/tool-seo.ts`. Nothing is invented — where a tool has no formula,
the formula section is hidden rather than filled with a guess.

### Tool pages

- **Description section** ("Guide & explanation"): the tool's `about` text,
  a **How to use** list (the tool's own `howToUse`, or steps derived from its
  inputs), any `details` sections, the **Formula** (only when the tool has
  one), a **Worked example**, and **Tips**.
- **FAQ section** (shadcn Accordion, 3–5 questions): the tool's own `faqs`
  first, then honest generic questions — what formula it uses (only when a
  formula exists), what inputs it needs, whether it is free, whether data
  leaves the browser, how accurate it is. Priority tools also get a long-tail
  extra (e.g. "How can I raise my GPA?", "What is a good profit margin?").
  The same set is emitted as **FAQPage JSON-LD** in the page head
  (`faqJsonLd` in `src/lib/seo.ts`), alongside the existing WebApplication
  and Breadcrumb JSON-LD.
- **Related tools**: same category first, then popular tools, max 6, never
  the tool itself (`getToolSeo().relatedSlugs`).
- **Brand**: page titles and copy use the live site name from Site Settings
  (via the root loader), falling back to the `CalcHub` default.

### Tool-guide blog posts

One post per tool, generated — never hand-written:

```bash
node scripts/generate-tool-posts.mjs            # generate missing guides + seed SQL
node scripts/generate-tool-posts.mjs --regenerate-sql   # rebuild db/seed-tool-posts.sql only
```

- Output: `content/blog/<tool-slug>-guide.json` (slug pattern keeps it off
  the tool's own route: `/blog/mortgage-calculator-guide` links to
  `/mortgage-calculator`).
- Each post: title "`<Tool name>: how it works, formula and examples`",
  excerpt ≤160 chars, ~300–500 words of Markdown (intro, what it does, how
  to use it, formula, worked example, **what the result shows** — computed
  from the tool's own default values — tips, FAQ, try-it links).
- The generator **skips slugs that already exist**, so the two hand-written
  seed posts are never overwritten and re-running only adds guides for newly
  added tools. After adding a tool, re-run it.
- Verification (built into the script): all 212 guides exist, every post
  renders with the safe Markdown renderer, every internal link target exists
  (tool slugs + blog slugs + categories), no two posts share the same first
  200 characters, every excerpt ≤160 chars.
- Current counts: **212 guides + 2 published essays + 1 draft = 215 posts**,
  avg ~387 words per guide. Simple converters (e.g. lowercase converter)
  are shorter — there is only so much honest content for them, and filler
  was deliberately not added.
- **Neon seed**: the script also writes `db/seed-tool-posts.sql` from all
  published posts (apply with `psql "$DATABASE_URL" -f db/seed-tool-posts.sql`).

### Internal linking rules

- Every guide post links to: its own tool page (`/<slug>`), 3–4 related
  tools, its category page (`/tools?category=<Category>`), and `/blog`.
- Tool pages link to: their category page, up to 6 related tools, the tool
  directory, and the privacy policy.
- The blog list and article pages link to related posts in the same category.
- The sitemap (`src/server.ts`) includes `/`, `/tools`, every tool page,
  `/blog` and every published post URL (~430 URLs).

### Keyword research (third-party estimates, not facts)

Priority order from the research pass (US monthly volume, Ahrefs/Semrush
historical ranges): BMI 1.5M, Percentage 1.2M, Age 800k, TDEE/Calorie 800k,
GPA 673k, Mortgage 450k, Time Zone Converter 400k, Income Tax 350k, Loan
300k, Compound Interest 200k, Invoice Generator 200k, Days Between Dates
200k, Macro 200k, Auto Loan 150k, Body Fat 150k, Salary→Hourly 100k,
Refinance 90k, Profit Margin 80k, ROI 70k, Investment 60k.

Reality check: keyword difficulty is 65–85 on the head terms (calculator.net,
Bankrate, NerdWallet own page 1; Google's own calculator widget answers
several head terms). The realistic first wins are the lower-KD terms:
break-even (KD 45), days-between-dates (50), profit margin (50), body fat
(55), ROI (55). Long-tail patterns woven into guides and FAQs: "how to
calculate…" formula questions, "mortgage calculator with taxes and
insurance", "free paycheck calculator with federal and state taxes",
"how to raise GPA calculator" (22k/mo, KD 18).

Notes:
- Four researched terms have **no matching tool** and therefore no guide:
  Income Tax Calculator, Invoice Generator, Investment Calculator, Paycheck
  Calculator. Closest existing tools: Sales Tax, Salary Calculator,
  Compound Interest / ROI / SIP. Adding those tools is the way to target
  those terms — do not fake it with a guide that links nowhere.
- The homepage "popular tools" section is ordered by this priority list
  (BMI, percentage, age, TDEE, GPA, mortgage first), then evergreen utilities.
- The homepage title tag uses "Free Online Calculators" wording via the
  Site Settings defaults (`CalcHub — 212 Free Online Calculators & Tools`).
- **Brand/domain:** a keyword in the domain barely helps ranking (Google's
  own guidance), so the brand stays `CalcHub` as the configurable default in
  Site Settings; the user decides the final name/domain separately. No
  hardcoded brand name remains in user-visible UI outside the settings
  defaults.

### Scale guard

The `/blog` list and its server function return **metadata only** (slug,
title, excerpt, category, tags, status, dates — never `content`), so 200+
posts don't bloat the list payload. The detail route loads one full post.
The admin blog table is paginated (25/page default).
