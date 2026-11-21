// Batch 27 — stats & geometry tools: mean, median, mode, Pearson
// correlation, hypotenuse, distance between two points.
import type { Calc } from "../tool-types";
import { fmt } from "../calculators";
import { N, textArea } from "./shared";

const m = (n: number, d = 2) => fmt(n, d);

/** Parse a whitespace/comma/semicolon-separated list of numbers. */
const nums = (value: unknown) =>
  String(value ?? "")
    .split(/[\s,;]+/)
    .map(Number)
    .filter(Number.isFinite);

const statsSummary = (xs: number[]) => {
  const sorted = [...xs].sort((a, b) => a - b);
  const sum = xs.reduce((s, x) => s + x, 0);
  return { sorted, sum, mean: xs.length ? sum / xs.length : NaN };
};

export const batch27StatsTools: Calc[] = [
  {
    slug: "mean-calculator",
    name: "Mean Calculator",
    category: "Math",
    short: "Arithmetic mean (average) of a list of numbers.",
    keywords:
      "mean calculator, average calculator, arithmetic mean calculator, calculate mean, mean of numbers",
    popular: true,
    inputs: [
      textArea("l", "Numbers (separated by commas, spaces or new lines)", "4, 8, 15, 16, 23, 42"),
    ],
    compute: (v) => {
      const xs = nums(v.l);
      if (xs.length === 0) return [{ label: "Mean", value: "Enter at least one number" }];
      const { sum, mean } = statsSummary(xs);
      return [
        { label: "Mean (average)", value: m(mean) },
        { label: "Sum", value: m(sum) },
        { label: "Count", value: String(xs.length) },
        { label: "Smallest", value: m(Math.min(...xs)) },
        { label: "Largest", value: m(Math.max(...xs)) },
      ];
    },
    about:
      "Find the arithmetic mean — the average — of a list of numbers: add them all up and divide by how many there are. It is the single number most people mean when they say “average”, and it is how averages are reported for grades, measurements, survey scores and sports statistics. The calculator also shows the sum, the count and the smallest and largest values, so you can see whether one extreme value is pulling the average away from the middle of the list.",
    formula:
      "Mean = (x₁ + x₂ + … + xₙ) ÷ n, where n is how many numbers there are. For example, the mean of 4, 8 and 15 is (4 + 8 + 15) ÷ 3 = 9.",
    example:
      "The mean of 4, 8, 15, 16, 23 and 42 is 18: the numbers add up to 108 and there are 6 of them, so 108 ÷ 6 = 18.",
    howToUse: [
      "Paste or type your numbers, separated by commas, spaces or new lines.",
      "Read the mean — the sum, count, smallest and largest values are shown too.",
      "Add or remove numbers to see how the average moves.",
    ],
    details: [
      {
        heading: "When the mean misleads",
        body: "The mean is sensitive to extreme values. A list like 2, 3, 4, 5, 100 has a mean of 22.8, even though four of the five numbers are under 6. When a few very large or very small values are present, the median (the middle value) is often a fairer summary — try the median calculator on the same list and compare.",
      },
      {
        heading: "Mean, median and mode together",
        body: "The three averages answer different questions. The mean is the balance point of the data, the median is the middle value, and the mode is the most common value. When all three are close together, the data is roughly symmetric; when they differ a lot, the data is skewed. Reporting all three gives a much better picture than any one alone.",
      },
    ],
    tips: [
      "Separate numbers with commas, spaces or new lines — any of them works.",
      "If one huge value is dragging the mean away, check the median too.",
      "The mean of a single number is that number itself.",
    ],
    faqs: [
      {
        q: "What is the mean?",
        a: "The arithmetic mean is the sum of a list of numbers divided by how many numbers there are. It is the usual meaning of “average”.",
      },
      {
        q: "How do you calculate the mean?",
        a: "Add up all the numbers, then divide by the count. For 4, 8 and 15: (4 + 8 + 15) ÷ 3 = 27 ÷ 3 = 9.",
      },
      {
        q: "What is the difference between the mean and the median?",
        a: "The mean is the total divided by the count; the median is the middle value when the numbers are sorted. The median ignores extreme values, so it is steadier when the data has outliers.",
      },
      {
        q: "Can the mean be a decimal?",
        a: "Yes — the mean is often a decimal even when every input is a whole number, for example the mean of 1 and 2 is 1.5.",
      },
    ],
  },
  {
    slug: "median-calculator",
    name: "Median Calculator",
    category: "Math",
    short: "Median (middle value) of a list of numbers.",
    keywords:
      "median calculator, find median, middle value calculator, median of numbers, calculate median",
    inputs: [
      textArea("l", "Numbers (separated by commas, spaces or new lines)", "4, 8, 15, 16, 23, 42"),
    ],
    compute: (v) => {
      const xs = nums(v.l);
      if (xs.length === 0) return [{ label: "Median", value: "Enter at least one number" }];
      const { sorted } = statsSummary(xs);
      const mid = Math.floor(sorted.length / 2);
      const median =
        sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
      return [
        { label: "Median", value: m(median) },
        { label: "Sorted numbers", value: sorted.join(", ") },
        { label: "Count", value: String(xs.length) },
        { label: "Smallest", value: m(sorted[0]!) },
        { label: "Largest", value: m(sorted[sorted.length - 1]!) },
      ];
    },
    about:
      "Find the median of a list of numbers — the middle value when the numbers are sorted from smallest to largest. If there is an odd count, the median is the single middle number; if there is an even count, it is the average of the two middle numbers. The median is the go-to average when a few extreme values would drag the mean away from the typical value: house prices and incomes are usually reported as medians for exactly this reason.",
    formula:
      "Sort the numbers. With an odd count n, the median is the value at position (n + 1) ÷ 2. With an even count, it is the average of the two middle values. For example, the median of 4, 8, 15, 16, 23 and 42 is (15 + 16) ÷ 2 = 15.5.",
    example:
      "The median of 4, 8, 15, 16, 23 and 42 is 15.5: sorted, the two middle numbers are 15 and 16, and (15 + 16) ÷ 2 = 15.5.",
    howToUse: [
      "Paste or type your numbers, separated by commas, spaces or new lines.",
      "Read the median — the sorted list is shown so you can check the middle.",
      "Compare with the mean calculator when the list has extreme values.",
    ],
    details: [
      {
        heading: "Why house prices use the median",
        body: "A street with nine £200,000 houses and one £5 million mansion has a mean price of £680,000, but the median is £200,000 — the price of a typical house on that street. The median ignores the mansion, which is why it is used for incomes, house prices and anything else where a few huge values would distort the picture.",
      },
      {
        heading: "Median with an even count",
        body: "With an even number of values there is no single middle number, so the median is defined as the average of the two middle values. This keeps the median consistent: adding one more value to the list moves the median smoothly instead of jumping between two neighbours.",
      },
    ],
    tips: [
      "The sorted list is shown — count in from each end to find the middle.",
      "The median never has to be one of your numbers (with an even count it is an average).",
      "For skewed data, the median is usually more useful than the mean.",
    ],
    faqs: [
      {
        q: "What is the median?",
        a: "The middle value of a sorted list of numbers. Half the values are below it and half are above it.",
      },
      {
        q: "How do you find the median with an even number of values?",
        a: "Sort the numbers and average the two middle values. For 4, 8, 15, 16, 23, 42 the middle pair is 15 and 16, so the median is 15.5.",
      },
      {
        q: "When should I use the median instead of the mean?",
        a: "When the data has outliers — a few very large or very small values. The median is not pulled around by them, so it describes the typical value better.",
      },
      {
        q: "Is the median always one of the numbers in the list?",
        a: "Only with an odd count. With an even count it is the average of the two middle numbers, which may not appear in the list.",
      },
    ],
  },
  {
    slug: "mode-calculator",
    name: "Mode Calculator",
    category: "Math",
    short: "Mode — the most common value (or values) in a list.",
    keywords:
      "mode calculator, find mode, most common value calculator, mode of numbers, calculate mode",
    inputs: [
      textArea("l", "Numbers (separated by commas, spaces or new lines)", "3, 5, 5, 7, 7, 7, 9"),
    ],
    compute: (v) => {
      const xs = nums(v.l);
      if (xs.length === 0) return [{ label: "Mode", value: "Enter at least one number" }];
      const counts = new Map<number, number>();
      for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1);
      const max = Math.max(...counts.values());
      const modes = [...counts.entries()].filter(([, c]) => c === max).map(([x]) => x).sort((a, b) => a - b);
      const modeLabel =
        max === 1
          ? "No mode — every value appears once"
          : modes.length > 1
            ? `${modes.join(", ")} (tied)`
            : String(modes[0]);
      return [
        { label: "Mode", value: modeLabel },
        { label: "Times it appears", value: max === 1 ? "1 (each value once)" : String(max) },
        { label: "Count", value: String(xs.length) },
        { label: "Distinct values", value: String(counts.size) },
      ];
    },
    about:
      "Find the mode of a list of numbers — the value that appears most often. A list can have one mode, several modes tied for first place, or no mode at all when every value appears exactly once. The mode is the only average that works for categories as well as numbers: the most common shoe size, the most frequent survey answer, or the most repeated test score are all modes.",
    formula:
      "Count how many times each value appears. The mode is the value with the highest count. If two values tie for the highest count, the list is bimodal; if every value appears once, there is no mode.",
    example:
      "The mode of 3, 5, 5, 7, 7, 7 and 9 is 7: it appears 3 times, more than any other value.",
    howToUse: [
      "Paste or type your numbers, separated by commas, spaces or new lines.",
      "Read the mode and how many times it appears.",
      "If several values tie, they are all listed.",
    ],
    details: [
      {
        heading: "One mode, two modes, no mode",
        body: "A list with a clear winner is unimodal; a list where two values tie for the top count is bimodal, and both are reported. When every value appears exactly once there is no mode — nothing is more common than anything else. A list like 1, 1, 2, 2, 3 has two modes (1 and 2), each appearing twice.",
      },
      {
        heading: "Mode for categories, not just numbers",
        body: "Mean and median need numbers, but the mode works for anything you can count: the most common eye colour in a class, the most popular pizza topping, or the most frequent error in a log file. That is why the mode is the standard “average” for survey answers and other categorical data.",
      },
    ],
    tips: [
      "The mode is the most common value — count, don't sort.",
      "A tie means more than one mode; the calculator lists them all.",
      "For survey answers and categories, the mode is the only average that applies.",
    ],
    faqs: [
      {
        q: "What is the mode?",
        a: "The value that appears most often in a list of numbers. For 3, 5, 5, 7, 7, 7, 9 the mode is 7, which appears 3 times.",
      },
      {
        q: "Can a list have more than one mode?",
        a: "Yes. If two values tie for the highest count, both are modes — the list is bimodal. The calculator lists every tied value.",
      },
      {
        q: "What if every number appears only once?",
        a: "Then there is no mode. Nothing is more common than anything else, so the calculator says so instead of picking a value at random.",
      },
      {
        q: "What is the mode used for?",
        a: "Finding the most common value: the most frequent test score, the most common shoe size, or the most popular answer in a survey.",
      },
    ],
  },
  {
    slug: "correlation-coefficient-calculator",
    name: "Correlation Coefficient Calculator",
    category: "Math",
    short: "Pearson correlation (r) between two lists of numbers.",
    keywords:
      "correlation coefficient calculator, pearson correlation calculator, correlation calculator, pearson r calculator, correlation between two variables",
    inputs: [
      textArea("x", "X values (separated by commas, spaces or new lines)", "1, 2, 3, 4, 5"),
      textArea("y", "Y values (same count as X)", "2, 4, 5, 4, 5"),
    ],
    compute: (v) => {
      const xs = nums(v.x);
      const ys = nums(v.y);
      if (xs.length === 0 || ys.length === 0) {
        return [{ label: "Correlation (r)", value: "Enter X and Y values" }];
      }
      if (xs.length !== ys.length) {
        return [{ label: "Correlation (r)", value: `X has ${xs.length} values but Y has ${ys.length} — the lists must match` }];
      }
      if (xs.length < 2) {
        return [{ label: "Correlation (r)", value: "Enter at least two pairs" }];
      }
      const mx = xs.reduce((s, x) => s + x, 0) / xs.length;
      const my = ys.reduce((s, y) => s + y, 0) / ys.length;
      let sxy = 0;
      let sxx = 0;
      let syy = 0;
      for (let i = 0; i < xs.length; i++) {
        const dx = xs[i]! - mx;
        const dy = ys[i]! - my;
        sxy += dx * dy;
        sxx += dx * dx;
        syy += dy * dy;
      }
      if (sxx === 0 || syy === 0) {
        return [{ label: "Correlation (r)", value: "One list never changes, so correlation is undefined" }];
      }
      const r = sxy / Math.sqrt(sxx * syy);
      const strength =
        Math.abs(r) >= 0.9
          ? "Very strong"
          : Math.abs(r) >= 0.7
            ? "Strong"
            : Math.abs(r) >= 0.4
              ? "Moderate"
              : Math.abs(r) >= 0.2
                ? "Weak"
                : "Very weak";
      const direction = r > 0 ? "positive — as X rises, Y tends to rise" : r < 0 ? "negative — as X rises, Y tends to fall" : "no linear relationship";
      return [
        { label: "Correlation (r)", value: m(r) },
        { label: "Strength", value: `${strength} ${direction}` },
        { label: "r² (variance explained)", value: m(r * r) },
        { label: "Pairs", value: String(xs.length) },
      ];
    },
    about:
      "Measure the Pearson correlation coefficient (r) between two lists of numbers — a single number from −1 to +1 that says how closely they move together in a straight line. A value near +1 means the two rise together, near −1 means one rises as the other falls, and near 0 means no straight-line relationship. The calculator also reports r², the share of the variation in one variable explained by the other. Correlation is not causation: two things can move together because both depend on a third factor.",
    formula:
      "r = Σ((x − x̄)(y − ȳ)) ÷ √(Σ(x − x̄)² × Σ(y − ȳ)²), where x̄ and ȳ are the means of the two lists. r² is the square of r and reads as the proportion of variance explained.",
    example:
      "For X = 1, 2, 3, 4, 5 and Y = 2, 4, 5, 4, 5 the correlation is 0.77 — a strong positive relationship, with r² = 0.60, so about 60% of the variation in Y is explained by X.",
    howToUse: [
      "Enter the X values in the first box and the Y values in the second, in matching order.",
      "Both lists must have the same count — each X pairs with the Y in the same position.",
      "Read r, its strength, and r².",
    ],
    details: [
      {
        heading: "Reading the result",
        body: "The sign of r tells the direction: positive means the two rise together, negative means one falls as the other rises. The size tells the strength — roughly, 0.7 and above is strong, 0.4–0.7 is moderate, below 0.4 is weak. r² turns it into a share: r = 0.77 gives r² = 0.60, meaning about 60% of the variation in Y is accounted for by its straight-line relationship with X.",
      },
      {
        heading: "What correlation cannot tell you",
        body: "Correlation only measures straight-line relationships. Two variables can be perfectly related in a curve (for example y = x² over a symmetric range) and still score near zero. It also says nothing about cause: ice-cream sales and sunburns correlate strongly because both rise in summer, not because one causes the other. And a single outlier can inflate or destroy r, so always plot the data as well as calculating it.",
      },
    ],
    tips: [
      "Keep the pairs in matching order — the first X goes with the first Y.",
      "Both lists need the same count, or the calculator will say so.",
      "Plot the data too: a curve or an outlier can hide behind a single number.",
    ],
    faqs: [
      {
        q: "What is the correlation coefficient?",
        a: "A number from −1 to +1 that measures how closely two lists of numbers move together in a straight line. +1 is a perfect rising relationship, −1 is a perfect falling one, 0 is no straight-line relationship.",
      },
      {
        q: "What is a good correlation?",
        a: "It depends on the field, but as a rough guide: 0.7 and above is strong, 0.4–0.7 is moderate, and below 0.4 is weak. In noisy real-world data, 0.4 can already be meaningful.",
      },
      {
        q: "Does correlation mean one thing causes the other?",
        a: "No. Correlation only shows that two things move together. Both could be caused by a third factor, or the link could be coincidence — that needs a separate investigation.",
      },
      {
        q: "What is r²?",
        a: "The square of r. It reads as the share of the variation in one variable explained by the other — r = 0.77 gives r² = 0.60, about 60%.",
      },
    ],
  },
  {
    slug: "hypotenuse-calculator",
    name: "Hypotenuse Calculator",
    category: "Math",
    short: "Hypotenuse of a right triangle from its two legs (Pythagoras).",
    keywords:
      "hypotenuse calculator, pythagoras calculator, pythagorean theorem calculator, right triangle hypotenuse, calculate hypotenuse",
    inputs: [
      { key: "a", label: "Side a (one leg)", def: "3" },
      { key: "b", label: "Side b (the other leg)", def: "4" },
    ],
    compute: (v) => {
      const a = N(v.a);
      const b = N(v.b);
      if (!(a > 0) || !(b > 0)) {
        return [{ label: "Hypotenuse (c)", value: "Enter two side lengths above 0" }];
      }
      const c = Math.sqrt(a * a + b * b);
      return [
        { label: "Hypotenuse (c)", value: m(c) },
        { label: "Perimeter", value: m(a + b + c) },
        { label: "Area", value: m((a * b) / 2) },
        { label: "Angle at A", value: `${m((Math.atan2(a, b) * 180) / Math.PI, 1)}°` },
      ];
    },
    about:
      "Find the hypotenuse of a right triangle — the longest side, opposite the right angle — from the two shorter sides. It uses Pythagoras' theorem: the square of the hypotenuse equals the sum of the squares of the other two sides. Builders use it to square up a corner (the 3-4-5 triangle), navigators use it for straight-line distances, and it is the same maths behind the distance formula in coordinate geometry.",
    formula:
      "c = √(a² + b²), where a and b are the two legs and c is the hypotenuse. For a = 3 and b = 4: c = √(9 + 16) = √25 = 5.",
    example:
      "A right triangle with legs 3 and 4 has a hypotenuse of 5 — the classic 3-4-5 triangle. Its perimeter is 12 and its area is 6.",
    howToUse: [
      "Enter the two shorter sides (the legs) of the right triangle.",
      "Read the hypotenuse — the perimeter, area and angle are shown too.",
      "Both sides must be above 0.",
    ],
    details: [
      {
        heading: "The 3-4-5 trick",
        body: "A triangle with sides 3, 4 and 5 is always right-angled, because 3² + 4² = 9 + 16 = 25 = 5². Builders have used this for centuries: measure 3 units along one wall and 4 along the other, and the diagonal between the marks must be exactly 5 units for the corner to be square. Any multiple works too — 6-8-10, 9-12-15, and so on.",
      },
      {
        heading: "Same maths, more dimensions",
        body: "The hypotenuse formula is the distance formula in disguise: the distance between two points is the hypotenuse of a right triangle whose legs are the differences in x and y. Add a third dimension and it extends again — the space diagonal of a box is √(a² + b² + c²). The same idea works in any number of dimensions.",
      },
    ],
    tips: [
      "The hypotenuse is always the longest side of the triangle.",
      "The 3-4-5 triangle is a quick way to check a right angle in the real world.",
      "Enter the two legs — the side opposite the right angle is the answer.",
    ],
    faqs: [
      {
        q: "What is the hypotenuse?",
        a: "The longest side of a right triangle — the side opposite the right angle. For legs 3 and 4, the hypotenuse is 5.",
      },
      {
        q: "How do you calculate the hypotenuse?",
        a: "Square both legs, add them, and take the square root: c = √(a² + b²). For 3 and 4: √(9 + 16) = √25 = 5.",
      },
      {
        q: "What is the 3-4-5 triangle?",
        a: "A right triangle with sides 3, 4 and 5. Because 3² + 4² = 5², it is always right-angled — builders use it to square up corners.",
      },
      {
        q: "Can I find a leg if I know the hypotenuse?",
        a: "Yes: a = √(c² − b²). Rearrange Pythagoras' theorem to solve for the missing side.",
      },
    ],
  },
  {
    slug: "distance-between-two-points-calculator",
    name: "Distance Between Two Points Calculator",
    category: "Math",
    short: "Straight-line distance between two points in 2D.",
    keywords:
      "distance between two points calculator, distance formula calculator, coordinate distance calculator, two point distance, euclidean distance calculator",
    inputs: [
      { key: "x1", label: "Point 1 — x", def: "1" },
      { key: "y1", label: "Point 1 — y", def: "2" },
      { key: "x2", label: "Point 2 — x", def: "4" },
      { key: "y2", label: "Point 2 — y", def: "6" },
    ],
    compute: (v) => {
      const x1 = N(v.x1);
      const y1 = N(v.y1);
      const x2 = N(v.x2);
      const y2 = N(v.y2);
      if ([x1, y1, x2, y2].some((n) => !Number.isFinite(n))) {
        return [{ label: "Distance", value: "Enter all four coordinates" }];
      }
      const dx = x2 - x1;
      const dy = y2 - y1;
      const d = Math.sqrt(dx * dx + dy * dy);
      const midpointX = (x1 + x2) / 2;
      const midpointY = (y1 + y2) / 2;
      return [
        { label: "Distance", value: m(d) },
        { label: "Change in x", value: m(dx) },
        { label: "Change in y", value: m(dy) },
        { label: "Midpoint", value: `(${m(midpointX)}, ${m(midpointY)})` },
      ];
    },
    about:
      "Find the straight-line (Euclidean) distance between two points on a coordinate grid. It is the same maths as Pythagoras' theorem: the distance is the hypotenuse of a right triangle whose legs are the differences in x and in y. Surveyors, map-makers, game developers and anyone working with coordinates use it constantly — from measuring a plot of land to checking how far apart two objects are on a screen.",
    formula:
      "d = √((x₂ − x₁)² + (y₂ − y₁)²). For (1, 2) and (4, 6): d = √((4 − 1)² + (6 − 2)²) = √(9 + 16) = √25 = 5.",
    example:
      "The distance between (1, 2) and (4, 6) is 5: the x difference is 3, the y difference is 4, and √(3² + 4²) = 5. The midpoint is (2.5, 4).",
    howToUse: [
      "Enter the x and y coordinates of both points.",
      "Read the straight-line distance — the midpoint is shown too.",
      "Negative coordinates work the same way.",
    ],
    details: [
      {
        heading: "It is Pythagoras in disguise",
        body: "Draw a horizontal line from the first point and a vertical line from the second and they meet at a right angle, forming a right triangle. The distance between the points is the hypotenuse, the x difference and y difference are the legs, and c = √(a² + b²) gives the answer. That is why the distance formula and the hypotenuse formula are the same calculation.",
      },
      {
        heading: "Distance vs. how far you travel",
        body: "This is the straight-line distance — as the crow flies. The distance you actually travel along roads, or in a grid of city blocks, is longer: city-block (Manhattan) distance is |x₂ − x₁| + |y₂ − y₁|, which for (1, 2) to (4, 6) is 3 + 4 = 7 rather than 5. Use the straight-line distance for maps and geometry, and the road distance for journeys.",
      },
    ],
    tips: [
      "The order of the points does not matter — the distance is the same either way.",
      "The midpoint is the point exactly halfway between the two.",
      "This is straight-line distance; road distance is longer.",
    ],
    faqs: [
      {
        q: "What is the distance formula?",
        a: "d = √((x₂ − x₁)² + (y₂ − y₁)²). Subtract the coordinates, square both differences, add them, and take the square root.",
      },
      {
        q: "How far apart are (1, 2) and (4, 6)?",
        a: "5 units. The x difference is 3 and the y difference is 4, so the distance is √(9 + 16) = 5.",
      },
      {
        q: "Does the order of the points matter?",
        a: "No. Swapping the two points gives the same distance, because the differences are squared.",
      },
      {
        q: "What is the midpoint?",
        a: "The point halfway between the two: ((x₁ + x₂) ÷ 2, (y₁ + y₂) ÷ 2). For (1, 2) and (4, 6) it is (2.5, 4).",
      },
    ],
  },
];
