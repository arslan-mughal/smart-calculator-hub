// Batch 29 — the "plus" tools: API Tester and DNS Lookup.
//
// Both are custom components (src/components/batch29-fetch-tools.tsx) that
// call the server behind the v2.6 SSRF guards (seo-audit.functions.ts):
// the browser cannot fetch arbitrary URLs itself (CORS), and the server
// fetch is hardened — public addresses only, 10 s timeout, 2 MB cap,
// 20 fetches per client per 5 minutes.
import type { Calc } from "../tool-types";

export const batch29PlusTools: Calc[] = [
  {
    slug: "api-tester",
    name: "API Tester",
    category: "Web & Developer",
    short: "Send a request to any public API and inspect the status and response.",
    keywords:
      "api tester, test api online, rest api tester, api client online, http request tester",
    custom: "api-tester",
    inputs: [
      {
        key: "url",
        label: "Request URL",
        type: "text" as const,
        def: "https://api.github.com/zen",
      },
      {
        key: "method",
        label: "Method",
        type: "select" as const,
        def: "GET",
        options: [
          { v: "GET", l: "GET" },
          { v: "POST", l: "POST" },
          { v: "PUT", l: "PUT" },
          { v: "PATCH", l: "PATCH" },
          { v: "DELETE", l: "DELETE" },
        ],
      },
    ],
    compute: () => [],
    about:
      "Send a request to any public API and inspect the answer: pick a method (GET, POST, PUT, PATCH or DELETE), add headers and a body if you need them, and see the status code, response time, headers and body. It is the quick way to check whether an API is up, whether your request is shaped correctly, and what an endpoint actually returns — without installing a desktop client. Requests go through this site's server with strict safety limits (public addresses only, 10-second timeout, 2 MB cap, request body capped at 100 KB), and nothing is stored.",
    formula: "",
    example:
      "A GET to https://api.github.com/zen returns 200 with a one-line piece of wisdom as the body — a handy endpoint for testing that a request works.",
    howToUse: [
      "Enter the request URL and pick a method.",
      "Add headers (one per line, Name: value) and a body for POST, PUT or PATCH.",
      "Send the request and read the status, time, headers and body.",
    ],
    details: [
      {
        heading: "What the tester sends",
        body: "Exactly the request you describe — method, URL, headers and body — from this site's server, not from your browser (a browser cannot call most APIs directly because of CORS). No cookies or credentials are sent, and the URL must be a public http or https address: private and local addresses are blocked.",
      },
      {
        heading: "Reading the result",
        body: "A 2xx status means the request worked; 4xx means the request was wrong (400 bad request, 401 unauthorised, 404 not found); 5xx means the server had a problem. The response time is the round trip from this site's server, and the body is shown as text (up to 100 KB) — JSON responses are shown as they are, ready to copy.",
      },
    ],
    tips: [
      "Test a GET first — if that fails, the URL or the service is the problem, not your body.",
      "A 401 usually means a missing or wrong Authorization header.",
      "Do not send real passwords or API keys through any online tester.",
    ],
    faqs: [
      {
        q: "What is an API tester?",
        a: "A tool that sends an HTTP request to an API and shows the response: status code, headers and body. It is how developers check that an endpoint works and what it returns.",
      },
      {
        q: "Why does the request go through a server?",
        a: "Browsers block most cross-site requests (CORS), so the request is sent from this site's server instead. No cookies or credentials are attached, and private addresses are blocked.",
      },
      {
        q: "Is it safe to send an API key here?",
        a: "No — never paste a real secret into any online tester. Use a test key, or test against an endpoint that does not need one.",
      },
    ],
  },
  {
    slug: "dns-lookup",
    name: "DNS Lookup",
    category: "Web & Developer",
    short: "Look up DNS records for any domain — A, AAAA, MX, TXT, NS and more.",
    keywords:
      "dns lookup, dns checker, dns records lookup, check dns records, domain dns lookup, mx record lookup",
    custom: "dns-lookup",
    inputs: [
      {
        key: "domain",
        label: "Domain",
        type: "text" as const,
        def: "example.com",
      },
      {
        key: "type",
        label: "Record type",
        type: "select" as const,
        def: "A",
        options: [
          { v: "A", l: "A — IPv4 address" },
          { v: "AAAA", l: "AAAA — IPv6 address" },
          { v: "MX", l: "MX — mail servers" },
          { v: "TXT", l: "TXT — text records" },
          { v: "NS", l: "NS — name servers" },
          { v: "CNAME", l: "CNAME — alias" },
          { v: "SOA", l: "SOA — start of authority" },
        ],
      },
    ],
    compute: () => [],
    about:
      "Look up DNS records for any domain: A records (IPv4 addresses), AAAA (IPv6), MX (mail servers), TXT (verification and policy records), NS (name servers), CNAME (aliases) and SOA (the zone's authority record). The lookup runs over DNS-over-HTTPS against Google's public resolver, so the answer is the live public record. It is the first step in debugging “the site is down” or “email is not arriving” — if the record is wrong or missing here, it is wrong or missing everywhere. Nothing is stored.",
    formula: "",
    example:
      "Looking up example.com's A records returns its IPv4 addresses with their TTLs; its MX records show which servers handle its mail.",
    howToUse: [
      "Type a domain, like example.com.",
      "Pick the record type you need.",
      "Run the lookup — the records, their TTLs and the record type appear below.",
    ],
    details: [
      {
        heading: "What the record types mean",
        body: "A points a name at an IPv4 address; AAAA at an IPv6 address. MX names the servers that accept mail for the domain, in priority order. TXT carries text — SPF, DKIM and domain verification strings live here. NS names the domain's name servers. CNAME makes one name an alias of another. SOA holds the zone's serial number and timers, including how long negative answers are cached.",
      },
      {
        heading: "Why lookups differ",
        body: "DNS answers are cached, so a change you made an hour ago may not show everywhere yet — the TTL on each record says how long it can be cached. Different resolvers can also answer differently during that window. If this tool shows the new record, the change has propagated to public resolvers; if not, wait out the old TTL.",
      },
    ],
    tips: [
      "“No records of this type” usually means the record does not exist, not that the tool failed.",
      "Check MX records first when email stops arriving.",
      "The TTL tells you how long a cached answer can linger after a change.",
    ],
    faqs: [
      {
        q: "What is a DNS lookup?",
        a: "A query of the Domain Name System for a domain's records: which IP address it points to (A/AAAA), which servers handle its mail (MX), and the rest. This tool asks Google's public resolver over HTTPS.",
      },
      {
        q: "Why does my domain show no MX records?",
        a: "Either the domain has no mail set up, or the records were added recently and have not propagated yet. Check the spelling and try again in a few minutes.",
      },
      {
        q: "What is a TTL?",
        a: "Time To Live — how long, in seconds, a resolver may cache an answer. After a DNS change, the old answer can linger for up to the TTL.",
      },
    ],
  },
];
