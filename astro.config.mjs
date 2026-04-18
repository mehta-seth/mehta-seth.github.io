// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkSmartypants from 'remark-smartypants';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

// https://astro.build/config
export default defineConfig({
  // Final site URL — swap when a custom domain is configured (§7, decision 1).
  site: 'https://mehta-seth.github.io',

  integrations: [
    tailwind({
      // We write our own base styles in src/styles/global.css and apply
      // tokens via CSS variables — don't let Tailwind inject its own preflight
      // overrides twice.
      applyBaseStyles: false,
    }),
    mdx(),
    sitemap(),
  ],

  markdown: {
    remarkPlugins: [remarkSmartypants],
    // Slugged headings + auto-anchor links — needed in Phase 3 for the ToC
    // to have real ids to scroll to. Wiring it now so essays Just Work later.
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'wrap',
          properties: { className: ['heading-anchor'] },
        },
      ],
    ],
  },

  // Phase 1 doesn't ship any client JS by default — the theme toggle will be
  // a tiny inline script, not an island. Keep the output as lean as possible.
});
