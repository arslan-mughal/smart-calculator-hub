import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { calculators } from "@/lib/calculators";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export type Faq = { q: string; a: string };

export function seoHead(o: { title: string; description: string; keywords: string; faqs: Faq[] }) {
  return {
    meta: [
      { title: o.title },
      { name: "description", content: o.description },
      { name: "keywords", content: o.keywords },
      { property: "og:title", content: o.title },
      { property: "og:description", content: o.description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: o.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }),
      },
    ],
  };
}

export function CalcPage(props: { h1: string; intro: string; tool: ReactNode; children: ReactNode; faqs: Faq[]; current: string }) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <nav className="text-xs text-muted-foreground"><Link to="/" className="hover:text-primary">Home</Link> / {props.h1}</nav>
      <h1 className="mt-3 text-4xl font-bold md:text-5xl">{props.h1}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{props.intro}</p>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_280px]">
        <div>
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card md:p-8">{props.tool}</section>
          <article className="prose-calc mt-6">{props.children}</article>
          <section className="mt-10">
            <h2 className="mb-3 text-2xl font-bold">Frequently asked questions</h2>
            <Accordion type="single" collapsible className="rounded-xl border border-border bg-card px-5">
              {props.faqs.map((f, i) => (
                <AccordionItem key={i} value={`f${i}`}>
                  <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </div>
        <aside className="h-fit rounded-2xl border border-border bg-secondary p-5 lg:sticky lg:top-6">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">More calculators</p>
          <ul className="space-y-2">
            {calculators.filter((c) => c.to !== props.current).map((c) => (
              <li key={c.to}><Link to={c.to} className="text-sm text-foreground hover:text-primary">{c.name} →</Link></li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

export function Field(props: { label: string; value: string | number; onChange: (v: string) => void; type?: string; suffix?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-muted-foreground">{props.label}</span>
      <div className="mt-1 flex items-center rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
        <input type={props.type ?? "number"} value={props.value} onChange={(e) => props.onChange(e.target.value)} className="w-full bg-transparent px-3 py-2.5 text-lg outline-none" />
        {props.suffix && <span className="pr-3 text-sm text-muted-foreground">{props.suffix}</span>}
      </div>
    </label>
  );
}

export function Result(props: { label: string; value: string; big?: boolean }) {
  return (
    <div className={props.big ? "rounded-xl bg-primary p-5 text-primary-foreground" : "rounded-xl bg-muted p-4"}>
      <p className={props.big ? "text-sm opacity-80" : "text-xs text-muted-foreground"}>{props.label}</p>
      <p className={props.big ? "font-display text-4xl font-bold" : "font-display text-2xl font-bold text-foreground"}>{props.value}</p>
    </div>
  );
}
