import { describe, expect, it } from "vitest";
import { convertUnit, evaluate } from "@/lib/scientific";

describe("scientific calculator", () => {
  it("evaluates trig in degrees and radians", () => {
    expect(evaluate("sin(30)", "deg")).toBeCloseTo(0.5);
    expect(evaluate("cos(pi)", "rad")).toBeCloseTo(-1);
    expect(evaluate("asin(1)", "deg")).toBeCloseTo(90);
  });
  it("evaluates logs, powers, precedence, factorial", () => {
    expect(evaluate("log(1000)")).toBeCloseTo(3);
    expect(evaluate("ln(e^2)")).toBeCloseTo(2);
    expect(evaluate("2+3*4^2")).toBe(50);
    expect(evaluate("-2^2")).toBe(-4);
    expect(evaluate("5!")).toBe(120);
    expect(evaluate("2pi")).toBeCloseTo(6.2832, 3);
  });
  it("rejects bad input", () => {
    expect(() => evaluate("1/0")).toThrow();
    expect(() => evaluate("alert(1)")).toThrow();
  });
  it("converts units", () => {
    expect(convertUnit("length", 1, "mi", "km")).toBeCloseTo(1.609344);
    expect(convertUnit("temperature", 100, "°C", "°F")).toBeCloseTo(212);
    expect(convertUnit("angle", 180, "deg", "rad")).toBeCloseTo(Math.PI);
  });
});
