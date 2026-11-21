// Custom (non-form) tools for batch 27: Diff Checker, Image to Base64
// Converter, SHA-1 / SHA-512 Hash Generators and Meta Tag Generator.
// Each manages its own state — the generic form renderer in $slug.tsx
// cannot express a file picker, a highlighted diff, async hashing or a
// copyable code block.
import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Check, Clipboard, FileUp } from "lucide-react";
import { diffLines, diffSummary, diffText } from "@/lib/diff";
import { hashBase64, hashHex, type HashAlgorithm } from "@/lib/hash";
import { buildMetaTags } from "@/lib/meta-tags";

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";
const btnPrimary =
  "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90";
const btnOutline =
  "inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary";

const MAX_DIFF_LINES = 500;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

/* ------------------------------------------------------------------ */
/* Diff Checker                                                        */
/* ------------------------------------------------------------------ */

const DIFF_A = "The quick brown fox\njumps over the lazy dog\nand runs away.";
const DIFF_B = "The quick brown fox\nleaps over the lazy dog\nand runs away.";

export function DiffChecker() {
  const [a, setA] = useState(DIFF_A);
  const [b, setB] = useState(DIFF_B);
  const [copied, setCopied] = useState(false);
  const lines = useMemo(() => {
    const aLines = a.split("\n");
    const bLines = b.split("\n");
    if (aLines.length > MAX_DIFF_LINES || bLines.length > MAX_DIFF_LINES) return null;
    return diffLines(a, b);
  }, [a, b]);
  const summary = lines ? diffSummary(lines) : null;

  async function copy() {
    await navigator.clipboard.writeText(diffText(a, b));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold">Original text</span>
          <textarea
            className={`${inputCls} mt-1.5 font-mono leading-6`}
            rows={7}
            value={a}
            onChange={(e) => setA(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Changed text</span>
          <textarea
            className={`${inputCls} mt-1.5 font-mono leading-6`}
            rows={7}
            value={b}
            onChange={(e) => setB(e.target.value)}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setA(b);
            setB(a);
          }}
          className={btnOutline}
        >
          <ArrowLeftRight className="size-4" /> Swap sides
        </button>
        <button type="button" onClick={copy} disabled={!lines} className={btnOutline}>
          {copied ? <Check className="size-4" /> : <Clipboard className="size-4" />}
          {copied ? "Copied" : "Copy diff"}
        </button>
      </div>
      {lines === null ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          Each side is limited to {MAX_DIFF_LINES} lines so the comparison stays fast.
        </p>
      ) : (
        <div aria-live="polite">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-green-700 dark:text-green-400">{summary!.added} added</span>
            {" · "}
            <span className="font-semibold text-red-700 dark:text-red-400">{summary!.removed} removed</span>
            {" · "}
            {summary!.unchanged} unchanged
          </p>
          <div className="mt-3 overflow-hidden rounded-xl border border-border font-mono text-sm leading-6">
            {lines.map((line, i) => (
              <div
                key={i}
                className={
                  line.type === "add"
                    ? "bg-green-500/10 px-3 py-0.5 text-green-900 dark:text-green-200"
                    : line.type === "del"
                      ? "bg-red-500/10 px-3 py-0.5 text-red-900 dark:text-red-200"
                      : "px-3 py-0.5 text-muted-foreground"
                }
              >
                <span className="mr-2 inline-block w-4 select-none text-right opacity-60">
                  {line.type === "add" ? "+" : line.type === "del" ? "−" : " "}
                </span>
                {line.text === "" ? " " : line.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Image to Base64 Converter                                           */
/* ------------------------------------------------------------------ */

export function ImageToBase64() {
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState("");
  const [format, setFormat] = useState<"uri" | "html" | "css">("uri");
  const [copied, setCopied] = useState(false);

  function onFile(file: File | undefined) {
    setError("");
    setDataUrl("");
    setFileName("");
    setFileSize(0);
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setError(`That file is ${formatBytes(file.size)} — the limit is 5 MB.`);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file (PNG, JPG, GIF, SVG or WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDataUrl(String(reader.result ?? ""));
      setFileName(file.name);
      setFileSize(file.size);
    };
    reader.onerror = () => setError("Could not read that file — try another image.");
    reader.readAsDataURL(file);
  }

  const output =
    format === "uri"
      ? dataUrl
      : format === "html"
        ? `<img src="${dataUrl}" alt="${fileName.replace(/"/g, "")}">`
        : `background-image: url("${dataUrl}");`;

  async function copy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-semibold">Image file (up to 5 MB)</span>
        <span
          className={`${inputCls} mt-1.5 flex cursor-pointer items-center gap-2 text-muted-foreground`}
        >
          <FileUp className="size-4 shrink-0" />
          <span className="truncate">{fileName || "Choose an image…"}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </span>
      </label>
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {dataUrl && (
        <div className="space-y-3" aria-live="polite">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>
              Original: <strong className="text-foreground">{formatBytes(fileSize)}</strong>
            </span>
            <span>
              Base64 output: <strong className="text-foreground">{formatBytes(output.length)}</strong>
            </span>
            <span>About {Math.round(((output.length - fileSize) / fileSize) * 100)}% larger</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["uri", "html", "css"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={
                  format === f
                    ? "rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
                    : "rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary"
                }
              >
                {f === "uri" ? "Data URI" : f === "html" ? "HTML <img>" : "CSS background"}
              </button>
            ))}
            <button type="button" onClick={copy} className={btnOutline}>
              {copied ? <Check className="size-4" /> : <Clipboard className="size-4" />}
              {copied ? "Copied" : "Copy output"}
            </button>
          </div>
          <textarea
            readOnly
            value={output}
            rows={8}
            className={`${inputCls} font-mono text-xs leading-5`}
            aria-label="Base64 output"
          />
          <p className="text-xs text-muted-foreground">
            The file was read by your browser and never uploaded — nothing leaves your device.
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SHA-1 / SHA-512 Hash Generators                                     */
/* ------------------------------------------------------------------ */

function HashGenerator({ algorithm, warning }: { algorithm: HashAlgorithm; warning?: string }) {
  const [text, setText] = useState("Hello, world!");
  const [hex, setHex] = useState("");
  const [b64, setB64] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [h, b] = await Promise.all([hashHex(text, algorithm), hashBase64(text, algorithm)]);
        if (!cancelled) {
          setHex(h);
          setB64(b);
          setError("");
        }
      } catch {
        if (!cancelled) {
          setHex("");
          setB64("");
          setError(`Web Crypto is not available in this browser — ${algorithm} needs a secure (https) page.`);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [text, algorithm]);

  async function copy(value: string, which: string) {
    await navigator.clipboard.writeText(value);
    setCopied(which);
    window.setTimeout(() => setCopied(""), 1600);
  }

  return (
    <div className="space-y-4">
      {warning && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
          {warning}
        </p>
      )}
      <label className="block">
        <span className="text-sm font-semibold">Text to hash</span>
        <textarea
          className={`${inputCls} mt-1.5 font-mono leading-6`}
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste text…"
        />
      </label>
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : (
        <div className="space-y-3" aria-live="polite">
          <div className="rounded-xl bg-primary p-5 text-primary-foreground">
            <p className="text-xs font-medium text-primary-foreground/70">{algorithm} (hexadecimal)</p>
            <p className="mt-1 break-all font-mono text-sm font-bold leading-6">{hex}</p>
            <button
              type="button"
              onClick={() => copy(hex, "hex")}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary-foreground/15 px-3 py-1.5 text-xs font-bold hover:bg-primary-foreground/25"
            >
              {copied === "hex" ? <Check className="size-3.5" /> : <Clipboard className="size-3.5" />}
              {copied === "hex" ? "Copied" : "Copy hash"}
            </button>
          </div>
          <div className="rounded-xl border border-border bg-muted/60 p-4">
            <p className="text-xs font-medium text-muted-foreground">{algorithm} (Base64)</p>
            <p className="mt-1 break-all font-mono text-sm font-bold leading-6">{b64}</p>
            <button
              type="button"
              onClick={() => copy(b64, "b64")}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground hover:border-primary hover:text-primary"
            >
              {copied === "b64" ? <Check className="size-3.5" /> : <Clipboard className="size-3.5" />}
              {copied === "b64" ? "Copied" : "Copy hash"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Sha1Generator() {
  return (
    <HashGenerator
      algorithm="SHA-1"
      warning="SHA-1 is broken for security — use it for checksums and legacy systems only, never for passwords or signatures. Use SHA-256 or SHA-512 for anything security-related."
    />
  );
}

export function Sha512Generator() {
  return <HashGenerator algorithm="SHA-512" />;
}

/* ------------------------------------------------------------------ */
/* Meta Tag Generator                                                  */
/* ------------------------------------------------------------------ */

export function MetaTagGenerator() {
  const [title, setTitle] = useState("CalcHub — Free Online Calculators");
  const [description, setDescription] = useState("Free online calculators for finance, health, maths and more.");
  const [keywords, setKeywords] = useState("");
  const [canonical, setCanonical] = useState("");
  const [author, setAuthor] = useState("");
  const [robots, setRobots] = useState("index, follow");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [ogUrl, setOgUrl] = useState("");
  const [ogType, setOgType] = useState("website");
  const [twitterCard, setTwitterCard] = useState("summary_large_image");
  const [copied, setCopied] = useState(false);

  const output = buildMetaTags({
    title,
    description,
    keywords,
    canonical,
    author,
    robots,
    ogTitle,
    ogDescription,
    ogImage,
    ogUrl,
    ogType,
    twitterCard,
    twitterTitle: "",
    twitterDescription: "",
    twitterImage: "",
  });
  const tagCount = output === "" ? 0 : output.split("\n").length;

  async function copy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const field = (label: string, value: string, set: (v: string) => void, placeholder = "") => (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input
        className={`${inputCls} mt-1.5`}
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {field("Page title", title, setTitle, "Your page title")}
        {field("Meta description", description, setDescription, "A short description of the page")}
        {field("Keywords (optional)", keywords, setKeywords, "calculator, finance, tools")}
        {field("Canonical URL (optional)", canonical, setCanonical, "https://example.com/page")}
        {field("Author (optional)", author, setAuthor, "Your name")}
        <label className="block">
          <span className="text-sm font-semibold">Robots</span>
          <select
            className={`${inputCls} mt-1.5`}
            value={robots}
            onChange={(e) => setRobots(e.target.value)}
          >
            <option value="index, follow">index, follow (default)</option>
            <option value="noindex, follow">noindex, follow</option>
            <option value="index, nofollow">index, nofollow</option>
            <option value="noindex, nofollow">noindex, nofollow</option>
          </select>
        </label>
        {field("Open Graph title (blank = page title)", ogTitle, setOgTitle)}
        {field("Open Graph description (blank = description)", ogDescription, setOgDescription)}
        {field("Open Graph image URL", ogImage, setOgImage, "https://example.com/og-image.png")}
        {field("Open Graph URL", ogUrl, setOgUrl, "https://example.com/page")}
        <label className="block">
          <span className="text-sm font-semibold">Open Graph type</span>
          <select
            className={`${inputCls} mt-1.5`}
            value={ogType}
            onChange={(e) => setOgType(e.target.value)}
          >
            <option value="website">website</option>
            <option value="article">article</option>
            <option value="product">product</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Twitter Card</span>
          <select
            className={`${inputCls} mt-1.5`}
            value={twitterCard}
            onChange={(e) => setTwitterCard(e.target.value)}
          >
            <option value="summary_large_image">summary_large_image</option>
            <option value="summary">summary</option>
            <option value="">None</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={copy} disabled={output === ""} className={btnPrimary}>
          {copied ? <Check className="size-4" /> : <Clipboard className="size-4" />}
          {copied ? "Copied" : "Copy meta tags"}
        </button>
        <span className="text-sm text-muted-foreground">{tagCount} tags generated</span>
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-muted/60 p-4 font-mono text-xs leading-6">
        {output || "Fill in the title and description to generate tags."}
      </pre>
    </div>
  );
}
