// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  blocksToMarkdown,
  countMarkdownWords,
  createBlock,
  normalizeMarkdown,
  parseMarkdownToBlocks,
  readingMinutes,
  type Block,
} from "@/lib/blocks";

describe("block round-trip (unit)", () => {
  it("round-trips every block type", () => {
    const md = [
      "# Guide title",
      "",
      "Intro paragraph with **bold**, *italic*, `code` and a [link](/bmi-calculator).",
      "",
      "## Section heading",
      "",
      "- one",
      "- two with a [link](https://example.com)",
      "",
      "1. first step",
      "2. second step",
      "",
      "> A quoted line.",
      "> Second quoted line.",
      "",
      "![A chart](https://example.com/chart.png \"Monthly chart\")",
      "",
      "```js",
      "const x = 1 < 2;",
      "```",
      "",
      "---",
      "",
      "### FAQ heading",
      "",
      "Final paragraph.",
    ].join("\n");
    expect(normalizeMarkdown(blocksToMarkdown(parseMarkdownToBlocks(md)))).toBe(
      normalizeMarkdown(md),
    );
  });

  it("parses headings, lists and quotes into typed blocks", () => {
    const blocks = parseMarkdownToBlocks("## Hello\n\n- a\n- b\n\n> quote\n\n---");
    expect(blocks.map((b) => b.type)).toEqual(["heading", "list", "quote", "divider"]);
    const heading = blocks[0] as Extract<Block, { type: "heading" }>;
    expect(heading.level).toBe(2);
    expect(heading.text).toBe("Hello");
    const list = blocks[1] as Extract<Block, { type: "list" }>;
    expect(list.ordered).toBe(false);
    expect(list.items).toEqual(["a", "b"]);
  });

  it("parses images with and without captions", () => {
    const blocks = parseMarkdownToBlocks(
      '![Alt text](https://example.com/a.png "Caption here")\n\n![No caption](https://example.com/b.png)',
    );
    expect(blocks).toHaveLength(2);
    const first = blocks[0] as Extract<Block, { type: "image" }>;
    expect(first.src).toBe("https://example.com/a.png");
    expect(first.alt).toBe("Alt text");
    expect(first.caption).toBe("Caption here");
    const second = blocks[1] as Extract<Block, { type: "image" }>;
    expect(second.caption).toBe("");
  });

  it("drops an image block with no URL instead of emitting broken markdown", () => {
    const blocks: Block[] = [
      { id: "1", type: "paragraph", text: "Keep me." },
      { id: "2", type: "image", src: "", alt: "x", caption: "" },
    ];
    expect(blocksToMarkdown(blocks)).toBe("Keep me.");
  });

  it("keeps fenced code content byte-identical (including < and indented lines)", () => {
    const md = '```json\n{\n  "name": "CalcHub",\n  "free": true\n}\n```';
    const blocks = parseMarkdownToBlocks(md);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.type).toBe("code");
    expect(blocksToMarkdown(blocks)).toBe(md);
  });

  it("creates one block of each type with unique ids", () => {
    const types = ["paragraph", "heading", "list", "quote", "image", "code", "divider"] as const;
    const ids = types.map((t) => createBlock(t).id);
    expect(new Set(ids).size).toBe(types.length);
  });

  it("counts words without counting URLs or formatting marks", () => {
    expect(countMarkdownWords("Hello **world** — see [the guide](/blog/x-guide).")).toBe(6);
    expect(countMarkdownWords("![Alt text](https://example.com/a.png)")).toBe(2);
    expect(readingMinutes("word ".repeat(400))).toBe(2);
  });
});

describe("block round-trip (all published content)", () => {
  const dir = join(process.cwd(), "content", "blog");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort();

  it(`parses and re-serializes all ${files.length} posts without content loss`, () => {
    expect(files.length).toBeGreaterThanOrEqual(215);
    const failures: string[] = [];
    for (const file of files) {
      const post = JSON.parse(readFileSync(join(dir, file), "utf8")) as { content: string };
      const roundTripped = blocksToMarkdown(parseMarkdownToBlocks(post.content));
      if (normalizeMarkdown(roundTripped) !== normalizeMarkdown(post.content)) {
        failures.push(file);
      }
    }
    expect(failures).toEqual([]);
  });

  it("every post parses into at least one block", () => {
    for (const file of files) {
      const post = JSON.parse(readFileSync(join(dir, file), "utf8")) as { content: string };
      expect(parseMarkdownToBlocks(post.content).length).toBeGreaterThan(0);
    }
  });
});
