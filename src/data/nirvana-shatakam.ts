// src/data/nirvana-shatakam.ts
//
// The text of the Nirvana Shatakam for /learn/nirvana-shatakam/, rendered by
// <Verses> (src/components/Verses.astro). Three parallel blocks, each six
// verses of four lines in reading order: ROMAN (shown by default), DEVA
// (shown when the reader flips the toggle) and ENGLISH (the facing
// translation). The build checks that the three have the same shape and
// stops with the verse number if they don't.
//
// Romanization: written as the hymn is said aloud, with no diacritics.
//   ch for च, sh for श and ष, gy for ज्ञ, ri for the vowel in मृ (mrityur).
//   A long vowel is doubled at the start of a word, where it carries the
//   stress (naaham, paapam, roopah, teertham), and written single elsewhere
//   (chittani, chidananda, nirakara).
//   A visarga ending a line is sounded with its echo vowel (vaayuhu,
//   koshaha); mid-line it is h (roopah).
//   The avagraha is closed up (shivoham), and sandhi is kept as it is
//   pronounced (buddhyahankara, chaartho, vibhutvach cha).
//
// Devanāgarī: the hymn as commonly printed, with the standard forms
// सप्तधातुर्न and पायू (v2), जन्म and शिष्यः (v5), and शिवोऽहं before the final
// शिवोऽहम्. A Devanāgarī character new to src/ needs
// `node scripts/refresh-fonts.mjs` so the HML Devanagari subset covers it.

export interface VerseLine {
  /** Romanized Sanskrit. */
  roman: string;
  /** The same line in Devanāgarī. */
  deva: string;
  /** English rendering of the line. */
  meaning: string;
}

// ─── Romanized ──────────────────────────────────────────────────────
const ROMAN_REFRAIN = 'chidananda roopah shivoham shivoham';

const ROMAN: string[][] = [
  [
    'mano buddhyahankara chittani naaham',
    'na cha shrotra jihve na cha ghraana netre',
    'na cha vyoma bhoomir na tejo na vaayuhu',
    ROMAN_REFRAIN,
  ],
  [
    'na cha praana sangyo na vai pancha vaayuhu',
    'na vaa sapta dhaatur na vaa pancha koshaha',
    'na vaak paani paadam na chopastha paayu',
    ROMAN_REFRAIN,
  ],
  [
    'na me dvesha raagau na me lobha mohau',
    'mado naiva me naiva maatsarya bhaavaha',
    'na dharmo na chaartho na kaamo na mokshaha',
    ROMAN_REFRAIN,
  ],
  [
    'na punyam na paapam na saukhyam na dukham',
    'na mantro na teertham na veda na yagyaha',
    'aham bhojanam naiva bhojyam na bhokta',
    ROMAN_REFRAIN,
  ],
  [
    'na mrityur na shanka na me jaati bhedaha',
    'pita naiva me naiva maata na janma',
    'na bandhur na mitram gurur naiva shishyaha',
    ROMAN_REFRAIN,
  ],
  [
    'aham nirvikalpo nirakara roopo',
    'vibhutvach cha sarvatra sarvendriyanam',
    'na chaasangatam naiva muktir na meyaha',
    ROMAN_REFRAIN,
  ],
];

// ─── Devanāgarī ─────────────────────────────────────────────────────
const DEVA: string[][] = [
  [
    'मनोबुद्ध्यहङ्कारचित्तानि नाहं',
    'न च श्रोत्रजिह्वे न च घ्राणनेत्रे ।',
    'न च व्योम भूमिर्न तेजो न वायुः',
    'चिदानन्दरूपः शिवोऽहं शिवोऽहम् ॥१॥',
  ],
  [
    'न च प्राणसंज्ञो न वै पञ्चवायुः',
    'न वा सप्तधातुर्न वा पञ्चकोशः ।',
    'न वाक्पाणिपादं न चोपस्थपायू',
    'चिदानन्दरूपः शिवोऽहं शिवोऽहम् ॥२॥',
  ],
  [
    'न मे द्वेषरागौ न मे लोभमोहौ',
    'मदो नैव मे नैव मात्सर्यभावः ।',
    'न धर्मो न चार्थो न कामो न मोक्षः',
    'चिदानन्दरूपः शिवोऽहं शिवोऽहम् ॥३॥',
  ],
  [
    'न पुण्यं न पापं न सौख्यं न दुःखं',
    'न मन्त्रो न तीर्थं न वेदा न यज्ञाः ।',
    'अहं भोजनं नैव भोज्यं न भोक्ता',
    'चिदानन्दरूपः शिवोऽहं शिवोऽहम् ॥४॥',
  ],
  [
    'न मृत्युर्न शङ्का न मे जातिभेदः',
    'पिता नैव मे नैव माता न जन्म ।',
    'न बन्धुर्न मित्रं गुरुर्नैव शिष्यः',
    'चिदानन्दरूपः शिवोऽहं शिवोऽहम् ॥५॥',
  ],
  [
    'अहं निर्विकल्पो निराकाररूपो',
    'विभुत्वाच्च सर्वत्र सर्वेन्द्रियाणाम् ।',
    'न चासङ्गतं नैव मुक्तिर्न मेयः',
    'चिदानन्दरूपः शिवोऽहं शिवोऽहम् ॥६॥',
  ],
];

// ─── English ────────────────────────────────────────────────────────
// TO USE THE ISHA FOUNDATION TRANSLATION:
//   1. Replace the lines in ENGLISH below with Isha's, four per verse, in
//      order (each of their verses splits into four clauses that follow the
//      four Sanskrit lines). The refrain is set once, in ENGLISH_REFRAIN; if
//      one verse words it differently, put that verse's own string in place
//      of ENGLISH_REFRAIN there. Strings are in backticks, so apostrophes
//      and quotation marks paste safely.
//   2. Set TRANSLATION_CREDIT, using the wording Isha's permission asks for
//      if it names one. It appears as the last line of the page, just above
//      the footer rule. While it is empty, no credit is shown.
// Until then, ENGLISH holds an original placeholder translation.

export const TRANSLATION_CREDIT = '';
// e.g. 'English translation: Isha Foundation. Used with permission.'

const ENGLISH_REFRAIN = `My form is consciousness and bliss. I am Shiva, I am Shiva.`;

const ENGLISH: string[][] = [
  [
    `I am not mind, intellect, ego, or memory;`,
    `not hearing or taste, not smell or sight;`,
    `not sky, not earth, not fire, not wind.`,
    ENGLISH_REFRAIN,
  ],
  [
    `I am not prana, the life-force, nor its five winds;`,
    `not the seven tissues of the body, nor the five sheaths;`,
    `not speech, hands or feet, nor any other organ of action.`,
    ENGLISH_REFRAIN,
  ],
  [
    `I harbour no hatred, no craving, no greed, no delusion;`,
    `pride has no place in me, nor envy.`,
    `Duty, wealth, desire, liberation: none of these is who I am.`,
    ENGLISH_REFRAIN,
  ],
  [
    `No merit, no sin, no joy, no sorrow;`,
    `no mantra to chant, no pilgrimage to make, no Veda to study, no rite to perform.`,
    `I am neither the experiencing, the experienced, nor the experiencer.`,
    ENGLISH_REFRAIN,
  ],
  [
    `I know no death and no fear; no caste sets me apart.`,
    `No father is mine, nor mother, and I was never born.`,
    `I have no kin and no friend, no guru and no disciple.`,
    ENGLISH_REFRAIN,
  ],
  [
    `I am undivided, a form without shape.`,
    `I am everywhere, filling all things and all the senses.`,
    `Nothing binds me and nothing frees me; I cannot be measured.`,
    ENGLISH_REFRAIN,
  ],
];

// ─── Assembled for <Verses> ─────────────────────────────────────────
function facing(roman: string[][], deva: string[][], english: string[][]): VerseLine[][] {
  if (roman.length !== deva.length || roman.length !== english.length) {
    throw new Error(
      `nirvana-shatakam: ${roman.length} romanized, ${deva.length} Devanagari and ` +
        `${english.length} English verses; the three must match.`,
    );
  }
  return roman.map((lines, v) => {
    if (lines.length !== deva[v].length || lines.length !== english[v].length) {
      throw new Error(
        `nirvana-shatakam: verse ${v + 1} has ${lines.length} romanized, ` +
          `${deva[v].length} Devanagari and ${english[v].length} English lines; ` +
          `they must match.`,
      );
    }
    return lines.map((r, i) => ({ roman: r, deva: deva[v][i], meaning: english[v][i] }));
  });
}

export const nirvanaShatakam: VerseLine[][] = facing(ROMAN, DEVA, ENGLISH);
