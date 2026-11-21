// seed-neon.mjs — run a whole SQL file against Neon without psql.
//
// The Neon SQL Editor cannot paste the 633 KB+ seed file, and psql needs a
// separate install on Windows. This script uses the project's own
// @neondatabase/serverless driver instead, so `node` is the only tool needed.
// It runs the file statement-by-statement (in order) and verifies the result.
//
// Usage — PowerShell, from the project folder:
//
//   $env:DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require"
//   node scripts/seed-neon.mjs                    # runs db/seed-tool-posts.sql
//   node scripts/seed-neon.mjs db/schema.sql      # runs a different file
//   node scripts/seed-neon.mjs --dry-run          # parse only, writes nothing
//
// Two databases (dev + production): set DATABASE_URL to the dev connection
// string, run the script, then set it to the production connection string
// and run it again. The seed upserts (ON CONFLICT DO UPDATE), so re-running
// is safe — existing posts are refreshed, never duplicated.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const fileArg = args.find((a) => !a.startsWith("--"));
const filePath = resolve(process.cwd(), fileArg ?? "db/seed-tool-posts.sql");

function fail(message) {
  console.error(`\nERROR: ${message}\n`);
  process.exit(1);
}

// Split SQL into statements. Quote-aware: semicolons inside single-quoted
// strings (blog content is full of them) must not split a statement.
// Handles '' escapes, -- line comments and /* */ block comments.
function splitStatements(text) {
  const statements = [];
  let current = "";
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1] ?? "";

    if (inLineComment) {
      if (ch === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (inString) {
      current += ch;
      if (ch === "'") {
        if (next === "'") {
          current += next;
          i++;
        } else {
          inString = false;
        }
      }
      continue;
    }
    if (ch === "-" && next === "-") {
      inLineComment = true;
      i++;
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlockComment = true;
      i++;
      continue;
    }
    if (ch === "'") {
      inString = true;
      current += ch;
      continue;
    }
    if (ch === ";") {
      const stmt = current.trim();
      if (stmt) statements.push(stmt);
      current = "";
      continue;
    }
    current += ch;
  }

  const tail = current.trim();
  if (tail) statements.push(tail);
  if (inString) fail("Unterminated string literal — the SQL file looks truncated.");
  return statements;
}

let raw;
try {
  raw = readFileSync(filePath, "utf8");
} catch {
  fail(`Cannot read ${filePath}. Run this from the project folder.`);
}

const statements = splitStatements(raw);
console.log(`\n${filePath}\n${statements.length} statements found.`);

if (dryRun) {
  console.log("Dry run — nothing was sent to the database.");
  console.log(`First: ${statements[0]?.slice(0, 80)}…`);
  console.log(`Last:  ${statements.at(-1)?.slice(0, 80)}…`);
  process.exit(0);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  fail(
    "DATABASE_URL is not set.\n" +
      'PowerShell: $env:DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require"\n' +
      "Get the connection string from your Neon dashboard > Connect.",
  );
}
if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
  fail("DATABASE_URL does not look like a Postgres connection string.");
}

const sql = neon(databaseUrl);
const started = Date.now();
for (let i = 0; i < statements.length; i++) {
  try {
    await sql.query(statements[i]);
  } catch (error) {
    fail(
      `Statement ${i + 1} of ${statements.length} failed:\n` +
        `${statements[i].slice(0, 160)}…\n` +
        `${error.message}\n` +
        "Statements before this one already ran. Fix the error and re-run — the seed upserts, so completed rows are simply refreshed.",
    );
  }
  if ((i + 1) % 25 === 0 || i === statements.length - 1) {
    console.log(`  ${i + 1}/${statements.length} done`);
  }
}

// Verification: only meaningful for the blog seed, harmless otherwise.
try {
  const rows = await sql.query(
    "SELECT count(*) AS total_posts, count(*) FILTER (WHERE status = 'published') AS published FROM blog_posts",
  );
  const { total_posts, published } = rows[0];
  console.log(`\nDone in ${((Date.now() - started) / 1000).toFixed(1)}s.`);
  console.log(`blog_posts: total ${total_posts}, published ${published}.`);
  if (filePath.endsWith("seed-tool-posts.sql") && Number(total_posts) !== 322) {
    console.log("Expected 322 — if lower, check the error above or re-run the script.");
  }
} catch {
  console.log(`\nDone in ${((Date.now() - started) / 1000).toFixed(1)}s. (No blog_posts table to verify — expected for schema-only runs.)`);
}
