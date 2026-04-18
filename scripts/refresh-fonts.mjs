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
];

// Extract unique package names from MAPPINGS and install them together.
const packages = [...new Set(MAPPINGS.map(([src]) => src.split('/').slice(0, 2).join('/')))];

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

console.log('\n✓ Refresh complete.');
console.log('  Next:');
console.log('    1. git diff public/fonts/   (review binary changes)');
console.log('    2. node scripts/check-fonts.mjs   (verify sizes)');
console.log('    3. Bump ?v=<N> in global.css AND BaseLayout.astro if you expect a live-site swap.');
