import { createFileRoute, redirect, useLoaderData } from "@tanstack/react-router";
import { Newspaper } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { settingsFromMatches } from "@/lib/seo";
import { BlogEditor } from "@/components/blog-editor";
import { getAdminSession } from "@/lib/admin-auth.functions";

export const Route = createFileRoute("/admin/blog/new")({
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
      { title: `New post — ${settings.siteName} Admin` },
      { name: "robots", content: "noindex, nofollow" },
    ],
    };
  },
  component: NewPostPage,
});

function NewPostPage() {
  const { username } = Route.useRouteContext();
  const { settings } = useLoaderData({ from: "/admin" });
  return (
    <AdminShell username={username}>
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <p className="section-kicker flex items-center gap-2"><Newspaper className="size-4" /> Blog posts</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold">New post</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Build the post from blocks — paragraphs, headings, lists, quotes, images and code. The
          slug is generated from the title — change it before the first save.
        </p>
        <div className="mt-6">
          <BlogEditor initial={null} defaultAuthor={settings.siteName} />
        </div>
      </div>
    </AdminShell>
  );
}
