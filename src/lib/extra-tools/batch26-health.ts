// Batch 26 — health & fitness tools: VO2 max, target heart rate,
// running pace, weight loss.
// Health estimates only — nothing here is a medical measurement or advice.
import type { Calc } from "../tool-types";
import { fmt } from "../calculators";
import { N, numberInput, selectInput } from "./shared";

/** Mifflin-St Jeor basal metabolic rate (kcal/day). */
function bmr(sex: string, kg: number, cm: number, age: number): number {
  return 10 * kg + 6.25 * cm - 5 * age + (sex === "f" ? -161 : 5);
}

const ACTIVITY: [string, string, number][] = [
  ["1.2", "Sedentary (little or no exercise)", 1.2],
  ["1.375", "Light (1–3 days/week)", 1.375],
  ["1.55", "Moderate (3–5 days/week)", 1.55],
  ["1.725", "Very active (6–7 days/week)", 1.725],
  ["1.9", "Athlete (twice a day)", 1.9],
];

const sexSelect = (def = "m") =>
  selectInput("sex", "Sex", def, [
    ["m", "Male"],
    ["f", "Female"],
  ]);

/** Published VO2 max norms (ml/kg/min) by sex and age band.
 *  Bands: [poor below, fair up to, good up to, excellent up to]; above is superior.
 *  Values follow the widely published Heyward/ACSM classification table. */
const VO2_NORMS: Record<string, Record<string, [number, number, number, number]>> = {
  m: {
    "20-29": [42, 45, 50, 55],
    "30-39": [37, 41, 46, 51],
    "40-49": [35, 39, 43, 48],
    "50-59": [32, 36, 40, 45],
    "60-69": [29, 32, 36, 41],
  },
  f: {
    "20-29": [36, 39, 43, 49],
    "30-39": [29, 33, 37, 43],
    "40-49": [27, 30, 34, 39],
    "50-59": [25, 28, 31, 35],
    "60-69": [24, 27, 30, 34],
  },
};

function vo2Band(sex: string, age: number, vo2: number): string {
  const band =
    age < 30 ? "20-29" : age < 40 ? "30-39" : age < 50 ? "40-49" : age < 60 ? "50-59" : age < 70 ? "60-69" : null;
  if (!band) return "No published norm for this age band";
  const [poor, fair, good, excellent] = VO2_NORMS[sex]?.[band] ?? VO2_NORMS.m[band]!;
  if (vo2 < poor) return "Poor";
  if (vo2 <= fair) return "Fair";
  if (vo2 <= good) return "Good";
  if (vo2 <= excellent) return "Excellent";
  return "Superior";
}

/** Format minutes (decimal) as m:ss — for paces, which are under an hour. */
function paceString(minPerKm: number): string {
  if (!Number.isFinite(minPerKm) || minPerKm <= 0) return "—";
  const totalSeconds = Math.round(minPerKm * 60);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

/** Format a duration in minutes as m:ss, or h:mm:ss when over an hour. */
function formatDuration(totalMin: number): string {
  if (!Number.isFinite(totalMin) || totalMin <= 0) return "—";
  const s = Math.round(totalMin * 60);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export const batch26HealthTools: Calc[] = [
  {
    slug: "vo2-max-calculator",
    name: "VO2 Max Calculator",
    category: "Health & Fitness",
    short: "Estimate your VO2 max from age and resting heart rate — a quick fitness gauge.",
    keywords:
      "vo2 max calculator, vo2max calculator, estimate vo2 max, vo2 max test, aerobic fitness calculator, vo2 max chart",
    popular: true,
    inputs: [
      numberInput("age", "Age", "30"),
      numberInput("rest", "Resting heart rate (bpm)", "60"),
      sexSelect(),
    ],
    compute: (v) => {
      const age = N(v.age);
      const rest = N(v.rest);
      const sex = String(v.sex ?? "m");
      // Tanaka maximum heart rate, then the Uth–Sørensen–Overgaard–Pedersen ratio.
      const hrMax = 208 - 0.7 * age;
      const vo2 = rest > 0 ? 15.3 * (hrMax / rest) : NaN;
      return [
        { label: "Estimated VO2 max", value: Number.isFinite(vo2) ? `${fmt(vo2, 1)} ml/kg/min` : "—" },
        { label: "Estimated maximum heart rate", value: `${fmt(hrMax, 0)} bpm` },
        { label: "Fitness rating", value: Number.isFinite(vo2) ? vo2Band(sex, age, vo2) : "—" },
      ];
    },
    about:
      "Estimate your VO2 max — the maximum rate your body can use oxygen during hard exercise — from your age and resting heart rate. It uses the Uth–Sørensen–Overgaard–Pedersen formula (VO2 max ≈ 15.3 × HRmax ÷ HRrest) with the Tanaka maximum heart rate (208 − 0.7 × age), then rates the result against published age and sex norms. This is an estimate, not a measurement: only a lab test with a mask and a treadmill or bike measures VO2 max directly, and wrist devices use their own formulas. Resting heart rate should be measured first thing in the morning, before coffee, over several days.",
    formula:
      "HRmax = 208 − 0.7 × age (Tanaka). VO2 max ≈ 15.3 × (HRmax ÷ resting heart rate). The rating compares the result with published norms for your age and sex.",
    example:
      "A 30-year-old man with a resting heart rate of 60: maximum heart rate is 208 − 21 = 187, and VO2 max is 15.3 × (187 ÷ 60) = 47.7 ml/kg/min — rated Excellent for men aged 30–39.",
    howToUse: [
      "Enter your age.",
      "Enter your resting heart rate — measure it lying down in the morning, before coffee.",
      "Choose your sex — the rating bands differ for men and women.",
      "Read the estimated VO2 max and the fitness rating.",
    ],
    details: [
      {
        heading: "What VO2 max means",
        body: "VO2 max is measured in millilitres of oxygen per kilogram of body weight per minute. Higher means your heart, lungs and muscles deliver and use oxygen better — it is one of the strongest single predictors of endurance performance and, in large studies, of long-term health. A sedentary adult is often in the 30s; a trained amateur runner in the 40s or 50s; elite endurance athletes reach the 70s and 80s. Because the formula uses resting heart rate, getting fitter (a lower resting rate) raises the estimate even before a lab test would show a change.",
      },
      {
        heading: "How accurate is the estimate?",
        body: "The Uth formula is one of the better field estimates, typically within about 10–15% of a lab value for most people — but it can be further off for the very fit, the very unfit, or anyone on heart-rate medication such as beta blockers, which lower resting heart rate without raising fitness. Treat the number as a trend to track over months, not a precise score. If you need an exact value — for example to set training zones — a lab test or a structured field test such as the Cooper 12-minute run is the next step.",
      },
      {
        heading: "How to improve it",
        body: "VO2 max responds to training in weeks, not years. The most effective work is a mix: two or three sessions a week of high-intensity intervals (for example 4 × 4 minutes hard with recovery) plus longer easy sessions. Losing excess weight also raises VO2 max per kilogram, because the same oxygen supply serves less body mass.",
      },
    ],
    tips: [
      "Measure resting heart rate over several mornings and use the average — one reading can be 5 bpm off.",
      "Do not compare your number with someone of a different age or sex — the bands exist for a reason.",
      "Track the trend over months; a single estimate is much less useful than the direction it moves.",
    ],
    faqs: [
      {
        q: "What is a good VO2 max?",
        a: "It depends on age and sex. For men aged 30–39, above 51 is superior and 42–46 is good; for women the same age, above 43 is superior and 34–37 is good. Most untrained adults sit in the 30s.",
      },
      {
        q: "How accurate is a VO2 max estimate from resting heart rate?",
        a: "Usually within about 10–15% of a lab test for most people. It is good for tracking trends and rough comparisons, but it is not a medical measurement — beta blockers and illness distort it.",
      },
      {
        q: "Can I improve my VO2 max?",
        a: "Yes, and quickly: high-intensity interval training plus longer easy sessions typically lift it noticeably within 6–12 weeks. Losing excess weight raises it per kilogram too.",
      },
    ],
  },
  {
    slug: "target-heart-rate-calculator",
    name: "Target Heart Rate Calculator",
    category: "Health & Fitness",
    short: "Your training heart-rate zones — Karvonen zones from age and resting heart rate.",
    keywords:
      "target heart rate calculator, heart rate zones calculator, karvonen calculator, training heart rate, fat burning heart rate zone, max heart rate calculator",
    inputs: [
      numberInput("age", "Age", "30"),
      numberInput("rest", "Resting heart rate (bpm)", "60"),
    ],
    compute: (v) => {
      const age = N(v.age);
      const rest = N(v.rest);
      const hrMax = 208 - 0.7 * age;
      const hrr = hrMax - rest;
      const zone = (lo: number, hi: number) =>
        `${Math.round(rest + hrr * lo)}–${Math.round(rest + hrr * hi)} bpm`;
      return [
        { label: "Maximum heart rate", value: `${fmt(hrMax, 0)} bpm` },
        { label: "Heart rate reserve", value: `${fmt(hrr, 0)} bpm` },
        { label: "Light zone (50–60%)", value: zone(0.5, 0.6) },
        { label: "Moderate zone (60–70%)", value: zone(0.6, 0.7) },
        { label: "Vigorous zone (70–85%)", value: zone(0.7, 0.85) },
        { label: "Peak zone (85–95%)", value: zone(0.85, 0.95) },
      ];
    },
    about:
      "Find your training heart-rate zones with the Karvonen method: your maximum heart rate is estimated from your age (Tanaka: 208 − 0.7 × age), your heart-rate reserve is the gap between that maximum and your resting rate, and each training zone is a percentage of that reserve added back to your resting rate. The result is more personal than a plain percentage of maximum, because two people with the same maximum but different resting rates get different zones. These zones are a guide for exercise — stop and seek medical advice if you feel chest pain, dizziness or unusual breathlessness.",
    formula:
      "HRmax = 208 − 0.7 × age. Heart rate reserve = HRmax − resting HR. Target = resting HR + reserve × intensity (50–60% light, 60–70% moderate, 70–85% vigorous, 85–95% peak).",
    example:
      "A 30-year-old with a resting heart rate of 60: maximum is 187 bpm and the reserve is 127. The moderate zone (60–70%) is 136–149 bpm, and the vigorous zone (70–85%) is 149–168 bpm.",
    howToUse: [
      "Enter your age.",
      "Enter your resting heart rate — morning, lying down, before coffee.",
      "Read your maximum heart rate and the four training zones.",
      "Train in the zone that matches your goal: moderate for endurance, vigorous for fitness gains.",
    ],
    details: [
      {
        heading: "What each zone is for",
        body: "The light zone (50–60%) is warm-up, recovery and easy walking. The moderate zone (60–70%) is where most endurance training happens — you can talk in full sentences and sustain it for an hour. The vigorous zone (70–85%) is hard tempo and interval work, where fitness improves fastest. The peak zone (85–95%) is short, very hard efforts for trained athletes. Most of a week's training should be in the light and moderate zones, with only one or two hard sessions.",
      },
      {
        heading: "Karvonen vs percentage of maximum",
        body: "A plain percentage of maximum heart rate ignores your resting rate, so it gives the same zones to a fit person (resting 50) and an unfit one (resting 80) of the same age. Karvonen uses the reserve — the range your heart actually works across — so the zones sit lower for the fit person and higher for the unfit one, matching how hard the effort feels. That is why coaches prefer it.",
      },
      {
        heading: "Limits of the estimate",
        body: "Maximum heart rate is estimated from age, and the estimate can be off by 10 beats or more for an individual — some people's true maximum is much higher or lower than the formula. Heart-rate medication, illness and heat also change the numbers. Use the zones as a guide, and pay attention to how the effort feels: if you cannot speak in the moderate zone, you are going too hard whatever the watch says.",
      },
    ],
    tips: [
      "Measure resting heart rate over several mornings and average it — a single reading can mislead by 5 bpm.",
      "Keep most training easy: about 80% of weekly time in the light and moderate zones.",
      "If you take heart-rate medication, ask your doctor what zones apply to you.",
    ],
    faqs: [
      {
        q: "What is the Karvonen formula?",
        a: "Target heart rate = resting heart rate + (maximum heart rate − resting heart rate) × intensity. It uses your heart-rate reserve, so the zones reflect your own fitness rather than just your age.",
      },
      {
        q: "What heart rate should I exercise at?",
        a: "For general fitness, most of your exercise should be in the moderate zone (60–70% of reserve), where you can still talk. Short vigorous sessions (70–85%) build fitness faster but need recovery days.",
      },
      {
        q: "What is a good resting heart rate?",
        a: "For most adults, 60–100 bpm at rest is considered normal, and trained athletes are often 40–60. A resting rate that climbs over weeks can signal illness, stress or overtraining.",
      },
    ],
  },
  {
    slug: "running-pace-calculator",
    name: "Running Pace Calculator",
    category: "Health & Fitness",
    short: "Pace from distance and time — or time from distance and pace. Per km and per mile.",
    keywords:
      "running pace calculator, pace calculator, running pace per km, running pace per mile, race pace calculator, running speed calculator",
    popular: true,
    inputs: [
      selectInput("mode", "What do you want to find?", "pace", [
        ["pace", "Pace (from distance + time)"],
        ["time", "Time (from distance + pace)"],
      ]),
      { key: "dist", label: "Distance", def: "10", suffix: "km" },
      { key: "time", label: "Time", def: "50", suffix: "minutes" },
      { key: "pace", label: "Pace", def: "5", suffix: "min/km" },
    ],
    compute: (v) => {
      const dist = N(v.dist);
      const timeMin = N(v.time);
      const paceMinKm = N(v.pace);
      if (String(v.mode) === "time") {
        const totalMin = dist * paceMinKm;
        const speed = dist > 0 && totalMin > 0 ? dist / (totalMin / 60) : NaN;
        return [
          { label: "Time", value: formatDuration(totalMin) },
          { label: "Time in minutes", value: fmt(totalMin, 2) },
          { label: "Average speed", value: Number.isFinite(speed) ? `${fmt(speed, 2)} km/h` : "—" },
          { label: "Pace per mile", value: `${paceString(paceMinKm * 1.60934)} min/mile` },
        ];
      }
      const paceKm = dist > 0 && timeMin > 0 ? timeMin / dist : NaN;
      const speed = dist > 0 && timeMin > 0 ? dist / (timeMin / 60) : NaN;
      return [
        { label: "Pace per kilometre", value: `${paceString(paceKm)} min/km` },
        { label: "Pace per mile", value: `${paceString(paceKm * 1.60934)} min/mile` },
        { label: "Average speed", value: Number.isFinite(speed) ? `${fmt(speed, 2)} km/h` : "—" },
        { label: "Time for a marathon (42.195 km)", value: formatDuration(paceKm * 42.195) },
      ];
    },
    about:
      "Work out your running pace from a distance and a time — or the other way round, the time a distance will take at a given pace. Pace is shown per kilometre and per mile, with average speed and the marathon time that pace would give. A 10 km run in 50 minutes is 5:00 per kilometre, 8:03 per mile and 12 km/h. Use the pace mode after a run, and the time mode before a race to see what finishing time a target pace means.",
    formula:
      "Pace = time ÷ distance. Time = pace × distance. Speed = distance ÷ time. 1 mile = 1.60934 km, so pace per mile = pace per km × 1.60934.",
    example:
      "10 km in 50 minutes is a pace of 5:00 per kilometre and 8:03 per mile, at an average speed of 12 km/h — and the same pace over a marathon would take 3:30:59.",
    howToUse: [
      "Choose whether to find your pace or predict a time.",
      "Enter the distance in kilometres.",
      "Enter the time in minutes (pace mode) or the pace in minutes per kilometre (time mode).",
      "Read the pace per kilometre and per mile, the speed, and the marathon equivalent.",
    ],
    details: [
      {
        heading: "Pace, speed and what they feel like",
        body: "Pace (minutes per kilometre) is what runners actually use, because it answers 'how long will this take?' directly. 6:00/km is a gentle jog for most people, 5:00/km is a solid club-runner pace, 4:00/km is fast, and under 3:00/km is elite. Speed in km/h is the same information upside down: 12 km/h is 5:00/km. The marathon line shows what a pace means over 42.195 km — a pace that feels easy for 5 km can be brutal for 42.",
      },
      {
        heading: "Why the marathon time is only a guide",
        body: "Multiplying your 10 km pace by 42.195 assumes you can hold the same pace for four times the distance, which almost nobody can without specific marathon training. A realistic marathon pace is usually 15–30 seconds per kilometre slower than 10 km pace. Use the line as a lower bound, then add that margin when you set a race goal.",
      },
    ],
    tips: [
      "Negative splits — a slightly slower first half — usually produce faster times than starting too fast.",
      "Your easy-run pace should let you hold a conversation; if you cannot, slow down.",
      "Compare paces on similar courses: hills and heat can cost 30 seconds per kilometre or more.",
    ],
    faqs: [
      {
        q: "What is a good running pace?",
        a: "For a recreational runner, 5:30–6:30 per kilometre is a normal easy pace and 5:00/km is a respectable 10 km race pace. 'Good' depends on age, distance and training — compare with your own past times first.",
      },
      {
        q: "How do I convert pace per km to pace per mile?",
        a: "Multiply by 1.60934. A 5:00/km pace is 8:03 per mile. This calculator shows both automatically.",
      },
      {
        q: "How fast is 12 km/h in pace?",
        a: "12 km/h is 5:00 per kilometre (60 ÷ 12). In general, pace in min/km is 60 ÷ speed in km/h.",
      },
    ],
  },
  {
    slug: "weight-loss-calculator",
    name: "Weight Loss Calculator",
    category: "Health & Fitness",
    short: "Daily calories and a realistic timeline to reach your goal weight.",
    keywords:
      "weight loss calculator, calories to lose weight, calorie deficit calculator, lose weight calculator, weight loss timeline calculator",
    popular: true,
    inputs: [
      sexSelect(),
      numberInput("age", "Age", "30"),
      { key: "cm", label: "Height", def: "180", suffix: "cm" },
      { key: "kg", label: "Current weight", def: "90", suffix: "kg" },
      { key: "goal", label: "Goal weight", def: "80", suffix: "kg" },
      selectInput(
        "act",
        "Activity level",
        "1.55",
        ACTIVITY.map(([v, l]) => [v, l]),
      ),
      selectInput("loss", "Planned loss per week", "0.5", [
        ["0.25", "0.25 kg/week (gentle)"],
        ["0.5", "0.5 kg/week (steady)"],
        ["0.75", "0.75 kg/week (brisk)"],
        ["1", "1 kg/week (maximum)"],
      ]),
    ],
    compute: (v) => {
      const sex = String(v.sex ?? "m");
      const age = N(v.age);
      const cm = N(v.cm);
      const kg = N(v.kg);
      const goal = N(v.goal);
      const act = N(v.act) || 1.55;
      const loss = N(v.loss) || 0.5;
      const maintenance = bmr(sex, kg, cm, age) * act;
      // One kilogram of body fat stores roughly 7,700 kcal.
      const dailyDeficit = (loss * 7700) / 7;
      const target = maintenance - dailyDeficit;
      const toLose = kg - goal;
      const weeks = loss > 0 && toLose > 0 ? toLose / loss : NaN;
      const safeFloor = sex === "f" ? 1200 : 1500;
      return [
        { label: "Maintenance calories", value: `${fmt(maintenance, 0)} kcal/day` },
        { label: "Target daily calories", value: `${fmt(target, 0)} kcal/day` },
        { label: "Daily calorie deficit", value: `${fmt(dailyDeficit, 0)} kcal/day` },
        { label: "Weight to lose", value: `${fmt(toLose, 1)} kg` },
        { label: "Estimated time to goal", value: Number.isFinite(weeks) ? `${fmt(weeks, 0)} weeks` : "—" },
        {
          label: "Safety check",
          value:
            target < safeFloor
              ? `Below ${safeFloor} kcal/day — too low to plan alone; talk to a doctor or dietitian`
              : "Within the usual safe range",
        },
      ];
    },
    about:
      "Work out how many calories to eat each day to reach a goal weight, and how long it should take. The calculator finds your maintenance calories from the Mifflin-St Jeor equation (basal metabolic rate times your activity level), then subtracts a daily deficit based on your planned loss — one kilogram of body fat stores about 7,700 kcal, so losing 0.5 kg a week needs a 550 kcal daily deficit. This is an estimate for healthy adults, not medical advice: it does not suit children, pregnancy, eating disorders or anyone with a medical condition, and a daily target under 1,200 kcal (women) or 1,500 kcal (men) should only be planned with a professional.",
    formula:
      "BMR (Mifflin-St Jeor): men 10 × kg + 6.25 × cm − 5 × age + 5; women the same with −161. Maintenance = BMR × activity factor. Daily deficit = weekly loss × 7,700 ÷ 7. Target = maintenance − deficit. Weeks = (current − goal) ÷ weekly loss.",
    example:
      "A 30-year-old man, 180 cm, 90 kg, moderately active, aiming for 80 kg at 0.5 kg a week: basal metabolic rate is 1,880 kcal, maintenance is 2,914 kcal a day, the target is 2,364 kcal a day (a 550 kcal deficit), and the goal takes about 20 weeks.",
    howToUse: [
      "Enter your sex, age, height and current weight.",
      "Enter your goal weight and your activity level.",
      "Choose how fast to lose — 0.5 kg a week is the usual steady rate.",
      "Read your target daily calories and the estimated weeks to your goal.",
    ],
    details: [
      {
        heading: "Why 0.5 kg a week is the usual advice",
        body: "Losing 0.5 kg a week needs a 550 kcal daily deficit, which most people can manage by eating a little less and moving a little more. Faster loss needs a bigger deficit, which is harder to sustain and more likely to cost muscle as well as fat. Weight loss also slows over time: as you get lighter your maintenance calories fall, so the same daily intake produces a smaller deficit. Expect plateaus, and re-check your target every few kilograms.",
      },
      {
        heading: "What the estimate cannot see",
        body: "The Mifflin-St Jeor equation is the most accurate general formula, but it still misses by 10% or more for very muscular or very unfit people, because it estimates from weight and height rather than body composition. Water, glycogen and food in the gut can swing the scale by a kilogram day to day — weigh yourself at the same time of day, several times a week, and trust the trend over two or three weeks, not any single reading.",
      },
      {
        heading: "When to get professional help",
        body: "See a doctor or registered dietitian before starting if you have diabetes, heart disease, thyroid problems, a history of eating disorders, are pregnant, or if the calculator puts your target under 1,200 kcal (women) or 1,500 kcal (men). Rapid weight loss, dizziness or constant fatigue are signs to stop and get advice.",
      },
    ],
    tips: [
      "Weigh yourself at the same time of day and watch the two-week trend, not daily swings.",
      "Keep protein up while you lose weight — it protects muscle and keeps you full.",
      "If progress stalls for three weeks, re-check your target: your maintenance has fallen as you got lighter.",
    ],
    faqs: [
      {
        q: "How many calories should I eat to lose weight?",
        a: "Maintenance calories minus a deficit. For 0.5 kg a week, subtract about 550 kcal a day from maintenance. This calculator works out both numbers from your age, sex, height, weight and activity.",
      },
      {
        q: "How fast can I safely lose weight?",
        a: "Most guidance says 0.5–1 kg a week. Faster than that is harder to sustain and more likely to lose muscle as well as fat — and very low-calorie plans should only be done with professional supervision.",
      },
      {
        q: "Why has my weight loss stopped?",
        a: "Usually because maintenance calories fall as you get lighter, so the original deficit shrinks. Re-run the calculator at your new weight, and check that portions and activity have not drifted.",
      },
    ],
  },
];
