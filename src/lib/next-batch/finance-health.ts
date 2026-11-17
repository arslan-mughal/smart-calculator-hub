import type { Calc } from "../tool-types";
import { M, N, numberInput, selectInput, tool } from "../extra-tools/shared";

const monthlyPayment = (principal: number, annualRate: number, months: number) => {
  const r = annualRate / 1200;
  return r === 0 ? principal / months : (principal * r) / (1 - Math.pow(1 + r, -months));
};

export const nextFinanceHealthTools: Calc[] = [
  tool({
    slug: "apr-calculator",
    name: "APR Calculator",
    category: "Finance",
    short: "Estimate a loan's annual percentage rate after upfront fees, not just its advertised interest rate.",
    keywords: "apr calculator, annual percentage rate calculator, loan apr calculator, apr with fees, true loan cost",
    inputs: [
      numberInput("p", "Loan amount", "20000"),
      numberInput("r", "Advertised annual interest rate", "7.5", "%"),
      numberInput("f", "Upfront finance fees", "750"),
      numberInput("y", "Loan term", "5", "years"),
    ],
    compute: (v) => {
      const p = N(v.p), fees = N(v.f), months = N(v.y) * 12;
      const pay = monthlyPayment(p, N(v.r), months);
      const received = p - fees;
      let low = 0, high = 1;
      for (let i = 0; i < 100; i += 1) {
        const mid = (low + high) / 2;
        const present = mid === 0 ? pay * months : (pay * (1 - Math.pow(1 + mid, -months))) / mid;
        if (present > received) low = mid;
        else high = mid;
      }
      const monthlyApr = (low + high) / 2;
      return [
        { label: "Estimated APR", value: M(monthlyApr * 12 * 100, 2) + "%" },
        { label: "Monthly payment", value: M(pay, 2) },
        { label: "Net amount received", value: M(received, 2) },
        { label: "Interest plus upfront fees", value: M(pay * months - p + fees, 2) },
        { label: "Effective annual rate", value: M((Math.pow(1 + monthlyApr, 12) - 1) * 100, 2) + "%" },
      ];
    },
    about: "Annual percentage rate (APR) expresses the yearly cost of borrowing, including eligible upfront finance charges as well as interest. Two loans can advertise the same note rate but have different APRs when one charges higher origination fees. This calculator finds the rate that matches the fixed payments to the money you actually receive after fees, making competing personal, auto and home-secured loan offers easier to compare.",
    howToUse: [
      "Enter the full amount financed and the lender's advertised annual note rate.",
      "Add prepaid origination, application or other required finance fees, then enter the repayment term.",
      "Compare the estimated APR and total borrowing cost between offers with the same amount and term.",
    ],
    details: [
      { heading: "Why APR can be higher than the note rate", body: "The note rate determines the contractual payment on the amount financed. Fees reduce the useful proceeds without reducing that payment, so the return required on the net advance is higher. APR spreads those upfront charges across the expected life of the loan. With a very short term, the same fee produces a much larger APR difference because there are fewer payments over which to spread it." },
      { heading: "What this estimate does not include", body: "APR rules and included charges vary by country and loan product. Optional insurance, late charges, early-settlement penalties and costs that would apply even in a cash purchase are not automatically included. For a regulated quotation, use the APR disclosed by the lender and check whether repayments, compounding and fees match the assumptions used here." },
    ],
    formula: "Payment = P·r ÷ (1 − (1+r)⁻ⁿ). APR is found by solving net proceeds = payment × (1 − (1+a)⁻ⁿ) ÷ a for monthly APR rate a, then multiplying a by 12 × 100.",
    example: "A 20,000 loan at 7.5% for five years has a payment of about 400.76. If 750 of required fees leaves 19,250 in net proceeds, the estimated APR is about 9.12%, rather than 7.5%.",
    tips: ["Compare offers over identical terms; extending a term can hide fees behind a lower payment.", "Separate optional add-ons from mandatory finance charges before entering fees.", "Use total interest plus fees as a second comparison, especially if you expect to repay early."],
    faqs: [
      { q: "Is APR the same as the effective annual rate?", a: "No. Nominal APR annualises the monthly percentage-rate calculation without compounding it. The effective annual rate also shows the effect of monthly compounding and is normally slightly higher." },
      { q: "Why is my lender's APR different?", a: "The lender may include a different set of regulated charges, use daily rather than monthly timing, or account for an irregular first payment. Their regulated disclosure should govern the contract." },
      { q: "Does APR include compounding?", a: "The APR shown here is a nominal annual rate derived from the monthly borrowing cost. A separate effective annual rate is included to show annual compounding." },
    ],
  }),
  tool({
    slug: "debt-to-income-ratio-calculator",
    name: "Debt-to-Income Ratio Calculator",
    category: "Finance",
    short: "Measure monthly debt commitments against gross income and see the income left after those payments.",
    keywords: "debt to income ratio calculator, dti calculator, debt ratio calculator, mortgage dti, monthly debt calculator",
    inputs: [
      numberInput("i", "Gross monthly income", "6500"),
      numberInput("h", "Monthly housing payment", "1600"),
      numberInput("d", "Other monthly debt payments", "550"),
    ],
    compute: (v) => {
      const income = N(v.i), housing = N(v.h), other = N(v.d), debts = housing + other;
      return [
        { label: "Total DTI", value: M((debts / income) * 100, 1) + "%" },
        { label: "Housing-only ratio", value: M((housing / income) * 100, 1) + "%" },
        { label: "Total monthly debt payments", value: M(debts, 2) },
        { label: "Income remaining after listed debts", value: M(income - debts, 2) },
        { label: "Debt payments at a 36% DTI", value: M(income * 0.36, 2) },
      ];
    },
    about: "Debt-to-income ratio (DTI) is the percentage of gross monthly income committed to recurring debt payments. Lenders use it as an affordability screen alongside credit history, employment stability, assets and living costs. This page separates housing expense from other obligations, calculates both common DTI views and shows what your listed commitments leave before tax, food, utilities and other everyday spending.",
    howToUse: ["Enter monthly income before tax and payroll deductions.", "Add rent or the full mortgage payment, including tax and insurance when those form part of the lender's housing figure.", "Add minimum card, loan, lease, support and other required debt payments, excluding ordinary utilities and groceries."],
    details: [
      { heading: "Front-end and back-end DTI", body: "Housing-only DTI is often called the front-end ratio. Total DTI, sometimes called the back-end ratio, includes housing plus other recurring debts. A 28% front-end and 36% back-end ratio is a familiar conservative guideline, not a universal approval rule. Some regulated mortgage programmes permit higher figures when other parts of an application are strong." },
      { heading: "A ratio is not a complete budget", body: "DTI uses gross income and counts only selected obligations, so the percentage remaining is not disposable cash. Payroll tax, childcare, transport, food, insurance and savings can materially change affordability. Use this result as a lending benchmark and build a separate take-home-pay budget before committing to a new payment." },
    ],
    formula: "Total DTI = (monthly housing + other monthly debt payments) ÷ gross monthly income × 100. Housing DTI uses housing cost alone.",
    example: "With gross income of 6,500, housing of 1,600 and other debts of 550, total debts are 2,150. DTI is 2,150 ÷ 6,500 = 33.08%, and the housing-only ratio is 24.62%.",
    tips: ["Use required minimum card payments rather than the full card balance.", "Do not include discretionary subscriptions or daily living costs as debt.", "Reducing a small recurring payment can help DTI more than a one-off purchase reduction."],
    faqs: [
      { q: "What is a good debt-to-income ratio?", a: "Lower is generally easier to manage. A total DTI at or below 36% is a common conservative benchmark, while lender and programme limits can be higher. Approval is never determined by DTI alone." },
      { q: "Should I use gross or net income?", a: "Lender DTI normally uses gross verified income. For personal budgeting, also calculate payments against take-home income because that better reflects available cash." },
      { q: "Are utilities included in DTI?", a: "Usually not. Standard DTI focuses on housing and reported recurring debt, although utilities still belong in your own affordability budget." },
    ],
  }),
  tool({
    slug: "car-lease-calculator",
    name: "Car Lease Calculator",
    category: "Finance",
    short: "Break a vehicle lease payment into depreciation and finance charges using its money factor.",
    keywords: "car lease calculator, lease payment calculator, auto lease calculator, money factor calculator, vehicle lease cost",
    inputs: [
      numberInput("p", "Negotiated vehicle price", "38000"),
      numberInput("d", "Down payment / capital reduction", "3000"),
      numberInput("r", "Residual value at lease end", "22800"),
      numberInput("m", "Money factor", "0.00175"),
      numberInput("n", "Lease term", "36", "months"),
    ],
    compute: (v) => {
      const cap = N(v.p) - N(v.d), residual = N(v.r), months = N(v.n), factor = N(v.m);
      const depreciation = (cap - residual) / months;
      const finance = (cap + residual) * factor;
      const payment = depreciation + finance;
      return [
        { label: "Base monthly lease payment", value: M(payment, 2) },
        { label: "Monthly depreciation", value: M(depreciation, 2) },
        { label: "Monthly finance charge", value: M(finance, 2) },
        { label: "Money factor as approximate APR", value: M(factor * 2400, 2) + "%" },
        { label: "Total base lease payments", value: M(payment * months, 2) },
        { label: "Due upfront plus all base payments", value: M(payment * months + N(v.d), 2) },
      ];
    },
    about: "A car lease payment primarily pays for the vehicle's expected depreciation during the contract plus a finance charge on the capital tied up in the lease. Unlike a loan calculator, this tool includes the residual value and money factor quoted by a leasing company. It reveals the base payment before sales tax, registration, acquisition charges, excess-mileage fees and other items in a real lease agreement.",
    howToUse: ["Use the negotiated selling price, not automatically the manufacturer's list price.", "Enter the contractual residual, upfront capital reduction, money factor and number of monthly payments.", "Compare both the base monthly payment and the total paid over the lease, including the upfront amount."],
    details: [
      { heading: "Money factor versus interest rate", body: "A lease money factor is a decimal rather than a percentage. Multiplying it by 2,400 gives a commonly used APR approximation: 0.00175 corresponds to about 4.2%. The lease formula applies the factor to adjusted capital plus residual value, so it should not be substituted directly into an ordinary loan calculator." },
      { heading: "Why the cheapest monthly quote can cost more", body: "A large upfront payment lowers the monthly figure but does not necessarily improve the underlying deal. Mileage allowances, disposition charges, wear standards and the residual assumption all affect value. Compare identical mileage and terms, ask for the adjusted capitalised cost, and consider what happens to upfront money if the vehicle is written off early." },
    ],
    formula: "Adjusted capital = price − upfront reduction. Monthly depreciation = (adjusted capital − residual) ÷ months. Finance charge = (adjusted capital + residual) × money factor.",
    example: "A 38,000 vehicle with 3,000 upfront and a 22,800 residual has 12,200 to depreciate over 36 months. At a 0.00175 money factor, the base payment is about 440.04 per month before tax and fees.",
    tips: ["Negotiate vehicle price before discussing the monthly lease payment.", "Check the residual and money factor against the written quote.", "Choose a mileage allowance that reflects real driving; excess-mileage charges can be substantial."],
    faqs: [
      { q: "Does this payment include tax and fees?", a: "No. It shows base depreciation and finance charges. Tax treatment, acquisition fees, registration and other charges vary and should be added from the lease quote." },
      { q: "What is a good money factor?", a: "It depends on credit, vehicle, market rates and lender support. Convert it with ×2,400 to compare its approximate APR with other offers." },
      { q: "Can the residual value be negotiated?", a: "Usually the leasing company sets residual values by model, term and mileage. The selling price and sometimes fees are more commonly negotiable." },
    ],
  }),
  tool({
    slug: "refinance-calculator",
    name: "Refinance Calculator",
    category: "Finance",
    short: "Compare current and replacement loan payments, monthly savings and the months needed to recover refinancing costs.",
    keywords: "refinance calculator, mortgage refinance calculator, refinance break even, loan refinance savings, new mortgage payment",
    inputs: [
      numberInput("b", "Current loan balance", "280000"),
      numberInput("cr", "Current annual rate", "7.25", "%"),
      numberInput("cy", "Remaining term", "25", "years"),
      numberInput("nr", "New annual rate", "6.25", "%"),
      numberInput("ny", "New term", "25", "years"),
      numberInput("fees", "Refinancing costs paid upfront", "4500"),
    ],
    compute: (v) => {
      const balance = N(v.b), currentMonths = N(v.cy) * 12, newMonths = N(v.ny) * 12, fees = N(v.fees);
      const oldPay = monthlyPayment(balance, N(v.cr), currentMonths);
      const newPay = monthlyPayment(balance, N(v.nr), newMonths);
      const saving = oldPay - newPay;
      const oldInterest = oldPay * currentMonths - balance;
      const newInterest = newPay * newMonths - balance;
      return [
        { label: "New monthly payment", value: M(newPay, 2) },
        { label: "Monthly payment change", value: M(saving, 2) },
        { label: "Cost-recovery time", value: saving > 0 ? M(Math.ceil(fees / saving), 0) + " months" : "No recovery through payment savings" },
        { label: "Interest on current remaining schedule", value: M(oldInterest, 2) },
        { label: "New interest plus upfront costs", value: M(newInterest + fees, 2) },
        { label: "Lifetime cost difference", value: M(oldInterest - newInterest - fees, 2) + (oldInterest - newInterest - fees >= 0 ? " saved" : " extra") },
      ];
    },
    about: "Refinancing replaces an existing loan with a new one, often to reduce the rate, change the term or alter the payment. A lower rate alone does not guarantee savings: upfront charges and resetting the clock on a long loan can outweigh the benefit. This calculator compares the current remaining schedule with a new fixed-rate loan and shows payment savings, cost recovery and lifetime interest under consistent principal-and-interest assumptions.",
    howToUse: ["Enter the estimated payoff balance, current note rate and exact years remaining.", "Enter the new rate and term, then add closing, arrangement, legal and other non-refundable refinancing costs.", "Check cost recovery against how long you expect to keep the loan, then compare lifetime cost as well as monthly relief."],
    details: [
      { heading: "Break-even is only one decision test", body: "Cost-recovery months divide upfront costs by the monthly payment reduction. If you sell or refinance again before that point, the monthly saving may not repay the transaction costs. After break-even, payment savings can continue, but lifetime interest still depends on the new term. A fresh 30-year loan can cost more overall than keeping a loan with only 20 years left." },
      { heading: "Cash flow and total cost can pull in opposite directions", body: "Extending a term may intentionally reduce a monthly commitment even when it increases lifetime interest. Shortening a term can do the reverse. The lifetime comparison here uses the current remaining term and the selected new term; it excludes tax effects, prepayment penalties, insurance changes and the return you might earn by investing monthly savings." },
    ],
    formula: "Both payments use P·r ÷ (1−(1+r)⁻ⁿ). Cost recovery = upfront costs ÷ monthly payment reduction. Lifetime difference = old remaining interest − new interest − upfront costs.",
    example: "Refinancing 280,000 from 7.25% to 6.25% over the same 25 years lowers the payment by roughly 184 per month. A 4,500 cost is recovered in about 25 months, before considering any penalties or tax effects.",
    tips: ["Ask whether costs are paid upfront or added to the balance; this calculator assumes upfront.", "Include any early-repayment charge on the current loan in refinancing costs.", "If payment reduction is your goal, still compare the extra years of interest before extending the term."],
    faqs: [
      { q: "What is a good refinance break-even period?", a: "There is no universal cutoff. It should be comfortably shorter than the time you expect to keep the new loan, with allowance for uncertainty about moving or refinancing again." },
      { q: "Does a lower rate always save money?", a: "No. Fees and a longer repayment period can offset or exceed the interest-rate benefit, which is why lifetime cost is shown alongside the payment." },
      { q: "Are taxes and insurance included?", a: "No. The comparison covers principal and interest only. Property tax, insurance and association dues normally continue independently of refinancing." },
    ],
  }),
  tool({
    slug: "calories-burned-calculator",
    name: "Calories Burned Calculator",
    category: "Health & Fitness",
    short: "Estimate gross exercise calories from body weight, activity duration and standard MET values.",
    keywords: "calories burned calculator, exercise calorie calculator, met calorie calculator, workout calories burned, activity calorie calculator",
    inputs: [
      numberInput("kg", "Body weight", "75", "kg"),
      numberInput("min", "Activity duration", "45", "minutes"),
      selectInput("activity", "Activity", "3.5", [
        ["2.5", "Yoga — 2.5 METs"],
        ["3.5", "Brisk walking — 3.5 METs"],
        ["6", "Swimming, moderate — 6 METs"],
        ["7.5", "Cycling, moderate — 7.5 METs"],
        ["9.8", "Running, 6 mph / 9.7 kmh — 9.8 METs"],
      ]),
    ],
    compute: (v) => {
      const gross = N(v.activity) * N(v.kg) * (N(v.min) / 60);
      const resting = N(v.kg) * (N(v.min) / 60);
      return [
        { label: "Gross calories burned", value: M(gross, 0) + " kcal" },
        { label: "Estimated active calories above rest", value: M(gross - resting, 0) + " kcal" },
        { label: "Calories per minute", value: M(gross / N(v.min), 1) + " kcal" },
        { label: "Selected intensity", value: M(N(v.activity), 1) + " METs" },
      ];
    },
    about: "A metabolic equivalent of task (MET) expresses activity intensity relative to quiet rest. This calculator uses published representative MET values to estimate energy expenditure for a selected activity, weight and duration. It reports both gross calories and an active-calorie estimate that subtracts approximate resting expenditure, helping explain why fitness apps and gym equipment can show different totals for the same workout.",
    howToUse: ["Enter current body weight in kilograms and the time spent actively exercising.", "Choose the closest listed activity and intensity rather than selecting only by activity name.", "Use gross calories for total energy expenditure or active calories when comparing with a device that excludes resting metabolism."],
    details: [
      { heading: "What one MET means", body: "One MET is conventionally treated as one kilocalorie per kilogram per hour and approximates resting energy use. An activity at 7 METs therefore uses roughly seven times the resting rate. The selected presets are representative values, not measurements of your precise pace, gradient, technique or environment." },
      { heading: "Why estimates differ from wearable devices", body: "Real expenditure changes with fitness, movement efficiency, temperature, stops, terrain and body composition. Wearables add heart-rate or motion models and may estimate active rather than gross energy. Treat the result as a planning estimate and avoid using it as an exact licence to replace every calorie through food." },
    ],
    formula: "Gross kcal = MET × body weight (kg) × duration (hours). Active kcal ≈ (MET − 1) × kg × hours.",
    example: "A 75 kg person walking briskly at 3.5 METs for 45 minutes burns about 197 kcal gross. Subtracting estimated resting expenditure gives about 141 active kcal.",
    tips: ["Use total moving time rather than the length of the whole session if you took long breaks.", "Higher intensity does not always mean more total calories if the duration becomes much shorter.", "For weight management, track trends over weeks rather than reacting to one exercise estimate."],
    faqs: [
      { q: "How accurate is a MET calorie estimate?", a: "It is useful for general comparisons but can differ materially from measured expenditure. It does not capture individual fitness, exact pace, stops or terrain." },
      { q: "What is the difference between active and total calories?", a: "Total or gross calories include the energy you would have used at rest during that time. Active calories subtract that resting baseline." },
      { q: "Should I eat back all exercise calories?", a: "Not automatically. Estimates can be high and appetite varies. If you track energy balance, use consistent methods and judge progress from longer-term trends." },
    ],
  }),
  tool({
    slug: "blood-pressure-calculator",
    name: "Blood Pressure Calculator",
    category: "Health & Fitness",
    short: "Classify an adult blood-pressure reading and calculate pulse pressure and mean arterial pressure.",
    keywords: "blood pressure calculator, blood pressure chart, bp category calculator, mean arterial pressure calculator, pulse pressure calculator",
    inputs: [numberInput("sys", "Systolic pressure (top number)", "118", "mmHg"), numberInput("dia", "Diastolic pressure (bottom number)", "76", "mmHg")],
    compute: (v) => {
      const sys = N(v.sys), dia = N(v.dia);
      let category = "Normal";
      if (sys >= 180 || dia >= 120) category = "Severely elevated — urgent medical assessment advised";
      else if (sys >= 140 || dia >= 90) category = "High blood pressure — stage 2";
      else if (sys >= 130 || dia >= 80) category = "High blood pressure — stage 1";
      else if (sys >= 120 && dia < 80) category = "Elevated";
      else if (sys < 90 || dia < 60) category = "Below the usual normal range";
      return [
        { label: "Reading category", value: category },
        { label: "Blood pressure", value: `${M(sys, 0)} / ${M(dia, 0)} mmHg` },
        { label: "Pulse pressure", value: M(sys - dia, 0) + " mmHg" },
        { label: "Estimated mean arterial pressure", value: M((sys + 2 * dia) / 3, 1) + " mmHg" },
      ];
    },
    about: "Blood pressure is recorded as systolic over diastolic pressure in millimetres of mercury. This adult screening tool assigns the entered reading to categories based on common US ACC/AHA thresholds and calculates two derived values: pulse pressure and estimated mean arterial pressure. It does not diagnose hypertension, which normally requires repeated correctly measured readings on different days and clinical interpretation.",
    howToUse: ["Sit quietly for at least five minutes, with your back supported, feet flat and arm supported at heart level.", "Use a validated, correctly fitting cuff and take readings without talking; repeat as advised and average consistent results.", "Enter the top systolic and bottom diastolic numbers, then discuss persistently abnormal readings with a qualified clinician."],
    details: [
      { heading: "One reading is not a diagnosis", body: "Stress, pain, caffeine, exercise, posture, cuff size and measurement technique can all change a result. Home monitoring is most useful when readings are taken consistently and recorded over time. Categories use the higher-risk side when systolic and diastolic values fall into different bands, rather than averaging the two." },
      { heading: "When not to rely on a calculator", body: "A reading of 180/120 mmHg or higher needs prompt professional assessment, especially if repeated after a short rest. Seek emergency help for severely high pressure accompanied by chest pain, breathlessness, weakness, vision change, confusion or other acute symptoms. Low pressure with fainting, confusion or severe weakness also needs urgent evaluation." },
    ],
    formula: "Pulse pressure = systolic − diastolic. Estimated mean arterial pressure = (systolic + 2 × diastolic) ÷ 3, reflecting the longer diastolic portion of a typical cardiac cycle.",
    example: "A reading of 118/76 mmHg falls in the normal category. Pulse pressure is 42 mmHg and estimated mean arterial pressure is 90 mmHg.",
    tips: ["Measure at similar times and keep a dated log rather than relying on memory.", "Avoid caffeine, smoking and vigorous exercise for at least 30 minutes before a routine reading.", "Do not start, stop or adjust medication from a calculator result."],
    faqs: [
      { q: "What is normal blood pressure for adults?", a: "Under common US categories, normal is below 120 systolic and below 80 diastolic. Other guidelines use different diagnostic thresholds, and individual clinical context matters." },
      { q: "Which number matters more?", a: "Both matter. Classification uses the higher category indicated by either number; one should not be ignored simply because the other is normal." },
      { q: "Can this diagnose hypertension?", a: "No. Diagnosis uses repeated measurements and professional assessment. This tool classifies only the single reading you enter." },
    ],
  }),
  tool({
    slug: "body-surface-area-calculator",
    name: "Body Surface Area Calculator",
    category: "Health & Fitness",
    short: "Estimate adult body surface area with the Mosteller and Du Bois equations.",
    keywords: "body surface area calculator, bsa calculator, mosteller formula, du bois formula, bsa medical calculator",
    inputs: [numberInput("kg", "Weight", "75", "kg"), numberInput("cm", "Height", "178", "cm")],
    compute: (v) => {
      const kg = N(v.kg), cm = N(v.cm);
      const mosteller = Math.sqrt((cm * kg) / 3600);
      const duBois = 0.007184 * Math.pow(cm, 0.725) * Math.pow(kg, 0.425);
      return [
        { label: "BSA — Mosteller", value: M(mosteller, 3) + " m²" },
        { label: "BSA — Du Bois", value: M(duBois, 3) + " m²" },
        { label: "Average of the two estimates", value: M((mosteller + duBois) / 2, 3) + " m²" },
        { label: "Weight × height used", value: M(kg * cm, 0) + " kg·cm" },
      ];
    },
    about: "Body surface area (BSA) estimates the external surface of the human body in square metres from height and weight. It appears in some physiological calculations and medication-dosing protocols because it can scale certain processes differently from body weight alone. This tool displays two widely used equations side by side, making their usually small difference visible instead of presenting a single formula as exact.",
    howToUse: ["Measure height without shoes and enter it in centimetres.", "Enter current weight in kilograms, using the measurement convention required by your clinical protocol.", "Select the formula specified by the relevant protocol; do not average formulas unless there is a reason to do so."],
    details: [
      { heading: "Mosteller and Du Bois equations", body: "Mosteller is popular because its square-root expression is easy to calculate and remember. Du Bois is an older power equation derived from a small historical sample. Both are estimation models, not direct surface measurements. Modern clinical references may specify alternatives for particular populations or treatments." },
      { heading: "Clinical use requires the specified method", body: "Some chemotherapy and other dosing references use BSA, but dosing also depends on the drug, diagnosis, organ function, age and protocol. A calculated BSA is only one input and should never be used to determine medication independently. Unusual body composition and paediatric use require particular professional care." },
    ],
    formula: "Mosteller BSA = √((height in cm × weight in kg) ÷ 3600). Du Bois BSA = 0.007184 × height^0.725 × weight^0.425.",
    example: "At 75 kg and 178 cm, Mosteller gives approximately 1.925 m² and Du Bois approximately 1.923 m². Small rounding differences are expected.",
    tips: ["Follow the equation named in any clinical worksheet or protocol.", "Use consistent metric units; entering pounds or inches directly will produce an invalid result.", "Keep several decimal places during later calculations and round only at the final required step."],
    faqs: [
      { q: "Which BSA formula is best?", a: "Mosteller is widely used for its simplicity, but the best formula is the one required by the applicable protocol. No equation is exact for every body shape and population." },
      { q: "What is average body surface area?", a: "Many references quote roughly 1.7–1.9 m² for adults, but BSA varies substantially with height and weight, so an individual calculation is more useful." },
      { q: "Can I use this to calculate medication?", a: "Not on your own. Medication dosing requires a clinician or pharmacist and the correct protocol, with checks that go beyond BSA." },
    ],
  }),
  tool({
    slug: "pregnancy-weight-gain-calculator",
    name: "Pregnancy Weight Gain Calculator",
    category: "Pregnancy",
    short: "Estimate Institute of Medicine gestational weight-gain ranges from pre-pregnancy BMI and singleton or twin pregnancy.",
    keywords: "pregnancy weight gain calculator, gestational weight gain calculator, pregnancy bmi weight gain, twin pregnancy weight gain, recommended pregnancy weight gain",
    inputs: [
      numberInput("kg", "Pre-pregnancy weight", "65", "kg"),
      numberInput("current", "Current weight", "70", "kg"),
      numberInput("cm", "Height", "165", "cm"),
      numberInput("week", "Current pregnancy week", "24"),
      selectInput("type", "Pregnancy", "single", [["single", "Singleton"], ["twins", "Twins"]]),
    ],
    compute: (v) => {
      const bmi = N(v.kg) / Math.pow(N(v.cm) / 100, 2);
      const category = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal weight" : bmi < 30 ? "Overweight" : "Obesity";
      const single: Record<string, [number, number]> = { Underweight: [12.5, 18], "Normal weight": [11.5, 16], Overweight: [7, 11.5], Obesity: [5, 9] };
      const twins: Record<string, [number, number] | null> = { Underweight: null, "Normal weight": [16.8, 24.5], Overweight: [14.1, 22.7], Obesity: [11.3, 19.1] };
      const range = v.type === "single" ? single[category] : twins[category];
      const weekly: Record<string, [number, number]> = { Underweight: [0.44, 0.58], "Normal weight": [0.35, 0.5], Overweight: [0.23, 0.33], Obesity: [0.17, 0.27] };
      let currentRange = "Ask your maternity clinician for an individual trajectory";
      if (range && v.type === "single") {
        const week = Math.max(0, Math.min(40, N(v.week)));
        const progress = week <= 13 ? week / 13 : 1;
        const earlyLow = 0.5 * progress, earlyHigh = 2 * progress;
        const later = Math.max(0, Math.min(1, (week - 13) / 27));
        currentRange = `${M(earlyLow + (range[0] - 0.5) * later, 1)}–${M(earlyHigh + (range[1] - 2) * later, 1)} kg by this week`;
      }
      return [
        { label: "Pre-pregnancy BMI category", value: `${category} (${M(bmi, 1)} kg/m²)` },
        { label: "Recommended total gain", value: range ? `${M(range[0], 1)}–${M(range[1], 1)} kg` : "No established IOM range for this group" },
        { label: "Illustrative gain range by current week", value: v.type === "single" ? currentRange : "Twin trajectories need individual clinical guidance" },
        { label: "Your gain so far", value: M(N(v.current) - N(v.kg), 1) + " kg" },
        { label: "Typical weekly gain in 2nd/3rd trimester", value: v.type === "single" ? `${M(weekly[category]![0], 2)}–${M(weekly[category]![1], 2)} kg` : "Not estimated for twins" },
      ];
    },
    about: "Gestational weight-gain guidance reflects pre-pregnancy body mass index and whether the pregnancy is singleton or multiple. This calculator summarises Institute of Medicine (IOM/National Academies) total ranges and, for singleton pregnancies, an illustrative trajectory based on typical first-trimester and later weekly gains. It is an educational reference, not a target to force through diet or a substitute for maternity care.",
    howToUse: ["Enter weight immediately before pregnancy and height to determine pre-pregnancy BMI.", "Add current weight, gestational week and whether this is a singleton or twin pregnancy.", "Compare the broad reference range with your maternity clinician's personalised advice rather than reacting to day-to-day scale changes."],
    details: [
      { heading: "Weight gain is not perfectly linear", body: "The singleton trajectory assumes roughly 0.5–2 kg during the first trimester, followed by a steadier weekly range in the second and third trimesters. Real patterns vary with nausea, fluid retention, appetite and individual circumstances. A single weigh-in above or below the illustrative range does not establish a problem." },
      { heading: "Twins and higher-order multiples", body: "IOM provisional twin ranges are shown where established, but there is insufficient evidence for a corresponding underweight twin range and no universal weekly trajectory here. Higher-order multiples, existing medical conditions, fetal growth concerns and significant swelling require specific guidance from the maternity team." },
    ],
    formula: "Pre-pregnancy BMI = pre-pregnancy kg ÷ height in metres². Singleton weekly trajectory = early gain + proportion of remaining recommended gain after week 13. Total ranges follow IOM categories.",
    example: "At 65 kg and 165 cm, pre-pregnancy BMI is 23.9, in the normal-weight category. The singleton total reference is 11.5–16 kg. At week 24, the illustrative gain range is approximately 5.0–7.7 kg.",
    tips: ["Use pre-pregnancy weight, not current weight, to select the BMI category.", "Never attempt weight loss during pregnancy without guidance from your maternity clinician.", "Sudden marked swelling or rapid change with headache or visual symptoms needs prompt clinical assessment."],
    faqs: [
      { q: "How much weight should I gain during pregnancy?", a: "For a singleton pregnancy and pre-pregnancy BMI of 18.5–24.9, the IOM range is 11.5–16 kg. Other BMI categories and twin pregnancies have different ranges, shown by the calculator." },
      { q: "Is the weekly range a strict target?", a: "No. It is a broad illustration, not a requirement for every week. Your clinician interprets the overall pattern alongside your health and the baby's growth." },
      { q: "Does this apply to triplets?", a: "No. The multiple-pregnancy output is limited to twins. Higher-order multiples need individual specialist guidance." },
    ],
  }),
];
