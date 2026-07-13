// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkSmartypants from 'remark-smartypants';
import remarkMath from 'remark-math';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeKatex from 'rehype-katex';

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
    // remark-math tokenises `$…$` (inline) and `$$…$$` (display) at parse
    // time; rehype-katex (below) renders them to HTML + MathML at build.
    // Math is authored only in HML notes, but the pipeline is shared. This
    // is safe for the essay: it has no `$` in its content, so its output is
    // byte-identical, and the KaTeX stylesheet is imported by NoteLayout
    // alone, so only note pages ever load it. remark-math runs before
    // smartypants deliberately — it has already claimed the math spans, so
    // smartypants never touches a character inside them.
    remarkPlugins: [remarkMath, remarkSmartypants],
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
      // KaTeX render. throwOnError:false shows a bad expression as red text
      // instead of failing the build — the Math-Checker chat and the local
      // preview catch errors before a push (flip to true for hard failures).
      // strict:false tolerates ordinary real-world notation; htmlAndMathml
      // emits MathML alongside the visual HTML so screen readers get real
      // maths.
      [
        rehypeKatex,
        { strict: false, throwOnError: false, output: 'htmlAndMathml' },
      ],
    ],
  },

  // Phase 1 doesn't ship any client JS by default — the theme toggle will be
  // a tiny inline script, not an island. Keep the output as lean as possible.
});
