import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { buildHead, rootSettingsFromMatches } from "@/lib/seo";
import { getPublishedPosts } from "@/lib/blog.functions";

const PAGE_SIZE = 24;

export const Route = createFileRoute("/blog/")({
  // Only pages > 1 appear in the URL. Returning {} for a missing/invalid
  // page keeps /blog redirect-free; /blog?page=1 normalizes to /blog.
  // (validateSearch lives on the list route only — the article route must
  // not inherit it, which is why this is blog.index.tsx, not blog.tsx.)
  validateSearch: (search: Record<string, unknown>) => {
    const p = Number(search.page);
    return Number.isFinite(p) && p > 1 ? { page: Math.floor(p) } : {};
  },
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  loader: async ({ deps }) => {
    try {
      const { posts } = await getPublishedPosts();
      const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
      const page = Math.min(deps.page, totalPages);
      return {
        posts: posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        page,
        totalPages,
        total: posts.length,
      };
    } catch {
      return { posts: [], page: 1, totalPages: 1, total: 0 };
    }
  },
  head: ({ loaderData, matches }) => {
    const settings = rootSettingsFromMatches(
      matches as unknown as { routeId?: string; loaderData?: unknown }[],
    );
    const page = loaderData?.page ?? 1;
    return buildHead({
      title: page > 1 ? `Blog — Page ${page} — ${settings.siteName} | Free Online Calculators` : `Blog — ${settings.siteName} | Free Online Calculators`,
      description:
        `Guides and explainers for every ${settings.siteName} tool: how each calculator works, its formula, a worked example and answers to common questions.`,
      path: page > 1 ? `/blog?page=${page}` : "/blog",
    });
  },
  component: BlogList,
});

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function BlogList() {
  const { posts, page, totalPages, total } = Route.useLoaderData();
  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <p className="section-kicker flex items-center gap-2">
        <FileText className="size-4" /> Blog
      </p>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
        Guides for every tool
      </h1>
      <p className="mt-3 max-w-2xl text-lg leading-7 text-muted-foreground">
        How each calculator works, its formula, a worked example and answers to the questions
        people actually ask. {total > 0 && `${total} guides.`}
      </p>

      {posts.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
          No posts published yet — check back soon.
        </p>
      ) : (
        <>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.slug}
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <span className="rounded-full bg-secondary px-2.5 py-1">{post.category}</span>
                  <span className="flex items-center gap-1 font-medium text-muted-foreground">
                    <CalendarDays className="size-3.5" /> {formatDate(post.createdAt)}
                  </span>
                </div>
                <h2 className="mt-3 font-display text-xl font-bold leading-snug group-hover:text-primary">
                  {post.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>
                {post.tags.length > 0 && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    {post.tags.slice(0, 3).map((t) => `#${t}`).join(" ")}
                  </p>
                )}
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Blog pages">
              {page > 1 && (
                <Link
                  to="/blog"
                  search={{ page: page - 1 }}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-sm font-bold hover:text-primary"
                >
                  <ChevronLeft className="size-4" /> Previous
                </Link>
              )}
              <span className="px-2 text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  to="/blog"
                  search={{ page: page + 1 }}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-sm font-bold hover:text-primary"
                >
                  Next <ChevronRight className="size-4" />
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
