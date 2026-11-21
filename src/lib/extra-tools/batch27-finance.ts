// Batch 27 — finance tools: HSA, FIRE, W-4 withholding, salary raise,
// property tax.
// All figures are US federal 2025 (IRS Rev. Proc. 2024-40). Every tax
// result is labelled an estimate — none of this is tax advice.
import type { Calc } from "../tool-types";
import { fmt } from "../calculators";
import { N, numberInput, selectInput } from "./shared";

const m = (n: number, d = 2) => fmt(n, d);
const money = (n: number) => `$${fmt(n, 2)}`;

type FilingStatus = "single" | "married" | "hoh";

const STANDARD_DEDUCTION: Record<FilingStatus, number> = {
  single: 15750,
  married: 31500,
  hoh: 23625,
};

const STATUS_LABEL: Record<FilingStatus, string> = {
  single: "Single",
  married: "Married filing jointly",
  hoh: "Head of household",
};

/** 2025 federal brackets: [top of bracket, rate]. */
const BRACKETS: Record<FilingStatus, [number, number][]> = {
  single: [
    [11925, 0.1],
    [48475, 0.12],
    [103350, 0.22],
    [197300, 0.24],
    [250525, 0.32],
    [626350, 0.35],
    [Infinity, 0.37],
  ],
  married: [
    [23850, 0.1],
    [96950, 0.12],
    [206700, 0.22],
    [394600, 0.24],
    [501050, 0.32],
    [751600, 0.35],
    [Infinity, 0.37],
  ],
  hoh: [
    [17000, 0.1],
    [64850, 0.12],
    [103350, 0.22],
    [197300, 0.24],
    [250500, 0.32],
    [626350, 0.35],
    [Infinity, 0.37],
  ],
};

function federalTax(taxable: number, status: FilingStatus): { tax: number; marginal: number } {
  let tax = 0;
  let prev = 0;
  let marginal = 0;
  for (const [cap, rate] of BRACKETS[status]) {
    if (taxable <= prev) break;
    tax += (Math.min(taxable, cap) - prev) * rate;
    marginal = rate;
    prev = cap;
  }
  return { tax, marginal };
}

const statusSelect = (def: FilingStatus = "single") => ({
  key: "status",
  label: "Filing status",
  type: "select" as const,
  def,
  options: (Object.keys(STATUS_LABEL) as FilingStatus[]).map((v) => ({
    v,
    l: STATUS_LABEL[v]!,
  })),
});

const TAX_DISCLAIMER =
  "This is an estimate based on the 2025 US federal brackets and standard deduction. It is not tax advice — your real tax depends on credits, state rules and your full situation, so check important figures with a tax professional.";

/** Future value of a present sum plus equal yearly contributions. */
function futureValue(pv: number, pmt: number, rate: number, years: number): number {
  if (rate === 0) return pv + pmt * years;
  const growth = Math.pow(1 + rate, years);
  return pv * growth + pmt * ((growth - 1) / rate);
}

export const batch27FinanceTools: Calc[] = [
  {
    slug: "hsa-calculator",
    name: "HSA Calculator",
    category: "Finance",
    short: "Project your Health Savings Account balance and check the 2025 contribution limits.",
    keywords:
      "hsa calculator, health savings account calculator, hsa contribution limit 2025, hsa growth calculator, hsa max contribution",
    inputs: [
      selectInput("coverage", "Coverage", "family", [
        ["self", "Self-only"],
        ["family", "Family"],
      ]),
      numberInput("age", "Your age", "40"),
      numberInput("balance", "Current HSA balance", "5000", "$"),
      numberInput("contrib", "Annual contribution", "8000", "$"),
      numberInput("years", "Years until you use it", "20"),
      numberInput("ret", "Annual return", "7", "%"),
    ],
    compute: (v) => {
      const coverage = String(v.coverage ?? "family");
      const age = N(v.age);
      const balance = N(v.balance);
      const contrib = N(v.contrib);
      const years = N(v.years);
      const ret = N(v.ret) / 100;
      const limit = coverage === "self" ? 4300 : 8550;
      const catchUp = age >= 55 ? 1000 : 0;
      const allowed = limit + catchUp;
      const fv = futureValue(balance, contrib, ret, years);
      const totalContrib = contrib * years;
      const growth = fv - balance - totalContrib;
      return [
        { label: "Projected HSA balance", value: money(fv) },
        { label: "Your contributions", value: money(totalContrib) },
        { label: "Investment growth", value: money(growth) },
        {
          label: "2025 contribution limit",
          value: `${money(allowed)}${contrib > allowed ? " — your contribution is over the limit" : " — your contribution fits"}`,
        },
      ];
    },
    about:
      "Project how a Health Savings Account (HSA) grows: tax-deductible contributions, tax-free growth and tax-free withdrawals for medical expenses — the only triple-tax-advantaged account in the US tax code. For 2025 the contribution limits are $4,300 for self-only coverage and $8,550 for family coverage, plus a $1,000 catch-up if you are 55 or older. You need a high-deductible health plan to contribute. This is a projection, not financial advice: real returns vary, and the limits change most years.",
    formula:
      "Future value = balance × (1 + r)ⁿ + contribution × ((1 + r)ⁿ − 1) ÷ r, where r is the annual return and n is the number of years. The 2025 limits are $4,300 (self-only) or $8,550 (family), plus $1,000 catch-up at 55+.",
    example:
      "A family plan with a $5,000 balance, $8,000 contributed each year and a 7% return for 20 years grows to about $347,313 — $160,000 of contributions and about $182,313 of growth. The $8,000 contribution is inside the $8,550 family limit for 2025.",
    howToUse: [
      "Choose your coverage (self-only or family) and your age.",
      "Enter your current balance, yearly contribution, time horizon and expected return.",
      "Read the projected balance — and check your contribution against the 2025 limit.",
    ],
    details: [
      {
        heading: "Why an HSA is triple tax-advantaged",
        body: "Contributions are tax-deductible, the money grows tax-free, and withdrawals for qualified medical expenses are tax-free too. No other account does all three: a 401(k) taxes withdrawals, a Roth taxes contributions. After 65 you can also withdraw for anything (paying ordinary income tax, like a 401(k)), which is why many people treat an HSA as a stealth retirement account and pay small medical bills out of pocket to let it grow.",
      },
      {
        heading: "The catch-up and the limits",
        body: "The 2025 limits are $4,300 for self-only coverage and $8,550 for family coverage. From age 55 you may add $1,000 a year on top. Contributions above the limit are taxed and penalised, so the calculator flags them. You can only contribute while you are covered by a qualifying high-deductible health plan, and your employer's contributions count toward the same limit.",
      },
    ],
    tips: [
      "Contribute the maximum if you can — the tax break is the best available.",
      "Pay small medical bills out of pocket and let the HSA compound.",
      "Keep receipts: you can reimburse yourself for old expenses years later.",
    ],
    faqs: [
      {
        q: "What is the HSA contribution limit for 2025?",
        a: "$4,300 for self-only coverage and $8,550 for family coverage, plus $1,000 a year from age 55. Employer contributions count toward the same limit.",
      },
      {
        q: "Do I need a special health plan for an HSA?",
        a: "Yes — you must be covered by a qualifying high-deductible health plan (HDHP). A regular low-deductible plan does not qualify.",
      },
      {
        q: "What happens to my HSA if I change jobs?",
        a: "Nothing — the account is yours, not your employer's. It stays with you, and the balance rolls over every year; there is no use-it-or-lose-it rule.",
      },
      {
        q: "Can I use HSA money for non-medical expenses?",
        a: "Before 65, non-medical withdrawals are taxed plus a 20% penalty. From 65 they are taxed as ordinary income (like a 401(k)) with no penalty.",
      },
    ],
  },
  {
    slug: "fire-calculator",
    name: "FIRE Calculator",
    category: "Finance",
    short: "Your FIRE number (expenses × 25) and how many years until you reach it.",
    keywords:
      "fire calculator, financial independence calculator, fire number calculator, retire early calculator, financial independence retire early",
    inputs: [
      numberInput("exp", "Annual expenses in retirement", "40000", "$"),
      numberInput("saved", "Already saved / invested", "100000", "$"),
      numberInput("monthly", "Monthly contribution", "2000", "$"),
      numberInput("ret", "Annual return", "7", "%"),
    ],
    compute: (v) => {
      const exp = N(v.exp);
      const saved = N(v.saved);
      const monthly = N(v.monthly);
      const ret = N(v.ret) / 100;
      const target = exp * 25;
      const monthlyRate = Math.pow(1 + ret, 1 / 12) - 1;
      let years: number;
      if (target <= saved) {
        years = 0;
      } else if (monthly <= 0 && ret <= 0) {
        years = Infinity;
      } else if (monthlyRate === 0) {
        years = (target - saved) / (monthly * 12);
      } else {
        const months =
          Math.log((target + monthly / monthlyRate) / (saved + monthly / monthlyRate)) /
          Math.log(1 + monthlyRate);
        years = months / 12;
      }
      return [
        { label: "Your FIRE number", value: money(target) },
        {
          label: "Years until FIRE",
          value: !Number.isFinite(years)
            ? "Never at this savings rate — raise contributions or cut expenses"
            : years === 0
              ? "Already there — you have reached your FIRE number"
              : `${m(years, 1)} years`,
        },
        { label: "Already saved", value: `${m((saved / target) * 100, 1)}% of your FIRE number` },
        { label: "Monthly income at FIRE (4% rule)", value: `${money(target * 0.04 / 12)} / month` },
      ];
    },
    about:
      "Work out your FIRE number — the amount you need invested to retire early — and how long it will take to get there. The 4% rule says you can safely withdraw 4% of your investments a year, so your FIRE number is 25 times your annual expenses. This calculator uses that rule and your monthly contributions to estimate the years until financial independence. It is a projection, not financial advice: real returns vary, and the 4% rule is a rule of thumb, not a guarantee.",
    formula:
      "FIRE number = annual expenses × 25 (the 4% rule: 1 ÷ 0.04 = 25). Years to FIRE solves the compound-growth equation: target = saved × (1 + r)ⁿ + monthly × (((1 + r)ⁿ − 1) ÷ r), with the return applied monthly.",
    example:
      "Spending $40,000 a year means a FIRE number of $1,000,000. Starting from $100,000 saved and adding $2,000 a month at 7% a year, you reach it in about 16.2 years — and $1,000,000 at 4% pays $3,333 a month.",
    howToUse: [
      "Enter what you expect to spend each year in retirement.",
      "Enter what you have already saved and what you add each month.",
      "Read your FIRE number and the estimated years to reach it.",
    ],
    details: [
      {
        heading: "Where the 25× rule comes from",
        body: "The 4% rule comes from the Trinity Study, which tested withdrawal rates against a century of US market data: withdrawing 4% of the starting balance a year (adjusted for inflation) survived 30-year retirements in almost every historical period. 25× expenses is the same rule rearranged — 1 ÷ 0.04 = 25. It assumes a mix of shares and bonds and a 30-year horizon; retiring at 40 needs the money to last longer, so many early retirees use 3.5% (about 28.6× expenses) instead.",
      },
      {
        heading: "What the estimate leaves out",
        body: "Taxes, fees, inflation, house purchases, children, and the fact that returns are lumpy — a crash early in retirement hurts far more than one late. The calculator also assumes you keep contributing the same amount every month and never withdraw. Treat the years-to-FIRE figure as a planning guide, and re-run it whenever your spending or savings change.",
      },
    ],
    tips: [
      "Cutting expenses helps twice: it lowers your FIRE number and frees more to save.",
      "A higher savings rate matters far more than a slightly higher return.",
      "Re-run the numbers yearly — spending and markets both move.",
    ],
    faqs: [
      {
        q: "What is FIRE?",
        a: "Financial Independence, Retire Early: saving and investing aggressively so your investments cover your living costs, letting you stop working — or work only on what you choose — years before normal retirement age.",
      },
      {
        q: "How is the FIRE number calculated?",
        a: "Annual expenses × 25. That comes from the 4% rule: if you withdraw 4% of your investments a year, $1,000,000 pays $40,000 a year.",
      },
      {
        q: "Is the 4% rule safe?",
        a: "It held up in almost every 30-year period in US market history, but it is a rule of thumb, not a guarantee. Longer retirements, high fees or retiring into a market crash all make it less safe — many early retirees plan on 3.5% instead.",
      },
      {
        q: "What counts as annual expenses?",
        a: "Everything you will spend in retirement: housing, food, transport, insurance, travel and fun. Be honest — underestimating spending is the most common FIRE mistake.",
      },
    ],
  },
  {
    slug: "w-4-withholding-calculator",
    name: "W-4 Withholding Calculator",
    category: "Finance",
    short: "Estimate federal tax withheld from each paycheck under the 2025 W-4 method.",
    keywords:
      "w-4 withholding calculator, federal withholding calculator, tax withholding calculator, paycheck withholding calculator, w4 calculator 2025",
    inputs: [
      numberInput("pay", "Gross pay per paycheck", "2500", "$"),
      selectInput("freq", "How often are you paid?", "26", [
        ["52", "Weekly (52 paychecks)"],
        ["26", "Every two weeks (26 paychecks)"],
        ["24", "Twice a month (24 paychecks)"],
        ["12", "Monthly (12 paychecks)"],
      ]),
      statusSelect(),
      numberInput("kids", "Qualifying children under 17", "0"),
      numberInput("other", "Other dependents", "0"),
    ],
    compute: (v) => {
      const pay = N(v.pay);
      const periods = N(v.freq) || 26;
      const status = (String(v.status ?? "single") as FilingStatus) || "single";
      const kids = N(v.kids);
      const other = N(v.other);
      const annualGross = pay * periods;
      const credits = kids * 2000 + other * 500;
      const taxable = Math.max(0, annualGross - STANDARD_DEDUCTION[status] - credits);
      const { tax, marginal } = federalTax(taxable, status);
      return [
        { label: "Federal withholding per paycheck", value: money(tax / periods) },
        { label: "Annual federal tax (estimated)", value: money(tax) },
        { label: "Annual gross pay", value: money(annualGross) },
        { label: "Taxable income", value: money(taxable) },
        { label: "Marginal bracket", value: `${m(marginal * 100, 0)}%` },
        {
          label: "Net per paycheck (federal tax only)",
          value: `${money(pay - tax / periods)} — before state tax, FICA and deductions`,
        },
      ];
    },
    about:
      `Estimate the federal income tax withheld from each paycheck using the 2025 W-4 method: your pay is annualised, the standard deduction (${STATUS_LABEL.single} $15,750; married filing jointly $31,500; head of household $23,625) and dependent credits ($2,000 per qualifying child under 17, $500 per other dependent) are subtracted, the 2025 brackets are applied, and the result is divided back across your pay periods. ${TAX_DISCLAIMER}`,
    formula:
      "Annual gross = pay per period × periods per year. Taxable income = annual gross − standard deduction − dependent credits. Federal tax uses the 2025 brackets (10% to $11,925, 12% to $48,475, 22% to $103,350 for a single filer). Withholding per paycheck = annual tax ÷ periods per year.",
    example:
      "A single filer paid $2,500 every two weeks earns $65,000 a year. After the $15,750 standard deduction, taxable income is $49,250 and the estimated federal tax is $5,749 a year — about $221.12 withheld per paycheck.",
    howToUse: [
      "Enter your gross pay per paycheck and how often you are paid.",
      "Choose your filing status and count your dependents.",
      "Read the estimated withholding per paycheck and for the year.",
    ],
    details: [
      {
        heading: "What the W-4 does",
        body: "The W-4 tells your employer how much federal tax to take from each paycheck. It accounts for your filing status, dependents, multiple jobs and other adjustments. This calculator follows the same annualised method the IRS tables use: it annualises your pay, subtracts the standard deduction and dependent credits, applies the brackets, and divides back across your pay periods. Real withholding can differ with bonuses, multiple jobs or itemised deductions.",
      },
      {
        heading: "Why withholding is not your tax bill",
        body: "Withholding is a prepayment, not the final answer. At tax time you compare what was withheld with what you actually owe: too much withheld means a refund, too little means a balance due (and possibly a penalty). If the estimate here is far from your real paycheck, check your W-4 — a new job, a raise, a marriage or a new child are all reasons to update it.",
      },
    ],
    tips: [
      "A big refund means you lent the government money interest-free all year.",
      "Update your W-4 after a new job, a raise, a marriage or a new child.",
      "This covers federal tax only — state tax and FICA come out separately.",
    ],
    faqs: [
      {
        q: "What is federal withholding?",
        a: "The federal income tax your employer takes from each paycheck and sends to the IRS on your behalf. It is a prepayment of the tax you will owe for the year.",
      },
      {
        q: "How is withholding calculated?",
        a: "Your pay is annualised, the standard deduction and dependent credits are subtracted, the 2025 tax brackets are applied, and the result is divided across your pay periods.",
      },
      {
        q: "Why is my withholding different from this estimate?",
        a: "Real withholding follows IRS tables and your exact W-4, including multiple jobs, extra withholding and itemised deductions this calculator cannot see. Use the result as a close estimate.",
      },
      {
        q: "Does this include state tax or Social Security?",
        a: "No — this is federal income tax only. State tax, Social Security and Medicare are withheld separately.",
      },
    ],
  },
  {
    slug: "salary-raise-calculator",
    name: "Salary Raise Calculator",
    category: "Finance",
    short: "Your new salary after a raise — yearly, monthly and hourly.",
    keywords:
      "salary raise calculator, pay raise calculator, raise calculator salary, new salary calculator, salary increase calculator",
    inputs: [
      numberInput("salary", "Current annual salary", "65000", "$"),
      numberInput("pct", "Raise", "5", "%"),
      numberInput("hours", "Hours per week", "40"),
    ],
    compute: (v) => {
      const salary = N(v.salary);
      const pct = N(v.pct);
      const hours = N(v.hours) || 40;
      const increase = salary * (pct / 100);
      const newSalary = salary + increase;
      return [
        { label: "New annual salary", value: money(newSalary) },
        { label: "Increase per year", value: money(increase) },
        { label: "Increase per month", value: money(increase / 12) },
        { label: "New monthly pay", value: money(newSalary / 12) },
        { label: "New hourly rate", value: money(newSalary / (hours * 52)) },
      ];
    },
    about:
      "Work out your new salary after a raise: enter your current pay and the raise as a percentage, and see the new annual salary plus the increase broken down by year, month and hour. A 5% raise on $65,000 is $3,250 a year — $271 a month before tax. Remember the figures are gross: tax, retirement contributions and other deductions come out of the new salary too, so the take-home increase is smaller.",
    formula:
      "Increase = current salary × raise %. New salary = current salary + increase. Monthly = annual ÷ 12. Hourly = annual ÷ (hours per week × 52).",
    example:
      "A 5% raise on a $65,000 salary adds $3,250 a year, taking the salary to $68,250 — $5,687.50 a month and $32.81 an hour at 40 hours a week.",
    howToUse: [
      "Enter your current annual salary and the raise percentage.",
      "Adjust the hours per week if you work something other than 40.",
      "Read your new salary, and the increase per year, month and hour.",
    ],
    details: [
      {
        heading: "Percentage vs. amount",
        body: "Raises are usually quoted as percentages, which makes them easy to compare — but a percentage of a small salary is a small amount. A 5% raise on $40,000 is $2,000; the same 5% on $120,000 is $6,000. When comparing offers, look at the amount and the new total, not just the percentage.",
      },
      {
        heading: "The raise is gross, not take-home",
        body: "The increase shown here is before tax. A $3,250 raise does not add $3,250 to your bank account: federal and state tax, Social Security and Medicare all take a share, and a higher salary can push part of your pay into a higher bracket. Use the paycheck calculator to see what the raise is worth after tax.",
      },
    ],
    tips: [
      "Compare offers by the new total, not just the percentage.",
      "Check the after-tax value with the paycheck calculator.",
      "A raise also lifts anything tied to salary, like 401(k) matches.",
    ],
    faqs: [
      {
        q: "How do I calculate a salary raise?",
        a: "Multiply your current salary by the raise percentage, then add it on. A 5% raise on $65,000 is $65,000 × 0.05 = $3,250, so the new salary is $68,250.",
      },
      {
        q: "What is a good raise percentage?",
        a: "It varies by industry and year, but 3–5% a year is typical for a standard performance raise, and more for a promotion or a move to a new role. Anything below inflation is a pay cut in real terms.",
      },
      {
        q: "Is the raise amount before or after tax?",
        a: "Before tax. Tax, Social Security, Medicare and retirement contributions all come out of the new salary, so the take-home increase is smaller.",
      },
      {
        q: "How do I work out my new hourly rate?",
        a: "Divide the new annual salary by hours per week × 52. At 40 hours a week, $68,250 a year is $68,250 ÷ 2,080 = $32.81 an hour.",
      },
    ],
  },
  {
    slug: "property-tax-calculator",
    name: "Property Tax Calculator",
    category: "Finance",
    short: "Annual and monthly property tax from home value and tax rate.",
    keywords:
      "property tax calculator, home property tax calculator, real estate tax calculator, property tax by state, how much property tax will i pay",
    inputs: [
      numberInput("value", "Home value", "400000", "$"),
      numberInput("rate", "Property tax rate", "1.1", "%"),
    ],
    compute: (v) => {
      const value = N(v.value);
      const rate = N(v.rate) / 100;
      const annual = value * rate;
      return [
        { label: "Annual property tax", value: money(annual) },
        { label: "Monthly property tax", value: money(annual / 12) },
        { label: "Weekly property tax", value: money(annual / 52) },
        { label: "Tax per $1,000 of value", value: money(rate * 1000) },
      ];
    },
    about:
      "Estimate your property tax from your home's value and the local tax rate. Property tax is usually charged by the county or town as a percentage of the assessed value, and it is normally paid monthly as part of the mortgage payment (the lender holds it in escrow) or directly twice a year. Rates vary enormously by location — under 0.5% in some states, over 2% in others — so the result is only as good as the rate you enter, and it is an estimate, not a bill.",
    formula:
      "Annual tax = home value × tax rate. Monthly tax = annual tax ÷ 12. For example, a $400,000 home at 1.1% pays $4,400 a year, or about $367 a month.",
    example:
      "A $400,000 home taxed at 1.1% owes $4,400 a year — $366.67 a month, or $11 per $1,000 of value.",
    howToUse: [
      "Enter your home's assessed value (usually close to its market value).",
      "Enter your local tax rate as a percentage — check your county's website if you are unsure.",
      "Read the annual, monthly and weekly tax.",
    ],
    details: [
      {
        heading: "Assessed value is not always market value",
        body: "The tax is charged on the assessed value, which is the county's estimate of what the home is worth — and it is often lower than the sale price, sometimes much lower. Some places also cap how fast the assessed value can rise each year, or exempt part of it (a homestead exemption). If the assessed value on your tax bill differs from the market value, use the assessed value here.",
      },
      {
        heading: "Rates vary by location",
        body: "US property tax rates run from under 0.3% of value a year in Hawaii and Alabama to over 2% in New Jersey, Illinois and Connecticut — a sevenfold difference. Within a state, rates vary by county, school district and town. The average effective rate nationally is roughly 1%, but check your own county: the rate on your tax bill is the one that matters.",
      },
    ],
    tips: [
      "Use the assessed value from your tax bill, not the sale price.",
      "Check your county's rate — it varies far more than most people expect.",
      "Appeal the assessment if you think the value is too high.",
    ],
    faqs: [
      {
        q: "How is property tax calculated?",
        a: "Home value × tax rate. A $400,000 home at 1.1% pays $4,400 a year. The rate is set by your county, town and school district.",
      },
      {
        q: "What is a typical property tax rate?",
        a: "The national average is roughly 1% of value a year, but it ranges from under 0.3% to over 2% depending on the state and county.",
      },
      {
        q: "Do I pay property tax monthly?",
        a: "Usually yes, as part of your mortgage payment — the lender collects it monthly and holds it in escrow, then pays the bill for you. Without a mortgage you normally pay directly, once or twice a year.",
      },
      {
        q: "Can I lower my property tax?",
        a: "Sometimes: check for exemptions (homestead, senior, veteran), and appeal the assessed value if you can show similar homes are assessed lower.",
      },
    ],
  },
];
