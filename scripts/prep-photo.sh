#!/usr/bin/env bash
# scripts/prep-photo.sh
#
# Pre-resize a camera JPEG for inclusion in an essay or city page.
# Produces a 3000px-max-edge JPEG at quality 90, sRGB color space, with
# all EXIF metadata stripped (including any GPS coordinates, camera
# serial numbers, and timestamps).
#
# This is a manual pre-commit step — NOT run by the Astro build. The
# build pipeline takes the file produced by THIS script as its source
# of truth; if you ship a 5000px 8MB camera original to src/assets/, it
# never goes through this normalisation and the repo bloats fast.
#
# Why these settings (see Technical Spec, photo handling section):
#   - 3000px long edge: covers full-bleed-on-4K-display (the worst-case
#     viewing condition) at 1:1 pixels with headroom. No Astro variant
#     ever upscales beyond this.
#   - quality 90: visually indistinguishable from the camera original
#     on photographic content. Headroom for AVIF/WebP transcode.
#   - 4:2:0 chroma subsampling: matches what cameras and browsers
#     produce by default. ~30% smaller files, no visible loss.
#   - -strip: removes ALL EXIF metadata. Photos taken in a private
#     home should not carry GPS coordinates indefinitely on the
#     public web. EXIF you actually want (e.g., "shot on Canon EOS
#     Rebel T6, f/4, 1/500s") goes in the figure's caption text,
#     authored editorially.
#   - -auto-orient (BEFORE -strip): reads the EXIF rotation flag,
#     rotates the actual pixels, then strips. Without this, photos
#     taken in portrait orientation appear sideways after the strip.
#   - -colorspace sRGB: guarantees the output is sRGB. If the input
#     is Adobe RGB or ProPhoto RGB (rare from a camera, possible from
#     Lightroom export with the wrong preset), browsers display
#     shifted colors otherwise.
#
# Usage:
#   ./scripts/prep-photo.sh <input.jpg> <output.jpg>
#
# Example:
#   ./scripts/prep-photo.sh \
#     ~/Pictures/Rajasthan/lalit.JPG \
#     src/assets/essays/four-shopkeepers/lalit.jpg
#
# Tip: output filename should be lowercase with .jpg extension
# (NOT .JPG). The build runs on Linux which is case-sensitive; macOS
# is not. Matching .jpg in the import statement and on disk avoids a
# class of bug that only shows up in CI.
#
# Requirements:
#   ImageMagick 7+ (provides the `magick` command).
#   Install:  brew install imagemagick

set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <input.jpg> <output.jpg>"
  echo ""
  echo "Example:"
  echo "  $0 ~/Pictures/lalit.JPG src/assets/essays/four-shopkeepers/lalit.jpg"
  exit 1
fi

INPUT="$1"
OUTPUT="$2"

if [ ! -f "$INPUT" ]; then
  echo "Error: input file not found: $INPUT"
  exit 1
fi

if ! command -v magick >/dev/null 2>&1; then
  echo "Error: ImageMagick not installed."
  echo "Install with: brew install imagemagick"
  exit 1
fi

# Create the output directory if it doesn't exist. -p so we don't fail
# if it does. Walks up the path so a deeply-nested target works on
# first invocation.
mkdir -p "$(dirname "$OUTPUT")"

# The transform itself. Order matters:
#   -auto-orient must come BEFORE -strip (else orientation flag is gone
#   before we read it).
#   -colorspace sRGB before -strip to capture the source profile.
#   -resize '3000x3000>' fits within 3000x3000 only if larger; smaller
#   sources pass through unchanged (the > is the "shrink only" flag).
magick "$INPUT" \
  -auto-orient \
  -colorspace sRGB \
  -resize '3000x3000>' \
  -quality 90 \
  -sampling-factor 4:2:0 \
  -strip \
  "$OUTPUT"

# Print before/after sizes so any oversize output is immediately visible.
in_size=$(du -h "$INPUT" | cut -f1)
out_size=$(du -h "$OUTPUT" | cut -f1)
in_dim=$(magick identify -format '%wx%h' "$INPUT")
out_dim=$(magick identify -format '%wx%h' "$OUTPUT")

echo "✓ ${INPUT}"
echo "    ${in_dim}, ${in_size}"
echo "  → ${OUTPUT}"
echo "    ${out_dim}, ${out_size}"
