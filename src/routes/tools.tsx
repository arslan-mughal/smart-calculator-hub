import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { calcs, categories } from "@/lib/registry";
import { ToolCard } from "@/components/tool-card";
import { absoluteUrl, breadcrumbLd, buildHead, rootSettingsFromMatches } from "@/lib/seo";

export const Route = createFileRoute("/tools")({
  validateSearch: (search: Record<string, unknown>): { q?: string; category?: string } => ({
    ...(typeof search["q"] === "string" ? { q: search["q"] } : {}),
    ...(typeof search["category"] === "string" &&
    categories.includes(search["category"] as (typeof categories)[number])
      ? { category: search["category"] }
      : {}),
  }),
  // Search/filter variants are thin duplicates of the directory: keep them out of the index.
  head: ({ match, matches }) => {
    const settings = rootSettingsFromMatches(
      matches as unknown as { routeId?: string; loaderData?: unknown }[],
    );
    const filtered = Boolean(match.search.q || match.search.category);
    return buildHead({
      title: `All ${calcs.length} Free Online Tools & Calculators | ${settings.siteName}`,
      description:
        `Browse the complete ${settings.siteName} directory of free calculators, unit converters, text tools, random generators, developer utilities and sports calculators.`,
      path: "/tools",
      keywords:
        "free online tools directory, calculator directory, converters, text tools, developer tools, random generators",
      noindex: filtered,
      jsonLd: [
        breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "All tools", path: "/tools" },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `${settings.siteName} tools`,
          numberOfItems: calcs.length,
          itemListElement: calcs.map((tool, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: tool.name,
            url: absoluteUrl(`/${tool.slug}`),
          })),
        },
      ],
    });
  },
  component: ToolDirectory,
});

function ToolDirectory() {
  const initial = Route.useSearch();
  const [query, setQuery] = useState(initial.q ?? "");
  const [category, setCategory] = useState(initial.category ?? "All");
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return calcs.filter(
      (tool) =>
        (category === "All" || tool.category === category) &&
        (!term || `${tool.name} ${tool.short} ${tool.keywords}`.toLocaleLowerCase().includes(term)),
    );
  }, [query, category]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      <div className="max-w-3xl">
        <p className="section-kicker">Complete directory</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Find the right tool for the job
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          Search all {calcs.length} free tools, or narrow the directory by category. Every tool
          opens on its own dedicated page.
        </p>
      </div>
      <div className="sticky top-0 z-20 -mx-5 mt-8 bg-background/95 px-5 py-4 backdrop-blur lg:-mx-8 lg:px-8">
        <div className="flex rounded-xl border border-input bg-card p-1.5 shadow-card focus-within:ring-2 focus-within:ring-ring">
          <Search className="ml-3 size-5 self-center text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, task or keyword…"
            aria-label="Filter tools"
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear filter"
              className="px-3 text-muted-foreground hover:text-primary"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {["All", ...categories].map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={
                category === item
                  ? "shrink-0 rounded-full bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground"
                  : "shrink-0 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary"
              }
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
        <SlidersHorizontal className="size-4" />
        <p>
          <strong className="text-foreground">{filtered.length}</strong>{" "}
          {filtered.length === 1 ? "tool" : "tools"}
          {category !== "All" ? ` in ${category}` : ""}
          {query ? ` matching “${query}”` : ""}
        </p>
      </div>
      {filtered.length ? (
        <div className="tool-card-grid mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <Search className="mx-auto size-8 text-muted-foreground" />
          <h2 className="mt-4 font-display text-2xl font-bold">No tools found</h2>
          <p className="mt-2 text-muted-foreground">
            Try another keyword or clear the category filter.
          </p>
          <button
            onClick={() => {
              setQuery("");
              setCategory("All");
            }}
            className="mt-5 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
          >
            Show every tool
          </button>
        </div>
      )}
    </div>
  );
}
