// Batch 26 — text & developer tools: word to phone number, MAC address
// generator, random quote generator, case converter, lorem ipsum
// generator, MD5 hash generator.
import type { Calc } from "../tool-types";
import { fmt } from "../calculators";
import { md5Hex } from "../md5";
import { N, numberInput, secureRandomInt, seededRandom, selectInput, textArea, textInput } from "./shared";

const KEYPAD: Record<string, string> = {
  A: "2", B: "2", C: "2",
  D: "3", E: "3", F: "3",
  G: "4", H: "4", I: "4",
  J: "5", K: "5", L: "5",
  M: "6", N: "6", O: "6",
  P: "7", Q: "7", R: "7", S: "7",
  T: "8", U: "8", V: "8",
  W: "9", X: "9", Y: "9", Z: "9",
};

/** Well-known quotations with their standard attributions. */
const QUOTES: { q: string; a: string }[] = [
  { q: "The only way to do great work is to love what you do.", a: "Steve Jobs" },
  { q: "Whether you think you can or you think you can't — you're right.", a: "Henry Ford" },
  { q: "It does not matter how slowly you go as long as you do not stop.", a: "Confucius" },
  { q: "Well done is better than well said.", a: "Benjamin Franklin" },
  { q: "The best time to plant a tree was twenty years ago. The second best time is now.", a: "Chinese proverb" },
  { q: "In the middle of difficulty lies opportunity.", a: "Albert Einstein" },
  { q: "Do not wait to strike till the iron is hot, but make it hot by striking.", a: "William Butler Yeats" },
  { q: "Imagination is more important than knowledge.", a: "Albert Einstein" },
  { q: "The journey of a thousand miles begins with a single step.", a: "Lao Tzu" },
  { q: "It always seems impossible until it's done.", a: "Nelson Mandela" },
  { q: "The only true wisdom is in knowing you know nothing.", a: "Socrates" },
  { q: "An investment in knowledge pays the best interest.", a: "Benjamin Franklin" },
  { q: "The secret of getting ahead is getting started.", a: "Mark Twain" },
  { q: "I have not failed. I've just found 10,000 ways that won't work.", a: "Thomas A. Edison" },
  { q: "Life is really simple, but we insist on making it complicated.", a: "Confucius" },
  { q: "Do what you can, with what you have, where you are.", a: "Theodore Roosevelt" },
  { q: "The best way to predict the future is to invent it.", a: "Alan Kay" },
  { q: "A person who never made a mistake never tried anything new.", a: "Albert Einstein" },
  { q: "It is never too late to be what you might have been.", a: "George Eliot" },
  { q: "Knowledge is power.", a: "Francis Bacon" },
  { q: "The only limit to our realization of tomorrow is our doubts of today.", a: "Franklin D. Roosevelt" },
  { q: "Success is not final, failure is not fatal: it is the courage to continue that counts.", a: "Winston Churchill" },
  { q: "The future depends on what you do today.", a: "Mahatma Gandhi" },
  { q: "Don't watch the clock; do what it does. Keep going.", a: "Sam Levenson" },
  { q: "Believe you can and you're halfway there.", a: "Theodore Roosevelt" },
  { q: "Act as if what you do makes a difference. It does.", a: "William James" },
  { q: "The harder I work, the luckier I get.", a: "Samuel Goldwyn" },
  { q: "If you can dream it, you can do it.", a: "Walt Disney" },
  { q: "Everything should be made as simple as possible, but not simpler.", a: "Albert Einstein" },
  { q: "Do not wait for leaders; do it alone, person to person.", a: "Mother Teresa" },
];

/** Sentences from the classic Lorem ipsum passage (public-domain pseudo-Latin). */
const LOREM_SENTENCES: string[] = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  "Curabitur pretium tincidunt lacus.",
  "Nulla gravida orci a odio.",
  "Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.",
  "Integer in mauris eu nibh euismod gravida.",
  "Duis ac tellus et risus vulputate vehicula.",
  "Donec lobortis risus a elit.",
  "Etiam tempor.",
  "Ut ullamcorper, ligula eu tempor congue, eros est euismod turpis, id tincidunt sapien risus a quam.",
  "Maecenas fermentum consequat mi.",
  "Donec fermentum.",
  "Pellentesque malesuada nulla a mi.",
  "Duis sapien sem, aliquet nec, commodo eget, consequat quis, neque.",
  "Aliquam faucibus, elit ut dictum aliquet, felis nisl adipiscing sapien, sed malesuada diam lacus eget erat.",
  "Cras mollis scelerisque nunc.",
  "Nullam arcu justo, fermentum quis, gravida non, faucibus nec, adipiscing at, lorem.",
];

const SMALL_WORDS = new Set([
  "a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", "to", "by", "of", "in", "with", "as",
]);

function titleCase(text: string): string {
  const words = text.toLowerCase().split(/(\s+)/);
  let wordIndex = 0;
  const totalWords = words.filter((w) => /\S/.test(w)).length;
  return words
    .map((w) => {
      if (!/\S/.test(w)) return w;
      wordIndex++;
      const lower = w.toLowerCase();
      if (SMALL_WORDS.has(lower) && wordIndex !== 1 && wordIndex !== totalWords) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
}

function sentenceCase(text: string): string {
  const lower = text.toLowerCase();
  return lower.replace(/(^\s*[a-z]|[.!?]\s+[a-z])/g, (m) => m.toUpperCase());
}

function splitWords(text: string): string[] {
  return text
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}

export const batch26TextDevTools: Calc[] = [
  {
    slug: "word-to-phone-number-converter",
    name: "Word to Phone Number Converter",
    category: "Text Tools",
    short: "Turn a word or phrase into the digits on a telephone keypad — CALL-ME becomes 2255-63.",
    keywords:
      "word to phone number converter, letters to numbers phone, phone keypad converter, word to number converter, vanity number converter",
    inputs: [textInput("w", "Word or phrase", "CALL-ME")],
    compute: (v) => {
      const raw = String(v.w ?? "");
      let letters = 0;
      const out = [...raw]
        .map((ch) => {
          const mapped = KEYPAD[ch.toUpperCase()];
          if (mapped) {
            letters++;
            return mapped;
          }
          return ch;
        })
        .join("");
      return [
        { label: "Phone number", value: out },
        { label: "Letters converted", value: fmt(letters, 0) },
        { label: "Original", value: raw },
      ];
    },
    about:
      "Convert a word or phrase into the digits it spells on a telephone keypad: A, B and C are 2, D, E and F are 3, and so on through W, X, Y and Z on 9. Digits, spaces, dashes and other characters pass through unchanged, so CALL-ME becomes 2255-63 and 1-800-FLOWERS becomes 1-800-3569377. Businesses use this to check vanity numbers — a phone number that spells a word is far easier to remember than a random string of digits.",
    formula:
      "Each letter maps to its keypad digit: ABC→2, DEF→3, GHI→4, JKL→5, MNO→6, PQRS→7, TUV→8, WXYZ→9. Digits and punctuation are kept as they are.",
    example:
      "CALL-ME becomes 2255-63: C→2, A→2, L→5, L→5, M→6, E→3. 1-800-FLOWERS becomes 1-800-3569377.",
    howToUse: [
      "Type the word or phrase — letters, digits and dashes are all fine.",
      "Read the converted number below.",
      "Try a vanity number before you buy it, to check it spells what you think it does.",
    ],
    details: [
      {
        heading: "Why vanity numbers work",
        body: "A number that spells a word is easier to remember because memory works in chunks: FLOWERS is one chunk, 3569377 is seven. Studies of advertising recall consistently find vanity numbers easier to remember and more likely to be dialled than random ones, which is why 1-800-FLOWERS built a whole business on it. The trade-off is that letters only cover 2–9 — a vanity number can never contain 0 or 1 as a letter, so spellings are sometimes creative.",
      },
      {
        heading: "The keypad layout",
        body: "The mapping is the standard telephone keypad, settled in the 1960s: 2 holds ABC, 3 holds DEF, 4 holds GHI, 5 holds JKL, 6 holds MNO, 7 holds PQRS, 8 holds TUV and 9 holds WXYZ. The 1 key has no letters, and 0 has none either (it used to carry the operator). Q and Z were added to 7 and 9 in the 1960s — older phones had no Q or Z at all.",
      },
    ],
    tips: [
      "Digits and dashes pass through unchanged, so full numbers like 1-800-FLOWERS convert in one go.",
      "A vanity number cannot spell 0 or 1 — those keys have no letters.",
      "Check the spelling before you pay for a vanity number: one wrong letter changes the number.",
    ],
    faqs: [
      {
        q: "How do letters convert to phone numbers?",
        a: "Each letter maps to the digit on its telephone keypad key: ABC is 2, DEF is 3, GHI is 4, JKL is 5, MNO is 6, PQRS is 7, TUV is 8 and WXYZ is 9.",
      },
      {
        q: "What number does CALL-ME spell?",
        a: "2255-63. C is 2, A is 2, L is 5, L is 5, M is 6 and E is 3 — the dash stays where it is.",
      },
      {
        q: "Can a phone number spell the letters Q or Z?",
        a: "Yes — Q is on the 7 key with P, R and S, and Z is on the 9 key with W, X and Y. Older phones had no Q or Z, but the modern layout includes them.",
      },
    ],
  },
  {
    slug: "mac-address-generator",
    name: "MAC Address Generator",
    category: "Web & Developer",
    short: "Generate random MAC addresses — locally administered, unicast, in your format.",
    keywords:
      "mac address generator, random mac address generator, generate mac address, mac address maker, fake mac address generator",
    // Crypto-random output differs between server and client renders, so the
    // page shows a placeholder until after mount (see $slug.tsx).
    clientOnly: true,
    inputs: [
      numberInput("count", "How many addresses", "6"),
      selectInput("format", "Format", "colon", [
        ["colon", "Colon separated (AA:BB:CC:DD:EE:FF)"],
        ["dash", "Dash separated (AA-BB-CC-DD-EE-FF)"],
        ["plain", "Plain (AABBCCDDEEFF)"],
      ]),
    ],
    compute: (v) => {
      const count = Math.min(20, Math.max(1, Math.floor(N(v.count))));
      const format = String(v.format ?? "colon");
      const addresses = Array.from({ length: count }, () => {
        const octets = Array.from({ length: 6 }, (_, i) => {
          let b = secureRandomInt(256);
          if (i === 0) b = (b & 0xfe) | 0x02; // locally administered, unicast
          return b.toString(16).padStart(2, "0").toUpperCase();
        });
        return format === "dash" ? octets.join("-") : format === "plain" ? octets.join("") : octets.join(":");
      });
      return [
        { label: "MAC addresses", value: addresses.join("\n") },
        { label: "Count", value: fmt(count, 0) },
        { label: "Type", value: "Locally administered, unicast" },
      ];
    },
    about:
      "Generate random MAC addresses for testing, documentation and network configuration. Every address is locally administered (the second hex digit of the first octet is 2, 6, A or E) and unicast, which is what you want for a made-up address: it can never collide with a manufacturer's real address range. Addresses are generated with the browser's cryptographic random source and never leave your device — nothing here is sent to a server.",
    formula:
      "Six random octets; the first octet has its multicast bit cleared and its locally-administered bit set ((byte & 0xFE) | 0x02), so the second hex digit is 2, 6, A or E.",
    example:
      "Six addresses in colon format look like 02:4F:A1:9C:3E:77, 06:11:8B:2D:F0:4A and so on — each one random, each one locally administered, and no two the same.",
    howToUse: [
      "Choose how many addresses you need — up to 20 at a time.",
      "Pick the format: colons, dashes or plain hex.",
      "Copy the addresses from the result — change the count to generate a fresh set.",
    ],
    details: [
      {
        heading: "Locally administered vs universal",
        body: "A MAC address is 48 bits: the first 24 are the manufacturer's OUI and the last 24 are the device's serial. The second-least-significant bit of the first octet marks the address as locally administered when it is 1 — the address was assigned by software, not burned in by a manufacturer. Random generators always set that bit, because a random address with it clear could accidentally duplicate a real device's address on the same network.",
      },
      {
        heading: "Unicast vs multicast",
        body: "The least significant bit of the first octet marks multicast: 1 means the address is a group address, 0 means it belongs to a single device. This generator always clears it, so every address it makes is a unicast address — the kind a single network card has.",
      },
      {
        heading: "When to use a random MAC address",
        body: "Random MACs are used for testing network software, writing documentation, configuring virtual machines, and for MAC randomisation — a privacy feature in modern phones and laptops that rotates the address a device shows to each Wi-Fi network. Never use a random MAC to impersonate another device on a network you do not own.",
      },
    ],
    tips: [
      "Generated addresses are locally administered — they can never clash with a real manufacturer's range.",
      "Colon format is the most common; Cisco devices often use dots, and plain hex suits config files.",
      "Need more than 20? Generate in batches — every batch is independently random.",
    ],
    faqs: [
      {
        q: "What is a MAC address?",
        a: "A 48-bit hardware identifier for a network device, written as six pairs of hex digits (for example 02:4F:A1:9C:3E:77). It identifies the device on its local network.",
      },
      {
        q: "Are these MAC addresses safe to use?",
        a: "They are locally administered unicast addresses, which means they cannot collide with any manufacturer's real address range. They are fine for testing, VMs and documentation.",
      },
      {
        q: "What does locally administered mean?",
        a: "It means the address was assigned by software rather than burned in by a manufacturer. The second hex digit of the first octet (2, 6, A or E) marks it, and this generator sets it on every address.",
      },
    ],
  },
  {
    slug: "random-quote-generator",
    name: "Random Quote Generator",
    category: "Random Tools",
    short: "A random inspirational quote from a curated list — change the seed for another.",
    keywords:
      "random quote generator, inspirational quotes generator, motivational quote generator, random quote, quote of the day generator",
    inputs: [numberInput("seed", "Seed (change it for another quote)", "1")],
    compute: (v) => {
      // The LCG's first output barely moves for consecutive seeds, so the
      // seed is spread with a Knuth multiplicative hash first — otherwise
      // seeds 7 and 8 would give the same quote.
      const mixed = ((N(v.seed) * 2654435761) >>> 0) || 1;
      const random = seededRandom(mixed);
      const index = Math.floor(random() * QUOTES.length);
      const quote = QUOTES[index]!;
      return [
        { label: "Quote", value: `“${quote.q}”` },
        { label: "Author", value: quote.a },
        { label: "Quote number", value: `${fmt(index + 1, 0)} of ${fmt(QUOTES.length, 0)}` },
      ];
    },
    about:
      "Get a random inspirational quote from a curated list of 30 well-known quotations — Steve Jobs on loving your work, Henry Ford on believing in yourself, Confucius on persistence, and more. Every quote carries its standard attribution, and the list is fixed, so the same seed always gives the same quote. Change the seed (or use the generate button) for a different one. Quotes are shown for inspiration; they are short excerpts, used with attribution.",
    formula: "A uniformly distributed random index into a fixed list of 30 attributed quotes. Change the seed for another draw.",
    example:
      "With the seed set to 1 the generator shows: “Imagination is more important than knowledge.” — Albert Einstein. Change the seed to 2 and a different quote appears.",
    howToUse: [
      "Read the quote shown — the author is listed underneath.",
      "Change the seed number (or press generate) for another quote.",
      "The same seed always gives the same quote, so you can share a seed to share a quote.",
    ],
    details: [
      {
        heading: "About the quotes",
        body: "The list is 30 short, well-known quotations with their standard attributions — the wording people actually quote. Famous sayings are often paraphrased or misattributed over time, so the list sticks to the versions that are widely documented. If you need a quote for publication, check the wording against a reliable source first.",
      },
      {
        heading: "How the random pick works",
        body: "The generator uses a deterministic seeded random number, the same approach as the other random tools on this site: the seed picks the quote, so the result is reproducible. Change the seed and the pick changes. Nothing is random in the cryptographic sense here — these are inspirational quotes, not passwords, so a seeded pick is the right tool.",
      },
    ],
    tips: [
      "Change the seed to browse the list — there are 30 quotes to find.",
      "Use the quote number to jump back to a favourite: the same seed always returns it.",
      "For a presentation, verify the wording against a reliable source before you publish it.",
    ],
    faqs: [
      {
        q: "How many quotes are in the list?",
        a: "30 well-known quotations, each with its standard attribution — from Steve Jobs, Henry Ford, Confucius, Einstein, Mandela and others.",
      },
      {
        q: "Can I get the same quote again?",
        a: "Yes — the generator is seeded, so the same seed always gives the same quote. Note the seed (or the quote number) and come back to it any time.",
      },
      {
        q: "Are the quotes correctly attributed?",
        a: "Each quote carries its standard, widely documented attribution. Famous sayings are sometimes paraphrased, so check a reliable source before publishing one.",
      },
    ],
  },
  {
    slug: "case-converter",
    name: "Case Converter",
    category: "Text Tools",
    short: "Every case at once — UPPER, lower, Title, Sentence, camelCase, snake_case and kebab-case.",
    keywords:
      "case converter, change case, uppercase lowercase converter, camelcase converter, snake case converter, kebab case converter, title case converter",
    inputs: [textArea("text", "Text to convert", "hello world, this is a Test")],
    compute: (v) => {
      const text = String(v.text ?? "");
      const words = splitWords(text);
      const camel = words.map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1))).join("");
      const pascal = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
      return [
        { label: "UPPERCASE", value: text.toUpperCase() },
        { label: "lowercase", value: text.toLowerCase() },
        { label: "Title Case", value: titleCase(text) },
        { label: "Sentence case", value: sentenceCase(text) },
        { label: "camelCase", value: camel },
        { label: "PascalCase", value: pascal },
        { label: "snake_case", value: words.join("_") },
        { label: "kebab-case", value: words.join("-") },
        { label: "Words", value: fmt(words.length, 0) },
      ];
    },
    about:
      "Convert any text into every common case at once: UPPERCASE, lowercase, Title Case, Sentence case, camelCase, PascalCase, snake_case and kebab-case. Paste a heading, a variable name or a paragraph and see all eight versions side by side, then copy the one you need. Title Case follows the usual style-guide rule of leaving small words (a, an, the, and, of, in) lowercase unless they start or end the title. Programmers use camelCase and snake_case for variable names, kebab-case for URLs and CSS classes, and PascalCase for class names.",
    formula: "Each case is a different rule applied to the same words: UPPER uppercases everything, Title capitalises each significant word, camelCase joins words with each new word capitalised, snake_case joins with underscores, kebab-case with hyphens.",
    example:
      "“hello world, this is a Test” becomes HELLO WORLD, THIS IS A TEST in upper, Hello World, This Is a Test in Title Case, helloWorldThisIsATest in camelCase, hello_world_this_is_a_test in snake_case and hello-world-this-is-a-test in kebab-case.",
    howToUse: [
      "Paste or type the text you want to convert.",
      "Read all eight case versions at once — no mode to pick.",
      "Copy the version you need: click a result to copy it.",
    ],
    details: [
      {
        heading: "Which case for what",
        body: "UPPERCASE shouts — use it sparingly, for short labels and warnings. Title Case is for headings and book titles. Sentence case is for ordinary prose and most user-interface text. In code, JavaScript and Java use camelCase for variables, Python and Rust use snake_case, URLs and CSS classes use kebab-case, and class names in most languages use PascalCase. Picking the wrong one is a style error, not a bug — but it marks the text as careless.",
      },
      {
        heading: "How Title Case treats small words",
        body: "Style guides (Chicago, AP) leave short articles, conjunctions and prepositions lowercase inside a title — a, an, the, and, but, or, for, nor, on, at, to, by, of, in, with, as — unless they are the first or last word. So 'The Lord of the Rings' capitalises The at the start but not of or the inside. This converter follows that rule.",
      },
    ],
    tips: [
      "For code, convert once and copy the exact form your language expects — camelCase in JavaScript, snake_case in Python.",
      "Title Case keeps small words lowercase inside the title — that is correct, not a bug.",
      "Kebab-case is the safe choice for URLs and file names: no spaces, no capitals, no ambiguity.",
    ],
    faqs: [
      {
        q: "What is camelCase?",
        a: "Words joined with no spaces, each new word capitalised: helloWorldThisIsATest. It is the standard for variable and function names in JavaScript and Java.",
      },
      {
        q: "What is the difference between snake_case and kebab-case?",
        a: "Both join words without spaces: snake_case uses underscores (hello_world), kebab-case uses hyphens (hello-world). Python uses snake_case; URLs and CSS use kebab-case.",
      },
      {
        q: "When should I use Title Case?",
        a: "For headings, book and article titles, and proper names. Small words like a, the and of stay lowercase inside the title unless they start or end it.",
      },
    ],
  },
  {
    slug: "lorem-ipsum-generator",
    name: "Lorem Ipsum Generator",
    category: "Text Tools",
    short: "Generate lorem ipsum placeholder text — paragraphs, sentences or words.",
    keywords:
      "lorem ipsum generator, lorem ipsum text generator, placeholder text generator, dummy text generator, lorem ipsum paragraphs",
    inputs: [
      numberInput("count", "How many", "3"),
      selectInput("type", "Generate", "paragraphs", [
        ["paragraphs", "Paragraphs"],
        ["sentences", "Sentences"],
        ["words", "Words"],
      ]),
    ],
    compute: (v) => {
      const count = Math.min(100, Math.max(1, Math.floor(N(v.count))));
      const type = String(v.type ?? "paragraphs");
      let out = "";
      if (type === "sentences") {
        const picked = Array.from({ length: count }, (_, i) => LOREM_SENTENCES[i % LOREM_SENTENCES.length]!);
        out = picked.join(" ");
      } else if (type === "words") {
        const allWords = LOREM_SENTENCES.join(" ").split(/\s+/);
        out = Array.from({ length: count }, (_, i) => allWords[i % allWords.length]!).join(" ");
      } else {
        const paras = Array.from({ length: count }, (_, p) => {
          const size = 3 + (p % 3); // 3, 4 or 5 sentences per paragraph
          const start = (p * 5) % LOREM_SENTENCES.length;
          return Array.from(
            { length: size },
            (_, i) => LOREM_SENTENCES[(start + i) % LOREM_SENTENCES.length]!,
          ).join(" ");
        });
        out = paras.join("\n\n");
      }
      const wordCount = out.split(/\s+/).filter(Boolean).length;
      return [
        { label: "Lorem ipsum", value: out },
        { label: "Words", value: fmt(wordCount, 0) },
        { label: "Characters", value: fmt(out.length, 0) },
      ];
    },
    about:
      "Generate lorem ipsum placeholder text for layouts, mockups and designs — by paragraph, by sentence or by exact word count. The text is the classic passage from the printing trade: pseudo-Latin derived from Cicero's De Finibus Bonorum et Malorum, scrambled in the 1500s so that it looks like real copy without meaning anything. Designers use it because a reader's eye slides over it instead of reading it, so the layout — not the words — gets judged.",
    formula: "Paragraphs are built from the classic lorem ipsum sentences in rotation, 3–5 sentences each; sentences mode takes them in order; words mode takes the first N words of the passage.",
    example:
      "Three paragraphs start with the famous opening: “Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam…” and continue through the classic passage.",
    howToUse: [
      "Choose paragraphs, sentences or words.",
      "Enter how many you need.",
      "Copy the generated text into your design.",
    ],
    details: [
      {
        heading: "Where lorem ipsum comes from",
        body: "The text is a mangled version of Cicero's De Finibus Bonorum et Malorum (45 BC), beginning 'Lorem ipsum dolor sit amet, consectetur adipiscing elit' — roughly 'there is no one who loves pain itself'. A 16th-century printer scrambled the words so the text would fill a type specimen without distracting readers, and it has been the standard placeholder ever since. It is public-domain text, free to use anywhere.",
      },
      {
        heading: "Why designers use nonsense text",
        body: "Real words pull the eye: a reviewer reads the copy instead of judging the layout, the spacing and the type. Lorem ipsum has the rhythm and word lengths of English without the meaning, so it shows how a page will look without inviting anyone to proofread it. The rule of thumb: use placeholder text while the design is being judged, and swap in real copy before the design is signed off — a layout that only works with lorem ipsum is not finished.",
      },
    ],
    tips: [
      "Use paragraphs for page mockups, sentences for short blocks, and words when a space is exactly sized.",
      "The first sentence is always the famous opening — everyone recognises it as placeholder text.",
      "Replace placeholder text with real copy before sign-off: a design that depends on it is not finished.",
    ],
    faqs: [
      {
        q: "What is lorem ipsum?",
        a: "Placeholder text from the printing trade — pseudo-Latin derived from Cicero, scrambled so it looks like real copy without meaning anything. Designers use it to judge layout without the words distracting the eye.",
      },
      {
        q: "Is lorem ipsum free to use?",
        a: "Yes. The text is centuries old and in the public domain — you can use it in any design, document or website.",
      },
      {
        q: "Why not use real text as a placeholder?",
        a: "Because people read it instead of judging the design. Lorem ipsum has the shape of English without the meaning, so reviewers look at spacing, type and layout instead of proofreading.",
      },
    ],
  },
  {
    slug: "md5-hash-generator",
    name: "MD5 Hash Generator",
    category: "Web & Developer",
    short: "MD5 hash of any text — 32 hex characters, computed in your browser.",
    keywords:
      "md5 hash generator, md5 generator, md5 hash calculator, generate md5 hash, md5 online, md5 checksum",
    inputs: [textArea("text", "Text to hash", "abc")],
    compute: (v) => {
      const text = String(v.text ?? "");
      const bytes = new TextEncoder().encode(text).length;
      return [
        { label: "MD5 hash", value: md5Hex(text) },
        { label: "Input length", value: `${fmt(text.length, 0)} characters, ${fmt(bytes, 0)} bytes (UTF-8)` },
        { label: "Algorithm", value: "MD5 (RFC 1321), 128-bit" },
      ];
    },
    about:
      "Generate the MD5 hash of any text — a 32-character hex digest, computed entirely in your browser with a pure-JavaScript implementation of RFC 1321. The same input always gives the same hash, and even one changed character gives a completely different one, which is why MD5 is still used for checksums: comparing the hash of a downloaded file with the published one tells you whether the file arrived intact. MD5 is broken as a security hash, though — never use it for passwords or anything that must resist attack; use the SHA-256 generator for that.",
    formula:
      "MD5 (RFC 1321) pads the UTF-8 input to a multiple of 512 bits, then runs four rounds of 16 operations over the message blocks, producing a 128-bit digest shown as 32 hex characters.",
    example:
      "The MD5 of “abc” is 900150983cd24fb0d6963f7d28e17f72, and the MD5 of the empty string is d41d8cd98f00b204e9800998ecf8427e. Change one letter and the hash changes completely.",
    howToUse: [
      "Paste or type the text to hash.",
      "Read the 32-character hex digest below.",
      "Compare it with a published checksum to check a file or a value.",
    ],
    details: [
      {
        heading: "What MD5 is good for",
        body: "Checksums and non-security identifiers. If you download a file and the publisher lists its MD5, hashing your copy and comparing the two values tells you whether the download is intact — an accidental corruption changes the hash completely. MD5 is also fast, which is why it still appears in databases and caches as a fingerprint for data that does not need to be tamper-proof.",
      },
      {
        heading: "Why MD5 must not be used for security",
        body: "MD5 has been cryptographically broken since 2004: researchers can create two different files with the same MD5 (a collision) in seconds, and precomputed tables make reversing common passwords trivial. Never store passwords as MD5, never use it to sign anything, and never trust it to prove a file came from someone — use SHA-256 or better for anything security-sensitive.",
      },
      {
        heading: "How the hash is computed here",
        body: "Web Crypto, the browser's built-in cryptography, deliberately has no MD5 — so this tool uses a compact pure-JavaScript implementation of RFC 1321, bundled with the site and tested against the RFC's own test vectors. The text is encoded as UTF-8 first, so accented characters and emoji hash the same way they do in standard tools.",
      },
    ],
    tips: [
      "The same input always gives the same hash — that is the point of a hash function.",
      "One changed character changes the whole digest: that is how checksums catch corruption.",
      "For passwords or signatures, use SHA-256 instead — MD5 is broken for security.",
    ],
    faqs: [
      {
        q: "What is the MD5 of 'abc'?",
        a: "900150983cd24fb0d6963f7d28e17f72. It is one of the standard test vectors for the algorithm, and this tool reproduces it exactly.",
      },
      {
        q: "Is MD5 secure?",
        a: "No — MD5 has been cryptographically broken since 2004 and collisions can be made in seconds. It is fine for checksums and fingerprints, but never for passwords, signatures or anything security-sensitive. Use SHA-256 for those.",
      },
      {
        q: "Why is the hash 32 characters long?",
        a: "MD5 produces a 128-bit digest, and 128 bits written in hex is 32 characters. SHA-256 produces 256 bits, so its digest is 64 characters.",
      },
    ],
  },
];
