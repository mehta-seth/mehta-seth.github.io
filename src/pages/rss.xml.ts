// src/pages/rss.xml.ts
//
// Generates /rss.xml at build time from the `essays` content collection.
// Per §5/Phase 5 §5.5: "RSS 2.0 with title, description, pubDate, link,
// content (optional for v1)." Draft essays (draft: true in frontmatter)
// are filtered out — same rule as the [...slug].astro route, so the feed
// never advertises a URL that 404s.
//
// Feed discoverability: BaseLayout.astro embeds
//   <link rel="alternate" type="application/rss+xml" href="/rss.xml">
// in every page's <head>, so browsers and feed readers auto-discover
// the feed from any entry point on the site.

import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  // Filter drafts so the feed never points at a 404.
  // Sort: newest first — standard feed-reader convention. The essay
  // collection has no guaranteed sort order otherwise.
  const essays = (
    await getCollection('essays', ({ data }) => !data.draft)
  ).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: 'Adit Mehta — Essays',
    description:
      'Essays by Adit Mehta on markets, cities, and whatever else is keeping him up at night.',
    // context.site is configured in astro.config.mjs as the canonical
    // origin. If it's missing, @astrojs/rss throws — which is correct,
    // because a feed without absolute link URLs is useless.
    site: context.site!,
    items: essays.map((essay) => ({
      title: essay.data.title,
      // Subtitle when present, else an empty string — @astrojs/rss emits
      // a <description> tag either way; empty is valid RSS 2.0.
      description: essay.data.subtitle ?? '',
      pubDate: essay.data.date,
      // Modern Astro content-layer collections use `id` for the slug.
      link: `/essays/${essay.id}/`,
    })),
    // Tell feed readers where to find the stylesheet-less XML. Optional
    // but nice; some readers render a pretty preview when they see one.
    customData: '<language>en</language>',
  });
}
