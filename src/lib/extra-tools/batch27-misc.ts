// Batch 27 — time & hash & featured tools: Unix time converter,
// add business days, SHA-1, SHA-512, sun/moon/rising sign.
// SHA-1 is deprecated for security — for checksums and legacy use only.
import type { Calc } from "../tool-types";
import { N, numberInput, selectInput, textArea, textInput } from "./shared";
import { moonPhase, moonSign, risingSign, sunSign, SIGN_RANGES } from "../zodiac";

/** "2026-11-20" → Date at local midnight (same convention as the registry). */
const parseDate = (value: string): Date => new Date(`${String(value ?? "").trim()}T00:00:00`);

const longDate = (d: Date): string =>
  Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

/** Format a Unix epoch (seconds) as an ISO string in UTC. */
const isoUtc = (seconds: number): string => new Date(seconds * 1000).toISOString();

/** "08:30" → [hour, minute], or null. */
function parseClock(value: string): [number, number] | null {
  const match = String(value ?? "").trim().match(/^(\d{1,2}):(\d{2})\s*([ap]m)?$/i);
  if (!match) return null;
  let h = Number(match[1]);
  const min = Number(match[2]!);
  const ap = match[3]?.toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return [h, min];
}

export const batch27MiscTools: Calc[] = [
  {
    slug: "unix-time-converter",
    name: "Unix Time Converter",
    category: "Date & Time",
    short: "Convert Unix timestamps to dates and back — plus the current time.",
    keywords:
      "unix time converter, unix timestamp converter, epoch converter, timestamp to date, epoch time converter",
    // The "current time" mode reads the clock, so the server render and
    // the client render differ — results are deferred until after mount.
    clientOnly: true,
    inputs: [
      selectInput("mode", "Convert", "toDate", [
        ["toDate", "Unix timestamp → date"],
        ["toUnix", "Date → Unix timestamp"],
        ["now", "Current Unix time"],
      ]),
      textInput("ts", "Unix timestamp (seconds)", "1700000000"),
      textInput("date", "Date (e.g. 2023-11-14T22:13:20Z)", "2023-11-14T22:13:20Z"),
    ],
    compute: (v) => {
      const mode = String(v.mode ?? "toDate");
      if (mode === "now") {
        const nowMs = Date.now();
        const seconds = Math.floor(nowMs / 1000);
        return [
          { label: "Current Unix timestamp", value: String(seconds) },
          { label: "Milliseconds", value: String(nowMs) },
          { label: "UTC date", value: isoUtc(seconds) },
        ];
      }
      if (mode === "toUnix") {
        const ms = Date.parse(String(v.date ?? ""));
        if (!Number.isFinite(ms)) {
          return [{ label: "Unix timestamp", value: "Enter a valid date, e.g. 2023-11-14T22:13:20Z" }];
        }
        return [
          { label: "Unix timestamp", value: String(Math.floor(ms / 1000)) },
          { label: "Milliseconds", value: String(ms) },
          { label: "UTC date", value: new Date(ms).toISOString() },
        ];
      }
      const raw = N(v.ts);
      if (!Number.isFinite(raw)) {
        return [{ label: "Date", value: "Enter a Unix timestamp in seconds" }];
      }
      // A 13-digit value is milliseconds, not seconds.
      const seconds = Math.abs(raw) > 1e12 ? Math.floor(raw / 1000) : Math.floor(raw);
      const date = new Date(seconds * 1000);
      return [
        { label: "UTC date", value: isoUtc(seconds) },
        {
          label: "Readable (UTC)",
          value: date.toLocaleString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZone: "UTC",
            timeZoneName: "short",
          }),
        },
        { label: "Unix timestamp", value: String(seconds) },
        { label: "Milliseconds", value: String(seconds * 1000) },
      ];
    },
    about:
      "Convert between Unix timestamps — the number of seconds since 1 January 1970 (UTC) — and human-readable dates. Programmers meet timestamps everywhere: in APIs, databases, log files and JWTs. Paste a timestamp to see the date, paste a date to get the timestamp, or read the current Unix time. A 13-digit value is treated as milliseconds, which is what JavaScript's Date.now() returns.",
    formula:
      "Unix timestamp = seconds since 1970-01-01T00:00:00Z. Date = 1970-01-01T00:00:00Z + timestamp seconds. For example, 1700000000 is 2023-11-14T22:13:20Z.",
    example:
      "The timestamp 1700000000 is Tuesday, November 14, 2023 at 10:13:20 PM UTC. The same date in milliseconds is 1700000000000.",
    howToUse: [
      "Choose the direction: timestamp to date, date to timestamp, or the current time.",
      "Enter the timestamp (seconds — a 13-digit value is read as milliseconds) or the date.",
      "Read the converted value in UTC.",
    ],
    details: [
      {
        heading: "Seconds or milliseconds?",
        body: "Unix time is traditionally seconds — 1700000000 is 10 digits. JavaScript's Date.now() returns milliseconds — 1700000000000, 13 digits. Mixing them up is one of the most common bugs in programming: a milliseconds value read as seconds points to the year 55,000. This converter detects 13-digit values and treats them as milliseconds automatically.",
      },
      {
        heading: "Why 1970?",
        body: "Unix time counts from 1 January 1970, the “epoch” chosen when Unix was built. It is the same everywhere in the world — a timestamp means the same instant in every time zone, which is why servers store it and only convert to local time for display. The 32-bit version of Unix time runs out in 2038, but modern systems use 64-bit timestamps, which last effectively forever.",
      },
    ],
    tips: [
      "13-digit values are milliseconds — the converter handles both.",
      "Timestamps are always UTC; convert to local time only for display.",
      "The “current time” mode updates every time the page loads.",
    ],
    faqs: [
      {
        q: "What is Unix time?",
        a: "The number of seconds since 1 January 1970, 00:00:00 UTC. It is the standard way computers store a moment in time, because it means the same instant in every time zone.",
      },
      {
        q: "What is the current Unix timestamp?",
        a: "Use the “Current Unix time” mode — it reads the clock and shows the timestamp in seconds and milliseconds, plus the UTC date.",
      },
      {
        q: "Why does my timestamp show the year 55,000?",
        a: "You have a milliseconds value (13 digits) being read as seconds. Divide by 1,000, or paste it here — this converter detects 13-digit values automatically.",
      },
      {
        q: "Is Unix time the same in every time zone?",
        a: "Yes. A timestamp is one instant; only the display changes with the time zone. 1700000000 is 22:13 UTC and 17:13 in New York on the same day.",
      },
    ],
  },
  {
    slug: "add-business-days-to-date",
    name: "Add Business Days to Date",
    category: "Date & Time",
    short: "Add business days to a date, skipping weekends and holidays.",
    keywords:
      "add business days to date, business days calculator, add working days calculator, business day calculator, working days from date",
    inputs: [
      { key: "start", label: "Start date", type: "date", def: "2026-11-20" },
      numberInput("days", "Business days to add", "5"),
      textArea("holidays", "Holidays to skip (one date per line, YYYY-MM-DD)", ""),
    ],
    compute: (v) => {
      const start = parseDate(String(v.start ?? ""));
      const days = Math.round(N(v.days));
      if (Number.isNaN(start.getTime())) {
        return [{ label: "Result date", value: "Enter a valid start date" }];
      }
      if (!Number.isFinite(days) || days < 0) {
        return [{ label: "Result date", value: "Enter a number of business days (0 or more)" }];
      }
      const holidays = new Set(
        String(v.holidays ?? "")
          .split(/[\s,;]+/)
          .map((s) => s.trim())
          .filter(Boolean),
      );
      let current = new Date(start.getTime());
      let added = 0;
      let skippedWeekends = 0;
      let skippedHolidays = 0;
      let calendarDays = 0;
      while (added < days) {
        current.setDate(current.getDate() + 1);
        calendarDays++;
        const dow = current.getDay();
        const key = current.toISOString().slice(0, 10);
        if (dow === 0 || dow === 6) {
          skippedWeekends++;
          continue;
        }
        if (holidays.has(key)) {
          skippedHolidays++;
          continue;
        }
        added++;
      }
      return [
        { label: "Result date", value: longDate(current) },
        { label: "Business days added", value: String(added) },
        { label: "Calendar days", value: String(calendarDays) },
        { label: "Weekend days skipped", value: String(skippedWeekends) },
        ...(skippedHolidays > 0
          ? [{ label: "Holidays skipped", value: String(skippedHolidays) }]
          : []),
      ];
    },
    about:
      "Add business days to a date, skipping Saturdays and Sundays — and any holidays you list. Delivery estimates, contract deadlines, invoice terms and project plans are usually counted in business days, not calendar days: “5 business days from Friday” lands the following Friday, not Wednesday. Enter the start date and how many business days to add; holidays go in one per line as YYYY-MM-DD dates.",
    formula:
      "Step forward one calendar day at a time, counting only Monday–Friday days that are not listed as holidays. For example, 5 business days from Friday 20 November 2026 is Friday 27 November 2026 — 7 calendar days, with 2 weekend days skipped.",
    example:
      "Adding 5 business days to Friday 20 November 2026 gives Friday 27 November 2026: the 21st and 22nd are the weekend, so the counted days are the 23rd, 24th, 25th, 26th and 27th.",
    howToUse: [
      "Enter the start date and how many business days to add.",
      "Optionally list holidays to skip, one date per line (YYYY-MM-DD).",
      "Read the result date — and how many calendar and weekend days it spans.",
    ],
    details: [
      {
        heading: "What counts as a business day",
        body: "Monday to Friday, excluding public holidays. The start date itself is not counted — “1 business day from Friday” is Monday, not Friday. Different countries and industries have different weekends and holidays (some places work Sundays, some observe Friday as the weekend), so list any extra non-working days in the holidays box to match your own calendar.",
      },
      {
        heading: "Deadlines and delivery estimates",
        body: "“Allow 5 business days” is the standard language for deliveries, refunds and contract deadlines precisely because weekends do not count. Count carefully around long weekends: 5 business days before a bank holiday Monday is very different from 5 business days after one. When a deadline matters, add the holidays explicitly rather than assuming them.",
      },
    ],
    tips: [
      "The start date is not counted — day 1 is the next business day.",
      "List public holidays one per line, as YYYY-MM-DD.",
      "Check the calendar days too, for planning around weekends.",
    ],
    faqs: [
      {
        q: "How do I add 5 business days to a date?",
        a: "Count forward 5 Monday–Friday days, skipping weekends and holidays. 5 business days from Friday 20 November 2026 is Friday 27 November 2026.",
      },
      {
        q: "Does the start date count?",
        a: "No. The start date is day zero — the first business day counted is the next working day after it.",
      },
      {
        q: "Can I skip public holidays too?",
        a: "Yes — list them in the holidays box, one date per line in YYYY-MM-DD format, and they are skipped like weekends.",
      },
      {
        q: "What is the difference between business days and calendar days?",
        a: "Calendar days include weekends; business days are Monday–Friday only. 5 business days usually spans 7 calendar days.",
      },
    ],
  },
  {
    slug: "sha1-hash-generator",
    name: "SHA-1 Hash Generator",
    category: "Web & Developer",
    short: "Generate a SHA-1 hash of any text — for checksums and legacy use.",
    keywords:
      "sha1 hash generator, sha1 generator, sha-1 hash calculator, hash text online, sha1 online",
    custom: "sha1-hash-generator",
    inputs: [
      {
        key: "text",
        label: "Text to hash",
        type: "textarea",
        def: "Hello, world!",
      },
    ],
    compute: () => [],
    about:
      "Generate the SHA-1 hash of any text. SHA-1 turns any input into a fixed 40-character hexadecimal fingerprint: the same input always produces the same hash, and even a one-character change produces a completely different one. It is still used to verify file checksums and in older systems such as Git, but it is broken for security — researchers can create two different inputs with the same SHA-1 hash, so never use it for passwords or security. The hashing runs in your browser with the Web Crypto API — your text is never uploaded or stored.",
    formula:
      "SHA-1 processes the input in 512-bit blocks through 80 rounds of mixing, and outputs a 160-bit digest shown as 40 hexadecimal characters. It is a one-way function: you cannot recover the input from the hash.",
    example:
      "The SHA-1 hash of “Hello, world!” is 943a702d06f34599aee1f8da8ef9f7296031d699. Change one letter and the hash changes completely.",
    howToUse: [
      "Type or paste the text you want to hash.",
      "The SHA-1 hash appears instantly, in hexadecimal and in Base64.",
      "Copy the hash with the copy button.",
    ],
    details: [
      {
        heading: "What a hash is for",
        body: "A hash is a fingerprint: it lets you check that data has not changed without storing the data itself. Download a file, hash it, and compare with the hash the publisher lists — if they match, the file is intact. Git uses SHA-1 to identify every commit, and many download pages still list SHA-1 checksums alongside SHA-256 ones.",
      },
      {
        heading: "Why SHA-1 is not for security",
        body: "SHA-1 was standardised in 1995 and is now broken: in 2017 researchers demonstrated a practical collision, two different files with the same SHA-1 hash, and the attack has only got cheaper since. It is fine for checksums and for identifying files in systems that already use it, but for anything security-related — passwords, signatures, certificates — use SHA-256 or SHA-512 instead. Never use plain SHA-1 to store passwords; use bcrypt, scrypt or Argon2 with a salt.",
      },
    ],
    tips: [
      "The same input always gives the same hash — use that to verify downloads.",
      "For security, use SHA-256 or SHA-512 — SHA-1 is broken for that purpose.",
      "Hashing is one-way: you cannot turn a hash back into the original text.",
    ],
    faqs: [
      {
        q: "What is SHA-1?",
        a: "A hash function that turns any input into a fixed 160-bit (40 hex character) fingerprint. It is deterministic and one-way, and a tiny change in the input produces a completely different hash.",
      },
      {
        q: "Is SHA-1 secure?",
        a: "No — not any more. Practical collisions have been demonstrated since 2017, so SHA-1 must not be used for passwords, signatures or certificates. It is still fine for checksums and legacy systems.",
      },
      {
        q: "What is the difference between SHA-1 and SHA-256?",
        a: "SHA-1 produces a 40-character hash and is broken; SHA-256 produces a 64-character hash and is still trusted. Use SHA-256 for anything new.",
      },
      {
        q: "Is my text uploaded anywhere?",
        a: "No. The hashing runs in your browser with the Web Crypto API — the text never leaves your device.",
      },
    ],
  },
  {
    slug: "sha512-hash-generator",
    name: "SHA-512 Hash Generator",
    category: "Web & Developer",
    short: "Generate a SHA-512 hash of any text — free, instant and private.",
    keywords:
      "sha512 hash generator, sha512 generator, sha-512 hash calculator, hash text online, sha512 online",
    custom: "sha512-hash-generator",
    inputs: [
      {
        key: "text",
        label: "Text to hash",
        type: "textarea",
        def: "Hello, world!",
      },
    ],
    compute: () => [],
    about:
      "Generate the SHA-512 hash of any text. SHA-512 is the strongest member of the SHA-2 family: it turns any input into a fixed 128-character hexadecimal fingerprint, and the same input always produces the same hash, while even a one-character change produces a completely different one. It is used to verify file integrity and sign data where the longest available hash is wanted. The hashing runs in your browser with the Web Crypto API — your text is never uploaded or stored.",
    formula:
      "SHA-512 processes the input in 1024-bit blocks through 80 rounds of mixing, and outputs a 512-bit digest shown as 128 hexadecimal characters. It is a one-way function: you cannot recover the input from the hash.",
    example:
      "The SHA-512 hash of “Hello, world!” is c1527cd893c124773d811911970c8fe6e857d6df5dc9226bd8a160614c0cd963a4ddea2b94bb7d36021ef9d865d5cea294a82dd49a0bb269f51f6e7a57f79421. Change one letter and the hash changes completely.",
    howToUse: [
      "Type or paste the text you want to hash.",
      "The SHA-512 hash appears instantly, in hexadecimal and in Base64.",
      "Copy the hash with the copy button.",
    ],
    details: [
      {
        heading: "What a hash is for",
        body: "A hash is a fingerprint: it lets you check that data has not changed without storing the data itself. Download a file, hash it, and compare with the hash the publisher lists — if they match, the file is intact. Password systems store hashes (with a unique salt per user) instead of passwords, so a leaked database does not expose the passwords.",
      },
      {
        heading: "SHA-512 vs SHA-256",
        body: "SHA-512 is the 512-bit member of the same SHA-2 family as SHA-256. Its longer digest gives a bigger safety margin against future attacks, and on 64-bit computers it is often faster than SHA-256 because it works on 64-bit words. For most purposes the two are interchangeable — SHA-512 is the choice when the longest available hash is wanted, for example in high-security signing and verification.",
      },
    ],
    tips: [
      "The same input always gives the same hash — use that to verify downloads.",
      "SHA-512 is the strongest SHA-2 hash; SHA-256 is the common default.",
      "Never use plain SHA-512 to store passwords; use bcrypt, scrypt or Argon2 with a salt.",
    ],
    faqs: [
      {
        q: "What is SHA-512?",
        a: "A cryptographic hash function that turns any input into a fixed 512-bit (128 hex character) fingerprint. It is deterministic, one-way, and a tiny change in the input produces a completely different hash.",
      },
      {
        q: "What is the difference between SHA-512 and SHA-256?",
        a: "SHA-512 produces a 128-character hash and SHA-256 a 64-character one. Both are trusted; SHA-512 gives a bigger safety margin and is often faster on 64-bit computers.",
      },
      {
        q: "Is SHA-512 secure?",
        a: "Yes — SHA-512 is a current, trusted hash function with no practical attacks. Short or common inputs are still vulnerable to guessing, which is why passwords need a salt and a slow hash function such as bcrypt or Argon2.",
      },
      {
        q: "Is my text uploaded anywhere?",
        a: "No. The hashing runs in your browser with the Web Crypto API — the text never leaves your device.",
      },
    ],
  },
  {
    slug: "sun-moon-rising-sign-calculator",
    name: "Sun, Moon & Rising Sign Calculator",
    category: "Random Tools",
    short: "Your zodiac sun, moon and rising signs from your birth date and time.",
    keywords:
      "sun moon rising sign calculator, zodiac sign calculator, moon sign calculator, rising sign calculator, astrology signs calculator",
    inputs: [
      { key: "birth", label: "Birth date", type: "date", def: "1990-06-15" },
      textInput("time", "Birth time (24-hour, e.g. 08:30)", "08:30"),
    ],
    compute: (v) => {
      const raw = String(v.birth ?? "").trim();
      const dateMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!dateMatch) {
        return [{ label: "Sun sign", value: "Enter a birth date" }];
      }
      const year = Number(dateMatch[1]);
      const month = Number(dateMatch[2]);
      const day = Number(dateMatch[3]);
      if (month < 1 || month > 12 || day < 1 || day > 31) {
        return [{ label: "Sun sign", value: "Enter a valid birth date" }];
      }
      const sun = sunSign(month, day);
      const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      const moon = moonSign(utcDate);
      const phase = moonPhase(utcDate);
      const clock = parseClock(String(v.time ?? ""));
      const rising =
        clock === null
          ? "Enter a birth time like 08:30"
          : `${risingSign(sun, clock[0], clock[1])} (approximate — from birth time)`;
      return [
        { label: "Sun sign", value: `${sun} (${SIGN_RANGES[sun]})` },
        { label: "Moon sign", value: `${moon} (approximate)` },
        { label: "Rising sign", value: rising },
        { label: "Moon phase on that day", value: phase },
      ];
    },
    about:
      "Find your zodiac sun sign, moon sign and rising sign from your birth date and time. The sun sign comes from your birth date and is the one most people know; the moon sign is calculated from the moon's position on that date; the rising sign is estimated from your birth time. This is astrology — entertainment, not science. The moon and rising signs are approximations: the real moon sign can differ by up to about a day near a sign boundary, and a true rising sign needs your exact birth place as well as the time.",
    formula: "",
    example:
      "Born 15 June 1990 at 8:30 AM: the sun sign is Gemini (May 21 – Jun 20), the moon sign is approximately Pisces, and the rising sign is approximately Cancer.",
    howToUse: [
      "Enter your birth date — the sun and moon signs come from it.",
      "Enter your birth time for the rising sign (leave it blank for sun and moon only).",
      "Read your three signs — the moon and rising signs are labelled approximate.",
    ],
    details: [
      {
        heading: "What the three signs mean in astrology",
        body: "In astrology the sun sign is said to describe your core self, the moon sign your emotional side, and the rising sign (ascendant) how you come across to others. The sun sign is exact from the date alone. The moon moves fast — about 13 degrees a day — so its sign depends on the exact day and can sit near a boundary. The rising sign changes about every two hours and depends on the birth place, so the time-based estimate here is rough by design.",
      },
      {
        heading: "How the approximations work",
        body: "The moon sign is calculated from the moon's position, anchored on the new moon of 6 January 2000 and advanced by its daily motion of about 13.18 degrees. The rising sign uses the popular rule that at about 6 AM the rising sign is the sun sign, advancing about one sign every two hours after that. Both are good enough for entertainment, and neither is precise enough for a serious astrological chart — that needs the exact time and place of birth.",
      },
    ],
    tips: [
      "The sun sign is exact from the date; the moon and rising signs are approximate.",
      "Near a sign boundary, check the day before and after too.",
      "This is entertainment — it is not a scientific measurement.",
    ],
    faqs: [
      {
        q: "What is my zodiac sign?",
        a: "It depends on your birth date — for example, 15 June is Gemini (May 21 – Jun 20). Enter your birth date and the calculator shows your sun, moon and rising signs.",
      },
      {
        q: "What is a rising sign?",
        a: "In astrology, the sign that was on the eastern horizon when you were born — said to describe how you come across. It changes about every two hours, so it needs your birth time.",
      },
      {
        q: "Why is my moon sign approximate?",
        a: "The moon moves about 13 degrees a day, so its sign depends on the exact time of day and can sit near a boundary. This calculator estimates from the date alone.",
      },
      {
        q: "Is astrology scientific?",
        a: "No. Astrology is entertainment: controlled studies find no link between zodiac signs and personality. Treat the results as fun, not fact.",
      },
    ],
  },
];
