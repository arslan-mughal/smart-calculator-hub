import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, LockKeyhole, Zap } from "lucide-react";
import { calcs, categories } from "@/lib/registry";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [
    { title: "About CalcHub — Free, Private Online Tools" },
    { name: "description", content: "Learn why CalcHub builds clear, free and privacy-friendly calculators, converters and everyday online utilities." },
    { property: "og:title", content: "About CalcHub" }, { property: "og:description", content: "Useful online tools with clear answers and no sign-up." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: About,
});

function About() {
  return <div className="mx-auto max-w-4xl px-5 py-14">
    <p className="section-kicker">About CalcHub</p><h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">Useful answers without the usual friction</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">CalcHub is a growing collection of {calcs.length} free online calculators and utilities across {categories.length} practical categories.</p>
    <div className="mt-10 grid gap-4 sm:grid-cols-3">{[[Zap,"Quick to use","Clear fields, instant results and no unnecessary steps."],[LockKeyhole,"Privacy first","Tools run locally in your browser and do not save your entries."],[Check,"Easy to understand","Guides, formulas and examples explain what the numbers mean."]].map(([Icon,title,text])=>{const I=Icon as typeof Zap;return <div key={String(title)} className="rounded-2xl border border-border bg-card p-5"><I className="size-6 text-primary"/><h2 className="mt-4 font-display text-lg font-bold">{String(title)}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{String(text)}</p></div>})}</div>
    <article className="prose-calc mt-10"><h2>Why we built it</h2><p>Small calculations and file tasks should not require a new account, a software download or a search through cluttered pages. CalcHub puts dependable everyday tools in one organised place, with a consistent interface that works on phones, tablets and desktops.</p><h2>What the results mean</h2><p>Calculators use standard mathematical formulas and clearly stated assumptions. Financial results are estimates rather than offers or advice, and health tools are screening aids rather than diagnoses. Always check important decisions against your actual documents, measurements and qualified professional advice.</p><h2>Start exploring</h2><p>Search the directory for a specific task or browse by topic. Every tool has its own page, related suggestions and answers to common questions.</p></article>
    <Link to="/tools" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Browse all tools <ArrowRight className="size-4"/></Link>
  </div>;
}
