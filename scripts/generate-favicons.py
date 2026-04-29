#!/usr/bin/env python3
"""
scripts/generate-favicons.py

Generate bitmap favicon variants from public/favicon.svg.

Why this exists:
    Modern browsers happily use favicon.svg for tab rendering, but two
    important consumers do not:

      1. Google search results. Google's favicon-for-search-results
         crawler requires a bitmap favicon at a size that's a multiple
         of 48 pixels (48, 96, 144, 192...). It does not consume SVG.
         Without bitmap variants, search results inherit a fallback
         (for *.github.io subdomains: the GitHub Octocat).

      2. Legacy browser/system flows that look for /favicon.ico. The
         classic .ico filename predates the modern <link rel="icon">
         mechanism; some crawlers and old environments hit it directly
         without parsing the HTML.

    This script reads public/favicon.svg and emits:
      - public/favicon.ico         (multi-resolution: 16, 32, 48 packed)
      - public/favicon-96x96.png   (Google's preferred size)
      - public/favicon-192x192.png (high-DPR / Android home screen)

    The existing public/apple-touch-icon.png (180x180) is NOT touched
    here — it has its own generation path (scripts/generate-assets.py)
    and its own purpose (iOS home screen).

Why these specific sizes:
    - 16, 32, 48 in the .ico — the historical standard set. Windows
      Explorer, legacy browsers, RSS readers, link previews in some
      apps all expect these.
    - 96 — the smallest size Google explicitly accepts as a search-
      result favicon under their "multiple of 48" rule.
    - 192 — covers Android home-screen shortcut. Also future-proofs
      against high-DPR displays where the browser fetches a 2x
      version of the 96 slot.

Why cairosvg (not Pillow alone):
    Pillow can't read SVG. cairosvg uses libcairo to rasterise SVG to
    PNG, including text rendering with system fonts. The favicon.svg
    contains the Devanagari glyph "अ" rendered as text (font-family:
    'Noto Sans Devanagari'), so the rasteriser needs a real font
    pipeline. cairosvg is the standard choice for this on macOS/Linux.

Font availability:
    cairosvg uses whatever Devanagari font is on the rendering machine.
    On macOS, this is typically Devanagari MT or Kohinoor Devanagari.
    On Linux, it's typically Noto Sans Devanagari (install with:
    `apt install fonts-noto-core`).

    The rendering may differ slightly between macOS and Linux. For a
    favicon at 16-192px sizes, this is acceptable — both fonts produce
    a recognizable अ. For pixel-perfect cross-machine rendering, a
    future iteration could embed the glyph as an SVG path instead of
    text, but that's overkill for v1.

Usage:
    python3 scripts/generate-favicons.py
    # No arguments. Reads public/favicon.svg, writes the three output
    # files alongside it.

Requirements:
    pip install cairosvg Pillow

    On Linux, also: apt install fonts-noto-core (for the Devanagari
    font cairosvg uses). On macOS, no extra fonts needed — system
    Devanagari is built in.
"""

import io
import sys
from pathlib import Path

import cairosvg
from PIL import Image


# Output sizes. Each entry: (filename, list_of_sizes).
# .ico files are multi-resolution archives — we pack 16, 32, 48 into one.
# PNGs are single-resolution.
ICO_SIZES = [16, 32, 48]
PNG_OUTPUTS = [
    ("favicon-96x96.png", 96),
    ("favicon-192x192.png", 192),
]


def render_svg_to_pil(svg_path: Path, size: int) -> Image.Image:
    """
    Rasterise the SVG to a PNG of the given size, then return it as a
    Pillow Image. Goes through PNG bytes in memory rather than writing
    to disk because we want to compose multiple sizes into a single
    .ico, and Pillow's .ico writer takes Pillow Images, not file paths.
    """
    png_bytes = cairosvg.svg2png(
        url=str(svg_path),
        output_width=size,
        output_height=size,
    )
    return Image.open(io.BytesIO(png_bytes))


def write_ico(svg_path: Path, output_path: Path, sizes: list[int]) -> None:
    """
    Render the SVG at each of the given sizes and pack them into a
    single multi-resolution .ico file at output_path. Pillow's
    save(format='ICO', sizes=[...]) handles the packing.
    """
    # Render the largest size first; Pillow will downscale internally
    # to produce the smaller variants. Rendering each independently
    # from the SVG would be slightly sharper at small sizes, but
    # Pillow's downscale produces acceptable output and is simpler.
    largest = max(sizes)
    img = render_svg_to_pil(svg_path, largest)
    img.save(
        output_path,
        format="ICO",
        sizes=[(s, s) for s in sizes],
    )


def write_png(svg_path: Path, output_path: Path, size: int) -> None:
    """
    Render the SVG at the given size and write it as a PNG.
    """
    img = render_svg_to_pil(svg_path, size)
    img.save(output_path, format="PNG", optimize=True)


def main():
    repo_root = Path(__file__).parent.parent
    svg_path = repo_root / "public" / "favicon.svg"

    if not svg_path.exists():
        print(f"Error: favicon source not found at {svg_path}", file=sys.stderr)
        sys.exit(1)

    public_dir = svg_path.parent

    # Multi-resolution .ico
    ico_path = public_dir / "favicon.ico"
    write_ico(svg_path, ico_path, ICO_SIZES)
    print(f"✓ {ico_path}  ({', '.join(f'{s}x{s}' for s in ICO_SIZES)})")

    # Single-resolution PNGs
    for filename, size in PNG_OUTPUTS:
        out = public_dir / filename
        write_png(svg_path, out, size)
        size_kb = out.stat().st_size // 1024
        print(f"✓ {out}  ({size}x{size}, {size_kb} KB)")


if __name__ == "__main__":
    main()
