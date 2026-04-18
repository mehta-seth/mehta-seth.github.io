#!/usr/bin/env bash
# scripts/lighthouse.sh
#
# Runs Lighthouse against a local `astro preview` server over all three
# Phase 5 routes, in both mobile (default) and desktop form factors.
#
# The sandbox the assistant used to assemble Phase 5 had no Chrome
# binary, so Lighthouse couldn't run there. This script is the
# local-laptop replacement — run it before committing Phase 5 to
# capture the four-number scoreboard (Performance / Accessibility /
# Best Practices / SEO) for each route.
#
# Prerequisites on your laptop (macOS):
#   brew install --cask google-chrome
#   npm install -g lighthouse   # or use `npx lighthouse` one-off
#
# Run from the repo root, with the dist/ already built:
#   npm run build
#   ./scripts/lighthouse.sh
#
# Output: one .html and one .json per route per form-factor, in
# ./lighthouse-reports/ (gitignored).

set -euo pipefail

PORT=4321
ROUTES=(
  '/'
  '/cities/'
  '/essays/four-shopkeepers/'
)
FORM_FACTORS=(mobile desktop)
OUT_DIR=lighthouse-reports

# Clean previous run.
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

# Start `astro preview` in the background so we can drive it with
# Lighthouse. Trap ensures we clean up the server even if Lighthouse
# crashes midway.
echo "→ Starting astro preview on :$PORT"
npx astro preview --port "$PORT" >/dev/null 2>&1 &
PREVIEW_PID=$!
trap "kill $PREVIEW_PID 2>/dev/null || true" EXIT

# Wait for the server to accept connections (up to 10 s).
for i in {1..20}; do
  if curl -fsS "http://localhost:$PORT/" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

for ff in "${FORM_FACTORS[@]}"; do
  # Per-form-factor Chrome flags. Mobile emulates a Moto G Power at 4G;
  # desktop disables emulation and raises the throttling target.
  PRESET_FLAG=""
  if [ "$ff" = "desktop" ]; then
    PRESET_FLAG="--preset=desktop"
  fi

  for route in "${ROUTES[@]}"; do
    # Safe filename: /cities/ → cities, / → home, /essays/foo/ → essays-foo
    slug=$(echo "$route" | sed 's|/|-|g; s|^-||; s|-$||')
    [ -z "$slug" ] && slug=home

    echo "→ Lighthouse: $route ($ff)"
    npx --yes lighthouse "http://localhost:$PORT$route" \
      $PRESET_FLAG \
      --output=html --output=json \
      --output-path="$OUT_DIR/$slug-$ff" \
      --chrome-flags="--headless=new --no-sandbox" \
      --quiet

    # Extract the four headline scores from the JSON and echo them in a
    # one-line summary. This is the scoreboard you report back to the
    # Phase 5 delivery.
    node -e "
      const r = require('./$OUT_DIR/$slug-$ff.report.json');
      const s = r.categories;
      const fmt = (v) => Math.round(v * 100).toString().padStart(3);
      console.log(\`   $ff · $slug — P:\${fmt(s.performance.score)} A:\${fmt(s.accessibility.score)} BP:\${fmt(s['best-practices'].score)} SEO:\${fmt(s.seo.score)}\`);
    "
  done
done

echo "✓ Reports written to $OUT_DIR/"
echo "  Open any .report.html in a browser for the full breakdown."
