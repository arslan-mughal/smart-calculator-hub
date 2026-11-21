// Site settings: pure types + validation. No fs, no zod, no server imports —
// safe to import from client code (the admin form) and server code alike.
// The single source of truth for defaults; seo.ts re-exports these.
export type SiteSettings = {
  siteName: string;
  tagline: string;
  description: string;
  keywords: string;
  siteUrl: string;
  footerText: string;
  contactEmail: string;
  socialLinks: { x: string; github: string; youtube: string };
  /** GA4 Measurement ID (e.g. G-XXXXXXXXXX). Empty = analytics off. */
  googleAnalyticsId: string;
  /** Content value of the google-site-verification meta tag. Empty = off. */
  googleSearchConsoleVerification: string;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "CalcHub",
  tagline: "Free Online Calculators & Tools",
  description:
    "Free, fast online calculators, converters and everyday tools. No sign-up, and your inputs stay on your device.",
  keywords:
    "online calculators, free online tools, mortgage calculator, bmi calculator, percentage calculator",
  siteUrl: "",
  footerText:
    "Practical calculators and digital utilities that respect your time and privacy. Every tool is free, fast and ready to use.",
  contactEmail: "",
  socialLinks: { x: "", github: "", youtube: "" },
  googleAnalyticsId: "",
  googleSearchConsoleVerification: "",
};

const isHttpsUrl = (value: string): boolean => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

const isEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export type SettingsValidation =
  | { ok: true; settings: SiteSettings }
  | { ok: false; errors: string[] };

/** Validate unknown input (e.g. from the admin form) into clean settings. */
export function validateSiteSettings(input: unknown): SettingsValidation {
  const errors: string[] = [];
  const raw = (input ?? {}) as Record<string, unknown>;
  const str = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
  const social = (raw["socialLinks"] ?? {}) as Record<string, unknown>;

  const settings: SiteSettings = {
    siteName: str(raw["siteName"]),
    tagline: str(raw["tagline"]),
    description: str(raw["description"]),
    keywords: str(raw["keywords"]),
    siteUrl: str(raw["siteUrl"]),
    footerText: str(raw["footerText"]),
    contactEmail: str(raw["contactEmail"]),
    socialLinks: { x: str(social["x"]), github: str(social["github"]), youtube: str(social["youtube"]) },
    // Accept both camelCase (form/JSON) and snake_case (DB rows).
    googleAnalyticsId: str(raw["googleAnalyticsId"] ?? raw["google_analytics_id"]),
    googleSearchConsoleVerification: str(
      raw["googleSearchConsoleVerification"] ?? raw["google_search_console_verification"],
    ),
  };

  if (settings.siteName.length < 2 || settings.siteName.length > 60)
    errors.push("Site name must be 2–60 characters.");
  if (settings.tagline.length > 80) errors.push("Tagline must be at most 80 characters.");
  if (settings.description.length > 300)
    errors.push("Description must be at most 300 characters.");
  if (settings.keywords.length > 300) errors.push("Keywords must be at most 300 characters.");
  if (settings.siteUrl !== "" && !isHttpsUrl(settings.siteUrl))
    errors.push("Site URL must be empty or a valid https:// URL.");
  if (settings.footerText.length > 200)
    errors.push("Footer text must be at most 200 characters.");
  if (settings.contactEmail !== "" && !isEmail(settings.contactEmail))
    errors.push("Contact email must be empty or a valid email address.");
  for (const [key, value] of Object.entries(settings.socialLinks)) {
    if (value !== "" && !isHttpsUrl(value))
      errors.push(`Social link (${key}) must be empty or a valid https:// URL.`);
  }
  if (settings.googleAnalyticsId !== "" && !/^G-[A-Z0-9]{4,}$/.test(settings.googleAnalyticsId))
    errors.push("Google Analytics ID must be empty or a GA4 Measurement ID like G-XXXXXXXXXX.");
  if (
    settings.googleSearchConsoleVerification !== "" &&
    /[\s"']/.test(settings.googleSearchConsoleVerification)
  )
    errors.push("Search Console verification token must not contain spaces or quotes.");

  return errors.length > 0 ? { ok: false, errors } : { ok: true, settings };
}
