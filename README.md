# Smart Calculator Hub (CalcHub)

An independent TanStack Start + React 19 + Vite website with 212 free online
calculators, converters, text tools, random generators, developer utilities and
sports calculators, plus a blog with a guide for every tool. Inspired by miniwebtool.com.

Every tool runs in the browser. There is no account and no third-party AI
service. The tool finder matches your description against the local catalogue
on your device — nothing is sent to a server. Passwords and UUIDs are generated
with `crypto.getRandomValues()`. Site settings and blog posts live in Neon
Postgres when `DATABASE_URL` is set (required on Vercel), and fall back to
local `content/*.json` files in development — see [DEPLOYMENT.md](DEPLOYMENT.md).

## Development

You need Node.js 20+ and npm (or Bun).

```sh
npm install        # or: bun install
npm run dev        # start the dev server
npm test           # run the Vitest suite
npm run build      # production build (output in .output/)
npm run preview    # preview the production build
```

## Admin dashboard

The admin area lives at `/admin` and is separate from the public site (own
layout, no public header/footer). It requires a real server-side login:

1. `cp .env.example .env`
2. `node scripts/hash-password.mjs "a-strong-password"` and paste the two printed
   lines (`ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`) into `.env`; set `ADMIN_USERNAME`.
3. Restart `npm run dev`, then open `/admin` (it redirects to `/admin/login`).

The password is stored only as a scrypt hash. A successful login sets a signed,
httpOnly, SameSite=Strict session cookie (8 hours); five failed attempts lock the
client address for 15 minutes. In production set the same variables in your
host's environment.

The sidebar (collapsible, state saved in `localStorage` as
`calchub-admin-sidebar-v1`; on mobile it becomes a drawer) has six sections:

- **Overview** — stat cards, tools-per-category charts (recharts, lazy-loaded)
  and a recent-usage preview.
- **Tools** — the tool inventory with search, sort, pagination and CSV export.
- **Blog Posts** — the blog CMS: table with publish/unpublish and delete,
  plus a Markdown editor with live preview.
- **Site Settings** — site name, tagline, description, keywords, site URL,
  footer text, contact email and social links. Saved to Neon when
  `DATABASE_URL` is set, otherwise to `content/site-settings.json`.
- **Security** — the security checks panel (Run checks).
- **Usage** — usage analytics stored only in the admin's own browser
  (`localStorage` key `calchub-usage-v1`), with JSON export and clear.

A badge in the sidebar shows the active store: **Database (Neon)** or
**Local files**. On Vercel the filesystem is ephemeral, so `DATABASE_URL` is
required there — see [DEPLOYMENT.md](DEPLOYMENT.md).

## Blog CMS

Posts live in Neon (`blog_posts`) when `DATABASE_URL` is set, otherwise as
`content/blog/<slug>.json` files (fields: slug, title, excerpt, content in
Markdown, category, tags, status draft/published, author, createdAt,
updatedAt). The public blog is at `/blog`, articles at `/blog/<slug>`.

- Create/edit posts in the admin (**Blog Posts**), or edit the JSON files
  directly in development.
- One guide per tool is generated, never hand-written:
  `node scripts/generate-tool-posts.mjs` (writes `content/blog/<slug>-guide.json`
  and `db/seed-tool-posts.sql`; skips posts that already exist). See [SEO.md](SEO.md).
- Markdown is rendered by a safe renderer (`src/lib/markdown.ts`) that escapes
  all HTML first — the only `dangerouslySetInnerHTML` in the codebase renders
  its output.

## Security

See `SECURITY.md` for the security policy and `SECURITY-FIXES.md` for the
November 2026 security pass (crypto-secure randomness, local finder, security
headers, regex/image limits, removal of all third-party AI traces).

## Project layout

- `src/routes/` — TanStack Router file routes (`/`, `/tools`, `/$slug`, `/blog`, `/blog/$slug`, `/about`, `/privacy`, `/admin/*`)
- `src/lib/registry.ts` — the tool catalogue; `src/lib/local-finder.ts` — the local tool finder
- `src/lib/extra-tools/` — text, random and developer tools
- `src/lib/tool-seo.ts` — derived SEO content per tool (description, how-to, FAQs, related tools, guide posts)
- `src/lib/site-settings.ts` + `site-settings.server.ts` + `site-settings.functions.ts` — settings (pure / storage / server fns)
- `src/lib/blog.ts` + `blog.server.ts` + `blog.functions.ts` — blog posts (pure / storage / server fns)
- `src/lib/db.server.ts` — Neon client + the database-vs-files decision point
- `src/lib/markdown.ts` — the safe Markdown renderer
- `src/components/` — UI components, including the image resizer, QR generator, admin sidebar shell and blog editor
- `src/server.ts` — SSR entry wrapper: generic error page + security headers + sitemap/robots
- `content/` — `site-settings.json` and `blog/*.json` (local-dev file store)
- `db/` — `schema.sql` and the generated `seed-tool-posts.sql` (Neon)

## SEO

- Set `VITE_SITE_URL` in `.env` (or your host's environment) to the public origin, e.g. `https://calchub.com`. It drives canonical URLs, Open Graph URLs, `/sitemap.xml` and `/robots.txt`. A Site URL set in Site Settings takes precedence for the sitemap/robots origin.
- `src/lib/seo.ts` builds every page's title, description, canonical, Open Graph/Twitter tags and JSON-LD (WebSite, Organization, WebApplication, BreadcrumbList, FAQPage, ItemList, Article). Use `buildHead()` in any new route.
- `/sitemap.xml` and `/robots.txt` are generated in `src/server.ts` from the tool registry and the published blog posts, so new tools and posts are included automatically. `/admin` is disallowed, `noindex`, and sent with `X-Robots-Tag`.
- Tool pages get a derived FAQ section (3–5 questions), related tools and FAQPage JSON-LD; each tool has a guide post — see [SEO.md](SEO.md) for the full system and the keyword research summary.
- Social preview image: `public/og-image.png` (1200x630).

## Performance

See [PERFORMANCE.md](PERFORMANCE.md) for before/after build sizes. In short:
admin charts and the homepage tool finder are lazy-loaded, tool-card grids use
`content-visibility: auto`, the Manrope 800 font is preloaded, and the 212-tool
registry (~250 kB) is the largest remaining chunk — a catalogue split is the
documented next step.

## Deployment

Vercel + Neon Postgres. See [DEPLOYMENT.md](DEPLOYMENT.md) for the step-by-step
(Neon project, schema + seed SQL, Vercel env vars, verification).
