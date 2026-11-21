import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "../styles.css?url";
import manrope800 from "@fontsource/manrope/files/manrope-latin-800-normal.woff2?url";
import { SiteHeader, SiteFooter } from "../components/site-shell";
import { buildHead, organizationLd, websiteLd } from "../lib/seo";
import { DEFAULT_SETTINGS } from "../lib/site-settings";
import { getSiteSettings } from "../lib/site-settings.functions";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  // Log only a generic message: never log user input or error details that
  // could contain pasted values.
  console.error("A page failed to load");
  void error;
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  // Loads the live site settings once (Neon when configured, otherwise the
  // local content/site-settings.json). Falls back to defaults if the store
  // is unreachable — the public site must never fail to render for this.
  // Child routes read it via rootSettingsFromMatches(matches) in head() and
  // via Route.useLoaderData() in components.
  loader: async () => {
    try {
      const { settings, store } = await getSiteSettings();
      return { settings, store };
    } catch {
      return { settings: DEFAULT_SETTINGS, store: "files" as const };
    }
  },
  head: ({ loaderData, matches }) => {
    const settings = loaderData?.settings ?? DEFAULT_SETTINGS;
    // Google Analytics + Search Console run on public pages only — never
    // on /admin (admin traffic would pollute analytics, and the
    // verification tag belongs on public pages).
    const isAdmin = (matches ?? []).some(
      (m) => m.routeId === "/admin" || (m.routeId ?? "").startsWith("/admin/"),
    );
    const gaId = isAdmin ? "" : settings.googleAnalyticsId;
    const gscToken = isAdmin ? "" : settings.googleSearchConsoleVerification;
    // Site-wide defaults; every content route overrides title, description, canonical and OG tags.
    const base = buildHead({
      title: `${settings.siteName} — ${settings.tagline}`,
      description: settings.description,
      path: "/",
      jsonLd: [websiteLd(), organizationLd()],
    });
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "theme-color", content: "#1b2a4e" },
        { property: "og:locale", content: "en_US" },
        // Search Console ownership verification — rendered only when a
        // token is saved in Site Settings.
        ...(gscToken ? [{ name: "google-site-verification", content: gscToken }] : []),
        ...base.meta,
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        // Preload the display font (Manrope 800, used for headings). Same
        // hashed file the @fontsource CSS references, so no double download.
        { rel: "preload", href: manrope800, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
        { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
        { rel: "manifest", href: "/site.webmanifest" },
      ],
      scripts: [
        // GA4 — rendered only when a Measurement ID is saved in Site
        // Settings. The ID is validated to /^G-[A-Z0-9]{4,}$/ on save, so
        // interpolating it into this snippet is safe. The gtag.js URL does
        // not validate the ID, so a test ID still proves the script loads
        // (and therefore that the CSP allows it).
        ...(gaId
          ? [
              { src: `https://www.googletagmanager.com/gtag/js?id=${gaId}`, async: true },
              {
                children: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`,
              },
            ]
          : []),
        ...base.scripts,
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { settings } = Route.useLoaderData();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // The admin area is a separate app: no public header/footer.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return (
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <div className="flex min-h-screen flex-col font-sans">
        <SiteHeader settings={settings} />
        <main className="flex-1">
          <Outlet />
        </main>
        <SiteFooter settings={settings} />
      </div>
    </QueryClientProvider>
  );
}
