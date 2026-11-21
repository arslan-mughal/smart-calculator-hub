// Server-only blog storage: Neon when DATABASE_URL is set, content/blog/*.json
// as the local-dev fallback. Same validation and same return shapes on both
// paths. Lists are METADATA ONLY (no content field) so 200+ posts stay light;
// the detail/edit routes load one full post. Never import from client code.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getDb, isDbConfigured } from "./db.server";
import { contentDir } from "./site-settings.server";
import {
  toMeta,
  validateBlogPost,
  type BlogPost,
  type BlogPostMeta,
} from "./blog";

function blogDir(): string {
  return join(contentDir(), "blog");
}

function blogPath(slug: string): string {
  return join(blogDir(), `${slug}.json`);
}

// ---------- file store ----------
function readPostFile(slug: string): BlogPost | null {
  try {
    const parsed = JSON.parse(readFileSync(blogPath(slug), "utf8")) as unknown;
    const result = validateBlogPost(parsed);
    return result.ok ? result.post : null;
  } catch {
    return null;
  }
}

function listPostsFromDisk(publishedOnly: boolean): BlogPostMeta[] {
  let files: string[] = [];
  try {
    files = readdirSync(blogDir()).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  const posts: BlogPost[] = [];
  for (const file of files) {
    const post = readPostFile(file.replace(/\.json$/, ""));
    if (post && (!publishedOnly || post.status === "published")) posts.push(post);
  }
  posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return posts.map(toMeta);
}

function savePostToDisk(post: BlogPost, isNew: boolean, oldSlug?: string): { ok: true } | { ok: false; error: string } {
  if (isNew && existsSync(blogPath(post.slug)))
    return { ok: false, error: `A post with the slug "${post.slug}" already exists.` };
  // Renaming an existing post: the new slug must be free, then the old
  // file is removed so the old URL stops resolving.
  if (!isNew && oldSlug && oldSlug !== post.slug) {
    if (existsSync(blogPath(post.slug)))
      return { ok: false, error: `A post with the slug "${post.slug}" already exists.` };
  }
  mkdirSync(blogDir(), { recursive: true });
  writeFileSync(blogPath(post.slug), `${JSON.stringify(post, null, 2)}\n`, "utf8");
  if (!isNew && oldSlug && oldSlug !== post.slug) {
    try {
      rmSync(blogPath(oldSlug), { force: true });
    } catch {
      // New file is already written; a leftover old file is untidy but
      // not data loss. The admin list would show both — surfaced by tests.
    }
  }
  return { ok: true };
}

// ---------- Neon store ----------
type PostRow = {
  slug: string; title: string; excerpt: string; content?: string; category: string;
  tags: string[] | string; status: string; author: string;
  featured_image?: string | null; focus_keyword?: string | null;
  created_at: string | Date; updated_at: string | Date;
};

const toIso = (value: string | Date): string => new Date(value).toISOString();

function rowToPost(row: PostRow): BlogPost {
  const result = validateBlogPost({
    slug: row.slug, title: row.title, excerpt: row.excerpt,
    content: row.content ?? "", category: row.category,
    tags: Array.isArray(row.tags) ? row.tags : [],
    status: row.status, author: row.author,
    featured_image: row.featured_image ?? "", focus_keyword: row.focus_keyword ?? "",
    createdAt: toIso(row.created_at), updatedAt: toIso(row.updated_at),
  });
  // Rows come from our own validated writes; fall back to raw values if a
  // legacy row fails validation rather than dropping the post entirely.
  if (result.ok) return result.post;
  return {
    slug: row.slug, title: row.title, excerpt: row.excerpt ?? "",
    content: row.content ?? "", category: row.category || "General",
    tags: Array.isArray(row.tags) ? row.tags : [], status: row.status === "published" ? "published" : "draft",
    author: row.author || "CalcHub",
    featuredImage: typeof row.featured_image === "string" ? row.featured_image : "",
    focusKeyword: typeof row.focus_keyword === "string" ? row.focus_keyword : "",
    createdAt: toIso(row.created_at), updatedAt: toIso(row.updated_at),
  };
}

async function listPostsFromDb(publishedOnly: boolean): Promise<BlogPostMeta[]> {
  const db = getDb();
  if (!db) return listPostsFromDisk(publishedOnly);
  try {
    // Metadata only: the content column is deliberately never selected here.
    const rows = publishedOnly
      ? await db`SELECT slug, title, excerpt, category, tags, status, author, featured_image, focus_keyword, created_at, updated_at FROM blog_posts WHERE status = 'published' ORDER BY created_at DESC`
      : await db`SELECT slug, title, excerpt, category, tags, status, author, featured_image, focus_keyword, created_at, updated_at FROM blog_posts ORDER BY created_at DESC`;
    return (rows as PostRow[]).map((r) => toMeta(rowToPost({ ...r, content: "" })));
  } catch {
    console.error("blog: database list failed, using file fallback");
    return listPostsFromDisk(publishedOnly);
  }
}

async function getPostFromDb(slug: string, publishedOnly: boolean): Promise<BlogPost | null> {
  const db = getDb();
  if (!db) {
    const post = readPostFile(slug);
    return post && (!publishedOnly || post.status === "published") ? post : null;
  }
  try {
    const rows = publishedOnly
      ? await db`SELECT slug, title, excerpt, content, category, tags, status, author, featured_image, focus_keyword, created_at, updated_at FROM blog_posts WHERE slug = ${slug} AND status = 'published'`
      : await db`SELECT slug, title, excerpt, content, category, tags, status, author, featured_image, focus_keyword, created_at, updated_at FROM blog_posts WHERE slug = ${slug}`;
    return rows.length === 0 ? null : rowToPost(rows[0] as PostRow);
  } catch {
    console.error("blog: database read failed, using file fallback");
    const post = readPostFile(slug);
    return post && (!publishedOnly || post.status === "published") ? post : null;
  }
}

async function savePostToDb(post: BlogPost, isNew: boolean, oldSlug?: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  if (!db) return savePostToDisk(post, isNew, oldSlug);
  if (isNew) {
    const existing = await db`SELECT 1 FROM blog_posts WHERE slug = ${post.slug} LIMIT 1`;
    if (existing.length > 0)
      return { ok: false, error: `A post with the slug "${post.slug}" already exists.` };
  }
  // Renaming an existing post: the new slug must be free, then the row is
  // updated in place (slug included) so no duplicate row is left behind.
  if (!isNew && oldSlug && oldSlug !== post.slug) {
    const clash = await db`SELECT 1 FROM blog_posts WHERE slug = ${post.slug} LIMIT 1`;
    if (clash.length > 0)
      return { ok: false, error: `A post with the slug "${post.slug}" already exists.` };
    const renamed = await db`
      UPDATE blog_posts SET
        slug = ${post.slug}, title = ${post.title}, excerpt = ${post.excerpt},
        content = ${post.content}, category = ${post.category}, tags = ${post.tags},
        status = ${post.status}, author = ${post.author},
        featured_image = ${post.featuredImage}, focus_keyword = ${post.focusKeyword},
        updated_at = ${post.updatedAt}
      WHERE slug = ${oldSlug}
      RETURNING slug
    `;
    if (renamed.length > 0) return { ok: true };
    // Old row vanished between load and save — fall through to insert.
  }
  await db`
    INSERT INTO blog_posts (slug, title, excerpt, content, category, tags, status, author, featured_image, focus_keyword, created_at, updated_at)
    VALUES (${post.slug}, ${post.title}, ${post.excerpt}, ${post.content}, ${post.category}, ${post.tags}, ${post.status}, ${post.author}, ${post.featuredImage}, ${post.focusKeyword}, ${post.createdAt}, ${post.updatedAt})
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title, excerpt = EXCLUDED.excerpt, content = EXCLUDED.content,
      category = EXCLUDED.category, tags = EXCLUDED.tags, status = EXCLUDED.status,
      author = EXCLUDED.author, featured_image = EXCLUDED.featured_image,
      focus_keyword = EXCLUDED.focus_keyword, updated_at = EXCLUDED.updated_at
  `;
  return { ok: true };
}

async function deletePostFromDb(slug: string): Promise<boolean> {
  const db = getDb();
  if (!db) {
    const path = blogPath(slug);
    if (!existsSync(path)) return false;
    rmSync(path);
    return true;
  }
  const rows = await db`DELETE FROM blog_posts WHERE slug = ${slug} RETURNING slug`;
  return rows.length > 0;
}

// ---------- unified API ----------
/** Published posts, newest first — metadata only, never the content field. */
export async function listBlogPosts(): Promise<BlogPostMeta[]> {
  return isDbConfigured() ? listPostsFromDb(true) : listPostsFromDisk(true);
}

/** All posts (admin), newest first — metadata only. */
export async function listAllBlogPosts(): Promise<BlogPostMeta[]> {
  return isDbConfigured() ? listPostsFromDb(false) : listPostsFromDisk(false);
}

/** One published post with full content, or null. */
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  if (isDbConfigured()) return getPostFromDb(slug, true);
  const post = readPostFile(slug);
  return post?.status === "published" ? post : null;
}

/** One post of any status (admin editor), or null. */
export async function getBlogPostForEdit(slug: string): Promise<BlogPost | null> {
  return isDbConfigured() ? getPostFromDb(slug, false) : readPostFile(slug);
}

/**
 * Create (isNew) or update a post. Validates first; on create the slug must
 * be unique. `oldSlug` is the slug the post had when the editor opened it —
 * when it differs from the new slug the post is renamed (old row/file
 * removed, new slug collision rejected). Writes throw when the configured
 * store fails — no silent fallback to files on Vercel (the filesystem there
 * is ephemeral).
 */
export async function saveBlogPost(
  input: unknown,
  isNew: boolean,
  oldSlug?: string,
): Promise<{ ok: true; post: BlogPost } | { ok: false; error: string }> {
  const result = validateBlogPost(input);
  if (!result.ok) return { ok: false, error: result.errors.join(" ") };
  const post = { ...result.post, updatedAt: new Date().toISOString() };
  const saved = isDbConfigured()
    ? await savePostToDb(post, isNew, oldSlug)
    : savePostToDisk(post, isNew, oldSlug);
  return saved.ok ? { ok: true, post } : saved;
}

/** True when a post already uses this slug, ignoring `excludeSlug` (the
 * post currently being edited — its own slug is not a collision). */
export async function slugExists(slug: string, excludeSlug?: string): Promise<boolean> {
  if (slug === excludeSlug) return false;
  if (isDbConfigured()) {
    const db = getDb();
    if (db) {
      try {
        const rows = excludeSlug
          ? await db`SELECT 1 FROM blog_posts WHERE slug = ${slug} AND slug <> ${excludeSlug} LIMIT 1`
          : await db`SELECT 1 FROM blog_posts WHERE slug = ${slug} LIMIT 1`;
        return rows.length > 0;
      } catch {
        // DB unreachable — fall through to the file check below.
      }
    }
  }
  return existsSync(blogPath(slug));
}

export async function deleteBlogPost(slug: string): Promise<boolean> {
  return deletePostFromDb(slug);
}
