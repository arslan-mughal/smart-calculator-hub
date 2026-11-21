import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Settings, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminShell } from "@/components/admin-shell";
import { settingsFromMatches } from "@/lib/seo";
import { getAdminSession } from "@/lib/admin-auth.functions";
import { getSiteSettings, saveSiteSettings } from "@/lib/site-settings.functions";
import type { SiteSettings } from "@/lib/site-settings";

export const Route = createFileRoute("/admin/settings")({
  beforeLoad: async () => {
    const session = await getAdminSession();
    if (!session.authenticated) throw redirect({ to: "/admin/login" });
    return { username: session.username };
  },
  loader: async () => {
    const { settings, store } = await getSiteSettings();
    return { settings, store };
  },
  head: ({ matches }) => {
    const settings = settingsFromMatches(
      matches as unknown as { routeId?: string; loaderData?: unknown }[],
      "/admin",
    );
    return {
    meta: [
      { title: `Site Settings — ${settings.siteName} Admin` },
      { name: "robots", content: "noindex, nofollow" },
    ],
    };
  },
  component: SettingsPage,
});

function Field({
  label, value, onChange, max, hint, type = "text", textarea = false,
}: {
  label: string; value: string; onChange: (v: string) => void; max?: number;
  hint?: string; type?: string; textarea?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label>{label}</Label>
        {max !== undefined && (
          <span className={`text-xs ${value.length > max ? "font-bold text-destructive" : "text-muted-foreground"}`}>
            {value.length}/{max}
          </span>
        )}
      </div>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      ) : (
        <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SettingsPage() {
  const { username } = Route.useRouteContext();
  const { settings: initial, store } = Route.useLoaderData();
  const [form, setForm] = useState<SiteSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const setSocial = (key: keyof SiteSettings["socialLinks"], value: string) =>
    setForm((f) => ({ ...f, socialLinks: { ...f.socialLinks, [key]: value } }));

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const result = await saveSiteSettings({ data: form });
      setMessage(
        result.ok
          ? { ok: true, text: `Saved to ${result.store === "database" ? "Neon (database)" : "content/site-settings.json"}.` }
          : { ok: false, text: result.error },
      );
    } catch {
      setMessage({ ok: false, text: "Could not save the settings. Try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell username={username}>
    <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8">
      <p className="section-kicker flex items-center gap-2"><Settings className="size-4" /> Site settings</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold">Site Settings</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        The name, tagline and description shown across the public site. Currently stored in{" "}
        <strong>{store === "database" ? "Neon (database)" : "local files"}</strong>.
      </p>

      <form onSubmit={save} className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Brand & SEO</CardTitle>
          <CardDescription>These values feed the header, footer, page titles and meta descriptions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            <Field label="Site name" value={form.siteName} onChange={(v) => set("siteName", v)} max={60} hint="Shown in the header, footer and page titles." />
            <Field label="Tagline" value={form.tagline} onChange={(v) => set("tagline", v)} max={80} hint="Shown in the header bar and the home page title." />
            <Field label="Description" value={form.description} onChange={(v) => set("description", v)} max={300} hint="Meta description. Search engines show about the first 160 characters — keep the key message up front." textarea />
            <Field label="Keywords" value={form.keywords} onChange={(v) => set("keywords", v)} max={300} hint="Comma-separated. Used in the home page meta keywords." textarea />
            <Field label="Site URL" value={form.siteUrl} onChange={(v) => set("siteUrl", v)} hint="Optional. When set, it is used for the sitemap and robots.txt origin; otherwise VITE_SITE_URL is used. Must be https://." />
            <Field label="Footer text" value={form.footerText} onChange={(v) => set("footerText", v)} max={200} textarea />
            <Field label="Contact email" value={form.contactEmail} onChange={(v) => set("contactEmail", v)} type="email" hint="Optional. Shown in the footer as a mailto link when set." />
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="X (Twitter) URL" value={form.socialLinks.x} onChange={(v) => setSocial("x", v)} />
              <Field label="GitHub URL" value={form.socialLinks.github} onChange={(v) => setSocial("github", v)} />
              <Field label="YouTube URL" value={form.socialLinks.youtube} onChange={(v) => setSocial("youtube", v)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Search &amp; Analytics</CardTitle>
          <CardDescription>Google Analytics and Search Console. Leave a field blank to disable that feature — nothing is loaded until you save a value here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            <Field
              label="Google Analytics Measurement ID"
              value={form.googleAnalyticsId}
              onChange={(v) => set("googleAnalyticsId", v)}
              hint="GA4 Measurement ID, e.g. G-XXXXXXXXXX. Find it in Google Analytics: Admin > Data Streams > your web stream > Measurement ID. When set, the GA4 tag loads on every public page."
            />
            <Field
              label="Search Console verification token"
              value={form.googleSearchConsoleVerification}
              onChange={(v) => set("googleSearchConsoleVerification", v)}
              hint='The content value only — not the whole tag. In Search Console: Settings > Ownership verification > HTML tag, copy just the content="…" value. When set, the google-site-verification meta tag renders on every public page.'
            />
          </div>
        </CardContent>
      </Card>

      {message && (
        <p className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${message.ok ? "border-emerald-600/30 bg-emerald-50 text-emerald-900" : "border-destructive/30 bg-destructive/5 text-destructive"}`}>
          {message.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <XCircle className="mt-0.5 size-4 shrink-0" />}
          {message.text}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save settings"}</Button>
        <Button type="button" variant="outline" onClick={() => { setForm(initial); setMessage(null); }}>Reset changes</Button>
      </div>
      </form>

      <p className="mt-4 rounded-xl border border-border bg-card p-4 text-sm leading-6 text-muted-foreground">
        <strong className="text-foreground">How saving works:</strong> on a Node server the new
        values apply on the next page load; on Vercel they apply immediately because they are read
        from Neon on every request. On Vercel the filesystem is ephemeral, so DATABASE_URL is
        required there — file saves would not persist. The sitemap/robots origin still comes from
        the Site URL above when set, otherwise VITE_SITE_URL.
      </p>
    </div>
    </AdminShell>
  );
}
