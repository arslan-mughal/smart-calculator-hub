# Deployment — Neon + Vercel

CalcHub is a TanStack Start app (Vite + Nitro). It deploys to Vercel with no
code changes: the build uses Nitro, which auto-detects Vercel and applies the
`vercel` preset. Site settings and blog posts live in **Neon Postgres** when
`DATABASE_URL` is set, and fall back to local `content/*.json` files when it
is not (dev only — the Vercel filesystem is ephemeral, so file saves would
not persist there).

## 1. Neon setup

1. Create a project at [neon.tech](https://neon.tech) (free tier is fine).
2. In the Neon dashboard, open **Connect** and copy the **pooled** connection
   string (it ends in `-pooler.…neon.tech` and has `sslmode=require`). The
   pooled endpoint matters: Vercel functions are short-lived, and the HTTP
   driver plus the pooler avoids exhausting connections.
3. Apply the schema — in the Neon **SQL Editor**, or locally:
   ```bash
   psql "$DATABASE_URL" -f db/schema.sql
   ```
   This creates `site_settings` (single row) and `blog_posts`. It is
   idempotent — safe to run again.
4. Load the blog seed data (322 published posts: 320 tool guides + 2 essays):
   ```bash
   psql "$DATABASE_URL" -f db/seed-tool-posts.sql
   ```
   Also idempotent — re-running it REFRESHES existing posts (`ON CONFLICT (slug) DO UPDATE`: title, excerpt, content, category, tags, status and updated_at are replaced; created_at is kept). Regenerate it any time
   with `node scripts/generate-tool-posts.mjs --regenerate-sql`.

   No psql? Use `node scripts/seed-neon.mjs` instead — same result, no
   install needed (it uses the project's own Neon driver). It also runs a
   whole file at once, so no pasting parts into the SQL Editor:
   ```powershell
   $env:DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require"
   node scripts/seed-neon.mjs db/schema.sql
   node scripts/seed-neon.mjs
   ```
   Two databases (dev + production): use `node scripts/seed-neon-both.mjs`
   — one command seeds both. Set the two connection strings once, then run it:
   ```powershell
   $env:DATABASE_URL_DEV="postgresql://user:password@ep-xxx-dev.neon.tech/dbname?sslmode=require"
   $env:DATABASE_URL_PROD="postgresql://user:password@ep-xxx-prod.neon.tech/dbname?sslmode=require"
   node scripts/seed-neon-both.mjs
   ```
   It runs the schema + seed for dev, then for production, and prints a
   summary at the end. Options: `--dry-run` (parse only, no connection
   strings needed), `--only=dev` / `--only=prod`, `--seed-only` (skip the
   schema step). The script prints a count at the end — expect 322 published
   posts on each database. `node scripts/seed-neon.mjs --dry-run` parses the
   file without writing. (The old split seed chunks are no longer provided —
   the script replaces them.)
5. **Do this before the first deploy.** Until the schema is applied, the
   admin settings/blog pages fall back to the local files (which don't exist
   on Vercel), so the blog would render empty and settings saves would fail
   with a clear error instead of silently disappearing.

## 1b. Migrating an existing database (v2.2)

If your Neon database was created before v2.2, the tables exist but are
missing four columns the new code reads. **Run this in the Neon SQL Editor
on BOTH databases (dev and production) BEFORE deploying v2.2** — until it
runs, the blog and settings reads fall back to local files (empty on
Vercel, so the blog would render empty there):

```sql
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS featured_image TEXT NOT NULL DEFAULT '';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS focus_keyword TEXT NOT NULL DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS google_analytics_id TEXT NOT NULL DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS google_search_console_verification TEXT NOT NULL DEFAULT '';
```

Safe to run more than once (`IF NOT EXISTS`). Fresh databases do not need
it — `db/schema.sql` already includes the columns.

## 2. Vercel setup

1. Import the repository in Vercel. Framework is auto-detected (Vite);
   build command `npm run build`, output handled by Nitro (`.vercel/output`).
   No `vercel.json` build settings are needed — the file in this repo only
   sets cache headers for `/assets/*`.
2. Set these environment variables (Production + Preview):
   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | The pooled Neon string from step 1 |
   | `ADMIN_USERNAME` | e.g. `admin` |
   | `ADMIN_PASSWORD_HASH` | From `node scripts/hash-password.mjs "your-strong-password"` |
   | `ADMIN_SESSION_SECRET` | From the same command (32+ random hex chars) |
   | `VITE_SITE_URL` | e.g. `https://your-domain.com` (no trailing slash) |
3. Deploy.

## 3. Verify

- Home page renders, and `/tools` lists 212 tools.
- `/admin/login` signs in with the credentials above; the sidebar shows
  **Database (Neon)** (not "Local files").
- Create a blog post in **Blog Posts → New post**, publish it, and confirm it
  appears on `/blog` immediately (no redeploy needed — reads go to Neon).
- Change the site name in **Site Settings** and confirm the header updates.
- Check `/sitemap.xml` includes `/blog` and the post URLs, and `/robots.txt`
  disallows `/admin`.

## 4. Local development

```bash
cp .env.example .env   # fill in ADMIN_*; leave DATABASE_URL empty for the file store
npm install
npm run dev
```

With `DATABASE_URL` empty, settings live in `content/site-settings.json` and
posts in `content/blog/*.json` — edit them in the admin or by hand. To test
against Neon locally, set `DATABASE_URL` in `.env` (never commit `.env`).

## 5. Notes

- **CSP is not configured in Vercel.** All security headers, including the
  Content-Security-Policy, live in `src/server.ts` and are the single source
  of truth. `vercel.json` only adds `X-Content-Type-Options` and an immutable
  cache header for `/assets/*` (hashed static files).
- **Build target:** `vite.config.ts` adds Nitro's `nitro()` plugin last.
  No preset is hard-coded — Nitro auto-detects Vercel in CI and uses the
  plain Node server preset for local builds (`.output/`).
- **Node version:** Vercel uses Node 22 by default; the app needs Node
  20.19+ / 22.12+.
- **Serverless limits:** the default Vercel function timeout is fine for
  this app (reads are single queries; the sitemap lists ~430 URLs).
