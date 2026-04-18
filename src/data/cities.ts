// src/data/cities.ts
//
// The list of cities shown on /cities/ (and linked from the home page).
// Matches §8.3 of the v1 plan, with one deliberate shape change:
//
// §8.3's example used `image: '/src/assets/cities/kolhapur.jpg'` — a
// plain string path. Astro's <Image>/<Picture> components need an
// ImageMetadata object (from an ESM import), not a string, so they
// can statically analyse dimensions and emit responsive srcsets + AVIF
// /WebP variants at build time. The entries below therefore import the
// files and attach the ImageMetadata objects directly. Semantically
// identical; syntactically what Astro's compiler needs.
//
// ─── A note on the three cover images ────────────────────────────────
// The files under src/assets/cities/ on the v1 branch are procedurally
// generated SOLID-COLOR GRADIENT PLACEHOLDERS, not real photographs.
// They exist so the build, typography, and layout can be verified
// end-to-end without waiting on the photo shoot. Each entry below has
// a commented-out `unsplashUrl` line; when a real photo is dropped in
// to replace the placeholder, fill in the Unsplash attribution URL so
// the photographer can be credited (Unsplash's terms require it only
// where technically possible, but it's the right thing to do).

import type { ImageMetadata } from 'astro';

// Cover imports. Keeping these top-of-file (rather than inline in the
// array) means the imports are visible to anyone scanning the file and
// easy to swap without touching the data shape.
import kolhapurCover from '@/assets/cities/kolhapur.jpg';
import bangaloreCover from '@/assets/cities/bangalore.jpg';
import puneCover from '@/assets/cities/pune.jpg';

export interface City {
  /** URL slug, used for /cities/#<slug> anchors (v1) and /cities/<slug>/ (v2). */
  slug: string;
  /** Display name — rendered as the card's H2. */
  name: string;
  /** One-line tagline under the name. Per §3.2: "A year in fragments", etc. */
  caption: string;
  /** Optional small meta line ("23 photos", "summer 2025") — §3.2. */
  meta?: string;
  /** Cover image — imported ImageMetadata so <Picture> can srcset it. */
  image: ImageMetadata;
  /**
   * Photographer attribution URL. Filled in when the procedurally-generated
   * placeholder is replaced with a real Unsplash photo. Unused in v1 rendering
   * (no UI for it yet), but stored here so credit can be surfaced later in
   * one place without hunting through component code.
   */
  unsplashUrl?: string;
}

export const cities: City[] = [
  {
    slug: 'kolhapur',
    name: 'Kolhapur',
    caption: 'Home, in the first sense of the word.',
    meta: '—',
    image: kolhapurCover,
    // unsplashUrl: 'https://unsplash.com/photos/<id>', // TODO when real photo lands
  },
  {
    slug: 'bangalore',
    name: 'Bangalore',
    caption: 'Weekends and weeknights, 2021–2023.',
    meta: '—',
    image: bangaloreCover,
    // unsplashUrl: 'https://unsplash.com/photos/<id>', // TODO when real photo lands
  },
  {
    slug: 'pune',
    name: 'Pune',
    caption: 'A monsoon, and then another.',
    meta: '—',
    image: puneCover,
    // unsplashUrl: 'https://unsplash.com/photos/<id>', // TODO when real photo lands
  },
];
