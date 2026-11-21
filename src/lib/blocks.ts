// Block model for the Gutenberg-style post editor.
// Content is ALWAYS stored as Markdown (Postgres + content/*.json). This
// module is the single bridge: parse Markdown into blocks on load,
// serialize blocks back to Markdown on save. It is pure (no fs, no DOM),
// so the round-trip is unit-testable against every existing post.
export type Block =
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "heading"; level: 1 | 2 | 3; text: string }
  | { id: string; type: "list"; ordered: boolean; items: string[] }
  | { id: string; type: "quote"; text: string }
  | { id: string; type: "image"; src: string; alt: string; caption: string }
  | { id: string; type: "code"; text: string; language: string }
  | { id: string; type: "divider" };

export type BlockType = Block["type"];

let idCounter = 0;
export function newBlockId(): string {
  try {
    const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
    if (c?.randomUUID) return `b-${c.randomUUID()}`;
  } catch {
    // fall through to the counter
  }
  idCounter += 1;
  return `b-${Date.now().toString(36)}-${idCounter}`;
}

export function createBlock(type: BlockType): Block {
  switch (type) {
    case "paragraph":
      return { id: newBlockId(), type: "paragraph", text: "" };
    case "heading":
      return { id: newBlockId(), type: "heading", level: 2, text: "" };
    case "list":
      return { id: newBlockId(), type: "list", ordered: false, items: [""] };
    case "quote":
      return { id: newBlockId(), type: "quote", text: "" };
    case "image":
      return { id: newBlockId(), type: "image", src: "", alt: "", caption: "" };
    case "code":
      return { id: newBlockId(), type: "code", text: "", language: "" };
    case "divider":
      return { id: newBlockId(), type: "divider" };
  }
}

const IMAGE_LINE = /^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)(?:\s+"([^"]*)")?\)\s*$/;
const HEADING_LINE = /^(#{1,3})\s+(.+)$/;
const HR_LINE = /^(---|\*\*\*|___)\s*$/;
const UL_LINE = /^[-*]\s+(.+)$/;
const OL_LINE = /^\d+[.)]\s+(.+)$/;
const QUOTE_LINE = /^>\s?(.*)$/;
const FENCE_LINE = /^```([a-zA-Z0-9_-]*)?\s*$/;

/** Parse Markdown into blocks. Inline formatting (**bold**, *italic*,
 * `code`, [links](…)) stays as raw Markdown text inside the block. */
export function parseMarkdownToBlocks(input: string): Block[] {
  const text = input.replace(/\r\n?/g, "\n");
  const lines = text.split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];

  const flushPara = () => {
    if (para.length > 0) {
      blocks.push({ id: newBlockId(), type: "paragraph", text: para.join(" ") });
      para = [];
    }
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();

    // Fenced code block (may contain blank lines and indented lines).
    const fence = line.match(FENCE_LINE);
    if (fence) {
      flushPara();
      const language = fence[1] ?? "";
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !(lines[i] ?? "").startsWith("```")) {
        code.push(lines[i] ?? "");
        i += 1;
      }
      i += 1; // skip the closing fence
      blocks.push({ id: newBlockId(), type: "code", text: code.join("\n"), language });
      continue;
    }

    if (trimmed === "") {
      flushPara();
      i += 1;
      continue;
    }

    const heading = trimmed.match(HEADING_LINE);
    if (heading) {
      flushPara();
      blocks.push({
        id: newBlockId(),
        type: "heading",
        level: heading[1]!.length as 1 | 2 | 3,
        text: heading[2]!.trim(),
      });
      i += 1;
      continue;
    }

    if (HR_LINE.test(trimmed)) {
      flushPara();
      blocks.push({ id: newBlockId(), type: "divider" });
      i += 1;
      continue;
    }

    const image = trimmed.match(IMAGE_LINE);
    if (image) {
      flushPara();
      blocks.push({
        id: newBlockId(),
        type: "image",
        src: image[2] ?? "",
        alt: image[1] ?? "",
        caption: image[3] ?? "",
      });
      i += 1;
      continue;
    }

    const quote = trimmed.match(QUOTE_LINE);
    if (quote) {
      flushPara();
      const quoteLines: string[] = [];
      while (i < lines.length) {
        const q = (lines[i] ?? "").trim().match(QUOTE_LINE);
        if (!q) break;
        quoteLines.push(q[1] ?? "");
        i += 1;
      }
      blocks.push({ id: newBlockId(), type: "quote", text: quoteLines.join("\n") });
      continue;
    }

    const ul = trimmed.match(UL_LINE);
    const ol = trimmed.match(OL_LINE);
    if (ul || ol) {
      flushPara();
      const ordered = Boolean(ol);
      const items: string[] = [];
      while (i < lines.length) {
        const t = (lines[i] ?? "").trim();
        const m = ordered ? t.match(OL_LINE) : t.match(UL_LINE);
        if (!m) break;
        items.push(m[1] ?? "");
        i += 1;
      }
      blocks.push({ id: newBlockId(), type: "list", ordered, items });
      continue;
    }

    para.push(trimmed);
    i += 1;
  }
  flushPara();
  return blocks;
}

/** Serialize blocks back to Markdown. Inverse of parseMarkdownToBlocks
 * (modulo whitespace normalisation — see the round-trip test). */
export function blocksToMarkdown(blocks: Block[]): string {
  return blocks
    .map((block): string => {
      switch (block.type) {
        case "paragraph":
          return block.text;
        case "heading":
          return `${"#".repeat(block.level)} ${block.text}`;
        case "list":
          return block.items
            .map((item, index) => (block.ordered ? `${index + 1}. ${item}` : `- ${item}`))
            .join("\n");
        case "quote":
          return block.text
            .split("\n")
            .map((line) => `> ${line}`)
            .join("\n");
        case "image":
          // An image without a URL has nothing to store — drop it rather
          // than serializing `![]()`, which would parse back as a paragraph.
          if (!block.src.trim()) return "";
          return block.caption
            ? `![${block.alt}](${block.src} "${block.caption.replace(/"/g, "")}")`
            : `![${block.alt}](${block.src})`;
        case "code":
          return `\`\`\`${block.language}\n${block.text}\n\`\`\``;
        case "divider":
          return "---";
      }
    })
    .filter((part) => part.trim() !== "" || false)
    .join("\n\n");
}

/** Normalise Markdown for round-trip comparison: trailing whitespace,
 * runs of blank lines, equivalent markers (- vs *, 1) vs 1., --- vs ***),
 * and soft line breaks inside a paragraph (the renderer joins paragraph
 * lines with a space, so a wrapped line and a joined line are the same
 * content). Structural lines (headings, list items, fences, quotes,
 * images, rules) are never joined. */
export function normalizeMarkdown(md: string): string {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const structural = (line: string): boolean => {
    const t = line.trim();
    return (
      t === "" ||
      /^(#{1,6}\s|[-*]\s|\d+[.)]\s|>\s?|```|---|\*\*\*|___|!\[)/.test(t)
    );
  };
  const joined: string[] = [];
  let inFence = false;
  for (const rawLine of lines) {
    const line = rawLine.replace(/[ \t]+$/, "");
    if (line.trim().startsWith("```")) inFence = !inFence;
    const prev = joined[joined.length - 1];
    if (
      !inFence &&
      prev !== undefined &&
      !structural(prev) &&
      !structural(line)
    ) {
      joined[joined.length - 1] = `${prev} ${line.trim()}`;
    } else {
      joined.push(line);
    }
  }
  return joined
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^(\s*)[*] /gm, "$1- ")
    .replace(/^(\s*\d+)\) /gm, "$1. ")
    .replace(/^(\*\*\*|___)\s*$/gm, "---")
    .trim();
}

/** Visible-text word count of Markdown: link URLs, image URLs and
 * formatting marks are not counted; link/image alt text is. */
export function countMarkdownWords(md: string): number {
  const text = md
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```[a-zA-Z0-9_-]*/g, ""))
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_#>`]/g, " ")
    .replace(/\|/g, " ");
  return text.split(/\s+/).filter(Boolean).length;
}

/** Rough reading time in minutes (200 words/minute), minimum 1. */
export function readingMinutes(md: string): number {
  return Math.max(1, Math.round(countMarkdownWords(md) / 200));
}
