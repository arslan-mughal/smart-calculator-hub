import type { Calc } from "../tool-types";

export const scientificTools: Calc[] = [
  {
    slug: "scientific-calculator",
    name: "Scientific Calculator",
    category: "Math",
    short: "Free online scientific calculator with trigonometry, logarithms, powers, factorials and unit conversions.",
    keywords: "scientific calculator, online scientific calculator, trig calculator, sin cos tan calculator, log calculator, ln calculator, calculator with exponents, unit converter",
    popular: true,
    custom: "scientific",
    inputs: [],
    compute: () => [],
    about:
      "This free online scientific calculator handles everything a classroom or engineering calculator does: sine, cosine and tangent with their inverses, hyperbolic functions, natural and common logarithms, powers and roots, factorials, π and e, plus a built-in unit converter for length, mass, area, volume, angle, speed, energy, pressure and temperature. Type an expression with your keyboard or tap the keys — the result previews live as you type, and the last eight answers stay in your history. Everything runs in your browser, so nothing you enter leaves your device.",
    formula:
      "Expressions follow standard order of operations (PEMDAS/BODMAS): parentheses, then functions and factorials, then exponents (right to left, so 2^3^2 = 2^9), then multiplication and division, then addition and subtraction. Trigonometric functions use the selected angle mode: in DEG mode sin(x) = sin(x × π/180). log is base 10, ln is base e (≈ 2.71828).",
    example:
      "In DEG mode, sin(30) + log(1000) = 0.5 + 3 = 3.5. In RAD mode, cos(pi) = −1. 5! = 120, sqrt(144) = 12 and 2^10 = 1024. In the converter, 1 mile = 1.609344 km and 100 °C = 212 °F.",
    howToUse: [
      "Choose DEG or RAD to set how angles are interpreted for sin, cos and tan.",
      "Type an expression such as 3*sin(45)^2 or tap the on-screen keys. A live preview shows the answer as you go.",
      "Press = or Enter to calculate. The result is stored as Ans for your next calculation.",
      "Click any line in History to reload that expression and edit it.",
      "Scroll to Unit conversions, pick a quantity, enter a value and choose the from/to units. Use the swap button to reverse the conversion.",
    ],
    details: [
      {
        heading: "Trigonometric functions",
        body: "sin, cos and tan take an angle and return a ratio; sin⁻¹ (asin), cos⁻¹ (acos) and tan⁻¹ (atan) do the reverse and return an angle in the current mode. Common values: sin(30°) = 0.5, cos(60°) = 0.5, tan(45°) = 1. tan(90°) is undefined and returns an error. Hyperbolic functions sinh, cosh and tanh can be typed directly.",
      },
      {
        heading: "Degrees vs radians",
        body: "A full circle is 360 degrees or 2π radians, so 1 rad ≈ 57.2958°. School geometry usually uses degrees; calculus, physics and programming usually use radians. If an answer looks wrong — for example sin(90) giving 0.894 — you are probably in RAD mode.",
      },
      {
        heading: "Logarithms and exponents",
        body: "log(x) is the common logarithm (base 10), so log(1000) = 3. ln(x) is the natural logarithm (base e), so ln(e) = 1. log2(x) gives base-2 logs. To use any other base b, apply the change-of-base rule: log_b(x) = ln(x) / ln(b). exp(x) equals e^x, and x^y raises any number to a power, including fractions such as 27^(1/3) = 3.",
      },
      {
        heading: "Roots, factorials and percentages",
        body: "sqrt(x) returns the square root and cbrt(x) the cube root. n! multiplies every whole number from 1 to n (valid for 0 to 170). The % sign divides by 100, so 200*15% = 30. abs(x) returns the absolute value.",
      },
      {
        heading: "Implicit multiplication and constants",
        body: "You can write 2pi, 3(4+1) or 2sin(30) without a × sign. π ≈ 3.14159265 and e ≈ 2.71828183 are built in, and Ans recalls your previous result. Very large or very small results are shown in scientific notation, e.g. 6.02e23.",
      },
      {
        heading: "Supported unit conversions",
        body: "Length (mm, cm, m, km, in, ft, yd, mi), mass (mg, g, kg, t, oz, lb), area (cm², m², km², ft², acre, ha), volume (mL, L, m³, US gallon, US cup, fl oz), angle (deg, rad, grad, arcmin, arcsec), speed (m/s, km/h, mph, knot), energy (J, kJ, cal, kcal, Wh, kWh), pressure (Pa, kPa, bar, atm, psi) and temperature (°C, °F, K). All factors use exact international definitions where they exist.",
      },
    ],
    tips: [
      "Use parentheses generously: -3^2 = −9, but (-3)^2 = 9.",
      "Check the DEG/RAD toggle before any trigonometry question.",
      "Press Enter on your keyboard instead of clicking =.",
      "Use Ans to chain multi-step calculations without retyping.",
    ],
    faqs: [
      { q: "Is this scientific calculator free?", a: "Yes. It is completely free, needs no sign-up and works on phones, tablets and computers." },
      { q: "How do I switch between degrees and radians?", a: "Use the DEG / RAD toggle above the display. It affects sin, cos, tan and their inverses." },
      { q: "What is the difference between log and ln?", a: "log is the base-10 logarithm and ln is the natural logarithm with base e ≈ 2.71828. For example log(100) = 2 and ln(e²) = 2." },
      { q: "How do I calculate a log with a different base?", a: "Use the change-of-base formula: log_b(x) = ln(x) / ln(b). For log base 3 of 81, enter ln(81)/ln(3) = 4." },
      { q: "Why does tan(90) show an error?", a: "Tangent of 90° is undefined because cos(90°) = 0, so the calculator reports it instead of returning a misleading huge number." },
      { q: "How accurate are the results?", a: "Calculations use double-precision floating point and are displayed to 14 significant digits, which is more precise than most handheld calculators." },
      { q: "Is my data sent anywhere?", a: "No. Every calculation and conversion runs locally in your browser." },
    ],
  },
];
