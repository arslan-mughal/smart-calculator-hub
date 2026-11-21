// Pure text/code formatters and converters for the batch 29 dev tools:
// JavaScript minifier/beautifier, CSS beautifier, HTML beautifier,
// HTML → Markdown, YAML format/validate, JSON → YAML, ASCII table.
// Everything is pure and unit-testable; the components only wire state.

// ------------------------------------------------------------------ //
// JavaScript tokenizer (shared by the minifier and the beautifier)
// ------------------------------------------------------------------ //

type JsTok = {
  kind: "id" | "num" | "str" | "tpl" | "re" | "punct" | "comment";
  text: string;
  /** A newline appeared just before this token in the source. */
  newlineBefore: boolean;
};

const JS_MULTI_OPS = [
  ">>>=",
  "<<=",
  ">>=",
  "**=",
  "===",
  "!==",
  ">>>",
  "&&=",
  "||=",
  "??=",
  "...",
  "=>",
  "++",
  "--",
  "+=",
  "-=",
  "*=",
  "/=",
  "%=",
  "&=",
  "|=",
  "^=",
  "==",
  "!=",
  "<=",
  ">=",
  "&&",
  "||",
  "??",
  "?.",
  "**",
  "<<",
  ">>",
];

const WORD_CHAR = /[A-Za-z0-9_$]/;
/** After these tokens an expression is expected, so `/` starts a regex. */
const REGEX_AFTER = new Set([
  "(",
  "[",
  "{",
  ",",
  ";",
  ":",
  "=",
  "==",
  "===",
  "!",
  "!=",
  "!==",
  "&&",
  "||",
  "??",
  "+",
  "-",
  "*",
  "/",
  "%",
  "**",
  "?",
  "&",
  "|",
  "^",
  "~",
  "<",
  ">",
  "<=",
  ">=",
  "<<",
  ">>",
  ">>>",
  "=>",
  "return",
  "typeof",
  "instanceof",
  "in",
  "of",
  "new",
  "delete",
  "void",
  "case",
  "do",
  "else",
  "yield",
  "await",
]);

function isWordStart(ch: string): boolean {
  return /[A-Za-z_$]/.test(ch);
}
function isWordChar(ch: string): boolean {
  return WORD_CHAR.test(ch);
}
function isDigit(ch: string): boolean {
  return /[0-9]/.test(ch);
}

/** Scan a template literal starting at `i` (src[i] === "`"). Handles ${...} nesting. */
function scanTemplate(src: string, i: number): number {
  // Returns the index just past the closing backtick.
  let j = i + 1;
  while (j < src.length) {
    const ch = src[j]!;
    if (ch === "\\") {
      j += 2;
      continue;
    }
    if (ch === "`") return j + 1;
    if (ch === "$" && src[j + 1] === "{") {
      // Skip the ${...} expression, tracking brace depth and nested templates/strings.
      j += 2;
      let depth = 1;
      while (j < src.length && depth > 0) {
        const c = src[j]!;
        if (c === "\\") {
          j += 2;
          continue;
        }
        if (c === "'" || c === '"') {
          const quote = c;
          j++;
          while (j < src.length && src[j] !== quote) j += src[j] === "\\" ? 2 : 1;
          j++;
          continue;
        }
        if (c === "`") {
          j = scanTemplate(src, j);
          continue;
        }
        if (c === "{") depth++;
        else if (c === "}") depth--;
        j++;
      }
      continue;
    }
    j++;
  }
  return j;
}

export function tokenizeJs(src: string): JsTok[] {
  const tokens: JsTok[] = [];
  let i = 0;
  let pendingNewline = false;
  let prevSignificant: JsTok | null = null;

  const push = (kind: JsTok["kind"], text: string) => {
    const tok: JsTok = { kind, text, newlineBefore: pendingNewline };
    pendingNewline = false;
    tokens.push(tok);
    if (kind !== "comment") prevSignificant = tok;
  };

  while (i < src.length) {
    const ch = src[i]!;
    if (ch === " " || ch === "\t" || ch === "\r") {
      i++;
      continue;
    }
    if (ch === "\n") {
      pendingNewline = true;
      i++;
      continue;
    }
    // Comments.
    if (ch === "/" && src[i + 1] === "/") {
      const end = src.indexOf("\n", i);
      const stop = end === -1 ? src.length : end;
      push("comment", src.slice(i, stop));
      i = stop;
      continue;
    }
    if (ch === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      const stop = end === -1 ? src.length : end + 2;
      if (src.slice(i, stop).includes("\n")) pendingNewline = true;
      push("comment", src.slice(i, stop));
      i = stop;
      continue;
    }
    // Strings.
    if (ch === "'" || ch === '"') {
      let j = i + 1;
      while (j < src.length && src[j] !== ch) j += src[j] === "\\" ? 2 : 1;
      push("str", src.slice(i, Math.min(j + 1, src.length)));
      i = Math.min(j + 1, src.length);
      continue;
    }
    // Template literals.
    if (ch === "`") {
      const end = scanTemplate(src, i);
      push("tpl", src.slice(i, end));
      i = end;
      continue;
    }
    // Regex or division.
    if (ch === "/") {
      const prev = prevSignificant ? prevSignificant.text : null;
      const regexAllowed = prev === null || REGEX_AFTER.has(prev);
      if (regexAllowed) {
        let j = i + 1;
        let inClass = false;
        while (j < src.length) {
          const c = src[j]!;
          if (c === "\\") {
            j += 2;
            continue;
          }
          if (c === "[") inClass = true;
          else if (c === "]") inClass = false;
          else if (c === "/" && !inClass) break;
          else if (c === "\n") break;
          j++;
        }
        let k = j;
        if (src[k] === "/") {
          k++;
          while (k < src.length && /[a-z]/i.test(src[k]!)) k++;
        }
        push("re", src.slice(i, k));
        i = k;
        continue;
      }
      // Division (or /=).
      if (src[i + 1] === "=") {
        push("punct", "/=");
        i += 2;
      } else {
        push("punct", "/");
        i += 1;
      }
      continue;
    }
    // Numbers.
    if (isDigit(ch) || (ch === "." && isDigit(src[i + 1] ?? ""))) {
      let j = i;
      if (src[j] === "0" && /[xXbBoO]/.test(src[j + 1] ?? "")) {
        j += 2;
        while (j < src.length && /[0-9a-fA-F_]/.test(src[j]!)) j++;
      } else {
        while (j < src.length && /[0-9_]/.test(src[j]!)) j++;
        if (src[j] === "." && /[0-9]/.test(src[j + 1] ?? "")) {
          j++;
          while (j < src.length && /[0-9_]/.test(src[j]!)) j++;
        }
        if (src[j] === "e" || src[j] === "E") {
          let k = j + 1;
          if (src[k] === "+" || src[k] === "-") k++;
          if (isDigit(src[k] ?? "")) {
            j = k;
            while (j < src.length && /[0-9_]/.test(src[j]!)) j++;
          }
        }
      }
      if (src[j] === "n") j++;
      push("num", src.slice(i, j));
      i = j;
      continue;
    }
    // Identifiers / keywords.
    if (isWordStart(ch)) {
      let j = i + 1;
      while (j < src.length && isWordChar(src[j]!)) j++;
      push("id", src.slice(i, j));
      i = j;
      continue;
    }
    // Multi-char operators, longest first.
    let matched = false;
    for (const op of JS_MULTI_OPS) {
      if (src.startsWith(op, i)) {
        push("punct", op);
        i += op.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;
    push("punct", ch);
    i++;
  }
  return tokens;
}

/** Tokens that can end a statement (ASI applies after them). */
function canEndStatement(tok: JsTok): boolean {
  if (tok.kind === "id" || tok.kind === "num" || tok.kind === "str" || tok.kind === "tpl" || tok.kind === "re")
    return true;
  return [")", "]", "}", "++", "--"].includes(tok.text);
}

/** Tokens that would continue a statement if they started a new line (ASI hazard). */
function isLineContinuationHazard(tok: JsTok): boolean {
  return ["(", "[", "`", "+", "-", "/", "++", "--"].includes(tok.text);
}

const RESTRICTED_KEYWORDS = new Set(["return", "throw", "break", "continue"]);

/** Minify JavaScript: strip comments and unneeded whitespace, keeping ASI semantics. */
export function minifyJs(src: string): { code: string; savedBytes: number; savedPercent: number } {
  const tokens = tokenizeJs(src).filter((t) => t.kind !== "comment");
  let out = "";
  let prev: JsTok | null = null;
  for (const tok of tokens) {
    if (prev) {
      let sep = "";
      if (tok.newlineBefore) {
        if (RESTRICTED_KEYWORDS.has(prev.text)) sep = ";";
        else if (canEndStatement(prev) && isLineContinuationHazard(tok)) sep = ";";
      }
      if (!sep) {
        const prevEnd = prev.text[prev.text.length - 1]!;
        const nextStart = tok.text[0]!;
        if (isWordChar(prevEnd) && isWordChar(nextStart)) sep = " ";
        else if ((prev.text === "+" || prev.text === "-") && (nextStart === "+" || nextStart === "-")) sep = " ";
        else if (prev.text === "/" && tok.kind === "re") sep = " ";
      }
      out += sep;
    }
    out += tok.text;
    prev = tok;
  }
  const savedBytes = Math.max(0, src.length - out.length);
  return { code: out, savedBytes, savedPercent: src.length ? Math.round((savedBytes / src.length) * 100) : 0 };
}

const JS_KEYWORD_BEFORE_PAREN = new Set([
  "if",
  "for",
  "while",
  "switch",
  "catch",
  "with",
  "return",
  "typeof",
  "instanceof",
  "in",
  "of",
  "new",
  "delete",
  "void",
  "yield",
  "await",
]);

/** Beautify JavaScript with a simple indentation formatter (2 spaces). */
export function beautifyJs(src: string): string {
  const tokens = tokenizeJs(src);
  const lines: string[] = [];
  let indent = 0;
  let current = "";
  let parenDepth = 0;
  let inForParens = false;
  let forParenDepth = -1;

  const flush = () => {
    const line = current.trimEnd();
    if (line) lines.push("  ".repeat(Math.max(0, indent)) + line);
    current = "";
  };

  const needSpaceBefore = (prev: JsTok | null, tok: JsTok): boolean => {
    if (!prev || !current) return false;
    const prevEnd = prev.text[prev.text.length - 1]!;
    const nextStart = tok.text[0]!;
    if (isWordChar(prevEnd) && isWordChar(nextStart)) return true;
    if (tok.text === "(" && prev.kind === "id" && JS_KEYWORD_BEFORE_PAREN.has(prev.text)) return true;
    if (tok.text === "(" && prev.kind === "id" && prev.text === "function") return false;
    if (tok.text === "(" && prev.text === ")") return false;
    if ((prev.text === "+" || prev.text === "-") && (nextStart === "+" || nextStart === "-")) return true;
    if (prev.text === "/" && tok.kind === "re") return true;
    return false;
  };

  let prev: JsTok | null = null;
  for (const tok of tokens) {
    if (tok.kind === "comment") {
      if (current.trim()) flush();
      lines.push("  ".repeat(Math.max(0, indent)) + tok.text);
      prev = tok;
      continue;
    }
    if (tok.text === "{") {
      if (
        prev &&
        (prev.text === ")" ||
          prev.text === "]" ||
          prev.kind === "id" ||
          prev.kind === "num" ||
          prev.kind === "str" ||
          prev.kind === "tpl")
      )
        current += " ";
      current += "{";
      flush();
      indent++;
      prev = tok;
      continue;
    }
    if (tok.text === "}") {
      if (current.trim()) flush();
      indent = Math.max(0, indent - 1);
      current = "}";
      prev = tok;
      continue;
    }
    if (tok.text === ";") {
      current += ";";
      if (inForParens) {
        current += " ";
      } else {
        flush();
      }
      prev = tok;
      continue;
    }
    if (tok.text === ",") {
      current += ", ";
      prev = tok;
      continue;
    }
    if (tok.text === "case" || tok.text === "default") {
      if (current.trim()) flush();
      current = tok.text;
      prev = tok;
      continue;
    }
    if (tok.text === ":") {
      current += ":";
      const lineStart = current.trimStart();
      if (lineStart.startsWith("case ") || lineStart === "default:") {
        // `case x:` / `default:` ends the line; other colons (ternary, object) stay inline.
        flush();
      } else {
        current += " ";
      }
      prev = tok;
      continue;
    }
    if (tok.text === "(") {
      if (prev && prev.text === "for") {
        inForParens = true;
        forParenDepth = parenDepth;
      }
      if (needSpaceBefore(prev, tok)) current += " ";
      current += "(";
      parenDepth++;
      prev = tok;
      continue;
    }
    if (tok.text === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      if (inForParens && parenDepth === forParenDepth) {
        inForParens = false;
        forParenDepth = -1;
      }
      current = current.trimEnd() + ")";
      prev = tok;
      continue;
    }
    if (tok.text === "else" || tok.text === "catch" || tok.text === "finally") {
      if (current.trim() === "}") {
        current += " " + tok.text;
      } else {
        if (current.trim()) flush();
        current = tok.text;
      }
      prev = tok;
      continue;
    }
    // Binary operators and friends get spaces around them.
    if (
      [
        "=",
        "==",
        "===",
        "!=",
        "!==",
        "+",
        "-",
        "*",
        "/",
        "%",
        "**",
        "+=",
        "-=",
        "*=",
        "/=",
        "%=",
        "**=",
        "&&",
        "||",
        "??",
        "&",
        "|",
        "^",
        "<<",
        ">>",
        ">>>",
        "<",
        ">",
        "<=",
        ">=",
        "=>",
        "?",
      ].includes(tok.text)
    ) {
      current = current.trimEnd() + ` ${tok.text} `;
      prev = tok;
      continue;
    }
    if (needSpaceBefore(prev, tok)) current += " ";
    current += tok.text;
    prev = tok;
  }
  if (current.trim()) flush();
  return lines.join("\n");
}

// ------------------------------------------------------------------ //
// CSS beautifier
// ------------------------------------------------------------------ //

/** Beautify CSS with 2-space indentation. Comments are kept on their own lines. */
export function beautifyCss(src: string): string {
  const lines: string[] = [];
  let indent = 0;
  let buf = "";
  let i = 0;
  let parenDepth = 0;
  const flush = (text = buf) => {
    const line = text.trim();
    if (line) lines.push("  ".repeat(Math.max(0, indent)) + line);
    buf = "";
  };
  while (i < src.length) {
    const ch = src[i]!;
    if (ch === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      const stop = end === -1 ? src.length : end + 2;
      if (buf.trim()) flush();
      lines.push("  ".repeat(Math.max(0, indent)) + src.slice(i, stop).trim());
      i = stop;
      continue;
    }
    if (ch === "(") parenDepth++;
    if (ch === ")") parenDepth = Math.max(0, parenDepth - 1);
    if (ch === "{" && parenDepth === 0) {
      buf += " {";
      flush();
      indent++;
      i++;
      continue;
    }
    if (ch === "}" && parenDepth === 0) {
      if (buf.trim()) flush();
      indent = Math.max(0, indent - 1);
      lines.push("  ".repeat(indent) + "}");
      i++;
      continue;
    }
    if (ch === ";" && parenDepth === 0) {
      buf += ";";
      flush();
      i++;
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      i++;
      continue;
    }
    buf += ch;
    i++;
  }
  if (buf.trim()) flush();
  // Normalise `prop:value` spacing inside declarations, adding a missing
  // trailing semicolon (the last declaration before `}` often has none).
  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.includes(":") && !trimmed.includes("{") && !trimmed.includes("}")) {
        const idx = trimmed.indexOf(":");
        const prop = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim().replace(/;$/, "");
        const lead = line.slice(0, line.length - line.trimStart().length);
        return `${lead}${prop}: ${value};`;
      }
      return line;
    })
    .join("\n");
}

// ------------------------------------------------------------------ //
// HTML beautifier
// ------------------------------------------------------------------ //

const HTML_VOID = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const HTML_INLINE = new Set([
  "a",
  "abbr",
  "b",
  "bdi",
  "bdo",
  "cite",
  "code",
  "data",
  "dfn",
  "em",
  "i",
  "kbd",
  "mark",
  "q",
  "s",
  "samp",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "time",
  "u",
  "var",
  "label",
]);

function tagNameOf(tag: string): string {
  const m = tag.match(/^<\/?\s*([A-Za-z][\w-]*)/);
  return m ? m[1]!.toLowerCase() : "";
}

/** Beautify HTML with 2-space indentation. Inline elements stay on the text line. */
export function beautifyHtml(src: string): string {
  const lines: string[] = [];
  let indent = 0;
  let current = "";
  let flushIndent = 0;
  // The block tag that opened the current line (if the line so far is
  // that tag plus inline content) — its close tag can finish the line.
  let openBlock: string | null = null;
  let pendingSpace = false;

  const flush = () => {
    const line = current.trim();
    if (line) lines.push("  ".repeat(Math.max(0, flushIndent)) + line);
    current = "";
    openBlock = null;
    pendingSpace = false;
  };

  const appendText = (raw: string) => {
    const leading = /^\s/.test(raw);
    const trailing = /\s$/.test(raw);
    const text = raw.replace(/\s+/g, " ").trim();
    if (!text) {
      pendingSpace = pendingSpace || trailing;
      return;
    }
    if (!current) flushIndent = indent;
    if (current && !current.endsWith(" ") && (leading || pendingSpace)) current += " ";
    current += text;
    pendingSpace = trailing;
  };

  // Split into tags and text runs.
  const parts = src.replace(/\r\n?/g, "\n").split(/(<[^>]+>)/g);
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith("<")) {
      const tag = part.trim();
      const name = tagNameOf(tag);
      const isClose = tag.startsWith("</");
      const isComment = tag.startsWith("<!--");
      const isDoctype = /^<!doctype/i.test(tag);
      const selfClosing = tag.endsWith("/>") || HTML_VOID.has(name) || isDoctype;
      if (isComment || isDoctype) {
        if (current.trim()) flush();
        lines.push("  ".repeat(Math.max(0, indent)) + tag);
        continue;
      }
      if (isClose) {
        if (HTML_INLINE.has(name)) {
          // Inline close stays on the line.
          if (pendingSpace && current && !current.endsWith(" ")) current += " ";
          current += tag;
          pendingSpace = false;
          continue;
        }
        if (openBlock === name && current.trim()) {
          current += tag;
          flush();
          indent = Math.max(0, indent - 1);
        } else {
          if (current.trim()) flush();
          indent = Math.max(0, indent - 1);
          lines.push("  ".repeat(indent) + tag);
        }
        continue;
      }
      if (HTML_INLINE.has(name) || selfClosing) {
        if (!current) flushIndent = indent;
        if (pendingSpace && current && !current.endsWith(">") && !current.endsWith(" ")) current += " ";
        current += tag;
        pendingSpace = false;
        continue;
      }
      // Block open tag: finish the current line, then start a new one.
      if (current.trim()) flush();
      flushIndent = indent;
      current = tag;
      openBlock = name;
      indent++;
      pendingSpace = false;
      continue;
    }
    appendText(part);
  }
  if (current.trim()) flush();
  return lines.join("\n");
}

// ------------------------------------------------------------------ //
// HTML → Markdown
// ------------------------------------------------------------------ //

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

/** Convert a small HTML fragment to Markdown (headings, lists, links, code, …). */
export function htmlToMarkdown(html: string): string {
  let out = html.replace(/\r\n?/g, "\n");
  // Remove script/style content entirely.
  out = out.replace(/<script[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<style[\s\S]*?<\/style>/gi, "");
  // Fenced code blocks first.
  out = out.replace(/<pre[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi, (_m, code) => {
    const clean = decodeHtmlEntities(String(code).replace(/<[^>]+>/g, "")).replace(/^\n+|\s+$/g, "");
    return `\n\`\`\`\n${clean}\n\`\`\`\n`;
  });
  out = out.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_m, code) => {
    const clean = decodeHtmlEntities(String(code).replace(/<[^>]+>/g, "")).replace(/^\n+|\s+$/g, "");
    return `\n\`\`\`\n${clean}\n\`\`\`\n`;
  });
  for (let level = 6; level >= 1; level--) {
    const re = new RegExp(`<h${level}[^>]*>([\\s\\S]*?)</h${level}>`, "gi");
    out = out.replace(re, (_m, inner) => `\n${"#".repeat(level)} ${inner.trim()}\n`);
  }
  out = out.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, inner) => {
    const text = String(inner).replace(/<[^>]+>/g, "").trim().replace(/\n/g, "\n> ");
    return `\n> ${text}\n`;
  });
  out = out.replace(/<hr[^>]*\/?>/gi, "\n---\n");
  out = out.replace(/<br[^>]*\/?>/gi, "\n");
  out = out.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, inner) => `\n- ${inner.trim()}`);
  out = out.replace(/<\/(ul|ol)>/gi, "\n");
  out = out.replace(/<(ul|ol)[^>]*>/gi, "");
  out = out.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_m, inner) => `\n${inner.trim()}\n`);
  out = out.replace(/<a[^>]*href\s*=\s*"([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, text) => {
    const label = String(text).replace(/<[^>]+>/g, "").trim();
    return href ? `[${label}](${href})` : label;
  });
  out = out.replace(/<a[^>]*href\s*=\s*'([^']*)'[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, text) => {
    const label = String(text).replace(/<[^>]+>/g, "").trim();
    return href ? `[${label}](${href})` : label;
  });
  out = out.replace(/<img[^>]*alt\s*=\s*"([^"]*)"[^>]*src\s*=\s*"([^"]*)"[^>]*>/gi, (_m, alt, src) => `![${alt}](${src})`);
  out = out.replace(/<img[^>]*src\s*=\s*"([^"]*)"[^>]*alt\s*=\s*"([^"]*)"[^>]*>/gi, (_m, src, alt) => `![${alt}](${src})`);
  out = out.replace(/<img[^>]*src\s*=\s*"([^"]*)"[^>]*>/gi, (_m, src) => `![](${src})`);
  out = out.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/(strong|b)>/gi, (_m, _t, inner) => `**${inner}**`);
  out = out.replace(/<(em|i)[^>]*>([\s\S]*?)<\/(em|i)>/gi, (_m, _t, inner) => `*${inner}*`);
  out = out.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_m, inner) => `\`${inner}\``);
  out = out.replace(/<[^>]+>/g, "");
  out = decodeHtmlEntities(out);
  // Numbered lists: restore 1. 2. 3. for ordered lists (approximation — items stay as -).
  out = out
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").replace(/ +$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return out;
}

// ------------------------------------------------------------------ //
// YAML format / validate / JSON → YAML (js-yaml)
// ------------------------------------------------------------------ //

import yaml from "js-yaml";

export type YamlResult = { ok: true; output: string } | { ok: false; error: string };

/** Parse YAML and re-emit it formatted (2-space indent). Invalid YAML returns the error. */
export function formatYaml(input: string): YamlResult {
  let parsed: unknown;
  try {
    parsed = yaml.load(input);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid YAML." };
  }
  if (parsed === undefined) return { ok: true, output: "" };
  try {
    return { ok: true, output: yaml.dump(parsed, { indent: 2, lineWidth: -1, noRefs: true }) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not format YAML." };
  }
}

/** Convert a JSON string to YAML. */
export function jsonToYaml(input: string): YamlResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid JSON." };
  }
  try {
    return { ok: true, output: yaml.dump(parsed, { indent: 2, lineWidth: -1, noRefs: true }) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not convert JSON to YAML." };
  }
}

// ------------------------------------------------------------------ //
// ASCII table (0–127)
// ------------------------------------------------------------------ //

const CONTROL_NAMES: Record<number, string> = {
  0: "NUL",
  1: "SOH",
  2: "STX",
  3: "ETX",
  4: "EOT",
  5: "ENQ",
  6: "ACK",
  7: "BEL",
  8: "BS",
  9: "TAB",
  10: "LF",
  11: "VT",
  12: "FF",
  13: "CR",
  14: "SO",
  15: "SI",
  16: "DLE",
  17: "DC1",
  18: "DC2",
  19: "DC3",
  20: "DC4",
  21: "NAK",
  22: "SYN",
  23: "ETB",
  24: "CAN",
  25: "EM",
  26: "SUB",
  27: "ESC",
  28: "FS",
  29: "GS",
  30: "RS",
  31: "US",
  32: "Space",
  127: "DEL",
};

export type AsciiRow = { dec: number; hex: string; char: string; name: string };

export const ASCII_TABLE: AsciiRow[] = Array.from({ length: 128 }, (_, dec) => {
  const name = CONTROL_NAMES[dec];
  if (name) return { dec, hex: dec.toString(16).toUpperCase().padStart(2, "0"), char: name, name };
  const char = String.fromCharCode(dec);
  return { dec, hex: dec.toString(16).toUpperCase().padStart(2, "0"), char, name: char };
});
