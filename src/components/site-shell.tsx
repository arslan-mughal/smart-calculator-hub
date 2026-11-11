import { Link } from "@tanstack/react-router";
import { calcs } from "@/lib/registry";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="font-display text-2xl font-bold text-primary">Calc<span className="text-accent">Hub</span></Link>
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary">All calculators</Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-secondary">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <p className="font-display text-xl font-bold text-primary">CalcHub</p>
        <p className="mt-2 text-sm text-muted-foreground">Free online calculators. Results are estimates for informational use only.</p>
        <div className="mt-6 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
          {calcs.map((c) => (
            <Link key={c.slug} to="/$slug" params={{ slug: c.slug }} className="text-muted-foreground hover:text-primary">{c.name}</Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
