// scripts/refresh-fonts.mjs
//
// Reproducibly re-pulls every self-hosted WOFF2 in public/fonts/ from
// the canonical @fontsource/* packages. Use when:
//   - Adding a new weight or subset (edit the MAPPINGS table below).
//   - Recovering from a corrupted or mislabeled font file.
//   - Updating to a newer upstream version of Newsreader / Kalam.
//
// Run:   node scripts/refresh-fonts.mjs
// Then:  git diff public/fonts/   (review binary changes)
// Then:  node scripts/check-fonts.mjs   (sanity-check sizes)
// Then:  commit.
//
// Why this script instead of hand-copying:
//   @fontsource ships one WOFF2 per (font, weight, style, Unicode subset)
//   combination. A single "Newsreader" package contains dozens of files,
//   named things like `newsreader-latin-400-normal.woff2`,
//   `newsreader-cyrillic-400-normal.woff2`, `newsreader-latin-ext-600-italic.woff2`,
//   and so on. Phase 1 failed by copying the cyrillic subset under a
//   name that implied Latin. This script encodes the correct mapping
//   once, so the rename can't drift.

import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const TMP = join(tmpdir(), 'aditmehta-font-refresh');
const DEST = 'public/fonts';

// ── Kalam wordmark subset ───────────────────────────────────────────
// After copying the full @fontsource Kalam Devanagari WOFF2s (~108 KB
// each), we pyftsubset them down to exactly the 9 codepoints used by
// the wordmark "अदित मेहता" (+ space). The files that end up in
// public/fonts/ are the TINY post-subset versions (~4 KB each).
//
// The full-range files are never shipped — the site's entire Devanagari
// use-case is this one five-glyph phrase, and anything else would have
// to be added here deliberately. If you ever introduce a new Devanagari
// string on the site, add its codepoints to KALAM_UNICODES below and
// re-run this script.
//
// Requires pyftsubset: `pip install fonttools brotli` (brotli is needed
// for WOFF2 decode). If pyftsubset isn't on PATH, this script aborts
// rather than silently shipping the un-subsetted 108 KB files — which
// would blow the per-font performance budget and fail check-fonts.mjs.
const KALAM_UNICODES = [
  'U+0020', // space
  'U+0905', // अ  DEVANAGARI LETTER A
  'U+0924', // त  DEVANAGARI LETTER TA
  'U+0926', // द  DEVANAGARI LETTER DA
  'U+092E', // म  DEVANAGARI LETTER MA
  'U+0939', // ह  DEVANAGARI LETTER HA
  'U+093E', // ा  DEVANAGARI VOWEL SIGN AA
  'U+093F', // ि  DEVANAGARI VOWEL SIGN I
  'U+0947', // े  DEVANAGARI VOWEL SIGN E
].join(',');

// ── HML "help me learn" kicker subset ───────────────────────────────
// The handwritten kicker face (Dawning of a New Day) is only ever used
// for the fixed string "help me learn" on note pages, so — exactly like
// the Kalam wordmark above — we ship only the glyphs that phrase needs.
// pyftsubset's --text extracts the letter set for us (nine glyphs:
// a e h l m n p r + space). If the kicker string ever changes, edit this
// constant and re-run. If the face itself is swapped, change the MAPPINGS
// row below — the destination filename is deliberately face-agnostic
// (hml-script-400.woff2), so a swap is a one-row change. The full upstream
// WOFF2 is ~18 KB; the subset lands at ~1.5 KB.
const HML_SCRIPT_TEXT = 'help me learn';

function ensurePyftsubset() {
  try {
    execSync('pyftsubset --help', { stdio: 'ignore' });
  } catch {
    console.error('\n✗ pyftsubset not found on PATH.');
    console.error('  Install: pip install fonttools brotli');
    console.error('  (brotli is required to read/write WOFF2 files)');
    process.exit(1);
  }
}

function subsetKalam(filePath) {
  const tmp = filePath + '.tmp.woff2';
  execSync(
    `pyftsubset "${filePath}" --unicodes="${KALAM_UNICODES}" --layout-features='*' --flavor=woff2 --output-file="${tmp}"`,
    { stdio: 'inherit' },
  );
  cpSync(tmp, filePath);
  rmSync(tmp);
}

// Mirror of subsetKalam for the handwritten kicker. The only difference
// is --text (a literal letter set) instead of --unicodes: pyftsubset keeps
// exactly the glyphs "help me learn" needs. --layout-features='*' is kept
// as for Kalam so a face swap to a script with contextual/ligature forms
// still renders correctly (Dawning itself has no GSUB/GPOS, so this is a
// no-op for it, but the flag stays for the general case).
function subsetHmlScript(filePath) {
  const tmp = filePath + '.tmp.woff2';
  execSync(
    `pyftsubset "${filePath}" --text="${HML_SCRIPT_TEXT}" --layout-features='*' --flavor=woff2 --output-file="${tmp}"`,
    { stdio: 'inherit' },
  );
  cpSync(tmp, filePath);
  rmSync(tmp);
}

// The mapping that matters. Left side: path inside @fontsource/* npm
// package. Right side: destination filename under public/fonts/. Add
// a new row whenever a new weight or subset is needed. Keep in sync
// with check-fonts.mjs's EXPECTED list and global.css's @font-face
// declarations.
const MAPPINGS = [
  // package @fontsource/newsreader — Latin subset
  ['@fontsource/newsreader/files/newsreader-latin-400-normal.woff2',     'newsreader-400.woff2'],
  ['@fontsource/newsreader/files/newsreader-latin-400-italic.woff2',     'newsreader-400-italic.woff2'],
  ['@fontsource/newsreader/files/newsreader-latin-600-normal.woff2',     'newsreader-600.woff2'],
  // package @fontsource/newsreader — Latin-Extended subset
  ['@fontsource/newsreader/files/newsreader-latin-ext-400-normal.woff2', 'newsreader-400-ext.woff2'],
  ['@fontsource/newsreader/files/newsreader-latin-ext-400-italic.woff2', 'newsreader-400-italic-ext.woff2'],
  ['@fontsource/newsreader/files/newsreader-latin-ext-600-normal.woff2', 'newsreader-600-ext.woff2'],
  // package @fontsource/kalam — Devanagari subset
  ['@fontsource/kalam/files/kalam-devanagari-400-normal.woff2',          'kalam-devanagari-400.woff2'],
  ['@fontsource/kalam/files/kalam-devanagari-700-normal.woff2',          'kalam-devanagari-700.woff2'],
  // package @fontsource/jetbrains-mono — Latin subset
  ['@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2', 'jetbrains-mono-400.woff2'],
  // package @fontsource/dawning-of-a-new-day — Latin subset (HML kicker).
  // Destination name is face-agnostic so swapping to another script face
  // (e.g. homemade-apple, cedarville-cursive) is a one-row change.
  ['@fontsource/dawning-of-a-new-day/files/dawning-of-a-new-day-latin-400-normal.woff2', 'hml-script-400.woff2'],
];

// Extract unique package names from MAPPINGS and install them together.
const packages = [...new Set(MAPPINGS.map(([src]) => src.split('/').slice(0, 2).join('/')))];

// Verify pyftsubset is available BEFORE we spend time installing packages —
// if it's missing, there's no point doing the download.
ensurePyftsubset();

console.log(`→ Installing ${packages.length} @fontsource packages into ${TMP}/\n`);
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
execSync(`cd "${TMP}" && npm init -y > /dev/null 2>&1 && npm install --silent --no-save ${packages.join(' ')}`, {
  stdio: 'inherit',
});

console.log(`\n→ Copying ${MAPPINGS.length} WOFF2 files into ${DEST}/\n`);
mkdirSync(DEST, { recursive: true });
for (const [src, destName] of MAPPINGS) {
  const srcPath = join(TMP, 'node_modules', src);
  const destPath = join(DEST, destName);
  cpSync(srcPath, destPath);
  const kb = (statSync(destPath).size / 1024).toFixed(1);
  console.log(`  ✓ ${destName.padEnd(36)} (${kb} KB)`);
}

// Post-copy: subset the Kalam files. The @fontsource package ships the
// full ~700-glyph Devanagari subset; we only render 9 codepoints, so we
// strip the rest here. Without this step, Kalam would blow the 40 KB
// per-font perf budget by 2.7× AND fail check-fonts.mjs.
console.log(`\n→ Subsetting Kalam to wordmark codepoints (${KALAM_UNICODES})\n`);
for (const destName of ['kalam-devanagari-400.woff2', 'kalam-devanagari-700.woff2']) {
  const p = join(DEST, destName);
  const before = (statSync(p).size / 1024).toFixed(1);
  subsetKalam(p);
  const after = (statSync(p).size / 1024).toFixed(1);
  console.log(`  ✓ ${destName.padEnd(36)} (${before} KB → ${after} KB)`);
}

// Post-copy: subset the HML kicker face the same way. @fontsource ships
// the full Latin face (~18 KB); the kicker only ever renders the phrase
// "help me learn", so we strip everything else down to those nine glyphs
// (~1.5 KB). Without this step the file would blow check-fonts.mjs's upper
// bound and waste bandwidth for a decorative eyebrow.
console.log(`\n→ Subsetting HML Script to the kicker string ("${HML_SCRIPT_TEXT}")\n`);
{
  const p = join(DEST, 'hml-script-400.woff2');
  const before = (statSync(p).size / 1024).toFixed(1);
  subsetHmlScript(p);
  const after = (statSync(p).size / 1024).toFixed(1);
  console.log(`  ✓ ${'hml-script-400.woff2'.padEnd(36)} (${before} KB → ${after} KB)`);
}

console.log('\n✓ Refresh complete.');
console.log('  Next:');
console.log('    1. git diff public/fonts/   (review binary changes)');
console.log('    2. node scripts/check-fonts.mjs   (verify sizes)');
console.log('    3. Bump ?v=<N> in global.css AND BaseLayout.astro if you expect a live-site swap.');
