import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Clipboard, Dices, Info, RotateCcw, ShieldCheck, Zap } from "lucide-react";
import { bySlug, calcs } from "@/lib/registry";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ToolIcon } from "@/components/tool-card";
import { ImageResizer, QrCodeGenerator } from "@/components/custom-tools";

export const Route = createFileRoute("/$slug")({
  loader: ({ params }) => {
    if (!bySlug[params.slug]) throw notFound();
    return { slug: params.slug };
  },
  head: ({ loaderData }) => {
    const c = loaderData ? bySlug[loaderData.slug] : undefined;
    if (!c) return { meta: [{ title: "Tool not found — CalcHub" }, { name: "robots", content: "noindex" }] };
    const title = `${c.name} — Free Online Tool | CalcHub`;
    const desc = `${c.short} Use this free online ${c.name.toLowerCase()} with instant results, a clear guide, formula and worked example.`;
    return {
      meta: [
        { title }, { name: "description", content: desc }, { name: "keywords", content: c.keywords },
        { property: "og:title", content: title }, { property: "og:description", content: desc },
        { property: "og:type", content: "website" }, { property: "og:url", content: `/${c.slug}` },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `/${c.slug}` }],
      scripts: [{ type: "application/ld+json", children: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: c.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }) }],
    };
  },
  notFoundComponent: () => <div className="mx-auto max-w-xl px-5 py-24 text-center"><h1 className="font-display text-4xl font-extrabold">Tool not found</h1><p className="mt-3 text-muted-foreground">The address may have changed. You can find every available tool in the directory.</p><Link to="/tools" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Browse all tools <ArrowRight className="size-4" /></Link></div>,
  errorComponent: () => <div className="px-5 py-24 text-center"><h1 className="font-display text-3xl font-bold">This tool didn’t load</h1><p className="mt-2 text-muted-foreground">Please refresh the page and try again.</p></div>,
  component: Page,
});

function Page() {
  const { slug } = Route.useLoaderData();
  const c = bySlug[slug]!;
  const initialValues = (today = false) => Object.fromEntries(c.inputs.map((input) => [input.key, input.def === "today" ? (today ? new Date().toISOString().slice(0, 10) : "2026-01-01") : input.def]));
  const [values, setValues] = useState<Record<string, string>>(() => initialValues());
  const [copied, setCopied] = useState("");
  useEffect(() => {
    setValues(initialValues(true));
    setCopied("");
  }, [slug]);

  let output: { label: string; value: string }[] = [];
  try { output = c.compute(values); } catch { output = [{ label: "Result", value: "—" }]; }
  const related = calcs.filter((tool) => tool.category === c.category && tool.slug !== c.slug).slice(0, 7);

  async function copyResult(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1600);
  }

  function generateAgain() {
    setValues((current) => ({ ...current, seed: String((Number(current["seed"]) || 0) + 1) }));
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb"><Link to="/" className="hover:text-primary">Home</Link><ChevronRight className="size-3" /><Link to="/tools" search={{ category: c.category }} className="hover:text-primary">{c.category}</Link><ChevronRight className="size-3" /><span className="text-foreground">{c.name}</span></nav>
      <div className="mt-6 flex max-w-4xl items-start gap-4">
        <span className="hidden rounded-2xl bg-secondary p-3.5 text-primary sm:block"><ToolIcon category={c.category} className="size-7" /></span>
        <div><div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold text-primary"><span>{c.category}</span><span className="text-border">•</span><span className="flex items-center gap-1 font-medium text-muted-foreground"><Zap className="size-3.5" /> Free · No sign-up</span></div><h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{c.name}</h1><p className="mt-3 max-w-2xl text-lg leading-7 text-muted-foreground">{c.short}</p></div>
      </div>

      <div className="mt-9 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card" aria-label={`${c.name} tool`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-7">
              <div><h2 className="font-display text-lg font-bold">{c.custom ? "Create your result" : "Enter your values"}</h2><p className="mt-0.5 text-xs text-muted-foreground">{c.custom ? "Everything is processed on your device" : "Results update instantly as you type"}</p></div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-primary"><ShieldCheck className="size-3.5" /> Private</span>
            </div>
            <div className="p-5 sm:p-7">
              {c.custom === "image-resizer" ? <ImageResizer /> : c.custom === "qr-code" ? <QrCodeGenerator /> : (
                <div className="grid gap-7 md:grid-cols-2">
                  <div>
                    <div className="space-y-4">
                      {c.inputs.map((input) => (
                        <label key={input.key} className="block">
                          <span className="text-sm font-semibold text-foreground">{input.label}</span>
                          {input.type === "select" ? (
                            <select value={values[input.key]} onChange={(event) => setValues({ ...values, [input.key]: event.target.value })} className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring">{input.options.map((option) => <option key={option.v} value={option.v}>{option.l}</option>)}</select>
                          ) : input.type === "textarea" ? (
                            <textarea value={values[input.key] ?? ""} onChange={(event) => setValues({ ...values, [input.key]: event.target.value })} rows={7} className="mt-1.5 w-full resize-y rounded-lg border border-input bg-background px-3 py-3 font-mono text-sm leading-6 outline-none focus:ring-2 focus:ring-ring" />
                          ) : (
                            <div className="mt-1.5 flex items-center rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-ring"><input type={input.type ?? "number"} value={values[input.key] ?? ""} onChange={(event) => setValues({ ...values, [input.key]: event.target.value })} className="w-full min-w-0 bg-transparent px-3 py-2.5 text-base outline-none" />{"suffix" in input && input.suffix && <span className="shrink-0 pr-3 text-xs text-muted-foreground">{input.suffix}</span>}</div>
                          )}
                          {"hint" in input && input.hint && <span className="mt-1 block text-xs text-muted-foreground">{input.hint}</span>}
                        </label>
                      ))}
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {c.category === "Random Tools" && <button onClick={generateAgain} className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground hover:bg-accent/85"><Dices className="size-4" /> Generate again</button>}
                      <button onClick={() => setValues(initialValues(true))} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary"><RotateCcw className="size-4" /> Reset</button>
                    </div>
                  </div>
                  <div className="space-y-3" aria-live="polite">
                    {output.map((result, index) => (
                      <div key={`${result.label}-${index}`} className={index === 0 ? "group relative rounded-xl bg-primary p-5 text-primary-foreground" : "group relative rounded-xl border border-border bg-muted/60 p-4"}>
                        <p className={index === 0 ? "pr-8 text-xs font-medium text-primary-foreground/70" : "pr-8 text-xs font-medium text-muted-foreground"}>{result.label}</p>
                        <p className={index === 0 ? "mt-1 whitespace-pre-wrap break-words font-display text-2xl font-extrabold leading-snug" : "mt-1 whitespace-pre-wrap break-words font-display text-lg font-bold leading-snug"}>{result.value}</p>
                        <button onClick={() => copyResult(result.label, result.value)} aria-label={`Copy ${result.label}`} className={index === 0 ? "absolute right-3 top-3 rounded-md p-1.5 text-primary-foreground/60 opacity-0 transition hover:bg-primary-foreground/10 hover:text-primary-foreground group-hover:opacity-100 focus:opacity-100" : "absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-background hover:text-primary group-hover:opacity-100 focus:opacity-100"}>{copied === result.label ? <Check className="size-4" /> : <Clipboard className="size-4" />}</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/35 px-5 py-3 text-xs text-muted-foreground sm:px-7"><span className="flex items-center gap-1.5"><Info className="size-3.5" /> Results are estimates for informational use.</span><span>No entries are saved</span></div>
          </section>

          <article className="prose-calc mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <p className="section-kicker">Guide & explanation</p>
            <h2>What is the {c.name}?</h2><p>{c.about}</p>
            <h2>Formula and method</h2><p>{c.formula}</p>
            <h2>Worked example</h2><p>{c.example}</p>
            <h2>Practical tips</h2><ul>{c.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul>
          </article>

          <section className="mt-8">
            <p className="section-kicker">Common questions</p><h2 className="section-title">{c.name} FAQs</h2>
            <Accordion type="single" collapsible className="mt-5 rounded-2xl border border-border bg-card px-5 shadow-card sm:px-6">{c.faqs.map((faq, index) => <AccordionItem key={faq.q} value={`faq-${index}`}><AccordionTrigger className="py-5 text-left font-display font-bold hover:no-underline">{faq.q}</AccordionTrigger><AccordionContent className="pb-5 leading-7 text-muted-foreground">{faq.a}</AccordionContent></AccordionItem>)}</Accordion>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card"><div className="flex items-center justify-between"><h2 className="font-display text-base font-bold">Related tools</h2><ToolIcon category={c.category} className="size-4 text-primary" /></div><div className="mt-4 space-y-1">{related.map((tool) => <Link key={tool.slug} to="/$slug" params={{ slug: tool.slug }} className="group flex items-center justify-between gap-2 rounded-lg px-2 py-2.5 text-sm text-muted-foreground transition hover:bg-secondary hover:text-primary"><span>{tool.name}</span><ArrowRight className="size-3.5 shrink-0 opacity-0 transition group-hover:opacity-100" /></Link>)}</div><Link to="/tools" search={{ category: c.category }} className="mt-3 flex items-center gap-1.5 border-t border-border px-2 pt-4 text-xs font-bold text-primary hover:underline">View all {c.category} <ArrowRight className="size-3" /></Link></div>
          <div className="rounded-2xl bg-secondary p-5"><ShieldCheck className="size-5 text-primary" /><h2 className="mt-3 font-display text-base font-bold">Your numbers stay yours</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">This tool runs in your browser. CalcHub does not save the values or files you enter.</p><Link to="/privacy" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">Read our privacy policy <ArrowRight className="size-3" /></Link></div>
          <Link to="/tools" className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-primary hover:border-primary"><ArrowLeft className="size-4" /> All {calcs.length} tools</Link>
        </aside>
      </div>
    </div>
  );
}
