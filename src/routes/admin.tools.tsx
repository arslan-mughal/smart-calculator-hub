import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, Wrench,
} from "lucide-react";
import { calcs, categories } from "@/lib/registry";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminShell } from "@/components/admin-shell";
import { settingsFromMatches } from "@/lib/seo";
import { getAdminSession } from "@/lib/admin-auth.functions";

export const Route = createFileRoute("/admin/tools")({
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
      { title: `Tool inventory — ${settings.siteName} Admin` },
      { name: "robots", content: "noindex, nofollow" },
    ],
    };
  },
  component: ToolsPage,
});

const PAGE_SIZES = [10, 25, 50, 100] as const;

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function ToolsPage() {
  const { username } = Route.useRouteContext();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<"name" | "category" | "popular">("name");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const filtered = useMemo(() => {
    let list = calcs.filter((t) =>
      (category === "All" || t.category === category) &&
      (t.name.toLowerCase().includes(query.toLowerCase()) || t.slug.includes(query.toLowerCase())),
    );
    list = [...list].sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name)
      : sort === "category" ? a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
      : Number(b.popular ?? false) - Number(a.popular ?? false) || a.name.localeCompare(b.name),
    );
    return list;
  }, [query, category, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * pageSize;
  const paged = filtered.slice(startIndex, startIndex + pageSize);
  const pageNumbers = useMemo(() => {
    const nums = new Set([1, pageCount, currentPage - 1, currentPage, currentPage + 1]);
    const sorted = [...nums].filter((n) => n >= 1 && n <= pageCount).sort((a, b) => a - b);
    const out: (number | "gap")[] = [];
    sorted.forEach((n, i) => {
      if (i > 0 && n - sorted[i - 1]! > 1) out.push("gap");
      out.push(n);
    });
    return out;
  }, [currentPage, pageCount]);

  function exportCsv() {
    const rows = [["Name", "Slug", "Category", "Inputs", "Popular", "Status"], ...filtered.map((t) => [t.name, t.slug, t.category, String(t.inputs.length), t.popular ? "Yes" : "No", t.slug === "password-generator" || t.slug === "uuid-generator" ? "Secure" : "Standard"])];
    download("calchub-tools.csv", rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n"), "text/csv");
  }

  return (
    <AdminShell username={username}>
    <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
      <p className="section-kicker flex items-center gap-2"><Wrench className="size-4" /> Tool inventory</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold">Tools</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        All {calcs.length} tools in the catalogue. Click a name to open the public tool.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><CardTitle>Tool inventory</CardTitle><CardDescription>{filtered.length === 0 ? "No tools match" : `Showing ${startIndex + 1}–${startIndex + paged.length} of ${filtered.length}`}{filtered.length !== calcs.length ? ` (filtered from ${calcs.length})` : ""}.</CardDescription></div>
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="size-4" /> Export CSV</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Input placeholder="Search tools…" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} className="max-w-xs" />
            <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" aria-label="Filter by category">
              <option value="All">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={sort} onChange={(e) => { setSort(e.target.value as typeof sort); setPage(1); }} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" aria-label="Sort tools">
              <option value="name">Sort: Name</option><option value="category">Sort: Category</option><option value="popular">Sort: Popular first</option>
            </select>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-muted-foreground"><th className="py-2 pr-3">Name</th><th className="py-2 pr-3">Slug</th><th className="py-2 pr-3">Category</th><th className="py-2 pr-3">Inputs</th><th className="py-2 pr-3">Popular</th><th className="py-2">Status</th></tr></thead>
              <tbody>
                {paged.map((t) => (
                  <tr key={t.slug} className="border-b hover:bg-muted/50">
                    <td className="py-2 pr-3 font-semibold"><Link to="/$slug" params={{ slug: t.slug }} className="text-primary hover:underline">{t.name}</Link></td>
                    <td className="py-2 pr-3 font-mono text-xs">{t.slug}</td>
                    <td className="py-2 pr-3">{t.category}</td>
                    <td className="py-2 pr-3">{t.inputs.length}</td>
                    <td className="py-2 pr-3">{t.popular ? "Yes" : "—"}</td>
                    <td className="py-2"><Badge variant={t.slug === "password-generator" || t.slug === "uuid-generator" ? "default" : "secondary"}>{t.slug === "password-generator" || t.slug === "uuid-generator" ? "Secure" : "Standard"}</Badge></td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No tools match that search.</td></tr>}
              </tbody>
            </table>
          </div>
          <nav className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4" aria-label="Tool inventory pagination">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Rows per page
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-foreground"
                aria-label="Rows per page"
              >
                {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" aria-label="First page" disabled={currentPage === 1} onClick={() => setPage(1)}><ChevronsLeft className="size-4" /></Button>
              <Button variant="outline" size="icon" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft className="size-4" /></Button>
              {pageNumbers.map((n, i) => n === "gap" ? (
                <span key={`gap-${i}`} className="px-1 text-muted-foreground" aria-hidden="true">…</span>
              ) : (
                <Button key={n} size="icon" variant={n === currentPage ? "default" : "outline"} aria-label={`Page ${n}`} aria-current={n === currentPage ? "page" : undefined} onClick={() => setPage(n)}>{n}</Button>
              ))}
              <Button variant="outline" size="icon" aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><ChevronRight className="size-4" /></Button>
              <Button variant="outline" size="icon" aria-label="Last page" disabled={currentPage === pageCount} onClick={() => setPage(pageCount)}><ChevronsRight className="size-4" /></Button>
            </div>
            <p className="text-sm text-muted-foreground">Page {currentPage} of {pageCount}</p>
          </nav>
        </CardContent>
      </Card>
    </div>
    </AdminShell>
  );
}
