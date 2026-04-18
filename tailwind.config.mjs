/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  // Theme switching is driven by a `.dark` class on <html>, set by our
  // inline pre-paint script. This is independent of prefers-color-scheme
  // (§3.5: we explicitly default to dark on first visit).
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-elevated': 'var(--bg-elevated)',
        ink: 'var(--text)',
        'ink-muted': 'var(--text-muted)',
        accent: 'var(--accent)',
        border: 'var(--border)',
      },
      fontFamily: {
        // Body serif — Newsreader, then a carefully chosen fallback chain.
        // Charter / Georgia are broadly-available transitional serifs that
        // match Newsreader's tone closely, so the FOUT (if any) doesn't
        // reflow text in a jarring way.
        serif: [
          'Newsreader',
          'Charter',
          'Georgia',
          'Cambria',
          '"Times New Roman"',
          'Times',
          'serif',
        ],
        // Devanagari wordmark only — never body text (§3.4).
        kalam: ['Kalam', '"Noto Sans Devanagari"', 'system-ui', 'sans-serif'],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'monospace',
        ],
      },
      maxWidth: {
        // Home card from §3.7. Essays use their own max-width (§3.2).
        card: '40rem', // ~640px
        essay: '42.5rem', // ~680px
      },
    },
  },
  plugins: [],
};
