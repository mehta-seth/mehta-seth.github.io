#!/usr/bin/env python3
"""
scripts/generate-og-card.py

Generate a 1200x630 PNG OG card for an essay. The card shows the
essay title (Newsreader 600) and optional subtitle (Newsreader italic
400, muted color) on the same warm-near-black background as the
site's default OG image.

This is a manual pre-commit step — NOT run by the Astro build.
Generate once per essay (or whenever the title/subtitle changes),
commit the resulting PNG to public/og/, and reference it from the
essay's frontmatter `cover` field.

Usage:
    python3 scripts/generate-og-card.py \\
        --title "Four Shopkeepers and a Trillion Transactions" \\
        --subtitle "Notes from Rajasthan, on what measurement misses" \\
        --output public/og/four-shopkeepers.png

How it loads fonts:
    The script reads the site's existing Newsreader WOFF2 files from
    public/fonts/, decodes them via fontTools (WOFF2 is just a
    compressed wrapper around TTF/OTF), and hands a TTF buffer to
    Pillow. Single source of truth for fonts: the WOFF2s the site
    already ships. No separate TTF download needed.

Limitation:
    The Newsreader WOFF2 in public/fonts/ is subsetted to Basic Latin
    (U+0000-00FF + a few extras). This covers ASCII text including
    standard punctuation, em-dashes, curly quotes. Titles or subtitles
    containing accented characters (é, ü, ã, etc.) will render as
    missing glyphs — those codepoints live in the -ext WOFF2 file,
    which this script does not load. If a future essay needs them,
    extend the script to fall back to public/fonts/newsreader-*-ext.woff2.

Requirements:
    pip install fonttools brotli Pillow
"""

import argparse
import io
import sys
from pathlib import Path

from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont


# ─── Design constants ─────────────────────────────────────────────────
# Canvas is the OG-image standard 1200x630 (1.91:1 aspect, the size
# Twitter/Facebook/LinkedIn/Slack/iMessage all converge on).
CANVAS_W = 1200
CANVAS_H = 630

# Color values match the dark-theme tokens in src/styles/global.css.
# Keeping them numerically synced means the OG card visually matches
# the page's dark-mode appearance — same background, same text color,
# same muted color — which is what readers see on first paint.
BG_COLOR = (24, 24, 24)              # #181818 — dark-theme --bg
TEXT_COLOR = (232, 228, 220)         # #e8e4dc — dark-theme --text
MUTED_COLOR = (160, 151, 138)        # #a0978a — dark-theme --text-muted

# Padding from canvas edges. 100px gives the title meaningful breathing
# room without forcing it to wrap aggressively.
PADDING_X = 100

# Title size auto-shrinks if the title would wrap to more than 2 lines.
# Range: 80px (short titles) down to 56px (long titles, 3 lines or worse
# at 60px).
TITLE_SIZE_MAX = 80
TITLE_SIZE_MIN = 56
TITLE_SIZE_STEP = 4
TITLE_MAX_LINES = 2

# Subtitle is fixed-size; subtitles are typically a single line.
SUBTITLE_SIZE = 30

# Line-height multipliers. The title is tighter (1.15) because tight
# is what large display type wants; the subtitle is looser (1.4)
# because small italic body wants air.
TITLE_LINE_HEIGHT = 1.15
SUBTITLE_LINE_HEIGHT = 1.4

# Vertical gap between the title block and the subtitle block.
TITLE_TO_SUBTITLE_GAP = 28


# ─── Font loading ─────────────────────────────────────────────────────
def load_woff2_as_ttf_buffer(path: Path) -> io.BytesIO:
    """
    Read a WOFF2 file and return a BytesIO containing the decompressed
    TTF/OTF data. Pillow's truetype() accepts file-like objects, so we
    don't need to write the TTF to disk — it lives in memory for the
    duration of the script.

    Setting font.flavor = None tells fontTools to strip the WOFF2
    wrapper on save. Without this, save() would re-encode as WOFF2
    and Pillow couldn't read it.
    """
    font = TTFont(str(path))
    font.flavor = None
    buf = io.BytesIO()
    font.save(buf)
    buf.seek(0)
    return buf


def load_pil_font(woff2_path: Path, size: int) -> ImageFont.FreeTypeFont:
    """Load a Pillow ImageFont from a WOFF2 file at the given pixel size."""
    buf = load_woff2_as_ttf_buffer(woff2_path)
    return ImageFont.truetype(buf, size=size)


# ─── Text wrapping ────────────────────────────────────────────────────
def wrap_text(text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    """
    Greedy word wrap: split on spaces, accumulate words on a line until
    adding the next word would exceed max_width pixels. Returns the list
    of wrapped lines.

    For our use case (titles and subtitles, both relatively short), this
    is good enough. Knuth-Plass would yield slightly more even lines but
    isn't worth the complexity for this surface.
    """
    words = text.split()
    if not words:
        return []

    lines = []
    current = words[0]
    for word in words[1:]:
        candidate = f"{current} {word}"
        bbox = font.getbbox(candidate)
        candidate_width = bbox[2] - bbox[0]
        if candidate_width <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines


def fit_title_to_canvas(
    title: str, woff2_path: Path, max_width: int,
) -> tuple[ImageFont.FreeTypeFont, list[str]]:
    """
    Find the largest title font size at which the title wraps to at
    most TITLE_MAX_LINES lines. Steps from MAX down to MIN in
    TITLE_SIZE_STEP increments. If even MIN can't fit, returns the
    MIN-size font with however many lines it produces (clip rather
    than infinite-shrink).
    """
    for size in range(TITLE_SIZE_MAX, TITLE_SIZE_MIN - 1, -TITLE_SIZE_STEP):
        font = load_pil_font(woff2_path, size)
        lines = wrap_text(title, font, max_width)
        if len(lines) <= TITLE_MAX_LINES:
            return font, lines
    # Couldn't fit even at min size — return min and let it wrap deeper.
    font = load_pil_font(woff2_path, TITLE_SIZE_MIN)
    lines = wrap_text(title, font, max_width)
    return font, lines


# ─── Drawing helpers ──────────────────────────────────────────────────
def measure_block_height(
    lines: list[str], font: ImageFont.FreeTypeFont, line_height_mult: float,
) -> int:
    """Total pixel height of a wrapped text block at the given line-height."""
    if not lines:
        return 0
    ascent, descent = font.getmetrics()
    line_h = int((ascent + descent) * line_height_mult)
    return line_h * len(lines)


def draw_centered_block(
    draw: ImageDraw.ImageDraw,
    lines: list[str],
    font: ImageFont.FreeTypeFont,
    color: tuple,
    cx: int,
    block_top_y: int,
    line_height_mult: float,
) -> int:
    """
    Draw `lines` left-edge-centered horizontally at column `cx`, with
    the BLOCK's top edge at `block_top_y`. Returns the bottom Y of the
    drawn block, so callers can stack content beneath.
    """
    ascent, descent = font.getmetrics()
    line_h = int((ascent + descent) * line_height_mult)

    for i, line in enumerate(lines):
        bbox = font.getbbox(line)
        line_w = bbox[2] - bbox[0]
        x = cx - line_w // 2
        y = block_top_y + i * line_h
        draw.text((x, y), line, font=font, fill=color)

    return block_top_y + line_h * len(lines)


# ─── Main ─────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser(
        description="Generate an OG card PNG for an essay.",
    )
    ap.add_argument("--title", required=True)
    ap.add_argument("--subtitle", default=None)
    ap.add_argument("--output", required=True, help="Output PNG path.")
    ap.add_argument(
        "--font-dir", default="public/fonts",
        help="Directory containing the Newsreader WOFF2 files. "
             "Defaults to public/fonts (i.e. run from repo root).",
    )
    args = ap.parse_args()

    font_dir = Path(args.font_dir)
    title_woff2 = font_dir / "newsreader-600.woff2"
    italic_woff2 = font_dir / "newsreader-400-italic.woff2"

    if not title_woff2.exists():
        print(f"Error: title font not found at {title_woff2}", file=sys.stderr)
        print("Run this script from the repo root.", file=sys.stderr)
        sys.exit(1)
    if args.subtitle and not italic_woff2.exists():
        print(f"Error: italic font not found at {italic_woff2}", file=sys.stderr)
        sys.exit(1)

    # Layout: figure out fonts and wrapped lines first, then compute
    # vertical centering for the combined block.
    available_width = CANVAS_W - 2 * PADDING_X

    title_font, title_lines = fit_title_to_canvas(
        args.title, title_woff2, available_width,
    )

    subtitle_font = None
    subtitle_lines: list[str] = []
    if args.subtitle:
        subtitle_font = load_pil_font(italic_woff2, SUBTITLE_SIZE)
        subtitle_lines = wrap_text(args.subtitle, subtitle_font, available_width)

    # Compute combined block height for vertical centering.
    title_h = measure_block_height(title_lines, title_font, TITLE_LINE_HEIGHT)
    sub_h = (
        measure_block_height(subtitle_lines, subtitle_font, SUBTITLE_LINE_HEIGHT)
        if subtitle_font else 0
    )
    gap = TITLE_TO_SUBTITLE_GAP if subtitle_lines else 0
    total_h = title_h + gap + sub_h

    # Canvas
    img = Image.new("RGB", (CANVAS_W, CANVAS_H), BG_COLOR)
    draw = ImageDraw.Draw(img)

    cx = CANVAS_W // 2
    cy = CANVAS_H // 2
    block_top = cy - total_h // 2

    title_bottom = draw_centered_block(
        draw, title_lines, title_font, TEXT_COLOR,
        cx, block_top, TITLE_LINE_HEIGHT,
    )

    if subtitle_font and subtitle_lines:
        draw_centered_block(
            draw, subtitle_lines, subtitle_font, MUTED_COLOR,
            cx, title_bottom + gap, SUBTITLE_LINE_HEIGHT,
        )

    # Write the output
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(output_path, format="PNG", optimize=True)

    file_size_kb = output_path.stat().st_size // 1024
    title_size = title_font.size
    print(f"✓ {output_path}")
    print(f"  {CANVAS_W}×{CANVAS_H}, {file_size_kb} KB")
    print(f"  title: {title_size}px, {len(title_lines)} line(s)")
    if subtitle_lines:
        print(f"  subtitle: {SUBTITLE_SIZE}px, {len(subtitle_lines)} line(s)")


if __name__ == "__main__":
    main()
