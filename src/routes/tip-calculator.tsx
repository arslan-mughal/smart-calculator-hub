import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalcPage, Field, Result, seoHead, type Faq } from "@/components/calc-page";
import { fmt } from "@/lib/calculators";

const faqs: Faq[] = [
  { q: "How much should I tip?", a: "Customs vary by country. In the US, 15–20% is standard at sit-down restaurants; many other countries expect less or include service." },
  { q: "Should I tip on the pre-tax amount?", a: "Etiquette guides commonly suggest tipping on the pre-tax subtotal, but either is acceptable." },
  { q: "How do I split a bill evenly?", a: "Add the tip to the bill total, then divide by the number of people." },
];

export const Route = createFileRoute("/tip-calculator")({
  head: () => seoHead({ title: "Tip Calculator — Split the Bill & Calculate Tip | CalcHub", description: "Free tip calculator. Work out the tip, total and each person's share when splitting a restaurant bill.", keywords: "tip calculator, gratuity calculator, bill split calculator, restaurant tip, how much to tip", faqs }),
  component: Page,
});

function Page() {
  const [bill, setBill] = useState("84");
  const [tip, setTip] = useState("18");
  const [ppl, setPpl] = useState("3");
  const t = (+bill * +tip) / 100; const total = +bill + t;
  return (
    <CalcPage current="/tip-calculator" h1="Tip Calculator" intro="Calculate a fair tip and split the bill between friends in seconds." faqs={faqs}
      tool={<div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <Field label="Bill amount" value={bill} onChange={setBill} /><Field label="Tip" value={tip} onChange={setTip} suffix="%" />
          <div className="flex gap-2">{[10, 15, 18, 20, 25].map((v) => (
            <button key={v} onClick={() => setTip(String(v))} className={`flex-1 rounded-lg border px-2 py-2 text-sm ${+tip === v ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>{v}%</button>
          ))}</div>
          <Field label="People" value={ppl} onChange={setPpl} />
        </div>
        <div className="space-y-3"><Result big label="Each person pays" value={fmt(total / +ppl)} /><Result label="Tip amount" value={fmt(t)} /><Result label="Total with tip" value={fmt(total)} /></div>
      </div>}>
      <h2>How to calculate a tip</h2>
      <p>Multiply the bill by the tip percentage and divide by 100. On an 84 bill, an 18% <strong>tip</strong> is 15.12, making the total 99.12 — or 33.04 each between three people.</p>
      <h2>Quick mental math</h2>
      <ul><li><strong>10%:</strong> move the decimal one place left.</li><li><strong>20%:</strong> double the 10% figure.</li><li><strong>15%:</strong> 10% plus half of it.</li></ul>
    </CalcPage>
  );
}
