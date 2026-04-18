// scripts/check-fonts.mjs
//
// Pre-build verification for self-hosted font files.
//
// Why this exists: Phase 1 shipped three Newsreader WOFF2s labeled
// "Latin" that were in fact the Cyrillic subset, 14 KB each with zero
// ASCII letters. The bug stayed invisible because:
//   1. The @font-face declarations loaded the files without error.
//   2. The browser silently fell through to Georgia when 'A' wasn't
//      found, so pages "looked correct" to a casual eye.
//   3. No tool in the build pipeline cared what was inside the WOFF2.
//
// This script runs automatically before every `npm run build` (via the
// "prebuild" hook in package.json) and catches the class of error by
// comparing each WOFF2's byte size against an expected range. It's not
// a full glyph inspection — that would need a font parser — but the
// Cyrillic-vs-Latin mistake is a ~10 KB size difference which a simple
// range check catches reliably, at zero dependency cost.
//
// Three failure modes it catches:
//   - File missing (someone deleted it, never committed it).
//   - File too small (wrong/over-subsetted file, the Phase 1 bug).
//   - File too large (wrong/under-subsetted file, or an un-subsetted
//     full font, which would waste hundreds of KB of user bandwidth).
//
// If this script fails, run:  node scripts/refresh-fonts.mjs
// Then:                       git diff public/fonts/
// Then:                       node scripts/check-fonts.mjs

import { statSync, existsSync } from 'node:fs';

// Expected byte-size ranges, derived empirically from @fontsource v5.x
// output. Ranges are generous (~30%) to tolerate minor upstream updates;
// they're still tight enough to catch subset mixups.
const EXPECTED = [
  // Newsreader — Latin subset (~22 KB, Basic Latin + Latin-1 Supplement)
  { path: 'public/fonts/newsreader-400.woff2',         min: 18000,  max: 35000,  label: 'Latin 400' },
  { path: 'public/fonts/newsreader-400-italic.woff2',  min: 20000,  max: 40000,  label: 'Latin 400 italic' },
  { path: 'public/fonts/newsreader-600.woff2',         min: 19000,  max: 35000,  label: 'Latin 600' },
  // Newsreader — Latin-Extended subset (~15 KB, accented glyphs only)
  { path: 'public/fonts/newsreader-400-ext.woff2',         min: 7000,  max: 22000,  label: 'Latin-Ext 400' },
  { path: 'public/fonts/newsreader-400-italic-ext.woff2',  min: 7000,  max: 22000,  label: 'Latin-Ext 400 italic' },
  { path: 'public/fonts/newsreader-600-ext.woff2',         min: 7000,  max: 22000,  label: 'Latin-Ext 600' },
  // Kalam — Devanagari, aggressively subsetted to the 9 codepoints of
  // the wordmark "अदित मेहता" (+ space). Full Devanagari @fontsource ships
  // at ~108 KB/weight; after pyftsubset down to just these glyphs, both
  // weights land at ~4 KB. If either balloons back into the tens of KB,
  // someone ran refresh-fonts.mjs WITHOUT its pyftsubset post-step —
  // see the subset hint below. Tight ranges (2–10 KB) catch that class
  // of regression.
  { path: 'public/fonts/kalam-devanagari-400.woff2', min: 2000, max: 10000, label: 'Devanagari 400 (wordmark subset)' },
  { path: 'public/fonts/kalam-devanagari-700.woff2', min: 2000, max: 10000, label: 'Devanagari 700 (wordmark subset)' },
  // JetBrains Mono — Latin monospace
  { path: 'public/fonts/jetbrains-mono-400.woff2',   min: 15000,  max: 35000,  label: 'Monospace 400' },
];

// Cross-check: the version string in global.css must match the version
// in BaseLayout.astro's preload links. Mismatch = preload fetches one
// file, @font-face references another, browser double-downloads. Not
// fatal but wasteful and confusing; catch it here.
import { readFileSync } from 'node:fs';

function extractVersions(filePath, urlPattern) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const matches = [...content.matchAll(urlPattern)];
    return new Set(matches.map((m) => m[1]));
  } catch {
    return new Set();
  }
}

const cssVersions = extractVersions(
  'src/styles/global.css',
  /\/fonts\/[^'")\s?]+\.woff2\?v=(\d+)/g,
);
const layoutVersions = extractVersions(
  'src/layouts/BaseLayout.astro',
  /\/fonts\/[^'")\s?]+\.woff2\?v=(\d+)/g,
);

let failures = 0;
console.log('→ Verifying font files in public/fonts/\n');

for (const f of EXPECTED) {
  if (!existsSync(f.path)) {
    console.error(`  ✗ MISSING        ${f.path}`);
    failures++;
    continue;
  }
  const size = statSync(f.path).size;
  const kb = (size / 1024).toFixed(1);
  const minKb = (f.min / 1024).toFixed(0);
  const maxKb = (f.max / 1024).toFixed(0);

  if (size < f.min) {
    console.error(`  ✗ TOO SMALL      ${f.path}`);
    console.error(`                   (${kb} KB — expected ${minKb}–${maxKb} KB for ${f.label})`);
    console.error(`                   Likely cause: wrong subset was copied (e.g. Cyrillic → Latin rename).`);
    failures++;
  } else if (size > f.max) {
    console.error(`  ✗ TOO LARGE      ${f.path}`);
    console.error(`                   (${kb} KB — expected ${minKb}–${maxKb} KB for ${f.label})`);
    console.error(`                   Likely cause: file was not subsetted, or wrong subset copied.`);
    failures++;
  } else {
    console.log(`  ✓ ${f.label.padEnd(24)} ${f.path}  (${kb} KB)`);
  }
}

// Version consistency check.
console.log('\n→ Verifying ?v=<N> cache-buster consistency between global.css and BaseLayout.astro');

if (cssVersions.size === 0) {
  console.error('  ✗ No ?v=<N> query strings found in global.css — cache-busting is disabled.');
  console.error('    Expected pattern: src: url(\'/fonts/xxx.woff2?v=2\') format(\'woff2\');');
  failures++;
} else if (cssVersions.size > 1) {
  console.error(`  ✗ global.css has mixed versions: ${[...cssVersions].join(', ')}`);
  console.error('    All @font-face src URLs should use the same ?v=<N> for a given deployment.');
  failures++;
} else {
  const cssV = [...cssVersions][0];
  console.log(`  ✓ global.css uses ?v=${cssV} consistently (${[...cssVersions].length} unique version)`);

  if (layoutVersions.size > 0 && !layoutVersions.has(cssV)) {
    console.error(`  ✗ BaseLayout.astro preload links use ?v=${[...layoutVersions].join(',')}, but global.css uses ?v=${cssV}`);
    console.error('    Bump BOTH files together whenever fonts change.');
    failures++;
  } else if (layoutVersions.size > 0) {
    console.log(`  ✓ BaseLayout.astro preload links match (?v=${cssV})`);
  }
}

if (failures > 0) {
  console.error(`\n✗ Font verification failed — ${failures} issue(s).`);
  console.error('  To refresh fonts from @fontsource: node scripts/refresh-fonts.mjs');
  process.exit(1);
}

console.log(`\n✓ All ${EXPECTED.length} font files passed verification.`);
