// Blog post types + validation. Pure (no fs, no DB) — safe to import anywhere.
// Storage lives in blog.server.ts; server functions in blog.functions.ts.
export type BlogPostStatus = "draft" | "published";

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  status: BlogPostStatus;
  author: string;
  /** Featured image URL (http/https), shown at the top of the article and
   *  used as og:image. Empty = no featured image. URL-based only — there
   *  is no upload backend. */
  featuredImage: string;
  /** SEO focus keyword, used by the editor's live score checker. */
  focusKeyword: string;
  createdAt: string;
  updatedAt: string;
};

/** List shape: everything except the (potentially large) content field, so
 *  a 200+ post list never bloats the payload. */
export type BlogPostMeta = Omit<BlogPost, "content">;

export function toMeta(post: BlogPost): BlogPostMeta {
  const { content: _content, ...meta } = post;
  return meta;
}

export const SLUG_RE = /^[a-z0-9-]+$/;
export const MAX_CONTENT_CHARS = 50000;

export type BlogValidation =
  | { ok: true; post: BlogPost }
  | { ok: false; errors: string[] };

const isIsoDate = (value: string): boolean => {
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
};

/** Validate unknown input (admin form, JSON file, DB row) into a clean post. */
export function validateBlogPost(input: unknown, now = new Date()): BlogValidation {
  const errors: string[] = [];
  const raw = (input ?? {}) as Record<string, unknown>;
  const str = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
  const tagsRaw = Array.isArray(raw["tags"])
    ? (raw["tags"] as unknown[]).map((t) => str(t)).filter(Boolean)
    : typeof raw["tags"] === "string"
      ? raw["tags"].split(",").map((t) => t.trim()).filter(Boolean)
      : [];
  const tags = [...new Set(tagsRaw)];

  const createdAtRaw = str(raw["createdAt"]);
  const updatedAtRaw = str(raw["updatedAt"]);
  const post: BlogPost = {
    slug: str(raw["slug"]),
    title: str(raw["title"]),
    excerpt: str(raw["excerpt"]),
    content: typeof raw["content"] === "string" ? raw["content"] : "",
    category: str(raw["category"]) || "General",
    tags,
    status: raw["status"] === "published" ? "published" : raw["status"] === "draft" ? "draft" : "draft",
    author: str(raw["author"]) || "CalcHub",
    // New fields default to "" so old JSON files and legacy DB rows
    // without them still load.
    featuredImage: str(raw["featuredImage"] ?? raw["featured_image"]),
    focusKeyword: str(raw["focusKeyword"] ?? raw["focus_keyword"]),
    createdAt: createdAtRaw && isIsoDate(createdAtRaw) ? new Date(createdAtRaw).toISOString() : now.toISOString(),
    updatedAt: updatedAtRaw && isIsoDate(updatedAtRaw) ? new Date(updatedAtRaw).toISOString() : now.toISOString(),
  };

  if (!SLUG_RE.test(post.slug) || post.slug.length > 80)
    errors.push("Slug must be lowercase letters, numbers and hyphens only (max 80 chars).");
  if (post.title.length < 3 || post.title.length > 120)
    errors.push("Title must be 3–120 characters.");
  if (post.excerpt.length > 200) errors.push("Excerpt must be at most 200 characters.");
  if (post.content.length < 1 || post.content.length > MAX_CONTENT_CHARS)
    errors.push(`Content must be 1–${MAX_CONTENT_CHARS.toLocaleString()} characters.`);
  if (post.category.length > 40) errors.push("Category must be at most 40 characters.");
  if (post.tags.length > 8) errors.push("At most 8 tags.");
  for (const tag of post.tags) {
    if (tag.length > 30) errors.push(`Tag "${tag}" must be at most 30 characters.`);
  }
  if (raw["status"] !== "draft" && raw["status"] !== "published")
    errors.push("Status must be draft or published.");
  if (post.author.length > 60) errors.push("Author must be at most 60 characters.");
  if (post.featuredImage.length > 500)
    errors.push("Featured image URL must be at most 500 characters.");
  if (post.featuredImage !== "" && !/^https?:\/\/\S+$/.test(post.featuredImage))
    errors.push("Featured image must be empty or a valid http(s) URL.");
  if (post.focusKeyword.length > 80)
    errors.push("Focus keyword must be at most 80 characters.");

  return errors.length > 0 ? { ok: false, errors } : { ok: true, post };
}

/** URL-safe slug from a title, e.g. "How to calculate X?" -> "how-to-calculate-x". */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
