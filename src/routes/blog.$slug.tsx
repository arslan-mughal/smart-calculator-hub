import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CalendarDays, Tag } from "lucide-react";
import { articleLd, breadcrumbLd, buildHead, rootSettingsFromMatches } from "@/lib/seo";
import { getPublishedPost, getPublishedPosts } from "@/lib/blog.functions";
import { renderMarkdown } from "@/lib/markdown";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = await getPublishedPost({ data: { slug: params.slug } });
    if (!post) throw notFound();
    const { posts } = await getPublishedPosts();
    const related = posts
      .filter((p) => p.slug !== post.slug && p.category === post.category)
      .slice(0, 3);
    return { post, related };
  },
  head: ({ loaderData, matches }) => {
    const settings = rootSettingsFromMatches(
      matches as unknown as { routeId?: string; loaderData?: unknown }[],
    );
    const post = loaderData?.post;
    if (!post)
      return { meta: [{ title: "Post not found" }, { name: "robots", content: "noindex, nofollow" }] };
    return buildHead({
      title: `${post.title} | ${settings.siteName}`,
      description: post.excerpt,
      path: `/blog/${post.slug}`,
      type: "article",
      keywords: post.tags.join(", "),
      ...(post.featuredImage ? { image: post.featuredImage } : {}),
      jsonLd: [
        articleLd({
          title: post.title,
          description: post.excerpt,
          path: `/blog/${post.slug}`,
          author: post.author,
          datePublished: post.createdAt,
          dateModified: post.updatedAt,
          ...(post.featuredImage ? { image: post.featuredImage } : {}),
        }),
        breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ]),
      ],
    });
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <h1 className="font-display text-4xl font-extrabold">Post not found</h1>
      <p className="mt-3 text-muted-foreground">That article may have been removed or renamed.</p>
      <Link
        to="/blog"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
      >
        <ArrowLeft className="size-4" /> Back to the blog
      </Link>
    </div>
  ),
  component: BlogPost,
});

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function BlogPost() {
  const { post, related } = Route.useLoaderData();
  return (
    <div className="mx-auto max-w-4xl px-5 py-10 lg:px-8">
      <Link
        to="/blog"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
      >
        <ArrowLeft className="size-4" /> All posts
      </Link>
      <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-bold text-primary">
        <span className="rounded-full bg-secondary px-2.5 py-1">{post.category}</span>
        <span className="flex items-center gap-1 font-medium text-muted-foreground">
          <CalendarDays className="size-3.5" /> {formatDate(post.createdAt)}
        </span>
        <span className="font-medium text-muted-foreground">By {post.author}</span>
      </div>
      <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
        {post.title}
      </h1>
      <p className="mt-4 text-lg leading-7 text-muted-foreground">{post.excerpt}</p>
      {post.featuredImage && (
        <figure className="mt-6">
          <img
            src={post.featuredImage}
            alt={post.title}
            loading="lazy"
            className="w-full rounded-2xl border border-border object-cover"
          />
        </figure>
      )}
      {post.tags.length > 0 && (
        <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Tag className="size-3.5" />
          {post.tags.map((t) => (
            <span key={t} className="rounded-full border border-border px-2 py-0.5">
              {t}
            </span>
          ))}
        </p>
      )}
      {/* The only dangerouslySetInnerHTML in the codebase: renderMarkdown
          escapes ALL HTML first, so this output is safe by construction. */}
      <article
        className="prose-calc mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
      />
      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl font-extrabold">Related posts</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                to="/blog/$slug"
                params={{ slug: r.slug }}
                className="group rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-card"
              >
                <p className="text-xs font-bold text-primary">{r.category}</p>
                <p className="mt-2 font-display font-bold leading-snug group-hover:text-primary">
                  {r.title}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary">
                  Read post <ArrowRight className="size-3" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
