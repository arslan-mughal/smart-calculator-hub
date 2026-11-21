// Pure pet calculations for the batch 29 pet tools. Every model is stated
// on the tool page alongside the result — these are estimates from typical
// published growth and breed-size figures, never veterinary advice.

export type SizeBand = "small" | "medium" | "large" | "giant";

export const SIZE_LABELS: Record<SizeBand, string> = {
  small: "Small (up to 10 kg adult)",
  medium: "Medium (10–25 kg adult)",
  large: "Large (25–45 kg adult)",
  giant: "Giant (over 45 kg adult)",
};

/** Months at which each size band typically reaches adult weight. */
const MATURITY_MONTHS: Record<SizeBand, number> = {
  small: 12,
  medium: 14,
  large: 18,
  giant: 24,
};

/** Fraction of adult weight reached at a given age (months), per size band. */
const GROWTH_FRACTIONS: Record<SizeBand, [number, number][]> = {
  small: [
    [2, 0.18],
    [3, 0.3],
    [4, 0.42],
    [6, 0.62],
    [8, 0.75],
    [10, 0.86],
    [12, 0.95],
    [14, 1],
  ],
  medium: [
    [2, 0.15],
    [3, 0.25],
    [4, 0.35],
    [6, 0.55],
    [8, 0.68],
    [10, 0.78],
    [12, 0.86],
    [14, 0.93],
    [18, 1],
  ],
  large: [
    [2, 0.12],
    [3, 0.2],
    [4, 0.3],
    [6, 0.45],
    [8, 0.58],
    [10, 0.68],
    [12, 0.76],
    [14, 0.82],
    [18, 0.92],
    [24, 1],
  ],
  giant: [
    [2, 0.1],
    [3, 0.17],
    [4, 0.25],
    [6, 0.38],
    [8, 0.5],
    [10, 0.6],
    [12, 0.68],
    [14, 0.75],
    [18, 0.85],
    [24, 1],
  ],
};

function growthFraction(size: SizeBand, ageMonths: number): number {
  const points = GROWTH_FRACTIONS[size];
  if (ageMonths <= points[0]![0]) return points[0]![1];
  for (let i = 1; i < points.length; i++) {
    const [m1, f1] = points[i - 1]!;
    const [m2, f2] = points[i]!;
    if (ageMonths <= m2) {
      const t = (ageMonths - m1) / (m2 - m1);
      return f1 + t * (f2 - f1);
    }
  }
  return 1;
}

export type PuppyWeightResult = {
  adultKg: number;
  lowKg: number;
  highKg: number;
  maturityMonths: number;
  fractionNow: number;
};

/** Adult weight estimate from a puppy's current weight and age. */
export function predictPuppyAdultWeight(currentKg: number, ageMonths: number, size: SizeBand): PuppyWeightResult {
  const fraction = growthFraction(size, Math.max(0.5, ageMonths));
  const adultKg = currentKg / fraction;
  return {
    adultKg,
    lowKg: adultKg * 0.9,
    highKg: adultKg * 1.1,
    maturityMonths: MATURITY_MONTHS[size],
    fractionNow: fraction,
  };
}

/** Typical total lifespan (years) by size band — published breed-size medians. */
const LIFE_EXPECTANCY: Record<SizeBand, { median: number; low: number; high: number }> = {
  small: { median: 13.5, low: 12, high: 16 },
  medium: { median: 11.5, low: 10, high: 13 },
  large: { median: 10, low: 9, high: 11.5 },
  giant: { median: 8, low: 7, high: 9.5 },
};

export type LifeExpectancyResult = { median: number; low: number; high: number; remainingYears: number };

export function dogLifeExpectancy(size: SizeBand, currentAgeYears: number): LifeExpectancyResult {
  const base = LIFE_EXPECTANCY[size];
  return {
    ...base,
    remainingYears: Math.max(0, base.median - Math.max(0, currentAgeYears)),
  };
}

/** Standard dog gestation is 63 days from mating (range 61–65). */
export function dogDueDate(matingIso: string): {
  due: Date | null;
  earliest: Date | null;
  latest: Date | null;
  ultrasound: Date | null;
  xray: Date | null;
  nesting: Date | null;
} {
  // Calendar-date maths in UTC: a date-only value has no timezone, and local-time maths shifts
  // the result by a day across DST changes (and, when read back as ISO, in UTC+ timezones).
  // Callers must format these dates with timeZone: "UTC" (see dateFmt in batch29-pets.ts).
  const start = new Date(`${matingIso}T00:00:00Z`);
  if (Number.isNaN(start.getTime())) {
    return { due: null, earliest: null, latest: null, ultrasound: null, xray: null, nesting: null };
  }
  const add = (days: number) => new Date(start.getTime() + days * 86400000);
  return {
    due: add(63),
    earliest: add(61),
    latest: add(65),
    ultrasound: add(28),
    xray: add(45),
    nesting: add(56),
  };
}

// ------------------------------------------------------------------ //
// Chocolate toxicity — theobromine content (mg per gram) and dose
// thresholds are the published figures in the Merck Veterinary Manual:
// milk chocolate 2.3, dark/semi-sweet 5.3, baker's unsweetened 16,
// cocoa powder 28.5, white chocolate 0.25 mg/g. Dose bands: under
// 20 mg/kg mild (upset stomach possible), 20–40 moderate, 40–60
// serious (rapid heart rate, tremors), over 60 potentially fatal.
// ------------------------------------------------------------------ //

export const CHOCOLATE_TYPES = [
  { v: "white", l: "White chocolate", mgPerGram: 0.25 },
  { v: "milk", l: "Milk chocolate", mgPerGram: 2.3 },
  { v: "dark", l: "Dark chocolate", mgPerGram: 5.3 },
  { v: "semisweet", l: "Semi-sweet chocolate", mgPerGram: 5.3 },
  { v: "bakers", l: "Baker's / unsweetened chocolate", mgPerGram: 16 },
  { v: "cocoa", l: "Cocoa powder", mgPerGram: 28.5 },
] as const;

export type ToxicityLevel = "none" | "mild" | "moderate" | "serious" | "severe";

export function chocolateToxicity(
  dogKg: number,
  chocolateV: string,
  grams: number,
): { mgPerGram: number; totalMg: number; doseMgPerKg: number; level: ToxicityLevel; advice: string } {
  const type = CHOCOLATE_TYPES.find((t) => t.v === chocolateV) ?? CHOCOLATE_TYPES[1]!;
  const totalMg = grams * type.mgPerGram;
  const doseMgPerKg = dogKg > 0 ? totalMg / dogKg : 0;
  let level: ToxicityLevel;
  let advice: string;
  if (doseMgPerKg < 1) {
    level = "none";
    advice = "A negligible dose — no symptoms are expected, but watch your dog as usual.";
  } else if (doseMgPerKg < 20) {
    level = "mild";
    advice =
      "Mild dose — an upset stomach or vomiting is possible. Keep an eye on your dog and call your vet if symptoms appear.";
  } else if (doseMgPerKg < 40) {
    level = "moderate";
    advice =
      "Moderate dose — vomiting, diarrhoea and restlessness are likely. Call your vet now for advice.";
  } else if (doseMgPerKg < 60) {
    level = "serious";
    advice = "Serious dose — rapid heart rate and tremors can follow. Contact your vet or an emergency vet immediately.";
  } else {
    level = "severe";
    advice = "Potentially fatal dose — seizures and heart failure are possible. Get emergency veterinary care immediately.";
  }
  return { mgPerGram: type.mgPerGram, totalMg, doseMgPerKg, level, advice };
}

// ------------------------------------------------------------------ //
// Raw feeding — the standard 2–3% of body weight per day for adults
// (2% low activity, 2.5% moderate, 3% high), and 5–8% for puppies.
// ------------------------------------------------------------------ //

export function rawFeedingDailyGrams(
  weightKg: number,
  lifeStage: "adult" | "puppy",
  activity: "low" | "moderate" | "high",
): { gramsPerDay: number; percent: number; mealsPerDay: number } {
  if (lifeStage === "puppy") {
    return { gramsPerDay: weightKg * 1000 * 0.06, percent: 6, mealsPerDay: 3 };
  }
  const percent = activity === "low" ? 2 : activity === "high" ? 3 : 2.5;
  return { gramsPerDay: weightKg * 1000 * (percent / 100), percent, mealsPerDay: 2 };
}

// ------------------------------------------------------------------ //
// Pet insurance — a transparent estimate model, stated on the page:
// base monthly premium by species/size from published US market
// averages, multiplied by age, coverage and location factors.
// It is a rough estimate, never a quote.
// ------------------------------------------------------------------ //

export const INSURANCE_BASE_MONTHLY: Record<string, number> = {
  "dog-small": 45,
  "dog-medium": 55,
  "dog-large": 65,
  "dog-giant": 75,
  "cat-any": 30,
};

export function insuranceAgeFactor(ageYears: number): number {
  if (ageYears < 1) return 0.9;
  if (ageYears <= 3) return 1;
  if (ageYears <= 6) return 1.15;
  if (ageYears <= 9) return 1.35;
  return 1.6;
}

export const INSURANCE_COVERAGE: Record<string, { factor: number; label: string }> = {
  accident: { factor: 0.55, label: "Accident only" },
  standard: { factor: 1, label: "Accident + illness" },
  premium: { factor: 1.25, label: "Accident + illness + wellness" },
};

export const INSURANCE_LOCATION: Record<string, { factor: number; label: string }> = {
  average: { factor: 1, label: "US average" },
  high: { factor: 1.15, label: "High-cost area" },
  low: { factor: 0.9, label: "Lower-cost area" },
};

export function petInsuranceEstimate(
  species: "dog" | "cat",
  size: SizeBand,
  ageYears: number,
  coverage: string,
  location: string,
): { monthly: number; low: number; high: number; yearly: number } {
  const base = species === "cat" ? INSURANCE_BASE_MONTHLY["cat-any"]! : INSURANCE_BASE_MONTHLY[`dog-${size}`]!;
  const monthly =
    base *
    insuranceAgeFactor(ageYears) *
    (INSURANCE_COVERAGE[coverage]?.factor ?? 1) *
    (INSURANCE_LOCATION[location]?.factor ?? 1);
  return { monthly, low: monthly * 0.8, high: monthly * 1.2, yearly: monthly * 12 };
}
