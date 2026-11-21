# Security Policy

## Scope

CalcHub is a static, client-side tool site: 212 free calculators, converters and
utilities. There is no visitor account system, no database and no third-party AI
service; the only authenticated area is the single-user admin login. All calculations run in the visitor's browser.

## What is protected

- **Passwords and UUIDs** are generated with Web Crypto (`crypto.getRandomValues()`
  / `crypto.randomUUID()`). They are never sent to a server.
- **Calculator entries** stay in the browser and are not stored by the site.
- **The tool finder** (`src/lib/local-finder.ts`) scores the local catalogue
  on the device — no network request.
- **Images and QR codes** are processed locally; object URLs are revoked.
- **Responses** carry CSP, `X-Frame-Options: DENY`, `nosniff`, HSTS,
  `Referrer-Policy` and `Permissions-Policy` headers (see `src/server.ts`).

## What is NOT protected

- **The admin dashboard (`/admin`) is protected by a single-user login**
  (credentials from environment variables, scrypt-hashed password, signed
  httpOnly session cookie, lockout after 5 failures). It has no database and no
  multi-user roles or password reset; rotate `ADMIN_SESSION_SECRET` to sign
  everyone out. Its usage analytics are only what is stored in the admin's own
  browser.
- **Results are estimates** for informational use, not professional financial,
  medical or legal advice.
- **The JWT decoder** decodes locally and never verifies a signature.
  Decoding is not authentication — never paste a real production token.

## Reporting a vulnerability

If you find a security issue, do not open a public issue with exploit details.
Contact the site owner privately with a description, the affected page/tool
and steps to reproduce. Please allow reasonable time for a fix before any
public disclosure.
