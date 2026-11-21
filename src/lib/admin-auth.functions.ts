import { createServerFn } from "@tanstack/react-start";
import { deleteCookie, getCookie, getRequest, setCookie } from "@tanstack/react-start/server";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  checkRateLimit,
  clearFailures,
  clientKey,
  createSessionToken,
  readAdminConfig,
  recordFailure,
  safeEqual,
  verifyPassword,
  verifySessionToken,
} from "./admin-auth.server";

export type AdminSession =
  | { authenticated: true; username: string }
  | { authenticated: false; configured: boolean };

export type LoginResult = { ok: true } | { ok: false; error: string };

export const getAdminSession = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminSession> => {
    const config = readAdminConfig();
    if (!config) return { authenticated: false, configured: false };
    const session = verifySessionToken(getCookie(SESSION_COOKIE), config.secret);
    if (!session || !safeEqual(session.username, config.username)) {
      return { authenticated: false, configured: true };
    }
    return { authenticated: true, username: session.username };
  },
);

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((input: { username?: unknown; password?: unknown }) => ({
    username: String(input?.username ?? "").slice(0, 100),
    password: String(input?.password ?? "").slice(0, 200),
  }))
  .handler(async ({ data }): Promise<LoginResult> => {
    const config = readAdminConfig();
    if (!config) {
      return {
        ok: false,
        error:
          "Admin login is not configured. Set ADMIN_USERNAME, ADMIN_PASSWORD_HASH and ADMIN_SESSION_SECRET in .env (see .env.example).",
      };
    }

    const key = clientKey(getRequest());
    const limit = checkRateLimit(key);
    if (!limit.allowed) {
      const minutes = Math.ceil(limit.retryAfterSeconds / 60);
      return { ok: false, error: `Too many failed attempts. Try again in ${minutes} minute(s).` };
    }

    // Always evaluate both checks so timing doesn't reveal which one failed.
    const userOk = safeEqual(data.username, config.username);
    const passOk = verifyPassword(data.password, config.passwordHash);
    if (!(userOk && passOk)) {
      recordFailure(key);
      await new Promise((resolve) => setTimeout(resolve, 400));
      return { ok: false, error: "Incorrect username or password." };
    }

    clearFailures(key);
    setCookie(SESSION_COOKIE, createSessionToken(config.username, config.secret), {
      httpOnly: true,
      sameSite: "strict",
      secure: import.meta.env.PROD,
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
    return { ok: true };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  deleteCookie(SESSION_COOKIE, { path: "/" });
  return { ok: true as const };
});
