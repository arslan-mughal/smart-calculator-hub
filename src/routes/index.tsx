import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Calculator,
  Check,
  FileText,
  HeartPulse,
  Image,
  LockKeyhole,
  QrCode,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { calcs, categories, bySlug } from "@/lib/registry";
import { ToolCard, ToolIcon } from "@/components/tool-card";
import { ToolSearch } from "@/components/tool-search";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `CalcHub — ${calcs.length} Free Online Calculators & Tools` },
      {
        name: "description",
        content: `Use ${calcs.length} free online calculators, converters, text tools and generators. Fast, private and easy to use — no sign-up or downloads required.`,
      },
      {
        name: "keywords",
        content:
          "online calculators, free online tools, mortgage calculator, bmi calculator, percentage calculator, word counter, unit converter, qr code generator, password generator",
      },
      { property: "og:title", content: "CalcHub — Free Online Calculators & Everyday Tools" },
      {
        property: "og:description",
        content:
          "Calculators, converters, text utilities and generators. Open a tool, get your answer and get on with your day.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const popularSlugs = [
  "mortgage-calculator",
  "bmi-calculator",
  "percentage-calculator",
  "word-counter",
  "image-resizer",
  "qr-code-generator",
  "password-generator",
  "quadratic-formula-calculator",
];

function Index() {
  const popular = popularSlugs.flatMap((slug) => {
    const tool = bySlug[slug];
    return tool ? [tool] : [];
  });
  return (
    <div>
      <section className="px-5 pb-8 pt-8 lg:px-8 lg:pt-12">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-border bg-card shadow-card">
          <div className="grid lg:grid-cols-[1.12fr_0.88fr]">
            <div className="min-w-0 px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-primary">
                <Sparkles className="size-3.5" /> {calcs.length} free tools · No sign-up · Nothing
                to install
              </div>
              <h1 className="mt-6 max-w-2xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                Everyday answers, <span className="text-primary">all in one place.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
                Calculators, converters and practical digital tools that just work. Open a tool, get
                your answer and get on with your day.
              </p>
              <div className="mt-7 max-w-xl">
                <ToolSearch />
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
                <span className="mr-1 font-bold text-foreground">Popular:</span>
                {["Mortgage", "Word counter", "BMI", "QR code"].map((label, index) => (
                  <Link
                    key={label}
                    to="/$slug"
                    params={{
                      slug: popularSlugs[index === 2 ? 1 : index === 1 ? 3 : index === 3 ? 5 : 0]!,
                    }}
                    className="rounded-full border border-border px-3 py-1.5 font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
                  >
                    {label}
                  </Link>
                ))}
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-primary" /> Your inputs stay on your device
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="size-4 text-primary" /> Instant, unlimited use
                </span>
              </div>
            </div>
            <div
              className="relative hidden items-center justify-center overflow-hidden bg-secondary p-10 lg:flex"
              aria-label="Examples of CalcHub tools"
            >
              <div className="absolute right-8 top-8 size-28 rounded-full border border-primary/10" />
              <div className="absolute bottom-10 left-8 size-40 rounded-full border border-primary/10" />
              <div className="relative grid w-full max-w-md grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                  <span className="inline-flex rounded-lg bg-secondary p-2 text-primary">
                    <Calculator className="size-5" />
                  </span>
                  <p className="mt-4 text-xs font-semibold text-muted-foreground">
                    Mortgage payment
                  </p>
                  <p className="mt-1 font-display text-2xl font-extrabold">
                    $2,212<span className="text-sm">/mo</span>
                  </p>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-2/3 rounded-full bg-accent" />
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">$350k · 6.5% · 30 years</p>
                </div>
                <div className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-card">
                  <span className="inline-flex rounded-lg bg-secondary p-2 text-primary">
                    <HeartPulse className="size-5" />
                  </span>
                  <p className="mt-4 text-xs font-semibold text-muted-foreground">
                    Body mass index
                  </p>
                  <p className="mt-1 font-display text-3xl font-extrabold">22.9</p>
                  <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-accent/25 px-2 py-1 text-[11px] font-bold text-primary">
                    <Check className="size-3" /> Healthy range
                  </span>
                </div>
                <div className="-mt-2 rounded-2xl border border-border bg-card p-5 shadow-card">
                  <span className="inline-flex rounded-lg bg-secondary p-2 text-primary">
                    <FileText className="size-5" />
                  </span>
                  <p className="mt-4 text-xs font-semibold text-muted-foreground">Word counter</p>
                  <div className="mt-3 space-y-2">
                    <div className="h-2 w-full rounded bg-muted" />
                    <div className="h-2 w-4/5 rounded bg-muted" />
                    <div className="h-2 w-2/3 rounded bg-muted" />
                  </div>
                  <p className="mt-4 text-sm font-bold">
                    248 words{" "}
                    <span className="font-normal text-muted-foreground">· 1 min read</span>
                  </p>
                </div>
                <div className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-card">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex rounded-lg bg-secondary p-2 text-primary">
                      <QrCode className="size-5" />
                    </span>
                    <Image className="size-4 text-muted-foreground" />
                  </div>
                  <div className="mx-auto mt-4 grid size-20 grid-cols-5 gap-1 rounded-lg border border-border p-2">
                    {Array.from({ length: 25 }, (_, i) => (
                      <span
                        key={i}
                        className={
                          i % 3 === 0 || i % 7 === 0
                            ? "rounded-sm bg-primary"
                            : "rounded-sm bg-secondary"
                        }
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-center text-xs font-semibold text-muted-foreground">
                    QR codes in one click
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 border-t border-border lg:grid-cols-4">
            {[
              [String(calcs.length), "working online tools"],
              [String(categories.length), "organised categories"],
              ["100%", "free to use"],
              ["0", "accounts or uploads required"],
            ].map(([value, label], index) => (
              <div
                key={label}
                className={`p-5 sm:px-8 ${index ? "border-l border-border" : ""} ${index === 2 ? "max-lg:border-l-0 max-lg:border-t" : ""} ${index === 3 ? "max-lg:border-t" : ""}`}
              >
                <p className="font-display text-2xl font-extrabold text-primary">{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="section-kicker">Start with a favourite</p>
            <h2 className="section-title">The tools people need every day</h2>
          </div>
          <Link
            to="/tools"
            className="hidden items-center gap-1.5 text-sm font-bold text-primary hover:underline sm:flex"
          >
            Browse all {calcs.length} tools <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popular.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-2xl">
            <p className="section-kicker">Find your tool</p>
            <h2 className="section-title">Everything neatly organised</h2>
            <p className="mt-3 text-muted-foreground">
              From financial planning to a quick text clean-up, jump straight to the right category.
            </p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const tools = calcs.filter((tool) => tool.category === category);
              return (
                <div key={category} className="rounded-2xl border border-border bg-background p-6">
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-secondary p-2.5 text-primary">
                      <ToolIcon category={category} />
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-bold">{category}</h3>
                      <p className="text-xs text-muted-foreground">
                        {tools.length} free {tools.length === 1 ? "tool" : "tools"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-2.5">
                    {tools.slice(0, 4).map((tool) => (
                      <Link
                        key={tool.slug}
                        to="/$slug"
                        params={{ slug: tool.slug }}
                        className="flex items-center justify-between gap-3 text-sm text-muted-foreground transition hover:text-primary"
                      >
                        <span>{tool.name}</span>
                        <ArrowRight className="size-3.5 shrink-0" />
                      </Link>
                    ))}
                  </div>
                  <Link
                    to="/tools"
                    search={{ category }}
                    className="mt-5 inline-flex items-center gap-1.5 border-t border-border pt-4 text-sm font-bold text-primary hover:underline"
                  >
                    View all {category} <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-8 rounded-3xl bg-primary p-8 text-primary-foreground md:grid-cols-3 md:p-10">
          {[
            [
              LockKeyhole,
              "Private by design",
              "Calculations and file processing happen in your browser. Your entries are not saved or sent to us.",
            ],
            [
              Zap,
              "Fast and focused",
              "No accounts, paywalls or unnecessary steps. Clear inputs and useful results come first.",
            ],
            [
              Check,
              "Explained clearly",
              "Formulas, worked examples and plain-English guidance help you understand every answer.",
            ],
          ].map(([Icon, title, body]) => {
            const FeatureIcon = Icon as typeof LockKeyhole;
            return (
              <div key={String(title)}>
                <span className="inline-flex rounded-xl bg-primary-foreground/10 p-3 text-accent">
                  <FeatureIcon className="size-5" />
                </span>
                <h2 className="mt-4 font-display text-xl font-bold">{String(title)}</h2>
                <p className="mt-2 text-sm leading-6 text-primary-foreground/65">{String(body)}</p>
              </div>
            );
          })}
        </div>
      </section>

      <article className="prose-calc mx-auto max-w-3xl px-5 pb-8">
        <p className="section-kicker">Free online calculators and utilities</p>
        <h2>A practical toolbox for work, study and everyday life</h2>
        <p>
          CalcHub brings together the <strong>online calculators</strong> and digital tools people
          reach for most. Plan a home loan with the{" "}
          <Link to="/$slug" params={{ slug: "mortgage-calculator" }}>
            mortgage calculator
          </Link>
          , check a health screening measure with the{" "}
          <Link to="/$slug" params={{ slug: "bmi-calculator" }}>
            BMI calculator
          </Link>
          , or solve an equation with the{" "}
          <Link to="/$slug" params={{ slug: "quadratic-formula-calculator" }}>
            quadratic formula calculator
          </Link>
          . Each result appears instantly, alongside the formula and an example that explains how it
          was reached.
        </p>
        <h3>More than basic arithmetic</h3>
        <p>
          Convert weights, volume, speed, pressure and data storage; clean and count text; generate
          passwords, QR codes and random selections; format JSON or test a regular expression. Media
          tools such as the{" "}
          <Link to="/$slug" params={{ slug: "image-resizer" }}>
            image resizer
          </Link>{" "}
          process files on your own device, so you can complete everyday tasks without uploading
          private documents or photos.
        </p>
        <h3>Free, private and easy to use</h3>
        <p>
          There is no account to create and no software to install. Search by task or browse by
          category, enter your values and read the result. Financial and health tools provide
          estimates for information only; important decisions should use professional advice and the
          exact terms or measurements that apply to you.
        </p>
      </article>
    </div>
  );
}
