import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, validateSiteSettings } from "@/lib/site-settings";

const valid = {
  siteName: "CalcHub",
  tagline: "Free Online Calculators & Tools",
  description: "Free calculators.",
  keywords: "calculators",
  siteUrl: "",
  footerText: "Footer.",
  contactEmail: "",
  socialLinks: { x: "", github: "", youtube: "" },
};

describe("validateSiteSettings", () => {
  it("accepts the defaults and a full valid input", () => {
    expect(validateSiteSettings(DEFAULT_SETTINGS).ok).toBe(true);
    const result = validateSiteSettings({ ...valid, siteUrl: "https://example.com", contactEmail: "hi@example.com", socialLinks: { x: "https://x.com/calc", github: "", youtube: "" } });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.settings.siteUrl).toBe("https://example.com");
  });

  it("rejects a site name that is too short or too long", () => {
    expect(validateSiteSettings({ ...valid, siteName: "C" }).ok).toBe(false);
    expect(validateSiteSettings({ ...valid, siteName: "x".repeat(61) }).ok).toBe(false);
  });

  it("rejects an over-long tagline, description, keywords and footer", () => {
    expect(validateSiteSettings({ ...valid, tagline: "x".repeat(81) }).ok).toBe(false);
    expect(validateSiteSettings({ ...valid, description: "x".repeat(301) }).ok).toBe(false);
    expect(validateSiteSettings({ ...valid, keywords: "x".repeat(301) }).ok).toBe(false);
    expect(validateSiteSettings({ ...valid, footerText: "x".repeat(201) }).ok).toBe(false);
  });

  it("rejects a non-https site URL", () => {
    expect(validateSiteSettings({ ...valid, siteUrl: "http://example.com" }).ok).toBe(false);
    expect(validateSiteSettings({ ...valid, siteUrl: "not-a-url" }).ok).toBe(false);
  });

  it("rejects an invalid contact email", () => {
    expect(validateSiteSettings({ ...valid, contactEmail: "not-an-email" }).ok).toBe(false);
  });

  it("rejects a non-https social link", () => {
    expect(validateSiteSettings({ ...valid, socialLinks: { x: "ftp://example.com", github: "", youtube: "" } }).ok).toBe(false);
  });

  it("returns all errors at once", () => {
    const result = validateSiteSettings({ ...valid, siteName: "C", contactEmail: "bad" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it("accepts empty analytics fields (features off) and defaults them", () => {
    expect(validateSiteSettings(valid).ok).toBe(true);
    const result = validateSiteSettings(valid);
    if (result.ok) {
      expect(result.settings.googleAnalyticsId).toBe("");
      expect(result.settings.googleSearchConsoleVerification).toBe("");
    }
  });

  it("accepts a GA4 Measurement ID and a verification token", () => {
    const result = validateSiteSettings({
      ...valid,
      googleAnalyticsId: "G-ABC1234567",
      googleSearchConsoleVerification: "dBw5CvBG1vG9ZvC9X1y2z3a4b5c6d7e8f9g0",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.settings.googleAnalyticsId).toBe("G-ABC1234567");
      expect(result.settings.googleSearchConsoleVerification).toBe("dBw5CvBG1vG9ZvC9X1y2z3a4b5c6d7e8f9g0");
    }
  });

  it("rejects malformed GA IDs and verification tokens with spaces or quotes", () => {
    expect(validateSiteSettings({ ...valid, googleAnalyticsId: "UA-123456-1" }).ok).toBe(false);
    expect(validateSiteSettings({ ...valid, googleAnalyticsId: "G-abc" }).ok).toBe(false);
    expect(validateSiteSettings({ ...valid, googleAnalyticsId: "G-ABC 123" }).ok).toBe(false);
    expect(validateSiteSettings({ ...valid, googleSearchConsoleVerification: "token with spaces" }).ok).toBe(false);
    expect(validateSiteSettings({ ...valid, googleSearchConsoleVerification: 'tok"en' }).ok).toBe(false);
  });
});
