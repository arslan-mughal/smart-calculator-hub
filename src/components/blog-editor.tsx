// Shared blog post editor (new + edit) — Gutenberg-style block editor.
// Content is stored as Markdown; blocks are parsed on load and serialized
// back to Markdown on save (see src/lib/blocks.ts). Live preview uses the
// same safe Markdown renderer as the public article page. Images are
// URL-based only — there is no upload backend.
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Bold,
  CheckCircle2,
  Code,
  Copy,
  Eye,
  FileText,
  GripVertical,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Plus,
  Quote,
  Trash2,
  Type,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { renderMarkdown } from "@/lib/markdown";
import { SLUG_RE, slugify, type BlogPost } from "@/lib/blog";
import { checkSlugAvailable, savePost } from "@/lib/blog.functions";
import {
  blocksToMarkdown,
  countMarkdownWords,
  createBlock,
  newBlockId,
  parseMarkdownToBlocks,
  readingMinutes,
  type Block,
  type BlockType,
} from "@/lib/blocks";
import { scoreSeo } from "@/lib/seo-score";

function Counter({ value, max }: { value: number; max: number }) {
  return (
    <span className={`text-xs ${value > max ? "font-bold text-destructive" : "text-muted-foreground"}`}>
      {value}/{max}
    </span>
  );
}

const BLOCK_MENU: { type: BlockType; label: string; icon: typeof Type }[] = [
  { type: "paragraph", label: "Paragraph", icon: Type },
  { type: "heading", label: "Heading", icon: Heading2 },
  { type: "list", label: "List", icon: List },
  { type: "quote", label: "Quote", icon: Quote },
  { type: "image", label: "Image", icon: ImageIcon },
  { type: "code", label: "Code", icon: Code },
  { type: "divider", label: "Divider", icon: Minus },
];

function isSafeLinkUrl(url: string): boolean {
  return /^\/[^/\s]/.test(url) || /^https?:\/\/\S+$/.test(url);
}

function isSafeImageUrl(url: string): boolean {
  return /^https?:\/\/\S+$/.test(url);
}

function autoGrow(el: HTMLElement) {
  if (el instanceof HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }
}

function ScoreRing({ score }: { score: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const color = score >= 80 ? "#059669" : score >= 50 ? "#d97706" : "#dc2626";
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" role="img" aria-label={`SEO score ${score} out of 100`}>
      <circle cx="44" cy="44" r={r} fill="none" stroke="var(--color-border)" strokeWidth="8" />
      <circle
        cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c - (score / 100) * c} transform="rotate(-90 44 44)"
      />
      <text x="44" y="44" textAnchor="middle" dominantBaseline="central" fontSize="22" fontWeight="800" fill="var(--color-foreground)">
        {score}
      </text>
    </svg>
  );
}

type SlugStatus = "idle" | "checking" | "ok" | "taken" | "invalid" | "current";

export function BlogEditor({ initial, defaultAuthor = "CalcHub" }: { initial: BlogPost | null; defaultAuthor?: string }) {
  const isNew = initial === null;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [category, setCategory] = useState(initial?.category ?? "General");
  const [tagsInput, setTagsInput] = useState(initial?.tags.join(", ") ?? "");
  const [status, setStatus] = useState<"draft" | "published">(initial?.status ?? "draft");
  const [author, setAuthor] = useState(initial?.author ?? defaultAuthor);
  const [focusKeyword, setFocusKeyword] = useState(initial?.focusKeyword ?? "");
  const [featuredImage, setFeaturedImage] = useState(initial?.featuredImage ?? "");
  const [blocks, setBlocks] = useState<Block[]>(() => {
    const parsed = parseMarkdownToBlocks(initial?.content ?? "");
    return parsed.length > 0 ? parsed : [createBlock("paragraph")];
  });
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string; newSlug?: string } | null>(null);
  // The slug as last saved — the live "own slug" for availability checks and renames.
  const [currentSlug, setCurrentSlug] = useState<string | null>(initial?.slug ?? null);
  // On the new-post page the first save creates the post; every later save
  // must be an update (isNew=false), otherwise the server rejects it as a
  // duplicate slug — that broke the "save draft, then publish" flow.
  const [created, setCreated] = useState(false);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [addMenuFor, setAddMenuFor] = useState<string | null>(null);
  const [linkFor, setLinkFor] = useState<{ blockId: string } | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const [focusReq, setFocusReq] = useState<{ id: string; cursor?: number } | null>(null);
  const blockRefs = useRef(new Map<string, HTMLElement>());
  const linkSelection = useRef<{ start: number; end: number } | null>(null);
  const slugCheckId = useRef(0);

  const content = useMemo(() => blocksToMarkdown(blocks), [blocks]);
  const previewHtml = useMemo(() => renderMarkdown(content), [content]);
  const seo = useMemo(
    () => scoreSeo({ title, slug, excerpt, content, focusKeyword }),
    [title, slug, excerpt, content, focusKeyword],
  );
  const words = useMemo(() => countMarkdownWords(content), [content]);

  useEffect(() => {
    if (!focusReq) return;
    const el = blockRefs.current.get(focusReq.id) as HTMLTextAreaElement | HTMLInputElement | null;
    if (el) {
      el.focus();
      const pos = focusReq.cursor ?? el.value.length;
      try {
        el.setSelectionRange(pos, pos);
      } catch {
        // not all inputs support selection ranges
      }
    }
    setFocusReq(null);
  }, [focusReq, blocks]);

  // Live slug availability — debounced, stale responses ignored.
  useEffect(() => {
    if (!slug || !SLUG_RE.test(slug)) {
      setSlugStatus(slug ? "invalid" : "idle");
      return;
    }
    if (slug === currentSlug) {
      setSlugStatus("current");
      return;
    }
    setSlugStatus("checking");
    const id = ++slugCheckId.current;
    const timer = setTimeout(async () => {
      try {
        const res = await checkSlugAvailable({ data: { slug, excludeSlug: currentSlug ?? undefined } });
        if (slugCheckId.current !== id) return;
        if ("available" in res) setSlugStatus(res.available ? "ok" : "taken");
        else setSlugStatus("idle");
      } catch {
        if (slugCheckId.current === id) setSlugStatus("idle");
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [slug, currentSlug]);

  function onTitleChange(value: string) {
    setTitle(value);
    if (isNew && !slugTouched) setSlug(slugify(value));
  }

  function updateBlock(id: string, patch: Partial<Block>) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)));
  }

  function moveBlock(id: string, dir: -1 | 1) {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(idx, 1);
      copy.splice(target, 0, moved!);
      return copy;
    });
  }

  function duplicateBlock(id: string) {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const copy = [...prev];
      const dup = { ...prev[idx], id: newBlockId() } as Block;
      copy.splice(idx + 1, 0, dup);
      return copy;
    });
  }

  function deleteBlock(id: string) {
    setBlocks((prev) => (prev.length <= 1 ? prev : prev.filter((b) => b.id !== id)));
  }

  function addBlock(afterId: string | null, type: BlockType) {
    const block = createBlock(type);
    if (type === "heading") (block as Extract<Block, { type: "heading" }>).level = 2;
    setBlocks((prev) => {
      if (afterId === null) return [...prev, block];
      const idx = prev.findIndex((b) => b.id === afterId);
      if (idx < 0) return [...prev, block];
      const copy = [...prev];
      copy.splice(idx + 1, 0, block);
      return copy;
    });
    setAddMenuFor(null);
    setFocusReq({ id: block.id, cursor: 0 });
  }

  function splitParagraph(id: string) {
    const el = blockRefs.current.get(id) as HTMLTextAreaElement | null;
    const block = blocks.find((b) => b.id === id);
    if (!block || block.type !== "paragraph") return;
    const pos = el?.selectionStart ?? block.text.length;
    const before = block.text.slice(0, pos);
    const after = block.text.slice(pos).replace(/^\s+/, "");
    const next = { ...createBlock("paragraph"), text: after };
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const copy = [...prev];
      copy[idx] = { ...block, text: before };
      copy.splice(idx + 1, 0, next);
      return copy;
    });
    setFocusReq({ id: next.id, cursor: 0 });
  }

  /** Wrap the current selection in a text block with before/after marks. */
  function wrapSelection(blockId: string, before: string, after: string) {
    const el = blockRefs.current.get(blockId) as HTMLTextAreaElement | HTMLInputElement | null;
    const block = blocks.find((b) => b.id === blockId);
    if (!el || !block || !("text" in block)) return;
    const start = el.selectionStart ?? block.text.length;
    const end = el.selectionEnd ?? block.text.length;
    const selected = block.text.slice(start, end) || "text";
    const next = block.text.slice(0, start) + before + selected + after + block.text.slice(end);
    updateBlock(blockId, { text: next });
    requestAnimationFrame(() => {
      const el2 = blockRefs.current.get(blockId) as HTMLTextAreaElement | HTMLInputElement | null;
      if (!el2) return;
      el2.focus();
      try {
        el2.setSelectionRange(start + before.length, start + before.length + selected.length);
      } catch {
        // ignore
      }
    });
  }

  function openLink(blockId: string) {
    const el = blockRefs.current.get(blockId) as HTMLTextAreaElement | HTMLInputElement | null;
    linkSelection.current = el
      ? { start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 }
      : { start: 0, end: 0 };
    setLinkUrl("");
    setLinkError("");
    setLinkFor({ blockId });
  }

  function insertLink() {
    if (!linkFor) return;
    const url = linkUrl.trim();
    if (!isSafeLinkUrl(url)) {
      setLinkError("Use an internal path (/bmi-calculator) or a full https:// URL.");
      return;
    }
    const el = blockRefs.current.get(linkFor.blockId) as HTMLTextAreaElement | HTMLInputElement | null;
    const block = blocks.find((b) => b.id === linkFor.blockId);
    if (!el || !block || !("text" in block)) return;
    const sel = linkSelection.current ?? { start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 };
    const selected = block.text.slice(sel.start, sel.end) || "link text";
    const markup = `[${selected}](${url})`;
    const next = block.text.slice(0, sel.start) + markup + block.text.slice(sel.end);
    updateBlock(linkFor.blockId, { text: next });
    setLinkFor(null);
    setLinkUrl("");
    setFocusReq({ id: linkFor.blockId, cursor: sel.start + markup.length });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const post: BlogPost = {
      slug,
      title,
      excerpt,
      content,
      category: category.trim() || "General",
      tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
      status,
      author: author.trim() || defaultAuthor,
      featuredImage: featuredImage.trim(),
      focusKeyword: focusKeyword.trim(),
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      const savingAsNew = isNew && !created;
      const result = await savePost({ data: { post, isNew: savingAsNew, oldSlug: savingAsNew ? undefined : currentSlug ?? undefined } });
      if (result.ok) {
        const renamed = !savingAsNew && currentSlug !== null && result.post.slug !== currentSlug;
        setCurrentSlug(result.post.slug);
        setCreated(true);
        setMessage({
          ok: true,
          text: renamed
            ? `Saved as ${result.post.status}. Slug changed — the post now lives at /blog/${result.post.slug}; the old URL no longer works.`
            : `Saved as ${result.post.status}.`,
          newSlug: result.post.slug,
        });
      } else {
        setMessage({ ok: false, text: result.error });
      }
    } catch {
      setMessage({ ok: false, text: "Could not save the post. Try again." });
    } finally {
      setSaving(false);
    }
  }

  const slugHint =
    slugStatus === "checking"
      ? "Checking…"
      : slugStatus === "ok"
        ? "Available ✓"
        : slugStatus === "taken"
          ? "Already taken — pick another slug."
          : slugStatus === "invalid"
            ? "Lowercase letters, numbers and hyphens only."
            : slugStatus === "current"
              ? "This post's current slug."
              : isNew
                ? "Auto-generated from the title — editable."
                : "Editable — changing it changes the post URL.";
  const slugHintClass =
    slugStatus === "taken" || slugStatus === "invalid"
      ? "font-bold text-destructive"
      : slugStatus === "ok"
        ? "font-bold text-emerald-700"
        : "text-muted-foreground";

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>{isNew ? "New post" : "Edit post"}</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="post-title">Title</Label>
                <Input id="post-title" value={title} onChange={(e) => onTitleChange(e.target.value)} placeholder="How to calculate…" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <Label htmlFor="post-slug">Slug</Label>
                  <span className={`text-xs ${slugHintClass}`}>{slugHint}</span>
                </div>
                <Input
                  id="post-slug"
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); setSlugTouched(true); }}
                  placeholder="how-to-calculate"
                />
                {slug !== "" && (
                  <p className="text-xs text-muted-foreground">URL: /blog/{slug || "…"}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <Label htmlFor="post-excerpt">Excerpt</Label>
                  <Counter value={excerpt.length} max={200} />
                </div>
                <textarea
                  id="post-excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="One or two sentences shown on the blog list and in search results."
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="post-category">Category</Label>
                  <Input id="post-category" value={category} onChange={(e) => setCategory(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="post-tags">Tags (comma-separated)</Label>
                  <Input id="post-tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="mortgage, finance" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="post-status">Status</Label>
                  <select
                    id="post-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="post-author">Author</Label>
                <Input id="post-author" value={author} onChange={(e) => setAuthor(e.target.value)} className="max-w-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="post-featured-image">Featured image (URL)</Label>
                <Input
                  id="post-featured-image"
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  placeholder="https://example.com/cover.png"
                />
                <p className="text-xs text-muted-foreground">
                  Shown at the top of the article and used as the social preview image. Link by URL only —
                  there is no image upload; use any public https:// image link.
                </p>
                {isSafeImageUrl(featuredImage.trim()) && (
                  <img src={featuredImage.trim()} alt="Featured image preview" loading="lazy" className="max-h-48 rounded-lg border border-border object-cover" />
                )}
                {featuredImage.trim() !== "" && !isSafeImageUrl(featuredImage.trim()) && (
                  <p className="text-xs font-bold text-destructive">Enter a full https:// image URL.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Content</CardTitle>
                  <CardDescription>Blocks are saved as Markdown — the same format the public page renders.</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowPreview((v) => !v)}>
                  <Eye className="size-4" /> {showPreview ? "Hide preview" : "Show preview"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1" onClick={() => setAddMenuFor(null)}>
                {blocks.map((block, index) => (
                  <BlockRow
                    key={block.id}
                    block={block}
                    index={index}
                    total={blocks.length}
                    focused={focusedBlockId === block.id}
                    onFocus={() => setFocusedBlockId(block.id)}
                    onBlur={() => setFocusedBlockId((f) => (f === block.id ? null : f))}
                    onUpdate={(patch) => updateBlock(block.id, patch)}
                    onMove={(dir) => moveBlock(block.id, dir)}
                    onDuplicate={() => duplicateBlock(block.id)}
                    onDelete={() => deleteBlock(block.id)}
                    onSplit={() => splitParagraph(block.id)}
                    onWrap={(before, after) => wrapSelection(block.id, before, after)}
                    onLink={() => openLink(block.id)}
                    linkOpen={linkFor?.blockId === block.id}
                    linkUrl={linkUrl}
                    onLinkUrlChange={setLinkUrl}
                    linkError={linkError}
                    onLinkInsert={insertLink}
                    onLinkCancel={() => setLinkFor(null)}
                    addMenuOpen={addMenuFor === block.id}
                    onAddMenuToggle={() => setAddMenuFor((v) => (v === block.id ? null : block.id))}
                    onAdd={(type) => addBlock(block.id, type)}
                    registerRef={(el) => {
                      if (el) blockRefs.current.set(block.id, el);
                      else blockRefs.current.delete(block.id);
                    }}
                  />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="sm" onMouseDown={(e) => e.preventDefault()} onClick={() => setAddMenuFor((v) => (v === "end" ? null : "end"))}>
                  <Plus className="size-4" /> Add block
                </Button>
                {addMenuFor === "end" && (
                  <AddBlockMenu onAdd={(type) => addBlock(null, type)} onClose={() => setAddMenuFor(null)} />
                )}
              </div>
              {showPreview && (
                <div className="mt-5 rounded-lg border border-border bg-muted/30 p-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Preview</p>
                  {/* Safe: renderMarkdown escapes all HTML first. */}
                  <div className="prose-calc" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                </div>
              )}
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><FileText className="size-3.5" /> {words.toLocaleString()} words · ~{readingMinutes(content)} min read</span>
                <span>{content.length.toLocaleString()} / 50,000 characters</span>
                <span>{seo.internalLinks} internal links · {seo.images} images</span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Raw HTML is escaped, and internal (/…) and external (https://…) links all render — the
                preview shows exactly what readers will see.
              </p>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO score</CardTitle>
              <CardDescription>Live — updates as you type.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <ScoreRing score={seo.score} />
                <div>
                  <p className="text-sm font-bold">
                    {seo.score >= 80 ? "Good — ready to publish." : seo.score >= 50 ? "Getting there — fix the red items." : "Needs work before publishing."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {seo.words.toLocaleString()} words · {seo.headings} subheadings · {seo.internalLinks} internal links
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="post-focus-keyword">Focus keyword</Label>
                <Input
                  id="post-focus-keyword"
                  value={focusKeyword}
                  onChange={(e) => setFocusKeyword(e.target.value)}
                  placeholder="e.g. bmi calculator"
                />
                <p className="text-xs text-muted-foreground">
                  The phrase this post should rank for. Checked against the title, slug, first paragraph and headings.
                </p>
              </div>
              <ul className="space-y-2">
                {seo.checks.map((check) => (
                  <li key={check.id} className="flex items-start gap-2 text-sm">
                    {check.status === "pass" ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    ) : check.status === "warn" ? (
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                    ) : (
                      <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                    )}
                    <span>
                      <span className="font-semibold">{check.label}. </span>
                      <span className="text-muted-foreground">{check.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>

      {message && (
        <p className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${message.ok ? "border-emerald-600/30 bg-emerald-50 text-emerald-900" : "border-destructive/30 bg-destructive/5 text-destructive"}`}>
          {message.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <XCircle className="mt-0.5 size-4 shrink-0" />}
          <span>
            {message.text}
            {message.ok && message.newSlug && status === "published" && (
              <>
                {" "}
                <Link to="/blog/$slug" params={{ slug: message.newSlug }} className="font-bold underline">View post →</Link>
              </>
            )}
          </span>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saving || slugStatus === "taken" || slugStatus === "invalid"}>
          {saving ? "Saving…" : isNew && !created ? "Create post" : "Save post"}
        </Button>
        <Link to="/admin/blog" className="text-sm font-semibold text-muted-foreground hover:text-primary">Back to all posts</Link>
      </div>

      <p className="rounded-xl border border-border bg-card p-4 text-sm leading-6 text-muted-foreground">
        On a Node server the post is live immediately; in a production build, redeploy to include
        it in the static bundle. With Neon configured, published posts are live on Vercel as soon
        as they are saved.
      </p>
    </form>
  );
}

function AddBlockMenu({ onAdd, onClose }: { onAdd: (type: BlockType) => void; onClose: () => void }) {
  return (
    <span className="relative inline-flex" onClick={(e) => e.stopPropagation()}>
      <span className="absolute left-0 top-full z-20 mt-1 w-48 rounded-lg border border-border bg-card p-1 shadow-lg">
        {BLOCK_MENU.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-accent"
            onClick={() => onAdd(type)}
          >
            <Icon className="size-4 text-muted-foreground" /> {label}
          </button>
        ))}
        <button
          type="button"
          className="mt-1 w-full rounded-md px-2.5 py-1.5 text-left text-xs text-muted-foreground hover:bg-accent"
          onClick={onClose}
        >
          Close
        </button>
      </span>
    </span>
  );
}

function BlockRow(props: {
  block: Block;
  index: number;
  total: number;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onUpdate: (patch: Partial<Block>) => void;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSplit: () => void;
  onWrap: (before: string, after: string) => void;
  onLink: () => void;
  linkOpen: boolean;
  linkUrl: string;
  onLinkUrlChange: (v: string) => void;
  linkError: string;
  onLinkInsert: () => void;
  onLinkCancel: () => void;
  addMenuOpen: boolean;
  onAddMenuToggle: () => void;
  onAdd: (type: BlockType) => void;
  registerRef: (el: HTMLElement | null) => void;
}) {
  const { block, index, total } = props;
  const isText = block.type === "paragraph" || block.type === "heading" || block.type === "quote";

  return (
    <div
      className={`group relative rounded-lg border px-2 py-2 pl-8 transition-colors ${props.focused ? "border-primary/50 bg-card" : "border-transparent hover:border-border hover:bg-card/60"}`}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="absolute left-1 top-2 flex flex-col items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <GripVertical className="size-4 text-muted-foreground" />
        <button
          type="button"
          aria-label="Add block below"
          title="Add block below"
          className="rounded p-0.5 hover:bg-accent"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => { e.stopPropagation(); props.onAddMenuToggle(); }}
        >
          <Plus className="size-4" />
        </button>
      </span>
      {props.addMenuOpen && (
        <span className="absolute left-8 top-8 z-20">
          <AddBlockMenu onAdd={props.onAdd} onClose={props.onAddMenuToggle} />
        </span>
      )}
      <span className="absolute right-1 top-1.5 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button type="button" aria-label="Move block up" title="Move up" disabled={index === 0} onClick={() => props.onMove(-1)} className="rounded p-1 hover:bg-accent disabled:opacity-30">
          <ArrowUp className="size-3.5" />
        </button>
        <button type="button" aria-label="Move block down" title="Move down" disabled={index === total - 1} onClick={() => props.onMove(1)} className="rounded p-1 hover:bg-accent disabled:opacity-30">
          <ArrowDown className="size-3.5" />
        </button>
        <button type="button" aria-label="Duplicate block" title="Duplicate" onClick={props.onDuplicate} className="rounded p-1 hover:bg-accent">
          <Copy className="size-3.5" />
        </button>
        <button type="button" aria-label="Delete block" title="Delete" onClick={props.onDelete} className="rounded p-1 hover:bg-accent hover:text-destructive">
          <Trash2 className="size-3.5" />
        </button>
      </span>

      {/* The toolbar is always rendered for text blocks and only hidden
          with `invisible` when unfocused — unmounting it on blur shifts
          the layout and the click that caused the blur can miss its
          target (the "Add block" button below the blocks). */}
      {isText && (
        <span className={`mb-1.5 flex flex-wrap items-center gap-1 ${props.focused || props.linkOpen ? "" : "invisible"}`}>
          <button type="button" aria-label="Bold" title="Bold" onMouseDown={(e) => e.preventDefault()} onClick={() => props.onWrap("**", "**")} className="rounded border border-border bg-background p-1.5 hover:bg-accent">
            <Bold className="size-3.5" />
          </button>
          <button type="button" aria-label="Italic" title="Italic" onMouseDown={(e) => e.preventDefault()} onClick={() => props.onWrap("*", "*")} className="rounded border border-border bg-background p-1.5 hover:bg-accent">
            <Italic className="size-3.5" />
          </button>
          <button type="button" aria-label="Add link" title="Add link" onMouseDown={(e) => e.preventDefault()} onClick={props.onLink} className="rounded border border-border bg-background p-1.5 hover:bg-accent">
            <Link2 className="size-3.5" />
          </button>
          {block.type === "heading" && (
            <span className="ml-2 flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => props.onUpdate({ level: 2 })}
                className={`rounded border px-2 py-1 ${block.level === 2 ? "border-primary bg-primary/10 font-bold" : "border-border"}`}
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => props.onUpdate({ level: 3 })}
                className={`rounded border px-2 py-1 ${block.level === 3 ? "border-primary bg-primary/10 font-bold" : "border-border"}`}
              >
                H3
              </button>
            </span>
          )}
          {props.linkOpen && (
            <span className="flex flex-1 flex-wrap items-center gap-1.5">
              <input
                value={props.linkUrl}
                onChange={(e) => props.onLinkUrlChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); props.onLinkInsert(); } }}
                placeholder="/bmi-calculator or https://…"
                aria-label="Link URL"
                className="min-w-40 flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-ring"
              />
              <button type="button" onClick={props.onLinkInsert} className="rounded bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
                Insert
              </button>
              <button type="button" onClick={props.onLinkCancel} className="rounded border border-border px-2 py-1 text-xs">
                Cancel
              </button>
              {props.linkError && <span className="w-full text-xs font-bold text-destructive">{props.linkError}</span>}
            </span>
          )}
        </span>
      )}

      {block.type === "paragraph" && (
        <textarea
          ref={(el) => { props.registerRef(el); if (el) autoGrow(el); }}
          value={block.text}
          onChange={(e) => { props.onUpdate({ text: e.target.value }); autoGrow(e.target); }}
          onFocus={props.onFocus}
          onBlur={props.onBlur}
          rows={1}
          aria-label="Paragraph block"
          placeholder="Write a paragraph… (Enter starts a new block, Shift+Enter adds a line)"
          className="w-full resize-none overflow-hidden rounded-md bg-transparent px-2 py-1 text-sm leading-7 outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              props.onSplit();
            }
            if (e.key === "Backspace" && block.text === "" && props.total > 1) {
              e.preventDefault();
              props.onDelete();
            }
          }}
        />
      )}
      {block.type === "heading" && (
        <input
          ref={(el) => props.registerRef(el)}
          value={block.text}
          onChange={(e) => props.onUpdate({ text: e.target.value })}
          onFocus={props.onFocus}
          onBlur={props.onBlur}
          aria-label={`Heading ${block.level} block`}
          placeholder={block.level === 2 ? "Heading 2…" : "Heading 3…"}
          className={`w-full rounded-md bg-transparent px-2 py-1 font-display font-extrabold outline-none ${block.level === 2 ? "text-2xl" : "text-xl"}`}
        />
      )}
      {block.type === "quote" && (
        <textarea
          ref={(el) => { props.registerRef(el); if (el) autoGrow(el); }}
          value={block.text}
          onChange={(e) => { props.onUpdate({ text: e.target.value }); autoGrow(e.target); }}
          onFocus={props.onFocus}
          onBlur={props.onBlur}
          rows={1}
          aria-label="Quote block"
          placeholder="Quote…"
          className="w-full resize-none overflow-hidden rounded-md border-l-4 border-accent bg-muted/40 px-3 py-1.5 text-sm italic leading-7 outline-none"
        />
      )}
      {block.type === "list" && (
        <div className="px-2" onFocus={props.onFocus} onBlur={props.onBlur}>
          <span className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => props.onUpdate({ ordered: false })}
              className={`rounded border px-2 py-0.5 ${!block.ordered ? "border-primary bg-primary/10 font-bold text-foreground" : "border-border"}`}
            >
              Bulleted
            </button>
            <button
              type="button"
              onClick={() => props.onUpdate({ ordered: true })}
              className={`rounded border px-2 py-0.5 ${block.ordered ? "border-primary bg-primary/10 font-bold text-foreground" : "border-border"}`}
            >
              Numbered
            </button>
            <span>One item per line.</span>
          </span>
          <textarea
            ref={(el) => { props.registerRef(el); if (el) autoGrow(el); }}
            value={block.items.join("\n")}
            onChange={(e) => { props.onUpdate({ items: e.target.value.split("\n") }); autoGrow(e.target); }}
            rows={Math.max(1, block.items.length)}
            aria-label="List block, one item per line"
            placeholder={"First item\nSecond item"}
            className="w-full resize-none overflow-hidden rounded-md bg-transparent py-1 text-sm leading-7 outline-none"
          />
        </div>
      )}
      {block.type === "image" && (
        <div className="space-y-2 px-2 py-1" onFocus={props.onFocus} onBlur={props.onBlur}>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="space-y-1 text-xs">
              <span className="font-semibold text-foreground">Image URL</span>
              <input
                ref={(el) => props.registerRef(el)}
                value={block.src}
                onChange={(e) => props.onUpdate({ src: e.target.value })}
                placeholder="https://example.com/image.png"
                aria-label="Image URL"
                className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-semibold text-foreground">Alt text</span>
              <input
                value={block.alt}
                onChange={(e) => props.onUpdate({ alt: e.target.value })}
                placeholder="Describe the image"
                aria-label="Image alt text"
                className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          </div>
          <label className="block space-y-1 text-xs">
            <span className="font-semibold text-foreground">Caption (optional)</span>
            <input
              value={block.caption}
              onChange={(e) => props.onUpdate({ caption: e.target.value })}
              placeholder="Shown under the image"
              aria-label="Image caption"
              className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          {isSafeImageUrl(block.src.trim()) ? (
            <img src={block.src.trim()} alt={block.alt || "Image preview"} loading="lazy" className="max-h-56 rounded-lg border border-border object-cover" />
          ) : (
            <p className="text-xs text-muted-foreground">
              Images are linked by URL only — paste a public https:// image link. No upload.
            </p>
          )}
        </div>
      )}
      {block.type === "code" && (
        <div className="space-y-1.5 px-2 py-1" onFocus={props.onFocus} onBlur={props.onBlur}>
          <input
            value={block.language}
            onChange={(e) => props.onUpdate({ language: e.target.value })}
            placeholder="Language (optional, e.g. js)"
            aria-label="Code language"
            className="w-40 rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-ring"
          />
          <textarea
            ref={(el) => { props.registerRef(el); if (el) autoGrow(el); }}
            value={block.text}
            onChange={(e) => { props.onUpdate({ text: e.target.value }); autoGrow(e.target); }}
            rows={3}
            aria-label="Code block"
            placeholder="// code…"
            className="w-full resize-none overflow-hidden rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-sm leading-6 outline-none"
          />
        </div>
      )}
      {block.type === "divider" && (
        <div className="flex items-center gap-3 px-2 py-2" onFocus={props.onFocus} onBlur={props.onBlur}>
          <hr className="flex-1 border-border" />
          <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Divider</span>
          <hr className="flex-1 border-border" />
        </div>
      )}
    </div>
  );
}
