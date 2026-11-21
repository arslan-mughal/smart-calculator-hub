// Zodiac signs for the Sun / Moon / Rising Sign Calculator.
// Everything here is astrology — entertainment, not astronomy-grade
// precision. The moon and rising signs are approximations, and the tool
// copy says so plainly.

export type ZodiacSign =
  | "Aries"
  | "Taurus"
  | "Gemini"
  | "Cancer"
  | "Leo"
  | "Virgo"
  | "Libra"
  | "Scorpio"
  | "Sagittarius"
  | "Capricorn"
  | "Aquarius"
  | "Pisces";

export const ZODIAC_SIGNS: ZodiacSign[] = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

/** Date ranges shown next to each sign, e.g. "Mar 21 – Apr 19". */
export const SIGN_RANGES: Record<ZodiacSign, string> = {
  Aries: "Mar 21 – Apr 19",
  Taurus: "Apr 20 – May 20",
  Gemini: "May 21 – Jun 20",
  Cancer: "Jun 21 – Jul 22",
  Leo: "Jul 23 – Aug 22",
  Virgo: "Aug 23 – Sep 22",
  Libra: "Sep 23 – Oct 22",
  Scorpio: "Oct 23 – Nov 21",
  Sagittarius: "Nov 22 – Dec 21",
  Capricorn: "Dec 22 – Jan 19",
  Aquarius: "Jan 20 – Feb 18",
  Pisces: "Feb 19 – Mar 20",
};

/** Sun sign from a birth month (1–12) and day. */
export function sunSign(month: number, day: number): ZodiacSign {
  // Day number in a non-leap year (Jan 1 = 1). Sign starts as day numbers:
  // Aquarius Jan 20 (20), Pisces Feb 19 (50), Aries Mar 21 (80),
  // Taurus Apr 20 (110), Gemini May 21 (141), Cancer Jun 21 (172),
  // Leo Jul 23 (204), Virgo Aug 23 (235), Libra Sep 23 (266),
  // Scorpio Oct 23 (296), Sagittarius Nov 22 (326), Capricorn Dec 22 (356).
  const daysBeforeMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const dayNum = (daysBeforeMonth[month - 1] ?? 0) + day;
  // Capricorn straddles the year boundary: Dec 22+ or Jan 1–19.
  if (dayNum >= 356 || dayNum < 20) return "Capricorn";
  const starts: [number, ZodiacSign][] = [
    [20, "Aquarius"],
    [50, "Pisces"],
    [80, "Aries"],
    [110, "Taurus"],
    [141, "Gemini"],
    [172, "Cancer"],
    [204, "Leo"],
    [235, "Virgo"],
    [266, "Libra"],
    [296, "Scorpio"],
    [326, "Sagittarius"],
  ];
  let sign: ZodiacSign = "Capricorn";
  for (const [start, name] of starts) {
    if (dayNum >= start) sign = name;
  }
  return sign;
}

/**
 * Approximate moon sign for a date.
 * The moon moves about 13.18° a day against the stars. We anchor on the
 * new moon of 6 January 2000, when the moon was with the sun at about
 * 286° ecliptic longitude (Capricorn), and advance from there. The result
 * is approximate — the real moon sign can differ by up to about a day
 * near a sign boundary.
 */
const NEW_MOON_2000 = Date.UTC(2000, 0, 6, 18, 14, 0);
const SYNODIC_DAYS = 29.530588853; // new moon to new moon
const MOON_DAILY_MOTION = 13.176396; // degrees per day
const NEW_MOON_LONGITUDE = 286; // degrees, at the anchor new moon

export function moonSign(date: Date): ZodiacSign {
  const ageDays = (date.getTime() - NEW_MOON_2000) / 86_400_000;
  const longitude =
    (NEW_MOON_LONGITUDE + ageDays * MOON_DAILY_MOTION) % 360;
  const index = Math.floor(((longitude % 360) + 360) % 360 / 30);
  return ZODIAC_SIGNS[index]!;
}

/**
 * Approximate rising (ascendant) sign from the sun sign and birth time.
 * Rough rule used by popular astrology: at about 6am the rising sign is
 * the sun sign, and it advances about one sign every two hours after
 * that. A real ascendant needs the birth place (latitude/longitude) and
 * exact time, so this is an approximation only.
 */
export function risingSign(sun: ZodiacSign, hour: number, minute: number): ZodiacSign {
  const sunIndex = ZODIAC_SIGNS.indexOf(sun);
  const offset = Math.floor(((hour + minute / 60) - 6) / 2);
  const index = (((sunIndex + offset) % 12) + 12) % 12;
  return ZODIAC_SIGNS[index]!;
}

/** Moon phase name from the moon's age in the cycle (0–29.53 days). */
export function moonPhase(date: Date): string {
  const ageDays = (date.getTime() - NEW_MOON_2000) / 86_400_000;
  const age = ((ageDays % SYNODIC_DAYS) + SYNODIC_DAYS) % SYNODIC_DAYS;
  if (age < 1.84) return "New Moon";
  if (age < 5.53) return "Waxing Crescent";
  if (age < 9.22) return "First Quarter";
  if (age < 12.91) return "Waxing Gibbous";
  if (age < 16.61) return "Full Moon";
  if (age < 20.3) return "Waning Gibbous";
  if (age < 23.99) return "Last Quarter";
  if (age < 27.68) return "Waning Crescent";
  return "New Moon";
}
