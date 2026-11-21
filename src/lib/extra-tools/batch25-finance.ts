// Batch 25 — finance tools (priority 1): paycheck, invoice, income tax,
// tax refund, investment, salary-to-hourly, compound growth.
// All figures are US federal 2025 (IRS Rev. Proc. 2024-40). Every tax result
// is labelled an estimate — none of this is tax advice.
import type { Calc } from "../tool-types";
import { compound, fmt } from "../calculators";
import { M, N } from "./shared";

const m = (n: number) => fmt(n, 2);

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

/** 2025 top marginal state income-tax rate, used as a flat estimate.
 *  TX and FL have no state income tax. */
const STATE_RATES: Record<string, { label: string; rate: number }> = {
  CA: { label: "California", rate: 13.3 },
  TX: { label: "Texas", rate: 0 },
  FL: { label: "Florida", rate: 0 },
  NY: { label: "New York", rate: 10.9 },
  PA: { label: "Pennsylvania", rate: 3.07 },
  IL: { label: "Illinois", rate: 4.95 },
  OH: { label: "Ohio", rate: 3.5 },
  GA: { label: "Georgia", rate: 5.39 },
  NC: { label: "North Carolina", rate: 4.5 },
  MI: { label: "Michigan", rate: 4.25 },
};

const SS_WAGE_BASE_2025 = 176100;
const SS_RATE = 0.062;
const MEDICARE_RATE = 0.0145;
const ADDL_MEDICARE_RATE = 0.009;

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

export const batch25FinanceTools: Calc[] = [
  {
    slug: "paycheck-calculator",
    name: "Paycheck Calculator",
    category: "Finance",
    short: "Take-home pay after federal, FICA and state tax — per paycheque and per year.",
    keywords:
      "paycheck calculator, take home pay calculator, net pay calculator, after tax pay calculator, paycheck estimator, salary after tax calculator, paycheck calculator california",
    popular: true,
    inputs: [
      { key: "gross", label: "Gross pay per period", def: "2500" },
      {
        key: "freq",
        label: "Pay frequency",
        type: "select",
        def: "26",
        options: [
          { v: "52", l: "Weekly (52 per year)" },
          { v: "26", l: "Biweekly — every 2 weeks (26)" },
          { v: "24", l: "Semimonthly — twice a month (24)" },
          { v: "12", l: "Monthly (12)" },
        ],
      },
      statusSelect("single"),
      {
        key: "state",
        label: "State",
        type: "select",
        def: "CA",
        options: [
          { v: "none", l: "No state income tax" },
          ...Object.entries(STATE_RATES).map(([v, s]) => ({
            v,
            l: `${s.label} — ${s.rate}% top rate`,
          })),
          { v: "custom", l: "Other / custom rate" },
        ],
      },
      {
        key: "customRate",
        label: "Custom state tax rate",
        def: "0",
        suffix: "%",
        hint: "Only used when 'Other / custom rate' is selected above.",
      },
      { key: "pretax", label: "Pre-tax deductions per period (401(k), health insurance)", def: "0" },
      { key: "extra", label: "Extra withholding per period", def: "0" },
    ],
    compute: (v) => {
      const periods = N(v.freq) || 26;
      const status = (v.status ?? "single") as FilingStatus;
      const gross = N(v.gross);
      const pretaxPeriod = N(v.pretax) || 0;
      const extraPeriod = N(v.extra) || 0;
      const annualGross = gross * periods;
      const annualPretax = pretaxPeriod * periods;
      const ficaWages = Math.max(0, annualGross - annualPretax);
      const ss = Math.min(ficaWages, SS_WAGE_BASE_2025) * SS_RATE;
      const medicareThreshold = status === "married" ? 250000 : 200000;
      const medicare =
        ficaWages * MEDICARE_RATE +
        Math.max(0, ficaWages - medicareThreshold) * ADDL_MEDICARE_RATE;
      const taxable = Math.max(0, annualGross - annualPretax - STANDARD_DEDUCTION[status]);
      const { tax: fedAnnual } = federalTax(taxable, status);
      const stateRate =
        v.state === "custom"
          ? N(v.customRate) || 0
          : v.state === "none"
            ? 0
            : (STATE_RATES[String(v.state)]?.rate ?? 0);
      const stateAnnual = ficaWages * (stateRate / 100);
      const per = (annual: number) => annual / periods;
      const net =
        gross - per(fedAnnual) - per(ss) - per(medicare) - per(stateAnnual) - pretaxPeriod - extraPeriod;
      return [
        { label: "Net pay per period", value: m(net) },
        { label: "Federal income tax (estimate)", value: m(per(fedAnnual)) },
        { label: "Social Security (6.2%)", value: m(per(ss)) },
        { label: "Medicare (1.45%)", value: m(per(medicare)) },
        { label: "State tax (estimate)", value: m(per(stateAnnual)) },
        { label: "Annual net pay", value: m(net * periods) },
        { label: "Annual gross pay", value: m(annualGross) },
      ];
    },
    about:
      "A paycheck calculator estimates your take-home pay: gross pay minus federal income tax, Social Security and Medicare (FICA), and state tax. Federal tax is estimated from the 2025 brackets on your taxable income — gross pay less pre-tax deductions and the standard deduction. State tax is estimated at your state's 2025 top rate, so your real state tax is usually lower. Treat every figure as an estimate.",
    formula:
      "Annual gross = pay per period × periods per year. Taxable income = annual gross − pre-tax deductions − standard deduction (single $15,750; married $31,500; head of household $23,625 for 2025). Federal tax uses the 2025 brackets. Net per period = gross − federal − Social Security − Medicare − state tax − pre-tax deductions − extra withholding.",
    example:
      "A $2,500 biweekly paycheque in California, single, with no pre-tax deductions: $65,000 a year, $49,250 taxable after the $15,750 standard deduction, federal tax $5,749 a year ($221.12 per period), Social Security $155.00, Medicare $36.25 and state tax $332.50 — leaving $1,755.13 per paycheque, or $45,633.50 a year.",
    howToUse: [
      "Enter your gross pay for one pay period — the amount before any tax or deductions.",
      "Choose your pay frequency: weekly, biweekly, semimonthly or monthly.",
      "Pick your filing status and state — state tax is estimated at the top rate, or enter your own with 'Other / custom rate'.",
      "Add pre-tax deductions and any extra withholding, then check your net pay.",
    ],
    details: [
      {
        heading: "How federal withholding is estimated",
        body: "Your employer withholds federal tax using IRS tables and your W-4, which reflect your W-4 choices. This calculator annualises your pay, subtracts pre-tax deductions and the standard deduction, applies the 2025 brackets, and divides the result back across your pay periods. The total is usually close for straightforward situations, but it will differ with multiple jobs, bonuses, or itemised deductions.",
      },
      {
        heading: "What FICA covers",
        body: "FICA funds Social Security and Medicare. Social Security is 6.2% of wages up to $176,100 for 2025. Medicare is 1.45% of all wages, plus 0.9% over $200,000 ($250,000 married filing jointly). The standard deduction does not reduce FICA, but pre-tax 401(k) contributions do reduce the wages it applies to.",
      },
    ],
    tips: [
      "A higher bracket only taxes the income above the threshold at that rate — your whole pay is never taxed at the top rate.",
      "Pre-tax 401(k) contributions lower your taxable income and FICA wages, so they cut your tax bill as well as your take-home pay.",
      "If you get a large refund every year, you are over-withholding; adjust your W-4 to keep more of each paycheque.",
    ],
    faqs: [
      {
        q: "Why is my actual paycheque different from this estimate?",
        a: "Real withholding uses IRS tables and your W-4, which account for dependents, multiple jobs and other adjustments this calculator cannot see. State tax is also estimated here at the top rate, while real state tax is usually calculated in brackets. Use the result as a close estimate, not a promise.",
      },
      {
        q: "Does this include 401(k) and health insurance?",
        a: "Yes — enter them as pre-tax deductions per period. They reduce your taxable income and the wages subject to Social Security and Medicare, so they lower your tax as well as your take-home pay.",
      },
      {
        q: "What is the additional Medicare tax?",
        a: "An extra 0.9% on wages over $200,000 ($250,000 married filing jointly), applied only above the threshold. Your employer withholds it automatically once you pass it.",
      },
    ],
  },
  {
    slug: "invoice-generator",
    name: "Invoice Generator",
    category: "Finance",
    short: "Create a professional invoice — line items, tax and totals — then print or download it.",
    keywords:
      "invoice generator, free invoice generator, invoice maker, create invoice online, invoice template, simple invoice generator",
    popular: true,
    custom: "invoice-generator",
    inputs: [],
    compute: () => [],
    about:
      "An invoice generator builds a professional invoice in minutes: your business details, your client's details, line items with quantities and rates, tax, and the total due. Add as many lines as you need, set the tax rate and payment terms, then print the invoice or download it as a file you can send. Everything is filled in and previewed in your browser — nothing is uploaded, stored or sent anywhere, and there is no account to create.",
    formula: "",
    example:
      "A freelance designer invoices a client for 12 hours of design at $75 an hour ($900), plus a $120 stock-photo licence: a subtotal of $1,020, 8% sales tax of $81.60, and a total due of $1,101.60, payable within 14 days.",
    howToUse: [
      "Fill in your business name and contact details, then your client's name and details.",
      "Set the invoice number, the issue date and the due date (or payment terms in days).",
      "Add a line for each item: a description, the quantity and the rate. Add or remove lines as needed.",
      "Set the tax rate if tax applies, add a short note such as payment details, then print the invoice or download it to send.",
    ],
    details: [
      {
        heading: "What to include on an invoice",
        body: "A complete invoice names both parties, has a unique invoice number and an issue date, lists each item with its quantity and rate, and shows the subtotal, tax and total due. Add a due date and how to pay — bank details, a payment link or a cheque address. A reference such as a project name or purchase order number helps your client match the invoice to their records, and a short note is the place for late-payment terms.",
      },
      {
        heading: "Getting paid faster",
        body: "Short payment terms, a clear due date and easy payment details are the three things that speed up payment most. Send the invoice the same day the work is finished, while it is fresh in the client's mind. If a client is late, a polite reminder a few days after the due date works better than waiting a month — and numbering invoices sequentially makes it easy to spot which ones are still open.",
      },
    ],
    tips: [
      "Number invoices sequentially (INV-001, INV-002…) so nothing is ever duplicated or missed.",
      "Always include a due date — invoices without one are paid later on average.",
      "Keep a copy of every invoice you send, in case a client queries it months later.",
    ],
    faqs: [
      {
        q: "Is the invoice legally valid?",
        a: "An invoice you create here is a normal commercial document, but tax and record-keeping rules differ by country and by business type. Check what your tax authority requires — for example, a VAT number where VAT applies — before sending invoices for real transactions.",
      },
      {
        q: "Can I download the invoice?",
        a: "Yes. Use Download to save the invoice as a file you can email or store, or Print to print it (or save it as a PDF from your browser's print dialogue).",
      },
      {
        q: "Is my client data saved anywhere?",
        a: "No. Everything you type stays in your browser and is never uploaded or stored. Close the page and it is gone, so download the invoice before you leave.",
      },
    ],
  },
  {
    slug: "income-tax-calculator",
    name: "Income Tax Calculator",
    category: "Finance",
    short: "Estimate your US federal income tax for 2025, with effective and marginal rates.",
    keywords:
      "income tax calculator, federal income tax calculator, tax calculator 2025, how much tax will i pay, us tax calculator, estimate my taxes",
    popular: true,
    inputs: [
      statusSelect("single"),
      { key: "income", label: "Annual income (gross)", def: "85000" },
      {
        key: "ded",
        label: "Deductions",
        def: "15750",
        hint: "Defaults to the 2025 standard deduction for a single filer — enter your itemised total instead if it is higher.",
      },
    ],
    compute: (v) => {
      const status = (v.status ?? "single") as FilingStatus;
      const income = N(v.income);
      const ded = N(v.ded);
      const taxable = Math.max(0, income - ded);
      const { tax, marginal } = federalTax(taxable, status);
      return [
        { label: "Estimated federal tax", value: m(tax) },
        { label: "Effective tax rate", value: income > 0 ? fmt((tax / income) * 100) + "%" : "—" },
        { label: "Marginal tax bracket", value: fmt(marginal * 100, 0) + "%" },
        { label: "Taxable income", value: m(taxable) },
        { label: "After-tax income", value: m(income - tax) },
      ];
    },
    about: `A federal income tax calculator estimates what you owe the IRS for 2025: it subtracts your deductions from your gross income, then applies the federal tax brackets to the remainder. The 2025 standard deductions are $15,750 for single filers, $31,500 for married couples filing jointly and $23,625 for heads of household. The result shows your total tax, your effective rate (tax as a share of all your income) and your marginal bracket — the rate on your next dollar. ${TAX_DISCLAIMER}`,
    formula:
      "Taxable income = gross income − deductions. Tax is calculated bracket by bracket: 10% up to $11,925, 12% to $48,475, 22% to $103,350, 24% to $197,300, 32% to $250,525, 35% to $626,350 and 37% above that (single filer, 2025). Effective rate = tax ÷ gross income.",
    example:
      "A single filer earning $85,000 with the $15,750 standard deduction has $69,250 of taxable income. The tax is $1,192.50 at 10%, plus $4,386 at 12%, plus $4,570.50 at 22% — $10,149 in total, an effective rate of 11.94% and a marginal bracket of 22%. After-tax income is $74,851.",
    howToUse: [
      "Choose your filing status: single, married filing jointly, or head of household.",
      "Enter your total annual gross income — wages, plus any other income you expect.",
      "Enter your deductions. The field starts at the 2025 standard deduction for a single filer; enter your itemised total instead if it is higher.",
      "Check the estimated tax, the effective rate and your marginal bracket.",
    ],
    details: [
      {
        heading: "How the 2025 brackets work",
        body: "The US taxes income in slices. Only the income inside each bracket is taxed at that bracket's rate — so moving into the 22% bracket does not mean all your income is taxed at 22%. For a single filer in 2025, the first $11,925 is taxed at 10%, the slice from $11,925 to $48,475 at 12%, and so on up to 37% above $626,350. Your marginal bracket is the rate on your last dollar; your effective rate is the average across all slices, and it is always lower than your marginal rate.",
      },
      {
        heading: "Standard deduction vs itemising",
        body: "The standard deduction is a fixed amount the IRS lets you subtract from your income before tax — $15,750 for single filers in 2025. Itemising means adding up deductible expenses (mortgage interest, state taxes up to a cap, charitable gifts and more) and using that total instead, but only if it is higher than the standard deduction. Most filers take the standard deduction because it is simpler and, for most people, larger.",
      },
    ],
    tips: [
      "Your marginal bracket is what matters for decisions like Roth vs traditional retirement contributions — not your effective rate.",
      "Contributions to a traditional 401(k) or IRA lower your taxable income, so they lower your tax bill this year.",
      "Tax credits (child tax credit, education credits) reduce your tax directly, dollar for dollar — they are worth more than deductions of the same size.",
    ],
    faqs: [
      {
        q: "Is this tax advice?",
        a: "No. This is an estimate from the published 2025 brackets and standard deduction. Real tax depends on credits, state taxes, capital gains, self-employment income and more. For anything that affects real money, check with a tax professional.",
      },
      {
        q: "What is the difference between marginal and effective tax rate?",
        a: "Your marginal rate is the tax on your next dollar of income — the top bracket you reach. Your effective rate is your total tax divided by your total income. Because lower slices are taxed at lower rates, your effective rate is always lower than your marginal rate.",
      },
      {
        q: "Does this include state tax?",
        a: "No — this is federal income tax only. State income tax is separate and varies widely; use the Paycheck Calculator if you want an estimate that includes a state figure.",
      },
    ],
  },
  {
    slug: "tax-refund-calculator",
    name: "Tax Refund Calculator",
    category: "Finance",
    short: "Will you get a refund or owe tax? Compare withholding with your estimated liability.",
    keywords:
      "tax refund calculator, tax refund estimator, will i get a tax refund, how much will i owe in taxes, refund vs owe calculator",
    popular: true,
    inputs: [
      statusSelect("single"),
      { key: "income", label: "Annual income (gross)", def: "85000" },
      {
        key: "ded",
        label: "Deductions",
        def: "15750",
        hint: "Defaults to the 2025 standard deduction for a single filer.",
      },
      {
        key: "withheld",
        label: "Total federal tax withheld (W-2 box 2)",
        def: "9200",
        hint: "Add up box 2 across all your W-2s, plus any estimated payments you made.",
      },
    ],
    compute: (v) => {
      const status = (v.status ?? "single") as FilingStatus;
      const income = N(v.income);
      const taxable = Math.max(0, income - N(v.ded));
      const { tax: liability, marginal } = federalTax(taxable, status);
      const withheld = N(v.withheld);
      const diff = withheld - liability;
      return [
        diff >= 0
          ? { label: "Estimated refund", value: m(diff) }
          : { label: "Estimated amount you owe", value: m(-diff) },
        { label: "Estimated tax liability", value: m(liability) },
        { label: "Total withheld", value: m(withheld) },
        { label: "Marginal tax bracket", value: fmt(marginal * 100, 0) + "%" },
        { label: "Effective tax rate", value: income > 0 ? fmt((liability / income) * 100) + "%" : "—" },
      ];
    },
    about: `A tax refund calculator compares the federal tax already withheld from your pay with the tax you actually owe, and tells you whether to expect a refund or a bill. It uses the same 2025 brackets as the Income Tax Calculator: your income less deductions, taxed slice by slice. If your employer withheld more than your liability, the difference comes back as a refund; if they withheld less, you owe the balance when you file. ${TAX_DISCLAIMER}`,
    formula:
      "Liability = tax on (income − deductions) at the 2025 federal brackets. Refund = total withheld − liability (if positive); amount owed = liability − total withheld (if negative).",
    example:
      "A single filer earning $85,000 with the $15,750 standard deduction owes about $10,149 in federal tax. If $9,200 was withheld during the year, the shortfall is $949 — an estimated amount owed of $949, not a refund.",
    howToUse: [
      "Choose your filing status and enter your total annual gross income.",
      "Enter your deductions — the field starts at the 2025 standard deduction for a single filer.",
      "Enter the total federal tax withheld from all your W-2s (box 2), plus any estimated tax payments you made.",
      "Check whether the result is a refund or an amount owed, and by how much.",
    ],
    details: [
      {
        heading: "Why you got a refund — or a bill",
        body: "A refund means your employer withheld more tax than you owed; a bill means they withheld less. Withholding is set by your W-4, and it is only an estimate — it cannot know about a second job, freelance income, capital gains or tax credits. A big refund feels good, but it is your own money coming back months late, interest-free. A bill usually means income that was never withheld against, such as self-employment or investment income.",
      },
      {
        heading: "How to adjust your withholding",
        body: "If you consistently get large refunds, file a new W-4 with your employer claiming the correct allowances — you will keep more of each paycheque instead of lending it to the IRS. If you owe every year, add extra withholding per pay period on the W-4, or make quarterly estimated payments. Either way, aim to land close to zero: a small refund or a small amount owed means your withholding was about right.",
      },
    ],
    tips: [
      "Add up box 2 from every W-2 — people with two jobs often forget the second one.",
      "Tax credits (child tax credit, education credits) can turn an amount owed into a refund, so check which ones apply to you.",
      "If you owe, file on time even if you cannot pay in full — the IRS charges less for paying late than for filing late.",
    ],
    faqs: [
      {
        q: "Is a big refund a good thing?",
        a: "Not really. A refund is money you overpaid during the year, returned without interest. A refund close to zero usually means your withholding was set about right — you kept your money all year instead of lending it to the government.",
      },
      {
        q: "What if I cannot pay what I owe?",
        a: "File your return on time anyway, then ask the IRS for a payment plan — the failure-to-file penalty is much larger than the failure-to-pay penalty, and payment plans are routine.",
      },
      {
        q: "Does this include state tax refunds?",
        a: "No — this is federal only. State refunds depend on your state's own brackets and withholding, which are separate.",
      },
    ],
  },
  {
    slug: "investment-calculator",
    name: "Investment Calculator",
    category: "Finance",
    short: "What your investments could be worth — initial amount, monthly contributions and growth.",
    keywords:
      "investment calculator, investment growth calculator, how much will my investments be worth, future value calculator, investment return calculator",
    popular: true,
    inputs: [
      { key: "p", label: "Initial investment", def: "10000" },
      { key: "c", label: "Monthly contribution", def: "300" },
      { key: "r", label: "Expected annual return", def: "7", suffix: "%" },
      { key: "y", label: "Years invested", def: "20" },
      {
        key: "n",
        label: "Compounding",
        type: "select",
        def: "12",
        options: [
          { v: "1", l: "Yearly" },
          { v: "4", l: "Quarterly" },
          { v: "12", l: "Monthly" },
        ],
      },
    ],
    compute: (v) => {
      const fv = compound(N(v.p), N(v.r), N(v.y), N(v.n), N(v.c));
      const contrib = N(v.p) + N(v.c) * 12 * N(v.y);
      return [
        { label: "Future value", value: m(fv) },
        { label: "Total contributions", value: m(contrib) },
        { label: "Investment growth", value: m(fv - contrib) },
        { label: "Growth as % of total", value: fmt(((fv - contrib) / fv) * 100) + "%" },
      ];
    },
    about:
      "An investment calculator projects what a portfolio could be worth: your starting amount, regular monthly contributions and an assumed annual return, compounded over time. It splits the result into what you put in and what growth added, so you can see how much of the final figure came from compounding rather than from your own pocket. Returns are never guaranteed — the calculator assumes a steady rate for illustration, while real markets rise and fall.",
    formula:
      "Future value = initial amount × (1 + r/n)^(n×t) + monthly contribution × the future value of a regular series at the same rate. r is the annual return, n the compounding periods per year, t the years.",
    example:
      "Invest $10,000, add $300 a month and earn 7% compounded monthly for 20 years: the total reaches about $196,665. You contributed $82,000, so growth added about $114,665 — more than half the final value.",
    howToUse: [
      "Enter your starting investment — the lump sum you begin with.",
      "Add your monthly contribution, or leave it at 0 for a one-off investment.",
      "Enter the expected annual return and the number of years, then choose how often returns compound.",
      "Compare the future value with your total contributions to see how much growth did the work.",
    ],
    details: [
      {
        heading: "Compounding vs contributions",
        body: "Over short periods, your contributions do most of the work — the balance grows mainly because you keep adding money. Over long periods the balance flips: growth on earlier growth starts to dominate, and by year 20 of a steady plan the investment earnings can exceed everything you paid in. That is why starting early matters more than investing large amounts late: time in the market is what lets compounding take over.",
      },
      {
        heading: "What return should you assume?",
        body: "A diversified stock portfolio has historically returned around 7–10% a year before inflation, and about 5–7% after inflation. Bonds and savings accounts return much less. The calculator assumes a single steady rate, but real returns vary year to year — a year of −20% followed by +20% does not leave you where you started. Use a conservative rate, and treat the result as a range rather than a promise.",
      },
    ],
    tips: [
      "Increase contributions with each pay rise — even 1% a year adds up over decades.",
      "Fees matter: a 1% annual fee can take roughly a quarter of your returns over 30 years.",
      "Reinvest dividends and interest so they compound too.",
    ],
    faqs: [
      {
        q: "Is the return guaranteed?",
        a: "No. Markets move up and down, and a steady 7% every year does not happen in real life. The calculator shows what a constant return would produce, so treat it as an illustration, not a forecast.",
      },
      {
        q: "Should I use a return before or after inflation?",
        a: "For a figure in today's money, use a real (after-inflation) return of about 4–5%. For the nominal future amount, use 7–8%. Mixing the two is the most common mistake with these calculators.",
      },
      {
        q: "How is this different from a compound interest calculator?",
        a: "They share the same maths. This one is framed around investing — monthly contributions and the split between what you paid in and what growth added — while the compound interest calculator also covers savings deposits and interest earned.",
      },
    ],
  },
  {
    slug: "salary-to-hourly-calculator",
    name: "Salary to Hourly Calculator",
    category: "Finance",
    short: "Convert an annual salary to an hourly rate — or an hourly wage to a salary.",
    keywords:
      "salary to hourly calculator, hourly to salary calculator, salary to hourly, convert salary to hourly rate, annual salary to hourly wage",
    popular: true,
    inputs: [
      {
        key: "mode",
        label: "Convert",
        type: "select",
        def: "s2h",
        options: [
          { v: "s2h", l: "Annual salary → hourly rate" },
          { v: "h2s", l: "Hourly wage → annual salary" },
        ],
      },
      { key: "a", label: "Amount", def: "65000" },
      { key: "hpw", label: "Hours per week", def: "40" },
      { key: "wpy", label: "Weeks worked per year", def: "52" },
    ],
    compute: (v) => {
      const hours = N(v.hpw) * N(v.wpy);
      if (v.mode === "h2s") {
        const annual = N(v.a) * hours;
        return [
          { label: "Annual salary", value: m(annual) },
          { label: "Monthly", value: m(annual / 12) },
          { label: "Weekly", value: m(annual / 52) },
          { label: "Hourly rate", value: m(N(v.a)) },
        ];
      }
      const hourly = hours > 0 ? N(v.a) / hours : NaN;
      return [
        { label: "Hourly rate", value: m(hourly) },
        { label: "Weekly pay", value: m(N(v.a) / 52) },
        { label: "Monthly pay", value: m(N(v.a) / 12) },
        { label: "Annual salary", value: m(N(v.a)) },
      ];
    },
    about:
      "Convert a salary to an hourly rate, or an hourly wage to a salary, so you can compare job offers on equal terms. The conversion uses your actual working pattern — hours per week and weeks worked per year — because a 40-hour week with two weeks off is not the same as a 50-hour week with none. All figures are gross, before tax and deductions.",
    formula:
      "Hourly rate = annual salary ÷ (hours per week × weeks per year). Annual salary = hourly wage × hours per week × weeks per year. A standard full-time year is 40 hours × 52 weeks = 2,080 hours.",
    example:
      "A $65,000 salary at 40 hours a week for 52 weeks is $31.25 an hour — about $1,250 a week and $5,416.67 a month. The other way, $31.25 an hour at the same hours is $65,000 a year.",
    howToUse: [
      "Choose the direction: salary to hourly, or hourly to salary.",
      "Enter the amount — the annual salary or the hourly wage.",
      "Set your hours per week and weeks worked per year. Adjust the weeks down if you take unpaid time off.",
      "Compare the hourly rate with the weekly, monthly and annual figures.",
    ],
    details: [
      {
        heading: "Comparing job offers",
        body: "An hourly rate makes offers comparable even when the hours differ. A $70,000 salary at 50 hours a week is $26.92 an hour — less per hour than a $65,000 salary at 40 hours ($31.25). Remember to weigh the whole package too: paid vacation, health cover, retirement matching and bonuses are all part of the real pay, and none of them show up in the hourly rate.",
      },
      {
        heading: "Overtime and unpaid time off",
        body: "Salaried roles often include unpaid overtime, which lowers the true hourly rate — divide by the hours you actually work, not the hours in the contract. For hourly roles, unpaid time off lowers the annual total: at 40 hours a week, each unpaid week off costs about 1.9% of the annual salary. Use the weeks-per-year field to model both.",
      },
    ],
    tips: [
      "Quick rule: double the hourly rate and add three zeros — $25 an hour is roughly $50,000 a year.",
      "Contractors: divide your target salary by billable hours (often 1,600–1,800 a year, not 2,080) to set your rate.",
      "Factor in paid vacation and benefits when comparing offers — they are worth real money.",
    ],
    faqs: [
      {
        q: "How many working hours are in a year?",
        a: "A full-time 40-hour week over 52 weeks is 2,080 hours. With two weeks of paid vacation, the working year is 2,000 hours.",
      },
      {
        q: "Is this take-home pay?",
        a: "No, it is gross pay before taxes, retirement contributions and other deductions. Use the Paycheck Calculator to see what you would actually take home.",
      },
      {
        q: "How do I compare a salary with an hourly contract?",
        a: "Convert both to the same basis — usually the hourly rate for the hours you will actually work — then add the value of benefits, paid time off and job security before deciding.",
      },
    ],
  },
  {
    slug: "compound-growth-calculator",
    name: "Compound Growth Calculator",
    category: "Finance",
    short: "How an amount grows at a steady rate — the power of compounding over time.",
    keywords:
      "compound growth calculator, growth calculator, compound annual growth, future value growth calculator, exponential growth calculator",
    inputs: [
      { key: "p", label: "Starting amount", def: "10000" },
      { key: "r", label: "Annual growth rate", def: "8", suffix: "%" },
      { key: "y", label: "Years", def: "10" },
      {
        key: "n",
        label: "Compounding",
        type: "select",
        def: "1",
        options: [
          { v: "1", l: "Yearly" },
          { v: "4", l: "Quarterly" },
          { v: "12", l: "Monthly" },
        ],
      },
    ],
    compute: (v) => {
      const fv = N(v.p) * Math.pow(1 + N(v.r) / 100 / N(v.n), N(v.n) * N(v.y));
      return [
        { label: "Future value", value: m(fv) },
        { label: "Growth", value: m(fv - N(v.p)) },
        { label: "Times your money", value: N(v.p) > 0 ? fmt(fv / N(v.p), 2) + "×" : "—" },
        { label: "Growth per year (average)", value: m((fv - N(v.p)) / N(v.y)) },
      ];
    },
    about:
      "Compound growth is what happens when growth earns growth: each year's increase is added to the balance, so the next year's growth is calculated on a larger amount. The effect is small at first and dramatic later — the last few years of a long period add far more than the first few. This calculator shows the future value of a single amount growing at a steady rate, with no extra contributions.",
    formula: "Future value = P × (1 + r/n)^(n×t), where P is the starting amount, r the annual growth rate, n the compounding periods per year and t the years.",
    example:
      "$10,000 growing at 8% a year becomes $21,589.25 after 10 years — a gain of $11,589.25, or 2.16 times your money. At the same rate for 20 years it reaches $46,609.57.",
    howToUse: [
      "Enter the starting amount — the sum you begin with.",
      "Enter the annual growth rate as a percentage.",
      "Set the number of years and how often growth compounds.",
      "Compare the future value with the starting amount to see the growth.",
    ],
    details: [
      {
        heading: "The power of compounding",
        body: "Compounding is exponential, not linear. At 8% a year, $10,000 doubles in about 9 years (the Rule of 72: 72 ÷ 8 ≈ 9). The first doubling takes 9 years; the second takes another 9 — but it adds twice as much money. That is why the same rate produces such different results over 10, 20 and 30 years, and why starting early matters far more than starting big.",
      },
      {
        heading: "Nominal vs real growth",
        body: "The rate you enter is nominal — it ignores inflation. If prices rise 3% a year, an 8% nominal return is only about 5% in real terms. For a figure in today's purchasing power, enter the real rate (nominal minus inflation). For the amount you will actually see in your account in future, enter the nominal rate.",
      },
    ],
    tips: [
      "The Rule of 72: divide 72 by the rate to estimate the years needed to double.",
      "Small rate differences compound enormously over decades — 7% vs 8% over 30 years is a 35% difference in the final value.",
      "Growth is assumed steady here; real investments vary year to year.",
    ],
    faqs: [
      {
        q: "What is the difference between simple and compound growth?",
        a: "Simple growth adds the same amount every year (rate × starting amount). Compound growth adds a growing amount, because each year's growth is calculated on the new, larger balance.",
      },
      {
        q: "How long will it take to double my money?",
        a: "Roughly 72 divided by the annual rate: at 8%, about 9 years; at 6%, about 12 years. That is the Rule of 72.",
      },
      {
        q: "Does compounding frequency matter much?",
        a: "A little. Monthly compounding earns slightly more than yearly at the same rate, but the difference is small compared with the rate itself and the time period.",
      },
    ],
  },
];
