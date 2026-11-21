// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import {
  SESSION_TTL_SECONDS,
  checkRateLimit,
  createSessionToken,
  hashPassword,
  readAdminConfig,
  recordFailure,
  resetRateLimitsForTests,
  safeEqual,
  verifyPassword,
  verifySessionToken,
} from "@/lib/admin-auth.server";

const SECRET = "x".repeat(40);

describe("admin password hashing", () => {
  it("verifies the right password and rejects wrong ones", () => {
    const stored = hashPassword("correct horse battery");
    expect(verifyPassword("correct horse battery", stored)).toBe(true);
    expect(verifyPassword("wrong", stored)).toBe(false);
    expect(verifyPassword("x", "garbage")).toBe(false);
  });
  it("salts every hash", () => {
    expect(hashPassword("same")).not.toBe(hashPassword("same"));
  });
  it("compares strings in constant time helper", () => {
    expect(safeEqual("admin", "admin")).toBe(true);
    expect(safeEqual("admin", "Admin")).toBe(false);
  });
});

describe("admin session tokens", () => {
  it("round-trips a valid token", () => {
    expect(verifySessionToken(createSessionToken("admin", SECRET), SECRET)).toEqual({ username: "admin" });
  });
  it("rejects tampering, wrong secret, expiry and missing tokens", () => {
    const now = Date.now();
    const token = createSessionToken("admin", SECRET, now);
    const [payload, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ u: "root", exp: 9999999999 })).toString("base64url");
    expect(verifySessionToken(`${forged}.${sig}`, SECRET)).toBeNull();
    expect(verifySessionToken(`${payload}.bad`, SECRET)).toBeNull();
    expect(verifySessionToken(token, "y".repeat(40))).toBeNull();
    expect(verifySessionToken(token, SECRET, now + (SESSION_TTL_SECONDS + 1) * 1000)).toBeNull();
    expect(verifySessionToken(undefined, SECRET)).toBeNull();
  });
});

describe("admin config and rate limiting", () => {
  beforeEach(resetRateLimitsForTests);
  it("requires all variables and a long secret", () => {
    expect(readAdminConfig({})).toBeNull();
    expect(readAdminConfig({ ADMIN_USERNAME: "a", ADMIN_PASSWORD_HASH: "h", ADMIN_SESSION_SECRET: "short" })).toBeNull();
    expect(readAdminConfig({ ADMIN_USERNAME: "a", ADMIN_PASSWORD_HASH: "h", ADMIN_SESSION_SECRET: SECRET })).not.toBeNull();
  });
  it("locks after five failures then unlocks", () => {
    const t = 1_000_000;
    for (let i = 0; i < 5; i++) recordFailure("ip", t);
    expect(checkRateLimit("ip", t + 1000).allowed).toBe(false);
    expect(checkRateLimit("ip", t + 16 * 60 * 1000).allowed).toBe(true);
    expect(checkRateLimit("other", t).allowed).toBe(true);
  });
});
