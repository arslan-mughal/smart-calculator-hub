import { Outlet, createFileRoute } from "@tanstack/react-router";
import { DEFAULT_SETTINGS } from "@/lib/site-settings";
import { getSiteSettings, getStorageStatus } from "@/lib/site-settings.functions";

// Layout for /admin/*. The public site header/footer are hidden for these paths in __root.tsx.
// The loader supplies the admin shell with the live site name and the active
// store (Neon vs local files); it never throws — a store failure falls back
// to defaults so the admin area still renders.
export const Route = createFileRoute("/admin")({
  loader: async () => {
    try {
      const [status, { settings }] = await Promise.all([getStorageStatus(), getSiteSettings()]);
      return { store: status.store, settings };
    } catch {
      return { store: "files" as const, settings: DEFAULT_SETTINGS };
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Admin — ${loaderData?.settings.siteName ?? "CalcHub"}` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Outlet,
});
