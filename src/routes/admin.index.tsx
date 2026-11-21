import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  BarChart3, ExternalLink, FileText, LayoutDashboard, Newspaper, Plus,
  Settings, ShieldCheck, Wrench,
} from "lucide-react";
import { bySlug, calcs, categories } from "@/lib/registry";
import { readUsage, type UsageEntry } from "@/lib/usage";
import { SECURITY_CHECKS } from "@/lib/admin-checks";
import { listAllPosts } from "@/lib/blog.functions";
import { settingsFromMatches } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { AdminShell } from "@/components/admin-shell";
import { getAdminSession } from "@/lib/admin-auth.functions";

const CategoryCharts = lazy(() =>
  import("@/components/admin-charts").then((m) => ({ default: m.CategoryCharts })),
);
const UsageBarChart = lazy(() =>
  import("@/components/admin-charts").then((m) => ({ default: m.UsageBarChart })),
);

export const Route = createFileRoute("/admin/")({
  beforeLoad: async () => {
    const session = await getAdminSession();
    if (!session.authenticated) throw redirect({ to: "/admin/login" });
    return { username: session.username };
  },
  loader: async () => {
    try {
      const result = await listAllPosts();
      if ("posts" in result) return { posts: result.posts };
    } catch {
      // Loader never throws — the dashboard renders with empty post counts.
    }
    return { posts: [] };
  },
  head: ({ matches }) => {
    const settings = settingsFromMatches(
      matches as unknown as { routeId?: string; loaderData?: unknown }[],
      "/admin",
    );
    return {
    meta: [
      { title: `Admin Dashboard — ${settings.siteName}` },
      { name: "description", content: `Admin dashboard for the ${settings.siteName} tool catalogue, security checks and browser usage.` },
      { name: "robots", content: "noindex, nofollow" },
    ],
    };
  },
  component: Admin,
});

// WordPress-blue palette for the charts (the .wp-admin scope re-themes the
// chart CSS variables too, but the charts take explicit fills).
const CHART_COLORS = ["#2271b1", "#72aee6", "#135e96", "#dba617", "#00a32a", "#50575e", "#8c8f94", "#a7aaad", "#3582c4", "#9ec2e6", "#d63638", "#1d2327"];
const USAGE_KEY = "calchub-usage-v1";

/** A WordPress-style dashboard widget ("postbox"): white, square corners, thin border. */
function Widget({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="border border-[#c3c4c7] bg-white shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-[#c3c4c7] px-4 py-2.5">
        <h2 className="text-sm font-semibold text-[#1d2327]">{title}</h2>
        {action}
      </header>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

function Admin() {
  const { username } = Route.useRouteContext();
  const { posts } = Route.useLoaderData();
  const [usage] = useState<UsageEntry[]>(() => readUsage());
  const [securityPassed, setSecurityPassed] = useState<number | null>(null);

  // The security checks run in the browser (same checks as the Security page).
  useEffect(() => {
    try {
      const passed = SECURITY_CHECKS.filter((c) => {
        try {
          const r = c.run();
          return r === true || r === "server";
        } catch {
          return false;
        }
      }).length;
      setSecurityPassed(passed);
    } catch {
      setSecurityPassed(null);
    }
  }, []);

  const publishedCount = posts.filter((p) => p.status === "published").length;
  const draftCount = posts.filter((p) => p.status === "draft").length;
  const recentPosts = posts.slice(0, 5);
  const popularCount = calcs.filter((t) => t.popular).length;

  const perCategory = useMemo(
    () => categories.map((c, i) => ({ name: c, value: calcs.filter((t) => t.category === c).length, fill: CHART_COLORS[i % CHART_COLORS.length] })),
    [],
  );

  const topTools = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of usage) counts.set(e.slug, (counts.get(e.slug) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([slug, count]) => ({ name: bySlug[slug]?.name ?? slug, slug, count }));
  }, [usage]);

  const last7Days = useMemo(() => {
    const days: { name: string; visits: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toDateString();
      days.push({ name: d.toLocaleDateString("en-US", { weekday: "short" }), visits: usage.filter((e) => new Date(e.at).toDateString() === key).length });
    }
    return days;
  }, [usage]);

  return (
    <AdminShell username={username}>
    <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
      <h1 className="flex items-center gap-2 text-[23px] font-normal leading-8 text-[#1d2327]">
        <LayoutDashboard className="size-5 text-[#2271b1]" /> Dashboard
      </h1>
      <p className="mt-1 text-[13px] text-[#50575e]">
        Welcome back, {username}. {publishedCount} post{publishedCount === 1 ? "" : "s"} published, {draftCount} draft{draftCount === 1 ? "" : "s"}. Usage analytics are stored in{" "}
        <strong>this browser</strong> — settings and blog posts live in Neon when DATABASE_URL is set, otherwise in local content files.
      </p>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* At a Glance */}
          <Widget title="At a Glance">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { icon: Newspaper, label: "Posts published", value: publishedCount },
                { icon: FileText, label: "Drafts", value: draftCount },
                { icon: Wrench, label: "Tools", value: calcs.length },
                { icon: LayoutDashboard, label: "Categories", value: categories.length },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <s.icon className="size-7 shrink-0 text-[#2271b1]" />
                  <div>
                    <dt className="sr-only">{s.label}</dt>
                    <dd className="text-xl font-semibold leading-6 text-[#1d2327]">{s.value}</dd>
                    <dd className="text-xs text-[#50575e]">{s.label}</dd>
                  </div>
                </div>
              ))}
            </dl>
            <p className="mt-4 border-t border-[#dcdcde] pt-3 text-xs text-[#50575e]">
              {popularCount} tools flagged as popular. {categories.length} categories, from {categories[0]} to {categories[categories.length - 1]}.
            </p>
          </Widget>

          {/* Recent posts */}
          <Widget
            title="Recent posts"
            action={<Link to="/admin/blog" className="text-[13px] font-semibold text-[#2271b1] hover:underline">All posts →</Link>}
          >
            {recentPosts.length === 0 ? (
              <p className="text-sm text-[#50575e]">No posts yet.</p>
            ) : (
              <ul className="divide-y divide-[#dcdcde]">
                {recentPosts.map((p) => (
                  <li key={p.slug} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                    <Link to="/admin/blog/$postId" params={{ postId: p.slug }} className="text-sm font-semibold text-[#2271b1] hover:underline">
                      {p.title}
                    </Link>
                    <span className="flex items-center gap-2 text-xs text-[#50575e]">
                      <span className={`rounded-full border px-2 py-0.5 font-semibold ${p.status === "published" ? "border-[#00a32a]/40 bg-[#edfaef] text-[#007017]" : "border-[#c3c4c7] bg-[#f6f7f7] text-[#50575e]"}`}>
                        {p.status === "published" ? "Published" : "Draft"}
                      </span>
                      {p.category}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 border-t border-[#dcdcde] pt-3">
              <Link to="/admin/blog/new">
                <Button size="sm"><Plus className="size-4" /> New post</Button>
              </Link>
            </div>
          </Widget>

          {/* Charts — recharts loads lazily so it never blocks the first paint. */}
          <Widget title="Tools by category">
            <Suspense fallback={<div className="h-72 animate-pulse bg-[#f6f7f7]" aria-label="Loading charts" />}>
              <CategoryCharts data={perCategory} />
            </Suspense>
          </Widget>

          {/* Recent usage preview */}
          <Widget
            title="Recent usage — this browser only"
            action={<Link to="/admin/usage" className="text-[13px] font-semibold text-[#2271b1] hover:underline">Full usage →</Link>}
          >
            <p className="text-[13px] text-[#50575e]">Stored only in this browser, never sent anywhere. Visits are recorded when a tool page opens.</p>
            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-[#1d2327]">Top 5 tools</h3>
                {topTools.length === 0 ? <p className="mt-2 text-sm text-[#50575e]">No visits recorded yet — open a tool and come back.</p> : (
                  <ul className="mt-3 space-y-2">{topTools.map((t) => (<li key={t.slug} className="flex items-center justify-between border border-[#dcdcde] px-3 py-2 text-sm"><Link to="/$slug" params={{ slug: t.slug }} className="font-semibold text-[#2271b1] hover:underline">{t.name}</Link><span className="font-semibold">{t.count} visit{t.count === 1 ? "" : "s"}</span></li>))}</ul>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1d2327]">Visits — last 7 days</h3>
                <div className="mt-3">
                  <Suspense fallback={<div className="h-56 animate-pulse bg-[#f6f7f7]" aria-label="Loading chart" />}>
                    <UsageBarChart data={last7Days} />
                  </Suspense>
                </div>
              </div>
            </div>
          </Widget>
        </div>

        <div className="space-y-5">
          {/* Security status */}
          <Widget
            title="Security"
            action={<Link to="/admin/security" className="text-[13px] font-semibold text-[#2271b1] hover:underline">Run checks →</Link>}
          >
            {securityPassed === null ? (
              <p className="text-sm text-[#50575e]">Checking…</p>
            ) : (
              <p className="flex items-start gap-2 text-sm text-[#1d2327]">
                <ShieldCheck className={`mt-0.5 size-5 shrink-0 ${securityPassed === SECURITY_CHECKS.length ? "text-[#00a32a]" : "text-[#d63638]"}`} />
                <span>
                  <strong>{securityPassed}/{SECURITY_CHECKS.length} checks passed.</strong>{" "}
                  {securityPassed === SECURITY_CHECKS.length
                    ? "All security checks pass."
                    : "Some checks need attention — open the Security page for details."}
                </span>
              </p>
            )}
            <p className="mt-3 text-xs text-[#50575e]">{SECURITY_CHECKS.length} checks from the November 2026 security pass. See SECURITY-FIXES.md for the full list.</p>
          </Widget>

          {/* Quick actions */}
          <Widget title="Quick actions">
            <div className="flex flex-col items-start gap-2">
              <Link to="/admin/blog/new">
                <Button size="sm"><Plus className="size-4" /> New post</Button>
              </Link>
              <Link to="/admin/settings" className="flex items-center gap-2 text-sm font-semibold text-[#2271b1] hover:underline">
                <Settings className="size-4" /> Site settings
              </Link>
              <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-semibold text-[#2271b1] hover:underline">
                <ExternalLink className="size-4" /> View site
              </a>
            </div>
          </Widget>

          {/* Site health */}
          <Widget title="Site health">
            <ul className="space-y-2 text-sm text-[#1d2327]">
              <li className="flex justify-between border-b border-[#dcdcde] pb-2"><span className="text-[#50575e]">Tools</span><strong>{calcs.length}</strong></li>
              <li className="flex justify-between border-b border-[#dcdcde] pb-2"><span className="text-[#50575e]">Categories</span><strong>{categories.length}</strong></li>
              <li className="flex justify-between border-b border-[#dcdcde] pb-2"><span className="text-[#50575e]">Tool visits (this browser)</span><strong>{usage.length}</strong></li>
              <li className="flex justify-between"><span className="text-[#50575e]">Security pass</span><strong>17 Nov 2026</strong></li>
            </ul>
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
              <Link to="/tools" className="font-semibold text-[#2271b1] hover:underline">Tool directory</Link>
              <Link to="/blog" className="font-semibold text-[#2271b1] hover:underline">Blog</Link>
              <Link to="/privacy" className="font-semibold text-[#2271b1] hover:underline">Privacy policy</Link>
            </p>
          </Widget>

          {/* Usage chart quick link */}
          <Widget title="Usage">
            <p className="text-sm text-[#50575e]">Browser usage is local only (localStorage {USAGE_KEY}, max 500 entries).</p>
            <p className="mt-3">
              <Link to="/admin/usage" className="inline-flex items-center gap-2 text-sm font-semibold text-[#2271b1] hover:underline">
                <BarChart3 className="size-4" /> View full usage
              </Link>
            </p>
          </Widget>
        </div>
      </div>
    </div>
    </AdminShell>
  );
}
