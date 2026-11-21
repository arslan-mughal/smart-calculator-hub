// Pure parser for DNS-over-HTTPS responses (dns.google/resolve JSON).
// The fetch lives in seo-audit.server.ts behind the SSRF guards.

export const DNS_TYPES: Record<string, number> = {
  A: 1,
  AAAA: 28,
  CNAME: 5,
  MX: 15,
  NS: 2,
  SOA: 6,
  TXT: 16,
};

export const DNS_TYPE_NAMES: Record<number, string> = {
  1: "A",
  28: "AAAA",
  5: "CNAME",
  15: "MX",
  2: "NS",
  6: "SOA",
  16: "TXT",
};

export type DnsRecord = { name: string; type: string; ttl: number; data: string };

export type DnsResult =
  | { ok: true; records: DnsRecord[]; authoritative: boolean }
  | { ok: false; error: string };

/** dns.google Status codes: 0 NOERROR, 1 FORMERR, 2 SERVFAIL, 3 NXDOMAIN, 5 REFUSED. */
export function parseDohResponse(body: string): DnsResult {
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return { ok: false, error: "The DNS server returned an unreadable response." };
  }
  const status = json.Status;
  if (status === 3) return { ok: false, error: "Domain does not exist (NXDOMAIN) — no records found." };
  if (status === 2) return { ok: false, error: "The DNS server failed to answer (SERVFAIL) — try again later." };
  if (status === 5) return { ok: false, error: "The DNS query was refused — check the domain and try again." };
  if (status !== 0) return { ok: false, error: `The DNS server answered with status ${String(status)}.` };
  const answers = json.Answer as { name?: string; type?: number; TTL?: number; data?: string }[] | undefined;
  if (!Array.isArray(answers) || answers.length === 0) {
    return { ok: false, error: "No records of this type exist for the domain." };
  }
  return {
    ok: true,
    records: answers.map((a) => ({
      name: typeof a.name === "string" ? a.name : "",
      type: DNS_TYPE_NAMES[a.type ?? 0] ?? `TYPE${String(a.type ?? "?")}`,
      ttl: typeof a.TTL === "number" ? a.TTL : 0,
      data: typeof a.data === "string" ? a.data : "",
    })),
    authoritative: json.AD === true,
  };
}

/** Validate a domain name before any lookup (letters, digits, hyphens, dots). */
export function isValidDomain(value: string): boolean {
  const domain = value.trim().toLowerCase();
  if (domain.length === 0 || domain.length > 253) return false;
  if (domain.startsWith("http://") || domain.startsWith("https://") || domain.includes("/")) return false;
  return /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))*$/.test(domain) && domain.includes(".");
}
