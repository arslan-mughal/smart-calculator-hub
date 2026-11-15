import type { Calc } from "../tool-types";
import { M, N, lines, numberInput, selectInput, textArea, textInput, tool, words } from "../extra-tools/shared";

const cookingUnits: [string, string, number][] = [
  ["ml", "Millilitres", 1],
  ["tsp", "US teaspoons", 4.92892159375],
  ["tbsp", "US tablespoons", 14.78676478125],
  ["fl oz", "US fluid ounces", 29.5735295625],
  ["cup", "US cups", 236.5882365],
  ["pt", "US pints", 473.176473],
  ["qt", "US quarts", 946.352946],
  ["l", "Litres", 1000],
  ["gal", "US gallons", 3785.411784],
];

const transferUnits: [string, string, number][] = [
  ["bit/s", "Bits per second", 1],
  ["kbit/s", "Kilobits per second", 1000],
  ["Mbit/s", "Megabits per second", 1000000],
  ["Gbit/s", "Gigabits per second", 1000000000],
  ["B/s", "Bytes per second", 8],
  ["kB/s", "Kilobytes per second", 8000],
  ["MB/s", "Megabytes per second", 8000000],
  ["GB/s", "Gigabytes per second", 8000000000],
];

const statusCodes: Record<string, { title: string; className: string; meaning: string; action: string }> = {
  "200": { title: "OK", className: "2xx Success", meaning: "The request succeeded and the response contains the requested representation.", action: "Return the resource or result normally; use a more specific code when another better describes the outcome." },
  "201": { title: "Created", className: "2xx Success", meaning: "The request succeeded and resulted in one or more new resources.", action: "Include a Location header identifying the new resource where appropriate." },
  "204": { title: "No Content", className: "2xx Success", meaning: "The request succeeded but there is no response body to send.", action: "Useful for successful deletion or updates that need no returned representation." },
  "301": { title: "Moved Permanently", className: "3xx Redirection", meaning: "The target resource has been assigned a new permanent URI.", action: "Update links to the Location target; user agents may change POST to GET on subsequent requests." },
  "302": { title: "Found", className: "3xx Redirection", meaning: "The resource temporarily resides at a different URI.", action: "Keep the original URI for future requests; use 307 when the method must not change." },
  "304": { title: "Not Modified", className: "3xx Redirection", meaning: "A conditional request shows the cached representation is still current.", action: "Reuse the cached response; a 304 must not contain a message body." },
  "400": { title: "Bad Request", className: "4xx Client Error", meaning: "The server cannot process the request because of perceived malformed syntax or invalid framing.", action: "Correct the request before retrying; do not repeat it unchanged." },
  "401": { title: "Unauthorized", className: "4xx Client Error", meaning: "The request lacks valid authentication credentials for the target resource.", action: "Authenticate and retry; despite its name, this status concerns authentication rather than permission." },
  "403": { title: "Forbidden", className: "4xx Client Error", meaning: "The server understood the request but refuses to authorise it.", action: "Check permissions; re-authenticating may not help when the identity is already known." },
  "404": { title: "Not Found", className: "4xx Client Error", meaning: "The origin server found no current representation for the target URI or is unwilling to disclose one.", action: "Check the address or resource identifier; a 404 does not state whether the condition is permanent." },
  "409": { title: "Conflict", className: "4xx Client Error", meaning: "The request conflicts with the current state of the target resource.", action: "Resolve the state or versioning conflict before resubmitting." },
  "410": { title: "Gone", className: "4xx Client Error", meaning: "The target resource is no longer available and this condition is likely permanent.", action: "Remove stale links where appropriate; clients may treat the target as permanently unavailable." },
  "429": { title: "Too Many Requests", className: "4xx Client Error", meaning: "The client has sent too many requests in a given amount of time.", action: "Back off and honour any Retry-After header before trying again." },
  "500": { title: "Internal Server Error", className: "5xx Server Error", meaning: "The server encountered an unexpected condition that prevented it fulfilling the request.", action: "Inspect server logs and dependencies; this generic code does not identify the underlying fault." },
  "502": { title: "Bad Gateway", className: "5xx Server Error", meaning: "A gateway or proxy received an invalid response from an upstream server.", action: "Check upstream health, protocol compatibility and proxy configuration." },
  "503": { title: "Service Unavailable", className: "5xx Server Error", meaning: "The server is temporarily unable to handle the request, often due to overload or maintenance.", action: "Retry later with backoff and respect Retry-After when supplied." },
  "504": { title: "Gateway Timeout", className: "5xx Server Error", meaning: "A gateway or proxy did not receive a timely response from an upstream server.", action: "Investigate upstream latency, connectivity and timeout limits before increasing thresholds blindly." },
};

function ipToNumber(ip: string) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((x) => !Number.isInteger(x) || x < 0 || x > 255)) return null;
  return parts.reduce((value, octet) => ((value << 8) | octet) >>> 0, 0) >>> 0;
}
function numberToIp(value: number) {
  return [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join(".");
}

export const nextConversionTextDeveloperTools: Calc[] = [
  tool({
    slug: "cooking-measurement-converter",
    name: "Cooking Measurement Converter",
    category: "Conversion",
    short: "Convert US teaspoons, tablespoons, cups, fluid ounces, pints, quarts, gallons and metric volumes.",
    keywords: "cooking measurement converter, cups to ml, tablespoons to teaspoons, recipe converter, kitchen volume converter",
    inputs: [numberInput("x", "Volume", "2"), selectInput("u", "From unit", "cup", cookingUnits.map(([symbol, label]) => [symbol, label]))],
    compute: (v) => {
      const factors = Object.fromEntries(cookingUnits.map(([symbol, , factor]) => [symbol, factor]));
      const ml = N(v.x) * (factors[String(v.u)] ?? 1);
      return [
        { label: "Millilitres", value: M(ml, 3) + " ml" },
        { label: "US teaspoons", value: M(ml / 4.92892159375, 4) + " tsp" },
        { label: "US tablespoons", value: M(ml / 14.78676478125, 4) + " tbsp" },
        { label: "US fluid ounces", value: M(ml / 29.5735295625, 4) + " fl oz" },
        { label: "US cups", value: M(ml / 236.5882365, 5) + " cups" },
        { label: "US pints / quarts", value: `${M(ml / 473.176473, 4)} pt / ${M(ml / 946.352946, 4)} qt` },
        { label: "Litres / US gallons", value: `${M(ml / 1000, 5)} L / ${M(ml / 3785.411784, 5)} gal` },
      ];
    },
    about: "Recipe volume units vary between countries and measuring systems. This converter uses exact standard relationships for US customary teaspoons, tablespoons, fluid ounces, cups, pints, quarts and gallons, then shows their metric equivalents. It is intended for liquid and bulk volume measurements, not direct conversion between volume and weight, which depends on the ingredient's density and how it is packed.",
    howToUse: ["Enter the recipe quantity and select the unit written in the source recipe.", "Choose a convenient equivalent, using millilitres for precision or spoons and cups for kitchen measures.", "For dry ingredients given by weight, use a kitchen scale or an ingredient-specific density converter instead of treating grams as millilitres."],
    details: [
      { heading: "US cups are not the same as every other cup", body: "A US customary cup is 236.588 ml, a US legal nutrition-labelling cup is 240 ml, and a metric cup used in several countries is 250 ml. This page specifically uses the US customary cup. Check the origin of a recipe before assuming that every cup, pint or fluid ounce has the same conversion." },
      { heading: "Volume does not convert universally to weight", body: "One cup of water weighs about 237 grams, but one cup of flour, honey or chopped nuts weighs something different. Aeration, particle size and packing change bulk density. For baking, weighing the ingredient usually gives more repeatable results than converting its volume into spoons or estimating grams." },
    ],
    formula: "Convert to millilitres with the source unit's ml factor, then divide by the target unit's ml factor. US: 3 tsp = 1 tbsp; 2 tbsp = 1 fl oz; 8 fl oz = 1 cup.",
    example: "Two US cups equal 473.176 ml, 32 tablespoons, 96 teaspoons, 16 US fluid ounces or one US pint.",
    tips: ["Level dry measuring cups with a straight edge for consistent volume.", "Do not confuse US fluid ounces with ounces of weight.", "For small strong-flavoured quantities, use measuring spoons rather than converting to a tiny cup fraction."],
    faqs: [
      { q: "How many millilitres are in a US cup?", a: "One US customary cup is 236.5882365 ml. It differs from a 250 ml metric cup and a 240 ml US legal cup used in nutrition labelling." },
      { q: "How many tablespoons are in half a cup?", a: "There are 8 US tablespoons in half a US customary cup, because one cup contains 16 tablespoons." },
      { q: "Can I convert cups directly to grams here?", a: "No universal conversion exists. Grams measure mass while cups measure volume, so the ingredient and its density or packing must be specified." },
    ],
  }),
  tool({
    slug: "fuel-economy-converter",
    name: "Fuel Economy Converter",
    category: "Conversion",
    short: "Convert km/L, L/100km, US MPG and UK MPG with the correct reciprocal relationship.",
    keywords: "fuel economy converter, mpg to l 100km, km l to mpg, us mpg uk mpg, fuel consumption converter",
    inputs: [numberInput("x", "Fuel economy or consumption", "30"), selectInput("u", "Input unit", "mpgus", [["kmpl", "Kilometres per litre (km/L)"], ["l100", "Litres per 100 km (L/100km)"], ["mpgus", "US miles per gallon"], ["mpguk", "UK miles per gallon"]])],
    compute: (v) => {
      const x = N(v.x);
      if (x <= 0) return [{ label: "Result", value: "Enter a value greater than zero" }];
      const kmpl = v.u === "kmpl" ? x : v.u === "l100" ? 100 / x : v.u === "mpgus" ? x / 2.352145833 : x / 2.824809363;
      return [
        { label: "Kilometres per litre", value: M(kmpl, 5) + " km/L" },
        { label: "Litres per 100 km", value: M(100 / kmpl, 5) + " L/100km" },
        { label: "US miles per gallon", value: M(kmpl * 2.352145833, 5) + " MPG" },
        { label: "UK miles per gallon", value: M(kmpl * 2.824809363, 5) + " MPG" },
        { label: "Fuel used per 1,000 km", value: M(1000 / kmpl, 3) + " L" },
      ];
    },
    about: "Fuel economy is expressed as distance per unit of fuel in some markets and fuel per unit of distance in others. Because these are reciprocal measures, higher MPG or km/L means better efficiency while higher L/100km means greater consumption. This converter handles US and imperial gallons separately and adds the fuel required for a 1,000 km journey.",
    howToUse: ["Enter the vehicle figure and select exactly which unit the source uses.", "Compare the desired output, taking care to distinguish US MPG from UK MPG.", "For real trip estimates, use fuel consumed and distance travelled under comparable driving conditions rather than only a laboratory rating."],
    details: [
      { heading: "Why the conversion is not a simple multiplier", body: "Converting MPG to L/100km requires both unit conversion and inversion. Thirty US MPG does not equal thirty times a fixed L/100km factor; it is 235.214583 ÷ 30, or about 7.84 L/100km. Similarly, moving from 10 to 5 L/100km halves fuel use, while moving from 10 to 5 km/L doubles it." },
      { heading: "US and imperial gallons differ", body: "A US liquid gallon is 3.785411784 litres, whereas an imperial gallon is 4.54609 litres. The same vehicle therefore has a larger numerical UK MPG than US MPG. Never compare official economy figures without checking the gallon standard and the underlying test cycle." },
    ],
    formula: "km/L = 100 ÷ (L/100km). US MPG = km/L × 2.352145833. UK MPG = km/L × 2.824809363. L/100km = 100 ÷ km/L.",
    example: "30 US MPG is about 12.754 km/L, 7.841 L/100km or 36.034 UK MPG. At that consumption, a 1,000 km journey uses approximately 78.406 litres.",
    tips: ["Lower L/100km is better; higher MPG and km/L are better.", "Confirm whether an advertised MPG figure uses US or imperial gallons.", "Weather, load, tyres, speed and congestion can make real consumption differ from test figures."],
    faqs: [
      { q: "How do I convert US MPG to L/100km?", a: "Divide 235.214583 by the US MPG value. For example, 30 MPG converts to approximately 7.841 L/100km." },
      { q: "Why is UK MPG higher than US MPG?", a: "The imperial gallon is larger, so a vehicle can travel more miles per imperial gallon than per US gallon at the same actual efficiency." },
      { q: "Is fuel economy the same as fuel consumption?", a: "They describe reciprocal quantities. Economy is distance per fuel amount; consumption is fuel amount per distance." },
    ],
  }),
  tool({
    slug: "data-transfer-rate-converter",
    name: "Data Transfer Rate Converter",
    category: "Conversion",
    short: "Convert bits and bytes per second and estimate download time for a chosen file size.",
    keywords: "data transfer rate converter, mbps to mb s, internet speed converter, download time calculator, bits to bytes per second",
    inputs: [numberInput("x", "Transfer rate", "100"), selectInput("u", "Rate unit", "Mbit/s", transferUnits.map(([symbol, label]) => [symbol, label])), numberInput("size", "File size for time estimate", "1", "GB")],
    compute: (v) => {
      const factors = Object.fromEntries(transferUnits.map(([symbol, , factor]) => [symbol, factor]));
      const bits = N(v.x) * (factors[String(v.u)] ?? 1), bytes = bits / 8;
      const seconds = bytes > 0 ? (N(v.size) * 8000000000) / bits : Number.NaN;
      return [
        { label: "Megabits per second", value: M(bits / 1000000, 5) + " Mbit/s" },
        { label: "Megabytes per second", value: M(bytes / 1000000, 5) + " MB/s" },
        { label: "Gigabits per second", value: M(bits / 1000000000, 5) + " Gbit/s" },
        { label: "Gigabytes per second", value: M(bytes / 1000000000, 5) + " GB/s" },
        { label: `Ideal time for ${M(N(v.size), 3)} GB`, value: Number.isFinite(seconds) ? `${M(seconds, 2)} seconds (${M(seconds / 60, 2)} minutes)` : "Enter a positive transfer rate" },
      ];
    },
    about: "Network speeds are usually advertised in bits per second, while file sizes and transfer monitors often use bytes per second. One byte contains eight bits, so 100 megabits per second corresponds to 12.5 megabytes per second before overhead. This converter covers decimal bit and byte units and adds an ideal download-time estimate for a decimal-gigabyte file.",
    howToUse: ["Enter the speed and choose bits or bytes carefully; capital B denotes bytes.", "Add a file size in decimal GB to see the theoretical transfer time at the full entered rate.", "Allow extra time for protocol overhead, server limits, Wi-Fi conditions, congestion and other traffic."],
    details: [
      { heading: "Megabits and megabytes are different", body: "The abbreviation Mb means megabits and MB means megabytes, an eightfold difference at the same decimal prefix. Internet service is commonly sold in Mbit/s, while operating systems may display downloads in MB/s or MiB/s. This page uses decimal units consistently: 1 GB = 8,000,000,000 bits and 1 MB = 1,000,000 bytes." },
      { heading: "Why real downloads take longer", body: "The time estimate assumes the entire capacity is continuously available to one transfer. Packet headers, retransmissions, encryption, server throughput, storage speed and network contention reduce useful throughput. It also uses decimal GB, not GiB; one GiB is about 7.37% larger than one GB." },
    ],
    formula: "Bytes per second = bits per second ÷ 8. Ideal seconds = file size in GB × 8,000,000,000 ÷ rate in bits per second.",
    example: "At 100 Mbit/s, the byte rate is 12.5 MB/s. A 1 GB file takes 80 seconds in the ideal decimal model, before network and protocol overhead.",
    tips: ["Check capitalisation: bit/s and B/s are not interchangeable.", "Use a sustained transfer rate rather than a momentary speed-test peak for planning.", "For GiB files, multiply the decimal-GB estimate by 1.073741824."],
    faqs: [
      { q: "Is 100 Mbps the same as 100 MB/s?", a: "No. 100 Mbit/s is 12.5 MB/s because there are eight bits in a byte. Capitalisation and the /s unit are essential." },
      { q: "Does this use binary or decimal units?", a: "Decimal. kbit, Mbit, kB and MB use powers of 1,000. Binary MiB and GiB are different units and are not used in the displayed estimate." },
      { q: "Why is my actual speed lower?", a: "The result is theoretical. Server limits, Wi-Fi quality, congestion, protocol overhead and device performance can all reduce real throughput." },
    ],
  }),
  tool({
    slug: "frequency-converter",
    name: "Frequency Converter",
    category: "Conversion",
    short: "Convert hertz, kilohertz, megahertz, gigahertz and RPM, with the corresponding wave period.",
    keywords: "frequency converter, hz to khz, mhz to hz, rpm to hz, frequency period calculator",
    inputs: [numberInput("x", "Frequency", "120"), selectInput("u", "Input unit", "MHz", [["Hz", "Hertz (Hz)"], ["kHz", "Kilohertz (kHz)"], ["MHz", "Megahertz (MHz)"], ["GHz", "Gigahertz (GHz)"], ["rpm", "Revolutions per minute (RPM)"]])],
    compute: (v) => {
      const factor: Record<string, number> = { Hz: 1, kHz: 1000, MHz: 1000000, GHz: 1000000000, rpm: 1 / 60 };
      const hz = N(v.x) * (factor[String(v.u)] ?? 1);
      return [
        { label: "Hertz", value: M(hz, 6) + " Hz" },
        { label: "Kilohertz", value: M(hz / 1000, 8) + " kHz" },
        { label: "Megahertz", value: M(hz / 1000000, 8) + " MHz" },
        { label: "Gigahertz", value: M(hz / 1000000000, 8) + " GHz" },
        { label: "Revolutions per minute", value: M(hz * 60, 5) + " RPM" },
        { label: "Period", value: hz > 0 ? `${M(1 / hz, 10)} seconds (${M(1000 / hz, 8)} ms)` : "Enter a positive frequency" },
      ];
    },
    about: "Frequency counts repeated cycles per unit time. The hertz (Hz) is one cycle per second, with decimal multiples used for audio, radio, processors and other signals. Rotational speed is often written in revolutions per minute, which converts to hertz by dividing by 60. This page also gives period, the duration of one complete cycle.",
    howToUse: ["Enter the frequency and choose its unit, including RPM for one revolution per cycle.", "Read the desired decimal frequency equivalent or rotational speed.", "Use the period output for timing; frequency must be greater than zero for a finite cycle duration."],
    details: [
      { heading: "Frequency and period are reciprocals", body: "A signal at 100 Hz completes 100 cycles each second, so one cycle lasts 1/100 second or 10 milliseconds. Doubling frequency halves the period. Period here is measured from one point on a waveform to the equivalent point on the next cycle and does not depend on amplitude." },
      { heading: "RPM assumes one cycle per revolution", body: "Dividing RPM by 60 gives revolutions per second. In machinery with several identical events per revolution, such as ignition pulses or gear teeth, event frequency can be RPM ÷ 60 multiplied by the number of events per revolution. The converter's RPM output refers specifically to revolutions themselves." },
    ],
    formula: "1 kHz = 1,000 Hz; 1 MHz = 1,000,000 Hz; 1 GHz = 1,000,000,000 Hz. Hz = RPM ÷ 60. Period T = 1 ÷ frequency in Hz.",
    example: "120 MHz is 120,000,000 Hz or 0.12 GHz. Its period is 1 ÷ 120,000,000 seconds, approximately 8.333 nanoseconds.",
    tips: ["Keep uppercase and lowercase prefixes straight: m means milli while M means mega.", "Use positive frequency when calculating period.", "For rotating equipment, account for multiple pulses per revolution when measuring event frequency."],
    faqs: [
      { q: "How many Hz are in one MHz?", a: "One megahertz equals 1,000,000 hertz. The prefix mega represents one million in SI units." },
      { q: "How do I convert RPM to Hz?", a: "Divide RPM by 60 to obtain revolutions per second. For example, 3,600 RPM equals 60 Hz." },
      { q: "What is the period of 50 Hz?", a: "Period is the reciprocal of frequency: 1 ÷ 50 = 0.02 seconds, or 20 milliseconds." },
    ],
  }),
  tool({
    slug: "paragraph-counter",
    name: "Paragraph Counter",
    category: "Text Tools",
    short: "Count paragraphs, sentences and words, with average paragraph and sentence lengths.",
    keywords: "paragraph counter, sentence counter, words per paragraph, text analysis tool, average sentence length",
    inputs: [textArea("text", "Text", "Writing clearly helps readers understand complex ideas. Short paragraphs create useful visual breaks.\n\nEach paragraph should develop one main point. A consistent structure makes longer documents easier to scan.")],
    compute: (v) => {
      const text = String(v.text ?? ""), paragraphs = text.split(/\n\s*\n/).filter((part) => part.trim());
      const wordCount = words(text).length;
      const sentenceCount = text.split(/[.!?]+/).filter((part) => part.trim()).length;
      return [
        { label: "Paragraphs", value: M(paragraphs.length, 0) },
        { label: "Sentences", value: M(sentenceCount, 0) },
        { label: "Words", value: M(wordCount, 0) },
        { label: "Average words per paragraph", value: M(paragraphs.length ? wordCount / paragraphs.length : 0, 1) },
        { label: "Average words per sentence", value: M(sentenceCount ? wordCount / sentenceCount : 0, 1) },
        { label: "Average sentences per paragraph", value: M(paragraphs.length ? sentenceCount / paragraphs.length : 0, 1) },
      ];
    },
    about: "Paragraph and sentence counts reveal more about a draft than total word count alone. This analyser separates paragraphs at blank lines, estimates sentences from terminal punctuation, and calculates average lengths. Those ratios provide a quick editorial signal for dense writing, although quality depends on rhythm, purpose and audience rather than hitting a universal word target.",
    howToUse: ["Paste prose with a blank line between paragraphs, then check that the paragraph total matches the document structure.", "Review words per paragraph and words per sentence to identify unusually dense sections.", "Inspect long averages in the original text; split ideas only where doing so improves clarity and flow."],
    details: [
      { heading: "How paragraphs are recognised", body: "A paragraph is a non-empty block separated by one or more blank lines. A single line break does not start a new paragraph in this counter. When pasting from a document editor, preserving blank lines gives the most accurate result; soft-wrapped visual lines are not counted as separate paragraphs." },
      { heading: "Sentence counting is an estimate", body: "The counter treats full stops, question marks and exclamation marks as sentence boundaries. Abbreviations, decimals, initials and unusual punctuation can affect the total. Averages are therefore best used as editorial indicators, not linguistic measurements. Compare several paragraphs manually before making sweeping style changes." },
    ],
    formula: "Average words per paragraph = total words ÷ non-empty paragraph blocks. Average sentence length = total words ÷ punctuation-delimited sentences.",
    example: "A 600-word draft with 12 paragraphs and 30 sentences averages 50 words per paragraph, 20 words per sentence and 2.5 sentences per paragraph.",
    tips: ["Keep blank lines between paragraphs when pasting.", "Use averages to locate density, not to impose an arbitrary style score.", "Vary sentence length deliberately; uniform sentences can feel monotonous even when the average looks ideal."],
    faqs: [
      { q: "Does a single new line create a paragraph?", a: "No. This tool uses blank-line-separated blocks, matching common plain-text paragraph formatting. Single line breaks stay within the same paragraph." },
      { q: "Are bullet lists counted accurately?", a: "List items may not end in sentence punctuation and may be separated by single rather than blank lines, so paragraph and sentence averages can be less meaningful for lists." },
      { q: "What is a good average sentence length?", a: "There is no universal ideal. General web copy often benefits from varied, readable sentences, but audience and subject matter matter more than a fixed number." },
    ],
  }),
  tool({
    slug: "line-counter",
    name: "Line Counter",
    category: "Text Tools",
    short: "Count total, non-empty and blank lines, unique lines, longest line and average line length.",
    keywords: "line counter, count lines online, non empty line counter, unique line counter, text line length",
    inputs: [textArea("text", "Text or list", "alpha\nbravo\n\ncharlie\nalpha\ndelta")],
    compute: (v) => {
      const all = lines(v.text), nonEmpty = all.filter((line) => line.trim()), empty = all.length - nonEmpty.length;
      const unique = new Set(all).size;
      const lengths = all.map((line) => line.length), longest = Math.max(0, ...lengths);
      return [
        { label: "Total lines", value: M(all.length, 0) },
        { label: "Non-empty lines", value: M(nonEmpty.length, 0) },
        { label: "Blank or whitespace-only lines", value: M(empty, 0) },
        { label: "Unique lines", value: M(unique, 0) },
        { label: "Longest line", value: M(longest, 0) + " characters" },
        { label: "Average characters per line", value: M(all.length ? lengths.reduce((a, b) => a + b, 0) / all.length : 0, 1) },
        { label: "Duplicate non-empty lines", value: M(nonEmpty.length - new Set(nonEmpty).size, 0) },
      ];
    },
    about: "Line counts are useful for logs, lists, source data, poetry and plain-text formatting. This counter distinguishes physical lines from non-empty content, identifies blank and duplicate lines, and measures line lengths without changing the input. It works locally, making it suitable for quick checks on lists or log excerpts that should not be uploaded.",
    howToUse: ["Paste text with its original line breaks preserved.", "Use total lines for physical structure and non-empty lines for actual content rows.", "Check unique and duplicate counts before cleaning data, and inspect unusually long lines when preparing fixed-width output."],
    details: [
      { heading: "Blank lines and trailing newlines", body: "Whitespace-only lines count as blank. The counter splits on Windows or Unix newline sequences, so an input ending with a newline can include a final empty line in the physical total. That convention reflects the actual text string rather than silently discarding its trailing separator." },
      { heading: "Exact uniqueness and content uniqueness", body: "Unique-line comparison is exact and case-sensitive, including leading and trailing spaces. The duplicate non-empty measure ignores entirely blank lines but still compares the remaining lines exactly. Normalise case or whitespace first if your data-cleaning rules treat those differences as duplicates." },
    ],
    formula: "Non-empty = lines containing at least one non-whitespace character. Duplicate non-empty lines = non-empty count − distinct exact non-empty lines. Average length = total characters ÷ physical line count.",
    example: "The default six-line example has four non-empty lines, two blank lines and one duplicate non-empty line. The duplicated value is alpha.",
    tips: ["Remove surrounding whitespace first when comparing semantic rather than exact duplicates.", "Check the trailing-newline convention when reconciling counts with another editor.", "Character counts reflect JavaScript string length and may differ from displayed grapheme counts for some Unicode symbols."],
    faqs: [
      { q: "Are lines with spaces considered empty?", a: "No content means no non-whitespace characters, so a line containing only spaces or tabs is counted as blank." },
      { q: "Are duplicate checks case-sensitive?", a: "Yes. Apple and apple are different lines unless you convert the text to a consistent case first." },
      { q: "Why does my count include an extra empty line?", a: "Text ending in a newline has an empty segment after that final separator. The physical total includes it, while the non-empty total does not." },
    ],
  }),
  tool({
    slug: "remove-punctuation",
    name: "Remove Punctuation",
    category: "Text Tools",
    short: "Strip punctuation and symbols while preserving letters, numbers, line breaks and optional apostrophes.",
    keywords: "remove punctuation, punctuation remover, clean text online, strip symbols from text, text normalizer",
    inputs: [textArea("text", "Text", "Hello, world! It's a useful text-cleaning tool — isn't it?"), selectInput("mode", "Apostrophes", "keep", [["keep", "Keep straight and curly apostrophes"], ["remove", "Remove apostrophes too"]])],
    compute: (v) => {
      const text = String(v.text ?? "");
      const result = v.mode === "keep" ? text.replace(/[^\p{L}\p{N}\s'’]/gu, "") : text.replace(/[^\p{L}\p{N}\s]/gu, "");
      return [
        { label: "Cleaned text", value: result },
        { label: "Characters removed", value: M(text.length - result.length, 0) },
        { label: "Words remaining", value: M(words(result).length, 0) },
        { label: "Line breaks preserved", value: M(lines(result).length - 1, 0) },
      ];
    },
    about: "Removing punctuation can prepare text for keyword comparison, simple tokenisation, normalised searches or data-cleaning workflows. This tool preserves Unicode letters, numbers and whitespace while removing punctuation and symbol characters. You can retain straight or curly apostrophes for contractions and possessives, or remove them for a stricter letters-and-numbers-only result.",
    howToUse: ["Paste the text and choose whether apostrophes should survive.", "Review the cleaned result before using it in a search index, comparison or downstream transformation.", "Keep the original separately when punctuation carries meaning, such as in code, URLs, decimals or formal writing."],
    details: [
      { heading: "Cleaning is not always harmless normalisation", body: "Punctuation can distinguish 3.14 from 314, an email address from its parts, or a hyphenated identifier from a joined string. This tool is appropriate when those distinctions are intentionally unnecessary. It should not be applied blindly to source code, structured data, passwords, web addresses or numeric values whose separators matter." },
      { heading: "Unicode letters and apostrophes", body: "The expression retains letters and numbers across languages rather than restricting input to A–Z. Keeping apostrophes preserves common contractions such as it's and isn't. Other marks, including hyphens and typographic dashes, are removed without inserting replacement spaces, so hyphenated words can join together." },
    ],
    formula: "Keep every character in Unicode letter, number or whitespace categories, plus apostrophes in keep mode. Remove all other punctuation and symbol characters without changing line structure.",
    example: "With apostrophes kept, “Hello, world! It's 2026.” becomes “Hello world It's 2026”; the sentence punctuation is removed and the original spacing remains.",
    tips: ["Replace punctuation with spaces first if you need to prevent words joining.", "Do not clean structured code, URLs or decimals with a general punctuation stripper.", "Keep a source copy so the transformation remains reversible."],
    faqs: [
      { q: "Does this preserve line breaks?", a: "Yes. Spaces, tabs and newline characters are retained; only characters outside the allowed letter, number, whitespace and selected apostrophe categories are removed." },
      { q: "Will hyphenated words stay separate?", a: "The hyphen is removed rather than replaced by a space, so a hyphenated pair becomes joined. Pre-process with a space if separation is required." },
      { q: "Does it work with accented or non-Latin text?", a: "Yes. Unicode letter and number categories are preserved, rather than limiting the result to English ASCII characters." },
    ],
  }),
  tool({
    slug: "ip-subnet-calculator",
    name: "IP Subnet Calculator",
    category: "Web & Developer",
    short: "Calculate IPv4 network, broadcast, subnet mask, wildcard and usable host range from CIDR notation.",
    keywords: "ip subnet calculator, cidr calculator, ipv4 subnet mask, network address calculator, usable hosts calculator",
    inputs: [textInput("cidr", "IPv4 address with CIDR prefix", "192.168.1.10/24")],
    compute: (v) => {
      const [address, prefix] = String(v.cidr).trim().split("/");
      const cidr = Number(prefix), ip = ipToNumber(address ?? "");
      if (ip === null || !Number.isInteger(cidr) || cidr < 0 || cidr > 32) return [{ label: "Result", value: "Enter a valid IPv4/CIDR value, for example 192.168.1.10/24" }];
      const mask = cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0;
      const network = (ip & mask) >>> 0, broadcast = (network | (~mask >>> 0)) >>> 0;
      const hostCount = cidr <= 30 ? Math.pow(2, 32 - cidr) - 2 : cidr === 31 ? 2 : 1;
      const first = cidr <= 30 ? network + 1 : network, last = cidr <= 30 ? broadcast - 1 : broadcast;
      return [
        { label: "Network address", value: `${numberToIp(network)}/${cidr}` },
        { label: "Subnet mask", value: numberToIp(mask) },
        { label: "Broadcast address", value: cidr <= 30 ? numberToIp(broadcast) : "Not used for /31 or /32" },
        { label: "Usable host range", value: `${numberToIp(first)} – ${numberToIp(last)}` },
        { label: "Usable hosts", value: M(hostCount, 0) },
        { label: "Total addresses", value: M(Math.pow(2, 32 - cidr), 0) },
        { label: "Wildcard mask", value: numberToIp(~mask >>> 0) },
        { label: "Address type", value: (ip >>> 24) === 10 || (ip >>> 20) === 0xac1 || (ip >>> 16) === 0xc0a8 ? "Private RFC1918 range" : "Not in RFC1918 private ranges" },
      ];
    },
    about: "CIDR notation combines an IPv4 address with a prefix length that separates the network and host portions. This calculator applies the subnet mask to find the network and broadcast addresses, usable range, wildcard mask and capacity. It also identifies the three RFC1918 private ranges, helping with router configuration, access rules, documentation and basic network planning.",
    howToUse: ["Enter one IPv4 address followed by a slash and prefix from /0 through /32.", "Use the network address and mask when documenting a subnet, and the usable range when assigning conventional host addresses.", "Check special /31 and /32 behaviour before applying the output to point-to-point links or single-host routes."],
    details: [
      { heading: "Network, host and broadcast roles", body: "For conventional subnets through /30, the first address identifies the network and the last is the broadcast address, leaving total addresses minus two for hosts. A /31 has two addresses and is commonly used on point-to-point links under RFC3021, without conventional network and broadcast host reservations. A /32 identifies one host." },
      { heading: "Private does not mean automatically secure", body: "RFC1918 ranges are 10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16. They are not routed directly on the public internet without translation, but access still needs appropriate segmentation and firewall rules. Addresses outside those ranges can include other special-purpose blocks; this tool labels only RFC1918 membership." },
    ],
    formula: "Network = IP bitwise AND mask. Broadcast = network bitwise OR wildcard. Conventional usable hosts = 2^(32−prefix) − 2; /31 has two point-to-point addresses and /32 has one.",
    example: "192.168.1.10/24 has network 192.168.1.0, mask 255.255.255.0 and broadcast 192.168.1.255. Its usable range is 192.168.1.1–192.168.1.254, containing 254 addresses.",
    tips: ["Keep network and broadcast addresses out of conventional host pools.", "Use /31 only where both ends support point-to-point addressing.", "Plan adjacent subnets without overlapping address ranges."],
    faqs: [
      { q: "How many hosts are in a /24?", a: "A /24 has 256 total addresses and conventionally 254 usable host addresses after excluding network and broadcast." },
      { q: "What is a /32 used for?", a: "It identifies exactly one IPv4 address and is common for host routes, loopbacks and precise firewall rules." },
      { q: "Why does /31 not show a broadcast address?", a: "Under the point-to-point convention, both addresses can be assigned to link endpoints and traditional network/broadcast reservations do not apply." },
    ],
  }),
  tool({
    slug: "decimal-to-binary-converter",
    name: "Decimal to Binary Converter",
    category: "Web & Developer",
    short: "Convert positive or negative decimal integers to binary, octal and hexadecimal with arbitrary precision.",
    keywords: "decimal to binary converter, decimal to hex, decimal to octal, integer base converter, number base conversion",
    inputs: [textInput("n", "Decimal integer", "255")],
    compute: (v) => {
      const input = String(v.n).trim();
      if (!/^[+-]?\d+$/.test(input)) return [{ label: "Result", value: "Enter a whole decimal integer without fractions or exponents" }];
      const n = BigInt(input), negative = n < 0n, absolute = negative ? -n : n;
      const sign = negative ? "−" : "";
      const binary = absolute.toString(2), octal = absolute.toString(8), hex = absolute.toString(16).toUpperCase();
      return [
        { label: "Binary (base 2)", value: sign + binary },
        { label: "Octal (base 8)", value: sign + octal },
        { label: "Hexadecimal (base 16)", value: sign + hex },
        { label: "Decimal check", value: n.toString(10) },
        { label: "Magnitude bit length", value: `${binary.length} bits` },
        { label: "Hex digit grouping", value: sign + (hex.replace(/^0+/, "") || "0").replace(/(.{1,4})(?=(.{4})+$)/g, "$1 ") },
      ];
    },
    about: "Number bases represent the same integer with different positional digits. Binary uses powers of two, octal powers of eight and hexadecimal powers of sixteen. This converter accepts arbitrarily large whole decimal values using integer arithmetic, avoiding the precision loss that ordinary floating-point conversion can introduce beyond JavaScript's safe-integer range. Negative values are shown in sign-and-magnitude notation.",
    howToUse: ["Enter a whole decimal integer, optionally with a leading plus or minus sign.", "Read the binary, octal and uppercase hexadecimal representations of the same magnitude.", "For signed machine arithmetic, separately determine the required fixed bit width and two's-complement representation."],
    details: [
      { heading: "Sign-and-magnitude is not two's complement", body: "The minus sign in the output describes the mathematical integer. It is not the fixed-width two's-complement bit pattern used by most computers for signed values. Two's complement needs a specified width: for example, −1 is 11111111 in 8 bits but 1111111111111111 in 16 bits." },
      { heading: "Why hexadecimal aligns neatly with binary", body: "Each hexadecimal digit represents exactly four binary bits, while each octal digit represents three. This makes hexadecimal convenient for byte-oriented data, memory values and colour codes. The magnitude bit length is the number of binary digits without leading zeros, not an allocated storage width." },
    ],
    formula: "Repeatedly divide the non-negative magnitude by the target base; remainders read in reverse form the result. Digits 10–15 are A–F in hexadecimal. Negative output prefixes the magnitude with a minus sign.",
    example: "255 decimal is 11111111 in binary, 377 in octal and FF in hexadecimal. Its magnitude uses eight bits, and FF groups as one byte.",
    tips: ["Use text rather than floating-point arithmetic for identifiers larger than 2^53−1.", "Specify bit width before converting negatives to two's complement.", "Pad binary digits on the left only when a fixed field width is required."],
    faqs: [
      { q: "Can this convert very large integers?", a: "Yes. Arbitrary-precision integer conversion avoids the safe-integer limit of ordinary JavaScript numbers, subject only to practical browser memory and input size." },
      { q: "Does it support decimals such as 10.5?", a: "No. This page converts whole integers only; fractional values need separate integer and fractional-part conversion." },
      { q: "How are negative numbers represented?", a: "With a leading mathematical minus sign before the converted magnitude, not as fixed-width two's complement." },
    ],
  }),
  tool({
    slug: "http-status-code-lookup",
    name: "HTTP Status Code Lookup",
    category: "Web & Developer",
    short: "Look up common HTTP response codes, their meaning and practical next steps for debugging.",
    keywords: "http status codes, http response code lookup, 404 meaning, 401 vs 403, api error codes",
    inputs: [selectInput("code", "HTTP status code", "200", Object.entries(statusCodes).map(([code, item]) => [code, `${code} ${item.title}`]))],
    compute: (v) => {
      const item = statusCodes[String(v.code)] ?? statusCodes["200"]!;
      return [
        { label: `${String(v.code)} ${item.title}`, value: item.className },
        { label: "What it means", value: item.meaning },
        { label: "Practical next step", value: item.action },
      ];
    },
    about: "HTTP status codes are three-digit responses that describe the outcome of a request. The first digit identifies a broad class: informational, success, redirection, client error or server error. This quick reference explains frequently encountered codes in plain language and suggests a practical response, helping developers, API consumers and site owners distinguish request problems from upstream failures.",
    howToUse: ["Choose the response code shown by the browser, server logs, API client or monitoring tool.", "Read the semantic meaning before changing application behaviour or retrying.", "Use the suggested next step with response headers and server logs; the status alone rarely identifies a root cause."],
    details: [
      { heading: "Authentication, authorisation and missing resources", body: "A 401 means valid authentication is missing or failed, while 403 means the request is understood but not authorised. A 404 can indicate no current representation or a deliberate refusal to disclose one. Correct API behaviour depends on these semantics, not merely on whether a code begins with four." },
      { heading: "Retries should depend on the response", body: "Most 4xx responses require a changed request, credentials, permissions or timing and should not be retried unchanged. A 429 may include Retry-After and requires backoff. A 502, 503 or 504 can be temporary, but repeated immediate retries can worsen an overloaded dependency. Use bounded exponential backoff and idempotency safeguards." },
    ],
    formula: "Class = first digit: 1xx informational, 2xx success, 3xx redirection, 4xx client error and 5xx server error. Individual code semantics come from HTTP standards and registered extensions.",
    example: "An API returning 429 should not be queried again immediately in a tight loop. Respect Retry-After when present and reduce request frequency. A 400 instead requires correcting the request itself.",
    tips: ["Inspect response headers such as Location, WWW-Authenticate and Retry-After.", "Log upstream status separately when debugging gateway errors.", "Do not convert every application error to 500; choose the most accurate semantic response."],
    faqs: [
      { q: "What is the difference between 401 and 403?", a: "401 concerns missing or invalid authentication. 403 means authorisation is refused; logging in again may not resolve a permissions problem." },
      { q: "Should I retry a 500 error?", a: "Possibly, but first consider whether the operation is safe to repeat. Use limited backoff and inspect logs; a persistent 500 needs a server-side fix." },
      { q: "Is 404 always a broken link?", a: "No. It means no current representation is available for the target, or the server is unwilling to disclose one. It can be intentional and does not state permanence." },
    ],
  }),
];
