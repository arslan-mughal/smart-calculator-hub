// Hashing via the Web Crypto API (async). Runs entirely in the browser;
// the text never leaves the device. Throws when Web Crypto is unavailable
// (non-secure contexts), so callers must handle that case.
// SHA-1 is included for checksums and legacy verification only — it is
// broken for security use and must never be used for passwords.

export type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-512";

export async function hashHex(text: string, algorithm: HashAlgorithm): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("Web Crypto is not available in this browser");
  const digest = await subtle.digest(algorithm, new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashBase64(text: string, algorithm: HashAlgorithm): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("Web Crypto is not available in this browser");
  const digest = await subtle.digest(algorithm, new TextEncoder().encode(text));
  const bytes = new Uint8Array(digest);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}
