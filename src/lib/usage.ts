// Local-only usage analytics. Stored in THIS browser only, never sent anywhere.
// Capped at 500 entries; all access is wrapped in try/catch (private mode may throw).
export const USAGE_KEY = "calchub-usage-v1";
export const MAX_USAGE_ENTRIES = 500;

export type UsageEntry = { slug: string; at: number };

export function recordToolVisit(slug: string): void {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    const entries: UsageEntry[] = raw ? (JSON.parse(raw) as UsageEntry[]) : [];
    entries.push({ slug, at: Date.now() });
    localStorage.setItem(USAGE_KEY, JSON.stringify(entries.slice(-MAX_USAGE_ENTRIES)));
  } catch {
    // Storage unavailable (private mode, disabled cookies) — ignore silently.
  }
}

export function readUsage(): UsageEntry[] {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (!raw) return [];
    const entries = JSON.parse(raw) as UsageEntry[];
    return Array.isArray(entries) ? entries.filter((e) => e && typeof e.slug === "string") : [];
  } catch {
    return [];
  }
}

export function clearUsage(): void {
  try {
    localStorage.removeItem(USAGE_KEY);
  } catch {
    // ignore
  }
}
