import type { Calc } from "../tool-types";
import { M, N, numberInput, selectInput, textArea, textInput, tool } from "../extra-tools/shared";

const nums = (value: unknown) => String(value ?? "").split(/[\s,;]+/).map(Number).filter(Number.isFinite);
const roundDate = (value: string) => new Date(`${value}T12:00:00Z`);

function zoneParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
}

function zonedDateToUtc(date: string, time: string, timeZone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let guess = target;
  for (let i = 0; i < 3; i += 1) {
    const part = zoneParts(new Date(guess), timeZone);
    const represented = Date.UTC(part.year, part.month - 1, part.day, part.hour, part.minute);
    guess += target - represented;
  }
  return new Date(guess);
}

const zoneOptions: [string, string][] = [
  ["UTC", "UTC"],
  ["America/New_York", "New York (US Eastern)"],
  ["America/Chicago", "Chicago (US Central)"],
  ["America/Denver", "Denver (US Mountain)"],
  ["America/Los_Angeles", "Los Angeles (US Pacific)"],
  ["Europe/London", "London"],
  ["Europe/Paris", "Paris / Central Europe"],
  ["Asia/Dubai", "Dubai"],
  ["Asia/Karachi", "Karachi"],
  ["Asia/Kolkata", "Mumbai / India"],
  ["Asia/Singapore", "Singapore"],
  ["Asia/Tokyo", "Tokyo"],
  ["Australia/Sydney", "Sydney"],
];

export const nextMathDateTools: Calc[] = [
  tool({
    slug: "mean-median-mode-calculator",
    name: "Mean Median Mode Calculator",
    category: "Math",
    short: "Find mean, median, mode, range and quartiles for any list of numerical observations.",
    keywords: "mean median mode calculator, average median mode, quartile calculator, data set statistics, mean calculator",
    inputs: [textArea("n", "Numbers (separate with commas, spaces or new lines)", "12, 15, 15, 18, 22, 25, 29, 31")],
    compute: (v) => {
      const values = nums(v.n).sort((a, b) => a - b), n = values.length;
      if (!n) return [{ label: "Result", value: "Enter at least one number" }];
      const mean = values.reduce((a, b) => a + b, 0) / n;
      const median = (sorted: number[]) => {
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
      };
      const counts = new Map<number, number>();
      values.forEach((x) => counts.set(x, (counts.get(x) ?? 0) + 1));
      const maxCount = Math.max(...counts.values());
      const modes = [...counts.entries()].filter(([, count]) => count === maxCount).map(([x]) => x);
      const lower = values.slice(0, Math.floor(n / 2)), upper = values.slice(Math.ceil(n / 2));
      return [
        { label: "Mean", value: M(mean, 6) },
        { label: "Median", value: M(median(values), 6) },
        { label: "Mode", value: maxCount < 2 ? "No repeated mode" : modes.map((x) => M(x, 6)).join(", ") },
        { label: "Range", value: M((values[n - 1] ?? 0) - (values[0] ?? 0), 6) },
        { label: "First quartile (Q1)", value: M(median(lower), 6) },
        { label: "Third quartile (Q3)", value: M(median(upper), 6) },
        { label: "Count and sum", value: `${n} values; sum ${M(values.reduce((a, b) => a + b, 0), 6)}` },
      ];
    },
    about: "Mean, median and mode describe the centre of a data set in different ways. The mean uses every value, the median identifies the middle after sorting, and the mode identifies the most frequent observations. Showing them together helps reveal skew and outliers that a single average can hide. This tool also reports range, quartiles, count and sum so the distribution can be checked without a spreadsheet.",
    howToUse: ["Paste observations separated by commas, spaces, semicolons or line breaks.", "Check the reported count to ensure every intended value was recognised.", "Compare mean with median, inspect any modes, and use quartiles and range to understand spread."],
    details: [
      { heading: "Why the mean and median differ", body: "A very large observation pulls the mean upward but moves the median little or not at all. For household income, house prices and other skewed data, the median often better represents a typical observation. For roughly symmetric measurements without extreme outliers, the mean makes efficient use of every value." },
      { heading: "Quartiles and multimodal data", body: "Q1 is the median of the lower half and Q3 the median of the upper half, excluding the overall median from an odd-sized data set. Several values can tie as modes; the tool lists all of them. If no observation repeats, it reports no repeated mode rather than calling every value a mode." },
    ],
    formula: "Mean = Σx ÷ n. Median is the central sorted value or the average of the two central values. Mode = value(s) with greatest frequency. Range = maximum − minimum.",
    example: "For 12, 15, 15, 18, 22, 25, 29 and 31, the mean is 20.875, the median is 20, the mode is 15 and the range is 19.",
    tips: ["Always sort before finding a median by hand.", "Use median alongside mean when extreme values are present.", "Quartile conventions differ slightly between software packages, especially for small samples."],
    faqs: [
      { q: "Can a data set have more than one mode?", a: "Yes. If several different values share the highest frequency, all are modes. The calculator lists every tied value." },
      { q: "What if every number occurs once?", a: "There is no repeated mode. Although some descriptions call every value modal, reporting no repeated mode is usually clearer for analysis." },
      { q: "Which average should I use?", a: "Use mean for additive numerical analysis, median for a robust typical value with outliers, and mode for the most common value or category." },
    ],
  }),
  tool({
    slug: "geometric-mean-calculator",
    name: "Geometric Mean Calculator",
    category: "Math",
    short: "Calculate geometric and harmonic means for positive values, growth factors or rates.",
    keywords: "geometric mean calculator, geometric average calculator, harmonic mean calculator, average growth factor, mean of positive numbers",
    inputs: [textArea("n", "Positive numbers", "1.05, 1.12, 0.96, 1.08")],
    compute: (v) => {
      const values = nums(v.n), n = values.length;
      if (!n || values.some((x) => x <= 0)) return [{ label: "Result", value: "Enter positive numbers only" }];
      const geometric = Math.exp(values.reduce((sum, x) => sum + Math.log(x), 0) / n);
      const harmonic = n / values.reduce((sum, x) => sum + 1 / x, 0);
      const arithmetic = values.reduce((sum, x) => sum + x, 0) / n;
      return [
        { label: "Geometric mean", value: M(geometric, 8) },
        { label: "Harmonic mean", value: M(harmonic, 8) },
        { label: "Arithmetic mean for comparison", value: M(arithmetic, 8) },
        { label: "Product of all values", value: M(values.reduce((a, b) => a * b, 1), 8) },
        { label: "Values included", value: String(n) },
      ];
    },
    about: "The geometric mean is the central value of a set of positive numbers under multiplication. It is especially useful for compound growth, index construction and ratios because it gives the constant factor that would produce the same overall product as the observed factors. The harmonic mean is also shown for rates and ratios where reciprocals are the natural quantities to average.",
    howToUse: ["Enter positive numbers or growth factors, such as 1.05 for 5% growth and 0.96 for a 4% decline.", "Read the geometric mean for multiplicative growth or the harmonic mean for appropriate rate problems.", "Subtract one and multiply by 100 to turn a geometric-mean growth factor into an average percentage rate per period."],
    details: [
      { heading: "Growth factors belong in the calculation", body: "Do not enter 5, 12, −4 and 8 as ordinary percentages when averaging investment returns. Convert each return to 1 + r: 1.05, 1.12, 0.96 and 1.08. Their geometric mean minus one is the constant periodic return with the same compounded result. Zero and negative factors require a different analysis and are not accepted." },
      { heading: "Arithmetic, geometric and harmonic means", body: "For positive unequal values, arithmetic mean ≥ geometric mean ≥ harmonic mean. They coincide only when every value is equal. The arithmetic mean adds, the geometric mean multiplies, and the harmonic mean averages reciprocals. Equal-speed journeys over equal distances use a harmonic mean, not a simple arithmetic average." },
    ],
    formula: "Geometric mean = (x₁·x₂·…·xₙ)^(1/n) = exp(Σln(x) ÷ n). Harmonic mean = n ÷ Σ(1/x).",
    example: "Growth factors 1.05, 1.12, 0.96 and 1.08 have a geometric mean of about 1.05135. That corresponds to approximately 5.14% compound growth per period.",
    tips: ["Represent a loss as a factor below one rather than a negative percentage.", "Use arithmetic mean for additive totals, not compounded performance.", "Very large products are evaluated through logarithms to reduce numerical overflow."],
    faqs: [
      { q: "Why must all values be positive?", a: "The standard real-valued geometric mean uses logarithms and an nth root of the product. Zero and negative observations need problem-specific treatment and are excluded here." },
      { q: "How do I get an average growth rate?", a: "Enter periodic growth factors, then calculate geometric mean − 1 and multiply by 100. For example, 1.04 corresponds to 4% per period." },
      { q: "When should I use harmonic mean?", a: "Use it when averaging rates with a fixed numerator, such as speeds over equal distances or price-to-earnings ratios in appropriately defined contexts." },
    ],
  }),
  tool({
    slug: "standard-error-calculator",
    name: "Standard Error Calculator",
    category: "Math",
    short: "Calculate sample standard deviation, standard error of the mean and an approximate 95% confidence interval.",
    keywords: "standard error calculator, standard error of the mean, sem calculator, confidence interval calculator, sample standard deviation",
    inputs: [textArea("n", "Sample observations", "42, 45, 47, 44, 50, 46, 43, 48")],
    compute: (v) => {
      const values = nums(v.n), n = values.length;
      if (n < 2) return [{ label: "Result", value: "Enter at least two observations" }];
      const mean = values.reduce((a, b) => a + b, 0) / n;
      const sampleVariance = values.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (n - 1);
      const sd = Math.sqrt(sampleVariance), se = sd / Math.sqrt(n), margin = 1.96 * se;
      return [
        { label: "Standard error of the mean", value: M(se, 6) },
        { label: "Sample standard deviation", value: M(sd, 6) },
        { label: "Sample mean", value: M(mean, 6) },
        { label: "Approximate 95% interval", value: `${M(mean - margin, 6)} to ${M(mean + margin, 6)}` },
        { label: "Relative standard error", value: M((se / Math.abs(mean)) * 100, 3) + "%" },
        { label: "Sample size", value: String(n) },
      ];
    },
    about: "Standard error of the mean (SEM) estimates how much a sample mean would vary across repeated samples from the same population. It is not the same as standard deviation: standard deviation describes spread among individual observations, while standard error describes uncertainty in the estimated mean. This calculator provides both, plus a simple normal-approximation interval for quick statistical exploration.",
    howToUse: ["Enter at least two independent numerical observations from the sample.", "Use sample standard deviation to understand observation spread and SEM to understand precision of the mean.", "For small samples or formal inference, replace the 1.96 multiplier with the appropriate t value and check the statistical assumptions."],
    details: [
      { heading: "Why larger samples have smaller standard error", body: "With a fixed population standard deviation, SEM falls in proportion to the inverse square root of sample size. Quadrupling the sample size halves the standard error; doubling it only reduces SEM by about 29%. More data improves precision, but it does not correct biased sampling or systematic measurement error." },
      { heading: "Interpreting the approximate interval", body: "The displayed mean ± 1.96 × SEM is a large-sample normal approximation. It is not a prediction interval for individual observations and does not mean 95% of the data lie inside it. Small samples generally need a t-based interval, and skewed data, dependence or outliers may require other methods." },
    ],
    formula: "Sample s = √(Σ(x−x̄)² ÷ (n−1)); SEM = s ÷ √n. Approximate 95% interval = x̄ ± 1.96 × SEM.",
    example: "For the default eight observations, the mean is 45.625 and sample standard deviation is about 2.56. SEM is about 0.905, giving an approximate 95% interval around the mean of roughly 43.85 to 47.40.",
    tips: ["Do not replace sample variance's n−1 divisor with n when estimating from a sample.", "Report the sample size and method beside any interval.", "A narrow interval cannot compensate for a biased or unrepresentative sample."],
    faqs: [
      { q: "What is the difference between SD and SEM?", a: "SD describes variability among observations. SEM estimates variability of the sample mean and equals SD divided by the square root of sample size." },
      { q: "Does standard error always decrease with more data?", a: "Under the usual independent-sampling model it decreases as 1/√n, though an observed estimate can fluctuate because the sample SD also changes." },
      { q: "Why is the confidence interval labelled approximate?", a: "It uses a fixed normal multiplier of 1.96 rather than a t distribution and assumes the sampling model is suitable, so it is mainly a large-sample approximation." },
    ],
  }),
  tool({
    slug: "matrix-determinant-calculator",
    name: "Matrix Determinant Calculator",
    category: "Math",
    short: "Calculate the determinant, trace and transpose of a 2 × 2 or 3 × 3 matrix.",
    keywords: "matrix determinant calculator, determinant calculator, 3x3 determinant, 2x2 matrix calculator, matrix trace transpose",
    inputs: [
      selectInput("size", "Matrix size", "3", [["2", "2 × 2"], ["3", "3 × 3"]]),
      textArea("matrix", "Matrix values by row", "2, 1, 3\n4, 0, 5\n1, -2, 2"),
    ],
    compute: (v) => {
      const size = N(v.size), values = nums(v.matrix);
      if (values.length !== size * size) return [{ label: "Result", value: `Enter exactly ${size * size} numeric values` }];
      const at = (row: number, col: number) => values[row * size + col] ?? 0;
      let determinant = 0;
      if (size === 2) determinant = at(0, 0) * at(1, 1) - at(0, 1) * at(1, 0);
      else determinant = at(0, 0) * (at(1, 1) * at(2, 2) - at(1, 2) * at(2, 1)) - at(0, 1) * (at(1, 0) * at(2, 2) - at(1, 2) * at(2, 0)) + at(0, 2) * (at(1, 0) * at(2, 1) - at(1, 1) * at(2, 0));
      const transpose = Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, col) => M(at(col, row), 6)).join(", ")).join("\n");
      return [
        { label: "Determinant", value: M(determinant, 8) },
        { label: "Matrix type", value: Math.abs(determinant) < 1e-12 ? "Singular — no inverse" : "Non-singular — invertible" },
        { label: "Trace", value: M(Array.from({ length: size }, (_, i) => at(i, i)).reduce((a, b) => a + b, 0), 8) },
        { label: "Transpose", value: transpose },
      ];
    },
    about: "A determinant is a scalar calculated from a square matrix. It encodes whether the matrix is invertible and how its linear transformation scales area in two dimensions or volume in three. This calculator evaluates 2 × 2 and 3 × 3 real matrices, shows the trace and transpose, and identifies singular matrices whose determinant is zero.",
    howToUse: ["Choose 2 × 2 or 3 × 3 and enter exactly four or nine numeric coefficients.", "Arrange entries row by row, using commas or whitespace between values and line breaks between rows.", "Read the determinant and invertibility result; the transpose and trace provide useful checks for further matrix work."],
    details: [
      { heading: "What a zero determinant means", body: "A zero determinant means the rows or columns are linearly dependent. The transformation collapses space onto a lower dimension, so it cannot be reversed by a unique inverse matrix. A non-zero determinant establishes invertibility, although a determinant very close to zero can indicate numerical ill-conditioning." },
      { heading: "Determinants, area and volume", body: "For a 2 × 2 matrix, the absolute determinant is the area of the parallelogram formed by its column vectors. For 3 × 3 it is the volume scale factor of the corresponding parallelepiped. The sign reflects orientation: swapping two rows reverses the sign without changing the absolute scale factor." },
    ],
    formula: "2 × 2: |A| = ad − bc. 3 × 3 uses cofactor expansion: a(ei−fh) − b(di−fg) + c(dh−eg). Trace = sum of diagonal entries.",
    example: "For [[2,1,3],[4,0,5],[1,−2,2]], the determinant is 27 and the trace is 4. Because the determinant is non-zero, the matrix is invertible.",
    tips: ["Keep row order consistent; swapping rows changes the determinant's sign.", "Use decimal points rather than decimal commas as separators.", "Near-zero floating-point results are treated as singular only within a very small numerical tolerance."],
    faqs: [
      { q: "Can a non-square matrix have a determinant?", a: "No. The determinant is defined only for square matrices. This page supports the common 2 × 2 and 3 × 3 cases." },
      { q: "Does determinant zero mean every entry is zero?", a: "No. Many non-zero matrices are singular. For example, two identical rows make the determinant zero even when all entries are non-zero." },
      { q: "What is the trace?", a: "The trace is the sum of entries on the main diagonal, from top left to bottom right. It is not generally the same as the determinant." },
    ],
  }),
  tool({
    slug: "simultaneous-equations-calculator",
    name: "Simultaneous Equations Calculator",
    category: "Math",
    short: "Solve two linear equations in x and y, including inconsistent and dependent systems.",
    keywords: "simultaneous equations calculator, system of equations calculator, 2 variable equation solver, linear equations x y, cramer rule calculator",
    inputs: [
      textInput("eq1", "Equation 1: a, b, c for ax + by = c", "2, 3, 13"),
      textInput("eq2", "Equation 2: a, b, c for ax + by = c", "4, -1, 5"),
    ],
    compute: (v) => {
      const first = nums(v.eq1), second = nums(v.eq2);
      if (first.length !== 3 || second.length !== 3) return [{ label: "Result", value: "Enter three coefficients for each equation" }];
      const [a, b, c] = first, [d, e, f] = second;
      const determinant = a * e - b * d;
      const dx = c * e - b * f, dy = a * f - c * d;
      if (Math.abs(determinant) < 1e-12) {
        const dependent = Math.abs(dx) < 1e-12 && Math.abs(dy) < 1e-12;
        return [
          { label: "Solution type", value: dependent ? "Infinitely many solutions — dependent equations" : "No solution — inconsistent parallel lines" },
          { label: "Coefficient determinant", value: M(determinant, 8) },
        ];
      }
      return [
        { label: "x", value: M(dx / determinant, 8) },
        { label: "y", value: M(dy / determinant, 8) },
        { label: "Solution type", value: "One unique solution" },
        { label: "Coefficient determinant", value: M(determinant, 8) },
        { label: "Check equation 1", value: `${M(a * (dx / determinant) + b * (dy / determinant), 8)} = ${M(c, 8)}` },
        { label: "Check equation 2", value: `${M(d * (dx / determinant) + e * (dy / determinant), 8)} = ${M(f, 8)}` },
      ];
    },
    about: "Two simultaneous linear equations describe two straight lines in the xy-plane. Their intersection, if unique, is the ordered pair that satisfies both equations. Enter each in standard form and this solver applies Cramer's rule, verifies the solution by substitution, and distinguishes systems with no solution from dependent equations with infinitely many solutions.",
    howToUse: ["Rearrange each equation as ax + by = c, moving constants to the right-hand side.", "Enter a, b and c in order for both equations, preserving negative signs.", "Check x and y in the original equations and read the determinant if the system has no unique intersection."],
    details: [
      { heading: "Three possible outcomes", body: "Non-parallel lines meet once and produce a unique solution. Distinct parallel lines never meet, so the equations are inconsistent. Coincident lines represent the same set of points and produce infinitely many solutions. The coefficient determinant separates the first case from the other two; the numerator determinants then distinguish dependence from inconsistency." },
      { heading: "Why standard form matters", body: "For y = 2x + 5, rearrange to −2x + y = 5 before entering coefficients. A common error is entering the slope as a while leaving y on the left with the wrong sign. Fractions can be entered as decimals, but keeping exact values until the final step reduces rounding differences." },
    ],
    formula: "D = ae − bd, Dx = ce − bf and Dy = af − cd for a₁x+b₁y=c₁ and a₂x+b₂y=c₂. If D ≠ 0, x = Dx/D and y = Dy/D.",
    example: "For 2x + 3y = 13 and 4x − y = 5, D = −14, Dx = −28 and Dy = −42. Therefore x = 2 and y = 3; substitution gives 13 and 5 respectively.",
    tips: ["Move every constant to the right before extracting a, b and c.", "A coefficient of zero must still be entered to keep all three positions.", "Use the substitution checks to catch sign and entry mistakes."],
    faqs: [
      { q: "What does a zero determinant mean?", a: "The equations do not have one unique intersection. They either describe parallel distinct lines with no solution or the same line with infinitely many solutions." },
      { q: "Can I solve equations with decimals?", a: "Yes. Integer and decimal coefficients are supported. Results may be rounded for display, so retain full precision in later work when needed." },
      { q: "Does this handle three variables?", a: "No. This page is specifically for two linear equations in x and y; larger systems require a matrix or general linear-system solver." },
    ],
  }),
  tool({
    slug: "day-of-week-calculator",
    name: "Day of the Week Calculator",
    category: "Date & Time",
    short: "Find the weekday, day of the year, ISO week and days remaining for any calendar date.",
    keywords: "day of the week calculator, what day was i born, weekday calculator, day of year calculator, calendar day lookup",
    inputs: [{ key: "date", label: "Calendar date", type: "date", def: "2026-11-14" }],
    compute: (v) => {
      const date = roundDate(String(v.date));
      if (Number.isNaN(date.getTime())) return [{ label: "Result", value: "Enter a valid date" }];
      const year = date.getUTCFullYear();
      const start = Date.UTC(year, 0, 1), end = Date.UTC(year + 1, 0, 1);
      const dayOfYear = Math.round((date.getTime() - start) / 86400000) + 1;
      const iso = new Date(date);
      iso.setUTCDate(iso.getUTCDate() + 4 - (iso.getUTCDay() || 7));
      const isoYearStart = new Date(Date.UTC(iso.getUTCFullYear(), 0, 1));
      const week = Math.ceil((((iso.getTime() - isoYearStart.getTime()) / 86400000) + 1) / 7);
      return [
        { label: "Day of the week", value: new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(date) },
        { label: "Full date", value: new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeZone: "UTC" }).format(date) },
        { label: "Day of the year", value: `${dayOfYear} of ${Math.round((end - start) / 86400000)}` },
        { label: "ISO week number", value: `Week ${week}` },
        { label: "Days remaining after this date", value: String(Math.round((end - date.getTime()) / 86400000) - 1) },
        { label: "Leap year", value: new Date(Date.UTC(year, 1, 29)).getUTCMonth() === 1 ? "Yes" : "No" },
      ];
    },
    about: "This calendar lookup identifies the weekday for a past or future Gregorian date and places it within the year. Alongside the weekday, it reports ordinal day, ISO week number, remaining days and leap-year status. Calculations use calendar dates in UTC so the answer does not shift when your device is in a different timezone.",
    howToUse: ["Choose or type the exact Gregorian calendar date.", "Read the weekday and full formatted date to confirm the selection.", "Use the ISO week for standard week-based reporting and the ordinal day for year-based planning."],
    details: [
      { heading: "Historical calendar changes", body: "The calculator uses the proleptic Gregorian calendar supplied by the browser. That is appropriate for modern dates and arithmetic, but historical records may follow the Julian calendar or a local adoption date. For events around a calendar transition, verify which calendar the original source used." },
      { heading: "ISO week numbers can cross calendar years", body: "ISO weeks begin on Monday, and week one contains the year's first Thursday. Dates at the very beginning or end of December and January can therefore belong to an ISO week numbered for the adjacent year. The ordinal day and calendar-year fields remain separate from that convention." },
    ],
    formula: "Ordinal day = elapsed whole days since 1 January + 1. ISO week is based on the Thursday of the date's Monday-start week. Leap years are divisible by 4, except centuries not divisible by 400.",
    example: "14 November 2026 is a Saturday. It is day 318 of a 365-day year, falls in ISO week 46 and has 47 calendar days remaining after it in 2026.",
    tips: ["Use YYYY-MM-DD when typing a date to avoid ambiguous formats.", "Check historical sources for Julian-to-Gregorian conversion.", "ISO week numbering is Monday-based and may differ from local week-of-year reports."],
    faqs: [
      { q: "Does the result depend on my timezone?", a: "No. The selected date is interpreted as a calendar day at UTC noon, preventing the weekday from shifting because of the viewer's local timezone." },
      { q: "Can I find the day I was born?", a: "Yes, select your birth date. For very old records, confirm whether the Gregorian calendar applied at that place and time." },
      { q: "What is an ordinal date?", a: "It expresses a date as its sequential day within the year, from 1 on 1 January through 365 or 366 at year end." },
    ],
  }),
  tool({
    slug: "leap-year-calculator",
    name: "Leap Year Calculator",
    category: "Date & Time",
    short: "Check Gregorian leap-year rules and find the previous and next leap years.",
    keywords: "leap year calculator, is it a leap year, next leap year, leap year rules, february 29 calculator",
    inputs: [numberInput("year", "Gregorian year", "2026")],
    compute: (v) => {
      const year = Math.trunc(N(v.year));
      const leap = (y: number) => y % 400 === 0 || (y % 4 === 0 && y % 100 !== 0);
      if (!Number.isFinite(year) || year < 1) return [{ label: "Result", value: "Enter a positive year" }];
      let next = year, previous = year;
      if (!leap(year)) {
        while (!leap(next)) next += 1;
        while (previous > 1 && !leap(previous)) previous -= 1;
      }
      return [
        { label: `${year} leap-year status`, value: leap(year) ? "Leap year — 366 days" : "Common year — 365 days" },
        { label: "Days in February", value: leap(year) ? "29 days" : "28 days" },
        { label: "Next leap year", value: String(next) },
        { label: "Previous leap year", value: String(previous) },
        { label: "Divisibility checks", value: `÷4: ${year % 4 === 0 ? "yes" : "no"}; ÷100: ${year % 100 === 0 ? "yes" : "no"}; ÷400: ${year % 400 === 0 ? "yes" : "no"}` },
      ];
    },
    about: "A leap year adds 29 February to keep the calendar aligned with Earth's orbital period. The rule is more precise than simply every four years: century years are normally common years unless divisible by 400. This tool applies the complete Gregorian rule and locates the nearest leap years, making century exceptions and February length explicit.",
    howToUse: ["Enter a positive Gregorian calendar year.", "Read whether it has 365 or 366 days and whether February has 28 or 29 days.", "Inspect the divisibility checks to understand the result, especially for years ending in 00."],
    details: [
      { heading: "Why century years are special", body: "The average Gregorian year is 365.2425 days. Removing three leap days every 400 years corrects most of the excess created by a simple four-year rule. Thus 1896 and 1904 were leap years but 1900 was not; similarly, 2000 was a leap year because it is divisible by 400." },
      { heading: "Leap seconds are different", body: "Leap years adjust the calendar date, while leap seconds occasionally adjust Coordinated Universal Time to keep atomic time aligned with Earth's rotation. One does not predict or determine the other. This page addresses only the calendar's extra day in February." },
    ],
    formula: "A year is a leap year if divisible by 400, or if divisible by 4 but not by 100. Otherwise it is a common year.",
    example: "2026 is not divisible by four, so it is a common year with 365 days. The next leap year is 2028. By contrast, 2100 is divisible by 100 but not 400, so it will not be a leap year.",
    tips: ["Do not treat every fourth year as leap when the year ends in 00.", "Use 366 days for annual calculations covering a leap year's full calendar.", "For a date range, count actual days rather than assuming every February has 29 days."],
    faqs: [
      { q: "Was 2000 a leap year?", a: "Yes. Although 2000 is a century year, it is divisible by 400 and therefore remained a leap year." },
      { q: "Will 2100 be a leap year?", a: "No. It is divisible by 100 but not 400, so the century exception makes it a common year." },
      { q: "Why do we have leap years?", a: "A tropical year is not an exact whole number of days. Leap days reduce the long-term drift between calendar dates and the seasons." },
    ],
  }),
  tool({
    slug: "time-zone-converter",
    name: "Time Zone Converter",
    category: "Date & Time",
    short: "Convert a specific local date and time between world timezones with daylight-saving rules applied.",
    keywords: "time zone converter, world time converter, timezone meeting planner, est to pst converter, local time conversion",
    inputs: [
      { key: "date", label: "Date in source timezone", type: "date", def: "2026-11-14" },
      textInput("time", "Local time (24-hour)", "12:00"),
      selectInput("from", "From timezone", "America/New_York", zoneOptions),
      selectInput("to", "To timezone", "Asia/Karachi", zoneOptions),
    ],
    compute: (v) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v.date)) || !/^\d{2}:\d{2}$/.test(String(v.time))) return [{ label: "Result", value: "Enter date as YYYY-MM-DD and time as HH:MM" }];
      try {
        const instant = zonedDateToUtc(String(v.date), String(v.time), String(v.from));
        const full = new Intl.DateTimeFormat("en-US", { timeZone: String(v.to), dateStyle: "full", timeStyle: "long" }).format(instant);
        const short = new Intl.DateTimeFormat("en-GB", { timeZone: String(v.to), hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZoneName: "short" }).format(instant);
        const source = new Intl.DateTimeFormat("en-US", { timeZone: String(v.from), dateStyle: "medium", timeStyle: "short" }).format(instant);
        return [
          { label: "Converted local time", value: short },
          { label: "Full converted date and time", value: full },
          { label: "Source time", value: source },
          { label: "Exact UTC instant", value: instant.toISOString().replace(".000", "") },
          { label: "Destination timezone", value: String(v.to).replaceAll("_", " ") },
        ];
      } catch {
        return [{ label: "Result", value: "Enter a valid date, time and timezone" }];
      }
    },
    about: "A timezone conversion maps one exact instant to local clocks in different places. Unlike adding a fixed number of hours, this converter uses the browser's IANA timezone database, including daylight-saving transitions and regional offsets for the selected date. That distinction matters for international meetings, travel, broadcasts and deadlines near seasonal clock changes.",
    howToUse: ["Enter the date and 24-hour wall-clock time as observed in the source timezone.", "Choose the source city or region, then the destination timezone.", "Check the converted full date as well as the clock time; crossing midnight can move the meeting to another day."],
    details: [
      { heading: "Why city timezones are better than fixed abbreviations", body: "Labels such as EST and CST can be ambiguous and do not describe every seasonal rule. IANA regions such as America/New_York apply daylight saving on the correct dates, while Asia/Karachi and Asia/Kolkata use their own current and historical rules. Always share the date when arranging a conversion because offsets can change during the year." },
      { heading: "Clock-change gaps and repeated times", body: "When clocks move forward, some local times do not exist; when they move back, a local time can occur twice. The converter resolves entries through the environment's timezone rules, but for critical events in those windows, confirm the offset or UTC instant with every participant. Use the displayed ISO UTC value as an unambiguous reference." },
    ],
    formula: "The source wall time is resolved to a UTC instant using the source region's offset on that date, then formatted with the destination region's offset at the same instant. No fixed hour difference is assumed.",
    example: "12:00 in New York on 14 November 2026 is 17:00 UTC. In Karachi, which is UTC+5 on that date, it is 22:00 on the same calendar day.",
    tips: ["Include the full date in every international invitation.", "Use the UTC instant to remove ambiguity around daylight-saving transitions.", "Confirm unusual historical offsets with an authoritative timezone record when working with archival data."],
    faqs: [
      { q: "Does this account for daylight saving time?", a: "Yes. It uses IANA regional timezone data for the selected date rather than a fixed offset, including daylight-saving rules supported by the browser." },
      { q: "Why does the converted date sometimes change?", a: "Timezones can be many hours apart. A source time near midnight can fall on the previous or next calendar day at the destination." },
      { q: "What does the Z in the UTC result mean?", a: "Z indicates Coordinated Universal Time with zero offset. The ISO timestamp identifies the same exact instant independent of local clock conventions." },
    ],
  }),
];
