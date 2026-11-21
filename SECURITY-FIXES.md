# Security Fixes — Changelog

## 2026-11-17 — Security pass (all gaps from the 17 Nov 2026 audit fixed)

**Summary:** Critical crypto flaw fixed, all third-party AI traces removed,
security headers added, medium/low issues capped, and a local-only Admin
Dashboard added at `/admin`. Verified: `npm test` — 37/37 pass; `npm run build`
— passes with a standard TanStack Start Vite config; dev server smoke-tested
live (`/` and `/admin` return 200 with all security headers; footer Admin link
and password-generator secure note render).

### CRITICAL — Crypto-secure randomness

| Fix | File |
|---|---|
| `seededRandom()` is now documented as a deterministic LCG for games/demos only, never for security | `src/lib/extra-tools/shared.ts:123` |
| Added `secureRandomInt()` (rejection sampling, no modulo bias), `secureRandomChoice()` and `secureUuid()` using `crypto.getRandomValues()` / `crypto.randomUUID()`, with a clear error if Web Crypto is unavailable | `src/lib/extra-tools/shared.ts` |
| Password Generator: no seed input, crypto-based, length clamped 4–128, on-page note "Generated securely in your browser with crypto.getRandomValues — never sent to a server" | `src/lib/extra-tools/text-random-developer.ts` (password-generator) |
| UUID Generator: no seed input, `crypto.randomUUID()` with a `getRandomValues` v4 fallback (correct version/variant bits) | `src/lib/extra-tools/text-random-developer.ts` (uuid-generator) |
| All other random tools keep the seed input, relabelled "Seed (deterministic — for games/demos only)" | `src/lib/extra-tools/text-random-developer.ts` |

### HIGH — Third-party AI removed, security headers added

| Fix | File |
|---|---|
| Deleted the entire AI finder: `src/lib/ai/` (`responses.ts`, `run-id.ts`), `calculator-finder.functions.ts`, `calculator-finder.server.ts`, `calculator-finder.shared.ts`, `src/lib/lovable-error-reporting.ts`, `src/components/ai-calculator-finder.tsx`, `src/test/calculator-finder.test.ts` | deleted |
| Replaced with a **local finder**: pure keyword scoring over the catalogue (name, slug, keywords, short, category, input labels), exact/prefix matching only, qualified-match + score threshold so invented tools never match; query 8–600 chars, client-side only, no fetch | `src/lib/local-finder.ts`, `src/components/tool-finder.tsx`, `src/test/local-finder.test.ts` |
| `src/routes/index.tsx` now uses `ToolFinder` ("Runs entirely in your browser — nothing is sent to a server") | `src/routes/index.tsx` |
| Security headers on every response (merged, never overwriting existing): CSP `default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `Permissions-Policy: camera=(), microphone=(), geolocation=()` — live-verified on `/` and `/admin` | `src/server.ts` |
| Removed all "Lovable" strings from `src/`, `README.md`, `AGENTS.md`, `privacy.tsx`, `__root.tsx` (incl. `twitter:site`), `start.ts` comments; rewrote `README.md` and `AGENTS.md` as an independent TanStack Start project; privacy page now states the finder runs locally and no data leaves the browser | throughout |
| Removed `@ai-sdk/openai` and `ai` dependencies. **The Vite wrapper was also fully removed** — `vite.config.ts` now uses the standard `tanstackStart()` plugin (documented in the installed `@tanstack/react-start` package) + `viteReact`, `tailwindcss`, `vite-tsconfig-paths`, with `server.entry: "server"`. Build passes, so there is **no remaining Lovable trace, including no build-time wrapper fallback** | `vite.config.ts`, `package.json` |
| Error handling: deleted `src/lib/error-capture.ts` (it overrode `console.error` and expanded stacks); `__root.tsx` error component now logs only the generic message "A page failed to load"; `src/server.ts` / `src/start.ts` log generic SSR errors only | `src/routes/__root.tsx`, `src/server.ts`, `src/start.ts` |
| Scientific calculator errors no longer echo user input (`Unknown symbol …` / `Unexpected …` → generic messages) | `src/lib/scientific.ts` |
| CSRF middleware kept (it was already correct) | `src/start.ts` |

### MEDIUM

| Fix | File |
|---|---|
| Regex Tester: pattern capped at 200 chars, text at 10,000 chars, flags allow-listed to `g,i,m,s,u,y` only, nested quantifiers (`(a+)+`, `(.*)*`, etc.) rejected, matches capped at 100 with a clear error | `src/lib/extra-tools/text-random-developer.ts` (regex-tester) |
| Image Resizer: files >10 MB rejected, `image/svg+xml` rejected, width/height clamped to 1–8000 px, images >8000 px on either side rejected, user-friendly errors; local-only processing and object-URL revocation kept | `src/components/custom-tools.tsx` |
| JWT Decoder: visible warning added — "Do not paste a real production token — it may contain personal data. Decoding is local and the signature is never verified." | `src/lib/extra-tools/text-random-developer.ts` (jwt-decoder) |

### LOW

| Fix | File |
|---|---|
| Google Fonts removed. Fonts are self-hosted via `@fontsource/manrope` + `@fontsource/ibm-plex-sans` (weights 400–800 / 400–700), imported in `src/styles.css`; Google Fonts links removed from `__root.tsx`; CSP `font-src`/`style-src` are now `'self'` only; privacy page updated | `src/styles.css`, `src/routes/__root.tsx`, `src/server.ts`, `src/routes/privacy.tsx`, `package.json` |
| Dependency audit: `npm audit` and `bun audit` could **not** run in this sandbox — the registry blocks the audit endpoint (`403 policy_denied` for `POST /-/npm/v1/security/audits/quick`, same for Bun). `package-lock.json` was regenerated from the cleaned `package.json`. **Run `npm audit` on a normal network before deploying.** Known from install warnings: `recharts@2.15.4` is on an unmaintained 2.x branch (consider Recharts 3) and `eslint@9.39.5` is deprecated. No `npm audit fix` was applied because the audit itself was unavailable. | — |
| `npm install` note: the original install failed with a 404 for `@ai-sdk/provider-utils` (a transitive dep of the removed `ai` package). After removing the AI deps, `bun install` succeeds (534 packages); `npm install --package-lock-only` also succeeds. | `package.json`, `bun.lock`, `package-lock.json` |

### Pre-existing test failures found and fixed (not caused by this pass)

- `src/test/next-batch.test.ts` expected 26 tools in the next batch, but the batch
  actually contains 27, and `scientific-calculator` has 6 editorial `details`
  sections, not 2. Updated the stale expectations (27 tools, `details >= 2`,
  27 unique `about` texts). The batch code itself was not changed.

### Admin Dashboard (new)

- Route `/admin` (`src/routes/admin.tsx`, in `routeTree.gen.ts` after build).
  **Local-only, no login** — stated at the top of the page and in `SECURITY.md`.
  It shows only the public catalogue and usage stored in this browser.
- Overview cards (212 tools, 12 categories, popular/custom counts, security
  status 7/7, visits in this browser); Bar + Pie charts of tools per category
  (recharts); last-7-days usage bar chart.
- Tool inventory table: search, category filter, sort by name/category/popular,
  Name/Slug/Category/Inputs/Popular/Status columns, row links to the public tool,
  CSV export.
- Security panel: the 7 fixes above with file references, plus a "Run checks"
  button that runs live client-side checks (`crypto.getRandomValues` /
  `crypto.randomUUID` present, no seed on password/UUID tools, local finder
  returns the mortgage calculator, no third-party scripts loaded, Regex Tester
  rejects `(a+)+`; the header check is marked Server and must be verified
  from a live response).
- Usage analytics: `src/routes/$slug.tsx` records `{slug, at}` to
  `localStorage` key `calchub-usage-v1` (capped at 500, try/catch for private
  mode); dashboard shows total visits, top 5 tools, last-7-days chart, Clear
  and Export JSON buttons, with the privacy note "Stored only in this browser,
  never sent anywhere."
- Footer "Admin" link added (`src/components/site-shell.tsx`); dashboard has a
  back-to-site link and uses the site header/footer.

### What remains

- **No backend auth exists, by design.** `/admin` is not access-controlled and
  must never be presented as such. If real access control is ever needed, it
  requires a backend + real authentication — a client-side PIN would be fake
  security and was deliberately not added.
- **No rate limiting is needed** now that the only server function (the AI
  finder) is deleted; the site is static/client-side.
- Run `npm audit` on a normal network before deploying (see LOW above).
- Security headers are set in `src/server.ts`; if the site is deployed behind
  a host that strips or overrides headers, verify them live on the deployed
  domain (e.g. securityheaders.com).

## 2026-11-18 — Admin redesign, Settings + Blog CMS, Neon/Vercel, SEO content

> Note: the "What remains" paragraph above (no backend auth) is superseded —
> this copy has real server-side admin login (scrypt hash + signed httpOnly
> session cookie + lockout, see `src/lib/admin-auth.server.ts`).

### Orphaned AI/Lovable code removed (again)
- The v2 upload had re-introduced the deleted files; all removed and verified
  with zero grep hits in `src/`: `src/lib/ai/`, `calculator-finder.*`,
  `ai-calculator-finder.tsx`, `lovable-error-reporting.ts`, `error-capture.ts`,
  plus the unused `src/components/ui/chart.tsx` (the old `dangerouslySetInnerHTML`
  site) and the `calculator-finder.test.ts` that tested the deleted code.
- `vite-tsconfig-paths` plugin removed (Vite 8 native `resolve.tsconfigPaths`).
- Audit overrides re-applied (`brace-expansion` 1.1.22, `picomatch` 4.0.7,
  `nanoid` 3.3.20, `js-yaml` 4.3.2, `seroval` 1.8.1, `source-map-js` 1.2.2,
  `zod` 4.6.7, `rolldown` 1.2.1); `vitest` 4.1.12, `typescript-eslint` 8.73.0.
  Unused deps removed: `date-fns` (imported nowhere) and the direct `zod`
  dependency (only the deleted finder used it). Installed versions verified
  directly; re-run `npm audit` on a normal network to confirm 0.

### New server functions are auth-guarded
- `saveSiteSettings`, `listAllPosts`, `getPostForEdit`, `savePost`,
  `deletePost` all call `getAdminSession()` inside the handler and return an
  error when not authenticated. Public functions (`getSiteSettings`,
  `getPublishedPosts`, `getPublishedPost`) read only.
- `DATABASE_URL` is server-only: read only inside `.server.ts` files
  (`src/lib/db.server.ts`), never logged, never returned to the client, never
  in the bundle. `.env` stays gitignored; `.env.example` carries only a
  placeholder.
- The CSP is unchanged (`src/server.ts`) and remains the single source of
  truth — `vercel.json` adds only static-asset headers (`/assets/*`), no CSP.

### Markdown renderer escapes HTML by construction
- `src/lib/markdown.ts` escapes the entire input first (`& < > " '`), then
  converts headings/bold/italic/code/links/lists. `javascript:` links are
  never rendered as links. The one `dangerouslySetInnerHTML` in the codebase
  (blog article + editor preview) renders only this output.
- Blog list endpoints return metadata only (no `content` field); the file
  store strips content for lists and Neon selects without the content column.
- Slugs are validated (`^[a-z0-9-]+$`, max 80) and unique on create; post
  content is capped at 50,000 chars; settings are validated server-side
  (lengths, https URLs, email) in both storage paths.

### Tests
- 91 tests passing (was 39 passing + 2 failed files at baseline): markdown
  safety, settings validation, blog validation + file-store duplicate slug +
  metadata-only list, DB-vs-files storage selection, tool-SEO coverage for
  all 212 tools, admin sidebar routes, extended route matching.
