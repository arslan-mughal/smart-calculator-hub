import { describe, expect, it } from "vitest";
import { escapeHtml, renderMarkdown } from "@/lib/markdown";

describe("renderMarkdown safety", () => {
  it("escapes HTML injection so no tag survives", () => {
    const html = renderMarkdown('<script>alert("x")</script>\n\n<img src=x onerror=alert(1)>');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;img");
  });

  it("does not render javascript: links as links", () => {
    const html = renderMarkdown("[click me](javascript:alert(1))");
    expect(html).not.toContain("<a ");
    expect(html).not.toContain('href="javascript:');
    // The text itself survives as inert text — that is safe.
    expect(html).toContain("click me");
  });

  it("renders http/https links with rel=noopener", () => {
    const html = renderMarkdown("[CalcHub](https://example.com/page)");
    expect(html).toContain('<a href="https://example.com/page" target="_blank" rel="noopener noreferrer">CalcHub</a>');
  });

  it("renders internal links same-tab without target=_blank", () => {
    const html = renderMarkdown("Use the [BMI Calculator](/bmi-calculator) now.");
    expect(html).toContain('<a href="/bmi-calculator">BMI Calculator</a>');
    expect(html).not.toContain('target="_blank"');
  });

  it("renders internal links with query strings", () => {
    const html = renderMarkdown("[Browse all Health tools](/tools?category=Health%20%26%20Fitness)");
    expect(html).toContain('<a href="/tools?category=Health%20%26%20Fitness">Browse all Health tools</a>');
  });

  it("renders guide links to other blog posts", () => {
    const html = renderMarkdown("See the [Calorie guide](/blog/calorie-calculator-guide).");
    expect(html).toContain('<a href="/blog/calorie-calculator-guide">Calorie guide</a>');
  });

  it("does not render protocol-relative links as links", () => {
    const html = renderMarkdown("[click me](//evil.example.com/x)");
    expect(html).not.toContain("<a ");
    expect(html).toContain("click me");
  });

  it("renders headings, bold, italic and inline code", () => {
    const html = renderMarkdown("# Title\n\n## Sub\n\nSome **bold** and *italic* and `code` text.");
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<h2>Sub</h2>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
    expect(html).toContain("<code>code</code>");
  });

  it("renders unordered and ordered lists", () => {
    const html = renderMarkdown("- one\n- two\n\n1. first\n2. second");
    expect(html).toContain("<ul><li>one</li><li>two</li></ul>");
    expect(html).toContain("<ol><li>first</li><li>second</li></ol>");
  });

  it("renders fenced code blocks with escaped content", () => {
    const html = renderMarkdown("```\nconst x = a < b && c > d;\n```");
    expect(html).toContain("<pre><code>const x = a &lt; b &amp;&amp; c &gt; d;</code></pre>");
  });

  it("does not parse markdown inside code spans", () => {
    const html = renderMarkdown("Use `**not bold**` here.");
    expect(html).toContain("<code>**not bold**</code>");
    expect(html).not.toContain("<strong>not bold</strong>");
  });

  it("renders paragraphs and horizontal rules", () => {
    const html = renderMarkdown("First para.\n\n---\n\nSecond para.");
    expect(html).toContain("<p>First para.</p>");
    expect(html).toContain("<hr>");
    expect(html).toContain("<p>Second para.</p>");
  });

  it("returns empty string for empty input", () => {
    expect(renderMarkdown("   ")).toBe("");
  });

  it("renders a lone image as a lazy figure", () => {
    const html = renderMarkdown("![A chart](https://example.com/chart.png)");
    expect(html).toContain('<figure><img src="https://example.com/chart.png" alt="A chart" loading="lazy"></figure>');
  });

  it("renders an image caption from the Markdown title", () => {
    const html = renderMarkdown('![A chart](https://example.com/chart.png "Monthly chart")');
    expect(html).toContain("<figcaption>Monthly chart</figcaption>");
  });

  it("renders inline images inside paragraphs", () => {
    const html = renderMarkdown("See ![alt](https://example.com/a.png) here.");
    expect(html).toContain('<p>See <img src="https://example.com/a.png" alt="alt" loading="lazy"> here.</p>');
  });

  it("does not render non-http(s) image URLs as images", () => {
    const html = renderMarkdown("![x](javascript:alert(1))");
    expect(html).not.toContain("<img");
    expect(html).toContain("javascript:alert(1)");
    const data = renderMarkdown("![x](data:image/png;base64,AAA)");
    expect(data).not.toContain("<img");
  });

  it("escapes alt text and image URLs so attributes cannot break out", () => {
    const html = renderMarkdown('![a"b](https://example.com/a.png?x=1&y=2)');
    expect(html).not.toContain('a"b');
    expect(html).toContain('alt="a&quot;b"');
    expect(html).toContain("x=1&amp;y=2");
  });

  it("renders blockquotes", () => {
    const html = renderMarkdown("> First line.\n> Second line.");
    expect(html).toContain("<blockquote><p>First line. Second line.</p></blockquote>");
  });
});

describe("escapeHtml", () => {
  it("escapes all five characters", () => {
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
  });
});
