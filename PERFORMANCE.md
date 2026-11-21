# CalcHub performance notes

Measured with `npm run build` on 2026-11-18 (Vite 8.1.5, TanStack Start).
Sizes are the raw (uncompressed) file sizes Vite reports; gzip figures are Vite's estimates.

## Before (v2 upload, before the 2026-11-18 cleanup)

`dist/` total: **3.3 MB**. Client JS total: **1,252 KB**. Main CSS: **128 KB**.

| Chunk (client) | Size | gzip | Notes |
| --- | --- | --- | --- |
| `admin.index` | 417.27 kB | 109.89 kB | Admin dashboard — includes all of recharts, loaded eagerly |
| `index` (homepage) | 295.71 kB | 94.19 kB | Homepage incl. ToolFinder (below the fold, was eager) |
| `registry` | 249.55 kB | 84.55 kB | All 212 tools' definitions; imported by homepage, /tools and every tool page |
| `_slug` (tool page) | 52.44 kB | 16.29 kB | |
| `admin-auth.functions` | 37.98 kB | 12.37 kB | |
| `utils` | 30.22 kB | 9.89 kB | |
| `browser` | 23.47 kB | 8.86 kB | |
| `routes` | 19.25 kB | 5.49 kB | |
| `link` | 9.31 kB | 4.29 kB | |
| `react` | 7.53 kB | 2.88 kB | |
| `tool-card` | 5.78 kB | 2.34 kB | |
| `preload-helper` | 5.75 kB | 2.26 kB | |
| `admin.login` | 4.66 kB | 1.97 kB | |
| `tools` | 3.81 kB | 1.57 kB | |
| `privacy` | 3.03 kB | 1.33 kB | |
| `about` | 2.74 kB | 1.30 kB | |

Baseline test run: **39 tests passed, but 2 test files failed to load** — both pre-existing
regressions in the v2 upload (see below), fixed in the same pass as the performance work.

## What changed (2026-11-18)

1. **Orphaned AI/Lovable code deleted** (`src/lib/ai/`, `calculator-finder.*`, `ai-calculator-finder.tsx`,
   `lovable-error-reporting.ts`, `error-capture.ts`, the `calculator-finder.test.ts` that tested them,
   and the unused `src/components/ui/chart.tsx`). Nothing imported them; they only added weight and
   a stale `ai`/`zod` dependency chain.
2. **Dependency cleanup**: removed `date-fns` (imported nowhere) and the direct `zod` dependency
   (only the deleted AI finder used it). `qrcode` is kept — the QR generator loads it with a dynamic
   `import("qrcode")`. `embla-carousel-react`, `cmdk`, `vaul`, `input-otp`, `react-resizable-panels`
   and `react-day-picker` are kept: they are imported by shadcn `ui/` components (even though those
   components are currently unused, removing the packages would break the component files).
3. **Audit overrides re-applied** in `package.json` (brace-expansion 1.1.22, picomatch 4.0.7,
   nanoid 3.3.20, js-yaml 4.3.2, seroval 1.8.1, source-map-js 1.2.2, zod 4.6.7, rolldown 1.2.1);
   `vitest ^4.1.12` and `typescript-eslint ^8.73.0`.
4. **`vite-tsconfig-paths` plugin removed** — replaced by Vite 8's native `resolve: { tsconfigPaths: true }`.
   The build no longer prints the "plugin detected" warning.
5. **Admin charts lazy-loaded**: recharts is now imported via `React.lazy` + `Suspense` in the admin
   overview, so the ~400 kB admin chunk no longer blocks the admin first paint.
6. **ToolFinder lazy-loaded on the homepage**: it sits below the fold; it now loads in a separate chunk
   after the first paint and works identically.
7. **`content-visibility: auto` on tool-card grids** (`src/styles.css`, `.tool-card-grid > *`):
   off-screen cards skip rendering work until scrolled into view, with `contain-intrinsic-size`
   reserving space so the layout doesn't jump.
8. **Font preload**: the Manrope 800 woff2 (`manrope-latin-800-normal.woff2`, the display font used
   for headings) is preloaded from `__root.tsx` head. Fonts are self-hosted via `@fontsource` —
   no Google Fonts links remain anywhere.
9. **Blog + settings are server functions, not client weight**: blog posts and site settings live in
   `content/*.json` and are read server-side; the admin editors are separate route chunks.

## After (2026-11-18)

Build output moved from `dist/` to `.output/` (Nitro/Vercel build): `.output/` total
**6.1 MB** (server bundle + all client route chunks). Client JS total across all
route chunks: **1,412 KB** — but only the matched route's chunks load per page,
so the total is not a first-load figure. Main CSS unchanged: **128 KB**.
Tests: **91 passing, 0 failing** (was 39 passing + 2 failed files at baseline).

| Chunk (client) | Before | After | Notes |
| --- | --- | --- | --- |
| `admin.index` | 417.27 kB (109.89 gz) | **7.17 kB (2.45 gz)** | recharts moved to lazy `admin-charts` — admin first paint no longer waits on the chart library |
| `admin-charts` (new) | — (inside admin.index) | 396.17 kB (102.29 gz) | Loaded on demand via React.lazy + Suspense when the overview/usage charts render |
| `index` (homepage) | 295.71 kB (94.19 gz) | 310.36 kB (97.64 gz) | Finder removed from it (see below); the ~15 kB growth is chunk-boundary movement from the Nitro build, not new homepage code — first-load weight is roughly flat |
| `tool-finder` (new) | — (inside index) | 7.28 kB (2.64 gz) | Below the fold: lazy-loaded after first paint, works identically |
| `registry` | 249.55 kB (84.55 gz) | 249.55 kB (83.38 gz) | Unchanged — still the largest first-load chunk (see below) |
| `_slug` (tool page) | 52.44 kB (16.29 gz) | 52.74 kB | Unchanged in practice |
| `blog` / `blog.$slug` (new) | — | 2.13 kB / 2.94 kB | List loads metadata only; article loads one post |
| `admin.blog` / `admin.settings` / `admin.tools` (new) | — | 6.53 / 5.23 / 6.99 kB | Separate admin route chunks, loaded on demand |
| `blog-editor` (new) | — | 6.98 kB | Admin post editor + live preview |

Other changes in this pass: `content-visibility: auto` on tool-card grids
(`/tools` + homepage popular grid) so off-screen cards skip rendering work;
Manrope 800 preloaded from the root head (same hashed file the `@fontsource`
CSS references, so no double download); no Google Fonts links anywhere;
`vite-tsconfig-paths` warning gone; `date-fns` and the direct `zod` dependency
removed (see "What changed").

## Biggest remaining cost

The 212-tool registry (`registry` chunk, ~250 kB raw / ~85 kB gzip) is imported by the homepage,
`/tools` and every tool page, so it is part of almost every first load. The next step is a
**catalogue split**: keep a small index (slug, name, category, popular) for lists/search and load
each tool's full definition (inputs, compute) on demand. That is a larger refactor and is
deliberately not attempted here.
