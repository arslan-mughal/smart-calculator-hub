import { createFileRoute, Link } from "@tanstack/react-router";
import { calcs, categories } from "@/lib/registry";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CalcHub — Free Online Calculators for Finance, Health & Math" },
      { name: "description", content: "Free online calculators: BMI, loan EMI, compound interest, percentage, age and tip calculators. Fast, accurate and easy to use with clear explanations." },
      { name: "keywords", content: "online calculator, free calculator, bmi calculator, loan calculator, emi calculator, compound interest calculator, percentage calculator, age calculator, tip calculator" },
      { property: "og:title", content: "CalcHub — Free Online Calculators" },
      { property: "og:description", content: "BMI, loan, compound interest, percentage, age and tip calculators — free and instant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="mx-auto max-w-6xl px-5">
      <section className="py-16 md:py-24">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">Free · No sign-up · Instant</p>
        <h1 className="mt-4 max-w-3xl text-5xl font-bold leading-tight md:text-7xl">Every number you need, <em className="text-primary">worked out.</em></h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">Accurate online calculators for money, health and everyday math — each with plain-English guides explaining the formula behind the answer.</p>
      </section>
      {categories.map((cat) => (
        <section key={cat} className="mb-12">
          <h2 className="mb-4 text-2xl font-bold">{cat}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {calcs.filter((c) => c.category === cat).map((c) => (
              <Link key={c.slug} to="/$slug" params={{ slug: c.slug }} className="group rounded-xl border border-border bg-card p-5 shadow-card transition hover:border-primary">
                <h3 className="text-lg font-bold group-hover:text-primary">{c.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.short}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
      <article className="prose-calc mx-auto mt-20 max-w-3xl">
        <h2>Free online calculators you can trust</h2>
        <p>CalcHub brings together the <strong>online calculators</strong> people search for most — from a <Link to="/$slug" params={{ slug: "loan-calculator" }}>loan EMI calculator</Link> for planning a mortgage or car loan, to a <Link to="/$slug" params={{ slug: "bmi-calculator" }}>BMI calculator</Link> for checking a healthy weight range. Every tool runs instantly in your browser, so your numbers never leave your device.</p>
        <h3>Why use CalcHub?</h3>
        <ul>
          <li><strong>Accurate formulas</strong> — standard, published equations used by banks and health bodies.</li>
          <li><strong>Explained clearly</strong> — every calculator comes with a guide, worked examples and FAQs.</li>
          <li><strong>Private and free</strong> — no accounts, no tracking of your inputs.</li>
        </ul>
        <h3>Finance, health and everyday math</h3>
        <p>Use the <Link to="/$slug" params={{ slug: "compound-interest-calculator" }}>compound interest calculator</Link> to see how savings grow, the <Link to="/$slug" params={{ slug: "percentage-calculator" }}>percentage calculator</Link> for discounts and grade changes, the <Link to="/$slug" params={{ slug: "age-calculator" }}>age calculator</Link> for exact age in days, and the <Link to="/$slug" params={{ slug: "tip-calculator" }}>tip calculator</Link> to split a restaurant bill fairly.</p>
      </article>
    </div>
  );
}
