import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { Newspaper } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { BlogEditor } from "@/components/blog-editor";
import { getAdminSession } from "@/lib/admin-auth.functions";
import { getPostForEdit } from "@/lib/blog.functions";
import { settingsFromMatches } from "@/lib/seo";

export const Route = createFileRoute("/admin/blog/$postId")({
  beforeLoad: async () => {
    const session = await getAdminSession();
    if (!session.authenticated) throw redirect({ to: "/admin/login" });
    return { username: session.username };
  },
  loader: async ({ params }) => {
    const post = await getPostForEdit({ data: { slug: params.postId } });
    if (!post || ("ok" in post && !post.ok)) throw notFound();
    return { post };
  },
  head: ({ loaderData, matches }) => {
    const settings = settingsFromMatches(
      matches as unknown as { routeId?: string; loaderData?: unknown }[],
      "/admin",
    );
    return {
      meta: [
        { title: loaderData ? `Edit: ${loaderData.post.title} — ${settings.siteName} Admin` : `Edit post — ${settings.siteName} Admin` },
        { name: "robots", content: "noindex, nofollow" },
      ],
    };
  },
  component: EditPostPage,
});

function EditPostPage() {
  const { username } = Route.useRouteContext();
  const { post } = Route.useLoaderData();
  return (
    <AdminShell username={username}>
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <p className="section-kicker flex items-center gap-2"><Newspaper className="size-4" /> Blog posts</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold">Edit post</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Editing <strong>{post.title}</strong> — /blog/{post.slug}. The slug is editable now;
          changing it moves the post to the new URL.
        </p>
        <div className="mt-6">
          <BlogEditor initial={post} />
        </div>
      </div>
    </AdminShell>
  );
}
