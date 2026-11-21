// Standard TanStack Start Vite config (no third-party wrapper).
// tanstackStart must come before viteReact. Never set ssr.external or
// resolve.external, and never add compression: hosting compresses at the edge.
import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

export default defineConfig(({ mode }) => {
  // Make server-only variables from .env (ADMIN_*) visible as process.env in dev/preview.
  // In production, set them in the host's environment (or run node with --env-file=.env).
  for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), ""))) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
  // VITE_SITE_URL is inlined at BUILD time (canonical, og:url, og:image, JSON-LD). If it is
  // unset or empty, src/lib/seo.ts would fall back to http://localhost:3000 in production.
  // On Vercel, fall back to the project's production domain instead (system variable
  // VERCEL_PROJECT_PRODUCTION_URL, e.g. "my-site.vercel.app" or a custom domain). An explicit
  // VITE_SITE_URL always wins.
  if (!process.env["VITE_SITE_URL"]?.trim()) {
    const vercelHost = process.env["VERCEL_PROJECT_PRODUCTION_URL"]?.trim();
    if (vercelHost) process.env["VITE_SITE_URL"] = `https://${vercelHost}`;
  }
  return {
    plugins: [
      tanstackStart({
        // Use src/server.ts (our SSR error wrapper + security headers) as the
        // server entry instead of the default entry.
        server: { entry: "server" },
      }),
      viteReact(),
      tailwindcss(),
      // Vercel deployment: Nitro packages the build as a Vercel Function and
      // auto-detects the platform (VERCEL env) to apply the `vercel` preset —
      // no preset is hard-coded here, so local `vite build` still produces the
      // plain Node server in .output/. Must stay last. The CSP and all other
      // security headers live in src/server.ts and are NOT duplicated here.
      nitro(),
    ],
    resolve: { tsconfigPaths: true },
  };
});
