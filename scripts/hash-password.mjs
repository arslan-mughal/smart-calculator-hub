#!/usr/bin/env node
// Usage: node scripts/hash-password.mjs "your password"
// Prints the ADMIN_PASSWORD_HASH value and a fresh ADMIN_SESSION_SECRET for your .env file.
import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];
if (!password || password.length < 10) {
  console.error('Usage: node scripts/hash-password.mjs "<password of at least 10 characters>"');
  process.exit(1);
}
const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64);
console.log(`ADMIN_PASSWORD_HASH=scrypt:${salt.toString("hex")}:${hash.toString("hex")}`);
console.log(`ADMIN_SESSION_SECRET=${randomBytes(48).toString("base64url")}`);
