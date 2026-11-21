// Batch 26 — finance tools: salary conversion, 401(k), Roth IRA, rent vs
// buy, home affordability, overtime pay, capital gains tax.
// All figures are US federal 2025. Every tax/retirement result is labelled
// an estimate — none of this is financial or tax advice.
import type { Calc } from "../tool-types";
import { fmt } from "../calculators";
import { M, N, numberInput, selectInput } from "./shared";

const m = (n: number) => fmt(n, 2);
const money = (n: number) => `$${m(n)}`;

type FilingStatus = "single" | "married" | "hoh";

const STATUS_OPTIONS: { v: FilingStatus; l: string }[] = [
  { v: "single", l: "Single" },
  { v: "married", l: "Married filing jointly" },
  { v: "hoh", l: "Head of household" },
];

/** 2025 long-term capital-gains thresholds: [0% up to, 15% up to]. */
const CG_THRESHOLDS: Record<FilingStatus, [number, number]> = {
  single: [48350, 533400],
  married: [96700, 600050],
  hoh: [64750, 566700],
};

/** Future value of a balance plus equal end-of-year contributions. */
function futureValue(balance: number, yearly: number, rate: number, years: number): number {
  const r = rate / 100;
  if (r === 0) return balance + yearly * years;
  const growth = Math.pow(1 + r, years);
  return balance * growth + yearly * ((growth - 1) / r);
}

/** Monthly mortgage payment on principal P at annual rate % over n months. */
function mortgagePayment(principal: number, annualRate: number, months: number): number {
  const r = annualRate / 12 / 100;
  if (months <= 0) return NaN;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

export const batch26FinanceTools: Calc[] = [
  {
    slug: "salary-conversion-calculator",
    name: "Salary Conversion Calculator",
    category: "Finance",
    short: "Convert pay between hourly, weekly, monthly and annual — with your hours per week.",
    keywords:
      "salary conversion calculator, hourly to salary calculator, annual to hourly calculator, salary converter, convert salary to hourly, weekly to annual pay",
    popular: true,
    inputs: [
      { key: "amount", label: "Pay amount", def: "65000" },
      selectInput("from", "This amount is", "annual", [
        ["hourly", "Hourly"],
        ["weekly", "Weekly"],
        ["monthly", "Monthly"],
        ["annual", "Annual"],
      ]),
      { key: "hours", label: "Hours worked per week", def: "40" },
    ],
    compute: (v) => {
      const amount = N(v.amount);
      const hours = N(v.hours) || 40;
      const weeks = 52;
      const annual =
        v.from === "hourly"
          ? amount * hours * weeks
          : v.from === "weekly"
            ? amount * weeks
            : v.from === "monthly"
              ? amount * 12
              : amount;
      return [
        { label: "Hourly rate", value: money(annual / (hours * weeks)) },
        { label: "Weekly pay", value: money(annual / weeks) },
        { label: "Monthly pay", value: money(annual / 12) },
        { label: "Annual salary", value: money(annual) },
        { label: "Based on", value: `${fmt(hours, 0)} hours/week, ${weeks} weeks/year` },
      ];
    },
    about:
      "Convert a salary between hourly, weekly, monthly and annual pay in one step. Enter what you earn and how often, plus the hours you work each week, and see the same pay expressed every other way — the conversion assumes 52 working weeks a year and uses your own hours-per-week figure, so a 35-hour week and a 45-hour week give different hourly rates for the same annual salary.",
    formula:
      "Annual = hourly × hours per week × 52; weekly = annual ÷ 52; monthly = annual ÷ 12; hourly = annual ÷ (hours per week × 52).",
    example:
      "A $65,000 annual salary at 40 hours a week is $31.25 an hour, $1,250 a week and $5,416.67 a month. The same $65,000 at 35 hours a week is $35.71 an hour.",
    howToUse: [
      "Enter the pay amount you know.",
      "Say whether that amount is hourly, weekly, monthly or annual.",
      "Enter your usual hours per week — it changes the hourly rate.",
      "Read the same pay expressed as hourly, weekly, monthly and annual.",
    ],
    details: [
      {
        heading: "Why hours per week matter",
        body: "An annual salary only becomes an hourly rate once you know the hours. $65,000 a year is $31.25 an hour at 40 hours a week, but $35.71 at 35 hours and $27.78 at 45 hours. Two jobs with the same salary can pay very different hourly rates, which is why this converter asks for your hours instead of assuming them.",
      },
      {
        heading: "What the conversion leaves out",
        body: "These are gross figures before tax, and the converter assumes you are paid for 52 weeks a year — it does not deduct unpaid leave, and it does not include overtime, bonuses, tips or benefits. For what actually lands in your bank account, use the paycheck calculator, which estimates tax and deductions.",
      },
    ],
    tips: [
      "Compare job offers on the hourly rate, not the headline salary — it is the only figure that accounts for the hours.",
      "If your hours vary, use your average week over the last month.",
      "A 4-day week at the same salary is a pay rise per hour — check it here.",
    ],
    faqs: [
      {
        q: "How do I convert an annual salary to an hourly rate?",
        a: "Divide the annual salary by the number of hours you work in a year: hours per week × 52. $65,000 at 40 hours a week is $65,000 ÷ 2,080 = $31.25 an hour.",
      },
      {
        q: "How many hours a year is a full-time job?",
        a: "At 40 hours a week for 52 weeks it is 2,080 hours. This calculator uses your own hours per week rather than assuming 40, so part-time and overtime schedules convert correctly.",
      },
      {
        q: "Is monthly pay just annual pay divided by 12?",
        a: "Yes — monthly pay is annual ÷ 12. Weekly pay is annual ÷ 52, which is slightly different from monthly ÷ 4, because a month is a little longer than 4 weeks.",
      },
    ],
  },
  {
    slug: "401k-calculator",
    name: "401(k) Calculator",
    category: "Finance",
    short: "Project how your 401(k) grows — balance, contributions, employer match and returns.",
    keywords:
      "401k calculator, 401k retirement calculator, 401k growth calculator, 401k contribution calculator, how much will my 401k be worth",
    popular: true,
    inputs: [
      { key: "balance", label: "Current 401(k) balance", def: "10000" },
      { key: "contrib", label: "Your contribution per year", def: "12000" },
      { key: "match", label: "Employer match per year", def: "3000" },
      { key: "rate", label: "Expected annual return", def: "7", suffix: "%" },
      { key: "years", label: "Years until retirement", def: "30" },
    ],
    compute: (v) => {
      const balance = N(v.balance);
      const yearly = N(v.contrib) + N(v.match);
      const rate = N(v.rate);
      const years = N(v.years);
      const fv = futureValue(balance, yearly, rate, years);
      const totalContrib = yearly * years;
      return [
        { label: "Projected balance", value: money(fv) },
        { label: "Your contributions + match", value: money(totalContrib) },
        { label: "Starting balance", value: money(balance) },
        { label: "Investment growth", value: money(fv - balance - totalContrib) },
        { label: "2025 contribution limit (under 50)", value: "$23,500" },
      ];
    },
    about:
      "Project what your 401(k) could be worth at retirement from your current balance, yearly contributions, employer match and an assumed annual return. The 2025 employee contribution limit is $23,500 if you are under 50, or $31,000 with the $7,500 catch-up contribution at 50 and over — employer matches do not count toward that limit. This is a projection, not a promise: real returns vary every year, and the result assumes steady end-of-year contributions and a constant return.",
    formula:
      "Future value = balance × (1 + r)^n + yearly × ((1 + r)^n − 1) ÷ r, where r is the annual return and n the number of years. Yearly = your contribution + employer match.",
    example:
      "Starting with $10,000, contributing $12,000 a year with a $3,000 employer match, at a 7% annual return for 30 years, the projection is $1,493,034.35 — $450,000 of contributions plus $1,033,034.35 of growth on top of the starting balance.",
    howToUse: [
      "Enter your current 401(k) balance.",
      "Enter what you contribute each year, and your employer match per year.",
      "Set the annual return you expect — 7% is a common long-run planning figure.",
      "Enter the years until you plan to retire and read the projected balance.",
    ],
    details: [
      {
        heading: "The 2025 limits",
        body: "For 2025 you can contribute up to $23,500 of your own pay to a 401(k), or $31,000 if you are 50 or older thanks to the $7,500 catch-up. Employer matching contributions are extra and do not count toward your limit. The combined employee-plus-employer limit for 2025 is $70,000 ($77,500 with catch-up). If your yearly contribution above is over the limit, the projection still runs — treat the limit line as a check, not a cap.",
      },
      {
        heading: "Why the match matters most",
        body: "An employer match is an instant, guaranteed return on your contribution — a 100% match on the first 3% of pay doubles that money on day one, before any investment growth. If your plan offers a match, contributing at least enough to get the full match is almost always the best first move, because no investment reliably beats a guaranteed 100%.",
      },
      {
        heading: "What this projection assumes",
        body: "The calculation compounds once a year at a fixed rate, with contributions made at the end of each year. Real 401(k)s compound more often, returns swing up and down, fees take a small cut, and your contributions usually rise with your salary. The result is an estimate for planning — it is not financial advice and not a forecast of what you will actually have.",
      },
    ],
    tips: [
      "Always contribute at least enough to get your full employer match — it is free money.",
      "A 1% higher return compounds to a much larger balance over 30 years; fees matter as much as returns.",
      "Raise your contribution by 1% each year when you get a pay rise and you will barely feel it.",
    ],
    faqs: [
      {
        q: "How much can I contribute to a 401(k) in 2025?",
        a: "$23,500 if you are under 50, or $31,000 if you are 50 or older (the extra $7,500 is the catch-up contribution). Employer matches do not count toward your limit.",
      },
      {
        q: "What return should I assume for a 401(k) projection?",
        a: "Many planners use 6–8% a year as a long-run average for a diversified stock-heavy portfolio, before inflation. Try 5% for a cautious view and 8% for an optimistic one — the gap between them shows how much returns matter.",
      },
      {
        q: "Is a 401(k) projection a guarantee?",
        a: "No. It assumes a steady return every year, but real markets go up and down. The projection is a planning estimate, not financial advice — for decisions about your retirement savings, speak to a qualified financial adviser.",
      },
    ],
  },
  {
    slug: "roth-ira-calculator",
    name: "Roth IRA Calculator",
    category: "Finance",
    short: "Project tax-free Roth IRA growth — contributions, returns and years to retirement.",
    keywords:
      "roth ira calculator, roth ira growth calculator, roth ira contribution calculator, how much will my roth ira be worth, roth ira vs traditional",
    popular: true,
    inputs: [
      { key: "balance", label: "Current Roth IRA balance", def: "5000" },
      { key: "contrib", label: "Your contribution per year", def: "7000" },
      { key: "rate", label: "Expected annual return", def: "7", suffix: "%" },
      { key: "years", label: "Years until retirement", def: "30" },
    ],
    compute: (v) => {
      const balance = N(v.balance);
      const yearly = N(v.contrib);
      const rate = N(v.rate);
      const years = N(v.years);
      const fv = futureValue(balance, yearly, rate, years);
      const totalContrib = yearly * years;
      return [
        { label: "Projected balance", value: money(fv) },
        { label: "Total contributions", value: money(totalContrib) },
        { label: "Starting balance", value: money(balance) },
        { label: "Tax-free growth", value: money(fv - balance - totalContrib) },
        { label: "2025 contribution limit (under 50)", value: "$7,000" },
      ];
    },
    about:
      "Project what a Roth IRA could be worth at retirement. You contribute after-tax money — the 2025 limit is $7,000 under 50 or $8,000 at 50 and over — and qualified withdrawals in retirement are completely tax-free, including all the growth. That tax-free growth is the whole point of a Roth: the projection below shows how much of the final balance is your contributions and how much is growth you will never pay tax on.",
    formula:
      "Future value = balance × (1 + r)^n + yearly × ((1 + r)^n − 1) ÷ r, where r is the annual return and n the number of years. Growth = future value − balance − total contributions.",
    example:
      "Starting with $5,000 and contributing $7,000 a year at a 7% annual return for 30 years, the projection is $699,286.78 — $210,000 of contributions plus $484,286.78 of growth, all of it tax-free on a qualified withdrawal.",
    howToUse: [
      "Enter your current Roth IRA balance.",
      "Enter your yearly contribution — up to the $7,000 limit under 50.",
      "Set the annual return you expect — 7% is a common planning figure.",
      "Enter the years until retirement and read the projected balance and tax-free growth.",
    ],
    details: [
      {
        heading: "The 2025 limits and income rules",
        body: "For 2025 the Roth IRA contribution limit is $7,000 if you are under 50, or $8,000 at 50 and over. Unlike a 401(k), there is also an income limit: the ability to contribute directly phases out for higher earners (in 2025 the phase-out starts around $150,000 of modified adjusted gross income for single filers and $236,000 for married couples filing jointly). This calculator does not check your income — the limit line is a reminder to check whether you are eligible.",
      },
      {
        heading: "Roth vs traditional IRA",
        body: "A traditional IRA gives you a tax break now and taxes withdrawals later; a Roth takes the tax now and never taxes the money again. A Roth usually wins if you expect your tax rate in retirement to be the same or higher than today, and it has two extra perks: no required minimum distributions for the original owner, and your contributions (not the growth) can be withdrawn at any time without penalty.",
      },
      {
        heading: "What this projection assumes",
        body: "The calculation compounds once a year at a fixed rate with end-of-year contributions. Real returns vary, and the result assumes you contribute the full amount every year. It is an estimate for planning, not financial advice — for decisions about retirement accounts, speak to a qualified financial adviser.",
      },
    ],
    tips: [
      "Contribute early in the year if you can — the money gets up to twelve extra months of growth.",
      "If your income is above the Roth limit, ask a tax professional about a backdoor Roth IRA.",
      "Young earners in a low tax bracket usually get the most from a Roth, because the tax they pay now is small.",
    ],
    faqs: [
      {
        q: "How much can I contribute to a Roth IRA in 2025?",
        a: "$7,000 if you are under 50, or $8,000 if you are 50 or older. There is also an income limit — the ability to contribute directly phases out for higher earners.",
      },
      {
        q: "Are Roth IRA withdrawals really tax-free?",
        a: "Qualified withdrawals are tax-free: the account must be open at least five years and you must be 59½ or older (with exceptions for disability or a first home). Your contributions can be withdrawn at any time without tax or penalty.",
      },
      {
        q: "What is the difference between a Roth IRA and a 401(k)?",
        a: "A 401(k) is through your employer with much higher limits ($23,500 for 2025) and often an employer match; a Roth IRA is an account you open yourself with a $7,000 limit but tax-free withdrawals. Many people use both.",
      },
    ],
  },
  {
    slug: "rent-vs-buy-calculator",
    name: "Rent vs Buy Calculator",
    category: "Finance",
    short: "Compare the monthly cost of renting with buying the same home — mortgage, rent and equity.",
    keywords:
      "rent vs buy calculator, should i rent or buy, renting vs buying a house calculator, buy vs rent comparison, rent or buy a home",
    popular: true,
    inputs: [
      { key: "rent", label: "Monthly rent", def: "2000" },
      { key: "price", label: "Home price", def: "400000" },
      { key: "down", label: "Down payment", def: "80000" },
      { key: "rate", label: "Mortgage rate", def: "6.5", suffix: "%" },
      { key: "term", label: "Mortgage term", def: "30", suffix: "years" },
      { key: "years", label: "Years you will stay", def: "5" },
    ],
    compute: (v) => {
      const rent = N(v.rent);
      const price = N(v.price);
      const down = N(v.down);
      const rate = N(v.rate);
      const termMonths = N(v.term) * 12;
      const years = N(v.years);
      const principal = Math.max(0, price - down);
      const monthly = mortgagePayment(principal, rate, termMonths);
      const months = years * 12;
      const r = rate / 12 / 100;
      const growth = Math.pow(1 + r, months);
      const balance = principal * growth - monthly * ((growth - 1) / r);
      const principalPaid = principal - balance;
      return [
        { label: "Monthly mortgage payment", value: money(monthly) },
        { label: "Monthly rent", value: money(rent) },
        { label: "Mortgage minus rent (monthly)", value: money(monthly - rent) },
        { label: `Total rent over ${fmt(years, 0)} years`, value: money(rent * months) },
        { label: `Total mortgage payments over ${fmt(years, 0)} years`, value: money(monthly * months) },
        { label: "Principal paid off", value: money(principalPaid) },
        { label: "Your equity after that time", value: money(down + principalPaid) },
      ];
    },
    about:
      "Compare renting with buying the same home, side by side. The calculator works out the monthly mortgage payment on the home price minus your down payment, compares it with the rent, and shows what happens over the years you plan to stay — including the part people forget: every mortgage payment pays down principal, so a buyer builds equity while a renter's payments are gone for good. This comparison excludes property tax, insurance, maintenance and changes in home prices, so treat it as a starting point, not a final answer.",
    formula:
      "Monthly mortgage = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), where P is the loan amount, r the monthly rate and n the number of payments. Equity after k months = down payment + principal repaid.",
    example:
      "Renting at $2,000 a month versus buying a $400,000 home with $80,000 down at 6.5% for 30 years: the mortgage is $2,022.62 a month — only $22.62 more than rent. After 5 years you will have paid $121,357.06 in mortgage payments versus $120,000 in rent, but you will have $100,444.87 of equity.",
    howToUse: [
      "Enter the monthly rent for a comparable home.",
      "Enter the home price, your down payment, the mortgage rate and term.",
      "Enter how many years you expect to stay.",
      "Compare the monthly payments — then look at the equity line, which is what renting never gives you.",
    ],
    details: [
      {
        heading: "What the monthly payment leaves out",
        body: "The mortgage payment here is principal and interest only. A real monthly housing cost also includes property tax, homeowner's insurance and usually PMI if your down payment is under 20%, plus maintenance — roughly 1% of the home's value a year. Rent, by contrast, is usually the whole housing cost. Add those ownership costs before deciding the two are close.",
      },
      {
        heading: "Why how long you stay decides it",
        body: "Buying has large upfront costs — closing costs, moving, furnishing — that only pay off if you stay. In the first years of a mortgage almost every payment is interest, so little equity builds. As a rule of thumb, buying usually wins if you will stay at least five to seven years; under that, renting often comes out ahead once all the costs are counted.",
      },
      {
        heading: "Equity is the renter's missing line",
        body: "A renter's $120,000 over five years buys nothing lasting. A buyer paying a similar amount ends the same five years owning a share of the home — in the example, $100,444.87 of equity from the down payment plus principal repaid. That is the strongest argument for buying, and it is the line this calculator exists to show.",
      },
    ],
    tips: [
      "Always add tax, insurance and maintenance to the mortgage before comparing with rent.",
      "If you might move within a few years, renting usually wins — buying costs take years to recover.",
      "A bigger down payment cuts both the monthly payment and the interest paid over the life of the loan.",
    ],
    faqs: [
      {
        q: "Is it cheaper to rent or buy?",
        a: "It depends on the prices, the mortgage rate and how long you stay. This calculator compares the monthly payments and the equity built — buying usually wins over 5–7+ years in one place, renting usually wins for short stays or very expensive markets.",
      },
      {
        q: "Does this calculator include property tax and insurance?",
        a: "No — the mortgage payment is principal and interest only. Add your local property tax, homeowner's insurance and maintenance (roughly 1% of the home's value a year) to the buying side for a fair comparison.",
      },
      {
        q: "What is equity and why does it matter?",
        a: "Equity is the part of the home you own: your down payment plus the principal you have repaid. Rent builds no equity at all, which is why two similar monthly payments can still leave the buyer far ahead after five years.",
      },
    ],
  },
  {
    slug: "home-affordability-calculator",
    name: "Home Affordability Calculator",
    category: "Finance",
    short: "How much house can you afford? Max price from income, debts, down payment and rate.",
    keywords:
      "home affordability calculator, how much house can i afford, house affordability calculator, mortgage affordability calculator, how much home can i afford",
    popular: true,
    inputs: [
      { key: "income", label: "Gross annual income", def: "100000" },
      { key: "debts", label: "Monthly debt payments", def: "500" },
      { key: "down", label: "Down payment saved", def: "50000" },
      { key: "rate", label: "Mortgage rate", def: "6.5", suffix: "%" },
      { key: "term", label: "Mortgage term", def: "30", suffix: "years" },
    ],
    compute: (v) => {
      const income = N(v.income);
      const debts = N(v.debts);
      const down = N(v.down);
      const rate = N(v.rate);
      const months = N(v.term) * 12;
      const monthlyIncome = income / 12;
      const housingCap = monthlyIncome * 0.28;
      const totalCap = monthlyIncome * 0.36 - debts;
      const maxPayment = Math.max(0, Math.min(housingCap, totalCap));
      const r = rate / 12 / 100;
      const maxLoan = r === 0 ? maxPayment * months : maxPayment * ((1 - Math.pow(1 + r, -months)) / r);
      return [
        { label: "Maximum monthly housing payment", value: money(maxPayment) },
        { label: "28% of gross monthly income", value: money(housingCap) },
        { label: "36% debt limit less your debts", value: money(totalCap) },
        { label: "Maximum mortgage", value: money(maxLoan) },
        { label: "Maximum home price", value: money(maxLoan + down) },
      ];
    },
    about:
      "Work out the most expensive home you can reasonably afford from your income, existing debts, down payment and the mortgage rate. The calculator uses the standard 28/36 rule that lenders use as a guide: housing costs should be no more than 28% of your gross monthly income, and all debts including housing no more than 36%. Whichever limit is lower sets your maximum monthly payment, and that payment sets the maximum loan — add your down payment and you have the maximum home price.",
    formula:
      "Max payment = min(28% of gross monthly income, 36% of gross monthly income − monthly debts). Max loan = payment × (1 − (1 + r)^−n) ÷ r. Max price = max loan + down payment.",
    example:
      "On $100,000 of income with $500 a month of other debts, $50,000 saved and a 6.5% 30-year mortgage: 28% of monthly income is $2,333.33 and the 36% limit leaves $2,500 after debts, so the payment cap is $2,333.33. That supports a $369,158.58 mortgage and a $419,158.58 home.",
    howToUse: [
      "Enter your gross annual income before tax.",
      "Enter your other monthly debt payments — car, cards, student loans.",
      "Enter your down payment and the mortgage rate and term.",
      "Read the maximum monthly payment, mortgage and home price.",
    ],
    details: [
      {
        heading: "The 28/36 rule",
        body: "Lenders traditionally like two ratios: the front-end ratio (housing costs ÷ gross income) at 28% or below, and the back-end ratio (all debts including housing ÷ gross income) at 36% or below. Some lenders accept up to 43% or even 50% on the back-end ratio, especially for strong credit — but borrowing to the absolute maximum leaves no room for repairs, rate rises or a lost income. The 28/36 rule is a guide to comfortable affordability, not a lender's final word.",
      },
      {
        heading: "What this leaves out",
        body: "The payment here is principal and interest only. A lender's real housing figure also includes property tax, homeowner's insurance and PMI if the down payment is under 20%, which can add hundreds a month. It also ignores your credit score, which sets the rate you are actually offered, and your cash reserves. Use the result as a ceiling to shop under, not a target to hit.",
      },
      {
        heading: "Debts matter as much as income",
        body: "Because the 36% limit counts all debts, paying off a car loan or a credit card before house-hunting can raise the home you can afford more than a pay rise of the same size. Every $100 of monthly debt you remove frees up roughly $100 of monthly mortgage payment — about $16,000 of home price at current rates.",
      },
    ],
    tips: [
      "Shop below the maximum — the calculator's number is a ceiling, not a goal.",
      "Paying down monthly debts before applying raises your affordable price.",
      "Remember tax, insurance and PMI sit on top of the principal-and-interest payment shown here.",
    ],
    faqs: [
      {
        q: "How much house can I afford on $100,000 a year?",
        a: "By the 28/36 rule, about $2,333 a month of housing payment, which at 6.5% over 30 years supports roughly a $419,000 home with $50,000 down. Your debts and credit score move that number up or down.",
      },
      {
        q: "What is the 28/36 rule?",
        a: "A lending guideline: housing costs at most 28% of gross monthly income, and all debts including housing at most 36%. It is a comfort guide — some lenders allow higher ratios, but higher ratios leave less room for everything else.",
      },
      {
        q: "Does a bigger down payment mean a more expensive house?",
        a: "Yes, dollar for dollar: the maximum home price is the maximum mortgage plus your down payment. A bigger down payment also cuts the monthly payment, the interest paid and usually removes PMI.",
      },
    ],
  },
  {
    slug: "overtime-pay-calculator",
    name: "Overtime Pay Calculator",
    category: "Finance",
    short: "Weekly pay with overtime — regular hours, overtime hours and your multiplier.",
    keywords:
      "overtime pay calculator, overtime calculator, time and a half calculator, overtime wages calculator, calculate overtime pay, weekly overtime pay",
    inputs: [
      { key: "rate", label: "Hourly rate", def: "25" },
      { key: "regular", label: "Regular hours worked", def: "40" },
      { key: "ot", label: "Overtime hours worked", def: "10" },
      { key: "mult", label: "Overtime multiplier", def: "1.5", suffix: "×" },
    ],
    compute: (v) => {
      const rate = N(v.rate);
      const regular = N(v.regular);
      const ot = N(v.ot);
      const mult = N(v.mult);
      const regularPay = rate * regular;
      const otPay = rate * mult * ot;
      const total = regularPay + otPay;
      const totalHours = regular + ot;
      return [
        { label: "Regular pay", value: money(regularPay) },
        { label: "Overtime pay", value: money(otPay) },
        { label: "Total weekly pay", value: money(total) },
        { label: "Total hours", value: fmt(totalHours, 0) },
        { label: "Effective hourly rate", value: money(totalHours ? total / totalHours : 0) },
      ];
    },
    about:
      "Work out a week's pay when some of it is overtime. Enter your hourly rate, your regular hours and your overtime hours, and the calculator pays the regular hours at your normal rate and the overtime hours at your multiplier — time-and-a-half (1.5×) is the default, the rate the US Fair Labor Standards Act requires for hours over 40 in a week. It also shows the effective hourly rate across the whole week, so you can see what the overtime is really worth.",
    formula:
      "Regular pay = rate × regular hours. Overtime pay = rate × multiplier × overtime hours. Total = regular pay + overtime pay. Effective rate = total ÷ total hours.",
    example:
      "At $25 an hour with 40 regular hours and 10 overtime hours at time-and-a-half: regular pay is $1,000, overtime pay is $375, total weekly pay is $1,375, and the effective rate across the 50 hours is $27.5 an hour.",
    howToUse: [
      "Enter your normal hourly rate.",
      "Enter the regular hours and the overtime hours you worked.",
      "Set the multiplier — 1.5 for time-and-a-half, 2 for double time.",
      "Read the regular pay, overtime pay and total for the week.",
    ],
    details: [
      {
        heading: "When overtime is owed",
        body: "Under the US Fair Labor Standards Act, most hourly workers must be paid at least 1.5× their regular rate for hours over 40 in a workweek. Some states and contracts are more generous — California, for example, also requires overtime after 8 hours in a day and double time after 12. Salaried exempt workers are generally not covered, and the rules differ by state, so check your local law if the numbers here do not match your payslip.",
      },
      {
        heading: "Double time and other multipliers",
        body: "Some jobs pay double time (2×) for Sundays, holidays or very long shifts. The multiplier field accepts any value, so set 2 for double time or 1.25 for a smaller premium. The effective hourly rate shows what the whole week worked out to per hour — useful for comparing a week with overtime against a normal week.",
      },
    ],
    tips: [
      "Time-and-a-half (1.5×) is the legal minimum for most US hourly workers over 40 hours.",
      "Check your payslip: overtime is usually shown as a separate line at the higher rate.",
      "A week of heavy overtime raises the effective rate — compare it with your base rate before agreeing to extra shifts.",
    ],
    faqs: [
      {
        q: "How is overtime pay calculated?",
        a: "Overtime hours are paid at the multiplier times your normal rate. At $25 an hour with 10 overtime hours at time-and-a-half, the overtime pay is $25 × 1.5 × 10 = $375, on top of $1,000 of regular pay.",
      },
      {
        q: "What is time-and-a-half?",
        a: "Pay at 1.5 times your normal hourly rate — the standard overtime premium. At $20 an hour, time-and-a-half is $30 an hour. Double time is 2 times the rate.",
      },
      {
        q: "After how many hours is overtime paid?",
        a: "Under US federal law, hours over 40 in a workweek. Some states add daily overtime — for example California requires overtime after 8 hours in a day — and some contracts set their own thresholds.",
      },
    ],
  },
  {
    slug: "capital-gains-tax-calculator",
    name: "Capital Gains Tax Calculator",
    category: "Finance",
    short: "Estimate US federal tax on a long-term capital gain — 2025 rates, by filing status.",
    keywords:
      "capital gains tax calculator, long term capital gains tax calculator, capital gains tax rate 2025, how much tax on capital gains, capital gains tax estimator",
    popular: true,
    inputs: [
      { key: "gain", label: "Long-term capital gain", def: "50000" },
      { key: "other", label: "Other taxable income", def: "30000" },
      selectInput("status", "Filing status", "single", [
        ["single", "Single"],
        ["married", "Married filing jointly"],
        ["hoh", "Head of household"],
      ]),
    ],
    compute: (v) => {
      const gain = N(v.gain);
      const other = N(v.other);
      const status = String(v.status) as FilingStatus;
      const [zeroUpTo, fifteenUpTo] = CG_THRESHOLDS[status] ?? CG_THRESHOLDS.single;
      const zeroRoom = Math.max(0, zeroUpTo - other);
      const zeroPart = Math.min(gain, zeroRoom);
      const fifteenRoom = Math.max(0, fifteenUpTo - Math.max(other, zeroUpTo));
      const fifteenPart = Math.min(Math.max(0, gain - zeroPart), fifteenRoom);
      const twentyPart = Math.max(0, gain - zeroPart - fifteenPart);
      const tax = fifteenPart * 0.15 + twentyPart * 0.2;
      return [
        { label: "Estimated federal tax", value: money(tax) },
        { label: "Taxed at 0%", value: money(zeroPart) },
        { label: "Taxed at 15%", value: money(fifteenPart) },
        { label: "Taxed at 20%", value: money(twentyPart) },
        { label: "Effective rate on the gain", value: `${fmt(gain ? (tax / gain) * 100 : 0, 2)}%` },
        { label: "After-tax gain", value: money(gain - tax) },
      ];
    },
    about:
      "Estimate the US federal tax on a long-term capital gain — profit from an asset held more than a year, such as shares or property. Long-term gains get special low rates for 2025: 0% up to $48,350 of taxable income for single filers ($96,700 married filing jointly, $64,750 head of household), then 15%, then 20% above $533,400 ($600,050 married, $566,700 head of household). Because the gain sits on top of your other income, how much of it falls in each band depends on what you already earn. This is a federal estimate only — it does not include state tax or the 3.8% net investment income tax that can apply at higher incomes — and it is not tax advice.",
    formula:
      "The gain stacks on top of other taxable income. The part below the 0% threshold is untaxed, the part up to the 15% threshold is taxed at 15%, and anything above it at 20%.",
    example:
      "A single filer with $30,000 of other taxable income and a $50,000 long-term gain: $18,350 of the gain still fits under the $48,350 0% threshold, so it is untaxed, and the remaining $31,650 is taxed at 15% — $4,747.5 in total, a 9.5% effective rate on the gain.",
    howToUse: [
      "Enter the long-term capital gain — sale price minus what you paid, including costs.",
      "Enter your other taxable income for the year.",
      "Choose your filing status — the thresholds differ.",
      "Read the tax, the split across the 0%, 15% and 20% bands, and the after-tax gain.",
    ],
    details: [
      {
        heading: "Long-term vs short-term gains",
        body: "Only gains on assets held more than a year get the 0/15/20% rates. Sell within a year and the gain is short-term, taxed as ordinary income at your normal bracket — up to 37%. The one-year line is the single biggest lever in capital-gains tax: holding an asset a few extra weeks can cut the tax rate by more than half.",
      },
      {
        heading: "What this estimate leaves out",
        body: "This is federal tax only. Most states tax capital gains as ordinary income on top, and single filers with modified adjusted gross income over $200,000 ($250,000 married) may owe the extra 3.8% net investment income tax. Losses from other sales can also offset gains. For a real sale, check the figure with a tax professional before you file.",
      },
      {
        heading: "The 2025 thresholds",
        body: "The 0% threshold for 2025 is $48,350 for single filers, $96,700 married filing jointly and $64,750 head of household. The 20% threshold is $533,400 single, $600,050 married and $566,700 head of household. These are the IRS figures for 2025 (Rev. Proc. 2024-40) and they move with inflation each year.",
      },
    ],
    tips: [
      "Holding an asset more than a year usually halves the tax rate or better.",
      "Capital losses offset capital gains — harvesting a loss can cut the tax on a gain.",
      "Your other income decides which band the gain falls in, so the same gain can be taxed at 0% or 20%.",
    ],
    faqs: [
      {
        q: "What is the capital gains tax rate for 2025?",
        a: "For long-term gains: 0% up to $48,350 of taxable income (single), 15% up to $533,400, then 20%. Married filing jointly: $96,700 and $600,050. Short-term gains are taxed as ordinary income.",
      },
      {
        q: "How long must I hold an asset for the long-term rate?",
        a: "More than one year. Sell within a year and the gain is short-term, taxed at your ordinary income-tax rate instead of the lower capital-gains rates.",
      },
      {
        q: "Does this include state tax?",
        a: "No — this is the federal estimate only. Most states tax capital gains as ordinary income, and the 3.8% net investment income tax can apply at higher incomes.",
      },
    ],
  },
];
