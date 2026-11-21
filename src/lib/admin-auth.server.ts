// Server-only admin authentication helpers (no database).
// Credentials come from environment variables; sessions are stateless, HMAC-signed
// tokens kept in an httpOnly cookie. Never import this file from client code.
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "calchub_admin";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

export type AdminConfig = { username: string; passwordHash: string; secret: string };

export function readAdminConfig(
  env: Record<string, string | undefined> = process.env,
): AdminConfig | null {
  const username = env["ADMIN_USERNAME"]?.trim();
  const passwordHash = env["ADMIN_PASSWORD_HASH"]?.trim();
  const secret = env["ADMIN_SESSION_SECRET"]?.trim();
  if (!username || !passwordHash || !secret || secret.length < 32) return null;
  return { username, passwordHash, secret };
}

// Stored format: scrypt:<saltHex>:<hashHex> (":" because "$" is expanded in .env files).
export function hashPassword(password: string, salt: Buffer = randomBytes(16)): string {
  const hash = scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  if (expected.length === 0) return false;
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(expected, actual);
}

// Constant-time string comparison (hashes first so lengths always match).
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

const sign = (payload: string, secret: string) =>
  createHmac("sha256", secret).update(payload).digest("base64url");

export function createSessionToken(username: string, secret: string, now = Date.now()): string {
  const payload = Buffer.from(
    JSON.stringify({ u: username, exp: Math.floor(now / 1000) + SESSION_TTL_SECONDS }),
  ).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(
  token: string | undefined,
  secret: string,
  now = Date.now(),
): { username: string } | null {
  if (!token) return null;
  const [payload, signature, ...rest] = token.split(".");
  if (!payload || !signature || rest.length > 0) return null;
  const expected = sign(payload, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      u?: unknown;
      exp?: unknown;
    };
    if (typeof data.u !== "string" || typeof data.exp !== "number") return null;
    if (data.exp * 1000 <= now) return null;
    return { username: data.u };
  } catch {
    return null;
  }
}

// ---- Brute-force protection (in-memory, per client address) ----
const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; lockedUntil: number }>();

export function checkRateLimit(key: string, now = Date.now()): { allowed: boolean; retryAfterSeconds: number } {
  const entry = attempts.get(key);
  if (entry && entry.lockedUntil > now) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000) };
  }
  if (entry && entry.lockedUntil !== 0) attempts.delete(key);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function recordFailure(key: string, now = Date.now()): void {
  if (attempts.size > 1000) attempts.clear();
  const entry = attempts.get(key) ?? { count: 0, lockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= MAX_FAILURES) {
    entry.count = 0;
    entry.lockedUntil = now + LOCK_MS;
  }
  attempts.set(key, entry);
}

export function clearFailures(key: string): void {
  attempts.delete(key);
}

export function resetRateLimitsForTests(): void {
  attempts.clear();
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "local";
}
