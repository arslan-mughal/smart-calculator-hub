// Pure parsers for RDAP (WHOIS over HTTPS) and DNS-over-HTTPS responses.
// The fetch itself lives in seo-audit.server.ts behind the SSRF guards;
// these functions only turn a response body into displayable fields.
// When a registry has no data, the result says so — never invented.

export type RdapInfo = {
  domain: string;
  registered: string | null;
  expires: string | null;
  registrar: string | null;
  nameservers: string[];
  status: string[];
  registrant: string | null;
};

function eventDate(entities: unknown, action: string): string | null {
  if (!Array.isArray(entities)) return null;
  for (const e of entities as { eventAction?: string; eventDate?: string }[]) {
    if (e.eventAction === action && typeof e.eventDate === "string") return e.eventDate;
  }
  return null;
}

/** Parse an RDAP JSON body (https://rdap.org/domain/<domain>). */
export function parseRdap(body: string): RdapInfo | null {
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return null;
  }
  if (typeof json.ldhName !== "string") return null;
  let registrar: string | null = null;
  let registrant: string | null = null;
  const entities = json.entities as { roles?: string[]; vcardArray?: unknown }[] | undefined;
  if (Array.isArray(entities)) {
    for (const ent of entities) {
      const roles = ent.roles ?? [];
      if (roles.includes("registrar") && Array.isArray(ent.vcardArray)) {
        const vcard = ent.vcardArray[1] as [string, Record<string, unknown>, string, string?][] | undefined;
        if (Array.isArray(vcard)) {
          for (const [name, _params, _type, value] of vcard) {
            if (name === "fn" && typeof value === "string") registrar = value;
          }
        }
      }
      if (roles.includes("registrant") && Array.isArray(ent.vcardArray)) {
        const vcard = ent.vcardArray[1] as [string, Record<string, unknown>, string, string?][] | undefined;
        if (Array.isArray(vcard)) {
          for (const [name, _params, _type, value] of vcard) {
            if (name === "fn" && typeof value === "string") registrant = value;
          }
        }
      }
    }
  }
  const nameservers: string[] = [];
  const ns = json.nameservers as { ldhName?: string }[] | undefined;
  if (Array.isArray(ns)) {
    for (const n of ns) if (typeof n.ldhName === "string") nameservers.push(n.ldhName);
  }
  const status = Array.isArray(json.status) ? (json.status as string[]).filter((s) => typeof s === "string") : [];
  return {
    domain: json.ldhName,
    registered: eventDate(json.events, "registration"),
    expires: eventDate(json.events, "expiration"),
    registrar,
    nameservers,
    status,
    registrant,
  };
}

/** Age of a domain from its RDAP registration date. */
export function domainAge(registeredIso: string, now = new Date()): { years: number; months: number; days: number } | null {
  const start = new Date(registeredIso);
  if (Number.isNaN(start.getTime()) || start.getTime() > now.getTime()) return null;
  let years = now.getUTCFullYear() - start.getUTCFullYear();
  let months = now.getUTCMonth() - start.getUTCMonth();
  let days = now.getUTCDate() - start.getUTCDate();
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
    days += prevMonth.getUTCDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

export function formatAge(age: { years: number; months: number; days: number }): string {
  const parts: string[] = [];
  if (age.years > 0) parts.push(`${age.years} year${age.years === 1 ? "" : "s"}`);
  if (age.months > 0) parts.push(`${age.months} month${age.months === 1 ? "" : "s"}`);
  if (parts.length === 0 || age.days > 0) parts.push(`${age.days} day${age.days === 1 ? "" : "s"}`);
  return parts.join(", ");
}
