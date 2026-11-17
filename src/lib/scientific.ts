export type AngleMode = "deg" | "rad";

const FUNCS: Record<string, (x: number, m: AngleMode) => number> = {
  sin: (x, m) => Math.sin(toRad(x, m)),
  cos: (x, m) => Math.cos(toRad(x, m)),
  tan: (x, m) => {
    if (m === "deg" && Math.abs(((x % 180) + 180) % 180 - 90) < 1e-12) throw new Error("tan undefined");
    return Math.tan(toRad(x, m));
  },
  asin: (x, m) => fromRad(Math.asin(x), m),
  acos: (x, m) => fromRad(Math.acos(x), m),
  atan: (x, m) => fromRad(Math.atan(x), m),
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  ln: Math.log,
  log: Math.log10,
  log2: Math.log2,
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  exp: Math.exp,
};

function toRad(x: number, m: AngleMode) {
  return m === "deg" ? (x * Math.PI) / 180 : x;
}
function fromRad(x: number, m: AngleMode) {
  return m === "deg" ? (x * 180) / Math.PI : x;
}
function factorial(n: number) {
  if (n < 0 || !Number.isInteger(n) || n > 170) throw new Error("Factorial needs a whole number 0–170");
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

/** Safely evaluate a math expression (no eval). */
export function evaluate(expr: string, mode: AngleMode = "deg", ans = 0): number {
  const src = expr.replace(/×/g, "*").replace(/÷/g, "/").replace(/π/g, "pi").replace(/√/g, "sqrt").replace(/−/g, "-");
  const tokens = src.match(/\d*\.?\d+(?:e[+-]?\d+)?|[a-z]+\d?|[-+*/^()!%,]|\S/gi) ?? [];
  let i = 0;
  const peek = () => tokens[i];
  const next = () => tokens[i++];
  const isNum = (t?: string) => !!t && /^\d*\.?\d/.test(t);
  const startsPrimary = (t?: string) => !!t && (isNum(t) || /^[a-z(]/i.test(t));

  function expression(): number {
    let v = term();
    while (peek() === "+" || peek() === "-") v = next() === "+" ? v + term() : v - term();
    return v;
  }
  function term(): number {
    let v = unary();
    for (;;) {
      const t = peek();
      if (t === "*") { next(); v *= unary(); }
      else if (t === "/") { next(); const d = unary(); if (d === 0) throw new Error("Division by zero"); v /= d; }
      else if (startsPrimary(t)) v *= unary(); // implicit multiplication: 2pi, 3(4)
      else return v;
    }
  }
  function unary(): number {
    if (peek() === "-") { next(); return -unary(); }
    if (peek() === "+") { next(); return unary(); }
    return power();
  }
  function power(): number {
    const base = postfix();
    if (peek() === "^") { next(); return Math.pow(base, unary()); }
    return base;
  }
  function postfix(): number {
    let v = primary();
    for (;;) {
      if (peek() === "!") { next(); v = factorial(v); }
      else if (peek() === "%") { next(); v = v / 100; }
      else return v;
    }
  }
  function primary(): number {
    const t = next();
    if (t === undefined) throw new Error("Incomplete expression");
    if (isNum(t)) return parseFloat(t);
    if (t === "(") {
      const v = expression();
      if (next() !== ")") throw new Error("Missing )");
      return v;
    }
    const id = t.toLowerCase();
    if (id === "pi") return Math.PI;
    if (id === "e") return Math.E;
    if (id === "ans") return ans;
    if (FUNCS[id]) {
      const arg = peek() === "(" ? primary() : postfix();
      return FUNCS[id](arg, mode);
    }
    throw new Error(`Unknown symbol "${t}"`);
  }

  if (!tokens.length) throw new Error("Enter an expression");
  const v = expression();
  if (i < tokens.length) throw new Error(`Unexpected "${tokens[i]}"`);
  if (!Number.isFinite(v)) throw new Error("Result is undefined");
  return Math.abs(v) < 1e-12 ? 0 : v;
}

export function formatResult(v: number): string {
  if (Math.abs(v) >= 1e15 || (Math.abs(v) < 1e-9 && v !== 0)) return v.toExponential(10).replace(/\.?0+e/, "e");
  return String(parseFloat(v.toPrecision(14)));
}

// Unit conversions — factor to base unit (temperature handled separately)
export const unitGroups: Record<string, { label: string; units: Record<string, number> }> = {
  length: { label: "Length", units: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 } },
  mass: { label: "Mass", units: { mg: 1e-6, g: 0.001, kg: 1, t: 1000, oz: 0.028349523125, lb: 0.45359237 } },
  area: { label: "Area", units: { "cm²": 1e-4, "m²": 1, "km²": 1e6, "ft²": 0.09290304, acre: 4046.8564224, ha: 10000 } },
  volume: { label: "Volume", units: { mL: 0.001, L: 1, "m³": 1000, "US gal": 3.785411784, "US cup": 0.2365882365, "fl oz": 0.0295735295625 } },
  angle: { label: "Angle", units: { deg: 1, rad: 180 / Math.PI, grad: 0.9, arcmin: 1 / 60, arcsec: 1 / 3600 } },
  speed: { label: "Speed", units: { "m/s": 1, "km/h": 1 / 3.6, mph: 0.44704, knot: 0.514444444 } },
  energy: { label: "Energy", units: { J: 1, kJ: 1000, cal: 4.184, kcal: 4184, Wh: 3600, kWh: 3.6e6 } },
  pressure: { label: "Pressure", units: { Pa: 1, kPa: 1000, bar: 1e5, atm: 101325, psi: 6894.757293168 } },
  temperature: { label: "Temperature", units: { "°C": 1, "°F": 1, K: 1 } },
};

export function convertUnit(group: string, value: number, from: string, to: string): number {
  if (group === "temperature") {
    const c = from === "°C" ? value : from === "°F" ? ((value - 32) * 5) / 9 : value - 273.15;
    return to === "°C" ? c : to === "°F" ? (c * 9) / 5 + 32 : c + 273.15;
  }
  const u = unitGroups[group].units;
  return (value * u[from]) / u[to];
}
