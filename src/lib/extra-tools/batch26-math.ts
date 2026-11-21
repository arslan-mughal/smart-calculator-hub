// Batch 26 — math, conversion and sports tools: final grade, relative
// standard deviation, number of digits, decimal to BCD, binary to Gray
// code, FPS converter, ERA and OPS.
import type { Calc } from "../tool-types";
import { fmt } from "../calculators";
import { N, numberInput, selectInput, textInput } from "./shared";

const m = (n: number, d = 2) => fmt(n, d);

/** Parse a whitespace/comma/semicolon-separated list of numbers. */
const nums = (value: unknown) =>
  String(value ?? "")
    .split(/[\s,;]+/)
    .map(Number)
    .filter(Number.isFinite);

/** Sample standard deviation (n − 1 denominator). */
function sampleStdDev(xs: number[]): number {
  if (xs.length < 2) return NaN;
  const mean = xs.reduce((s, x) => s + x, 0) / xs.length;
  const variance = xs.reduce((s, x) => s + (x - mean) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(variance);
}

export const batch26MathTools: Calc[] = [
  {
    slug: "final-grade-calculator",
    name: "Final Grade Calculator",
    category: "Education",
    short: "What grade do you need on the final exam to reach your target course grade?",
    keywords:
      "final grade calculator, what grade do i need on the final, final exam grade calculator, grade needed on final exam, final exam calculator",
    popular: true,
    inputs: [
      { key: "current", label: "Current grade (before the final)", def: "88", suffix: "%" },
      { key: "weight", label: "Final exam weight", def: "25", suffix: "%" },
      { key: "target", label: "Target course grade", def: "90", suffix: "%" },
    ],
    compute: (v) => {
      const current = N(v.current);
      const weight = N(v.weight) / 100;
      const target = N(v.target);
      const rest = 1 - weight;
      const needed = weight > 0 ? (target - current * rest) / weight : NaN;
      const maxPossible = current * rest + 100 * weight;
      const minPossible = current * rest;
      const neededLabel =
        !Number.isFinite(needed) || weight <= 0
          ? "Enter a final-exam weight above 0%"
          : needed > 100
            ? `${m(needed, 1)}% — not possible, even a perfect final is not enough`
            : needed < 0
              ? "0% — you have already reached your target"
              : `${m(needed, 1)}%`;
      return [
        { label: "Grade needed on the final exam", value: neededLabel },
        { label: "Highest grade possible (100% on the final)", value: `${m(maxPossible, 1)}%` },
        { label: "Grade with 0% on the final", value: `${m(minPossible, 1)}%` },
        { label: "Your grade so far counts for", value: `${m(rest * 100, 0)}% of the course` },
      ];
    },
    about:
      "Find out exactly what you need on the final exam to reach your target grade for the course. Enter the grade you have so far, how much of the course the final is worth, and the final grade you want — the calculator works backwards through the weighted average. If the answer is over 100%, the target is out of reach even with a perfect final, and the calculator says so plainly instead of giving an impossible number.",
    formula:
      "Needed = (target − current × (1 − weight)) ÷ weight, where weight is the final exam's share of the course as a decimal. Highest possible = current × (1 − weight) + 100 × weight.",
    example:
      "You have 88% so far, the final is worth 25% of the course, and you want 90% overall: you need (90 − 88 × 0.75) ÷ 0.25 = 96% on the final. A perfect final would give you 91%, and a zero would leave you at 66%.",
    howToUse: [
      "Enter the grade you have earned so far, before the final.",
      "Enter how much of the course grade the final exam is worth.",
      "Enter the overall grade you are aiming for.",
      "Read the grade you need on the final — and the highest and lowest grades still possible.",
    ],
    details: [
      {
        heading: "How the weighted average works",
        body: "A course grade is a weighted average: each part counts in proportion to its weight. If coursework is 75% of the grade and the final is 25%, your current 88% is already locked in for three quarters of the result — only the final's quarter can still move it. That is why a high target can be impossible: the locked-in part sets a ceiling, and the calculator shows that ceiling as the highest grade possible.",
      },
      {
        heading: "What to do if the target is out of reach",
        body: "If the calculator says the target needs more than 100% on the final, you have three honest options: lower the target to something the numbers allow, check whether any coursework can still be improved or resubmitted, or ask your teacher whether the final's weight or any extra credit can change. What does not work is hoping the maths is wrong — it is not.",
      },
    ],
    tips: [
      "Check the syllabus: the final's weight is usually listed there — do not guess it.",
      "A small weight means the final can barely move your grade, for better or worse.",
      "Aim a little above the needed grade — exam-day surprises usually go the wrong way.",
    ],
    faqs: [
      {
        q: "How do I work out what I need on my final exam?",
        a: "Use the weighted average backwards: needed = (target − current × (1 − weight)) ÷ weight. With 88% so far, a 25% final and a 90% target, you need 96% on the final.",
      },
      {
        q: "What if I need more than 100% on the final?",
        a: "Then the target is impossible — even a perfect final cannot reach it. The highest grade possible is your current grade weighted plus 100% on the final, and the calculator shows it.",
      },
      {
        q: "Does the final exam weight matter a lot?",
        a: "Yes. A final worth 10% can only move your grade a few points either way; one worth 50% can swing it dramatically. Check your syllabus for the exact weight.",
      },
    ],
  },
  {
    slug: "relative-standard-deviation-calculator",
    name: "Relative Standard Deviation Calculator",
    category: "Math",
    short: "RSD as a percentage — how spread out your numbers are relative to their mean.",
    keywords:
      "relative standard deviation calculator, rsd calculator, coefficient of variation calculator, relative standard deviation formula, rsd percent",
    inputs: [
      {
        key: "l",
        label: "Numbers (comma or space separated)",
        type: "text",
        def: "4, 8, 15, 16, 23, 42",
      },
    ],
    compute: (v) => {
      const xs = nums(v.l);
      if (xs.length < 2) return [{ label: "Relative standard deviation", value: "Enter at least 2 numbers" }];
      const mean = xs.reduce((s, x) => s + x, 0) / xs.length;
      const sd = sampleStdDev(xs);
      const rsd = mean !== 0 ? (sd / Math.abs(mean)) * 100 : NaN;
      return [
        { label: "Count", value: fmt(xs.length, 0) },
        { label: "Mean", value: m(mean) },
        { label: "Standard deviation (sample)", value: m(sd) },
        { label: "Relative standard deviation (RSD)", value: Number.isFinite(rsd) ? `${m(rsd)}%` : "—" },
        { label: "Coefficient of variation", value: Number.isFinite(rsd) ? m(rsd / 100, 4) : "—" },
      ];
    },
    about:
      "The relative standard deviation (RSD) — also called the coefficient of variation — measures how spread out a set of numbers is relative to their average, as a percentage. A standard deviation of 5 means something very different for numbers around 10 than for numbers around 1,000, and the RSD fixes that by dividing the standard deviation by the mean. Scientists use it to compare the precision of measurements made on different scales, and analysts use it to compare the volatility of investments with very different prices.",
    formula:
      "RSD = (sample standard deviation ÷ |mean|) × 100%. The sample standard deviation uses n − 1 in the denominator. The coefficient of variation is the same ratio without the × 100.",
    example:
      "For 4, 8, 15, 16, 23 and 42 the mean is 18 and the sample standard deviation is 13.49, so the RSD is 13.49 ÷ 18 × 100% = 74.95% — a very spread-out set. For 98, 100, 101, 102 and 99 the RSD is only about 1.58%.",
    howToUse: [
      "Paste or type your numbers, separated by commas, spaces or line breaks.",
      "Read the mean, the sample standard deviation and the RSD as a percentage.",
      "Compare RSDs across different data sets — unlike the standard deviation, they are directly comparable.",
    ],
    details: [
      {
        heading: "What the RSD tells you",
        body: "A low RSD (a few percent) means the numbers cluster tightly around the mean — a precise measurement or a stable process. A high RSD (tens of percent) means the spread is large relative to the size of the numbers. As a rough guide, lab measurements often aim for an RSD under 5%, while financial returns routinely show RSDs over 50% — the number only makes sense against what is normal for the kind of data you have.",
      },
      {
        heading: "Sample vs population standard deviation",
        body: "This calculator uses the sample standard deviation (dividing by n − 1), which is the right choice when your numbers are a sample of a larger set — almost always the case for measurements and experiments. If your numbers are the entire population, the population standard deviation (dividing by n) would be slightly smaller, and so would the RSD. The difference shrinks as the sample grows.",
      },
      {
        heading: "When the RSD breaks down",
        body: "The RSD is meaningless when the mean is close to zero, because dividing by a tiny mean inflates the percentage enormously — a mean of 0.01 with a standard deviation of 1 gives an RSD of 10,000%. It also behaves oddly for data that can be negative. In those cases, use the plain standard deviation instead.",
      },
    ],
    tips: [
      "Use the RSD to compare precision across different scales — that is what it is for.",
      "Below 5% is tight for lab work; above 30% is very spread out for most measurements.",
      "If the mean is near zero, the RSD is meaningless — use the standard deviation instead.",
    ],
    faqs: [
      {
        q: "What is relative standard deviation?",
        a: "The standard deviation divided by the mean, as a percentage. It measures spread relative to the size of the numbers, so data sets on different scales can be compared directly.",
      },
      {
        q: "What is the difference between RSD and coefficient of variation?",
        a: "None — they are the same number. The coefficient of variation is the ratio (a decimal, e.g. 0.75) and the RSD is that ratio as a percentage (75%).",
      },
      {
        q: "What is a good RSD value?",
        a: "It depends on the field. In analytical chemistry, under 5% is usually wanted; in finance, 50% or more is normal. Judge it against what is typical for your kind of data, not against an absolute number.",
      },
    ],
  },
  {
    slug: "number-of-digits",
    name: "Number of Digits Calculator",
    category: "Math",
    short: "Count the digits in any number — integer part, decimal places and total.",
    keywords:
      "number of digits calculator, count digits in a number, how many digits, digits in a number calculator, digit counter",
    inputs: [textInput("n", "Number", "12345")],
    compute: (v) => {
      const raw = String(v.n ?? "").trim();
      const match = raw.match(/^[+-]?(\d*)(?:\.(\d*))?$/);
      if (!match || (match[1] === "" && (match[2] ?? "") === "")) {
        return [{ label: "Digits", value: "Enter a valid number" }];
      }
      const intPart = (match[1] ?? "").replace(/^0+(?=\d)/, "");
      const fracPart = match[2] ?? "";
      const intDigits = intPart === "" ? 0 : intPart.length;
      const total = intDigits + fracPart.length;
      return [
        { label: "Digits before the decimal point", value: fmt(intDigits, 0) },
        { label: "Digits after the decimal point", value: fmt(fracPart.length, 0) },
        { label: "Total digits", value: fmt(total, 0) },
        { label: "Is an integer", value: fracPart.length === 0 ? "Yes" : "No" },
        { label: "Sign", value: raw.startsWith("-") ? "Negative" : "Positive" },
      ];
    },
    about:
      "Count the digits in any number: how many before the decimal point, how many after it, and the total. The sign is ignored, leading zeros do not count, and a trailing decimal point with nothing after it counts as zero decimal places. It is the quick way to check the length of an ID number, a result, or a value you are about to paste into a form with a digit limit.",
    formula: "Total digits = digits in the integer part + digits in the fractional part. The sign and the decimal point itself are not digits.",
    example:
      "12345 has 5 digits, all before the decimal point. −12345.678 has 5 digits before the point, 3 after it, and 8 digits in total. 0.001 has 1 digit before the point and 3 after it.",
    howToUse: [
      "Type or paste the number.",
      "Read the digits before and after the decimal point, and the total.",
      "Negative signs are ignored — only the digits themselves are counted.",
    ],
    details: [
      {
        heading: "What counts as a digit",
        body: "Only the characters 0–9 count. The minus sign, the plus sign and the decimal point are not digits, and leading zeros in the integer part (007 is the number 7, with 1 digit) do not add to the count. Decimal places are counted exactly as written: 1.50 has 2 digits after the point, even though the trailing zero adds nothing to the value.",
      },
      {
        heading: "Why count digits at all",
        body: "Digit counts matter whenever a system limits them: credit-card numbers have 16 digits, a US phone number has 10, and many forms reject values that are too long. In programming, the digit count tells you the order of magnitude of a number — a 6-digit number is at least 100,000 — and in school maths it is the first step in rounding and significant-figure work.",
      },
    ],
    tips: [
      "Leading zeros do not count: 007 is a 1-digit number.",
      "The decimal point and the minus sign are never counted as digits.",
      "For very large numbers, use the digit count to check the order of magnitude at a glance.",
    ],
    faqs: [
      {
        q: "How many digits are in 12345?",
        a: "Five — all before the decimal point. The total digit count is the integer-part digits plus the fractional-part digits.",
      },
      {
        q: "Does the minus sign count as a digit?",
        a: "No. Only 0–9 count as digits, so −12345.678 has 8 digits: 5 before the decimal point and 3 after it.",
      },
      {
        q: "Do leading zeros count?",
        a: "No. 007 is the number 7, so it has 1 digit. Trailing zeros after the decimal point do count, because they are written digits: 1.50 has 2 decimal places.",
      },
    ],
  },
  {
    slug: "decimal-to-bcd-converter",
    name: "Decimal to BCD Converter",
    category: "Math",
    short: "Convert a decimal number to Binary-Coded Decimal — each digit as 4 bits.",
    keywords:
      "decimal to bcd converter, bcd converter, binary coded decimal converter, decimal to bcd calculator, bcd encoding",
    inputs: [textInput("n", "Decimal number (whole number)", "93")],
    compute: (v) => {
      const raw = String(v.n ?? "").trim();
      if (!/^\d+$/.test(raw)) {
        return [{ label: "BCD", value: "Enter a whole non-negative number" }];
      }
      const digits = raw.split("");
      const groups = digits.map((d) => Number(d).toString(2).padStart(4, "0"));
      const packed = digits
        .map((d) => Number(d).toString(16).toUpperCase())
        .join("");
      return [
        { label: "BCD (4 bits per digit)", value: groups.join(" ") },
        { label: "Packed BCD (hex)", value: `0x${packed}` },
        { label: "Digits", value: digits.map((d) => `${d} → ${Number(d).toString(2).padStart(4, "0")}`).join(", ") },
        { label: "Digit count", value: fmt(digits.length, 0) },
      ];
    },
    about:
      "Convert a decimal number to Binary-Coded Decimal (BCD): each decimal digit is written as its own 4-bit binary group, instead of converting the whole number to binary at once. 93 becomes 1001 0011 — 9 as 1001 and 3 as 0011 — which is not the same as 93 in plain binary (1011101). BCD is how many digital clocks, calculators and old mainframes stored numbers, because it keeps decimal digits intact and makes decimal arithmetic and seven-segment displays straightforward.",
    formula:
      "Write each decimal digit d as a 4-bit binary number (d in binary, padded to 4 bits) and join the groups. 0–9 map to 0000–1001; the codes 1010–1111 are unused in BCD.",
    example:
      "93 in BCD is 1001 0011: the digit 9 is 1001 and the digit 3 is 0011. Packed together that is 0x93. Plain binary 93 would be 1011101 — a different number of bits and a different value if read as BCD.",
    howToUse: [
      "Enter a whole non-negative decimal number.",
      "Read the BCD groups — one 4-bit group per decimal digit.",
      "The packed hex line shows the same digits squeezed into bytes.",
    ],
    details: [
      {
        heading: "BCD vs plain binary",
        body: "In plain binary, 93 is 1011101 — seven bits for the whole number. In BCD, 93 is 1001 0011 — eight bits, but each group of four is a decimal digit you can read directly. BCD wastes bits (the codes 1010–1111 are never used) and needs more storage, but it makes decimal arithmetic exact: adding 0.1 ten times in BCD gives exactly 1.0, where binary floating point gives 0.9999999999999999.",
      },
      {
        heading: "Where BCD is still used",
        body: "BCD survives wherever decimal digits must be exact or displayed directly: real-time clock chips, seven-segment displays, financial and accounting systems that cannot tolerate binary rounding, and the packed-decimal format of IBM mainframes. It is also a staple of electronics courses, because it is the clearest bridge between the decimal numbers humans use and the binary numbers machines use.",
      },
    ],
    tips: [
      "Read BCD in groups of four bits — each group is one decimal digit, 0–9.",
      "1010–1111 never appear in valid BCD; if you see them, the data is not BCD.",
      "BCD is not the same as binary: 93 is 1011101 in binary but 1001 0011 in BCD.",
    ],
    faqs: [
      {
        q: "What is BCD?",
        a: "Binary-Coded Decimal: a way of writing decimal numbers in binary where each decimal digit gets its own 4-bit group. 93 becomes 1001 0011 instead of the plain binary 1011101.",
      },
      {
        q: "Why use BCD instead of binary?",
        a: "Because it keeps decimal digits exact. Decimal arithmetic in BCD has no binary rounding error, and each digit maps directly onto a seven-segment display — useful in clocks, calculators and financial systems.",
      },
      {
        q: "How many bits does a BCD digit need?",
        a: "Four bits per digit, holding 0–9. The six codes 1010–1111 are unused, which is why BCD takes more space than plain binary.",
      },
    ],
  },
  {
    slug: "binary-to-gray-code-converter",
    name: "Binary to Gray Code Converter",
    category: "Math",
    short: "Convert binary to Gray code and back — one bit changes at a time.",
    keywords:
      "binary to gray code converter, gray code converter, gray code calculator, binary gray code, gray to binary converter",
    inputs: [
      textInput("n", "Binary number (0s and 1s)", "1010"),
      selectInput("dir", "Direction", "b2g", [
        ["b2g", "Binary → Gray code"],
        ["g2b", "Gray code → Binary"],
      ]),
    ],
    compute: (v) => {
      const raw = String(v.n ?? "").trim();
      if (!/^[01]+$/.test(raw)) {
        return [{ label: "Result", value: "Enter only 0s and 1s" }];
      }
      const width = raw.length;
      const toGray = (b: number) => b ^ (b >> 1);
      const fromGray = (g: number) => {
        let b = g;
        let shift = g >> 1;
        while (shift) {
          b ^= shift;
          shift >>= 1;
        }
        return b;
      };
      const value = parseInt(raw, 2);
      const out = String(v.dir) === "g2b" ? fromGray(value) : toGray(value);
      return [
        {
          label: String(v.dir) === "g2b" ? "Binary" : "Gray code",
          value: out.toString(2).padStart(width, "0"),
        },
        { label: "Decimal value", value: fmt(String(v.dir) === "g2b" ? out : value, 0) },
        { label: "Input", value: raw },
        { label: "Bits", value: fmt(width, 0) },
      ];
    },
    about:
      "Convert between binary and Gray code — the reflected binary code where each step changes only one bit. Binary 1010 (decimal 10) becomes Gray 1111; counting in Gray code goes 000, 001, 011, 010, 110, 111, 101, 100, with a single bit flipping at every step. That property is why Gray code is used in rotary encoders, analog-to-digital converters and error correction: a misread bit can only move the value by one step, never by a large jump.",
    formula:
      "Binary to Gray: gray = binary XOR (binary shifted right by 1). Gray to binary: repeatedly XOR the result with itself shifted right until the shift is zero.",
    example:
      "Binary 1010 is decimal 10. Shifted right by one it is 0101; XOR gives 1111, so the Gray code is 1111. Converting 1111 back gives 1010 again.",
    howToUse: [
      "Enter a binary number using only 0s and 1s.",
      "Choose binary to Gray code, or Gray code to binary.",
      "Read the converted value — leading zeros are kept so the width matches.",
    ],
    details: [
      {
        heading: "Why one bit at a time matters",
        body: "In ordinary binary, counting from 7 (0111) to 8 (1000) flips all four bits at once. If a sensor reads the bits during the change, it can briefly see any combination — 0111, 1111, 0000 — and report a wildly wrong position. In Gray code, 7 is 0100 and 8 is 1100: only the first bit changes, so a mid-change read can only ever be one step out. That is why position encoders and analog-to-digital converters use Gray code.",
      },
      {
        heading: "Gray code counting",
        body: "Gray code counting is a cycle: for three bits it runs 000, 001, 011, 010, 110, 111, 101, 100, then back to 000 with one bit changing — including the wrap from the last value back to the first. This reflected pattern is generated by mirroring the previous sequence and prefixing 1s, which is why it is also called reflected binary code.",
      },
    ],
    tips: [
      "The Gray code of a number always has the same number of bits — leading zeros are kept.",
      "Binary and Gray share the first bit: the most significant bit never changes.",
      "Use Gray code wherever a sensor reads a changing value — a glitch can only shift it by one step.",
    ],
    faqs: [
      {
        q: "What is Gray code?",
        a: "A binary numbering where consecutive values differ by exactly one bit. It is used in rotary encoders and converters so a misread can only move the value by one step.",
      },
      {
        q: "How do you convert binary to Gray code?",
        a: "XOR the binary number with itself shifted right by one bit. 1010 XOR 0101 = 1111, so binary 1010 becomes Gray code 1111.",
      },
      {
        q: "What is the Gray code of 0?",
        a: "0 — the Gray code of 0000 is 0000. The most significant bit is always the same in binary and Gray code.",
      },
    ],
  },
  {
    slug: "fps-converter",
    name: "FPS Converter",
    category: "Conversion",
    short: "Convert frames per second to frame time, Hz, frames per minute and more.",
    keywords:
      "fps converter, frames per second converter, fps to ms converter, frame time calculator, fps to hz, frames per second to milliseconds",
    inputs: [numberInput("fps", "Frames per second (fps)", "60")],
    compute: (v) => {
      const fps = N(v.fps);
      if (!(fps > 0)) return [{ label: "Frame time", value: "Enter a frame rate above 0" }];
      return [
        { label: "Frame time", value: `${m(1000 / fps)} ms per frame` },
        { label: "Frequency", value: `${m(fps)} Hz` },
        { label: "Frames per minute", value: fmt(fps * 60, 0) },
        { label: "Frames per hour", value: fmt(fps * 3600, 0) },
        { label: "Seconds per 1,000 frames", value: `${m(1000 / fps)} s` },
      ];
    },
    about:
      "Convert a frame rate in frames per second into everything it implies: how long each frame lasts in milliseconds, the frequency in hertz, and how many frames that means per minute and per hour. 60 fps is 16.67 ms per frame — the budget every frame has in a 60 Hz game or video. The same rate as a frequency is simply 60 Hz, because one frame per second is one cycle per second.",
    formula:
      "Frame time = 1,000 ÷ fps (milliseconds). Frequency = fps Hz. Frames per minute = fps × 60. Frames per hour = fps × 3,600.",
    example:
      "At 60 fps each frame lasts 16.67 ms, the frequency is 60 Hz, and there are 3,600 frames per minute and 216,000 per hour. At 24 fps — the cinema standard — each frame lasts 41.67 ms.",
    howToUse: [
      "Enter the frame rate in frames per second.",
      "Read the frame time in milliseconds — the budget each frame has.",
      "See the same rate as a frequency and as frames per minute and hour.",
    ],
    details: [
      {
        heading: "Why frame time matters",
        body: "Gamers and video engineers think in frame time, not fps, because frame time is what the hardware must achieve: at 60 fps every frame must render in 16.67 ms, and a single 33 ms frame is a visible stutter even if the average stays at 60. At 144 fps the budget is just 6.94 ms per frame, and at 30 fps it is a comfortable 33.33 ms. Averages hide stutters; frame times show them.",
      },
      {
        heading: "Common frame rates",
        body: "Cinema runs at 24 fps, television at 25 (PAL) or 30 (NTSC) fps, and most games target 60 fps, with competitive play at 120 or 144 fps and high-refresh monitors reaching 240 fps. A 24 fps film shown on a 60 Hz screen repeats frames in a 3:2 pattern, which is why film can look slightly juddery on a TV — the frame times do not divide evenly.",
      },
    ],
    tips: [
      "Frame time is the honest number: 16.67 ms per frame is what 60 fps really means.",
      "To halve the frame time you must double the frame rate — 120 fps is 8.33 ms per frame.",
      "Cinema's 24 fps gives each frame 41.67 ms — slow by gaming standards, but film hides it with motion blur.",
    ],
    faqs: [
      {
        q: "How many milliseconds is 60 fps?",
        a: "16.67 ms per frame — 1,000 ÷ 60. Each frame in a 60 fps game or video must be ready within that time.",
      },
      {
        q: "Is fps the same as Hz?",
        a: "Numerically, yes: 60 frames per second is a frequency of 60 Hz. But Hz describes the display's refresh rate while fps describes the content — a 60 fps game on a 144 Hz screen still shows 60 frames a second.",
      },
      {
        q: "What fps do films use?",
        a: "24 fps, the cinema standard for nearly a century. Television uses 25 or 30 fps, and games usually target 60 fps or more.",
      },
    ],
  },
  {
    slug: "era-calculator",
    name: "ERA Calculator",
    category: "Sports",
    short: "Baseball earned run average — earned runs per 9 innings pitched.",
    keywords:
      "era calculator, earned run average calculator, baseball era calculator, pitching era calculator, calculate era",
    inputs: [
      numberInput("er", "Earned runs allowed", "3"),
      numberInput("inn", "Complete innings pitched", "6"),
      selectInput("outs", "Outs in the partial inning", "0", [
        ["0", "0 outs"],
        ["1", "1 out (⅓ inning)"],
        ["2", "2 outs (⅔ inning)"],
      ]),
    ],
    compute: (v) => {
      const er = N(v.er);
      const innings = N(v.inn) + N(v.outs) / 3;
      const era = innings > 0 ? (er * 9) / innings : NaN;
      return [
        { label: "ERA", value: Number.isFinite(era) ? m(era) : "—" },
        { label: "Innings pitched", value: innings > 0 ? `${m(innings, 1)}` : "—" },
        { label: "Earned runs per inning", value: innings > 0 ? m(er / innings, 3) : "—" },
      ];
    },
    about:
      "Work out a baseball pitcher's earned run average (ERA): earned runs allowed per nine innings pitched. A pitcher who gives up 3 earned runs in 6 innings has an ERA of 4.50. Enter complete innings plus the outs in any partial inning — one out is a third of an inning, two outs are two thirds — because baseball counts innings in thirds, not tenths. Only earned runs count: runs that score because of errors or passed balls are excluded.",
    formula:
      "ERA = earned runs × 9 ÷ innings pitched. A partial inning counts as outs ÷ 3 — 1 out is ⅓ of an inning, 2 outs are ⅔.",
    example:
      "3 earned runs in 6 innings is an ERA of 4.50. The same 3 runs in 9 innings would be 3.00, and 3 runs in 6⅓ innings (6 innings plus 1 out) is 4.26.",
    howToUse: [
      "Enter the earned runs the pitcher allowed.",
      "Enter the complete innings pitched.",
      "Add the outs in the partial inning, if any — 1 out is a third of an inning.",
      "Read the ERA: earned runs per nine innings.",
    ],
    details: [
      {
        heading: "Earned runs vs all runs",
        body: "ERA only counts earned runs — runs that score without the help of an error or a passed ball. If a shortstop boots a grounder and the runner later scores, that run is unearned and does not touch the pitcher's ERA. The official scorer decides, which is why ERA can look unfair: a pitcher can allow no earned runs and still lose a game full of errors behind him.",
      },
      {
        heading: "What is a good ERA?",
        body: "In the modern game, an ERA under 3.00 is excellent, 3.00–4.00 is good, and the league average sits around 4.00–4.50 depending on the season. Before 1920, in the dead-ball era, ERAs under 2.00 were common; today, rule changes and better hitting have pushed the average up. Always compare a pitcher's ERA with the league average of the same season.",
      },
    ],
    tips: [
      "Count partial innings in thirds: 6.1 innings in a box score means 6⅓, not 6.1.",
      "ERA needs a decent sample — one bad outing can wreck a reliever's ERA for weeks.",
      "Compare ERAs within the same league and season: run environments change over time.",
    ],
    faqs: [
      {
        q: "How is ERA calculated?",
        a: "Earned runs × 9 ÷ innings pitched. 3 earned runs in 6 innings is 3 × 9 ÷ 6 = 4.50. It is the number of earned runs the pitcher would allow over a full nine-inning game at the same rate.",
      },
      {
        q: "What does 6.2 innings pitched mean?",
        a: "In baseball notation, 6.2 means 6 innings plus 2 outs — 6⅔ innings, not 6.2 decimal innings. The .1 is one third of an inning and .2 is two thirds.",
      },
      {
        q: "What is a good ERA in baseball?",
        a: "Under 3.00 is excellent, 3.00–4.00 is good, and around 4.00–4.50 is roughly league average in the modern game.",
      },
    ],
  },
  {
    slug: "ops-calculator",
    name: "OPS Calculator",
    category: "Sports",
    short: "Baseball on-base plus slugging — OBP + SLG from the batting line.",
    keywords:
      "ops calculator, baseball ops calculator, on base plus slugging calculator, obp slg calculator, calculate ops",
    inputs: [
      numberInput("ab", "At-bats", "100"),
      numberInput("h", "Hits", "30"),
      numberInput("b2", "Doubles", "6"),
      numberInput("b3", "Triples", "1"),
      numberInput("hr", "Home runs", "4"),
      numberInput("bb", "Walks", "10"),
      numberInput("hbp", "Hit by pitch", "1"),
      numberInput("sf", "Sacrifice flies", "2"),
    ],
    compute: (v) => {
      const ab = N(v.ab);
      const h = N(v.h);
      const doubles = N(v.b2);
      const triples = N(v.b3);
      const hr = N(v.hr);
      const bb = N(v.bb);
      const hbp = N(v.hbp);
      const sf = N(v.sf);
      const singles = h - doubles - triples - hr;
      const totalBases = singles + 2 * doubles + 3 * triples + 4 * hr;
      const obpDen = ab + bb + hbp + sf;
      const obp = obpDen > 0 ? (h + bb + hbp) / obpDen : NaN;
      const slg = ab > 0 ? totalBases / ab : NaN;
      const ops = obp + slg;
      return [
        { label: "On-base percentage (OBP)", value: Number.isFinite(obp) ? m(obp, 3) : "—" },
        { label: "Slugging percentage (SLG)", value: Number.isFinite(slg) ? m(slg, 3) : "—" },
        { label: "OPS (OBP + SLG)", value: Number.isFinite(ops) ? m(ops, 3) : "—" },
        { label: "Singles", value: fmt(singles, 0) },
        { label: "Total bases", value: fmt(totalBases, 0) },
      ];
    },
    about:
      "Work out a baseball hitter's OPS — on-base percentage plus slugging percentage, the single number most often used to sum up a hitter. OBP measures how often the batter reaches base (hits, walks and hit-by-pitches over at-bats plus walks, hit-by-pitches and sacrifice flies); SLG measures power (total bases per at-bat). Add them and a .300 hitter with power lands near .850, an average hitter near .720, and a great season above .900.",
    formula:
      "OBP = (hits + walks + hit by pitch) ÷ (at-bats + walks + hit by pitch + sacrifice flies). SLG = total bases ÷ at-bats, where total bases = singles + 2 × doubles + 3 × triples + 4 × home runs. OPS = OBP + SLG.",
    example:
      "100 at-bats, 30 hits (19 singles, 6 doubles, 1 triple, 4 home runs), 10 walks, 1 hit by pitch and 2 sacrifice flies: OBP is 41 ÷ 113 = .363, total bases are 50 so SLG is .500, and OPS is .863 — a very good hitter.",
    howToUse: [
      "Enter at-bats and the hit breakdown: doubles, triples and home runs.",
      "Enter walks, hit by pitch and sacrifice flies.",
      "Read the OBP, the SLG and the OPS — plus the singles and total bases worked out along the way.",
    ],
    details: [
      {
        heading: "What is a good OPS?",
        body: "In the modern game, an OPS around .720 is roughly league average, .800 is good, .900 is excellent, and 1.000 is an MVP-level season. The all-time single-season record is Barry Bonds' 1.422 in 2004; Babe Ruth's career OPS of 1.164 is the best ever. Because OPS adds two percentages, it slightly overvalues slugging relative to on-base percentage, but it remains the quickest useful summary of a hitter.",
      },
      {
        heading: "What counts in OBP — and what does not",
        body: "Walks and hit-by-pitches count toward reaching base, but sacrifice flies count as a plate appearance without an at-bat: they go in the OBP denominator but not in at-bats. Sacrifice bunts and catcher's interference do not count at all. Errors do not count as reaching base either — a batter who reaches on an error is 0-for-1 in the book, however unfair that feels.",
      },
    ],
    tips: [
      "OPS over .900 is excellent; .800 is good; .720 is about average.",
      "Singles are worked out for you: hits minus doubles, triples and home runs.",
      "A small sample — under 50 at-bats — makes OPS jump around wildly; wait for more data.",
    ],
    faqs: [
      {
        q: "How is OPS calculated?",
        a: "OPS = OBP + SLG. On-base percentage is (hits + walks + hit by pitch) ÷ (at-bats + walks + hit by pitch + sacrifice flies); slugging is total bases ÷ at-bats.",
      },
      {
        q: "What is a good OPS in baseball?",
        a: "Around .720 is league average, .800 is good, .900 is excellent and 1.000 is an MVP-level season.",
      },
      {
        q: "Do walks count in OPS?",
        a: "Yes — walks count in on-base percentage, which is half of OPS. They do not count as at-bats, so they raise OBP without touching slugging.",
      },
    ],
  },
];
