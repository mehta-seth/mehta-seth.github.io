"""Generate a 200x200 tileable film-grain texture as PNG.

This runs once at build-prep time. The output is a luminance-only noise
field designed to sit at 3–5% opacity over the site background and add
a subtle 'paper / film grain' feel per §3.6 of the plan.

Tileability: we use a seamless noise pattern by blending random values
with their wrapped-around counterparts on the edges, so when the tile
repeats there's no visible seam.
"""

from PIL import Image
import random
import math

SIZE = 200
random.seed(42)  # deterministic output — same grain every build

# Build a 2D noise array where each pixel is a random integer 0..255,
# but with edge-blending so the pattern tiles seamlessly.
raw = [[random.randint(0, 255) for _ in range(SIZE)] for _ in range(SIZE)]

# Seamless-tiling trick: blend each pixel with a copy offset by (SIZE/2, SIZE/2).
# This guarantees that pixel (x,y) and pixel ((x+SIZE)%SIZE, (y+SIZE)%SIZE)
# are related in a way that removes hard edges at the tile boundary.
blended = [[0] * SIZE for _ in range(SIZE)]
for y in range(SIZE):
    for x in range(SIZE):
        a = raw[y][x]
        b = raw[(y + SIZE // 2) % SIZE][(x + SIZE // 2) % SIZE]
        # Distance from edge as a 0..1 weight — pixels near any edge lean more
        # on the wrapped copy, making the seam invisible.
        dx = min(x, SIZE - 1 - x) / (SIZE / 2)
        dy = min(y, SIZE - 1 - y) / (SIZE / 2)
        w = min(dx, dy)
        blended[y][x] = int(a * w + b * (1 - w))

# Flatten into a grayscale image.
img = Image.new("L", (SIZE, SIZE))
img.putdata([blended[y][x] for y in range(SIZE) for x in range(SIZE)])
img.save("public/textures/grain.png", optimize=True)
print(f"Wrote public/textures/grain.png ({SIZE}x{SIZE})")
