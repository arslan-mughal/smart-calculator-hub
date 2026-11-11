import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalcPage, Field, Result, seoHead, type Faq } from "@/components/calc-page";
import { compound, fmt } from "@/lib/calculators";

const faqs: Faq[] = [
  { q: "What is compound interest?", a: "Compound interest is interest earned on both your original deposit and on interest already added — 'interest on interest'." },
  { q: "How often should interest compound?", a: "More frequent compounding (monthly vs yearly) produces slightly higher returns at the same rate." },
  { q: "What is the Rule of 72?", a: "Divide 72 by the annual rate to estimate the years needed to double your money. At 8%, money doubles in about 9 years." },
  { q: "Does this include inflation or tax?", a: "No. Results are nominal, before tax and inflation." },
];

export const Route = createFileRoute("/compound-interest-calculator")({
  head: () => seoHead({ title: "Compound Interest Calculator — Savings Growth | CalcHub", description: "Free compound interest calculator with monthly contributions. See how your savings or investments grow over time with daily, monthly or yearly compounding.", keywords: "compound interest calculator, savings calculator, investment calculator, interest calculator, future value calculator, rule of 72", faqs }),
  component: Page,
});

function Page() {
  const [p, setP] = useState("10000");
  const [m, setM] = useState("200");
  const [r, setR] = useState("7");
  const [y, setY] = useState("15");
  const [n, setN] = useState("12");
  const fv = compound(+p, +r, +y, +n, +m);
  const invested = +p + +m * 12 * +y;
  return (
    <CalcPage current="/compound-interest-calculator" h1="Compound Interest Calculator" intro="Project the future value of your savings with regular monthly contributions and your choice of compounding." faqs={faqs}
      tool={<div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <Field label="Initial deposit" value={p} onChange={setP} /><Field label="Monthly contribution" value={m} onChange={setM} />
          <Field label="Annual interest rate" value={r} onChange={setR} suffix="%" /><Field label="Years" value={y} onChange={setY} />
          <label className="block"><span className="text-sm font-medium text-muted-foreground">Compounding</span>
            <select value={n} onChange={(e) => setN(e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5">
              <option value="1">Yearly</option><option value="4">Quarterly</option><option value="12">Monthly</option><option value="365">Daily</option>
            </select></label>
        </div>
        <div className="space-y-3"><Result big label="Future value" value={fmt(fv)} /><Result label="Total contributed" value={fmt(invested)} /><Result label="Interest earned" value={fmt(fv - invested)} /></div>
      </div>}>
      <h2>The compound interest formula</h2>
      <p>A = P(1 + r/n)<sup>nt</sup>, where <strong>P</strong> is the principal, <strong>r</strong> the annual rate, <strong>n</strong> the compounding periods per year and <strong>t</strong> the years. Regular contributions are added as a future-value annuity.</p>
      <h2>Why starting early matters</h2>
      <p>Because growth builds on itself, time is the most powerful variable. Investing 200 a month at 7% for 30 years grows to around 244,000 — but waiting just ten years cuts that to roughly 104,000.</p>
      <h3>Ways to maximise compounding</h3>
      <ul><li>Start as early as possible and contribute consistently.</li><li>Reinvest dividends and interest.</li><li>Keep fees low — a 1% fee compounds against you too.</li></ul>
    </CalcPage>
  );
}
