import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Binary, Calculator, CalendarDays, Dumbbell, FileText, HeartPulse, Image, Landmark, Baby, Dices, Code2, Trophy, GraduationCap, type LucideIcon } from "lucide-react";
import type { Calc, Category } from "@/lib/tool-types";

export const categoryIcons: Record<Category, LucideIcon> = {
  Finance: Landmark,
  "Health & Fitness": HeartPulse,
  Pregnancy: Baby,
  Math: Calculator,
  Education: GraduationCap,
  "Date & Time": CalendarDays,
  Conversion: Binary,
  "Text Tools": FileText,
  "Random Tools": Dices,
  "Web & Developer": Code2,
  "Image & Media": Image,
  Sports: Trophy,
};

export function ToolIcon({ category, className = "size-5" }: { category: Category; className?: string }) {
  const Icon = categoryIcons[category] ?? Dumbbell;
  return <Icon className={className} aria-hidden="true" />;
}

export function ToolCard({ tool }: { tool: Calc }) {
  return (
    <Link to="/$slug" params={{ slug: tool.slug }} className="group flex min-h-40 flex-col rounded-2xl border border-border bg-card p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-4">
        <span className="rounded-xl bg-secondary p-2.5 text-primary transition group-hover:bg-accent group-hover:text-accent-foreground"><ToolIcon category={tool.category} /></span>
        <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
      </div>
      <h3 className="mt-4 font-display text-base font-bold tracking-tight group-hover:text-primary">{tool.name}</h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{tool.short}</p>
    </Link>
  );
}
