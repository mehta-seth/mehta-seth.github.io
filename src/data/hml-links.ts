// src/data/hml-links.ts
//
// Central registry for "help me learn" (HML) cross-reference links. The
// <Ref> component (src/components/Ref.astro) resolves a term to a URL here,
// so every cross-note link lives in ONE place: when a note moves or a slug
// changes, this file is the only edit.
//
// How it is used:
//   <Ref to="sigma-algebra">σ-algebra</Ref>
//     -> term IS registered  -> renders a link to entry.url
//     -> term is NOT here yet -> renders as plain text (a "pending" ref),
//        so a note can point forward to a topic that has not been written
//        without producing a dead link.
//
// To publish a cross-referenceable term: add ONE line below the moment its
// note goes live. `label` is optional metadata (not required by <Ref>, which
// uses its own slotted text); keep it only if it is genuinely useful.

export interface HmlLink {
  /** Absolute site path to the note, e.g. '/learn/sigma-algebras/'. */
  url: string;
  /** Optional human label for the term (metadata; <Ref> uses slot text). */
  label?: string;
}

export const hmlLinks: Record<string, HmlLink> = {
  'sigma-algebra': { url: '/learn/sigma-algebras/', label: 'σ-algebra' },
  // Add a term here the moment its note is published. One line per term.
};
