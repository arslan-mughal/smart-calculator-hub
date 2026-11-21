import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Calculator,
  Check,
  ChevronDown,
  Search,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { calcs, categories } from "@/lib/registry";
import type { SiteSettings } from "@/lib/site-settings";
import { ToolSearch } from "./tool-search";
import { ToolIcon } from "./tool-card";

/** Brand wordmark: keeps the two-tone "…Hub" look for the default name,
 *  renders any custom name from Site Settings as plain text. */
function BrandName({ name }: { name: string }) {
  if (name.endsWith("Hub") && name.length > 3) {
    return (
      <>
        {name.slice(0, -3)}
        <span className="text-accent">Hub</span>
      </>
    );
  }
  return <>{name}</>;
}

const NAV_LINK =
  "rounded-full px-3.5 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground";
const NAV_LINK_ACTIVE = "bg-muted text-foreground";

/** One category row: icon, name and tool count. Used in the desktop
 *  "All tools" dropdown and in the mobile drawer. */
function CategoryRow({
  category,
  count,
  onNavigate,
}: {
  category: string;
  count: number;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to="/tools"
      search={{ category }}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-muted"
    >
      <span className="rounded-lg bg-secondary p-2 text-primary">
        <ToolIcon category={category as (typeof categories)[number]} className="size-4" />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{category}</span>
      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
        {count}
      </span>
    </Link>
  );
}

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [scrolled, setScrolled] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const openTriggerRef = useRef<HTMLElement | null>(null);
  const drawerFocusTarget = useRef<"close" | "search">("close");
  const wasMenuOpenRef = useRef(false);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const tool of calcs) map.set(tool.category, (map.get(tool.category) ?? 0) + 1);
    return map;
  }, []);

  const isToolPage = useMemo(
    () => pathname !== "/" && calcs.some((tool) => `/${tool.slug}` === pathname),
    [pathname],
  );
  const toolsActive = pathname === "/tools" || isToolPage;

  // Soft shadow once the page is scrolled.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the "All tools" dropdown on navigation.
  useEffect(() => {
    setToolsOpen(false);
  }, [pathname]);

  // Close the dropdown on a click outside it.
  useEffect(() => {
    if (!toolsOpen) return;
    const handler = (event: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setToolsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [toolsOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const openMenu = useCallback((trigger: HTMLElement | null, focusSearch = false) => {
    openTriggerRef.current = trigger;
    drawerFocusTarget.current = focusSearch ? "search" : "close";
    setMenuOpen(true);
  }, []);

  // Drawer: Escape closes it, body scroll locks while it is open.
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen, closeMenu]);

  // Drawer focus: move in on open (close button, or the search field when
  // opened from the search icon), return to the opener on close.
  useEffect(() => {
    if (menuOpen) {
      wasMenuOpenRef.current = true;
      const target =
        drawerFocusTarget.current === "search"
          ? drawerRef.current?.querySelector<HTMLInputElement>('input[aria-label="Search all tools"]')
          : drawerRef.current?.querySelector<HTMLButtonElement>("[data-drawer-close]");
      target?.focus();
    } else if (wasMenuOpenRef.current) {
      wasMenuOpenRef.current = false;
      openTriggerRef.current?.focus();
    }
  }, [menuOpen]);

  // Close the drawer if the viewport grows to desktop size.
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl transition-shadow duration-300 ${
          scrolled ? "shadow-[0_10px_30px_-12px_rgba(15,23,42,0.25)]" : ""
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-5 lg:gap-6 lg:px-8">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2.5"
            aria-label={`${settings.siteName} home`}
          >
            <span className="rounded-xl bg-accent p-2 text-accent-foreground">
              <Calculator className="size-5" strokeWidth={2.4} />
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
              <BrandName name={settings.siteName} />
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav
            className="hidden flex-1 items-center justify-center lg:flex"
            aria-label="Main navigation"
          >
            <div
              ref={toolsRef}
              className="relative"
              onMouseEnter={() => setToolsOpen(true)}
              onMouseLeave={() => setToolsOpen(false)}
            >
              <button
                ref={toolsButtonRef}
                type="button"
                aria-haspopup="true"
                aria-expanded={toolsOpen}
                onClick={() => setToolsOpen((open) => !open)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setToolsOpen(false);
                    toolsButtonRef.current?.focus();
                  }
                }}
                className={`${NAV_LINK} inline-flex items-center gap-1.5 ${
                  toolsActive || toolsOpen ? NAV_LINK_ACTIVE : ""
                }`}
              >
                All tools
                <ChevronDown
                  className={`size-4 transition-transform duration-200 ${
                    toolsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                data-testid="tools-dropdown"
                className={`absolute left-1/2 top-full z-50 mt-2 w-[560px] max-w-[calc(100vw-2rem)] -translate-x-1/2 transition-all duration-200 ${
                  toolsOpen
                    ? "visible translate-y-0 opacity-100"
                    : "invisible -translate-y-1 opacity-0"
                }`}
              >
                <div className="overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-card-hover">
                  <div className="grid grid-cols-2 gap-1 p-2">
                    {categories.map((category) => (
                      <CategoryRow
                        key={category}
                        category={category}
                        count={counts.get(category) ?? 0}
                      />
                    ))}
                  </div>
                  <Link
                    to="/tools"
                    className="flex items-center justify-between border-t border-border px-4 py-3 text-sm font-semibold transition hover:bg-muted"
                  >
                    View all {calcs.length} tools
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            </div>
            <Link to="/blog" className={NAV_LINK} activeProps={{ className: NAV_LINK_ACTIVE }}>
              Blog
            </Link>
            <Link to="/about" className={NAV_LINK} activeProps={{ className: NAV_LINK_ACTIVE }}>
              About
            </Link>
          </nav>

          {/* Desktop search */}
          <div className="ml-auto hidden w-64 shrink-0 lg:block xl:w-80">
            <ToolSearch variant="header" />
          </div>

          {/* Mobile actions */}
          <div className="ml-auto flex items-center gap-1 lg:hidden">
            <button
              type="button"
              aria-label="Search tools"
              onClick={(event) => openMenu(event.currentTarget, true)}
              className="rounded-full p-2.5 text-foreground transition hover:bg-muted"
            >
              <Search className="size-5" />
            </button>
            <button
              ref={menuButtonRef}
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={(event) =>
                menuOpen ? closeMenu() : openMenu(event.currentTarget)
              }
              className="rounded-full p-2.5 transition hover:bg-muted"
            >
              <span className="flex h-5 w-5 flex-col items-center justify-center gap-[5px]">
                <span
                  className={`block h-0.5 w-5 rounded-full bg-foreground transition-all duration-300 ${
                    menuOpen ? "translate-y-[7px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 w-5 rounded-full bg-foreground transition-all duration-300 ${
                    menuOpen ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 w-5 rounded-full bg-foreground transition-all duration-300 ${
                    menuOpen ? "-translate-y-[7px] -rotate-45" : ""
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer. Rendered as a sibling of <header> (not inside it):
          the header's backdrop blur would otherwise trap this fixed panel
          inside the header box. */}
      <div
        ref={drawerRef}
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!menuOpen}
        className={`fixed inset-0 z-[70] lg:hidden ${menuOpen ? "visible" : "invisible"}`}
      >
        <button
          type="button"
          aria-label="Close menu"
          tabIndex={menuOpen ? 0 : -1}
          onClick={closeMenu}
          className={`absolute inset-0 bg-foreground/50 transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`absolute right-0 top-0 flex h-full w-[340px] max-w-[88vw] flex-col bg-background shadow-2xl transition-transform duration-300 ease-out ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <Link
              to="/"
              onClick={closeMenu}
              className="flex items-center gap-2"
              aria-label={`${settings.siteName} home`}
            >
              <span className="rounded-lg bg-accent p-1.5 text-accent-foreground">
                <Calculator className="size-4" strokeWidth={2.4} />
              </span>
              <span className="font-display text-lg font-extrabold tracking-tight">
                <BrandName name={settings.siteName} />
              </span>
            </Link>
            <button
              type="button"
              data-drawer-close
              aria-label="Close menu"
              onClick={closeMenu}
              className="rounded-full p-2 transition hover:bg-muted"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="border-b border-border px-4 py-3">
            <ToolSearch variant="header" onNavigate={closeMenu} />
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
              <Link
                to="/tools"
                onClick={closeMenu}
                className="flex items-center justify-between rounded-xl px-3 py-3 text-base font-semibold transition hover:bg-muted"
              >
                All tools
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  {calcs.length} tools
                </span>
              </Link>
              <Link
                to="/blog"
                onClick={closeMenu}
                className="rounded-xl px-3 py-3 text-base font-semibold transition hover:bg-muted"
              >
                Blog
              </Link>
              <Link
                to="/about"
                onClick={closeMenu}
                className="rounded-xl px-3 py-3 text-base font-semibold transition hover:bg-muted"
              >
                About
              </Link>
            </nav>

            <p className="mt-6 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Categories
            </p>
            <nav aria-label="Tool categories" className="mt-2 flex flex-col gap-0.5">
              {categories.map((category) => (
                <CategoryRow
                  key={category}
                  category={category}
                  count={counts.get(category) ?? 0}
                  onNavigate={closeMenu}
                />
              ))}
            </nav>
          </div>

          <div className="border-t border-border px-4 py-4">
            <div className="flex gap-5 px-3 text-sm font-medium text-muted-foreground">
              <Link to="/privacy" onClick={closeMenu} className="transition hover:text-foreground">
                Privacy
              </Link>
              <Link to="/about" onClick={closeMenu} className="transition hover:text-foreground">
                About
              </Link>
            </div>
            <p className="mt-3 px-3 text-xs text-muted-foreground">
              © 2026 {settings.siteName} · {calcs.length} free tools
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const socials = [
    { key: "x", label: "X", href: settings.socialLinks.x },
    { key: "github", label: "GitHub", href: settings.socialLinks.github },
    { key: "youtube", label: "YouTube", href: settings.socialLinks.youtube },
  ].filter((s) => s.href !== "");
  return (
    <footer className="mt-24 bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="grid gap-10 border-b border-primary-foreground/10 pb-10 md:grid-cols-[1.2fr_2fr]">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <span className="rounded-xl bg-accent p-2 text-accent-foreground">
                <Calculator className="size-5" />
              </span>
              <span className="font-display text-2xl font-extrabold">
                <BrandName name={settings.siteName} />
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-primary-foreground/65">
              {settings.footerText}
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium text-primary-foreground/75">
              <span className="flex items-center gap-1.5">
                <Zap className="size-3.5 text-accent" /> Instant results
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-accent" /> No input tracking
              </span>
            </div>
            {settings.contactEmail !== "" && (
              <p className="mt-4 text-xs text-primary-foreground/65">
                Contact:{" "}
                <a href={`mailto:${settings.contactEmail}`} className="font-medium hover:text-accent">
                  {settings.contactEmail}
                </a>
              </p>
            )}
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
            © 2026 {settings.siteName} · {calcs.length} free tools. Results are estimates for informational use.
          </p>
          <div className="flex gap-5">
            <Link to="/blog" className="hover:text-accent">
              Blog
            </Link>
            <Link to="/about" className="hover:text-accent">
              About
            </Link>
            <Link to="/privacy" className="hover:text-accent">
              Privacy
            </Link>
            <Link to="/tools" className="inline-flex items-center gap-1 hover:text-accent">
              Tool directory <ArrowUpRight className="size-3" />
            </Link>
            {socials.map((s) => (
              <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
