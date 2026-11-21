-- CalcHub — Neon Postgres schema.
-- Idempotent: safe to run more than once.
-- Apply it in the Neon SQL editor, or locally with:
--   psql "$DATABASE_URL" -f db/schema.sql
-- It must be applied before the admin settings/blog pages can use the database;
-- until then the app falls back to the local content/*.json files (see DEPLOYMENT.md).

CREATE TABLE IF NOT EXISTS site_settings (
  id            TEXT PRIMARY KEY DEFAULT 'default',
  site_name     TEXT NOT NULL DEFAULT 'CalcHub',
  tagline       TEXT NOT NULL DEFAULT 'Free Online Calculators & Tools',
  description   TEXT NOT NULL DEFAULT 'Free, fast online calculators, converters and everyday tools. No sign-up, and your inputs stay on your device.',
  keywords      TEXT NOT NULL DEFAULT '',
  site_url      TEXT NOT NULL DEFAULT '',
  footer_text   TEXT NOT NULL DEFAULT 'Practical calculators and digital utilities that respect your time and privacy. Every tool is free, fast and ready to use.',
  contact_email TEXT NOT NULL DEFAULT '',
  social_x      TEXT NOT NULL DEFAULT '',
  social_github TEXT NOT NULL DEFAULT '',
  social_youtube TEXT NOT NULL DEFAULT '',
  google_analytics_id TEXT NOT NULL DEFAULT '',
  google_search_console_verification TEXT NOT NULL DEFAULT '',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blog_posts (
  slug       TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  excerpt    TEXT NOT NULL DEFAULT '',
  content    TEXT NOT NULL DEFAULT '',
  category   TEXT NOT NULL DEFAULT 'General',
  tags       TEXT[] NOT NULL DEFAULT '{}',
  status     TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  author     TEXT NOT NULL DEFAULT 'CalcHub',
  featured_image TEXT NOT NULL DEFAULT '',
  focus_keyword TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blog_posts_status_created_idx
  ON blog_posts (status, created_at DESC);
