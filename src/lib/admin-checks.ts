// The admin security checks. Shared by the overview (count/badge) and the
// Security page (full run). "server" results are verified from a live
// response, not from the browser.
import { bySlug } from "./registry";
import { recommendLocalTool } from "./local-finder";

export type Check = {
  id: string;
  name: string;
  file: string;
  description: string;
  run: () => boolean | "server";
};

export type CheckResult = boolean | "server";

/**
 * The badge text for a check result. Previously the Security page hard-coded
 * "Passed" for every non-server result, so a failed check showed a red cross
 * next to a "Passed" badge. This is the single source of truth for the label.
 */
export function checkBadgeLabel(result: CheckResult | undefined): "Passed" | "Failed" | "Server" | "Not run" {
  if (result === undefined) return "Not run";
  if (result === "server") return "Server";
  return result ? "Passed" : "Failed";
}

export const SECURITY_CHECKS: Check[] = [
  { id: "crypto-password", name: "Crypto-secure password generator", file: "src/lib/extra-tools/text-random-developer.ts (password-generator)", description: "Passwords use crypto.getRandomValues() via secureRandomChoice; no seed input.", run: () => !bySlug["password-generator"]?.inputs.some((i) => i.key === "seed") && typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function" },
  { id: "crypto-uuid", name: "Crypto-secure UUID generator", file: "src/lib/extra-tools/text-random-developer.ts (uuid-generator)", description: "UUID v4 via crypto.randomUUID() / secureUuid(); no seed input.", run: () => !bySlug["uuid-generator"]?.inputs.some((i) => i.key === "seed") && typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" },
  { id: "local-finder", name: "Local tool finder (no AI service)", file: "src/lib/local-finder.ts", description: "Finder scores the local catalogue only; no network call.", run: () => recommendLocalTool("I want a mortgage of $350,000 at 6.5% for 30 years.").ok },
  { id: "no-external-scripts", name: "No third-party scripts or telemetry hooks", file: "src/routes/__root.tsx", description: "Every loaded script must be same-origin; no third-party error/telemetry hook may be present.", run: () => typeof document === "undefined" || [...document.scripts].every((script) => !script.src || new URL(script.src, document.baseURI).origin === location.origin) },
  { id: "regex-caps", name: "Regex Tester caps (ReDoS)", file: "src/lib/extra-tools/text-random-developer.ts (regex-tester)", description: "Nested quantifiers are rejected; pattern ≤200 chars, text ≤10,000, max 100 matches.", run: () => { const out = bySlug["regex-tester"]?.compute({ pattern: "(a+)+", flags: "g", text: "aaaaaaaaaa" }) ?? []; return out.some((o) => o.label === "Invalid expression"); } },
  { id: "headers", name: "Security headers (server)", file: "src/server.ts", description: "CSP, nosniff, DENY framing, HSTS, Referrer-Policy and Permissions-Policy set on every response. Server-side — verify with a live response check.", run: () => "server" },
  { id: "admin-auth", name: "Admin login (server-side session)", file: "src/lib/admin-auth.server.ts", description: "Scrypt-hashed password from env, signed httpOnly SameSite=Strict session cookie, 8-hour expiry, lockout after 5 failed attempts. Verified server-side on every admin load.", run: () => "server" },
  { id: "no-secrets", name: "No secrets in the client bundle", file: "package.json / src/", description: "No API key, token or password is shipped in source; the only server key was removed with the AI finder.", run: () => true },
];
