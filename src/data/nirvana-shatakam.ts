// src/data/nirvana-shatakam.ts
//
// Text of the Nirvana Shatakam for /learn/nirvana-shatakam/, rendered by
// <Verses>: six verses of four lines in romanized Sanskrit, Devanagari and
// English, paired line by line by facing(). A Devanagari character new to
// src/ needs `node scripts/refresh-fonts.mjs` so the HML Devanagari font
// covers it.

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
    'न मे वै मदो नैव मात्सर्यभावः ।',
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

export const TRANSLATION_CREDIT = 'English translation adapted from Isha Foundation';

const ENGLISH_REFRAIN = `I am the form of consciousness and eternal bliss, I am Shiva.`;

const ENGLISH: string[][] = [
  [
    `I am not any aspect of the mind like the intellect, the ego or the memory,`,
    `I am not the organs of hearing, tasting, smelling or seeing,`,
    `I am not the space, nor the earth, nor fire, nor air,`,
    ENGLISH_REFRAIN,
  ],
  [
    `I am not prana, the life-force, nor its five vital airs,`,
    `I am not the seven essential building blocks of the body, nor the five sheaths of the body,`,
    `I am not the mouth, hands or feet, nor any part of the body,`,
    ENGLISH_REFRAIN,
  ],
  [
    `There is no hatred nor passion in me, no greed nor delusion,`,
    `There is no pride, nor jealousy in me,`,
    `I am not identified with my duty, wealth, lust or liberation,`,
    ENGLISH_REFRAIN,
  ],
  [
    `I am not virtue nor vice, not pleasure or pain,`,
    `I need no mantras, no pilgrimage, no scriptures or rituals,`,
    `I am not the experience, not the object of experience, not even the one who experiences,`,
    ENGLISH_REFRAIN,
  ],
  [
    `I am not bound by death and its fear, not by caste or creed,`,
    `I have no father, nor mother, or even birth,`,
    `I am not a relative, nor a friend, nor a teacher nor a student,`,
    ENGLISH_REFRAIN,
  ],
  [
    `I am devoid of duality, my form is formlessness,`,
    `I am omnipresent, I exist everywhere, pervading all senses,`,
    `I am neither attached, neither free nor limited,`,
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
