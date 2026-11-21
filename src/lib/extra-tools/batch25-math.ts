// Batch 25 — math tools: modulo, sum, sort, log base 10, bitwise, octal,
// quotient and remainder.
import type { Calc } from "../tool-types";
import { fmt } from "../calculators";
import { N } from "./shared";

const m = (n: number, d = 4) => fmt(n, d);
const nums = (value: unknown) =>
  String(value ?? "")
    .split(/[\s,;]+/)
    .map(Number)
    .filter(Number.isFinite);

/** Floored modulo (always non-negative for a positive divisor), unlike
 *  JavaScript's % which is a remainder and keeps the dividend's sign. */
function mod(a: number, b: number): number {
  return ((a % b) + b) % b;
}

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : Math.abs(a);
}

export const batch25MathTools: Calc[] = [
  {
    slug: "modulo-calculator",
    name: "Modulo Calculator",
    category: "Math",
    short: "Remainder and modulo of any division — a mod b, with quotient.",
    keywords:
      "modulo calculator, mod calculator, remainder calculator, a mod b, modulo operation calculator, modulus calculator",
    inputs: [
      { key: "a", label: "Dividend (a)", def: "17" },
      { key: "b", label: "Divisor (b)", def: "5" },
    ],
    compute: (v) => {
      const a = N(v.a);
      const b = N(v.b);
      if (b === 0) return [{ label: "Result", value: "Cannot divide by zero" }];
      const q = Math.trunc(a / b);
      return [
        { label: "Remainder (a % b)", value: fmt(a % b, 4) },
        { label: "Modulo (floored)", value: fmt(mod(a, b), 4) },
        { label: "Quotient", value: fmt(q, 4) },
        { label: "Check", value: `${fmt(a, 4)} = ${fmt(q, 4)} × ${fmt(b, 4)} + ${fmt(a % b, 4)}` },
      ];
    },
    about:
      "The modulo operation finds the remainder left over after division. 17 mod 5 is 2, because 5 goes into 17 three times (15) with 2 left over. Modulo is everywhere in computing: it wraps values into a range (clocks use mod 12 and mod 60), tests whether a number is even or odd, cycles through array indexes, and powers hash functions and cryptography. This calculator shows both the remainder and the floored modulo, which differ for negative numbers.",
    formula:
      "a = q × b + r, where q is the truncated quotient and r the remainder (0 ≤ |r| < |b|). The floored modulo is ((a % b) + b) % b, which is always non-negative when b is positive.",
    example:
      "17 mod 5 = 2 (17 = 3 × 5 + 2). −17 mod 5 = 3 as a floored modulo, while the remainder is −2 — the two agree for positive numbers and differ for negative ones.",
    howToUse: [
      "Enter the dividend — the number being divided.",
      "Enter the divisor — the number you divide by.",
      "Read the remainder, the floored modulo and the quotient.",
    ],
    details: [
      {
        heading: "Remainder vs modulo",
        body: "Most programming languages use % for the remainder, which keeps the sign of the dividend: −17 % 5 is −2. The mathematical modulo (floored) is always non-negative for a positive divisor: −17 mod 5 is 3. For positive numbers the two are identical, so the difference only matters with negative dividends. If you are writing code that wraps an index or a clock, you almost always want the floored modulo.",
      },
      {
        heading: "Where modulo is used",
        body: "Clocks are modulo 12, minutes are modulo 60, and days of the week are modulo 7. In programming, x % 2 tests evenness, x % 10 gives the last digit, and hash tables use modulo to turn a hash into a bucket index. Cryptography leans on it heavily: RSA encryption is arithmetic modulo a large number.",
      },
    ],
    tips: [
      "a mod b is always between 0 and b − 1 (for positive b) — use it to wrap values into a range.",
      "To test if a divides b exactly, check whether b mod a is 0.",
      "For negative dividends, decide whether you need the remainder or the floored modulo before coding.",
    ],
    faqs: [
      {
        q: "What is modulo?",
        a: "The remainder after division. 17 mod 5 is 2 because 5 × 3 = 15 and 17 − 15 = 2. It answers 'what is left over?' rather than 'how many times does it go in?'",
      },
      {
        q: "What is the difference between remainder and modulo?",
        a: "For positive numbers they are the same. For negative dividends they differ: −17 % 5 is −2 as a remainder, but 3 as a floored modulo. This calculator shows both.",
      },
      {
        q: "Can you divide by zero?",
        a: "No — division by zero is undefined, so the calculator refuses it. The modulo of any number by zero has no meaningful value.",
      },
    ],
  },
  {
    slug: "sum-calculator",
    name: "Sum Calculator",
    category: "Math",
    short: "Add a list of numbers — with count, average, minimum and maximum.",
    keywords:
      "sum calculator, add numbers calculator, sum of numbers, total calculator, add up numbers online",
    inputs: [
      {
        key: "l",
        label: "Numbers (comma or space separated)",
        type: "text",
        def: "4, 8, 15, 16, 23, 42",
      },
    ],
    compute: (v) => {
      const a = nums(v.l);
      if (!a.length) return [{ label: "Sum", value: "—" }];
      const sum = a.reduce((s, x) => s + x, 0);
      return [
        { label: "Sum", value: m(sum) },
        { label: "Count", value: fmt(a.length, 0) },
        { label: "Average", value: m(sum / a.length) },
        { label: "Minimum", value: m(Math.min(...a)) },
        { label: "Maximum", value: m(Math.max(...a)) },
      ];
    },
    about:
      "Add up a list of numbers in one step — paste them separated by commas, spaces or line breaks and get the total, the count, the average and the smallest and largest values. It is the quick way to total a column of figures, check a receipt, or add up expenses without reaching for a spreadsheet.",
    formula: "Sum = x₁ + x₂ + … + xₙ. Average = sum ÷ count.",
    example:
      "4 + 8 + 15 + 16 + 23 + 42 = 108. There are 6 numbers, the average is 18, the smallest is 4 and the largest is 42.",
    howToUse: [
      "Type or paste your numbers, separated by commas, spaces or new lines.",
      "Check the sum — the headline figure.",
      "Use the count, average, minimum and maximum to sanity-check the list.",
    ],
    details: [
      {
        heading: "Checking a total",
        body: "Adding a column by hand is where most arithmetic slips happen — a missed number or a transposed digit. Pasting the whole list into a sum calculator removes the running-total step entirely, and the count tells you immediately whether a number is missing: if you expected 12 figures and the count says 11, one did not make it in.",
      },
      {
        heading: "When the average helps",
        body: "The average next to the sum shows whether the total is driven by one large value or spread evenly. If the average looks far from most of your numbers, an outlier or a typo (an extra zero, a misplaced decimal) is the usual cause — the minimum and maximum will point straight at it.",
      },
    ],
    tips: [
      "Paste straight from a spreadsheet column — new lines work as separators.",
      "Watch for numbers pasted with currency symbols or thousands separators; strip them first.",
      "Use the Average Calculator for a fuller breakdown (median, mode and range).",
    ],
    faqs: [
      {
        q: "How do I add numbers separated by commas?",
        a: "Paste or type them with commas, spaces or line breaks between them — for example 4, 8, 15, 16, 23, 42. The calculator adds them all and shows the total.",
      },
      {
        q: "Can I add negative numbers?",
        a: "Yes — negative numbers are subtracted from the total, which is useful for adding up credits and debits together.",
      },
      {
        q: "What is the largest list this can handle?",
        a: "Hundreds of numbers are fine. For thousands of rows, a spreadsheet is the better tool.",
      },
    ],
  },
  {
    slug: "sort-numbers",
    name: "Sort Numbers",
    category: "Math",
    short: "Sort a list of numbers into ascending or descending order.",
    keywords:
      "sort numbers, sort numbers online, number sorter, sort numbers ascending, sort numbers descending, sort list of numbers",
    inputs: [
      {
        key: "l",
        label: "Numbers (comma or space separated)",
        type: "text",
        def: "42, 7, 19, 3, 25",
      },
    ],
    compute: (v) => {
      const a = nums(v.l);
      if (!a.length) return [{ label: "Sorted (ascending)", value: "—" }];
      const asc = [...a].sort((x, y) => x - y);
      const desc = [...asc].reverse();
      return [
        { label: "Sorted (ascending)", value: asc.join(", ") },
        { label: "Sorted (descending)", value: desc.join(", ") },
        { label: "Count", value: fmt(a.length, 0) },
        { label: "Smallest → largest", value: `${fmt(asc[0]!, 4)} → ${fmt(asc.at(-1)!, 4)}` },
      ];
    },
    about:
      "Sort a list of numbers into ascending or descending order. Paste numbers separated by commas, spaces or line breaks and get both orders at once, with the count and the range. It is useful for ranking scores, ordering measurements, finding the smallest and largest values, and tidying data before pasting it somewhere else.",
    formula: "Numbers are ordered by numeric value — not alphabetically, so 100 comes after 42, not before it.",
    example: "42, 7, 19, 3, 25 sorted ascending is 3, 7, 19, 25, 42. Descending is 42, 25, 19, 7, 3.",
    howToUse: [
      "Type or paste your numbers, separated by commas, spaces or new lines.",
      "Read the ascending list — the headline result.",
      "Copy the descending list if you need the largest first.",
    ],
    details: [
      {
        heading: "Numeric order, not alphabetical order",
        body: "Sorting numbers as text gives the wrong answer: alphabetically, 100 comes before 42 because '1' comes before '4'. This tool compares numbers by value, so 3, 7, 19, 25, 42 is the true ascending order. That is the mistake to watch for when sorting in a spreadsheet too — make sure the column is formatted as numbers, not text.",
      },
      {
        heading: "Finding extremes",
        body: "A sorted list makes the smallest and largest values obvious, and it also shows gaps and clusters at a glance. If the largest value is far from the rest, it may be an outlier or a typo — worth checking before you use the data further.",
      },
    ],
    tips: [
      "Paste straight from a spreadsheet column — new lines work as separators.",
      "Decimals and negative numbers sort correctly too.",
      "For the full picture (mean, median, mode), use the Average Calculator.",
    ],
    faqs: [
      {
        q: "How do I sort numbers in ascending order?",
        a: "Paste them here separated by commas or spaces and read the ascending list. It orders by numeric value, so 100 correctly comes after 42.",
      },
      {
        q: "Can I sort decimals and negative numbers?",
        a: "Yes — decimals, negatives and large numbers all sort by value.",
      },
      {
        q: "What is the difference between sorting and ranking?",
        a: "Sorting orders the values themselves; ranking assigns each value a position (1st, 2nd, 3rd). A sorted list makes ranking easy to read off.",
      },
    ],
  },
  {
    slug: "log-base-10-calculator",
    name: "Log Base 10 Calculator",
    category: "Math",
    short: "Common logarithm (log₁₀) of any number, plus natural and binary logs.",
    keywords:
      "log base 10 calculator, log10 calculator, common logarithm calculator, log calculator, logarithm calculator",
    inputs: [{ key: "x", label: "Number", def: "1000" }],
    compute: (v) => {
      const x = N(v.x);
      if (x <= 0) return [{ label: "log₁₀(x)", value: "Undefined for x ≤ 0" }];
      return [
        { label: "log₁₀(x) — common log", value: fmt(Math.log10(x), 8) },
        { label: "ln(x) — natural log", value: fmt(Math.log(x), 8) },
        { label: "log₂(x) — binary log", value: fmt(Math.log2(x), 8) },
        { label: "10^log₁₀(x) (check)", value: fmt(Math.pow(10, Math.log10(x)), 8) },
      ];
    },
    about:
      "The base-10 logarithm answers the question '10 to what power gives this number?' — log₁₀(1000) is 3, because 10³ = 1,000. Common logarithms are the ones behind the pH scale, the Richter scale and decibels: each whole-number step on those scales means ten times as much. This calculator also shows the natural log (base e) and the binary log (base 2) for comparison.",
    formula:
      "log₁₀(x) = y means 10^y = x. log₁₀(10) = 1, log₁₀(100) = 2, log₁₀(1,000) = 3. Logs are only defined for positive numbers.",
    example:
      "log₁₀(1,000) = 3, because 10³ = 1,000. log₁₀(2) ≈ 0.30103, which is why 2¹⁰ ≈ 1,024 (10 × 0.30103 ≈ 3.01).",
    howToUse: [
      "Enter a positive number.",
      "Read log₁₀ — the headline result.",
      "Compare with the natural log and binary log if you need another base.",
    ],
    details: [
      {
        heading: "Where log base 10 shows up",
        body: "The pH scale is a base-10 log of hydrogen-ion concentration, so pH 3 is ten times as acidic as pH 4. The Richter scale is logarithmic too: a magnitude 6 earthquake releases about 32 times the energy of a magnitude 5. Decibels work the same way — every 10 dB is a tenfold increase in sound intensity. Logarithms turn multiplication into addition, which is why they are used wherever quantities span many orders of magnitude.",
      },
      {
        heading: "Changing bases",
        body: "Any logarithm can be converted to any other base: log_b(x) = log₁₀(x) ÷ log₁₀(b). To get log₅(25), divide log₁₀(25) by log₁₀(5): 1.39794 ÷ 0.69897 = 2. That change-of-base rule is how calculators that only know one log can compute them all.",
      },
    ],
    tips: [
      "log₁₀ of a number between 0 and 1 is negative — log₁₀(0.01) = −2.",
      "The number of digits in a positive integer is floor(log₁₀(x)) + 1.",
      "Logs are undefined for zero and negative numbers.",
    ],
    faqs: [
      {
        q: "What is log base 10?",
        a: "The power you raise 10 to in order to get the number. log₁₀(100) = 2 because 10² = 100, and log₁₀(1,000) = 3 because 10³ = 1,000.",
      },
      {
        q: "What is the difference between log and ln?",
        a: "log usually means base 10; ln means the natural logarithm, base e (≈ 2.71828). They differ by a constant factor: ln(x) = log₁₀(x) × 2.302585.",
      },
      {
        q: "Why is log of zero undefined?",
        a: "Because no power of 10 equals zero — 10^y is always positive. The log of a number approaching zero heads toward negative infinity.",
      },
    ],
  },
  {
    slug: "bitwise-calculator",
    name: "Bitwise Calculator",
    category: "Math",
    short: "AND, OR, XOR, NOT and shifts on integers — in decimal, binary and hex.",
    keywords:
      "bitwise calculator, bitwise and or xor calculator, bit calculator, binary operation calculator, bitwise shift calculator",
    inputs: [
      { key: "a", label: "First number (A)", def: "12" },
      { key: "b", label: "Second number (B)", def: "10" },
      {
        key: "op",
        label: "Operation",
        type: "select",
        def: "&",
        options: [
          { v: "&", l: "AND (A & B)" },
          { v: "|", l: "OR (A | B)" },
          { v: "^", l: "XOR (A ^ B)" },
          { v: "~", l: "NOT (~A)" },
          { v: "<<", l: "Left shift (A << B)" },
          { v: ">>", l: "Right shift (A >> B)" },
        ],
      },
    ],
    compute: (v) => {
      const a = Math.trunc(N(v.a));
      const b = Math.trunc(N(v.b));
      let r: number;
      let desc: string;
      switch (v.op) {
        case "|":
          r = a | b;
          desc = "OR";
          break;
        case "^":
          r = a ^ b;
          desc = "XOR";
          break;
        case "~":
          r = ~a;
          desc = "NOT";
          break;
        case "<<":
          r = a << b;
          desc = "Left shift";
          break;
        case ">>":
          r = a >> b;
          desc = "Right shift";
          break;
        default:
          r = a & b;
          desc = "AND";
      }
      const bin = (x: number) => (x >>> 0).toString(2);
      const hex = (x: number) => "0x" + (x >>> 0).toString(16).toUpperCase();
      return [
        { label: `Result (${desc})`, value: fmt(r, 0) },
        { label: "Binary", value: bin(r) },
        { label: "Hexadecimal", value: hex(r) },
        { label: "A in binary", value: bin(a) },
        { label: "B in binary", value: bin(b) },
      ];
    },
    about:
      "Bitwise operations work on the individual bits of integers — the ones and zeros a computer actually stores. AND keeps a bit only where both numbers have it, OR keeps it where either has it, XOR keeps it where exactly one has it, and NOT flips every bit. Shifts move bits left (multiplying by powers of two) or right (dividing). They are the building blocks of flags, permissions, compression, graphics and cryptography.",
    formula:
      "AND: 1 & 1 = 1, otherwise 0. OR: 0 | 0 = 0, otherwise 1. XOR: 1 ^ 0 = 1, 1 ^ 1 = 0. Left shift A << n = A × 2ⁿ. Right shift A >> n = floor(A ÷ 2ⁿ).",
    example:
      "12 is 1100 in binary and 10 is 1010. 12 AND 10 = 8 (1000), 12 OR 10 = 14 (1110), 12 XOR 10 = 6 (0110), and 12 << 1 = 24.",
    howToUse: [
      "Enter the first number (A) — whole numbers only.",
      "Enter the second number (B), unless you chose NOT, which uses A alone.",
      "Choose the operation and read the result in decimal, binary and hexadecimal.",
    ],
    details: [
      {
        heading: "What bitwise operations are for",
        body: "A single integer can hold many yes/no flags: each bit is one flag, so checking a permission is one AND operation instead of a whole list of booleans. Graphics code packs red, green, blue and alpha into one 32-bit number and pulls the channels out with shifts and masks. Compression, checksums and hash functions are all built from AND, OR, XOR and shifts — fast operations that map directly onto what the processor does.",
      },
      {
        heading: "Shifts are fast multiplication and division",
        body: "Shifting left by n multiplies by 2ⁿ, and shifting right divides by 2ⁿ (rounding down for positive numbers): 12 << 1 = 24, 12 >> 1 = 6. Compilers use this trick whenever they can, which is why powers of two appear so often in computing — buffer sizes, image dimensions and memory pages are usually powers of two.",
      },
    ],
    tips: [
      "XOR with the same value twice returns the original — the basis of simple encryption and swap tricks.",
      "Use AND with a mask (e.g. x & 1) to test a single bit, such as whether a number is odd.",
      "JavaScript bitwise operations work on 32-bit integers — numbers beyond that range wrap.",
    ],
    faqs: [
      {
        q: "What does bitwise AND do?",
        a: "It compares each bit of two numbers and keeps a 1 only where both numbers have a 1. 12 (1100) AND 10 (1010) = 8 (1000).",
      },
      {
        q: "What is XOR used for?",
        a: "XOR keeps a bit where the two inputs differ. It toggles flags, detects differences, and is the core of many checksums and simple ciphers — XORing twice with the same key returns the original value.",
      },
      {
        q: "Why do shifts multiply and divide by two?",
        a: "Moving all bits one place left doubles the value, just as adding a zero to a decimal number multiplies it by ten. Each place left is another factor of two.",
      },
    ],
  },
  {
    slug: "octal-calculator",
    name: "Octal Calculator",
    category: "Math",
    short: "Convert between decimal and octal, with binary and hex equivalents.",
    keywords:
      "octal calculator, decimal to octal, octal to decimal, octal converter, base 8 calculator",
    inputs: [
      {
        key: "mode",
        label: "Convert",
        type: "select",
        def: "d2o",
        options: [
          { v: "d2o", l: "Decimal → Octal" },
          { v: "o2d", l: "Octal → Decimal" },
        ],
      },
      { key: "x", label: "Number", def: "83" },
    ],
    compute: (v) => {
      const raw = String(v.x ?? "").trim();
      if (v.mode === "o2d") {
        if (!/^[0-7]+$/.test(raw)) return [{ label: "Decimal", value: "Invalid octal — digits 0–7 only" }];
        const dec = parseInt(raw, 8);
        return [
          { label: "Decimal", value: fmt(dec, 0) },
          { label: "Octal", value: raw },
          { label: "Hexadecimal", value: "0x" + dec.toString(16).toUpperCase() },
          { label: "Binary", value: dec.toString(2) },
        ];
      }
      const dec = Math.trunc(N(raw));
      if (!Number.isFinite(dec) || dec < 0) return [{ label: "Octal", value: "Enter a non-negative integer" }];
      return [
        { label: "Octal", value: dec.toString(8) },
        { label: "Decimal", value: fmt(dec, 0) },
        { label: "Hexadecimal", value: "0x" + dec.toString(16).toUpperCase() },
        { label: "Binary", value: dec.toString(2) },
      ];
    },
    about:
      "Octal is base 8: it uses the digits 0–7, and each octal digit stands for exactly three binary bits. It was the standard way to write machine values on early computers (a 12-bit word is four octal digits), and it still appears in Unix file permissions — 755 means read-write-execute for the owner and read-execute for everyone else. This calculator converts both ways between decimal and octal, and shows the binary and hexadecimal equivalents too.",
    formula:
      "Decimal to octal: repeatedly divide by 8 and read the remainders bottom-up. Octal to decimal: multiply each digit by 8 raised to its position from the right, starting at 0.",
    example:
      "83 in decimal is 123 in octal (83 ÷ 8 = 10 remainder 3; 10 ÷ 8 = 1 remainder 2; 1 ÷ 8 = 0 remainder 1; read the remainders upwards: 123). The other way, 123 octal = 1×64 + 2×8 + 3 = 83.",
    howToUse: [
      "Choose the direction: decimal to octal, or octal to decimal.",
      "Enter the number — octal input may only contain the digits 0–7.",
      "Read the result in octal, decimal, hexadecimal and binary.",
    ],
    details: [
      {
        heading: "Octal and Unix permissions",
        body: "Unix file permissions are three octal digits: owner, group and others. Each digit is the sum of read (4), write (2) and execute (1), so 7 means read-write-execute, 5 means read-execute and 6 means read-write. That is why you see chmod 755 and chmod 644 so often: 755 is full access for the owner and read-execute for everyone else, and 644 is read-write for the owner and read-only for everyone else.",
      },
      {
        heading: "Why octal groups three bits",
        body: "Because 8 is 2³, each octal digit maps to exactly three binary digits: 0 = 000, 7 = 111. That made octal a compact way to write binary on machines with 12-, 24- or 36-bit words. Hexadecimal (base 16) does the same with four bits per digit and has mostly replaced octal today — except in permissions, where the three-bit grouping matches the read-write-execute pattern exactly.",
      },
    ],
    tips: [
      "Octal digits are only 0–7: 8 and 9 never appear in a valid octal number.",
      "To read a Unix permission, split it into three digits and add 4 + 2 + 1 for each.",
      "For base conversions in general, use the binary or hexadecimal converters too.",
    ],
    faqs: [
      {
        q: "What is octal?",
        a: "A base-8 number system using the digits 0–7. Each octal digit represents three binary bits, which made it popular on early computers and keeps it alive in Unix file permissions.",
      },
      {
        q: "How do I convert decimal to octal?",
        a: "Divide by 8 repeatedly and read the remainders from bottom to top. 83 ÷ 8 leaves 3, 10 ÷ 8 leaves 2, 1 ÷ 8 leaves 1 — so 83 decimal is 123 octal.",
      },
      {
        q: "What does chmod 755 mean?",
        a: "Owner: 7 (read + write + execute), group: 5 (read + execute), others: 5 (read + execute). It is the standard permission for executable files and scripts.",
      },
    ],
  },
  {
    slug: "quotient-and-remainder-calculator",
    name: "Quotient and Remainder Calculator",
    category: "Math",
    short: "Divide two numbers and see the quotient, remainder and full equation.",
    keywords:
      "quotient and remainder calculator, quotient calculator, remainder calculator, division with remainder, long division calculator",
    inputs: [
      { key: "a", label: "Dividend", def: "100" },
      { key: "b", label: "Divisor", def: "7" },
    ],
    compute: (v) => {
      const a = N(v.a);
      const b = N(v.b);
      if (b === 0) return [{ label: "Result", value: "Cannot divide by zero" }];
      const q = Math.trunc(a / b);
      const r = a - q * b;
      return [
        { label: "Quotient", value: fmt(q, 4) },
        { label: "Remainder", value: fmt(r, 4) },
        { label: "Equation", value: `${fmt(a, 4)} = ${fmt(q, 4)} × ${fmt(b, 4)} + ${fmt(r, 4)}` },
        { label: "Decimal result", value: fmt(a / b, 6) },
      ];
    },
    about:
      "Divide two numbers and see the whole story: the quotient (how many times the divisor fits), the remainder (what is left over), and the equation that ties them together. It is long division done for you — the same result you would get working it out by hand, without the slips. Useful for splitting quantities evenly, checking divisibility, and school arithmetic.",
    formula:
      "Dividend = quotient × divisor + remainder, with 0 ≤ remainder < |divisor|. Quotient = floor(dividend ÷ divisor) for positive numbers.",
    example:
      "100 ÷ 7 = 14 remainder 2, because 14 × 7 = 98 and 100 − 98 = 2. Written as an equation: 100 = 14 × 7 + 2. The decimal result is 14.285714.",
    howToUse: [
      "Enter the dividend — the number being divided.",
      "Enter the divisor — the number you divide by.",
      "Read the quotient and remainder, and check the equation.",
    ],
    details: [
      {
        heading: "What the remainder tells you",
        body: "The remainder is what is left when the divisor no longer fits. If it is zero, the division is exact and the divisor is a factor of the dividend. Remainders are how you split things fairly — 100 items shared between 7 people gives 14 each with 2 left over — and how you test divisibility: a number is divisible by 3 when its remainder on division by 3 is zero.",
      },
      {
        heading: "Quotient, remainder and fractions",
        body: "A quotient and remainder can be written as a mixed number: 100 ÷ 7 is 14 remainder 2, or 14 2/7. That is the same value as the decimal 14.285714… — the fraction form is exact, while the decimal goes on forever. For money or measurements, the decimal is usually more useful; for sharing and grouping, the remainder is.",
      },
    ],
    tips: [
      "If the remainder is 0, the divisor divides the dividend exactly.",
      "For the remainder alone (and for negative numbers), use the Modulo Calculator.",
      "Multiply the quotient by the divisor and add the remainder to check your answer.",
    ],
    faqs: [
      {
        q: "What is a quotient?",
        a: "The result of a division — how many times the divisor fits into the dividend. In 100 ÷ 7, the quotient is 14.",
      },
      {
        q: "What is a remainder?",
        a: "What is left over after division. 100 ÷ 7 is 14 remainder 2, because 14 × 7 = 98 and 100 − 98 = 2.",
      },
      {
        q: "How do I write a quotient and remainder as a fraction?",
        a: "Put the remainder over the divisor after the whole part: 100 ÷ 7 = 14 2/7, which equals 14.285714… as a decimal.",
      },
    ],
  },
];
