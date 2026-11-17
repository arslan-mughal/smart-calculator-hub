import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Calculator, Check, ShieldCheck, Zap } from "lucide-react";
import { calcs, categories } from "@/lib/registry";
import { ToolSearch } from "./tool-search";

export function SiteHeader() {
  return (
    <header className="relative z-50 bg-primary text-primary-foreground">
      <div className="border-b border-primary-foreground/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-2 text-xs lg:px-8">
          <p className="font-medium text-primary-foreground/75">
            Free online calculators, converters and everyday utilities
          </p>
          <div className="hidden items-center gap-4 text-primary-foreground/75 sm:flex">
            <span className="flex items-center gap-1.5">
              <Check className="size-3.5 text-accent" /> No sign-up
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-accent" /> Private by design
            </span>
          </div>
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-4 px-5 py-4 lg:grid-cols-[auto_auto_1fr] lg:items-center lg:px-8">
        <div className="flex items-center justify-between gap-8">
          <Link to="/" className="flex items-center gap-2.5" aria-label="CalcHub home">
            <span className="rounded-xl bg-accent p-2 text-accent-foreground">
              <Calculator className="size-6" strokeWidth={2.4} />
            </span>
            <span className="font-display text-2xl font-extrabold tracking-tight">
              Calc<span className="text-accent">Hub</span>
            </span>
          </Link>
          <nav
            className="flex items-center gap-5 text-sm font-medium lg:ml-4"
            aria-label="Main navigation"
          >
            <Link
              to="/tools"
              className="text-primary-foreground/80 transition hover:text-accent"
              activeProps={{ className: "text-accent" }}
            >
              All tools
            </Link>
            <Link
              to="/about"
              className="hidden text-primary-foreground/80 transition hover:text-accent sm:block"
            >
              About
            </Link>
          </nav>
        </div>
        <div className="hidden lg:block" />
        <div className="lg:ml-auto lg:w-full lg:max-w-md">
          <ToolSearch variant="header" />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="grid gap-10 border-b border-primary-foreground/10 pb-10 md:grid-cols-[1.2fr_2fr]">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <span className="rounded-xl bg-accent p-2 text-accent-foreground">
                <Calculator className="size-5" />
              </span>
              <span className="font-display text-2xl font-extrabold">CalcHub</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-primary-foreground/65">
              Practical calculators and digital utilities that respect your time and privacy. Every
              tool is free, fast and ready to use.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium text-primary-foreground/75">
              <span className="flex items-center gap-1.5">
                <Zap className="size-3.5 text-accent" /> Instant results
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-accent" /> No input tracking
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-3 text-sm sm:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category}
                to="/tools"
                search={{ category }}
                className="text-primary-foreground/65 transition hover:text-accent"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 pt-6 text-xs text-primary-foreground/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © 2026 CalcHub · {calcs.length} free tools. Results are estimates for informational use.
          </p>
          <div className="flex gap-5">
            <Link to="/about" className="hover:text-accent">
              About
            </Link>
            <Link to="/privacy" className="hover:text-accent">
              Privacy
            </Link>
            <Link to="/tools" className="inline-flex items-center gap-1 hover:text-accent">
              Tool directory <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
