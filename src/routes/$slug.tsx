import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { bySlug, calcs } from "@/lib/registry";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/$slug")({
  loader: ({ params }) => {
    if (!bySlug[params.slug]) throw notFound();
    return { slug: params.slug };
  },
  head: ({ loaderData }) => {
    const c = loaderData ? bySlug[loaderData.slug] : undefined;
    if (!c) return { meta: [{ title: "Calculator not found — CalcHub" }, { name: "robots", content: "noindex" }] };
    const title = `${c.name} — Free Online ${c.name} | CalcHub`;
    const desc = `Free ${c.name.toLowerCase()}: ${c.short} Includes the formula, worked example and FAQs.`;
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
  notFoundComponent: () => <div className="mx-auto max-w-xl px-5 py-24 text-center"><h1 className="text-3xl font-bold">Calculator not found</h1><Link to="/" className="mt-4 inline-block text-primary">See all calculators</Link></div>,
  errorComponent: () => <div className="px-5 py-24 text-center">This calculator didn't load. Please refresh.</div>,
  component: Page,
});

function Page() {
  const { slug } = Route.useLoaderData();
  const c = bySlug[slug]!;
  const init = () => Object.fromEntries(c.inputs.map((i) => [i.key, i.def === "today" ? "2026-01-01" : i.def]));
  const [v, setV] = useState<Record<string, string>>(init);
  useEffect(() => {
    const t = new Date().toISOString().slice(0, 10);
    setV(Object.fromEntries(c.inputs.map((i) => [i.key, i.def === "today" ? t : i.def])));
  }, [slug]);
  let out: { label: string; value: string }[] = [];
  try { out = c.compute(v); } catch { out = [{ label: "Result", value: "—" }]; }
  const related = calcs.filter((x) => x.category === c.category && x.slug !== c.slug);
  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <nav className="text-xs text-muted-foreground"><Link to="/" className="hover:text-primary">Home</Link> / {c.category} / {c.name}</nav>
      <h1 className="mt-3 text-4xl font-bold md:text-5xl">{c.name}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{c.short}</p>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_280px]">
        <div>
          <section className="grid gap-6 rounded-2xl border border-border bg-card p-6 shadow-card md:grid-cols-2 md:p-8">
            <div className="space-y-4">
              {c.inputs.map((i) => (
                <label key={i.key} className="block">
                  <span className="text-sm font-medium text-muted-foreground">{i.label}</span>
                  {i.type === "select" ? (
                    <select value={v[i.key]} onChange={(e) => setV({ ...v, [i.key]: e.target.value })} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5">
                      {i.options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  ) : (
                    <div className="mt-1 flex items-center rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
                      <input type={i.type ?? "number"} value={v[i.key] ?? ""} onChange={(e) => setV({ ...v, [i.key]: e.target.value })} className="w-full bg-transparent px-3 py-2.5 text-lg outline-none" />
                      {"suffix" in i && i.suffix && <span className="pr-3 text-sm text-muted-foreground">{i.suffix}</span>}
                    </div>
                  )}
                </label>
              ))}
            </div>
            <div className="space-y-3">
              {out.map((o, k) => (
                <div key={o.label} className={k === 0 ? "rounded-xl bg-primary p-5 text-primary-foreground" : "rounded-xl bg-muted p-4"}>
                  <p className={k === 0 ? "text-sm opacity-80" : "text-xs text-muted-foreground"}>{o.label}</p>
                  <p className={k === 0 ? "font-display text-3xl font-bold" : "font-display text-xl font-bold"}>{o.value}</p>
                </div>
              ))}
            </div>
          </section>
          <article className="prose-calc mt-6">
            <h2>What is the {c.name}?</h2><p>{c.about}</p>
            <h2>Formula</h2><p>{c.formula}</p>
            <h2>Worked example</h2><p>{c.example}</p>
            <h2>Tips</h2><ul>{c.tips.map((t) => <li key={t}>{t}</li>)}</ul>
          </article>
          <section className="mt-10">
            <h2 className="mb-3 text-2xl font-bold">Frequently asked questions</h2>
            <Accordion type="single" collapsible className="rounded-xl border border-border bg-card px-5">
              {c.faqs.map((f, k) => (
                <AccordionItem key={k} value={`f${k}`}><AccordionTrigger className="text-left">{f.q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{f.a}</AccordionContent></AccordionItem>
              ))}
            </Accordion>
          </section>
        </div>
        <aside className="h-fit rounded-2xl border border-border bg-secondary p-5 lg:sticky lg:top-6">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">More {c.category}</p>
          <ul className="space-y-2">{related.map((x) => <li key={x.slug}><Link to="/$slug" params={{ slug: x.slug }} className="text-sm hover:text-primary">{x.name} →</Link></li>)}</ul>
        </aside>
      </div>
    </div>
  );
}
