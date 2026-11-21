import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import { BarChart3, Download, Trash2 } from "lucide-react";
import { bySlug } from "@/lib/registry";
import { clearUsage, readUsage, type UsageEntry } from "@/lib/usage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminShell } from "@/components/admin-shell";
import { settingsFromMatches } from "@/lib/seo";
import { getAdminSession } from "@/lib/admin-auth.functions";

const UsageBarChart = lazy(() =>
  import("@/components/admin-charts").then((m) => ({ default: m.UsageBarChart })),
);

export const Route = createFileRoute("/admin/usage")({
  beforeLoad: async () => {
    const session = await getAdminSession();
    if (!session.authenticated) throw redirect({ to: "/admin/login" });
    return { username: session.username };
  },
  head: ({ matches }) => {
    const settings = settingsFromMatches(
      matches as unknown as { routeId?: string; loaderData?: unknown }[],
      "/admin",
    );
    return {
    meta: [
      { title: `Usage — ${settings.siteName} Admin` },
      { name: "robots", content: "noindex, nofollow" },
    ],
    };
  },
  component: UsagePage,
});

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function UsagePage() {
  const { username } = Route.useRouteContext();
  const [usage, setUsage] = useState<UsageEntry[]>(() => readUsage());

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
    <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
      <p className="section-kicker flex items-center gap-2"><BarChart3 className="size-4" /> Usage analytics</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold">Usage</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Stored only in this browser, never sent anywhere. Visits are recorded when a tool page opens.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Usage analytics — this browser only</CardTitle>
          <CardDescription>{usage.length} visits recorded (localStorage, max 500).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-bold">Top 5 tools</h3>
              {topTools.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No visits recorded yet — open a tool and come back.</p> : (
                <ul className="mt-3 space-y-2">{topTools.map((t) => (<li key={t.slug} className="flex items-center justify-between rounded-lg border p-3 text-sm"><Link to="/$slug" params={{ slug: t.slug }} className="font-semibold text-primary hover:underline">{t.name}</Link><span className="font-bold">{t.count} visit{t.count === 1 ? "" : "s"}</span></li>))}</ul>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => download("calchub-usage.json", JSON.stringify(usage, null, 2), "application/json")}><Download className="size-4" /> Export JSON</Button>
                <Button variant="outline" size="sm" onClick={() => { clearUsage(); setUsage([]); }}><Trash2 className="size-4" /> Clear local data</Button>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold">Visits — last 7 days</h3>
              <div className="mt-3">
                <Suspense fallback={<div className="h-56 animate-pulse rounded-xl bg-muted/40" aria-label="Loading chart" />}>
                  <UsageBarChart data={last7Days} />
                </Suspense>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </AdminShell>
  );
}
