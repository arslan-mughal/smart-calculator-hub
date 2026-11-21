import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Search, X } from "lucide-react";
import { calcs } from "@/lib/registry";
import { ToolIcon } from "./tool-card";

export function ToolSearch({
  variant = "hero",
  onNavigate,
}: {
  variant?: "hero" | "header";
  /** Called whenever the search navigates (result click or submit) — the
   *  mobile drawer passes its close function here so a tapped result
   *  closes the drawer. */
  onNavigate?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
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

  // Dismiss the results on a click outside the search box. (A fixed overlay
  // button used to do this, but it breaks inside the sticky header: the
  // header's backdrop blur traps fixed-position descendants inside the
  // header box, so page clicks would no longer dismiss the results.)
  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (results[0]) {
      void navigate({ to: "/$slug", params: { slug: results[0].slug } });
      setQuery("");
      setOpen(false);
      onNavigate?.();
    } else if (query.trim()) {
      void navigate({ to: "/tools", search: { q: query.trim() } });
      setOpen(false);
      onNavigate?.();
    }
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <form
        onSubmit={submit}
        role="search"
        className={
          variant === "hero"
            ? "flex rounded-xl border border-input bg-background p-1.5 shadow-card focus-within:ring-2 focus-within:ring-ring"
            : "flex rounded-full border border-border bg-muted/70 transition focus-within:bg-background focus-within:ring-2 focus-within:ring-ring"
        }
      >
        <Search
          className={
            variant === "hero"
              ? "ml-3 self-center size-5 shrink-0 text-muted-foreground"
              : "ml-3 self-center size-4 shrink-0 text-muted-foreground"
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
              : "min-w-0 flex-1 bg-transparent px-2.5 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
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
                : "px-2 text-muted-foreground"
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
                    onNavigate?.();
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
      )}
    </div>
  );
}
