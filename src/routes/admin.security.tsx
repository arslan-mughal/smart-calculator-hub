import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Circle, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { SECURITY_CHECKS, checkBadgeLabel, type CheckResult } from "@/lib/admin-checks";
import { Button } from "@/components/ui/button";
import { AdminShell } from "@/components/admin-shell";
import { settingsFromMatches } from "@/lib/seo";
import { getAdminSession } from "@/lib/admin-auth.functions";

export const Route = createFileRoute("/admin/security")({
  beforeLoad: async () => {
    const session = await getAdminSession();
    if (!session.authenticated) throw redirect({ to: "/admin/login" });
    return { username: session.username };
  },
  head: ({ matches }) => {
    const settings = settingsFromMatches(
      matches as unknown as { routeId?: string; loaderData?: unknown }[],
      "/admin",
    );
    return {
    meta: [
      { title: `Security — ${settings.siteName} Admin` },
      { name: "robots", content: "noindex, nofollow" },
    ],
    };
  },
  component: SecurityPage,
});

const BADGE_STYLES: Record<ReturnType<typeof checkBadgeLabel>, string> = {
  Passed: "border-[#00a32a]/40 bg-[#edfaef] text-[#007017]",
  Failed: "border-[#d63638]/40 bg-[#fcf0f1] text-[#b32d2e]",
  Server: "border-[#2271b1]/40 bg-[#f0f6fc] text-[#135e96]",
  "Not run": "border-[#c3c4c7] bg-[#f6f7f7] text-[#50575e]",
};

function ResultIcon({ result }: { result: CheckResult | undefined }) {
  if (result === undefined) return <Circle className="mt-0.5 size-5 shrink-0 text-[#8c8f94]" aria-label="Not run" />;
  if (result === false) return <XCircle className="mt-0.5 size-5 shrink-0 text-[#d63638]" aria-label="Failed" />;
  // true and "server" both count as passed (server checks are verified from a live response).
  return <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#00a32a]" aria-label="Passed" />;
}

function SecurityPage() {
  const { username } = Route.useRouteContext();
  const [checkResults, setCheckResults] = useState<Record<string, CheckResult> | null>(null);
  const [checksRunAt, setChecksRunAt] = useState<string | null>(null);

  function runChecks() {
    const results: Record<string, CheckResult> = {};
    for (const c of SECURITY_CHECKS) {
      try { results[c.id] = c.run(); } catch { results[c.id] = false; }
    }
    setCheckResults(results);
    setChecksRunAt(new Date().toLocaleTimeString());
  }

  const passedCount = checkResults ? Object.values(checkResults).filter((v) => v === true || v === "server").length : SECURITY_CHECKS.length;

  return (
    <AdminShell username={username}>
    <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
      <h1 className="flex items-center gap-2 text-[23px] font-normal leading-8 text-[#1d2327]">
        <ShieldCheck className="size-5 text-[#2271b1]" /> Security
      </h1>
      <p className="mt-1 max-w-2xl text-[13px] text-[#50575e]">
        Fixes applied in the November 2026 security pass. See SECURITY-FIXES.md for the full list.
      </p>

      <div className="mt-5 border border-[#c3c4c7] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c3c4c7] px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-[#1d2327]">Security checks</h2>
            <p className="text-[13px] text-[#50575e]">{SECURITY_CHECKS.length} checks. Browser checks run here; server checks are verified from a live response.</p>
          </div>
          <Button size="sm" onClick={runChecks}><RefreshCw className="size-4" /> Run checks</Button>
        </div>
        <div className="px-4 py-4">
          {checksRunAt && <p className="mb-3 text-xs text-[#50575e]">Last run: {checksRunAt} — {passedCount}/{SECURITY_CHECKS.length} passed (server header check is verified from a live response, not the browser).</p>}
          <ul className="space-y-3">
            {SECURITY_CHECKS.map((c) => {
              const result = checkResults?.[c.id];
              const label = checkBadgeLabel(result);
              return (
                <li key={c.id} className="flex items-start gap-3 border border-[#dcdcde] bg-white px-4 py-3">
                  <ResultIcon result={result} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#1d2327]">
                      {c.name}
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${BADGE_STYLES[label]}`}>{label}</span>
                    </div>
                    <p className="mt-1 text-[13px] text-[#50575e]">{c.description}</p>
                    <p className="mt-1 font-mono text-xs text-[#50575e]">{c.file}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
    </AdminShell>
  );
}
