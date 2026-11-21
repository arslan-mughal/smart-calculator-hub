// Server-only site-settings storage: Neon when DATABASE_URL is set,
// content/site-settings.json as the local-dev fallback.
// Reads never throw (public pages must render even if the DB is down — they
// fall back to the file store, then to defaults). Writes throw when the
// configured store fails, so the admin never gets a false "saved".
// Never import this file from client code.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getDb, isDbConfigured } from "./db.server";
import { DEFAULT_SETTINGS, validateSiteSettings, type SiteSettings } from "./site-settings";

/** Tests may point the file store at a temp dir. */
export function contentDir(): string {
  return process.env["CALCHUB_CONTENT_DIR"] ?? join(process.cwd(), "content");
}

function settingsPath(): string {
  return join(contentDir(), "site-settings.json");
}

export function readSettingsFromDisk(): SiteSettings {
  try {
    const parsed = JSON.parse(readFileSync(settingsPath(), "utf8")) as unknown;
    const result = validateSiteSettings(parsed);
    return result.ok ? result.settings : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function writeSettingsToDisk(settings: SiteSettings): void {
  const result = validateSiteSettings(settings);
  if (!result.ok) throw new Error(`Invalid site settings: ${result.errors.join(" ")}`);
  mkdirSync(contentDir(), { recursive: true });
  writeFileSync(settingsPath(), `${JSON.stringify(result.settings, null, 2)}\n`, "utf8");
}

type SettingsRow = {
  site_name: string; tagline: string; description: string; keywords: string;
  site_url: string; footer_text: string; contact_email: string;
  social_x: string; social_github: string; social_youtube: string;
  google_analytics_id?: string | null; google_search_console_verification?: string | null;
};

function rowToSettings(row: SettingsRow): SiteSettings {
  const result = validateSiteSettings({
    siteName: row.site_name, tagline: row.tagline, description: row.description,
    keywords: row.keywords, siteUrl: row.site_url, footerText: row.footer_text,
    contactEmail: row.contact_email,
    socialLinks: { x: row.social_x, github: row.social_github, youtube: row.social_youtube },
    googleAnalyticsId: row.google_analytics_id ?? "",
    googleSearchConsoleVerification: row.google_search_console_verification ?? "",
  });
  return result.ok ? result.settings : DEFAULT_SETTINGS;
}

async function readSettingsFromDb(): Promise<SiteSettings> {
  const db = getDb();
  if (!db) return readSettingsFromDisk();
  try {
    const rows = await db`SELECT site_name, tagline, description, keywords, site_url, footer_text, contact_email, social_x, social_github, social_youtube, google_analytics_id, google_search_console_verification FROM site_settings WHERE id = 'default'`;
    if (rows.length === 0) return DEFAULT_SETTINGS;
    return rowToSettings(rows[0] as SettingsRow);
  } catch (error) {
    // Table missing (schema not applied yet) or DB unreachable: the public
    // site must still render. The admin shows the "Local files" fallback note.
    console.error("site-settings: database read failed, using file fallback");
    void error;
    return readSettingsFromDisk();
  }
}

async function writeSettingsToDb(settings: SiteSettings): Promise<void> {
  const db = getDb();
  if (!db) return writeSettingsToDisk(settings);
  await db`
    INSERT INTO site_settings (id, site_name, tagline, description, keywords, site_url, footer_text, contact_email, social_x, social_github, social_youtube, google_analytics_id, google_search_console_verification, updated_at)
    VALUES ('default', ${settings.siteName}, ${settings.tagline}, ${settings.description}, ${settings.keywords}, ${settings.siteUrl}, ${settings.footerText}, ${settings.contactEmail}, ${settings.socialLinks.x}, ${settings.socialLinks.github}, ${settings.socialLinks.youtube}, ${settings.googleAnalyticsId}, ${settings.googleSearchConsoleVerification}, now())
    ON CONFLICT (id) DO UPDATE SET
      site_name = EXCLUDED.site_name, tagline = EXCLUDED.tagline,
      description = EXCLUDED.description, keywords = EXCLUDED.keywords,
      site_url = EXCLUDED.site_url, footer_text = EXCLUDED.footer_text,
      contact_email = EXCLUDED.contact_email, social_x = EXCLUDED.social_x,
      social_github = EXCLUDED.social_github, social_youtube = EXCLUDED.social_youtube,
      google_analytics_id = EXCLUDED.google_analytics_id,
      google_search_console_verification = EXCLUDED.google_search_console_verification,
      updated_at = now()
  `;
}

/** Unified read: Neon when configured, otherwise the JSON file, else defaults. */
export async function readSettings(): Promise<SiteSettings> {
  if (!isDbConfigured()) return readSettingsFromDisk();
  return readSettingsFromDb();
}

/**
 * Unified write: Neon when configured, otherwise the JSON file.
 * Validates first; throws on invalid input or on a failed DB write (no
 * silent fallback to files on Vercel — the filesystem there is ephemeral).
 */
export async function writeSettings(settings: SiteSettings): Promise<SiteSettings> {
  const result = validateSiteSettings(settings);
  if (!result.ok) throw new Error(`Invalid site settings: ${result.errors.join(" ")}`);
  if (isDbConfigured()) await writeSettingsToDb(result.settings);
  else writeSettingsToDisk(result.settings);
  return result.settings;
}

/** True when the file store has a settings file (used by the admin UI note). */
export function settingsFileExists(): boolean {
  return existsSync(settingsPath());
}
