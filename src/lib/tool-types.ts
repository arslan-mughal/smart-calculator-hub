export const categories = [
  "Finance",
  "Health & Fitness",
  "Pregnancy",
  "Math",
  "Education",
  "Date & Time",
  "Conversion",
  "Text Tools",
  "Random Tools",
  "Web & Developer",
  "Image & Media",
  "Sports",
] as const;

export type Category = (typeof categories)[number];

export type Input =
  | { key: string; label: string; type?: "number"; def: string; suffix?: string }
  | { key: string; label: string; type: "date"; def: string }
  | { key: string; label: string; type: "text" | "textarea"; def: string; hint?: string }
  | {
      key: string;
      label: string;
      type: "select";
      def: string;
      options: { v: string; l: string }[];
    };

export type Out = { label: string; value: string };

export type Calc = {
  slug: string;
  name: string;
  category: Category;
  short: string;
  keywords: string;
  inputs: Input[];
  // The registry intentionally accepts string values keyed by each tool's inputs.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  compute: (v: any) => Out[];
  about: string;
  formula: string;
  example: string;
  tips: string[];
  faqs: { q: string; a: string }[];
  custom?: "image-resizer" | "qr-code";
  popular?: boolean;
};
