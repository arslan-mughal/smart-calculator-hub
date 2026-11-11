import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalcPage, Field, Result, seoHead, type Faq } from "@/components/calc-page";
import { ageBetween, fmt } from "@/lib/calculators";

const faqs: Faq[] = [
  { q: "How is exact age calculated?", a: "We count complete years, then remaining complete months, then remaining days between your birth date and the target date." },
  { q: "Does it account for leap years?", a: "Yes. Day counts use real calendar dates, so leap years are handled automatically." },
  { q: "Can I calculate age on a future date?", a: "Yes — change the 'Age on' date to any date to see how old you will be." },
];

export const Route = createFileRoute("/age-calculator")({
  head: () => seoHead({ title: "Age Calculator — Exact Age in Years, Months & Days | CalcHub", description: "Free age calculator. Enter your date of birth to find your exact age in years, months and days, plus total days lived and your next birthday.", keywords: "age calculator, date of birth calculator, how old am i, exact age calculator, age in days, birthday calculator", faqs }),
  component: Page,
});

function Page() {
  const [birth, setBirth] = useState("1995-06-15");
  const [on, setOn] = useState("");
  useEffect(() => setOn(new Date().toISOString().slice(0, 10)), []);
  const b = new Date(birth); const n = on ? new Date(on) : new Date(birth);
  const a = ageBetween(b, n);
  const next = new Date(n.getFullYear(), b.getMonth(), b.getDate());
  if (next < n) next.setFullYear(n.getFullYear() + 1);
  const toNext = Math.ceil((next.getTime() - n.getTime()) / 86400000);
  return (
    <CalcPage current="/age-calculator" h1="Age Calculator" intro="Find your exact age down to the day, total days lived, and the countdown to your next birthday." faqs={faqs}
      tool={<div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4"><Field type="date" label="Date of birth" value={birth} onChange={setBirth} /><Field type="date" label="Age on" value={on} onChange={setOn} /></div>
        <div className="space-y-3"><Result big label="Your age" value={`${a.y}y ${a.m}m ${a.d}d`} /><Result label="Total days" value={fmt(a.days, 0)} /><Result label="Days to next birthday" value={fmt(toNext, 0)} /></div>
      </div>}>
      <h2>Calculating age by date of birth</h2>
      <p>An <strong>age calculator</strong> removes the fiddly month-and-day arithmetic. Subtract birth year from the current year, then adjust if your birthday hasn't happened yet this year — and repeat the same logic for months and days.</p>
      <h2>Where exact age matters</h2>
      <ul><li>Eligibility for school admission, licences and retirement.</li><li>Insurance and pension applications.</li><li>Milestones like your 10,000th day.</li></ul>
    </CalcPage>
  );
}
