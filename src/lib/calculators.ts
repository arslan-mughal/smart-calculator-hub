export const calculators = [
  { to: "/bmi-calculator", name: "BMI Calculator", blurb: "Check your body mass index and healthy weight range.", tag: "Health" },
  { to: "/loan-calculator", name: "Loan / EMI Calculator", blurb: "Monthly payment, total interest and cost of any loan.", tag: "Finance" },
  { to: "/compound-interest-calculator", name: "Compound Interest Calculator", blurb: "See how savings grow with compounding over time.", tag: "Finance" },
  { to: "/percentage-calculator", name: "Percentage Calculator", blurb: "Percent of, percent change and ratio — instantly.", tag: "Math" },
  { to: "/age-calculator", name: "Age Calculator", blurb: "Exact age in years, months and days from a birth date.", tag: "Everyday" },
  { to: "/tip-calculator", name: "Tip Calculator", blurb: "Split the bill and work out a fair tip in seconds.", tag: "Everyday" },
] as const;

export const fmt = (n: number, d = 2) =>
  Number.isFinite(n) ? n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: 0 }) : "—";

export function emi(principal: number, annualRate: number, months: number) {
  if (months <= 0) return NaN;
  const r = annualRate / 12 / 100;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

export function compound(p: number, rate: number, years: number, n: number, monthly = 0) {
  const r = rate / 100;
  if (r === 0) return p + monthly * 12 * years;
  const base = p * Math.pow(1 + r / n, n * years);
  const rm = Math.pow(1 + r / n, n / 12) - 1;
  const contrib = monthly * ((Math.pow(1 + rm, 12 * years) - 1) / rm);
  return base + contrib;
}

export function bmi(kg: number, cm: number) {
  const m = cm / 100;
  return kg / (m * m);
}
export function bmiCategory(v: number) {
  if (!Number.isFinite(v)) return "—";
  if (v < 18.5) return "Underweight";
  if (v < 25) return "Healthy weight";
  if (v < 30) return "Overweight";
  return "Obese";
}

export function ageBetween(birth: Date, now: Date) {
  let y = now.getFullYear() - birth.getFullYear();
  let m = now.getMonth() - birth.getMonth();
  let d = now.getDate() - birth.getDate();
  if (d < 0) {
    m -= 1;
    d += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (m < 0) { y -= 1; m += 12; }
  const days = Math.floor((now.getTime() - birth.getTime()) / 86400000);
  return { y, m, d, days };
}
