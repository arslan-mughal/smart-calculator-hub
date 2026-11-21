import { createServerFn } from "@tanstack/react-start";
import { getAdminSession } from "./admin-auth.functions";
import { storageKind } from "./db.server";
import {
  deleteBlogPost,
  getBlogPost,
  getBlogPostForEdit,
  listAllBlogPosts,
  listBlogPosts,
  saveBlogPost,
  slugExists,
} from "./blog.server";
import { SLUG_RE, type BlogPost, type BlogPostMeta } from "./blog";

export type BlogListResponse = { posts: BlogPostMeta[]; store: "database" | "files" };

/** Public: published posts, newest first — metadata only (no content). */
export const getPublishedPosts = createServerFn({ method: "GET" }).handler(
  async (): Promise<BlogListResponse> => ({
    posts: await listBlogPosts(),
    store: storageKind(),
  }),
);

/** Public: one published post with full content. */
export const getPublishedPost = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => ({ slug: typeof input === "object" && input !== null ? String((input as { slug?: unknown }).slug ?? "") : "" }))
  .handler(async ({ data }): Promise<BlogPost | null> => {
    if (!SLUG_RE.test(data.slug)) return null;
    return getBlogPost(data.slug);
  });

/** Admin: every post (draft + published), metadata only. */
export const listAllPosts = createServerFn({ method: "GET" }).handler(
  async (): Promise<BlogListResponse | { ok: false; error: string }> => {
    const session = await getAdminSession();
    if (!session.authenticated) return { ok: false, error: "Sign in as admin first." };
    return { posts: await listAllBlogPosts(), store: storageKind() };
  },
);

/** Admin: one post of any status, with content, for the editor. */
export const getPostForEdit = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => ({ slug: typeof input === "object" && input !== null ? String((input as { slug?: unknown }).slug ?? "") : "" }))
  .handler(async ({ data }): Promise<BlogPost | null | { ok: false; error: string }> => {
    const session = await getAdminSession();
    if (!session.authenticated) return { ok: false, error: "Sign in as admin first." };
    if (!SLUG_RE.test(data.slug)) return null;
    return getBlogPostForEdit(data.slug);
  });

export type SavePostResult =
  | { ok: true; post: BlogPost }
  | { ok: false; error: string };

export const savePost = createServerFn({ method: "POST" })
  .inputValidator((input: { post?: unknown; isNew?: unknown; oldSlug?: unknown }) => ({
    post: input?.post ?? {},
    isNew: input?.isNew === true,
    oldSlug: typeof input?.oldSlug === "string" ? input.oldSlug : undefined,
  }))
  .handler(async ({ data }): Promise<SavePostResult> => {
    const session = await getAdminSession();
    if (!session.authenticated) return { ok: false, error: "Sign in as admin first." };
    try {
      const result = await saveBlogPost(data.post, data.isNew, data.oldSlug);
      return result.ok ? { ok: true, post: result.post } : { ok: false, error: result.error };
    } catch {
      return {
        ok: false,
        error:
          storageKind() === "database"
            ? "Could not save to the database. Check DATABASE_URL and that db/schema.sql has been applied."
            : "Could not save the post file.",
      };
    }
  });

/** Admin: is this slug free? `excludeSlug` is the slug of the post being
 * edited, so keeping its own slug never counts as a collision. */
export const checkSlugAvailable = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => {
    const raw = (input ?? {}) as { slug?: unknown; excludeSlug?: unknown };
    return {
      slug: typeof raw.slug === "string" ? raw.slug : "",
      excludeSlug: typeof raw.excludeSlug === "string" ? raw.excludeSlug : undefined,
    };
  })
  .handler(async ({ data }): Promise<{ available: boolean } | { ok: false; error: string }> => {
    const session = await getAdminSession();
    if (!session.authenticated) return { ok: false, error: "Sign in as admin first." };
    if (!SLUG_RE.test(data.slug) || data.slug.length > 80) return { available: false };
    try {
      return { available: !(await slugExists(data.slug, data.excludeSlug)) };
    } catch {
      return { ok: false, error: "Could not check the slug. Try again." };
    }
  });

export const deletePost = createServerFn({ method: "POST" })
  .inputValidator((input: { slug?: unknown }) => ({ slug: String(input?.slug ?? "") }))
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const session = await getAdminSession();
    if (!session.authenticated) return { ok: false, error: "Sign in as admin first." };
    if (!SLUG_RE.test(data.slug)) return { ok: false, error: "Invalid slug." };
    try {
      const deleted = await deleteBlogPost(data.slug);
      return deleted ? { ok: true } : { ok: false, error: "Post not found." };
    } catch {
      return { ok: false, error: "Could not delete the post." };
    }
  });
