// src/utils/getImageUrl.ts
//
// A seam for future Cloudflare R2 migration (§4.3 of the v1 plan).
//
// In v1, images live in src/assets/ and are imported as ESM modules
// (`import cover from '.../kolhapur.jpg'`) so Astro's <Image>/<Picture>
// components can statically analyse them, generate responsive srcsets,
// and emit AVIF/WebP variants at build time. That pattern yields an
// ImageMetadata object, not a string — it does NOT flow through this
// helper, and shouldn't: there's nothing for a helper to resolve about
// a build-time asset that the compiler has already fully resolved.
//
// What this helper is for is the OTHER kind of image reference: any
// path or key that needs to become a runtime URL. In v1 there are
// almost none of these. In v2, when the photo archive migrates to R2
// (§4.3, Option A), individual city pages will reference dozens of
// photos by semantic key (e.g. 'cities/bangalore/2022-monsoon-07.jpg')
// without ingesting them into the Astro build. Those will flow through
// this function.
//
// v1 shape:
//   getImageUrl('cities/bangalore/cover.jpg')
//     → '/src/assets/cities/cover.jpg'   (local, passthrough-ish)
//
// v2 shape (future):
//   getImageUrl('cities/bangalore/cover.jpg')
//     → 'https://img.aditmehta.com/cities/bangalore/cover.jpg'
//
// The contract (takes a semantic key, returns a string URL) is
// deliberately held stable so migration is a one-function change.

/**
 * Resolve a semantic image key to a URL.
 *
 * @param key - A path-like semantic key, e.g. 'cities/bangalore/cover.jpg'.
 *              Leading slashes are tolerated and stripped. Must not contain
 *              schemes (http://, https://) — pass those through directly.
 * @returns A URL string usable as an <img src>, <a href>, or Open Graph value.
 */
export function getImageUrl(key: string): string {
  // Pass already-absolute URLs through unchanged — tolerates callers who
  // mix helper-resolved and direct URLs during the v1→v2 migration.
  if (/^https?:\/\//i.test(key)) return key;

  // Normalise: trim leading slashes so 'cities/…' and '/cities/…' both work.
  const clean = key.replace(/^\/+/, '');

  // v1 behaviour: return a root-relative path into src/assets/.
  // Note: this helper is NOT the path used by Astro's <Image> for Phase 4
  // covers — those use ESM imports. It exists for future R2 callers.
  return `/src/assets/${clean}`;
}

// When we migrate to R2 (v2), this is the expected replacement:
//
//   const R2_BASE = 'https://img.aditmehta.com';
//   export function getImageUrl(key: string): string {
//     if (/^https?:\/\//i.test(key)) return key;
//     const clean = key.replace(/^\/+/, '');
//     return `${R2_BASE}/${clean}`;
//   }
//
// Callers don't change; only this file does.
