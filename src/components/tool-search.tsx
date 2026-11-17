import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Search, X } from "lucide-react";
import { calcs } from "@/lib/registry";
import { ToolIcon } from "./tool-card";

export function ToolSearch({ variant = "hero" }: { variant?: "hero" | "header" }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return [];
    return calcs
      .filter((tool) =>
        `${tool.name} ${tool.short} ${tool.category} ${tool.keywords}`
          .toLocaleLowerCase()
          .includes(term),
      )
      .slice(0, variant === "hero" ? 7 : 6);
  }, [query, variant]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (results[0]) {
      void navigate({ to: "/$slug", params: { slug: results[0].slug } });
      setQuery("");
      setOpen(false);
    } else if (query.trim()) {
      void navigate({ to: "/tools", search: { q: query.trim() } });
      setOpen(false);
    }
  }

  return (
    <div className="relative w-full">
      <form
        onSubmit={submit}
        role="search"
        className={
          variant === "hero"
            ? "flex rounded-xl border border-input bg-background p-1.5 shadow-card focus-within:ring-2 focus-within:ring-ring"
            : "flex rounded-lg border border-primary-foreground/15 bg-primary-foreground/10 focus-within:bg-background"
        }
      >
        <Search
          className={
            variant === "hero"
              ? "ml-3 self-center size-5 shrink-0 text-muted-foreground"
              : "ml-3 self-center size-4 shrink-0 text-primary-foreground/70"
          }
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              inputRef.current?.blur();
            }
          }}
          placeholder={variant === "hero" ? `Search ${calcs.length} free tools…` : "Search tools…"}
          aria-label="Search all tools"
          className={
            variant === "hero"
              ? "min-w-0 flex-1 bg-transparent px-3 py-3 text-base outline-none placeholder:text-muted-foreground"
              : "min-w-0 flex-1 bg-transparent px-2.5 py-2 text-sm text-primary-foreground outline-none placeholder:text-primary-foreground/60 focus:text-foreground"
          }
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className={
              variant === "hero"
                ? "px-2 text-muted-foreground"
                : "px-2 text-primary-foreground/70 focus:text-foreground"
            }
          >
            <X className="size-4" />
          </button>
        )}
        {variant === "hero" && (
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground transition hover:bg-accent/85"
          >
            Search <ArrowRight className="size-4" />
          </button>
        )}
      </form>
      {open && query.trim() && (
        <>
          <button
            aria-label="Close search results"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 overflow-hidden rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-card-hover">
            {results.length ? (
              results.map((tool) => (
                <Link
                  key={tool.slug}
                  to="/$slug"
                  params={{ slug: tool.slug }}
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted"
                >
                  <span className="rounded-lg bg-secondary p-2 text-primary">
                    <ToolIcon category={tool.category} className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{tool.name}</span>
                    <span className="block text-xs text-muted-foreground">{tool.category}</span>
                  </span>
                  <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground" />
                </Link>
              ))
            ) : (
              <p className="px-3 py-5 text-center text-sm text-muted-foreground">
                No matching tools. Try a broader search.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
