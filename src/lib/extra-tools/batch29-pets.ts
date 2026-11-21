// Batch 29 — pet calculators: Puppy Weight Predictor, Dog Life
// Expectancy Calculator, Dog Pregnancy Calculator, Chocolate Toxicity
// Calculator, Raw Feeding Calculator, Pet Insurance Calculator.
//
// All six are plain form tools in the existing "Random Tools" catch-all
// category (same precedent as the sun/moon tool in v2.6) — no new
// category. The models live in src/lib/pets.ts and are stated on each
// tool page. Every result is an estimate; the chocolate and insurance
// tools carry their disclaimers in the page copy.
import type { Calc } from "../tool-types";
import { fmt } from "../calculators";
import { N } from "./shared";
import {
  CHOCOLATE_TYPES,
  SIZE_LABELS,
  chocolateToxicity,
  dogDueDate,
  dogLifeExpectancy,
  petInsuranceEstimate,
  predictPuppyAdultWeight,
  rawFeedingDailyGrams,
  type SizeBand,
} from "../pets";

const m = (n: number, d = 1) => fmt(n, d);
const dateFmt = (d: Date | null) =>
  d
    ? d.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC", // dogDueDate() returns UTC calendar dates
      })
    : "—";

const SIZE_OPTIONS: { v: string; l: string }[] = (Object.keys(SIZE_LABELS) as SizeBand[]).map((v) => ({
  v,
  l: SIZE_LABELS[v],
}));

const sizeSelect = (key: string, label: string, def: string) => ({
  key,
  label,
  type: "select" as const,
  def,
  options: SIZE_OPTIONS,
});

export const batch29PetTools: Calc[] = [
  {
    slug: "puppy-weight-predictor",
    name: "Puppy Weight Predictor",
    category: "Random Tools",
    short: "Estimate your puppy's adult weight from its current weight and age.",
    keywords:
      "puppy weight predictor, how big will my puppy get, puppy adult weight calculator, puppy growth calculator",
    inputs: [
      { key: "kg", label: "Current weight (kg)", def: "6" },
      { key: "age", label: "Current age (months)", def: "4" },
      sizeSelect("size", "Breed size", "medium"),
    ],
    compute: (v) => {
      const kg = N(v.kg);
      const age = N(v.age);
      if (!(kg > 0) || !(age > 0)) return [{ label: "Adult weight", value: "Enter a weight and an age above zero" }];
      const r = predictPuppyAdultWeight(kg, age, (v.size as SizeBand) || "medium");
      return [
        { label: "Estimated adult weight", value: `${m(r.adultKg)} kg` },
        { label: "Likely range", value: `${m(r.lowKg)} – ${m(r.highKg)} kg` },
        { label: "Fully grown at about", value: `${r.maturityMonths} months` },
        { label: "Grown so far", value: `${Math.round(r.fractionNow * 100)}% of adult weight` },
      ];
    },
    about:
      "Estimate how big your puppy will grow: enter its current weight, its age in months and its breed size, and the predictor works out its likely adult weight from typical growth curves. Small breeds finish growing at about 12 months, medium breeds at 14, large breeds at 18 and giant breeds at 24 — and a puppy is only part-grown at each age, so the current weight is scaled up by the fraction of growth already done. The result is an estimate: genetics, food and health all move the real number.",
    formula:
      "Adult weight = current weight ÷ fraction of adult weight reached at this age (for example, a 6-month-old medium puppy has reached about 55% of its adult weight).",
    example:
      "A 4-month-old medium puppy weighing 6 kg is about 35% grown, so its estimated adult weight is about 17 kg (likely range 15–19 kg).",
    howToUse: [
      "Enter your puppy's current weight in kilograms.",
      "Enter its age in months and pick its breed size.",
      "Read the estimated adult weight and the likely range.",
    ],
    details: [
      {
        heading: "How the estimate works",
        body: "Growth is not linear: puppies grow fastest in the first months and slow down as they approach adult size. The predictor uses a growth curve per size band — the fraction of adult weight a puppy of that size has typically reached at each age — and divides the current weight by that fraction. The range shown is ±10% around the estimate, because individual dogs vary.",
      },
      {
        heading: "When the estimate is least reliable",
        body: "For mixed-breed puppies, where the adult size band is a guess, and for very young puppies under 8 weeks, where a small weighing error becomes a large adult-weight error. Weigh the puppy on the same scale each time, and re-check the estimate as it grows — the prediction gets better with age.",
      },
    ],
    tips: [
      "Pick the size band from the expected adult size, not the puppy's current size.",
      "Re-run the estimate monthly — it gets more accurate as the puppy grows.",
      "A vet can give a better estimate from the puppy's breed and build.",
    ],
    faqs: [
      {
        q: "How big will my puppy get?",
        a: "Enter its current weight, age and breed size and this tool estimates its adult weight from typical growth curves — for example, a 4-month-old medium puppy at 6 kg is heading for about 17 kg.",
      },
      {
        q: "How accurate is a puppy weight predictor?",
        a: "It is an estimate, usually within about 10% for purebred puppies weighed accurately. Mixed breeds and very young puppies are harder to predict.",
      },
      {
        q: "When do puppies stop growing?",
        a: "Small breeds finish at about 12 months, medium breeds at 14, large breeds at 18 and giant breeds at about 24 months.",
      },
    ],
  },
  {
    slug: "dog-life-expectancy-calculator",
    name: "Dog Life Expectancy Calculator",
    category: "Random Tools",
    short: "How long do dogs live? Life expectancy by breed size and age.",
    keywords:
      "dog life expectancy, how long do dogs live, dog lifespan calculator, dog age expectancy, how long will my dog live",
    inputs: [
      sizeSelect("size", "Breed size", "medium"),
      { key: "age", label: "Current age (years)", def: "3" },
    ],
    compute: (v) => {
      const age = Math.max(0, N(v.age));
      const r = dogLifeExpectancy((v.size as SizeBand) || "medium", age);
      return [
        { label: "Expected lifespan", value: `${m(r.median)} years` },
        { label: "Typical range", value: `${m(r.low)} – ${m(r.high)} years` },
        { label: "Remaining years (estimate)", value: `${m(r.remainingYears)} years` },
      ];
    },
    about:
      "How long do dogs live? It depends mostly on size: small dogs typically live 12–16 years, medium dogs 10–13, large dogs 9–11 and giant dogs 7–9. Enter your dog's breed size and current age for its expected lifespan and the years it likely has left. The figures are published breed-size medians — an estimate, not a promise: weight, genetics, diet and veterinary care all move the real number.",
    formula: "",
    example:
      "A 3-year-old medium dog has an expected lifespan of about 11.5 years (typical range 10–13), leaving about 8.5 years.",
    howToUse: [
      "Pick your dog's breed size.",
      "Enter its current age in years.",
      "Read the expected lifespan, the typical range and the remaining years.",
    ],
    details: [
      {
        heading: "Why size matters so much",
        body: "It is one of the clearest patterns in veterinary science: within dogs, larger breeds age faster and die younger than smaller ones — the opposite of the pattern across species. A 5 kg dog may live 15 years while a 50 kg dog of the same age is already old at 8. The gap is mostly about how fast large dogs grow and how much wear their bodies accumulate.",
      },
      {
        heading: "What moves the number",
        body: "Keeping a dog lean adds years — overweight dogs live measurably shorter lives. Breed matters inside a size band too (some breeds are prone to specific diseases), and regular vet care, dental care and exercise all help. The estimate here is a starting point, not a verdict.",
      },
    ],
    tips: [
      "Keeping your dog at a healthy weight is the biggest factor you control.",
      "The range matters more than the single number — most dogs land inside it.",
      "Ask your vet about your specific breed's common health issues.",
    ],
    faqs: [
      {
        q: "How long do dogs live on average?",
        a: "About 10–13 years overall, but it depends on size: small dogs 12–16 years, medium 10–13, large 9–11 and giant breeds 7–9.",
      },
      {
        q: "Do small dogs live longer than big dogs?",
        a: "Yes — it is one of the clearest patterns in dogs. Small breeds routinely outlive giant breeds by five or more years.",
      },
      {
        q: "How can I help my dog live longer?",
        a: "Keep it lean, exercise it daily, keep up with vet check-ups and dental care, and know your breed's common health problems so they are caught early.",
      },
    ],
  },
  {
    slug: "dog-pregnancy-calculator",
    name: "Dog Pregnancy Calculator",
    category: "Random Tools",
    short: "When is my dog due? Whelping date from the mating date.",
    keywords:
      "dog pregnancy calculator, dog due date calculator, when is my dog due, dog gestation calculator, dog whelping date",
    inputs: [{ key: "date", label: "Mating date", type: "date" as const, def: "2026-11-21" }],
    compute: (v) => {
      const r = dogDueDate(String(v.date ?? ""));
      if (!r.due) return [{ label: "Due date", value: "Enter a valid mating date" }];
      return [
        { label: "Expected due date", value: dateFmt(r.due) },
        { label: "Normal range", value: `${dateFmt(r.earliest)} – ${dateFmt(r.latest)}` },
        { label: "Ultrasound check (day 28)", value: dateFmt(r.ultrasound) },
        { label: "X-ray count (day 45)", value: dateFmt(r.xray) },
        { label: "Prepare the whelping box (day 56)", value: dateFmt(r.nesting) },
      ];
    },
    about:
      "When is your dog due? Enter the mating date and the calculator counts forward 63 days — the standard dog gestation — and gives the expected whelping date, the normal range (61–65 days), and the milestone dates: an ultrasound at day 28, an X-ray to count puppies at day 45, and preparing the whelping box at day 56. The dates are a guide for planning vet visits, not a substitute for veterinary care.",
    formula: "Due date = mating date + 63 days (normal range 61–65 days).",
    example:
      "A mating on 1 November gives an expected due date of 3 January (range 1–5 January), with the ultrasound on 29 November.",
    howToUse: [
      "Enter the mating date (or the ovulation date if you know it).",
      "Read the expected due date and the normal range.",
      "Use the milestone dates to plan vet visits.",
    ],
    details: [
      {
        heading: "Why 63 days",
        body: "Dog gestation is 63 days from ovulation, and mating usually happens within a day or two of ovulation, so 63 days from mating is the standard count. The normal range is 61–65 days; puppies born before day 58 rarely survive, and a pregnancy past day 66 needs a vet. If the mating date is uncertain, an ultrasound at day 28 gives a better estimate.",
      },
      {
        heading: "Signs labour is near",
        body: "A temperature drop below 37.2 °C (99 °F), restlessness, nesting, loss of appetite and panting usually mean labour within 24 hours. Have your vet's emergency number ready, and call if strong contractions last more than 30 minutes without a puppy, or if labour stalls for over two hours between puppies.",
      },
    ],
    tips: [
      "Count from the mating date — 63 days is the standard.",
      "Book the day-28 ultrasound to confirm the pregnancy and estimate the litter.",
      "Have your vet's emergency number ready before the due date.",
    ],
    faqs: [
      {
        q: "How long are dogs pregnant?",
        a: "63 days from mating, on average — the normal range is 61 to 65 days.",
      },
      {
        q: "When can a vet confirm a dog pregnancy?",
        a: "An ultrasound can confirm it from about day 28, and an X-ray can count the puppies from about day 45.",
      },
      {
        q: "What if my dog goes past her due date?",
        a: "A pregnancy past 66 days needs a vet — call yours rather than waiting. Puppies born before day 58 rarely survive.",
      },
    ],
  },
  {
    slug: "chocolate-toxicity-calculator",
    name: "Chocolate Toxicity Calculator",
    category: "Random Tools",
    short: "Is chocolate poisonous for dogs? Theobromine dose from what was eaten.",
    keywords:
      "chocolate toxicity calculator, chocolate poisonous dogs, dog ate chocolate calculator, theobromine calculator, dog chocolate poisoning",
    popular: true,
    inputs: [
      { key: "kg", label: "Dog's weight (kg)", def: "15" },
      {
        key: "type",
        label: "Chocolate type",
        type: "select" as const,
        def: "milk",
        options: CHOCOLATE_TYPES.map((t) => ({ v: t.v, l: t.l })),
      },
      { key: "grams", label: "Amount eaten (grams)", def: "100" },
    ],
    compute: (v) => {
      const kg = N(v.kg);
      const grams = N(v.grams);
      if (!(kg > 0) || !(grams > 0)) {
        return [{ label: "Theobromine dose", value: "Enter your dog's weight and the amount eaten" }];
      }
      const r = chocolateToxicity(kg, String(v.type ?? "milk"), grams);
      return [
        { label: "Theobromine dose", value: `${m(r.doseMgPerKg, 2)} mg per kg of body weight` },
        { label: "Total theobromine", value: `${m(r.totalMg, 2)} mg` },
        { label: "Risk level", value: r.level === "none" ? "Negligible" : r.level === "mild" ? "Mild" : r.level === "moderate" ? "Moderate" : r.level === "serious" ? "Serious" : "Severe — emergency" },
        { label: "What to do", value: r.advice },
      ];
    },
    about:
      "Is chocolate poisonous for dogs? Yes — the theobromine in chocolate is toxic to dogs, and the dose depends on the dog's weight, the type of chocolate and how much was eaten. This calculator works out the theobromine dose in mg per kg of body weight and the risk level, using the published theobromine contents (milk chocolate 2.3 mg/g, dark chocolate 5.3 mg/g, baker's chocolate 16 mg/g, cocoa powder 28.5 mg/g) and the published dose bands. This is an estimate only — not veterinary advice. If your dog ate chocolate, call your vet immediately, especially for anything above a mild dose.",
    formula:
      "Dose (mg/kg) = grams eaten × theobromine per gram ÷ dog's weight in kg. Under 20 mg/kg is mild, 20–40 moderate, 40–60 serious, over 60 potentially fatal.",
    example:
      "A 15 kg dog that eats 100 g of milk chocolate takes in 230 mg of theobromine — 15.3 mg/kg, a mild dose. The same amount of cocoa powder would be 190 mg/kg, a severe dose.",
    howToUse: [
      "Enter your dog's weight in kilograms.",
      "Pick the type of chocolate and how many grams were eaten.",
      "Read the dose, the risk level — and call your vet if it is anything above mild.",
    ],
    details: [
      {
        heading: "Why chocolate is toxic to dogs",
        body: "Chocolate contains theobromine, a stimulant dogs break down far more slowly than humans do. It builds up in their system, overstimulating the heart and nervous system. Dark chocolate and cocoa powder are far more dangerous than milk chocolate because they contain much more theobromine per gram — 100 g of cocoa powder carries more theobromine than 1 kg of milk chocolate.",
      },
      {
        heading: "Symptoms to watch for",
        body: "Vomiting and diarrhoea usually come first (within 6–12 hours), then restlessness, excessive thirst and panting, a rapid heart rate, tremors and, at high doses, seizures. Symptoms can take hours to appear, so do not wait for them — call your vet as soon as you know chocolate was eaten, and tell them the dog's weight, the type and the amount.",
      },
    ],
    tips: [
      "Call your vet immediately — do not wait for symptoms to appear.",
      "Tell the vet the dog's weight, the chocolate type and the amount eaten.",
      "Dark chocolate and cocoa powder are far more dangerous than milk chocolate.",
    ],
    faqs: [
      {
        q: "How much chocolate is toxic to a dog?",
        a: "It depends on the dog's weight and the chocolate type. Under 20 mg of theobromine per kg of body weight is mild; over 60 mg/kg is potentially fatal. A 15 kg dog eating 100 g of dark chocolate is already at a moderate dose.",
      },
      {
        q: "My dog ate chocolate — what should I do?",
        a: "Call your vet immediately, even if your dog seems fine — symptoms can take hours to appear. Tell them the dog's weight, the chocolate type and how much was eaten.",
      },
      {
        q: "Is white chocolate dangerous for dogs?",
        a: "Barely — white chocolate has only about 0.25 mg of theobromine per gram. It can still upset a dog's stomach, but it is far less dangerous than milk, dark or baker's chocolate.",
      },
    ],
  },
  {
    slug: "raw-feeding-calculator",
    name: "Raw Feeding Calculator",
    category: "Random Tools",
    short: "How much raw food per day? Daily raw feeding amount for your dog.",
    keywords:
      "raw feeding calculator, how much raw food dog, barf feeding calculator, raw dog food amount, raw feeding chart",
    inputs: [
      { key: "kg", label: "Dog's weight (kg)", def: "20" },
      {
        key: "stage",
        label: "Life stage",
        type: "select" as const,
        def: "adult",
        options: [
          { v: "adult", l: "Adult" },
          { v: "puppy", l: "Puppy" },
        ],
      },
      {
        key: "activity",
        label: "Activity level",
        type: "select" as const,
        def: "moderate",
        options: [
          { v: "low", l: "Low — mostly resting" },
          { v: "moderate", l: "Moderate — daily walks and play" },
          { v: "high", l: "High — working or very active" },
        ],
      },
    ],
    compute: (v) => {
      const kg = N(v.kg);
      if (!(kg > 0)) return [{ label: "Daily amount", value: "Enter your dog's weight above zero" }];
      const r = rawFeedingDailyGrams(kg, v.stage === "puppy" ? "puppy" : "adult", (v.activity as "low" | "moderate" | "high") || "moderate");
      return [
        { label: "Daily raw food", value: `${Math.round(r.gramsPerDay)} g per day` },
        { label: "Feeding rate", value: `${r.percent}% of body weight` },
        { label: "Per meal", value: `${Math.round(r.gramsPerDay / r.mealsPerDay)} g × ${r.mealsPerDay} meals` },
        { label: "Weekly amount", value: `${m((r.gramsPerDay * 7) / 1000, 2)} kg per week` },
      ];
    },
    about:
      "How much raw food should a dog eat per day? The standard raw-feeding rule is 2–3% of body weight per day for an adult dog — 2% for low activity, 2.5% for moderate, 3% for a very active or working dog — and about 6% for a puppy. Enter your dog's weight, life stage and activity level for the daily amount in grams, split across meals, and the weekly total. The result is an estimate: adjust it if your dog gains or loses weight, and ask your vet before changing diets.",
    formula: "Daily raw food = body weight × feeding rate (2% low, 2.5% moderate, 3% high activity; about 6% for puppies).",
    example:
      "A 20 kg moderately active adult dog needs 2.5% of its weight — 500 g of raw food per day, or 250 g per meal over two meals.",
    howToUse: [
      "Enter your dog's weight in kilograms.",
      "Pick adult or puppy, and the activity level.",
      "Read the daily amount, the per-meal amount and the weekly total.",
    ],
    details: [
      {
        heading: "The 2–3% rule",
        body: "Raw feeding (BARF) is usually measured as a percentage of body weight because a dog's energy needs scale with size. The 2–3% range covers most adults; puppies need much more relative to their weight because they are growing. The percentages are a starting point — a dog that gains weight on 2.5% should drop to 2%, and one that loses weight should go up.",
      },
      {
        heading: "What counts as raw food",
        body: "A balanced raw diet is not just muscle meat: it includes raw meaty bones, organs (about 10% of the diet, half of it liver) and a small amount of vegetables. An all-meat diet without bones or organs is unbalanced and can cause deficiencies. If you are new to raw feeding, ask your vet or a canine nutritionist to check the diet.",
      },
    ],
    tips: [
      "Weigh your dog monthly and adjust the percentage if its weight drifts.",
      "Split the daily amount into two meals for adults, three for puppies.",
      "Raw diets need bones and organs too — meat alone is not balanced.",
    ],
    faqs: [
      {
        q: "How much raw food should I feed my dog?",
        a: "About 2–3% of body weight per day for an adult dog (2% low activity, 2.5% moderate, 3% high), and about 6% for a puppy. A 20 kg moderately active dog needs about 500 g per day.",
      },
      {
        q: "How many meals a day for a raw-fed dog?",
        a: "Two meals for adults, three for puppies. Split the daily amount evenly between meals.",
      },
      {
        q: "Is raw food better than kibble?",
        a: "There is no strong evidence either way. What matters is that the diet is complete and balanced — raw diets need bones and organs, not just meat. Ask your vet before switching.",
      },
    ],
  },
  {
    slug: "pet-insurance-calculator",
    name: "Pet Insurance Calculator",
    category: "Random Tools",
    short: "Estimate a monthly pet insurance premium — dog or cat, by age and cover.",
    keywords:
      "pet insurance calculator, pet insurance cost, dog insurance price, cat insurance cost, pet insurance estimate",
    inputs: [
      {
        key: "species",
        label: "Pet",
        type: "select" as const,
        def: "dog",
        options: [
          { v: "dog", l: "Dog" },
          { v: "cat", l: "Cat" },
        ],
      },
      {
        key: "size",
        label: "Breed size (dogs)",
        type: "select" as const,
        def: "medium",
        options: [
          { v: "small", l: "Small breed" },
          { v: "medium", l: "Medium breed" },
          { v: "large", l: "Large breed" },
          { v: "giant", l: "Giant breed" },
        ],
      },
      { key: "age", label: "Pet's age (years)", def: "3" },
      {
        key: "coverage",
        label: "Cover",
        type: "select" as const,
        def: "standard",
        options: [
          { v: "accident", l: "Accident only" },
          { v: "standard", l: "Accident + illness" },
          { v: "premium", l: "Accident + illness + wellness" },
        ],
      },
      {
        key: "location",
        label: "Area",
        type: "select" as const,
        def: "average",
        options: [
          { v: "average", l: "US average" },
          { v: "high", l: "High-cost area" },
          { v: "low", l: "Lower-cost area" },
        ],
      },
    ],
    compute: (v) => {
      const age = Math.max(0, N(v.age));
      const r = petInsuranceEstimate(
        v.species === "cat" ? "cat" : "dog",
        (v.size as SizeBand) || "medium",
        age,
        String(v.coverage ?? "standard"),
        String(v.location ?? "average"),
      );
      return [
        { label: "Estimated premium", value: `$${m(r.monthly, 2)} per month` },
        { label: "Likely range", value: `$${m(r.low, 2)} – $${m(r.high, 2)} per month` },
        { label: "Per year", value: `$${m(r.yearly, 2)}` },
      ];
    },
    about:
      "Estimate a monthly pet insurance premium before you get quotes: pick the pet (dog or cat), breed size, age, level of cover and area, and the calculator works out a rough monthly price from published US market averages — base premiums of about $45–$75 a month for dogs and $30 for cats, adjusted for age (older pets cost more), cover (accident-only is cheapest, wellness cover is dearest) and area. This is an estimate only, not a quote: real premiums depend on the insurer, the breed, pre-existing conditions and the excess you choose.",
    formula: "",
    example:
      "A 3-year-old medium dog with accident + illness cover in an average-cost area comes out at about $55 a month (likely range $44–$66).",
    howToUse: [
      "Pick dog or cat, breed size and age.",
      "Choose the level of cover and your area.",
      "Read the estimated monthly premium and the likely range.",
    ],
    details: [
      {
        heading: "How the estimate is built",
        body: "From a base monthly premium per species and size, multiplied by three factors: age (under 1 year ×0.9, 1–3 years ×1.0, 4–6 ×1.15, 7–9 ×1.35, 10 and over ×1.6), cover (accident-only ×0.55, accident + illness ×1.0, plus wellness ×1.25) and area (average ×1.0, high-cost ×1.15, lower-cost ×0.9). The range shown is ±20% around the result. Every factor is shown on the page, so you can see exactly what the estimate assumes.",
      },
      {
        heading: "What really decides the price",
        body: "The breed (some breeds are far more expensive to insure), pre-existing conditions (usually excluded or priced in), the excess and the reimbursement percentage you choose, and the insurer. Two quotes for the same pet can differ by 50% or more, so use this estimate to sanity-check quotes, then get three real ones.",
      },
    ],
    tips: [
      "Insure a pet young — premiums rise with age and pre-existing conditions are excluded.",
      "Compare the excess and reimbursement rate, not just the monthly price.",
      "Get three real quotes — this estimate is for orientation only.",
    ],
    faqs: [
      {
        q: "How much is pet insurance?",
        a: "Roughly $45–$75 a month for a dog and about $30 for a cat in the US, before age, breed and cover adjustments. Older pets and fuller cover cost more.",
      },
      {
        q: "Is pet insurance worth it?",
        a: "It depends on the pet and your savings. One emergency surgery can cost several thousand dollars — insurance is for the bill you could not pay out of pocket, not for routine care.",
      },
      {
        q: "Why do premiums rise with age?",
        a: "Older pets get sick more often and their treatment costs more, so insurers price that in. Insuring a pet while it is young locks in lower rates.",
      },
    ],
  },
];
