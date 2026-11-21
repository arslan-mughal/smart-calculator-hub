import { describe, expect, it } from "vitest";
import { bySlug } from "@/lib/registry";
import { hasNestedQuantifier } from "@/lib/extra-tools/text-random-developer";

// The classic catastrophic-backtracking shape: a quantifier applied to a
// group whose body itself contains a quantifier or an alternation.
const REJECT = [
  "(a+)+",
  "(a*)*",
  "(a?)?",
  "(a|b)+",
  "(.*)*",
  "(a{2})+",
  "(\\d+)+",
  "((a+))+",
  "(a+){2,3}",
  "(foo|bar)+",
  "(?:a|b)+",
  "(\\w+\\s?)+",
  "(a+)+$",
];

const ALLOW = [
  "(ab)+",
  "(abc)?",
  "\\d+",
  "(?:ab)+",
  "[a-z]+",
  "\\b\\w+@\\w+\\.\\w+\\b",
  "(a|b)",
  "([a+])+",
  "a+",
  "([a-z]+)",
  "(?:abc){2}",
  "hello (world)?",
];

describe("hasNestedQuantifier", () => {
  it.each(REJECT)("%s is rejected", (pattern) => {
    expect(hasNestedQuantifier(pattern)).toBe(true);
  });

  it.each(ALLOW)("%s is allowed", (pattern) => {
    expect(hasNestedQuantifier(pattern)).toBe(false);
  });
});

describe("Regex Tester compute guard", () => {
  const compute = (pattern: string) =>
    bySlug["regex-tester"]!.compute({ pattern, flags: "g", text: "aaaaaaaaaa" });

  it.each(REJECT)("%s returns Invalid expression", (pattern) => {
    expect(compute(pattern).some((o) => o.label === "Invalid expression")).toBe(true);
  });

  it.each(ALLOW)("%s returns matches (not Invalid expression)", (pattern) => {
    expect(compute(pattern).some((o) => o.label === "Invalid expression")).toBe(false);
  });

  it("still enforces the other caps", () => {
    expect(
      bySlug["regex-tester"]!.compute({ pattern: "a".repeat(201), flags: "g", text: "x" })
        .some((o) => o.label === "Invalid expression"),
    ).toBe(true);
    expect(
      bySlug["regex-tester"]!.compute({ pattern: "a", flags: "g", text: "x".repeat(10001) })
        .some((o) => o.label === "Invalid expression"),
    ).toBe(true);
    expect(
      bySlug["regex-tester"]!.compute({ pattern: "a", flags: "z", text: "x" })
        .some((o) => o.label === "Invalid expression"),
    ).toBe(true);
  });
});
