// Minimal, safe Markdown renderer for blog posts.
// Safety model: the ENTIRE input is HTML-escaped FIRST, and only then are
// Markdown constructs turned into tags. Nothing unescaped ever reaches the
// DOM, so `dangerouslySetInnerHTML` with this output is safe by construction:
// `<script>`, `<img onerror=…>`, `javascript:` links and raw HTML all render
// as inert text. Supported: #/##/### headings, **bold**, *italic*, `code`,
// ``` fenced blocks ```, [text](https://…) links (http/https only, opened
// in a new tab) and [text](/internal-path) links (same-site, same tab —
// the second character must not be `/`, so protocol-relative `//host`
// links stay plain text), unordered (-/*) and ordered (1.) lists,
// paragraphs, --- rules, > blockquotes, and ![alt](https://…) images
// (http/https only, lazy-loaded; a lone image renders as a <figure>,
// with a <figcaption> when the Markdown carries a "title").
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const PLACEHOLDER = (kind: string, index: number) => `\u0001${kind}${index}\u0001`;

function renderInline(escaped: string): string {
  // Images first: ![alt](https://…) — http/https only, anything else stays
  // plain text. An optional "title" becomes the caption (used by the block
  // renderer); inline images drop the title. The input is already escaped,
  // so alt text and URLs cannot break out of the attributes.
  let out = escaped.replace(
    /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)(?:\s+&quot;([^"]*?)&quot;)?\)/g,
    (_m, alt: string, url: string) =>
      `<img src="${url}" alt="${alt}" loading="lazy">`,
  );
  // Internal links first: /path... (single leading slash — never //host,
  // so protocol-relative URLs stay plain text). Same-site, same tab.
  // The input is already escaped, so " < > cannot break out of the href
  // and javascript: cannot start with /.
  out = out.replace(
    /\[([^\]]+)\]\((\/[^/\s)][^\s)]*)\)/g,
    (_m, text: string, url: string) => `<a href="${url}">${text}</a>`,
  );
  // External links (http/https only — anything else stays plain text).
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_m, text: string, url: string) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`,
  );
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return out;
}

export function renderMarkdown(input: string): string {
  const text = input.replace(/\r\n?/g, "\n").trim();
  if (!text) return "";

  // 1. Escape everything.
  let escaped = escapeHtml(text);

  // 2. Pull out fenced code blocks (their content stays escaped, wrapped later).
  const fenced: string[] = [];
  escaped = escaped.replace(/```([a-zA-Z0-9_-]*)?\n([\s\S]*?)```/g, (_m, _lang, code: string) => {
    fenced.push(code.replace(/\n+$/, ""));
    return PLACEHOLDER("F", fenced.length - 1);
  });

  // 3. Pull out inline code spans so * and [ inside them are not parsed.
  const inline: string[] = [];
  escaped = escaped.replace(/`([^`\n]+)`/g, (_m, code: string) => {
    inline.push(code);
    return PLACEHOLDER("C", inline.length - 1);
  });

  const restorePlaceholders = (html: string): string =>
    html
      .replace(/\u0001F(\d+)\u0001/g, (_m, i: string) => `<pre><code>${fenced[Number(i)] ?? ""}</code></pre>`)
      .replace(/\u0001C(\d+)\u0001/g, (_m, i: string) => `<code>${inline[Number(i)] ?? ""}</code>`);

  // 4. Block structure.
  const blocks = escaped.split(/\n{2,}/);
  const html: string[] = [];

  for (const rawBlock of blocks) {
    const block = rawBlock.trim();
    if (!block) continue;
    // A block that is only a fenced-code placeholder.
    if (/^\u0001F\d+\u0001$/.test(block)) {
      html.push(restorePlaceholders(block));
      continue;
    }
    if (/^(---|\*\*\*|___)\s*$/.test(block)) {
      html.push("<hr>");
      continue;
    }
    const heading = block.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1]!.length;
      html.push(`<h${level}>${renderInline(heading[2]!)}</h${level}>`);
      continue;
    }
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    // A block that is a single image on its own line renders as a figure
    // (with a caption when the Markdown carries a title).
    const imgOnly = block.match(
      /^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)(?:\s+&quot;([^"]*?)&quot;)?\)$/,
    );
    if (imgOnly) {
      const caption = imgOnly[3] ?? "";
      html.push(
        caption
          ? `<figure><img src="${imgOnly[2]}" alt="${imgOnly[1]}" loading="lazy"><figcaption>${caption}</figcaption></figure>`
          : `<figure><img src="${imgOnly[2]}" alt="${imgOnly[1]}" loading="lazy"></figure>`,
      );
      continue;
    }
    // Blockquote: consecutive lines starting with "> " (escaped as &gt;).
    if (lines.length > 0 && lines.every((l) => l.startsWith("&gt;"))) {
      const inner = lines.map((l) => l.replace(/^&gt;\s?/, "")).join(" ");
      html.push(`<blockquote><p>${renderInline(inner)}</p></blockquote>`);
      continue;
    }
    const isUnordered = lines.length > 0 && lines.every((l) => /^[-*]\s+/.test(l));
    const isOrdered = lines.length > 0 && lines.every((l) => /^\d+[.)]\s+/.test(l));
    if (isUnordered || isOrdered) {
      const tag = isUnordered ? "ul" : "ol";
      const items = lines
        .map((l) =>
          isUnordered
            ? `<li>${renderInline(l.replace(/^[-*]\s+/, ""))}</li>`
            : `<li>${renderInline(l.replace(/^\d+[.)]\s+/, ""))}</li>`,
        )
        .join("");
      html.push(`<${tag}>${items}</${tag}>`);
      continue;
    }
    html.push(`<p>${renderInline(lines.join(" "))}</p>`);
  }

  return restorePlaceholders(html.join("\n"));
}
