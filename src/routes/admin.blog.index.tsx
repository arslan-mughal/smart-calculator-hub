import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Newspaper, Pencil, Plus, Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminShell } from "@/components/admin-shell";
import { settingsFromMatches } from "@/lib/seo";
import { getAdminSession } from "@/lib/admin-auth.functions";
import { deletePost, listAllPosts } from "@/lib/blog.functions";

export const Route = createFileRoute("/admin/blog/")({
  beforeLoad: async () => {
    const session = await getAdminSession();
    if (!session.authenticated) throw redirect({ to: "/admin/login" });
    return { username: session.username };
  },
  loader: async () => {
    const result = await listAllPosts();
    if ("ok" in result && !result.ok) return { posts: [], store: "files" as const, error: result.error };
    return { posts: result.posts, store: result.store, error: null as string | null };
  },
  head: ({ matches }) => {
    const settings = settingsFromMatches(
      matches as unknown as { routeId?: string; loaderData?: unknown }[],
      "/admin",
    );
    return {
    meta: [
      { title: `Blog Posts — ${settings.siteName} Admin` },
      { name: "robots", content: "noindex, nofollow" },
    ],
    };
  },
  component: BlogListPage,
});

const PAGE_SIZES = [10, 25, 50] as const;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function BlogListPage() {
  const { username } = Route.useRouteContext();
  const { posts, store, error } = Route.useLoaderData();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const pageCount = Math.max(1, Math.ceil(posts.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = useMemo(
    () => posts.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [posts, currentPage, pageSize],
  );

  async function remove(slug: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setBusy(slug);
    try {
      const result = await deletePost({ data: { slug } });
      if (result.ok) {
        setNotice(`Deleted "${title}".`);
        await router.invalidate();
      } else {
        setNotice(result.error ?? "Could not delete the post.");
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminShell username={username}>
    <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-kicker flex items-center gap-2"><Newspaper className="size-4" /> Blog posts</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold">Blog Posts</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {posts.length} post{posts.length === 1 ? "" : "s"} stored in{" "}
            <strong>{store === "database" ? "Neon (database)" : "local files"}</strong>. Drafts are
            hidden from the public blog.
          </p>
        </div>
        <Link to="/admin/blog/new">
          <Button><Plus className="size-4" /> New post</Button>
        </Link>
      </div>

      {error && <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
      {notice && <p className="mt-4 rounded-lg border border-border bg-card p-3 text-sm">{notice}</p>}
      {posts.length === 0 && !error && (
        <p className="mt-4 rounded-xl border border-border bg-card p-4 text-sm leading-6 text-muted-foreground">
          No posts yet.{" "}
          {store === "database"
            ? "Run db/seed-tool-posts.sql (see DEPLOYMENT.md) to load the generated tool guides, or create your first post below."
            : "Create your first post, or run scripts/generate-tool-posts.mjs to generate a guide for every tool."}
        </p>
      )}

      {posts.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>All posts</CardTitle>
            <CardDescription>
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, posts.length)} of {posts.length}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground"><th className="py-2 pr-3">Title</th><th className="py-2 pr-3">Status</th><th className="py-2 pr-3">Category</th><th className="py-2 pr-3">Updated</th><th className="py-2 text-right">Actions</th></tr></thead>
                <tbody>
                  {paged.map((post) => (
                    <tr key={post.slug} className="border-b hover:bg-muted/50">
                      <td className="py-2 pr-3 font-semibold">
                        <Link to="/admin/blog/$postId" params={{ postId: post.slug }} className="text-primary hover:underline">{post.title}</Link>
                        <span className="block font-mono text-xs font-normal text-muted-foreground">/blog/{post.slug}</span>
                      </td>
                      <td className="py-2 pr-3">
                        <Badge variant={post.status === "published" ? "default" : "secondary"}>
                          {post.status === "published" ? "Published" : "Draft"}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3">{post.category}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{formatDate(post.updatedAt)}</td>
                      <td className="py-2 text-right">
                        <span className="inline-flex gap-1">
                          <Link to="/admin/blog/$postId" params={{ postId: post.slug }}>
                            <Button variant="outline" size="sm" aria-label={`Edit ${post.title}`}><Pencil className="size-4" /></Button>
                          </Link>
                          {post.status === "published" && (
                            <Link to="/blog/$slug" params={{ slug: post.slug }}>
                              <Button variant="outline" size="sm">View</Button>
                            </Link>
                          )}
                          <Button variant="outline" size="sm" aria-label={`Delete ${post.title}`} disabled={busy === post.slug} onClick={() => void remove(post.slug, post.title)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <nav className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4" aria-label="Blog pagination">
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
                <span className="px-2 text-sm text-muted-foreground">Page {currentPage} of {pageCount}</span>
                <Button variant="outline" size="icon" aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><ChevronRight className="size-4" /></Button>
                <Button variant="outline" size="icon" aria-label="Last page" disabled={currentPage === pageCount} onClick={() => setPage(pageCount)}><ChevronsRight className="size-4" /></Button>
              </div>
            </nav>
          </CardContent>
        </Card>
      )}
    </div>
    </AdminShell>
  );
}
