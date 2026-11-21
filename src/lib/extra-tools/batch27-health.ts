// Batch 27 — health & fitness tools: sleep, keto, intermittent fasting,
// calorie deficit.
// Health estimates only — nothing here is a medical measurement or advice.
import type { Calc } from "../tool-types";
import { fmt } from "../calculators";
import { N, numberInput, selectInput, textInput } from "./shared";

const m = (n: number, d = 2) => fmt(n, d);

/** Mifflin-St Jeor basal metabolic rate (kcal/day). */
function bmr(sex: string, kg: number, cm: number, age: number): number {
  return 10 * kg + 6.25 * cm - 5 * age + (sex === "f" ? -161 : 5);
}

const ACTIVITY: [string, string][] = [
  ["1.2", "Sedentary (little or no exercise)"],
  ["1.375", "Light (1–3 days/week)"],
  ["1.55", "Moderate (3–5 days/week)"],
  ["1.725", "Very active (6–7 days/week)"],
  ["1.9", "Athlete (twice a day)"],
];

const sexSelect = (def = "m") =>
  selectInput("sex", "Sex", def, [
    ["m", "Male"],
    ["f", "Female"],
  ]);

/** "07:30" → minutes after midnight, or NaN. */
function parseTime(value: string): number {
  const match = String(value ?? "").trim().match(/^(\d{1,2}):(\d{2})\s*([ap]m)?$/i);
  if (!match) return NaN;
  let h = Number(match[1]);
  const min = Number(match[2]!);
  const ap = match[3]?.toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  if (h > 23 || min > 59) return NaN;
  return h * 60 + min;
}

/** Minutes after midnight → "11:30 PM" style. */
function timeString(minutes: number): string {
  const total = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h24 = Math.floor(total / 60);
  const min = total % 60;
  const ap = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(min).padStart(2, "0")} ${ap}`;
}

const HEALTH_DISCLAIMER =
  "This is an estimate for healthy adults, not medical advice. It does not suit children, pregnancy, eating disorders or anyone with a medical condition — talk to a doctor or registered dietitian before changing your diet or sleep habits.";

export const batch27HealthTools: Calc[] = [
  {
    slug: "sleep-calculator",
    name: "Sleep Calculator",
    category: "Health & Fitness",
    short: "Best bedtimes and wake-up times based on 90-minute sleep cycles.",
    keywords:
      "sleep calculator, bedtime calculator, wake up time calculator, sleep cycle calculator, best time to sleep",
    popular: true,
    inputs: [
      selectInput("mode", "I want to…", "wake", [
        ["wake", "Wake up at a set time"],
        ["sleep", "Fall asleep at a set time"],
      ]),
      textInput("time", "Time (24-hour, e.g. 07:00)", "07:00"),
      numberInput("cycles", "Sleep cycles", "5"),
    ],
    compute: (v) => {
      const mode = String(v.mode ?? "wake");
      const at = parseTime(String(v.time ?? ""));
      const cycles = Math.round(N(v.cycles)) || 5;
      if (!Number.isFinite(at)) {
        return [{ label: "Suggested times", value: "Enter a time like 07:00" }];
      }
      const cycleMin = 90;
      const fallAsleepMin = 14; // average time to fall asleep
      const results: { label: string; value: string }[] = [];
      if (mode === "wake") {
        // Wake at `at`: bedtimes are wake minus cycles, minus falling asleep.
        const options: string[] = [];
        for (let c = 6; c >= 4; c--) {
          options.push(`${c} cycles (${c * 1.5} h) — ${timeString(at - c * cycleMin - fallAsleepMin)}`);
        }
        results.push({ label: "Go to bed at", value: options.join("\n") });
        results.push({
          label: "Best choice",
          value: `${timeString(at - cycles * cycleMin - fallAsleepMin)} for ${cycles} cycles (${cycles * 1.5} hours of sleep)`,
        });
        results.push({ label: "Time to fall asleep", value: "About 14 minutes is already allowed for" });
      } else {
        const asleepAt = at + fallAsleepMin;
        const options: string[] = [];
        for (let c = 4; c <= 6; c++) {
          options.push(`${c} cycles (${c * 1.5} h) — ${timeString(asleepAt + c * cycleMin)}`);
        }
        results.push({ label: "Wake up at", value: options.join("\n") });
        results.push({
          label: "Best choice",
          value: `${timeString(asleepAt + cycles * cycleMin)} for ${cycles} cycles (${cycles * 1.5} hours of sleep)`,
        });
        results.push({ label: "Time to fall asleep", value: "About 14 minutes is already allowed for" });
      }
      return results;
    },
    about:
      "Find the best time to go to bed or wake up, based on 90-minute sleep cycles. Sleep runs in cycles of light sleep, deep sleep and dreaming, each lasting about 90 minutes — waking up at the end of a cycle feels far better than being woken in the middle of deep sleep. The calculator works backwards from your alarm time (or forwards from your bedtime) in whole cycles, and allows about 14 minutes to fall asleep. Most adults need 5 cycles (7.5 hours) a night. " + HEALTH_DISCLAIMER,
    formula:
      "Each sleep cycle lasts about 90 minutes. Bedtime = wake-up time − (cycles × 90 minutes) − 14 minutes to fall asleep. Wake-up time = bedtime + 14 minutes + (cycles × 90 minutes). Five cycles is 7.5 hours of sleep.",
    example:
      "To wake at 7:00 AM with 5 sleep cycles (7.5 hours), go to bed at 11:16 PM: 7:00 AM minus 7.5 hours is 11:30 PM, minus 14 minutes to fall asleep gives 11:16 PM.",
    howToUse: [
      "Choose whether you want to wake at a set time or fall asleep at a set time.",
      "Enter the time and how many sleep cycles you want (5 is the usual choice).",
      "Pick a bedtime or wake-up time from the list — each is a whole number of cycles.",
    ],
    details: [
      {
        heading: "Why waking mid-cycle feels terrible",
        body: "Each 90-minute cycle moves from light sleep into deep sleep and then dreaming (REM). Waking during deep sleep leaves you groggy and confused for up to half an hour — sleep inertia. Waking at the end of a cycle, in light sleep, feels much easier, even if you slept slightly less. That is why 7.5 hours (5 cycles) often feels better than 8 hours (5 cycles plus a third of a cycle).",
      },
      {
        heading: "How much sleep do you need?",
        body: "Most adults need 7–9 hours, which is 5–6 cycles. Teenagers need more (8–10 hours), older adults a little less. The cycles matter more than the exact total: a regular bedtime and wake-up time, a dark cool room, and no screens for the last half hour do more for sleep quality than chasing an extra 20 minutes. If you regularly need an alarm to wake, you are probably not getting enough.",
      },
    ],
    tips: [
      "Aim for 5 cycles (7.5 hours) — 6 cycles (9 hours) if you are still tired.",
      "Keep the same bedtime and wake-up time every day, weekends included.",
      "Allow 14 minutes to fall asleep — the calculator already does.",
    ],
    faqs: [
      {
        q: "How long is a sleep cycle?",
        a: "About 90 minutes. Each cycle moves from light sleep into deep sleep and then dreaming (REM), and the cycle repeats through the night.",
      },
      {
        q: "How many sleep cycles do I need?",
        a: "Most adults need 5 cycles (7.5 hours) a night; 6 cycles (9 hours) is better if you are still tired. Teenagers need more.",
      },
      {
        q: "Why do I feel worse after 8 hours than after 7.5?",
        a: "Because 8 hours is 5 cycles plus a third of a cycle — the alarm can catch you in deep sleep. 7.5 hours ends at a cycle boundary, in light sleep, which feels much easier.",
      },
      {
        q: "What time should I go to bed to wake at 7 AM?",
        a: "For 5 cycles (7.5 hours), 11:16 PM — 7:00 AM minus 7.5 hours, minus about 14 minutes to fall asleep.",
      },
    ],
  },
  {
    slug: "keto-calculator",
    name: "Keto Calculator",
    category: "Health & Fitness",
    short: "Daily calories and keto macros — fat, protein and carbs in grams.",
    keywords:
      "keto calculator, keto macro calculator, ketogenic diet calculator, keto macros calculator, keto diet macros",
    inputs: [
      sexSelect(),
      numberInput("age", "Age", "30"),
      { key: "cm", label: "Height", def: "175", suffix: "cm" },
      { key: "kg", label: "Weight", def: "80", suffix: "kg" },
      selectInput("act", "Activity level", "1.55", ACTIVITY),
      selectInput("goal", "Goal", "maintain", [
        ["lose", "Lose weight (−20% calories)"],
        ["maintain", "Maintain weight"],
        ["gain", "Gain weight (+10% calories)"],
      ]),
      selectInput("ratio", "Keto ratio (fat / protein / carbs)", "70/25/5", [
        ["70/25/5", "70% fat / 25% protein / 5% carbs (standard)"],
        ["75/20/5", "75% fat / 20% protein / 5% carbs (strict)"],
        ["65/30/5", "65% fat / 30% protein / 5% carbs (high protein)"],
      ]),
    ],
    compute: (v) => {
      const sex = String(v.sex ?? "m");
      const age = N(v.age);
      const cm = N(v.cm);
      const kg = N(v.kg);
      const act = N(v.act) || 1.55;
      const goal = String(v.goal ?? "maintain");
      const ratio = String(v.ratio ?? "70/25/5");
      const maintenance = bmr(sex, kg, cm, age) * act;
      const factor = goal === "lose" ? 0.8 : goal === "gain" ? 1.1 : 1;
      const calories = maintenance * factor;
      const [fatPct, proteinPct, carbPct] = ratio.split("/").map(Number);
      const fatG = (calories * (fatPct! / 100)) / 9;
      const proteinG = (calories * (proteinPct! / 100)) / 4;
      const carbG = (calories * (carbPct! / 100)) / 4;
      return [
        { label: "Daily calories", value: `${fmt(calories, 0)} kcal` },
        { label: "Fat", value: `${fmt(fatG, 0)} g / day (${fatPct}% of calories)` },
        { label: "Protein", value: `${fmt(proteinG, 0)} g / day (${proteinPct}% of calories)` },
        { label: "Net carbs", value: `${fmt(carbG, 0)} g / day (${carbPct}% of calories)` },
        { label: "Maintenance calories", value: `${fmt(maintenance, 0)} kcal / day` },
      ];
    },
    about:
      "Work out your daily calories and keto macros: how many grams of fat, protein and net carbs to eat on a ketogenic diet. The calculator finds your maintenance calories from the Mifflin-St Jeor equation, adjusts for your goal, then splits the calories by your chosen ratio — usually 70% fat, 25% protein and 5% carbs. A keto diet keeps carbs low enough (usually under 50 g a day) that the body burns fat for fuel. " + HEALTH_DISCLAIMER,
    formula:
      "BMR (Mifflin-St Jeor): men 10 × kg + 6.25 × cm − 5 × age + 5; women the same with −161. Maintenance = BMR × activity factor; lose weight × 0.8, gain weight × 1.1. Fat grams = calories × fat% ÷ 9; protein and carb grams = calories × % ÷ 4.",
    example:
      "A 30-year-old man, 175 cm, 80 kg, moderately active: maintenance is about 2,711 kcal a day. On the standard 70/25/5 ratio that is 211 g of fat, 169 g of protein and 34 g of net carbs a day.",
    howToUse: [
      "Enter your sex, age, height, weight and activity level.",
      "Choose your goal and your keto ratio — 70/25/5 is the standard one.",
      "Read your daily calories and the grams of fat, protein and net carbs.",
    ],
    details: [
      {
        heading: "What keto actually is",
        body: "A ketogenic diet is very low in carbohydrates (usually under 50 g of net carbs a day) and high in fat, with moderate protein. With almost no glucose coming in, the liver turns fat into ketones, which the brain and body burn instead. It takes a few days to adapt — the “keto flu” of tiredness and headaches is common in the first week — and the diet is a medical treatment for epilepsy, so anyone with a medical condition should talk to a doctor first.",
      },
      {
        heading: "Protein matters more than the ratio",
        body: "The fat/protein/carb ratio is a guide, not a law. The number that matters most is protein: too little and you lose muscle along with fat, too much and the extra can slow ketosis. A common target is 1.6–2.2 g of protein per kilogram of body weight a day. Fat is the flexible part — eat enough to feel full, and less of it if you want to lose weight faster, since body fat makes up the difference.",
      },
    ],
    tips: [
      "Count net carbs (total carbs minus fibre), not total carbs.",
      "Keep protein up — 1.6–2.2 g per kilogram of body weight a day.",
      "Drink water and replace salt: low-carb diets flush both out.",
    ],
    faqs: [
      {
        q: "What are keto macros?",
        a: "The split of your daily calories between fat, protein and carbs. The standard keto split is 70% fat, 25% protein and 5% carbs — this calculator turns that into grams per day.",
      },
      {
        q: "How many carbs can I eat on keto?",
        a: "Usually under 50 g of net carbs a day, and many people aim for 20–30 g. Net carbs are total carbs minus fibre.",
      },
      {
        q: "How much protein do I need on keto?",
        a: "About 1.6–2.2 g per kilogram of body weight a day. Too little protein costs muscle; the fat share is the flexible part of the diet.",
      },
      {
        q: "Is keto safe?",
        a: "For most healthy adults it is safe short-term, but it is a medical diet for epilepsy and it does not suit everyone — pregnancy, kidney or liver disease, and some medications need a doctor's input first.",
      },
    ],
  },
  {
    slug: "intermittent-fasting-calculator",
    name: "Intermittent Fasting Calculator",
    category: "Health & Fitness",
    short: "Fasting and eating windows for 16:8, 18:6, 20:4 and 5:2 schedules.",
    keywords:
      "intermittent fasting calculator, fasting window calculator, 16:8 fasting calculator, fasting schedule calculator, eating window calculator",
    inputs: [
      selectInput("plan", "Fasting plan", "16:8", [
        ["16:8", "16:8 — fast 16 hours, eat in 8"],
        ["18:6", "18:6 — fast 18 hours, eat in 6"],
        ["20:4", "20:4 — fast 20 hours, eat in 4"],
        ["14:10", "14:10 — fast 14 hours, eat in 10 (gentle start)"],
      ]),
      textInput("start", "When does your eating window start? (24-hour, e.g. 12:00)", "12:00"),
    ],
    compute: (v) => {
      const plan = String(v.plan ?? "16:8");
      const start = parseTime(String(v.start ?? ""));
      if (!Number.isFinite(start)) {
        return [{ label: "Eating window", value: "Enter a start time like 12:00" }];
      }
      const [fastH, eatH] = plan.split(":").map(Number);
      const eatStart = start;
      const eatEnd = start + eatH! * 60;
      const fastEnd = eatEnd + fastH! * 60;
      return [
        { label: "Eating window", value: `${timeString(eatStart)} – ${timeString(eatEnd)}` },
        { label: "Fasting window", value: `${timeString(eatEnd)} – ${timeString(fastEnd)}` },
        { label: "Fasting hours", value: `${fastH} hours a day` },
        { label: "Eating hours", value: `${eatH} hours a day` },
        { label: "Next fast starts", value: timeString(eatEnd) },
      ];
    },
    about:
      "Plan an intermittent fasting schedule: pick a plan and the time your eating window starts, and see exactly when to eat and when to fast. In 16:8 you eat during an 8-hour window and fast for the other 16 — for example, eating from noon to 8 PM and fasting overnight. The calculator shows both windows for 14:10, 16:8, 18:6 and 20:4. Fasting does not suit everyone, and it is not a licence to eat anything: what you eat in the window still matters. " + HEALTH_DISCLAIMER,
    formula:
      "Eating window = start time to start time + eating hours. Fasting window = end of the eating window to the next day's start time. For 16:8 starting at noon: eat 12:00 PM – 8:00 PM, fast 8:00 PM – 12:00 PM.",
    example:
      "On 16:8 with an eating window starting at 12:00 PM, you eat from 12:00 PM to 8:00 PM and fast from 8:00 PM until noon the next day.",
    howToUse: [
      "Choose a fasting plan — 16:8 is the usual starting point.",
      "Enter the time your eating window starts.",
      "Read your eating and fasting windows for the day.",
    ],
    details: [
      {
        heading: "Which plan to start with",
        body: "Start with 14:10 or 16:8 — the gentler plans are much easier to stick to, and most of the benefit comes from simply not snacking late at night. Jumping straight to 20:4 usually ends in a binge and a abandoned plan. Give any plan two weeks before judging it: hunger is strongest in the first few days and fades as your body adapts to the schedule.",
      },
      {
        heading: "What breaks a fast",
        body: "Water, black coffee and plain tea do not break a fast. Anything with calories does — including milk in coffee, juice and “zero-calorie” drinks that are not truly zero. During the eating window, eat normally: fasting is about when you eat, not a reason to eat twice as much. If you feel dizzy, faint or unwell, eat and stop fasting.",
      },
    ],
    tips: [
      "Start with 14:10 or 16:8 — the gentler plans stick.",
      "Water, black coffee and plain tea are fine while fasting.",
      "Keep the same window every day so your body adapts.",
    ],
    faqs: [
      {
        q: "What is 16:8 intermittent fasting?",
        a: "Eating during an 8-hour window each day and fasting for the other 16 hours — for example, eating from noon to 8 PM and fasting overnight.",
      },
      {
        q: "What can I drink while fasting?",
        a: "Water, black coffee and plain tea. Anything with calories — milk, juice, sugary drinks — breaks the fast.",
      },
      {
        q: "Is intermittent fasting safe?",
        a: "For most healthy adults, yes. It does not suit children, pregnancy, eating disorders, diabetes on medication, or anyone who feels unwell while fasting — talk to a doctor first.",
      },
      {
        q: "Do I need to count calories while fasting?",
        a: "Fasting controls when you eat, not how much. If you eat more in the window than you used to eat all day, you will still gain weight.",
      },
    ],
  },
  {
    slug: "calorie-deficit-calculator",
    name: "Calorie Deficit Calculator",
    category: "Health & Fitness",
    short: "Your daily calorie target for a chosen deficit — with a safety check.",
    keywords:
      "calorie deficit calculator, calories to lose weight, deficit calories calculator, daily calorie target, calorie deficit for weight loss",
    inputs: [
      sexSelect(),
      numberInput("age", "Age", "30"),
      { key: "cm", label: "Height", def: "180", suffix: "cm" },
      { key: "kg", label: "Weight", def: "90", suffix: "kg" },
      selectInput("act", "Activity level", "1.55", ACTIVITY),
      selectInput("deficit", "Daily calorie deficit", "500", [
        ["250", "250 kcal (gentle — about 0.25 kg/week)"],
        ["500", "500 kcal (steady — about 0.5 kg/week)"],
        ["750", "750 kcal (brisk — about 0.75 kg/week)"],
        ["1000", "1,000 kcal (maximum — about 1 kg/week)"],
      ]),
    ],
    compute: (v) => {
      const sex = String(v.sex ?? "m");
      const age = N(v.age);
      const cm = N(v.cm);
      const kg = N(v.kg);
      const act = N(v.act) || 1.55;
      const deficit = N(v.deficit) || 500;
      const maintenance = bmr(sex, kg, cm, age) * act;
      const target = maintenance - deficit;
      const weeklyLoss = (deficit * 7) / 7700;
      const safeFloor = sex === "f" ? 1200 : 1500;
      return [
        { label: "Daily calorie target", value: `${fmt(target, 0)} kcal` },
        { label: "Maintenance calories", value: `${fmt(maintenance, 0)} kcal / day` },
        { label: "Daily deficit", value: `${fmt(deficit, 0)} kcal` },
        { label: "Expected loss", value: `About ${m(weeklyLoss, 2)} kg / week` },
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
      "Work out how many calories to eat each day to lose weight at the rate you choose. The calculator finds your maintenance calories from the Mifflin-St Jeor equation, then subtracts your chosen daily deficit — one kilogram of body fat stores about 7,700 kcal, so a 500 kcal daily deficit loses about 0.5 kg a week. A target under 1,200 kcal a day (women) or 1,500 kcal (men) is flagged: that low should only be planned with a professional. " + HEALTH_DISCLAIMER,
    formula:
      "BMR (Mifflin-St Jeor): men 10 × kg + 6.25 × cm − 5 × age + 5; women the same with −161. Maintenance = BMR × activity factor. Target = maintenance − deficit. Weekly loss = deficit × 7 ÷ 7,700 kg.",
    example:
      "A 30-year-old man, 180 cm, 90 kg, moderately active, with a 500 kcal deficit: maintenance is 2,914 kcal a day, the target is 2,414 kcal a day, and the expected loss is about 0.45 kg a week.",
    howToUse: [
      "Enter your sex, age, height, weight and activity level.",
      "Choose your daily deficit — 500 kcal is the usual steady rate.",
      "Read your daily calorie target and check the safety note.",
    ],
    details: [
      {
        heading: "Why 500 kcal is the usual deficit",
        body: "A 500 kcal daily deficit adds up to 3,500 kcal a week, which is roughly 0.45 kg of fat — fast enough to see progress, small enough to sustain. Bigger deficits work faster on paper but are harder to live with: hunger, tiredness and muscle loss all rise, and most people give up. A deficit you can keep for months beats a bigger one you keep for a week.",
      },
      {
        heading: "Why the scale does not fall in a straight line",
        body: "Water, glycogen and food in the gut can swing your weight by a kilogram day to day, and as you get lighter your maintenance calories fall, so the same target produces a smaller deficit over time. Weigh yourself at the same time of day several times a week and trust the trend over two or three weeks, not any single reading — and re-run this calculator every few kilograms.",
      },
    ],
    tips: [
      "500 kcal a day is the usual steady deficit — about 0.5 kg a week.",
      "Weigh yourself several times a week and trust the trend, not one reading.",
      "Re-run the numbers every few kilograms — maintenance falls as you lose.",
    ],
    faqs: [
      {
        q: "What is a calorie deficit?",
        a: "Eating fewer calories than your body burns in a day. The shortfall is covered by stored fat, so you lose weight. A 500 kcal daily deficit loses about 0.5 kg a week.",
      },
      {
        q: "How big should my calorie deficit be?",
        a: "500 kcal a day is the usual steady choice. 250 is gentler, 750–1,000 is the maximum most people should attempt — and only if the target stays above 1,200 kcal (women) or 1,500 kcal (men).",
      },
      {
        q: "Why is my target below 1,200 calories flagged?",
        a: "Below 1,200 kcal (women) or 1,500 kcal (men) a day it is hard to get enough nutrients, and the plan should be supervised by a doctor or dietitian.",
      },
      {
        q: "How fast will I lose weight?",
        a: "Roughly deficit × 7 ÷ 7,700 kg a week — 500 kcal a day is about 0.45 kg a week. Water weight makes the first weeks look faster, then it settles.",
      },
    ],
  },
];
