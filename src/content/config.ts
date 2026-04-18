// src/content/config.ts
//
// Defines the `essays` content collection. New essays go in
// src/content/essays/<slug>.mdx — Astro's content layer (the modern
// Astro 5.x replacement for the legacy `type: 'content'` API) discovers
// them automatically via the glob loader below.
//
// Spec deviation: §5/Phase 3 wrote this with `type: 'content'`, the
// legacy collection style. In Astro 5 the legacy API still works but
// emits a deprecation warning unless `legacy.collections: true` is set
// in astro.config.mjs. We use the modern `loader: glob({...})` shape
// instead — same Zod schema, no warning, no extra config flag.

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const essays = defineCollection({
  // **/*.{md,mdx} — accept both Markdown and MDX. v1 essays use MDX
  // (so they can embed <Footnote>), but the door is open to plain .md
  // for short notes that don't need components.
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/essays' }),
  schema: z.object({
    title: z.string(),
    // Subtitle is the small italic line under the H1 — see EssayLayout.
    subtitle: z.string().optional(),
    // z.coerce.date() (vs z.date() in the spec) is more permissive: it
    // accepts both YAML-parsed Date objects (`date: 2026-04-18` unquoted)
    // and ISO strings (`date: "2026-04-18"`). Either authoring style
    // works without surprising the writer.
    date: z.coerce.date(),
    // Drafts are excluded from production builds in the [...slug] route's
    // getStaticPaths filter. They remain visible in `getEntry` calls
    // (e.g. for previewing a specific draft URL while writing).
    draft: z.boolean().default(false),
  }),
});

export const collections = { essays };
