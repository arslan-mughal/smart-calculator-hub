// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateBlogPost } from "@/lib/blog";
import {
  getBlogPost,
  getBlogPostForEdit,
  listBlogPosts,
  saveBlogPost,
  slugExists,
} from "@/lib/blog.server";
import { getDb, isDbConfigured, resetDbForTests } from "@/lib/db.server";

const base = {
  slug: "test-post",
  title: "A test post",
  excerpt: "Short excerpt.",
  content: "Hello **world**.",
  category: "General",
  tags: ["test"],
  status: "published" as const,
  author: "CalcHub",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("validateBlogPost", () => {
  it("accepts a valid post", () => {
    expect(validateBlogPost(base).ok).toBe(true);
  });

  it("rejects a bad slug", () => {
    expect(validateBlogPost({ ...base, slug: "Bad Slug!" }).ok).toBe(false);
    expect(validateBlogPost({ ...base, slug: "x".repeat(81) }).ok).toBe(false);
  });

  it("rejects a short title, long excerpt and oversized content", () => {
    expect(validateBlogPost({ ...base, title: "Hi" }).ok).toBe(false);
    expect(validateBlogPost({ ...base, excerpt: "x".repeat(201) }).ok).toBe(false);
    expect(validateBlogPost({ ...base, content: "x".repeat(50001) }).ok).toBe(false);
  });

  it("rejects too many or too long tags and a bad status", () => {
    expect(validateBlogPost({ ...base, tags: Array.from({ length: 9 }, (_, i) => `tag${i}`) }).ok).toBe(false);
    expect(validateBlogPost({ ...base, tags: ["x".repeat(31)] }).ok).toBe(false);
    expect(validateBlogPost({ ...base, status: "archived" }).ok).toBe(false);
  });

  it("accepts the new featured-image and focus-keyword fields", () => {
    const result = validateBlogPost({
      ...base,
      featuredImage: "https://example.com/cover.png",
      focusKeyword: "bmi calculator",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.post.featuredImage).toBe("https://example.com/cover.png");
      expect(result.post.focusKeyword).toBe("bmi calculator");
    }
  });

  it("defaults the new fields to empty so old posts still load", () => {
    const result = validateBlogPost(base);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.post.featuredImage).toBe("");
      expect(result.post.focusKeyword).toBe("");
    }
    // snake_case (DB row shape) is accepted too.
    const legacy = validateBlogPost({ ...base, featured_image: "https://example.com/x.png", focus_keyword: "kw" });
    expect(legacy.ok).toBe(true);
    if (legacy.ok) {
      expect(legacy.post.featuredImage).toBe("https://example.com/x.png");
      expect(legacy.post.focusKeyword).toBe("kw");
    }
  });

  it("rejects a non-http featured image and an over-long focus keyword", () => {
    expect(validateBlogPost({ ...base, featuredImage: "javascript:alert(1)" }).ok).toBe(false);
    expect(validateBlogPost({ ...base, featuredImage: "/relative.png" }).ok).toBe(false);
    expect(validateBlogPost({ ...base, focusKeyword: "x".repeat(81) }).ok).toBe(false);
  });
});

describe("blog file store (DATABASE_URL unset)", () => {
  let dir: string;
  const savedEnv = process.env["CALCHUB_CONTENT_DIR"];
  const savedDb = process.env["DATABASE_URL"];

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "calchub-blog-test-"));
    process.env["CALCHUB_CONTENT_DIR"] = dir;
    delete process.env["DATABASE_URL"];
    resetDbForTests();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    if (savedEnv === undefined) delete process.env["CALCHUB_CONTENT_DIR"];
    else process.env["CALCHUB_CONTENT_DIR"] = savedEnv;
    if (savedDb === undefined) delete process.env["DATABASE_URL"];
    else process.env["DATABASE_URL"] = savedDb;
    resetDbForTests();
  });

  it("rejects a duplicate slug on create", async () => {
    const first = await saveBlogPost(base, true);
    expect(first.ok).toBe(true);
    const second = await saveBlogPost(base, true);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error).toContain("already exists");
  });

  it("re-saving an existing post as an update (not a create) succeeds — the draft-then-publish flow", async () => {
    const created = await saveBlogPost({ ...base, status: "draft" }, true);
    expect(created.ok).toBe(true);
    // The editor sends isNew=false with oldSlug after the first save; the
    // same slug as an update must succeed (this used to be rejected).
    const republished = await saveBlogPost({ ...base, status: "published" }, false, "test-post");
    expect(republished.ok).toBe(true);
    expect((await getBlogPost("test-post"))?.status).toBe("published");
  });

  it("lists metadata only — no content field", async () => {
    await saveBlogPost(base, true);
    const posts = await listBlogPosts();
    expect(posts).toHaveLength(1);
    expect(posts[0]).not.toHaveProperty("content");
    expect(posts[0]?.slug).toBe("test-post");
    const full = await getBlogPost("test-post");
    expect(full?.content).toBe("Hello **world**.");
  });

  it("hides drafts from the public list", async () => {
    await saveBlogPost({ ...base, status: "draft" }, true);
    expect(await listBlogPosts()).toHaveLength(0);
    expect(await getBlogPost("test-post")).toBeNull();
  });

  it("persists the new fields and reads them back", async () => {
    await saveBlogPost(
      { ...base, featuredImage: "https://example.com/cover.png", focusKeyword: "test keyword" },
      true,
    );
    const full = await getBlogPost("test-post");
    expect(full?.featuredImage).toBe("https://example.com/cover.png");
    expect(full?.focusKeyword).toBe("test keyword");
  });

  it("renames a post: old slug stops resolving, new slug works, old file is gone", async () => {
    await saveBlogPost(base, true);
    const renamed = await saveBlogPost({ ...base, slug: "renamed-post", title: "Renamed title" }, false, "test-post");
    expect(renamed.ok).toBe(true);
    expect(await getBlogPostForEdit("test-post")).toBeNull();
    const full = await getBlogPostForEdit("renamed-post");
    expect(full?.title).toBe("Renamed title");
    expect(full?.slug).toBe("renamed-post");
  });

  it("rejects a rename onto an existing slug", async () => {
    await saveBlogPost(base, true);
    await saveBlogPost({ ...base, slug: "other-post", title: "Other" }, true);
    const renamed = await saveBlogPost({ ...base, slug: "other-post" }, false, "test-post");
    expect(renamed.ok).toBe(false);
    if (!renamed.ok) expect(renamed.error).toContain("already exists");
    // The original is untouched.
    expect((await getBlogPostForEdit("test-post"))?.title).toBe("A test post");
  });

  it("slugExists ignores the post's own slug", async () => {
    await saveBlogPost(base, true);
    expect(await slugExists("test-post")).toBe(true);
    expect(await slugExists("test-post", "test-post")).toBe(false);
    expect(await slugExists("no-such-post")).toBe(false);
  });
});

describe("db.server storage selection", () => {
  const savedDb = process.env["DATABASE_URL"];

  afterEach(() => {
    if (savedDb === undefined) delete process.env["DATABASE_URL"];
    else process.env["DATABASE_URL"] = savedDb;
    resetDbForTests();
  });

  it("returns null and reports unconfigured when DATABASE_URL is unset", () => {
    delete process.env["DATABASE_URL"];
    resetDbForTests();
    expect(isDbConfigured()).toBe(false);
    expect(getDb()).toBeNull();
  });

  it("reports configured (without connecting) when DATABASE_URL is set", () => {
    process.env["DATABASE_URL"] = "postgresql://user:pass@localhost:5432/db?sslmode=require";
    resetDbForTests();
    expect(isDbConfigured()).toBe(true);
    // neon() only builds a client; no network call happens until a query runs.
    expect(getDb()).not.toBeNull();
  });
});
