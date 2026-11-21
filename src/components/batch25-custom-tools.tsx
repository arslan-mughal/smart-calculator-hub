// Custom (non-form) tools for batch 25: Invoice Generator, Currency
// Converter and SHA-256 Hash Generator. Each manages its own state — the
// generic form renderer in $slug.tsx cannot express dynamic line items,
// live exchange rates or async hashing.
import { useEffect, useMemo, useState } from "react";
import { Check, Clipboard, Download, Plus, Printer, RefreshCw, Trash2 } from "lucide-react";
import { getExchangeRates } from "@/lib/rates.functions";
import { sha256Base64, sha256Hex } from "@/lib/sha256";
import { CURRENCIES } from "@/lib/extra-tools/batch25-conversion";

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";
const btnPrimary =
  "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90";
const btnOutline =
  "inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ------------------------------------------------------------------ */
/* Invoice Generator                                                   */
/* ------------------------------------------------------------------ */

type LineItem = { id: number; desc: string; qty: string; rate: string };

let lineId = 0;
const newLine = (): LineItem => ({ id: ++lineId, desc: "", qty: "1", rate: "" });

export function InvoiceGenerator() {
  const [business, setBusiness] = useState({ name: "Your Business", email: "", address: "" });
  const [client, setClient] = useState({ name: "", email: "", address: "" });
  const [invoiceNo, setInvoiceNo] = useState("INV-001");
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [items, setItems] = useState<LineItem[]>([
    { id: ++lineId, desc: "Design work", qty: "12", rate: "75" },
    { id: ++lineId, desc: "Stock photo licence", qty: "1", rate: "120" },
  ]);
  const [taxRate, setTaxRate] = useState("8");
  const [notes, setNotes] = useState("Payment due within 14 days. Thank you for your business!");
  const [downloaded, setDownloaded] = useState(false);

  const subtotal = items.reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0), 0);
  const tax = subtotal * ((parseFloat(taxRate) || 0) / 100);
  const total = subtotal + tax;
  const money = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  function updateItem(id: number, patch: Partial<LineItem>) {
    setItems((cur) => cur.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function downloadHtml() {
    const rows = items
      .map((i) => {
        const qty = parseFloat(i.qty) || 0;
        const rate = parseFloat(i.rate) || 0;
        return `<tr><td>${esc(i.desc)}</td><td style="text-align:right">${qty}</td><td style="text-align:right">${money(rate)}</td><td style="text-align:right">${money(qty * rate)}</td></tr>`;
      })
      .join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${esc(invoiceNo)}</title><style>body{font-family:Arial,sans-serif;max-width:720px;margin:40px auto;padding:0 20px;color:#111}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}.totals{text-align:right}.muted{color:#666}</style></head><body><h1>Invoice ${esc(invoiceNo)}</h1><p class="muted">Issued ${esc(issueDate)} · Due ${esc(dueDate)}</p><p><strong>From:</strong> ${esc(business.name)}${business.email ? ` · ${esc(business.email)}` : ""}${business.address ? `<br>${esc(business.address)}` : ""}</p><p><strong>Bill to:</strong> ${esc(client.name)}${client.email ? ` · ${esc(client.email)}` : ""}${client.address ? `<br>${esc(client.address)}` : ""}</p><table><tr><th>Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr>${rows}</table><p class="totals">Subtotal: ${money(subtotal)}<br>Tax (${esc(taxRate)}%): ${money(tax)}<br><strong>Total due: ${money(total)}</strong></p>${notes ? `<p class="muted">${esc(notes)}</p>` : ""}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoiceNo || "invoice"}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-bold">Your business</h3>
          <input
            aria-label="Business name"
            className={inputCls}
            value={business.name}
            onChange={(e) => setBusiness({ ...business, name: e.target.value })}
            placeholder="Business name"
          />
          <input
            aria-label="Business email"
            className={inputCls}
            value={business.email}
            onChange={(e) => setBusiness({ ...business, email: e.target.value })}
            placeholder="Email"
          />
          <textarea
            aria-label="Business address"
            className={inputCls}
            rows={2}
            value={business.address}
            onChange={(e) => setBusiness({ ...business, address: e.target.value })}
            placeholder="Address"
          />
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-bold">Bill to (client)</h3>
          <input
            aria-label="Client name"
            className={inputCls}
            value={client.name}
            onChange={(e) => setClient({ ...client, name: e.target.value })}
            placeholder="Client name"
          />
          <input
            aria-label="Client email"
            className={inputCls}
            value={client.email}
            onChange={(e) => setClient({ ...client, email: e.target.value })}
            placeholder="Email"
          />
          <textarea
            aria-label="Client address"
            className={inputCls}
            rows={2}
            value={client.address}
            onChange={(e) => setClient({ ...client, address: e.target.value })}
            placeholder="Address"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="text-sm font-semibold">Invoice number</span>
          <input className={inputCls} value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Issue date</span>
          <input type="date" className={inputCls} value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Due date</span>
          <input type="date" className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </label>
      </div>

      <div>
        <h3 className="text-sm font-bold">Line items</h3>
        <div className="mt-2 space-y-2">
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_64px_96px_32px] items-center gap-2">
              <input
                aria-label="Item description"
                className={inputCls}
                value={item.desc}
                onChange={(e) => updateItem(item.id, { desc: e.target.value })}
                placeholder="Description"
              />
              <input
                aria-label="Quantity"
                type="number"
                min="0"
                className={inputCls}
                value={item.qty}
                onChange={(e) => updateItem(item.id, { qty: e.target.value })}
              />
              <input
                aria-label="Rate"
                type="number"
                min="0"
                className={inputCls}
                value={item.rate}
                onChange={(e) => updateItem(item.id, { rate: e.target.value })}
                placeholder="Rate"
              />
              <button
                type="button"
                aria-label="Remove line item"
                onClick={() => setItems((cur) => cur.filter((i) => i.id !== item.id))}
                className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setItems((cur) => [...cur, newLine()])} className={`${btnOutline} mt-3`}>
          <Plus className="size-4" /> Add line
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold">Tax rate (%)</span>
          <input
            type="number"
            min="0"
            className={inputCls}
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Notes / payment details</span>
          <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </div>

      <div className="rounded-xl border border-border bg-muted/40 p-5" aria-live="polite">
        <h3 className="font-display text-lg font-bold">Invoice preview</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {business.name} → {client.name || "Client"} · {invoiceNo} · Due {dueDate}
        </p>
        <div className="mt-4 space-y-1 text-sm">
          {items.map((i) => (
            <div key={i.id} className="flex justify-between gap-2">
              <span className="min-w-0 truncate">
                {i.desc || "—"} × {i.qty || 0}
              </span>
              <span className="shrink-0 font-semibold">
                {money((parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0))}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{money(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax ({taxRate || 0}%)</span>
            <span>{money(tax)}</span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>Total due</span>
            <span>{money(total)}</span>
          </div>
        </div>
        {notes && <p className="mt-3 text-xs text-muted-foreground">{notes}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => window.print()} className={btnPrimary}>
          <Printer className="size-4" /> Print invoice
        </button>
        <button type="button" onClick={downloadHtml} className={btnOutline}>
          {downloaded ? <Check className="size-4" /> : <Download className="size-4" />}
          {downloaded ? "Downloaded" : "Download (.html)"}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Print prints this page; for a clean copy, download the invoice file and print that. Nothing you
        type is uploaded or saved — download the invoice before leaving the page.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Currency Converter                                                  */
/* ------------------------------------------------------------------ */

type RatesState =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ready"; rates: Record<string, number>; date: string; stale: boolean };

export function CurrencyConverter() {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [rates, setRates] = useState<RatesState>({ status: "loading" });
  const [copied, setCopied] = useState(false);

  async function load() {
    setRates({ status: "loading" });
    try {
      const res = await getExchangeRates({ data: undefined });
      if (res.ok) {
        setRates({ status: "ready", rates: res.rates, date: res.date, stale: res.stale ?? false });
      } else {
        setRates({ status: "error", error: res.error });
      }
    } catch {
      setRates({
        status: "error",
        error: "Live exchange rates are unavailable right now. Check your connection and try again.",
      });
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const converted = useMemo(() => {
    if (rates.status !== "ready") return null;
    const fromRate = rates.rates[from] ?? NaN;
    const toRate = rates.rates[to] ?? NaN;
    const value = parseFloat(amount);
    if (!Number.isFinite(value) || !Number.isFinite(fromRate) || !Number.isFinite(toRate) || fromRate === 0) {
      return null;
    }
    return { value: (value * toRate) / fromRate, rate: toRate / fromRate };
  }, [rates, amount, from, to]);

  async function copyResult() {
    if (converted === null) return;
    await navigator.clipboard.writeText(
      `${converted.value.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${to}`,
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px_180px]">
        <label className="block">
          <span className="text-sm font-semibold">Amount</span>
          <input
            type="number"
            min="0"
            className={inputCls}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">From</span>
          <select className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)}>
            {CURRENCIES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold">To</span>
          <select className={inputCls} value={to} onChange={(e) => setTo(e.target.value)}>
            {CURRENCIES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-xl bg-primary p-5 text-primary-foreground" aria-live="polite">
        {rates.status === "loading" && <p className="text-sm">Loading live exchange rates…</p>}
        {rates.status === "error" && (
          <div>
            <p className="font-display text-lg font-bold">Rates unavailable</p>
            <p className="mt-1 text-sm text-primary-foreground/80">{rates.error}</p>
            <button
              type="button"
              onClick={load}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary-foreground/15 px-4 py-2 text-sm font-bold hover:bg-primary-foreground/25"
            >
              <RefreshCw className="size-4" /> Try again
            </button>
          </div>
        )}
        {rates.status === "ready" && (
          <div>
            <p className="text-xs font-medium text-primary-foreground/70">Converted amount</p>
            <p className="mt-1 font-display text-2xl font-extrabold leading-snug">
              {converted === null
                ? "—"
                : `${converted.value.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${to}`}
            </p>
            {converted !== null && (
              <p className="mt-1 text-sm text-primary-foreground/80">
                1 {from} = {converted.rate.toLocaleString("en-US", { maximumFractionDigits: 6 })} {to}
                {" · "}1 {to} = {(1 / converted.rate).toLocaleString("en-US", { maximumFractionDigits: 6 })} {from}
              </p>
            )}
            <p className="mt-2 text-xs text-primary-foreground/60">
              Mid-market rates, published {rates.date}
              {rates.stale ? " (cached — the live service could not be reached)" : ""}
            </p>
            <button
              type="button"
              onClick={copyResult}
              disabled={converted === null}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary-foreground/15 px-4 py-2 text-sm font-bold hover:bg-primary-foreground/25 disabled:opacity-50"
            >
              {copied ? <Check className="size-4" /> : <Clipboard className="size-4" />}
              {copied ? "Copied" : "Copy result"}
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Rates are mid-market reference rates. Banks and card providers add their own margin, so the
        amount you actually receive may be slightly less.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SHA-256 Hash Generator                                              */
/* ------------------------------------------------------------------ */

export function Sha256Generator() {
  const [text, setText] = useState("Hello, world!");
  const [hex, setHex] = useState("");
  const [b64, setB64] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [h, b] = await Promise.all([sha256Hex(text), sha256Base64(text)]);
        if (!cancelled) {
          setHex(h);
          setB64(b);
          setError("");
        }
      } catch {
        if (!cancelled) {
          setHex("");
          setB64("");
          setError("Web Crypto is not available in this browser — SHA-256 needs a secure (https) page.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [text]);

  async function copy(value: string, which: string) {
    await navigator.clipboard.writeText(value);
    setCopied(which);
    window.setTimeout(() => setCopied(""), 1600);
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-semibold">Text to hash</span>
        <textarea
          className={`${inputCls} mt-1.5 font-mono leading-6`}
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste text…"
        />
      </label>
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : (
        <div className="space-y-3" aria-live="polite">
          <div className="rounded-xl bg-primary p-5 text-primary-foreground">
            <p className="text-xs font-medium text-primary-foreground/70">SHA-256 (hexadecimal)</p>
            <p className="mt-1 break-all font-mono text-sm font-bold leading-6">{hex}</p>
            <button
              type="button"
              onClick={() => copy(hex, "hex")}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary-foreground/15 px-3 py-1.5 text-xs font-bold hover:bg-primary-foreground/25"
            >
              {copied === "hex" ? <Check className="size-3.5" /> : <Clipboard className="size-3.5" />}
              {copied === "hex" ? "Copied" : "Copy hash"}
            </button>
          </div>
          <div className="rounded-xl border border-border bg-muted/60 p-4">
            <p className="text-xs font-medium text-muted-foreground">SHA-256 (Base64)</p>
            <p className="mt-1 break-all font-mono text-sm font-bold leading-6">{b64}</p>
            <button
              type="button"
              onClick={() => copy(b64, "b64")}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold hover:border-primary hover:text-primary"
            >
              {copied === "b64" ? <Check className="size-3.5" /> : <Clipboard className="size-3.5" />}
              {copied === "b64" ? "Copied" : "Copy Base64"}
            </button>
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Hashing runs in your browser with the Web Crypto API — the text never leaves your device.
      </p>
    </div>
  );
}
