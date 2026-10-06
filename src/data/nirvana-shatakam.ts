// src/data/nirvana-shatakam.ts
//
// The text of the Nirvāṇa Ṣaṭkam for /learn/nirvana-shatakam/, rendered by
// <Verses> (src/components/Verses.astro). Six verses; each verse is its four
// lines (pādas), and each line carries the same line three ways:
//   roman    romanized Sanskrit (IAST), shown by default
//   deva     the line in Devanāgarī, shown when the reader flips the toggle
//   meaning  the English that sits beside the line
//
// Sanskrit: the hymn as commonly printed, with the standard grammatical forms
// सप्तधातुर्न and पायू (v2), जन्म and शिष्यः (v5), and शिवोऽहं before the final
// शिवोऽहम्. The IAST is transliterated from the Devanāgarī and keeps its
// sandhi; hyphens mark compound boundaries, and ’ stands for the avagraha (ऽ).
//
// English: an original line-by-line translation, not copied from any
// published version. Its readings follow the Isha Foundation rendering where
// that is a fair reading of the Sanskrit (the senses rather than the organs,
// experience / experienced / experiencer, not being identified with the four
// aims of life, no need of ritual), in its own words.
//
// Editing: change words in place and keep four lines per verse. The refrain's
// romanization and English are set once below. If you add a Devanāgarī
// character that is not already used anywhere in src/, re-run
// `node scripts/refresh-fonts.mjs` so the HML Devanagari subset covers it.

export interface VerseLine {
  /** Romanized Sanskrit (IAST). */
  roman: string;
  /** The same line in Devanāgarī. */
  deva: string;
  /** English rendering of the line. */
  meaning: string;
}

const REFRAIN_ROMAN = 'cid-ānanda-rūpaḥ śivo’haṃ śivo’ham';
// The spaces inside "I am Śiva, I am Śiva." are non-breaking (\u00a0), so
// when the column is too narrow for the whole refrain it breaks between
// the two sentences instead of leaving "Śiva." alone on a line.
const REFRAIN_MEANING = 'My form is consciousness and bliss. I\u00a0am\u00a0Śiva, I\u00a0am\u00a0Śiva.';

export const nirvanaShatakam: VerseLine[][] = [
  // 1
  [
    {
      roman: 'mano-buddhy-ahaṅkāra-cittāni nāhaṃ',
      deva: 'मनोबुद्ध्यहङ्कारचित्तानि नाहं',
      meaning: 'I am not mind, intellect, ego, or memory;',
    },
    {
      roman: 'na ca śrotra-jihve na ca ghrāṇa-netre',
      deva: 'न च श्रोत्रजिह्वे न च घ्राणनेत्रे ।',
      meaning: 'not hearing or taste, not smell or sight;',
    },
    {
      roman: 'na ca vyoma bhūmir na tejo na vāyuḥ',
      deva: 'न च व्योम भूमिर्न तेजो न वायुः',
      meaning: 'not sky, not earth, not fire, not wind.',
    },
    { roman: REFRAIN_ROMAN, deva: 'चिदानन्दरूपः शिवोऽहं शिवोऽहम् ॥१॥', meaning: REFRAIN_MEANING },
  ],
  // 2
  [
    {
      roman: 'na ca prāṇa-saṃjño na vai pañca-vāyuḥ',
      deva: 'न च प्राणसंज्ञो न वै पञ्चवायुः',
      meaning: 'I am not prāṇa, the life-force, nor its five winds;',
    },
    {
      roman: 'na vā sapta-dhātur na vā pañca-kośaḥ',
      deva: 'न वा सप्तधातुर्न वा पञ्चकोशः ।',
      meaning: 'not the seven tissues of the body, nor the five sheaths;',
    },
    {
      roman: 'na vāk-pāṇi-pādaṃ na copastha-pāyū',
      deva: 'न वाक्पाणिपादं न चोपस्थपायू',
      meaning: 'not speech, hands or feet, nor any other organ of action.',
    },
    { roman: REFRAIN_ROMAN, deva: 'चिदानन्दरूपः शिवोऽहं शिवोऽहम् ॥२॥', meaning: REFRAIN_MEANING },
  ],
  // 3
  [
    {
      roman: 'na me dveṣa-rāgau na me lobha-mohau',
      deva: 'न मे द्वेषरागौ न मे लोभमोहौ',
      meaning: 'I harbour no hatred, no craving, no greed, no delusion;',
    },
    {
      roman: 'mado naiva me naiva mātsarya-bhāvaḥ',
      deva: 'मदो नैव मे नैव मात्सर्यभावः ।',
      meaning: 'pride has no place in me, nor envy.',
    },
    {
      roman: 'na dharmo na cārtho na kāmo na mokṣaḥ',
      deva: 'न धर्मो न चार्थो न कामो न मोक्षः',
      meaning: 'Duty, wealth, desire, liberation: none of these is who I am.',
    },
    { roman: REFRAIN_ROMAN, deva: 'चिदानन्दरूपः शिवोऽहं शिवोऽहम् ॥३॥', meaning: REFRAIN_MEANING },
  ],
  // 4
  [
    {
      roman: 'na puṇyaṃ na pāpaṃ na saukhyaṃ na duḥkhaṃ',
      deva: 'न पुण्यं न पापं न सौख्यं न दुःखं',
      meaning: 'No merit, no sin, no joy, no sorrow;',
    },
    {
      roman: 'na mantro na tīrthaṃ na vedā na yajñāḥ',
      deva: 'न मन्त्रो न तीर्थं न वेदा न यज्ञाः ।',
      meaning: 'no mantra to chant, no pilgrimage to make, no Veda to study, no rite to perform.',
    },
    {
      roman: 'ahaṃ bhojanaṃ naiva bhojyaṃ na bhoktā',
      deva: 'अहं भोजनं नैव भोज्यं न भोक्ता',
      meaning: 'I am neither the experiencing, the experienced, nor the experiencer.',
    },
    { roman: REFRAIN_ROMAN, deva: 'चिदानन्दरूपः शिवोऽहं शिवोऽहम् ॥४॥', meaning: REFRAIN_MEANING },
  ],
  // 5
  [
    {
      roman: 'na mṛtyur na śaṅkā na me jāti-bhedaḥ',
      deva: 'न मृत्युर्न शङ्का न मे जातिभेदः',
      meaning: 'I know no death and no fear; no caste sets me apart.',
    },
    {
      roman: 'pitā naiva me naiva mātā na janma',
      deva: 'पिता नैव मे नैव माता न जन्म ।',
      meaning: 'No father is mine, nor mother, and I was never born.',
    },
    {
      roman: 'na bandhur na mitraṃ gurur naiva śiṣyaḥ',
      deva: 'न बन्धुर्न मित्रं गुरुर्नैव शिष्यः',
      meaning: 'I have no kin and no friend, no guru and no disciple.',
    },
    { roman: REFRAIN_ROMAN, deva: 'चिदानन्दरूपः शिवोऽहं शिवोऽहम् ॥५॥', meaning: REFRAIN_MEANING },
  ],
  // 6
  [
    {
      roman: 'ahaṃ nirvikalpo nirākāra-rūpo',
      deva: 'अहं निर्विकल्पो निराकाररूपो',
      meaning: 'I am undivided, a form without shape.',
    },
    {
      roman: 'vibhutvāc ca sarvatra sarvendriyāṇām',
      deva: 'विभुत्वाच्च सर्वत्र सर्वेन्द्रियाणाम् ।',
      meaning: 'I am everywhere, filling all things and all the senses.',
    },
    {
      roman: 'na cāsaṅgataṃ naiva muktir na meyaḥ',
      deva: 'न चासङ्गतं नैव मुक्तिर्न मेयः',
      meaning: 'Nothing binds me and nothing frees me; I cannot be measured.',
    },
    { roman: REFRAIN_ROMAN, deva: 'चिदानन्दरूपः शिवोऽहं शिवोऽहम् ॥६॥', meaning: REFRAIN_MEANING },
  ],
];
