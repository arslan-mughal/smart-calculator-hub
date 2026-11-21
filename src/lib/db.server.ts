// Server-only Neon Postgres client (HTTP driver — no persistent connection,
// so it works on Vercel serverless functions). Never import this file from
// client code, never log DATABASE_URL, and never return it to the client.
//
// Storage model: when DATABASE_URL is set, settings and blog posts live in
// Neon; when it is not set, the app uses the local content/*.json files
// (dev-only fallback — the Vercel filesystem is ephemeral, so DATABASE_URL
// is required there). This module is the single decision point: every
// storage module asks isDbConfigured() / getDb() and nothing else reads
// process.env.DATABASE_URL.
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export type DbClient = NeonQueryFunction<false, false>;

/** True when a Neon connection string is configured. No I/O, no throw. */
export function isDbConfigured(): boolean {
  return Boolean(process.env["DATABASE_URL"]?.trim());
}

/** The active store, for the admin badge. */
export function storageKind(): "database" | "files" {
  return isDbConfigured() ? "database" : "files";
}

let client: DbClient | null = null;

/**
 * Lazily created Neon client, or null when DATABASE_URL is unset.
 * Never throws at import time and never throws when unset; a malformed URL
 * only fails when a query is actually attempted.
 */
export function getDb(): DbClient | null {
  const url = process.env["DATABASE_URL"]?.trim();
  if (!url) return null;
  if (!client) client = neon(url);
  return client;
}

/** Test helper: drop the cached client so a changed DATABASE_URL is picked up. */
export function resetDbForTests(): void {
  client = null;
}
