import { describe, expect, it } from "vitest";
import { scoreSeo } from "@/lib/seo-score";

const good = {
  title: "BMI Calculator: How to Calculate Body Mass Index in 2026",
  slug: "bmi-calculator",
  excerpt:
    "Calculate your body mass index in seconds with the free BMI calculator — formula, healthy ranges and worked examples included.",
  content: [
    "The BMI calculator helps you work out your body mass index quickly. Enter your weight and height and the tool returns your BMI and healthy range.",
    "",
    "## How the BMI calculator works",
    "",
    "Body mass index compares weight to height. It is a screening tool, not a diagnosis, and it works best alongside other measures such as waist size.",
    "",
    "Try the [BMI Calculator](/bmi-calculator) and compare it with the [Body Fat Calculator](/body-fat-calculator).",
    "",
    "![BMI chart](https://example.com/bmi-chart.png \"BMI ranges chart\")",
  ].join("\n"),
  focusKeyword: "bmi calculator",
};

describe("scoreSeo", () => {
  it("scores a strong post highly and passes every check except word count", () => {
    // The sample is ~80 words, so word-count is the one expected fail;
    // everything else (title, excerpt, keyword placement, links, image)
    // must pass. 10 of 11 checks pass → score 91.
    const result = scoreSeo(good);
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.checks.filter((c) => c.status !== "pass").map((c) => c.id)).toEqual(["word-count"]);
    expect(result.words).toBeGreaterThan(50);
    expect(result.internalLinks).toBe(2);
    expect(result.images).toBe(1);
    expect(result.imagesWithoutAlt).toBe(0);
  });

  it("fails an empty post and reports zero words", () => {
    const result = scoreSeo({ title: "", slug: "", excerpt: "", content: "", focusKeyword: "" });
    expect(result.score).toBeLessThan(30);
    expect(result.words).toBe(0);
    expect(result.checks.find((c) => c.id === "word-count")?.status).toBe("fail");
    expect(result.checks.find((c) => c.id === "title-length")?.status).toBe("fail");
  });

  it("warns on missing focus keyword instead of failing keyword checks", () => {
    const result = scoreSeo({ ...good, focusKeyword: "" });
    expect(result.checks.filter((c) => c.id.startsWith("keyword-"))).toHaveLength(0);
    expect(result.checks.find((c) => c.id === "focus-keyword")?.status).toBe("warn");
  });

  it("fails keyword-in-title when the keyword is absent from the title", () => {
    const result = scoreSeo({ ...good, title: "A Completely Different Title About Health" });
    expect(result.checks.find((c) => c.id === "keyword-title")?.status).toBe("fail");
  });

  it("fails the image check when an image has no alt text", () => {
    const result = scoreSeo({
      ...good,
      content: good.content.replace('![BMI chart]', '![]'),
    });
    expect(result.imagesWithoutAlt).toBe(1);
    expect(result.checks.find((c) => c.id === "images")?.status).toBe("fail");
  });

  it("warns when there are no images and no internal links", () => {
    const result = scoreSeo({
      ...good,
      content: "Some plain text without any links or images at all. ".repeat(20),
    });
    expect(result.checks.find((c) => c.id === "images")?.status).toBe("warn");
    expect(result.checks.find((c) => c.id === "internal-links")?.status).toBe("fail");
  });

  it("scores word-count bands: under 300 fails, 300–599 warns, 600+ passes", () => {
    const para = "Word ".repeat(100).trim();
    const at100 = scoreSeo({ ...good, content: para });
    expect(at100.checks.find((c) => c.id === "word-count")?.status).toBe("fail");
    const at400 = scoreSeo({ ...good, content: `${para}\n\n${para}\n\n${para}\n\n${para}` });
    expect(at400.checks.find((c) => c.id === "word-count")?.status).toBe("warn");
    const at700 = scoreSeo({ ...good, content: `${para}\n\n${para}\n\n${para}\n\n${para}\n\n${para}\n\n${para}\n\n${para}` });
    expect(at700.checks.find((c) => c.id === "word-count")?.status).toBe("pass");
  });

  it("flags long sentences as a readability problem", () => {
    const long = "This is a very long sentence that keeps going and going with many clauses and commas and extra words ".repeat(3).trim() + ".";
    const result = scoreSeo({ ...good, content: `${long}\n\n${long}` });
    expect(result.checks.find((c) => c.id === "readability")?.status).toBe("fail");
  });

  it("fails the excerpt check when the excerpt is far too short", () => {
    const result = scoreSeo({ ...good, excerpt: "Too short." });
    expect(result.checks.find((c) => c.id === "excerpt-length")?.status).toBe("fail");
  });
});
