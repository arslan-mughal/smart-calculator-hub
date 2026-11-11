import { createFileRoute, Link } from "@tanstack/react-router";
import { calculators } from "@/lib/calculators";

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
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {calculators.map((c, i) => (
          <Link key={c.to} to={c.to} className="group rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-1 hover:border-primary">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="rounded-full bg-secondary px-2.5 py-1">{c.tag}</span>
              <span className="font-display text-lg">0{i + 1}</span>
            </div>
            <h2 className="mt-6 text-2xl font-bold group-hover:text-primary">{c.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{c.blurb}</p>
            <p className="mt-6 text-sm font-medium text-primary">Open calculator →</p>
          </Link>
        ))}
      </section>
      <article className="prose-calc mx-auto mt-20 max-w-3xl">
        <h2>Free online calculators you can trust</h2>
        <p>CalcHub brings together the <strong>online calculators</strong> people search for most — from a <Link to="/loan-calculator">loan EMI calculator</Link> for planning a mortgage or car loan, to a <Link to="/bmi-calculator">BMI calculator</Link> for checking a healthy weight range. Every tool runs instantly in your browser, so your numbers never leave your device.</p>
        <h3>Why use CalcHub?</h3>
        <ul>
          <li><strong>Accurate formulas</strong> — standard, published equations used by banks and health bodies.</li>
          <li><strong>Explained clearly</strong> — every calculator comes with a guide, worked examples and FAQs.</li>
          <li><strong>Private and free</strong> — no accounts, no tracking of your inputs.</li>
        </ul>
        <h3>Finance, health and everyday math</h3>
        <p>Use the <Link to="/compound-interest-calculator">compound interest calculator</Link> to see how savings grow, the <Link to="/percentage-calculator">percentage calculator</Link> for discounts and grade changes, the <Link to="/age-calculator">age calculator</Link> for exact age in days, and the <Link to="/tip-calculator">tip calculator</Link> to split a restaurant bill fairly.</p>
      </article>
    </div>
  );
}
