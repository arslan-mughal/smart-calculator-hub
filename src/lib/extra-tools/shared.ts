import { fmt } from "../calculators";
import type { Calc, Input } from "../tool-types";

export const N = (value: unknown) => Number.parseFloat(String(value ?? ""));
export const M = (value: number, digits = 4) => fmt(value, digits);
export const lines = (value: unknown) => String(value ?? "").split(/\r?\n/);
export const words = (value: unknown) =>
  String(value ?? "")
    .trim()
    .match(/[\p{L}\p{N}'’-]+/gu) ?? [];

export type ToolSeed = Pick<Calc, "slug" | "name" | "category" | "short" | "inputs" | "compute"> &
  Partial<
    Pick<
      Calc,
      "keywords" | "about" | "formula" | "example" | "tips" | "faqs" | "custom" | "popular"
    >
  >;

export function tool(seed: ToolSeed): Calc {
  const title = seed.name.toLowerCase();
  return {
    keywords: `${title}, free ${title}, online ${title}, ${seed.category.toLowerCase()} tools`,
    about: `${seed.short} This free online ${title} gives you an instant answer without an account, a download or sending your entries to a server. It is designed for quick everyday use on desktop and mobile.`,
    formula:
      "Enter the requested values and the tool applies the calculation or transformation shown above. Results update as you type.",
    example: `Open the ${title}, adjust the example values and compare the updated results. Reset the fields whenever you want to return to the starting example.`,
    tips: [
      "Check the units and labels before comparing results.",
      "Your entries stay in your browser and are not saved.",
    ],
    faqs: [
      {
        q: `Is this ${title} free?`,
        a: "Yes. It is free to use, with no sign-up or installation required.",
      },
      {
        q: "Are my entries stored?",
        a: "No. Calculations run in your browser and the tool does not save your entries.",
      },
    ],
    ...seed,
  };
}

export const numberInput = (key: string, label: string, def: string, suffix?: string): Input => ({
  key,
  label,
  def,
  ...(suffix ? { suffix } : {}),
});
export const textInput = (key: string, label: string, def: string): Input => ({
  key,
  label,
  type: "text",
  def,
});
export const textArea = (key: string, label: string, def: string): Input => ({
  key,
  label,
  type: "textarea",
  def,
});
export const selectInput = (
  key: string,
  label: string,
  def: string,
  options: [string, string][],
): Input => ({
  key,
  label,
  type: "select",
  def,
  options: options.map(([v, l]) => ({ v, l })),
});

export function unitConverter(
  slug: string,
  name: string,
  short: string,
  units: [string, string, number][],
  defaultUnit: string,
  defaultValue = "1",
): Calc {
  return tool({
    slug,
    name,
    category: "Conversion",
    short,
    popular: slug === "weight-converter",
    inputs: [
      numberInput("x", "Value", defaultValue),
      selectInput(
        "u",
        "From unit",
        defaultUnit,
        units.map(([symbol, label]) => [symbol, `${label} (${symbol})`]),
      ),
    ],
    compute: (v) => {
      const factors = Object.fromEntries(units.map(([symbol, , factor]) => [symbol, factor]));
      const base = N(v.x) * (factors[String(v.u)] ?? 1);
      return units.map(([symbol, label, factor]) => ({
        label: `${label} (${symbol})`,
        value: `${M(base / factor, 8)} ${symbol}`,
      }));
    },
    formula:
      "Convert the input to the base unit, then divide by the target unit's base-unit factor. Every equivalent is shown at once.",
    example: `Enter ${defaultValue} in ${defaultUnit} to see its equivalent in every supported unit.`,
  });
}

export function seededRandom(seed: number) {
  let value = Math.abs(Math.floor(seed)) || 1;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}
