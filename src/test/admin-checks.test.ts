import { describe, expect, it } from "vitest";
import { SECURITY_CHECKS, checkBadgeLabel } from "@/lib/admin-checks";

// Regression test for the Security page bug: the badge hard-coded "Passed"
// for every non-server result, so a failed check showed a red cross next to
// a "Passed" badge. The label must always match the result.
describe("checkBadgeLabel", () => {
  it("says Passed for true, Failed for false", () => {
    expect(checkBadgeLabel(true)).toBe("Passed");
    expect(checkBadgeLabel(false)).toBe("Failed");
  });

  it("says Server for server-side checks", () => {
    expect(checkBadgeLabel("server")).toBe("Server");
  });

  it("says Not run before the checks have run", () => {
    expect(checkBadgeLabel(undefined)).toBe("Not run");
  });
});

describe("SECURITY_CHECKS", () => {
  it("has the expected 8 checks", () => {
    expect(SECURITY_CHECKS.map((c) => c.id)).toEqual([
      "crypto-password",
      "crypto-uuid",
      "local-finder",
      "no-external-scripts",
      "regex-caps",
      "headers",
      "admin-auth",
      "no-secrets",
    ]);
  });

  // The headline the user sees after "Run checks": every check must pass
  // (true) or be a server-side check verified from a live response.
  it.each(SECURITY_CHECKS.map((c) => [c.id, c] as const))(
    "%s passes or is server-side",
    (_id, check) => {
      const result = check.run();
      expect(result === true || result === "server").toBe(true);
    },
  );
});
