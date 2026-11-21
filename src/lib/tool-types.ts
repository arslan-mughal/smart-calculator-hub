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
  "SEO Audit",
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
  howToUse?: string[];
  details?: { heading: string; body: string }[];
  tips: string[];
  faqs: { q: string; a: string }[];
  custom?:
    | "image-resizer"
    | "qr-code"
    | "scientific"
    | "invoice-generator"
    | "currency-converter"
    | "sha256-hash-generator"
    | "diff-checker"
    | "image-to-base64-converter"
    | "sha1-hash-generator"
    | "sha512-hash-generator"
    | "meta-tag-generator"
    | "website-seo-audit"
    | "broken-link-checker"
    | "keyword-density-checker"
    | "heading-checker"
    | "robots-txt-checker"
    | "sitemap-checker"
    | "open-graph-checker"
    | "meta-tag-analyzer"
    | "javascript-minifier-beautifier"
    | "css-beautifier"
    | "html-beautifier"
    | "yaml-formatter-validator"
    | "markdown-editor"
    | "html-to-markdown-converter"
    | "css-box-shadow-generator"
    | "ascii-table-reference"
    | "json-to-yaml-converter"
    | "robots-txt-generator"
    | "xml-sitemap-generator"
    | "schema-markup-generator"
    | "hreflang-tag-generator"
    | "redirect-checker"
    | "domain-age-checker"
    | "whois-lookup"
    | "api-tester"
    | "dns-lookup";
  popular?: boolean;
  /**
   * Results differ between the server render and the client (crypto-random
   * generation, e.g. passwords, UUIDs, MAC addresses). The tool page renders
   * a static placeholder until after mount so hydration never mismatches.
   */
  clientOnly?: boolean;
};
