import { useMemo, useState } from "react";
import { ArrowLeftRight, Delete } from "lucide-react";
import { type AngleMode, convertUnit, evaluate, formatResult, unitGroups } from "@/lib/scientific";

const KEYS: { l: string; ins?: string; kind?: "fn" | "op" | "eq" | "ctl" }[] = [
  { l: "sin", ins: "sin(", kind: "fn" }, { l: "cos", ins: "cos(", kind: "fn" }, { l: "tan", ins: "tan(", kind: "fn" }, { l: "(", kind: "op" }, { l: ")", kind: "op" },
  { l: "sin⁻¹", ins: "asin(", kind: "fn" }, { l: "cos⁻¹", ins: "acos(", kind: "fn" }, { l: "tan⁻¹", ins: "atan(", kind: "fn" }, { l: "AC", kind: "ctl" }, { l: "⌫", kind: "ctl" },
  { l: "ln", ins: "ln(", kind: "fn" }, { l: "log", ins: "log(", kind: "fn" }, { l: "x²", ins: "^2", kind: "fn" }, { l: "xʸ", ins: "^", kind: "fn" }, { l: "√", ins: "sqrt(", kind: "fn" },
  { l: "7" }, { l: "8" }, { l: "9" }, { l: "÷", ins: "/", kind: "op" }, { l: "n!", ins: "!", kind: "fn" },
  { l: "4" }, { l: "5" }, { l: "6" }, { l: "×", ins: "*", kind: "op" }, { l: "π", ins: "pi", kind: "fn" },
  { l: "1" }, { l: "2" }, { l: "3" }, { l: "−", ins: "-", kind: "op" }, { l: "e", kind: "fn" },
  { l: "0" }, { l: "." }, { l: "Ans", ins: "ans", kind: "fn" }, { l: "+", kind: "op" }, { l: "=", kind: "eq" },
];

export function ScientificCalculator() {
  const [expr, setExpr] = useState("");
  const [mode, setMode] = useState<AngleMode>("deg");
  const [ans, setAns] = useState(0);
  const [history, setHistory] = useState<{ e: string; r: string }[]>([]);
  const [error, setError] = useState("");

  const preview = useMemo(() => {
    try { return expr ? formatResult(evaluate(expr, mode, ans)) : ""; } catch { return ""; }
  }, [expr, mode, ans]);

  function press(k: (typeof KEYS)[number]) {
    setError("");
    if (k.l === "AC") return setExpr("");
    if (k.l === "⌫") return setExpr((s) => s.slice(0, -1));
    if (k.kind === "eq") return calc();
    setExpr((s) => s + (k.ins ?? k.l));
  }
  function calc() {
    try {
      const r = evaluate(expr, mode, ans);
      const f = formatResult(r);
      setAns(r);
      setHistory((h) => [{ e: expr, r: f }, ...h].slice(0, 8));
      setExpr(f);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid expression");
    }
  }

  const keyStyle = (kind?: string) =>
    kind === "eq" ? "bg-primary text-primary-foreground hover:opacity-90"
      : kind === "ctl" ? "bg-accent text-accent-foreground hover:opacity-90"
      : kind === "fn" ? "bg-secondary text-primary hover:bg-secondary/70"
      : kind === "op" ? "bg-muted text-foreground hover:bg-muted/70 font-bold"
      : "bg-card border border-border text-foreground hover:bg-muted";

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
        <div>
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="inline-flex rounded-lg border border-border bg-card p-0.5 text-xs font-bold" role="group" aria-label="Angle mode">
                {(["deg", "rad"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => setMode(m)} aria-pressed={mode === m}
                    className={`rounded-md px-3 py-1 uppercase ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{m}</button>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">Ans = {formatResult(ans)}</span>
            </div>
            <input aria-label="Expression" value={expr} onChange={(e) => { setExpr(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && calc()} placeholder="e.g. sin(30) + log(100)"
              className="w-full bg-transparent text-right font-mono text-2xl outline-none" />
            <p className="mt-1 min-h-5 text-right font-mono text-sm text-muted-foreground" aria-live="polite">
              {error ? <span className="text-destructive">{error}</span> : preview && preview !== expr ? `= ${preview}` : ""}
            </p>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {KEYS.map((k) => (
              <button key={k.l} type="button" onClick={() => press(k)} aria-label={k.l === "⌫" ? "Backspace" : k.l}
                className={`h-12 rounded-lg text-sm font-semibold transition ${keyStyle(k.kind)}`}>
                {k.l === "⌫" ? <Delete className="mx-auto size-4" /> : k.l}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border p-4">
          <h3 className="text-sm font-bold">History</h3>
          {history.length === 0 ? <p className="mt-2 text-xs text-muted-foreground">Your calculations appear here.</p> : (
            <ul className="mt-2 space-y-2">
              {history.map((h, i) => (
                <li key={i}>
                  <button type="button" onClick={() => setExpr(h.e)} className="w-full text-right font-mono text-xs hover:text-primary">
                    <span className="block truncate text-muted-foreground">{h.e}</span>
                    <span className="font-bold">= {h.r}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <UnitConverter />
    </div>
  );
}

function UnitConverter() {
  const [group, setGroup] = useState("length");
  const units = Object.keys(unitGroups[group].units);
  const [from, setFrom] = useState("m");
  const [to, setTo] = useState("ft");
  const [value, setValue] = useState("1");
  const f = units.includes(from) ? from : units[0];
  const t = units.includes(to) ? to : units[1];
  const n = parseFloat(value);
  const result = Number.isFinite(n) ? formatResult(convertUnit(group, n, f, t)) : "—";
  const sel = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm";

  return (
    <div className="rounded-xl border border-border p-5">
      <h3 className="font-display text-base font-bold">Unit conversions</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto_1fr]">
        <label className="text-xs font-semibold">Quantity
          <select aria-label="Quantity" className={sel} value={group} onChange={(e) => { const g = e.target.value; const u = Object.keys(unitGroups[g].units); setGroup(g); setFrom(u[0]); setTo(u[1]); }}>
            {Object.entries(unitGroups).map(([k, g]) => <option key={k} value={k}>{g.label}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold">From
          <div className="flex gap-2">
            <input aria-label="Value" inputMode="decimal" className={sel} value={value} onChange={(e) => setValue(e.target.value)} />
            <select aria-label="From unit" className={sel} value={f} onChange={(e) => setFrom(e.target.value)}>{units.map((u) => <option key={u}>{u}</option>)}</select>
          </div>
        </label>
        <button type="button" aria-label="Swap units" onClick={() => { setFrom(t); setTo(f); }} className="self-end rounded-lg border border-border p-2.5 hover:bg-muted">
          <ArrowLeftRight className="size-4" />
        </button>
        <label className="text-xs font-semibold">To
          <select aria-label="To unit" className={sel} value={t} onChange={(e) => setTo(e.target.value)}>{units.map((u) => <option key={u}>{u}</option>)}</select>
        </label>
      </div>
      <p className="mt-4 rounded-lg bg-secondary px-4 py-3 font-mono text-lg font-bold text-primary" aria-live="polite">
        {value || 0} {f} = {result} {t}
      </p>
    </div>
  );
}
