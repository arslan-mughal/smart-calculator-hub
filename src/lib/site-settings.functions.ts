import { createServerFn } from "@tanstack/react-start";
import { getAdminSession } from "./admin-auth.functions";
import { readSettings, writeSettings } from "./site-settings.server";
import { storageKind } from "./db.server";
import { validateSiteSettings, type SiteSettings } from "./site-settings";

export type SettingsResponse = { settings: SiteSettings; store: "database" | "files" };

/** Public data — no auth needed. */
export const getSiteSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<SettingsResponse> => ({
    settings: await readSettings(),
    store: storageKind(),
  }),
);

/** Which store is active (database vs local files). No auth needed — it reveals nothing sensitive. */
export const getStorageStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ store: "database" | "files" }> => ({ store: storageKind() }),
);

export type SaveSettingsResult =
  | { ok: true; settings: SiteSettings; store: "database" | "files" }
  | { ok: false; error: string };

export const saveSiteSettings = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => input)
  .handler(async ({ data }): Promise<SaveSettingsResult> => {
    const session = await getAdminSession();
    if (!session.authenticated) return { ok: false, error: "Sign in as admin first." };
    const result = validateSiteSettings(data);
    if (!result.ok) return { ok: false, error: result.errors.join(" ") };
    try {
      const settings = await writeSettings(result.settings);
      return { ok: true, settings, store: storageKind() };
    } catch {
      return {
        ok: false,
        error:
          storageKind() === "database"
            ? "Could not save to the database. Check DATABASE_URL and that db/schema.sql has been applied."
            : "Could not save the settings file.",
      };
    }
  });
