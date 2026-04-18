#!/usr/bin/env python3
# scripts/generate-assets.py
#
# Generates the two static image assets that the site references but
# that can't sensibly live as hand-authored files:
#
#   1. public/og-default.png         — 1200×630, default Open Graph card
#   2. public/apple-touch-icon.png   — 180×180, iOS home-screen icon
#
# Neither is dynamic — they're regenerated on demand, not every build.
# Re-run this script whenever brand colors, wordmark design, or OG
# typography changes. Output is checked into the repo.
#
# Requirements:
#   python3 -m pip install fonttools brotli pillow --break-system-packages
#
# The script uses the same @fontsource packages the site ships with
# (installed via `npm install @fontsource/newsreader @fontsource/kalam`
# as devDependencies — see package.json). It converts the WOFF2 files
# to temporary TTFs (Pillow can't read WOFF2 directly, but fontTools
# can repack WOFF2 → plain SFNT in memory) and uses those for rendering.
#
# Run from the repo root:
#   python3 scripts/generate-assets.py
#
# Both outputs use the site's design tokens directly (no color drift).

from pathlib import Path
import random
import shutil
import sys
import tempfile

try:
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
except ImportError:
    print('✗ Pillow not installed. Install: pip install pillow --break-system-packages', file=sys.stderr)
    sys.exit(1)
try:
    from fontTools.ttLib import TTFont
except ImportError:
    print('✗ fontTools not installed. Install: pip install fonttools brotli --break-system-packages', file=sys.stderr)
    sys.exit(1)


# ── Design tokens (copied verbatim from src/styles/global.css — keep in sync) ──
BG_DARK     = (24, 24, 24)       # --bg      in :root.dark  (#181818)
TEXT_DARK   = (232, 228, 220)    # --text    in :root.dark  (#e8e4dc)
ACCENT_DARK = (212, 165, 116)    # --accent  in :root.dark  (#d4a574)


# ── Font resolution ──
# @fontsource ships WOFF2 only; Pillow needs TTF. We convert in-memory
# via fontTools: load WOFF2 → clear flavor → save as plain SFNT bytes.
# Cached in a tempdir for the lifetime of the script.
FONTSOURCE_WOFF2 = {
    'newsreader-400': 'node_modules/@fontsource/newsreader/files/newsreader-latin-400-normal.woff2',
    'newsreader-600': 'node_modules/@fontsource/newsreader/files/newsreader-latin-600-normal.woff2',
    'kalam-400':      'node_modules/@fontsource/kalam/files/kalam-devanagari-400-normal.woff2',
}


def woff2_to_ttf(src_path: str, dst_path: str) -> None:
    """Convert a WOFF2 file to plain TTF. Requires brotli (installed via pip)."""
    font = TTFont(src_path)
    font.flavor = None  # strip woff2 compression wrapper → sfnt
    font.save(dst_path)


def ensure_ttfs(tmp_dir: Path) -> dict:
    """Convert the required @fontsource WOFF2s to TTF in tmp_dir, return paths."""
    out = {}
    for key, src in FONTSOURCE_WOFF2.items():
        if not Path(src).exists():
            print(
                f'✗ Missing font source: {src}\n'
                f'  Run: npm install @fontsource/newsreader @fontsource/kalam',
                file=sys.stderr,
            )
            sys.exit(1)
        dst = tmp_dir / f'{key}.ttf'
        woff2_to_ttf(src, str(dst))
        out[key] = str(dst)
    return out


# ── Grain overlay ──
# The site has a subtle paper-grain texture in dark mode (§3.6). We
# replicate a simplified version here so the OG card matches the page.
# Deterministic seeding means rebuilding the card twice in a row
# produces byte-identical output — friendlier for git diffs.
def add_grain(img: Image.Image, opacity: float = 0.04) -> Image.Image:
    """Alpha-composite a monochrome noise texture onto `img`."""
    w, h = img.size
    rng = random.Random(42)
    grain = Image.new('L', (w // 2, h // 2))
    pixels = grain.load()
    for y in range(grain.height):
        for x in range(grain.width):
            pixels[x, y] = rng.randint(0, 255)
    grain = grain.resize((w, h), Image.BILINEAR).filter(ImageFilter.GaussianBlur(radius=0.5))
    alpha = Image.new('L', (w, h), int(255 * opacity))
    grain_rgba = Image.merge('RGBA', [grain, grain, grain, alpha])
    img.alpha_composite(grain_rgba)
    return img


def measure(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont):
    """Return (width, height) of rendered text."""
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


# ─── 1. og-default.png (1200×630) ───────────────────────────────
def build_og_default(out_path: Path, fonts: dict) -> None:
    """
    Default Open Graph card. Dark bg, centered bilingual wordmark,
    small tagline, subtle grain. Matches the site's own dark-mode look
    so a link pasted into Slack/iMessage feels continuous with the site.
    """
    W, H = 1200, 630
    img = Image.new('RGBA', (W, H), BG_DARK + (255,))
    draw = ImageDraw.Draw(img)

    # Typography: wordmark at display scale. Devanagari slightly smaller
    # because Kalam's x-height is taller — matches the
    #   .wordmark .devanagari { font-size: 0.92em }
    # rule in global.css.
    latin_font = ImageFont.truetype(fonts['newsreader-600'], 72)
    dev_font   = ImageFont.truetype(fonts['kalam-400'],      66)
    tag_font   = ImageFont.truetype(fonts['newsreader-400'], 26)

    latin_text = 'Adit Mehta'
    dot_text   = ' · '
    dev_text   = 'अदित मेहता'

    lw, lh = measure(draw, latin_text, latin_font)
    dw, _  = measure(draw, dot_text,   latin_font)
    vw, _  = measure(draw, dev_text,   dev_font)

    total_w = lw + dw + vw
    start_x = (W - total_w) // 2
    baseline_y = (H - lh) // 2 - 10

    draw.text((start_x,               baseline_y),     latin_text, font=latin_font, fill=TEXT_DARK)
    draw.text((start_x + lw,          baseline_y),     dot_text,   font=latin_font, fill=TEXT_DARK)
    draw.text((start_x + lw + dw,     baseline_y - 4), dev_text,   font=dev_font,   fill=TEXT_DARK)

    # Tagline underneath — small, accent-colored. A quiet second line so
    # the card reads as a brand mark rather than just a name.
    tag = 'Essays and photographs.'
    tw, _ = measure(draw, tag, tag_font)
    draw.text(((W - tw) // 2, baseline_y + lh + 30), tag, font=tag_font, fill=ACCENT_DARK)

    img = add_grain(img, opacity=0.03)

    # Flatten to RGB — OG crawlers expect RGB PNGs; stray alpha channels
    # sometimes render black on Slack's light theme.
    rgb = Image.new('RGB', img.size, BG_DARK)
    rgb.paste(img, mask=img.split()[3])
    rgb.save(out_path, 'PNG', optimize=True)
    print(f'  ✓ {out_path}  ({out_path.stat().st_size // 1024} KB, {W}×{H})')


# ─── 2. apple-touch-icon.png (180×180) ──────────────────────────
def build_apple_touch_icon(out_path: Path, fonts: dict) -> None:
    """
    iOS home-screen icon. Same "अ" monogram as favicon.svg on a solid
    dark background so iOS's auto-corner-rounding looks clean. iOS crops
    the last ~10% of each edge, so the glyph is inset with padding.
    """
    SIZE = 180
    img = Image.new('RGB', (SIZE, SIZE), BG_DARK)
    draw = ImageDraw.Draw(img)

    font = ImageFont.truetype(fonts['kalam-400'], 130)
    text = 'अ'
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    # Devanagari glyphs sit above the visual baseline; offset so the
    # optical center lands in the middle of the icon, not the metric
    # center.
    draw.text(
        ((SIZE - tw) // 2 - bbox[0], (SIZE - th) // 2 - bbox[1] - 8),
        text,
        font=font,
        fill=ACCENT_DARK,
    )
    img.save(out_path, 'PNG', optimize=True)
    print(f'  ✓ {out_path}  ({out_path.stat().st_size // 1024} KB, {SIZE}×{SIZE})')


if __name__ == '__main__':
    out_dir = Path('public')
    out_dir.mkdir(exist_ok=True)
    tmp_dir = Path(tempfile.mkdtemp(prefix='aditmehta-assets-'))
    try:
        print(f'→ Converting @fontsource WOFF2 → TTF (tempdir: {tmp_dir})')
        fonts = ensure_ttfs(tmp_dir)
        print('→ Generating brand assets')
        build_og_default(out_dir / 'og-default.png', fonts)
        build_apple_touch_icon(out_dir / 'apple-touch-icon.png', fonts)
        print('✓ Done.')
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)
