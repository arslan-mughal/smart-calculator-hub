import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalcPage, Field, Result, seoHead, type Faq } from "@/components/calc-page";
import { emi, fmt } from "@/lib/calculators";

const faqs: Faq[] = [
  { q: "What is EMI?", a: "EMI (Equated Monthly Instalment) is the fixed amount you pay each month to repay a loan, covering both principal and interest." },
  { q: "How can I reduce my EMI?", a: "Make a larger down payment, choose a longer tenure, or negotiate a lower interest rate. A longer tenure lowers EMI but increases total interest." },
  { q: "Does this work for home, car and personal loans?", a: "Yes. Any fixed-rate amortising loan uses the same EMI formula." },
  { q: "Are fees included?", a: "No. Processing fees, insurance and taxes are not included — add them separately for the true cost." },
];

export const Route = createFileRoute("/loan-calculator")({
  head: () => seoHead({ title: "Loan EMI Calculator — Monthly Payment & Interest | CalcHub", description: "Free loan EMI calculator for home, car and personal loans. Find your monthly payment, total interest and total repayment instantly.", keywords: "loan calculator, emi calculator, mortgage calculator, home loan emi, car loan calculator, personal loan calculator, monthly payment calculator", faqs }),
  component: Page,
});

function Page() {
  const [p, setP] = useState("250000");
  const [r, setR] = useState("8.5");
  const [y, setY] = useState("20");
  const e = emi(+p, +r, +y * 12);
  const total = e * +y * 12;
  return (
    <CalcPage current="/loan-calculator" h1="Loan / EMI Calculator" intro="Work out the monthly instalment, total interest and full cost of any fixed-rate loan." faqs={faqs}
      tool={<div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4"><Field label="Loan amount" value={p} onChange={setP} /><Field label="Interest rate (yearly)" value={r} onChange={setR} suffix="%" /><Field label="Loan tenure" value={y} onChange={setY} suffix="years" /></div>
        <div className="space-y-3"><Result big label="Monthly EMI" value={fmt(e)} /><Result label="Total interest" value={fmt(total - +p)} /><Result label="Total payment" value={fmt(total)} /></div>
      </div>}>
      <h2>How the EMI formula works</h2>
      <p>EMI = P × r × (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1), where <strong>P</strong> is the principal, <strong>r</strong> is the monthly interest rate (annual rate ÷ 12 ÷ 100) and <strong>n</strong> is the number of monthly payments.</p>
      <h3>Worked example</h3>
      <p>A loan of 250,000 at 8.5% for 20 years gives a monthly EMI of about 2,170. Over 240 months you repay roughly 520,700 — meaning more than half the total goes to interest.</p>
      <h2>Tips before you borrow</h2>
      <ul><li>Compare the effective annual rate, not just the headline rate.</li><li>Check prepayment penalties — early repayment can save a lot of interest.</li><li>Keep EMIs below roughly 40% of take-home income.</li></ul>
    </CalcPage>
  );
}
