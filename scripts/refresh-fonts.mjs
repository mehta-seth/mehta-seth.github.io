// scripts/refresh-fonts.mjs
//
// Reproducibly re-pulls every self-hosted WOFF2 in public/fonts/ from
// the canonical @fontsource/* packages (plus one Greek subset carved
// from the bundled `katex` dependency — see HML Math below — and the
// Newsreader IAST letters, built from Newsreader's own glyphs — see
// Newsreader IAST below). Use when:
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
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
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

// ── HML Math (Greek) subset ─────────────────────────────────────────
// Some home-page note titles carry a Greek letter (e.g. the σ in
// "σ-Algebras"). Newsreader has no Greek glyphs at all, so those letters
// are carved from KaTeX's math-italic face — the very font KaTeX already
// uses to set the σ in a note's own H1 — and shipped as
// public/fonts/hml-math-400.woff2 under the CSS family 'HML Math'. The
// source is the project's own `katex` dependency (NOT @fontsource), so
// this one is subsetted straight from node_modules rather than through
// the MAPPINGS install below. The subset is the whole Greek block the
// face carries (41 codepoints, ~8 KB); widen/narrow via HML_MATH_UNICODES.
// Keep in sync with check-fonts.mjs and global.css's @font-face.
const HML_MATH_UNICODES = 'U+0370-03FF';
const KATEX_MATH_SRC = 'node_modules/katex/dist/fonts/KaTeX_Math-Italic.ttf';

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

// HML Math differs from the two subsets above: its source is not a file
// already in public/fonts/ (copied from @fontsource) but the
// KaTeX_Math-Italic face inside the `katex` package, so it reads from
// `srcPath` and writes straight to `destPath` in a single pass.
function subsetHmlMath(srcPath, destPath) {
  execSync(
    `pyftsubset "${srcPath}" --unicodes="${HML_MATH_UNICODES}" --layout-features='*' --flavor=woff2 --output-file="${destPath}"`,
    { stdio: 'inherit' },
  );
}

// ── HML Devanagari (Tiro Devanagari Sanskrit) subset ─────────────────
// The Devanāgarī face for Sanskrit verse on HML pages (<Verses>). Unlike
// the Kalam wordmark, its text grows with the content, so instead of a
// hand-kept codepoint list the subset is every Devanāgarī codepoint
// (U+0900–U+097F) that appears anywhere in src/: add a hymn, re-run this
// script, and the font covers it. --layout-features='*' keeps every
// OpenType feature, so conjuncts still form; pyftsubset's closure then
// keeps every conjunct the kept letters can make, which is why the file
// is ~112 KB rather than a few KB (the owner waived the 40 KB per-font
// budget for this face). --name-IDs='*' keeps the font's copyright and
// OFL licence strings in the shipped file.
function devanagariInSrc(dir = 'src') {
  const found = new Set();
  const walk = (d) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (/\.(astro|mdx?|ts|css)$/.test(entry.name)) {
        for (const ch of readFileSync(p, 'utf8')) {
          const cp = ch.codePointAt(0);
          if (cp >= 0x0900 && cp <= 0x097f) found.add(cp);
        }
      }
    }
  };
  walk(dir);
  return [...found]
    .sort((a, b) => a - b)
    .map((cp) => 'U+' + cp.toString(16).toUpperCase().padStart(4, '0'));
}

function subsetHmlDevanagari(filePath, unicodes) {
  const tmp = filePath + '.tmp.woff2';
  execSync(
    `pyftsubset "${filePath}" --unicodes="${unicodes.join(',')}" --layout-features='*' --name-IDs='*' --flavor=woff2 --output-file="${tmp}"`,
    { stdio: 'inherit' },
  );
  cpSync(tmp, filePath);
  rmSync(tmp);
}

// ── Newsreader IAST letters ──────────────────────────────────────────
// Newsreader ships ā ī ū ś ñ but none of the dotted letters romanized
// Sanskrit needs (ṛ ṝ ḷ ḹ ṃ ḥ ṅ ṭ ḍ ṇ ṣ and capitals). The program below
// builds them for each Newsreader style as composites of Newsreader's own
// glyphs (base letter + its own dot/macron marks at its own GPOS anchors),
// writing newsreader-<style>-iast.woff2 next to the Latin/Latin-Ext files
// it reads. It refuses to write anything if the anchor maths fails to
// reproduce the font's own composites (ż ā ŕ ń, and Ż/Ź, Ā/Á). Needs only
// fontTools + brotli (already required for pyftsubset). Kept inline so the
// refresh stays one command; it is run with `python3 -`.
const NEWSREADER_IAST = [
  ['newsreader-400.woff2',        'newsreader-400-ext.woff2',        'newsreader-400-iast.woff2'],
  ['newsreader-400-italic.woff2', 'newsreader-400-italic-ext.woff2', 'newsreader-400-italic-iast.woff2'],
  ['newsreader-600.woff2',        'newsreader-600-ext.woff2',        'newsreader-600-iast.woff2'],
];
const IAST_PY = String.raw`# Newsreader IAST letters. Newsreader ships ā ī ū ś ñ but not the dotted
# letters romanized Sanskrit needs (ṛ ṝ ḷ ḹ ṃ ḥ ṅ ṭ ḍ ṇ ṣ, and capitals).
# This builds them as composites of Newsreader's OWN glyphs: base letter +
# the font's dot-below / dot-above / macron marks, placed at the font's own
# GPOS anchors (or, for capitals, at the offsets its own accented capitals
# use). That is how the designer's existing composites (ạ ż ā …) are made,
# and a self-check below insists the anchors reproduce them.
# argv: one or more triples  <latin.woff2> <latin-ext.woff2> <out.woff2>
import copy, sys
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import Glyph, GlyphComponent

TOP, BELOW = 0, 1  # Newsreader's mark classes in the Latin subset's GPOS


def anchors(font):
    marks, bases = {}, {}
    for lookup in font['GPOS'].table.LookupList.Lookup:
        for st in lookup.SubTable:
            if lookup.LookupType == 9:
                st = st.ExtSubTable
            if type(st).__name__ != 'MarkBasePos':
                continue
            for g, rec in zip(st.MarkCoverage.glyphs, st.MarkArray.MarkRecord):
                marks[g] = (rec.MarkAnchor.XCoordinate, rec.MarkAnchor.YCoordinate)
            for g, rec in zip(st.BaseCoverage.glyphs, st.BaseArray.BaseRecord):
                for cls, a in enumerate(rec.BaseAnchor):
                    if a is not None:
                        bases.setdefault(g, {})[cls] = (a.XCoordinate, a.YCoordinate)
    return marks, bases


def build(latin_path, ext_path, out_path):
    # recalcTimestamp=False keeps the source font's head.modified, so the
    # output is byte-identical run to run (pyftsubset behaves the same way).
    lat, ext = TTFont(latin_path, recalcTimestamp=False), TTFont(ext_path)
    marks, bases = anchors(lat)
    ecmap = ext.getBestCmap()

    def at(base, cls, mark):
        (bx, by), (mx, my) = bases[base][cls], marks[mark]
        return (bx - mx, by - my)

    def own(ch, comp, font=ext):  # where the font itself puts comp in ch
        name = font.getBestCmap()[ord(ch)]
        for c in font['glyf'][name].components:
            if c.glyphName == comp:
                return (c.x, c.y)
        raise KeyError((ch, comp))

    def below(base):
        return ('dotbelowcomb', at(base, BELOW, 'dotbelowcomb'))

    def above(base, mark):
        # uni0307 is not in the Latin subset's mark coverage; every lowercase
        # top mark there shares one anchor, so it is read from uni0304.
        return (mark, at(base, TOP, 'uni0304'))

    # Self-check: anchor maths must reproduce the font's own composites, and
    # the .case marks must share one anchor (so an acute's offset is a valid
    # offset for a dot or macron above the same capital).
    for ch, base, comp in (('ż', 'z', 'uni0307'), ('ā', 'a', 'uni0304'),
                           ('ŕ', 'r', 'acutecomb'), ('ń', 'n', 'acutecomb')):
        mine, theirs = above(base, comp)[1], own(ch, comp)
        if abs(mine[0] - theirs[0]) > 1 or abs(mine[1] - theirs[1]) > 1:
            sys.exit(f'IAST anchor check failed ({latin_path}): {ch} {mine} vs {theirs}')
    if own('Ż', 'uni0307.case') != own('Ź', 'acutecomb.case') or \
       own('Ā', 'uni0304.case') != own('Á', 'acutecomb.case', lat):
        sys.exit(f'IAST .case-mark check failed ({latin_path})')

    letters = {
        0x1E0D: ('d', [below('d')]),                                     # ḍ
        0x1E25: ('h', [below('h')]),                                     # ḥ
        0x1E37: ('l', [below('l')]),                                     # ḷ
        0x1E39: ('l', [below('l'), ('uni0304.case', own('ĺ', 'acutecomb.case'))]),  # ḹ
        0x1E43: ('m', [below('m')]),                                     # ṃ
        0x1E45: ('n', [above('n', 'uni0307')]),                          # ṅ
        0x1E47: ('n', [below('n')]),                                     # ṇ
        0x1E5B: ('r', [below('r')]),                                     # ṛ
        0x1E5D: ('r', [below('r'), above('r', 'uni0304')]),              # ṝ
        0x1E63: ('s', [below('s')]),                                     # ṣ
        0x1E6D: ('t', [below('t')]),                                     # ṭ
        0x1E0C: ('D', [below('D')]),                                     # Ḍ
        0x1E24: ('H', [below('H')]),                                     # Ḥ
        0x1E36: ('L', [below('L')]),                                     # Ḷ
        0x1E38: ('L', [below('L'), ('uni0304.case', own('Ĺ', 'acutecomb.case'))]),  # Ḹ
        0x1E42: ('M', [below('M')]),                                     # Ṃ
        0x1E44: ('N', [('uni0307.case', own('Ń', 'acutecomb.case'))]),   # Ṅ
        0x1E46: ('N', [below('N')]),                                     # Ṇ
        0x1E5A: ('R', [below('R')]),                                     # Ṛ
        0x1E5C: ('R', [below('R'), ('uni0304.case', own('Ŕ', 'acutecomb.case'))]),  # Ṝ
        0x1E62: ('S', [below('S')]),                                     # Ṣ
        0x1E6C: ('T', [below('T')]),                                     # Ṭ
    }

    glyf, hmtx, order = lat['glyf'], lat['hmtx'], lat.getGlyphOrder()

    def bring(name):  # copy a glyph (and its components) in from Latin-Ext
        if name in glyf.glyphs:
            return
        g = ext['glyf'][name]
        if g.isComposite():
            for c in g.components:
                bring(c.glyphName)
        glyf.glyphs[name] = copy.deepcopy(g)
        hmtx.metrics[name] = ext['hmtx'].metrics[name]
        order.append(name)

    for name in ('uni0307', 'uni0307.case', 'uni0304.case'):
        bring(name)

    added = {}
    for cp, (base, parts) in sorted(letters.items()):
        name = 'uni%04X' % cp
        g = Glyph()
        g.numberOfContours = -1
        g.components = []
        for i, (comp, (dx, dy)) in enumerate([(base, (0, 0))] + parts):
            c = GlyphComponent()
            c.glyphName, c.x, c.y = comp, dx, dy
            c.flags = 0x0200 if i == 0 else 0  # USE_MY_METRICS on the base letter
            g.components.append(c)
        glyf.glyphs[name] = g
        order.append(name)
        g.recalcBounds(glyf)
        hmtx.metrics[name] = (hmtx[base][0], g.xMin)
        added[cp] = name
    lat.setGlyphOrder(order)

    for table in lat['cmap'].tables:
        if table.isUnicode():
            table.cmap.update(added)

    # Keep only the new letters (their components come along automatically).
    opts = subset.Options()
    opts.layout_features = []      # precomposed letters need no shaping
    opts.name_IDs = ['*']          # keep the copyright + OFL licence strings
    opts.name_languages = ['*']
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=list(added))
    sub.subset(lat)
    lat.flavor = 'woff2'
    lat.save(out_path)


args = sys.argv[1:]
if not args or len(args) % 3:
    sys.exit('usage: iast.py <latin.woff2> <latin-ext.woff2> <out.woff2> [...]')
for i in range(0, len(args), 3):
    build(*args[i:i + 3])
`;

function buildNewsreaderIast() {
  const args = NEWSREADER_IAST.flat().map((name) => `"${join(DEST, name)}"`).join(' ');
  execSync(`python3 - ${args}`, { input: IAST_PY, stdio: ['pipe', 'inherit', 'inherit'] });
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
  // package @fontsource/tiro-devanagari-sanskrit — Devanagari subset (HML
  // verse text). Face-agnostic destination name, like hml-script-400.
  ['@fontsource/tiro-devanagari-sanskrit/files/tiro-devanagari-sanskrit-devanagari-400-normal.woff2', 'hml-devanagari-400.woff2'],
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

// HML Math — carve the Greek subset straight from the bundled katex face.
console.log(`\n→ Subsetting HML Math (Greek block ${HML_MATH_UNICODES}) from ${KATEX_MATH_SRC}\n`);
{
  if (!existsSync(KATEX_MATH_SRC)) {
    console.error(`  ✗ ${KATEX_MATH_SRC} not found — is the \`katex\` package installed?`);
    process.exit(1);
  }
  const dest = join(DEST, 'hml-math-400.woff2');
  subsetHmlMath(KATEX_MATH_SRC, dest);
  const kb = (statSync(dest).size / 1024).toFixed(1);
  console.log(`  ✓ ${'hml-math-400.woff2'.padEnd(36)} (${kb} KB)`);
}

// HML Devanagari — subset the Tiro file to the Devanāgarī used in src/.
{
  const unicodes = devanagariInSrc();
  console.log(`\n→ Subsetting HML Devanagari to the ${unicodes.length} Devanāgarī codepoints used in src/\n`);
  const p = join(DEST, 'hml-devanagari-400.woff2');
  const before = (statSync(p).size / 1024).toFixed(1);
  subsetHmlDevanagari(p, unicodes);
  const after = (statSync(p).size / 1024).toFixed(1);
  console.log(`  ✓ ${'hml-devanagari-400.woff2'.padEnd(36)} (${before} KB → ${after} KB)`);
}

// Newsreader IAST — build the dotted letters from the files copied above.
console.log('\n→ Building Newsreader IAST letters (ṛ ṝ ḷ ḹ ṃ ḥ ṅ ṭ ḍ ṇ ṣ + capitals)\n');
buildNewsreaderIast();
for (const [, , out] of NEWSREADER_IAST) {
  const kb = (statSync(join(DEST, out)).size / 1024).toFixed(1);
  console.log(`  ✓ ${out.padEnd(36)} (${kb} KB)`);
}

console.log('\n✓ Refresh complete.');
console.log('  Next:');
console.log('    1. git diff public/fonts/   (review binary changes)');
console.log('    2. node scripts/check-fonts.mjs   (verify sizes)');
console.log('    3. Bump ?v=<N> in global.css AND BaseLayout.astro if you expect a live-site swap.');
