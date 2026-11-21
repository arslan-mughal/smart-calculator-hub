// Custom components for batch 29 dev & text tools and SEO generators.
// Each manages its own state — the generic form renderer in $slug.tsx
// cannot express a code editor, a live preview or a copyable output
// block. Everything here runs in the browser: code and text never
// leave the device.
import { useMemo, useState } from "react";
import { Check, Clipboard } from "lucide-react";
import { renderMarkdown } from "@/lib/markdown";
import {
  ASCII_TABLE,
  beautifyCss,
  beautifyHtml,
  beautifyJs,
  formatYaml,
  htmlToMarkdown,
  jsonToYaml,
  minifyJs,
} from "@/lib/formatters";
import { buildHreflangTags, buildRobotsTxt, buildSchemaJsonLd, buildSitemapXml } from "@/lib/seo-generators";

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";
const btnPrimary =
  "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50";
const btnOutline =
  "inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary";

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={btnOutline}
      disabled={!text}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }}
    >
      {copied ? <Check className="size-4" /> : <Clipboard className="size-4" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function OutputBlock({ label, text, stats }: { label: string; text: string; stats?: string }) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold">{label}</span>
        <CopyButton text={text} />
      </div>
      <pre className="mt-1.5 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-muted/40 p-3 font-mono text-sm leading-6">
        {text}
      </pre>
      {stats && <p className="mt-1.5 text-sm text-muted-foreground">{stats}</p>}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{message}</p>
  );
}

/* ------------------------------------------------------------------ */
/* JavaScript Minifier / Beautifier                                    */
/* ------------------------------------------------------------------ */

const JS_SAMPLE = `function greet(name) {
  // Say hello
  const message = \`Hello, \${name}!\`;
  return message;
}

console.log(greet('world'));`;

export function JsMinifierBeautifier() {
  const [input, setInput] = useState(JS_SAMPLE);
  const [mode, setMode] = useState<"minify" | "beautify">("minify");
  const [output, setOutput] = useState("");
  const [stats, setStats] = useState("");
  const [error, setError] = useState("");

  function run() {
    setError("");
    try {
      if (mode === "minify") {
        const r = minifyJs(input);
        setOutput(r.code);
        setStats(
          `${input.length} bytes → ${r.code.length} bytes — saved ${r.savedBytes} bytes (${r.savedPercent}%).`,
        );
      } else {
        const code = beautifyJs(input);
        setOutput(code);
        setStats(`${input.length} bytes → ${code.length} bytes formatted.`);
      }
    } catch {
      setError("Could not process this code — check that it is valid JavaScript and try again.");
    }
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-semibold">JavaScript code</span>
        <textarea className={`${inputCls} mt-1.5 font-mono leading-6`} rows={9} value={input} onChange={(e) => setInput(e.target.value)} />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-border p-1" role="group" aria-label="Mode">
          {(["minify", "beautify"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {m === "minify" ? "Minify" : "Beautify"}
            </button>
          ))}
        </div>
        <button type="button" onClick={run} className={btnPrimary}>
          {mode === "minify" ? "Minify code" : "Beautify code"}
        </button>
      </div>
      {error && <ErrorBox message={error} />}
      {output && <OutputBlock label="Result" text={output} stats={stats} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CSS Beautifier / HTML Beautifier (shared shape)                     */
/* ------------------------------------------------------------------ */

const CSS_SAMPLE =
  ".card{padding:16px;border:1px solid #ddd;border-radius:8px}.card h2{margin:0 0 8px;font-size:20px}@media (max-width:600px){.card{padding:12px}}";
const HTML_SAMPLE =
  '<div class="card"><h2>Hello</h2><p>This is a <strong>sample</strong> page.</p><ul><li>One</li><li>Two</li></ul></div>';

function Beautifier({
  label,
  sample,
  format,
  buttonLabel,
}: {
  label: string;
  sample: string;
  format: (code: string) => string;
  buttonLabel: string;
}) {
  const [input, setInput] = useState(sample);
  const [output, setOutput] = useState("");
  function run() {
    setOutput(format(input));
  }
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-semibold">{label}</span>
        <textarea className={`${inputCls} mt-1.5 font-mono leading-6`} rows={8} value={input} onChange={(e) => setInput(e.target.value)} />
      </label>
      <div>
        <button type="button" onClick={run} className={btnPrimary}>
          {buttonLabel}
        </button>
      </div>
      {output && <OutputBlock label="Formatted result" text={output} />}
    </div>
  );
}

export function CssBeautifier() {
  return <Beautifier label="CSS code" sample={CSS_SAMPLE} format={beautifyCss} buttonLabel="Beautify CSS" />;
}

export function HtmlBeautifier() {
  return <Beautifier label="HTML code" sample={HTML_SAMPLE} format={beautifyHtml} buttonLabel="Beautify HTML" />;
}

/* ------------------------------------------------------------------ */
/* YAML Formatter / Validator                                          */
/* ------------------------------------------------------------------ */

const YAML_SAMPLE = `site:
  name: My Site
  url: https://example.com
features:
  - blog
  - tools
published: true`;

export function YamlFormatterValidator() {
  const [input, setInput] = useState(YAML_SAMPLE);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  function run() {
    const r = formatYaml(input);
    if (r.ok) {
      setOutput(r.output);
      setError("");
    } else {
      setOutput("");
      setError(r.error);
    }
  }
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-semibold">YAML</span>
        <textarea className={`${inputCls} mt-1.5 font-mono leading-6`} rows={9} value={input} onChange={(e) => setInput(e.target.value)} />
      </label>
      <div>
        <button type="button" onClick={run} className={btnPrimary}>
          Format &amp; validate
        </button>
      </div>
      {error && <ErrorBox message={error} />}
      {output && <OutputBlock label="Formatted YAML" text={output} stats="Valid YAML." />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Markdown Editor (public tool — not the admin post editor)           */
/* ------------------------------------------------------------------ */

const MD_SAMPLE = `# Hello

Write **bold** text, *italic* text, and [links](https://example.com).

- One
- Two
- Three

> A quote to remember.`;

export function MarkdownEditor() {
  const [input, setInput] = useState(MD_SAMPLE);
  const html = useMemo(() => renderMarkdown(input), [input]);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold">Markdown</span>
          <textarea className={`${inputCls} mt-1.5 font-mono leading-6`} rows={14} value={input} onChange={(e) => setInput(e.target.value)} />
        </label>
        <div>
          <span className="text-sm font-semibold">Preview</span>
          <div
            className="prose mt-1.5 max-w-none rounded-lg border border-border bg-muted/40 p-4 text-sm leading-7 dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
      <div>
        <CopyButton text={input} label="Copy Markdown" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HTML to Markdown Converter                                          */
/* ------------------------------------------------------------------ */

const HTML_MD_SAMPLE = `<h1>Hello</h1><p>This is a <strong>sample</strong> with a <a href="https://example.com">link</a>.</p><ul><li>One</li><li>Two</li></ul>`;

export function HtmlToMarkdownConverter() {
  const [input, setInput] = useState(HTML_MD_SAMPLE);
  const [output, setOutput] = useState("");
  function run() {
    setOutput(htmlToMarkdown(input));
  }
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-semibold">HTML</span>
        <textarea className={`${inputCls} mt-1.5 font-mono leading-6`} rows={8} value={input} onChange={(e) => setInput(e.target.value)} />
      </label>
      <div>
        <button type="button" onClick={run} className={btnPrimary}>
          Convert to Markdown
        </button>
      </div>
      {output && <OutputBlock label="Markdown" text={output} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CSS Box Shadow Generator                                            */
/* ------------------------------------------------------------------ */

function hexToRgba(hex: string, opacity: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return `rgba(0, 0, 0, ${opacity})`;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "px",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex justify-between text-sm font-semibold">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        className="mt-1 w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function CssBoxShadowGenerator() {
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(8);
  const [blur, setBlur] = useState(24);
  const [spread, setSpread] = useState(0);
  const [opacity, setOpacity] = useState(0.2);
  const [color, setColor] = useState("#000000");
  const [inset, setInset] = useState(false);
  const css = `box-shadow: ${inset ? "inset " : ""}${offsetX}px ${offsetY}px ${blur}px ${spread}px ${hexToRgba(color, opacity)};`;
  return (
    <div className="space-y-4">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <Slider label="Horizontal offset" value={offsetX} min={-50} max={50} onChange={setOffsetX} />
          <Slider label="Vertical offset" value={offsetY} min={-50} max={50} onChange={setOffsetY} />
          <Slider label="Blur radius" value={blur} min={0} max={100} onChange={setBlur} />
          <Slider label="Spread radius" value={spread} min={-20} max={50} onChange={setSpread} />
          <Slider label="Opacity" value={opacity} min={0} max={1} step={0.05} unit="" onChange={setOpacity} />
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold">
              Colour
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-input bg-background" />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={inset} onChange={(e) => setInset(e.target.checked)} className="size-4" />
              Inset shadow
            </label>
          </div>
        </div>
        <div className="flex items-center justify-center rounded-xl border border-border bg-muted/40 p-8">
          <div
            className="flex h-32 w-48 items-center justify-center rounded-xl bg-card text-sm font-bold"
            style={{ boxShadow: css.replace("box-shadow: ", "").replace(";", "") }}
          >
            Preview
          </div>
        </div>
      </div>
      <OutputBlock label="CSS" text={css} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ASCII Table Reference                                               */
/* ------------------------------------------------------------------ */

export function AsciiTableReference() {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ASCII_TABLE;
    return ASCII_TABLE.filter(
      (r) =>
        r.char.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        String(r.dec).includes(q) ||
        r.hex.toLowerCase().includes(q),
    );
  }, [query]);
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-semibold">Search (character, name, decimal or hex)</span>
        <input className={`${inputCls} mt-1.5`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. A, TAB, 65, 41" />
      </label>
      <div className="max-h-96 overflow-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted">
            <tr>
              <th className="px-3 py-2 text-left">Decimal</th>
              <th className="px-3 py-2 text-left">Hex</th>
              <th className="px-3 py-2 text-left">Character</th>
              <th className="px-3 py-2 text-left">Name</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.dec} className="border-t border-border">
                <td className="px-3 py-1.5 font-mono">{r.dec}</td>
                <td className="px-3 py-1.5 font-mono">{r.hex}</td>
                <td className="px-3 py-1.5 font-mono">{r.char}</td>
                <td className="px-3 py-1.5">{r.name}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">
                  No characters match that search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted-foreground">Showing {rows.length} of 128 ASCII characters.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* JSON to YAML Converter                                              */
/* ------------------------------------------------------------------ */

const JSON_SAMPLE = `{
  "site": {
    "name": "My Site",
    "url": "https://example.com"
  },
  "features": ["blog", "tools"],
  "published": true
}`;

export function JsonToYamlConverter() {
  const [input, setInput] = useState(JSON_SAMPLE);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  function run() {
    const r = jsonToYaml(input);
    if (r.ok) {
      setOutput(r.output);
      setError("");
    } else {
      setOutput("");
      setError(r.error);
    }
  }
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-semibold">JSON</span>
        <textarea className={`${inputCls} mt-1.5 font-mono leading-6`} rows={9} value={input} onChange={(e) => setInput(e.target.value)} />
      </label>
      <div>
        <button type="button" onClick={run} className={btnPrimary}>
          Convert to YAML
        </button>
      </div>
      {error && <ErrorBox message={error} />}
      {output && <OutputBlock label="YAML" text={output} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Robots.txt Generator                                                */
/* ------------------------------------------------------------------ */

type RobotsRuleRow = { agent: string; allow: string; disallow: string };

export function RobotsTxtGenerator() {
  const [rules, setRules] = useState<RobotsRuleRow[]>([{ agent: "*", allow: "", disallow: "/admin/\n/search/" }]);
  const [sitemap, setSitemap] = useState("https://example.com/sitemap.xml");
  const output = useMemo(
    () =>
      buildRobotsTxt(
        rules.map((r) => ({
          agent: r.agent,
          allow: r.allow.split("\n").map((s) => s.trim()).filter(Boolean),
          disallow: r.disallow.split("\n").map((s) => s.trim()).filter(Boolean),
        })),
        sitemap,
      ),
    [rules, sitemap],
  );
  function updateRule(i: number, patch: Partial<RobotsRuleRow>) {
    setRules(rules.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  return (
    <div className="space-y-4">
      {rules.map((rule, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-border p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold">Crawler group {i + 1}</span>
            {rules.length > 1 && (
              <button type="button" className={btnOutline} onClick={() => setRules(rules.filter((_, idx) => idx !== i))}>
                Remove
              </button>
            )}
          </div>
          <label className="block">
            <span className="text-sm font-semibold">User-agent (* for all crawlers)</span>
            <input className={`${inputCls} mt-1.5`} value={rule.agent} onChange={(e) => updateRule(i, { agent: e.target.value })} />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold">Disallow paths (one per line)</span>
              <textarea className={`${inputCls} mt-1.5 font-mono`} rows={3} value={rule.disallow} onChange={(e) => updateRule(i, { disallow: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Allow paths (one per line)</span>
              <textarea className={`${inputCls} mt-1.5 font-mono`} rows={3} value={rule.allow} onChange={(e) => updateRule(i, { allow: e.target.value })} />
            </label>
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={btnOutline}
          onClick={() => setRules([...rules, { agent: "", allow: "", disallow: "" }])}
        >
          Add crawler group
        </button>
      </div>
      <label className="block">
        <span className="text-sm font-semibold">Sitemap URL (optional)</span>
        <input className={`${inputCls} mt-1.5`} value={sitemap} onChange={(e) => setSitemap(e.target.value)} placeholder="https://example.com/sitemap.xml" />
      </label>
      <OutputBlock label="robots.txt" text={output} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* XML Sitemap Generator                                               */
/* ------------------------------------------------------------------ */

export function XmlSitemapGenerator() {
  const [urls, setUrls] = useState("https://example.com/\nhttps://example.com/about\nhttps://example.com/blog");
  const [lastmod, setLastmod] = useState("");
  const [changefreq, setChangefreq] = useState("");
  const [priority, setPriority] = useState("");
  const result = useMemo(() => {
    const list = urls.split("\n").map((u) => ({ loc: u, lastmod, changefreq, priority }));
    return buildSitemapXml(list);
  }, [urls, lastmod, changefreq, priority]);
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-semibold">Page URLs (one per line)</span>
        <textarea className={`${inputCls} mt-1.5 font-mono leading-6`} rows={7} value={urls} onChange={(e) => setUrls(e.target.value)} />
      </label>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="block">
          <span className="text-sm font-semibold">Last modified (optional)</span>
          <input className={`${inputCls} mt-1.5`} type="date" value={lastmod} onChange={(e) => setLastmod(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Change frequency (optional)</span>
          <select className={`${inputCls} mt-1.5`} value={changefreq} onChange={(e) => setChangefreq(e.target.value)}>
            <option value="">—</option>
            {["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"].map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Priority 0.0–1.0 (optional)</span>
          <input className={`${inputCls} mt-1.5`} value={priority} onChange={(e) => setPriority(e.target.value)} placeholder="0.5" inputMode="decimal" />
        </label>
      </div>
      {result.ok ? (
        <OutputBlock label="sitemap.xml" text={result.xml} />
      ) : (
        <ErrorBox message={result.error} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Schema Markup Generator                                             */
/* ------------------------------------------------------------------ */

type SchemaType = "Article" | "FAQPage" | "Product" | "Organization";

const SCHEMA_FIELDS: Record<SchemaType, { key: string; label: string; placeholder?: string }[]> = {
  Article: [
    { key: "headline", label: "Headline *" },
    { key: "author", label: "Author" },
    { key: "datePublished", label: "Date published (YYYY-MM-DD)" },
    { key: "image", label: "Image URL" },
    { key: "description", label: "Description" },
  ],
  FAQPage: [
    { key: "q1", label: "Question 1 *" },
    { key: "a1", label: "Answer 1 *" },
    { key: "q2", label: "Question 2" },
    { key: "a2", label: "Answer 2" },
    { key: "q3", label: "Question 3" },
    { key: "a3", label: "Answer 3" },
    { key: "q4", label: "Question 4" },
    { key: "a4", label: "Answer 4" },
  ],
  Product: [
    { key: "name", label: "Product name *" },
    { key: "description", label: "Description" },
    { key: "price", label: "Price" },
    { key: "currency", label: "Currency (USD, EUR, …)" },
    { key: "rating", label: "Rating (e.g. 4.5)" },
  ],
  Organization: [
    { key: "name", label: "Organization name *" },
    { key: "url", label: "Website URL" },
    { key: "logo", label: "Logo URL" },
    { key: "description", label: "Description" },
  ],
};

export function SchemaMarkupGenerator() {
  const [type, setType] = useState<SchemaType>("Article");
  const [fields, setFields] = useState<Record<string, string>>({
    headline: "How to Brew the Perfect Coffee",
    author: "Jane Example",
    datePublished: "2026-11-21",
    description: "A step-by-step guide to brewing better coffee at home.",
  });
  const result = useMemo(() => buildSchemaJsonLd(type, fields), [type, fields]);
  const script = result.ok ? `<script type="application/ld+json">\n${result.json}\n</script>` : "";
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-semibold">Schema type</span>
        <select
          className={`${inputCls} mt-1.5`}
          value={type}
          onChange={(e) => {
            setType(e.target.value as SchemaType);
            setFields({});
          }}
        >
          {(Object.keys(SCHEMA_FIELDS) as SchemaType[]).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        {SCHEMA_FIELDS[type].map((f) => (
          <label key={f.key} className="block">
            <span className="text-sm font-semibold">{f.label}</span>
            <input
              className={`${inputCls} mt-1.5`}
              value={fields[f.key] ?? ""}
              onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })}
              placeholder={f.placeholder}
            />
          </label>
        ))}
      </div>
      {result.ok ? (
        <OutputBlock label="JSON-LD schema markup" text={script} />
      ) : (
        <ErrorBox message={result.error} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hreflang Tag Generator                                              */
/* ------------------------------------------------------------------ */

export function HreflangTagGenerator() {
  const [entries, setEntries] = useState("https://example.com/, en\nhttps://example.com/de/, de\nhttps://example.com/fr/, fr");
  const [xDefault, setXDefault] = useState("https://example.com/");
  const result = useMemo(() => {
    const parsed = entries
      .split("\n")
      .map((line) => {
        const [url, lang] = line.split(",").map((s) => s.trim());
        return { url: url ?? "", lang: lang ?? "" };
      })
      .filter((e) => e.url || e.lang);
    if (xDefault.trim()) parsed.push({ url: xDefault.trim(), lang: "x-default" });
    return buildHreflangTags(parsed);
  }, [entries, xDefault]);
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-semibold">Language versions (one per line: URL, language code)</span>
        <textarea className={`${inputCls} mt-1.5 font-mono leading-6`} rows={5} value={entries} onChange={(e) => setEntries(e.target.value)} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">x-default fallback URL (optional)</span>
        <input className={`${inputCls} mt-1.5`} value={xDefault} onChange={(e) => setXDefault(e.target.value)} placeholder="https://example.com/" />
      </label>
      {result.ok ? (
        <OutputBlock label="Hreflang tags" text={result.tags} />
      ) : (
        <ErrorBox message={result.error} />
      )}
    </div>
  );
}
