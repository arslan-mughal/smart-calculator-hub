import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalcPage, Field, Result, seoHead, type Faq } from "@/components/calc-page";
import { fmt } from "@/lib/calculators";

const faqs: Faq[] = [
  { q: "How do I calculate a percentage of a number?", a: "Multiply the number by the percentage and divide by 100. 15% of 80 = 80 × 15 ÷ 100 = 12." },
  { q: "How do I calculate percentage increase?", a: "Subtract the old value from the new value, divide by the old value, then multiply by 100." },
  { q: "What percentage is X of Y?", a: "Divide X by Y and multiply by 100. 30 out of 120 = 25%." },
  { q: "Is percentage change the same as percentage points?", a: "No. Going from 10% to 12% is a 2 percentage-point rise but a 20% relative increase." },
];

export const Route = createFileRoute("/percentage-calculator")({
  head: () => seoHead({ title: "Percentage Calculator — Percent Of, Change & Ratio | CalcHub", description: "Free percentage calculator. Find X% of a number, what percent one number is of another, and percentage increase or decrease instantly.", keywords: "percentage calculator, percent calculator, percentage increase calculator, percentage change, what percent of, discount calculator", faqs }),
  component: Page,
});

function Page() {
  const [a, setA] = useState("15"); const [b, setB] = useState("80");
  const [c, setC] = useState("30"); const [d, setD] = useState("120");
  const [e, setE] = useState("50"); const [f, setF] = useState("65");
  return (
    <CalcPage current="/percentage-calculator" h1="Percentage Calculator" intro="Three quick percentage tools in one place — for discounts, grades, growth and more." faqs={faqs}
      tool={<div className="space-y-6">
        {[
          { t: "What is X% of Y?", x: [a, setA, "%"], y: [b, setB, ""], r: (+a * +b) / 100 },
          { t: "X is what percent of Y?", x: [c, setC, ""], y: [d, setD, ""], r: (+c / +d) * 100, pct: true },
          { t: "Percentage change from X to Y", x: [e, setE, ""], y: [f, setF, ""], r: ((+f - +e) / +e) * 100, pct: true },
        ].map((row) => (
          <div key={row.t} className="grid items-end gap-3 border-b border-border pb-6 last:border-0 md:grid-cols-[1fr_1fr_1fr]">
            <p className="font-display text-lg md:col-span-3">{row.t}</p>
            <Field label="X" value={row.x[0] as string} onChange={row.x[1] as (v: string) => void} suffix={row.x[2] as string} />
            <Field label="Y" value={row.y[0] as string} onChange={row.y[1] as (v: string) => void} />
            <Result label="Result" value={fmt(row.r) + (row.pct ? "%" : "")} />
          </div>
        ))}
      </div>}>
      <h2>How percentages work</h2>
      <p>"Percent" means "per hundred". A <strong>percentage</strong> expresses a part of a whole as a fraction of 100, which makes comparisons easy — 45/60 and 30/40 are both 75%.</p>
      <h2>Common percentage formulas</h2>
      <ul><li><strong>Percent of a number:</strong> value × percent ÷ 100</li><li><strong>Percent one number is of another:</strong> part ÷ whole × 100</li><li><strong>Percentage change:</strong> (new − old) ÷ old × 100</li></ul>
      <h3>Everyday examples</h3>
      <p>A 25% discount on a 60 item saves 15. A salary rising from 50,000 to 55,000 is a 10% increase. Scoring 42 out of 50 on a test is 84%.</p>
    </CalcPage>
  );
}
