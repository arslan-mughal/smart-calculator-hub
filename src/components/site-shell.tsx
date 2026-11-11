import { Link } from "@tanstack/react-router";
import { calculators } from "@/lib/calculators";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-card/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="font-display text-2xl font-bold text-primary">Calc<span className="text-accent">Hub</span></Link>
        <nav className="hidden gap-5 text-sm text-muted-foreground md:flex">
          {calculators.slice(0, 4).map((c) => (
            <Link key={c.to} to={c.to} className="hover:text-primary" activeProps={{ className: "text-primary font-medium" }}>
              {c.name.replace(" Calculator", "").replace(" / EMI", "")}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-secondary">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-3">
        <div>
          <p className="font-display text-xl font-bold text-primary">CalcHub</p>
          <p className="mt-2 text-sm text-muted-foreground">Free, accurate online calculators. Results are estimates for informational use only.</p>
        </div>
        <div className="md:col-span-2 grid grid-cols-2 gap-2 text-sm">
          {calculators.map((c) => (
            <Link key={c.to} to={c.to} className="text-muted-foreground hover:text-primary">{c.name}</Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
