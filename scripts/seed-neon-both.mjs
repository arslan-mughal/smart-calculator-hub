// seed-neon-both.mjs — seed BOTH Neon databases (dev + production) with one command.
//
// The same script works for every version of the project (v2.6, v2.7, ...):
// it runs whatever db/schema.sql and db/seed-tool-posts.sql are in the
// project folder, so just drop this file into scripts/ and run it.
//
// Usage — PowerShell, from the project folder. Set the two connection
// strings once (a fresh PowerShell window forgets them), then one command:
//
//   $env:DATABASE_URL_DEV="postgresql://user:password@ep-xxx-dev.neon.tech/dbname?sslmode=require"
//   $env:DATABASE_URL_PROD="postgresql://user:password@ep-xxx-prod.neon.tech/dbname?sslmode=require"
//   node scripts/seed-neon-both.mjs
//
// That runs, for each database in turn (dev first, then production):
//   node scripts/seed-neon.mjs db/schema.sql
//   node scripts/seed-neon.mjs
//
// Options:
//   --dry-run        Parse the files without writing anything (no connection
//                    strings needed). Verifies the statement counts.
//   --only=dev      Seed only the dev database.
//   --only=prod     Seed only the production database.
//   --seed-only     Skip the schema step (use when the tables already exist).
//
// The seed upserts (ON CONFLICT DO UPDATE), so re-running is safe — existing
// posts are refreshed, never duplicated. If one database fails, the other
// still runs, and the summary at the end shows which one needs re-running.
// Never paste a connection string into chat or commit it — it is a secret.

import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const seedScript = join(projectRoot, "scripts", "seed-neon.mjs");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const seedOnly = args.includes("--seed-only");
const onlyArg = args.find((a) => a.startsWith("--only="));
const only = onlyArg ? onlyArg.slice("--only=".length) : null;

const usage =
  "\nUsage — PowerShell, from the project folder:\n" +
  '  $env:DATABASE_URL_DEV="postgresql://user:password@ep-xxx-dev.neon.tech/dbname?sslmode=require"\n' +
  '  $env:DATABASE_URL_PROD="postgresql://user:password@ep-xxx-prod.neon.tech/dbname?sslmode=require"\n' +
  "  node scripts/seed-neon-both.mjs\n" +
  "\nOptions: --dry-run (parse only), --only=dev, --only=prod, --seed-only.\n" +
  "Get each connection string from the Neon dashboard > Connect.\n";

if (only && only !== "dev" && only !== "prod") {
  console.error(`\nERROR: --only must be dev or prod, not "${only}".${usage}`);
  process.exit(1);
}

const databases = [
  { name: "dev", label: "Dev", envVar: "DATABASE_URL_DEV", url: process.env.DATABASE_URL_DEV },
  { name: "prod", label: "Production", envVar: "DATABASE_URL_PROD", url: process.env.DATABASE_URL_PROD },
].filter((d) => !only || d.name === only);

// Run seed-neon.mjs as a child process with DATABASE_URL set to one database.
// Returns the child's exit code (0 = success).
function runSeed(scriptArgs, databaseUrl) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [seedScript, ...scriptArgs], {
      cwd: projectRoot,
      env: {
        ...process.env,
        // Dry runs never connect, so a placeholder is fine when no URL is set.
        DATABASE_URL: databaseUrl ?? "postgresql://dry-run@localhost/dry-run",
      },
      stdio: "inherit",
    });
    child.on("error", (err) => {
      console.error(`\nERROR: could not start node: ${err.message}\n`);
      resolve(1);
    });
    child.on("close", (code) => resolve(code ?? 1));
  });
}

const results = [];

for (const db of databases) {
  console.log(`\n===== ${db.label} database =====`);
  if (!db.url && !dryRun) {
    console.log(
      `SKIPPED — ${db.envVar} is not set.\n` +
        `Set it in PowerShell, then re-run. The other database (if set) still runs.\n` +
        usage,
    );
    results.push({ label: db.label, status: "skipped" });
    continue;
  }

  let ok = true;
  if (!seedOnly) {
    const code = await runSeed(["db/schema.sql", ...(dryRun ? ["--dry-run"] : [])], db.url);
    if (code !== 0) ok = false;
  }
  if (ok) {
    const code = await runSeed(dryRun ? ["--dry-run"] : [], db.url);
    if (code !== 0) ok = false;
  }
  results.push({ label: db.label, status: ok ? "done" : "FAILED" });
}

console.log("\n===== Summary =====");
for (const r of results) {
  console.log(`  ${r.label}: ${r.status}`);
}

const failed = results.filter((r) => r.status !== "done");
if (failed.length > 0) {
  console.log(
    "\nNot everything finished. Re-run the command — the seed upserts, so " +
      "completed rows are simply refreshed. If a database was skipped, set its " +
      "connection string first (see usage above).",
  );
  process.exit(1);
}
console.log("\nBoth databases seeded.");
