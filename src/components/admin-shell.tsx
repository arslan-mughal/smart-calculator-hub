import { Link, useLoaderData, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import {
  BarChart3, ChevronsLeft, ChevronsRight, ExternalLink, LayoutDashboard, LogOut,
  Menu, Newspaper, Settings, ShieldCheck, Wrench, X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { adminLogout } from "@/lib/admin-auth.functions";
import { Button } from "@/components/ui/button";

const SIDEBAR_KEY = "calchub-admin-sidebar-v1";

/** Admin nav — also imported by tests to verify every item has a route. */
export const ADMIN_NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/tools", label: "Tools", icon: Wrench, exact: false },
  { to: "/admin/blog", label: "Blog Posts", icon: Newspaper, exact: false },
  { to: "/admin/settings", label: "Site Settings", icon: Settings, exact: false },
  { to: "/admin/security", label: "Security", icon: ShieldCheck, exact: false },
  { to: "/admin/usage", label: "Usage", icon: BarChart3, exact: false },
] as const;

/**
 * WordPress-style admin shell: a dark admin bar across the top, a dark
 * (#1d2327) sidebar with a "Collapse menu" control at the bottom, and a
 * light-grey (#f0f0f1) content area. The `.wp-admin` scope re-themes the
 * site's CSS variables (see styles.css) so buttons and links inside the
 * admin use WordPress blue (#2271b1) instead of the public site's palette.
 */
export function AdminShell({ username, children }: { username: string; children: ReactNode }) {
  const navigate = useNavigate();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { store, settings } = useLoaderData({ from: "/admin" });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Collapse preference is a client-only concern: read after mount so the
  // server render never mismatches the hydrated one.
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_KEY) === "collapsed");
    } catch {
      // Storage unavailable — stay expanded.
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? "collapsed" : "expanded");
      } catch {
        // ignore
      }
      return next;
    });
  }

  async function signOut() {
    setBusy(true);
    try {
      await adminLogout();
    } finally {
      await router.invalidate();
      await navigate({ to: "/admin/login" });
    }
  }

  const isActive = (to: string, exact: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

  const nav = (
    <nav className="mt-2 flex-1 space-y-0.5 px-2" aria-label="Admin sections">
      {ADMIN_NAV.map((item) => {
        const active = isActive(item.to, item.exact);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            onClick={() => setMobileOpen(false)}
            className={`relative flex items-center gap-3 px-3 py-2 text-[13px] transition ${
              active
                ? "bg-[#2c3338] font-semibold text-white"
                : "text-[#eeeeee] hover:bg-[#2c3338] hover:text-white"
            } ${collapsed ? "justify-center px-2" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {active && (
              <span className="absolute left-0 top-0 h-full w-[3px] bg-[#72aee6]" aria-hidden="true" />
            )}
            <Icon className="size-5 shrink-0 opacity-90" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  const sidebarBody = (inDrawer: boolean) => (
    <>
      <div className={`flex h-12 shrink-0 items-center border-b border-white/10 ${collapsed && !inDrawer ? "justify-center px-2" : "px-4"}`}>
        <Link to="/admin" className="flex min-w-0 items-center gap-2" onClick={() => setMobileOpen(false)}>
          <span className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-[#2271b1] text-white">
            <ShieldCheck className="size-4" />
          </span>
          {(!collapsed || inDrawer) && (
            <span className="truncate text-sm font-semibold text-white">{settings.siteName}</span>
          )}
        </Link>
        {inDrawer && (
          <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="ml-auto rounded p-1 text-white/70 hover:bg-white/10 hover:text-white">
            <X className="size-5" />
          </button>
        )}
      </div>

      {nav}

      <div className="shrink-0 border-t border-white/10 px-2 py-2">
        {/* Active store: database on Vercel, local files in dev. */}
        <div
          title={
            store === "database"
              ? "Settings and blog posts are stored in Neon Postgres (DATABASE_URL is set)."
              : "Settings and blog posts are stored in local content/*.json files. Set DATABASE_URL to use Neon."
          }
          className={`flex items-center gap-2 px-3 py-2 text-xs text-[#eeeeee]/70 ${collapsed ? "justify-center px-2" : ""}`}
        >
          <span className={`size-2 shrink-0 rounded-full ${store === "database" ? "bg-[#00a32a]" : "bg-[#dba617]"}`} />
          {!collapsed && <span className="truncate">{store === "database" ? "Database (Neon)" : "Local files"}</span>}
        </div>
        {/* WordPress-style "Collapse menu" control at the bottom. */}
        {!inDrawer && (
          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
            title={collapsed ? "Expand menu" : "Collapse menu"}
            className={`flex w-full items-center gap-3 px-3 py-2 text-[13px] text-[#eeeeee]/80 transition hover:bg-[#2c3338] hover:text-white ${collapsed ? "justify-center px-2" : ""}`}
          >
            {collapsed ? <ChevronsRight className="size-5 shrink-0" /> : <ChevronsLeft className="size-5 shrink-0" />}
            {!collapsed && <span>Collapse menu</span>}
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="wp-admin min-h-screen bg-[#f0f0f1] font-sans text-[#1d2327]">
      {/* WordPress-style admin bar */}
      <header className="sticky top-0 z-50 flex h-11 items-center gap-1 bg-[#1d2327] px-2 text-white sm:px-3">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="rounded p-2 text-white/80 hover:bg-[#2c3338] hover:text-white lg:hidden"
        >
          <Menu className="size-5" />
        </button>
        <Link to="/admin" className="flex items-center gap-2 rounded px-2 py-1.5 text-sm font-semibold hover:bg-[#2c3338]">
          <ShieldCheck className="size-4 text-[#72aee6]" />
          <span className="hidden sm:inline">{settings.siteName}</span>
          <span className="text-white/60">Admin</span>
        </Link>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded px-2 py-1.5 text-[13px] text-white/80 hover:bg-[#2c3338] hover:text-white"
        >
          <ExternalLink className="size-4" />
          <span className="hidden md:inline">View site</span>
        </a>
        <span className="ml-auto flex items-center gap-1">
          <span className="hidden items-center gap-2 rounded px-2 py-1.5 text-[13px] text-white/85 sm:flex">
            <span className="flex size-6 items-center justify-center rounded-full bg-[#2271b1] text-xs font-bold text-white">
              {username.charAt(0).toUpperCase()}
            </span>
            {username}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void signOut()}
            disabled={busy}
            aria-label="Log out"
            className="h-8 text-[13px] text-white/80 hover:bg-[#2c3338] hover:text-white"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Log out</span>
          </Button>
        </span>
      </header>

      <div className="flex items-start">
        {/* Desktop sidebar */}
        <aside
          className={`sticky top-11 hidden h-[calc(100vh-2.75rem)] shrink-0 flex-col bg-[#1d2327] text-white lg:flex ${
            collapsed ? "w-14" : "w-40"
          }`}
          aria-label="Admin sidebar"
        >
          {sidebarBody(false)}
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
            <button
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-black/50"
            />
            <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-[#1d2327] text-white shadow-2xl">
              {sidebarBody(true)}
            </aside>
          </div>
        )}

        {/* Main column */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
