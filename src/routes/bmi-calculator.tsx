import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalcPage, Field, Result, seoHead, type Faq } from "@/components/calc-page";
import { bmi, bmiCategory, fmt } from "@/lib/calculators";

const faqs: Faq[] = [
  { q: "What is a healthy BMI?", a: "For most adults, a BMI between 18.5 and 24.9 is considered a healthy weight range." },
  { q: "How is BMI calculated?", a: "BMI equals weight in kilograms divided by height in metres squared (kg/m²)." },
  { q: "Is BMI accurate for athletes?", a: "Not always. BMI does not distinguish muscle from fat, so very muscular people may score as overweight while being healthy." },
  { q: "Does BMI apply to children?", a: "Children and teens use BMI-for-age percentiles rather than adult categories. Consult a paediatrician for interpretation." },
];

export const Route = createFileRoute("/bmi-calculator")({
  head: () => seoHead({ title: "BMI Calculator — Check Your Body Mass Index | CalcHub", description: "Free BMI calculator for adults. Enter height and weight to get your body mass index, BMI category and healthy weight range instantly.", keywords: "bmi calculator, body mass index calculator, healthy weight calculator, bmi chart, calculate bmi kg cm", faqs }),
  component: Page,
});

function Page() {
  const [kg, setKg] = useState("70");
  const [cm, setCm] = useState("175");
  const v = bmi(+kg, +cm);
  const m = +cm / 100;
  return (
    <CalcPage current="/bmi-calculator" h1="BMI Calculator" intro="Calculate your body mass index from height and weight, and see where you fall on the adult BMI scale." faqs={faqs}
      tool={<div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4"><Field label="Weight" value={kg} onChange={setKg} suffix="kg" /><Field label="Height" value={cm} onChange={setCm} suffix="cm" /></div>
        <div className="space-y-3"><Result big label="Your BMI" value={fmt(v, 1)} /><Result label="Category" value={bmiCategory(v)} /><Result label="Healthy weight for your height" value={`${fmt(18.5 * m * m, 1)} – ${fmt(24.9 * m * m, 1)} kg`} /></div>
      </div>}>
      <h2>What is Body Mass Index (BMI)?</h2>
      <p><strong>Body Mass Index</strong> is a simple screening measure that compares your weight to your height. Doctors and public-health bodies use it as a quick first check on whether a person's weight may carry health risks.</p>
      <h2>BMI formula</h2>
      <p>BMI = weight (kg) ÷ height (m)². For example, someone weighing 70 kg at 1.75 m tall has a BMI of 70 ÷ 3.0625 = <strong>22.9</strong>, which is in the healthy range.</p>
      <h3>Adult BMI categories</h3>
      <ul><li>Below 18.5 — Underweight</li><li>18.5 to 24.9 — Healthy weight</li><li>25 to 29.9 — Overweight</li><li>30 and above — Obese</li></ul>
      <h2>Limitations of BMI</h2>
      <p>BMI doesn't measure body fat directly and ignores muscle mass, bone density, age and ethnicity. Use it alongside waist measurement and advice from a healthcare professional.</p>
    </CalcPage>
  );
}
