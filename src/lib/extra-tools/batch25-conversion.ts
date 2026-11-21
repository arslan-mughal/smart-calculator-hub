// Batch 25 — conversion tools: dedicated length converter, currency
// converter (live rates via a server function), and cm ↔ feet/inches.
import type { Calc } from "../tool-types";
import { fmt } from "../calculators";
import { N } from "./shared";

const m = (n: number) => fmt(n, 2);

const LENGTH_UNITS: [string, string, number][] = [
  ["µm", "Micrometres", 0.000001],
  ["mm", "Millimetres", 0.001],
  ["cm", "Centimetres", 0.01],
  ["m", "Metres", 1],
  ["km", "Kilometres", 1000],
  ["in", "Inches", 0.0254],
  ["ft", "Feet", 0.3048],
  ["yd", "Yards", 0.9144],
  ["mi", "Miles", 1609.344],
  ["nmi", "Nautical miles", 1852],
];

export const CURRENCIES: [string, string][] = [
  ["USD", "US Dollar (USD)"],
  ["EUR", "Euro (EUR)"],
  ["GBP", "British Pound (GBP)"],
  ["JPY", "Japanese Yen (JPY)"],
  ["AUD", "Australian Dollar (AUD)"],
  ["CAD", "Canadian Dollar (CAD)"],
  ["CHF", "Swiss Franc (CHF)"],
  ["CNY", "Chinese Yuan (CNY)"],
  ["INR", "Indian Rupee (INR)"],
  ["NZD", "New Zealand Dollar (NZD)"],
  ["SEK", "Swedish Krona (SEK)"],
  ["NOK", "Norwegian Krone (NOK)"],
  ["DKK", "Danish Krone (DKK)"],
  ["PLN", "Polish Zloty (PLN)"],
  ["CZK", "Czech Koruna (CZK)"],
  ["HUF", "Hungarian Forint (HUF)"],
  ["ILS", "Israeli Shekel (ILS)"],
  ["KRW", "South Korean Won (KRW)"],
  ["SGD", "Singapore Dollar (SGD)"],
  ["HKD", "Hong Kong Dollar (HKD)"],
  ["MXN", "Mexican Peso (MXN)"],
  ["BRL", "Brazilian Real (BRL)"],
  ["ZAR", "South African Rand (ZAR)"],
  ["TRY", "Turkish Lira (TRY)"],
  ["AED", "UAE Dirham (AED)"],
  ["SAR", "Saudi Riyal (SAR)"],
  ["THB", "Thai Baht (THB)"],
  ["MYR", "Malaysian Ringgit (MYR)"],
  ["IDR", "Indonesian Rupiah (IDR)"],
  ["PHP", "Philippine Peso (PHP)"],
  ["VND", "Vietnamese Dong (VND)"],
  ["PKR", "Pakistani Rupee (PKR)"],
  ["BDT", "Bangladeshi Taka (BDT)"],
  ["NGN", "Nigerian Naira (NGN)"],
  ["KES", "Kenyan Shilling (KES)"],
  ["EGP", "Egyptian Pound (EGP)"],
  ["QAR", "Qatari Riyal (QAR)"],
  ["KWD", "Kuwaiti Dinar (KWD)"],
];

export const batch25ConversionTools: Calc[] = [
  {
    slug: "length-converter",
    name: "Length Converter",
    category: "Conversion",
    short: "Convert length between metric and imperial units — metres, feet, miles and more.",
    keywords:
      "length converter, convert length, meters to feet, cm to inches, km to miles, length conversion calculator, mm to inches",
    popular: true,
    inputs: [
      { key: "x", label: "Value", def: "1" },
      {
        key: "u",
        label: "From unit",
        type: "select",
        def: "m",
        options: LENGTH_UNITS.map(([v, l]) => ({ v, l: `${l} (${v})` })),
      },
    ],
    compute: (v) => {
      const factors = Object.fromEntries(LENGTH_UNITS.map(([s, , f]) => [s, f]));
      const metres = N(v.x) * (factors[String(v.u)] ?? 1);
      return LENGTH_UNITS.map(([symbol, label, factor]) => ({
        label: `${label} (${symbol})`,
        value: `${fmt(metres / factor, 8)} ${symbol}`,
      }));
    },
    about:
      "A length converter turns a measurement in one unit into every other common unit at once — metric and imperial side by side, from micrometres to nautical miles. It is the tool for converting heights, distances, fabric, room dimensions and road trips without working through the factors by hand. Every equivalent is shown together, so you can read off the one you need and compare units at a glance.",
    formula:
      "Convert the input to metres first, then divide by the target unit's size in metres. 1 inch = 2.54 cm exactly, 1 foot = 0.3048 m, 1 yard = 0.9144 m, 1 mile = 1,609.344 m and 1 nautical mile = 1,852 m.",
    example:
      "1 metre = 100 cm = 39.37007874 inches = 3.2808399 feet = 1.0936133 yards = 0.0006213712 miles. A marathon (42.195 km) is 26.2188 miles.",
    howToUse: [
      "Enter the length you want to convert.",
      "Choose the unit it is currently in — metres, feet, inches, miles and more.",
      "Read the equivalent in every other unit. The result updates as you type.",
      "Use Reset to return to the example values.",
    ],
    details: [
      {
        heading: "Metric vs imperial",
        body: "The metric system is decimal: 10 millimetres make a centimetre, 100 centimetres make a metre and 1,000 metres make a kilometre. The imperial system is not: 12 inches make a foot, 3 feet make a yard and 1,760 yards make a mile. That is why converting between the systems needs a calculator — the factors are awkward (an inch is exactly 2.54 cm by international agreement, and a foot is exactly 0.3048 m).",
      },
      {
        heading: "Everyday conversions to remember",
        body: "A few equivalents cover most daily needs: 1 inch ≈ 2.54 cm, 1 foot ≈ 30.48 cm, 1 metre ≈ 3.28 feet, 1 kilometre ≈ 0.62 miles, and 1 mile ≈ 1.61 km. For height, 5 feet 10 inches is 177.8 cm. For running, a 5K is 3.11 miles and a 10K is 6.21 miles.",
      },
    ],
    tips: [
      "1 inch is exactly 2.54 cm by definition — every other imperial conversion follows from it.",
      "For heights, convert to total inches first, then divide by 12 for feet and inches.",
      "A nautical mile (1,852 m) is used at sea and in the air; a land mile is 1,609.344 m.",
    ],
    faqs: [
      {
        q: "How many centimetres are in a foot?",
        a: "Exactly 30.48 cm. A foot is defined as 0.3048 metres, so 12 inches × 2.54 cm = 30.48 cm.",
      },
      {
        q: "How many kilometres are in a mile?",
        a: "1.609344 km. A quick estimate is to multiply miles by 1.6, or divide kilometres by 1.6 to get miles.",
      },
      {
        q: "What is a nautical mile?",
        a: "1,852 metres — one minute of latitude. It is used in navigation because it relates directly to the Earth's geometry, unlike the land mile.",
      },
    ],
  },
  {
    slug: "currency-converter",
    name: "Currency Converter",
    category: "Conversion",
    short: "Convert money between world currencies at live exchange rates.",
    keywords:
      "currency converter, convert currency, exchange rate calculator, usd to eur, dollar to euro converter, live exchange rates, money converter",
    popular: true,
    custom: "currency-converter",
    inputs: [
      { key: "amount", label: "Amount", def: "100" },
      {
        key: "from",
        label: "From currency",
        type: "select",
        def: "USD",
        options: CURRENCIES.map(([v, l]) => ({ v, l })),
      },
      {
        key: "to",
        label: "To currency",
        type: "select",
        def: "EUR",
        options: CURRENCIES.map(([v, l]) => ({ v, l })),
      },
    ],
    compute: () => [],
    about:
      "A currency converter turns an amount in one currency into another at the current exchange rate. Rates are fetched live from a free exchange-rate service when you open the page, cached for an hour, and shown with the date they were published. If the rate service is unreachable, the converter says so clearly instead of showing a stale or invented figure. Rates move through the day, and banks and card providers add their own margin on top — so use the result as a guide for travel, shopping and budgeting, and check the rate your provider will actually apply before sending money.",
    formula:
      "Converted amount = amount × (rate of target currency ÷ rate of source currency), where both rates are quoted against the US dollar. The rates are mid-market rates — the midpoint between buy and sell prices.",
    example:
      "Converting $100 to euros at a rate of 0.92 EUR per USD gives €92. The same $100 at a rate of 0.85 GBP per USD gives £85. The exact figures change with the live rate shown on the page.",
    howToUse: [
      "Enter the amount of money you want to convert.",
      "Choose the currency it is in, then the currency you want to convert to.",
      "Check the converted amount and the exchange rate used, plus the date the rate was published.",
      "Try different amounts — the conversion updates instantly.",
    ],
    details: [
      {
        heading: "What is the mid-market rate?",
        body: "The mid-market rate is the midpoint between the buy and sell prices on the foreign-exchange market — the rate banks use with each other. It is the fairest reference rate, but it is not the rate you get as a customer: banks, card networks and money-transfer services add a margin, typically 1–3%, and sometimes a fixed fee. A converter showing the mid-market rate will therefore show slightly more than you actually receive.",
      },
      {
        heading: "Why rates change",
        body: "Exchange rates move constantly while markets are open, driven by interest-rate decisions, inflation data, trade flows and political news. A rate that is right in the morning can be different by the afternoon. For large transfers, the timing of the conversion can matter as much as the amount — but predicting short-term moves is not possible, so treat the rate as a snapshot, not a forecast.",
      },
    ],
    tips: [
      "Compare the total cost, not just the rate — fees can outweigh a good rate on small amounts.",
      "Avoid converting at airports and hotels; their margins are usually the worst.",
      "For travel, a card with no foreign-transaction fee often beats exchanging cash.",
    ],
    faqs: [
      {
        q: "Are the exchange rates live?",
        a: "Yes — rates are fetched from a free exchange-rate service when the page loads and are cached for about an hour. The date of the rate is shown on the page, so you can see how fresh it is.",
      },
      {
        q: "Why does my bank give me a different amount?",
        a: "Banks and card providers add a margin to the mid-market rate and sometimes charge a fee. The converter shows the mid-market reference rate, which is the fairest comparison point but not the rate you will actually receive.",
      },
      {
        q: "What happens if the rates cannot be loaded?",
        a: "The converter shows a clear message instead of a number. Check your connection and try again — it never shows a stale or invented rate as if it were live.",
      },
    ],
  },
  {
    slug: "cm-to-feet-and-inches-converter",
    name: "Cm to Feet and Inches Converter",
    category: "Conversion",
    short: "Convert centimetres to feet and inches — for heights and measurements.",
    keywords:
      "cm to feet and inches, cm to feet converter, cm to inches, height in cm to feet, 180 cm in feet, centimetres to feet and inches",
    inputs: [{ key: "cm", label: "Centimetres", def: "180" }],
    compute: (v) => {
      const totalInches = N(v.cm) / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = totalInches - feet * 12;
      return [
        { label: "Feet and inches", value: `${feet} ft ${fmt(inches, 2)} in` },
        { label: "Total inches", value: fmt(totalInches, 2) + " in" },
        { label: "Total feet (decimal)", value: fmt(totalInches / 12, 4) + " ft" },
        { label: "Metres", value: fmt(N(v.cm) / 100, 4) + " m" },
      ];
    },
    about:
      "Convert a height or length in centimetres into feet and inches — the way heights are usually written in the US and UK. Enter the centimetres and the result shows the feet-and-inches figure (for example 180 cm is 5 ft 10.87 in), plus the total in inches and in decimal feet. It is the quick way to read a metric height in imperial terms, for people, furniture, doorways and anything else measured in centimetres.",
    formula:
      "Inches = centimetres ÷ 2.54. Feet = floor(inches ÷ 12); remaining inches = inches − feet × 12. One inch is exactly 2.54 cm.",
    example: "180 cm ÷ 2.54 = 70.87 inches, which is 5 feet and 10.87 inches. 170 cm is 5 ft 6.93 in, and 200 cm is 6 ft 6.74 in.",
    howToUse: [
      "Enter the length in centimetres.",
      "Read the feet-and-inches result — the headline figure.",
      "Check the total inches or decimal feet if you need the measurement in a single unit.",
    ],
    details: [
      {
        heading: "Common heights in cm and feet",
        body: "150 cm is 4 ft 11 in; 160 cm is 5 ft 3 in; 170 cm is 5 ft 7 in; 175 cm is 5 ft 9 in; 180 cm is 5 ft 11 in; 185 cm is 6 ft 1 in; 190 cm is 6 ft 3 in; and 200 cm is 6 ft 7 in. The average adult man is around 175 cm (5 ft 9 in) in the US, and the average adult woman around 162 cm (5 ft 4 in).",
      },
      {
        heading: "Why 2.54?",
        body: "An inch is defined as exactly 2.54 centimetres by international agreement, so the conversion is exact, not approximate. That is why dividing centimetres by 2.54 gives a precise inch figure, and why the feet-and-inches result is reliable to two decimal places.",
      },
    ],
    tips: [
      "Measure height without shoes, standing straight against a wall, for a true figure.",
      "Round the inches to the nearest whole number for everyday use — 10.87 in is usually written as 5 ft 11 in.",
      "For building work, keep the decimal inches — rounding early adds up across a room.",
    ],
    faqs: [
      {
        q: "How tall is 180 cm in feet and inches?",
        a: "5 feet 10.87 inches — usually written as 5 ft 11 in. 180 ÷ 2.54 = 70.87 inches, and 70.87 inches is 5 feet (60 inches) plus 10.87 inches.",
      },
      {
        q: "How do I convert cm to feet in my head?",
        a: "Divide the centimetres by 30 to get approximate feet (180 ÷ 30 = 6 ft, close to the true 5 ft 11 in). For a better estimate, divide by 30.48.",
      },
      {
        q: "Is 5 ft 11 in the same as 180 cm?",
        a: "Very nearly — 5 ft 11 in is 180.34 cm, so 180 cm is just under 5 ft 11 in.",
      },
    ],
  },
  {
    slug: "feet-and-inches-to-cm-converter",
    name: "Feet and Inches to Cm Converter",
    category: "Conversion",
    short: "Convert feet and inches to centimetres and metres.",
    keywords:
      "feet and inches to cm, feet to cm converter, inches to cm, height in feet to cm, 5ft 10in in cm, ft in to cm",
    inputs: [
      { key: "ft", label: "Feet", def: "5" },
      { key: "in", label: "Inches", def: "10" },
    ],
    compute: (v) => {
      const totalInches = N(v.ft) * 12 + N(v.in);
      return [
        { label: "Centimetres", value: fmt(totalInches * 2.54, 2) + " cm" },
        { label: "Metres", value: fmt((totalInches * 2.54) / 100, 4) + " m" },
        { label: "Total inches", value: fmt(totalInches, 2) + " in" },
        { label: "Millimetres", value: fmt(totalInches * 25.4, 1) + " mm" },
      ];
    },
    about:
      "Convert a height or length in feet and inches into centimetres and metres. Enter the feet and the inches separately and the result shows the metric equivalent — 5 ft 10 in is 177.8 cm, for example — plus the total in inches and millimetres. It is the reverse of the centimetres-to-feet converter, for forms, medical records, product listings and anything else that needs a metric figure.",
    formula: "Total inches = feet × 12 + inches. Centimetres = total inches × 2.54. Metres = centimetres ÷ 100.",
    example:
      "5 ft 10 in = 70 inches × 2.54 = 177.8 cm = 1.778 m. 6 ft = 72 inches = 182.88 cm. 5 ft 4 in = 64 inches = 162.56 cm.",
    howToUse: [
      "Enter the feet — the whole number before the inches.",
      "Enter the inches — the remainder after the feet.",
      "Read the result in centimetres, with metres and millimetres below.",
    ],
    details: [
      {
        heading: "Common heights in feet and centimetres",
        body: "5 ft 0 in is 152.4 cm; 5 ft 4 in is 162.56 cm; 5 ft 7 in is 170.18 cm; 5 ft 10 in is 177.8 cm; 6 ft 0 in is 182.88 cm; and 6 ft 3 in is 190.5 cm. Each extra inch adds exactly 2.54 cm, so you can work out any height by adding 2.54 cm per inch to a figure you know.",
      },
      {
        heading: "When forms ask for centimetres",
        body: "Medical forms, visa applications, clothing sizes and many product listings ask for height in centimetres. Measure in feet and inches first if that is easier, then convert — and round to the nearest whole centimetre, since a fraction of a centimetre is smaller than the error in most measurements.",
      },
    ],
    tips: [
      "One inch is exactly 2.54 cm, so the conversion is exact.",
      "Round to the nearest whole centimetre for forms — 177.8 cm is usually written as 178 cm.",
      "If you only know the total inches, use the Length Converter instead.",
    ],
    faqs: [
      {
        q: "How many cm is 5 ft 10 in?",
        a: "177.8 cm. 5 ft 10 in is 70 inches, and 70 × 2.54 = 177.8 cm.",
      },
      {
        q: "How do I convert feet to cm in my head?",
        a: "Multiply the feet by 30 for a rough answer (6 ft ≈ 180 cm, true value 182.88 cm). For a better estimate, multiply by 30.48.",
      },
      {
        q: "What is 6 feet in metres?",
        a: "1.8288 metres — usually written as 1.83 m.",
      },
    ],
  },
];
