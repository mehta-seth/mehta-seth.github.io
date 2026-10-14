"""scripts/generate-collusion-figures.py

Figures for the help me learn note "Algorithmic Collusion in Financial Markets"
(src/content/notes/algorithmic-collusion.mdx). One script, deterministic output.

    python3 scripts/generate-collusion-figures.py            # writes the SVGs
    python3 scripts/generate-collusion-figures.py --png DIR  # also light/dark PNG previews

Writes src/assets/notes/algorithmic-collusion/*.svg. Each SVG draws in the site's
colour tokens (CSS variables, with the light theme as fallback) and the site's own
Newsreader files, so the inline figure follows the page theme. Build-time only:
needs numpy, matplotlib, fonttools and brotli (pip). The hot-stove simulation takes
a few minutes on first run and is cached in the system temp folder.

VISUAL TUNABLES are the constants in PALETTES, W and FS, and the figure functions."""
import os, re, sys, pickle, tempfile, numpy as np, matplotlib as mpl
mpl.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager
from matplotlib.patches import Rectangle
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'assets', 'notes', 'algorithmic-collusion')
CACHE = os.path.join(tempfile.gettempdir(), 'hml-collusion-sim.pkl')

def load_site_fonts():
    """Register the site's Newsreader WOFF2 files with matplotlib (converted to TTF in a temp dir)."""
    tmp = tempfile.mkdtemp(prefix='hml-fonts-'); family = None
    for f in ['newsreader-400', 'newsreader-400-italic', 'newsreader-600']:
        t = TTFont(os.path.join(ROOT, 'public', 'fonts', f + '.woff2')); t.flavor = None
        path = os.path.join(tmp, f + '.ttf'); t.save(path); font_manager.fontManager.addfont(path)
        family = family or font_manager.FontProperties(fname=path).get_name()
    return family

FAMILY = load_site_fonts()

# ---- VISUAL TUNABLES: palettes (light hex doubles as the CSS fallback) ----
PALETTES = {
 'light': dict(text='#1a1814', muted='#6a6358', accent='#8a5a2b', border='#e8e2d4', blue='#3e6d93',
               accent_soft='#ecdcc8', band='#ece7dd', bg='#faf8f3'),
 'dark':  dict(text='#e8e4dc', muted='#a0978a', accent='#d4a574', border='#2a2a2a', blue='#8fb6d8',
               accent_soft='#3b2e21', band='#262626', bg='#181818'),
}
CSSVAR = dict(text='--text', muted='--text-muted', accent='--accent', border='--border', blue='--fig-blue',
              accent_soft='--fig-accent-soft', band='--fig-band', bg='--bg')
W = 7.5            # inches at 72 dpi -> 540pt = 720px wide
FS = 12.5          # base font size in pt (~16.7px at 1:1)

def setup(P):
    mpl.rcParams.update({
        'font.family': [FAMILY, 'DejaVu Serif'], 'font.size': FS, 'svg.fonttype': 'none', 'svg.hashsalt': 'hml-collusion',
        'text.color': P['text'], 'axes.labelcolor': P['muted'], 'axes.edgecolor': P['muted'],
        'xtick.color': P['muted'], 'ytick.color': P['muted'], 'axes.linewidth': 0.8,
        'xtick.major.size': 0, 'ytick.major.size': 0, 'xtick.major.pad': 6, 'ytick.major.pad': 6,
        'axes.spines.top': False, 'axes.spines.right': False, 'axes.titlesize': FS, 'axes.titleweight': 'semibold',
        'axes.titlelocation': 'left', 'axes.titlepad': 10, 'axes.labelsize': FS - 0.5,
        'xtick.labelsize': FS - 1.5, 'ytick.labelsize': FS - 1.5, 'lines.solid_capstyle': 'round',
        'figure.facecolor': 'none', 'axes.facecolor': 'none', 'savefig.facecolor': 'none'})

def grid_y(ax, P):
    ax.yaxis.grid(True, color=P['border'], linewidth=0.9); ax.set_axisbelow(True)

# ---------------- Figure 1: one trading day in the toy market ----------------
def fig1(P):
    fig, ax = plt.subplots(figsize=(W, 5.3))
    grid_y(ax, P)
    cols = [(0.0, 30, 'accent', 'Both hold back', '30 blocks each', '60p', '30 × 60p = £18.00', 'price closes\nhalfway up'),
            (1.15, 40, 'blue', 'Both trade hard', '40 blocks each', '40p', '40 × 40p = £16.00', 'price closes\ntwo-thirds of the way up')]
    bw = 0.34
    for x, q, c, title, sub, gap, earn, close in cols:
        for k, who in enumerate(['A', 'B']):
            ax.add_patch(Rectangle((x - bw/2, k*q), bw, q, facecolor=P[c], edgecolor=P['bg'], linewidth=2))
            ax.text(x, k*q + q/2, f'{who} buys {q}', ha='center', va='center', color=P['bg'], fontsize=FS - 1)
        top = 2*q
        ax.add_patch(Rectangle((x - bw/2, top), bw, 120 - top, facecolor='none', edgecolor=P[c],
                               linewidth=1.2, linestyle=(0, (3, 3))))
        ax.text(x, top + (120 - top)/2, f'{gap} left\nfor every\nblock', ha='center', va='center',
                color=P[c], fontsize=FS - 1, linespacing=1.2)
        ax.text(x + bw/2 + 0.05, top, close, ha='left', va='center', color=P['muted'], fontsize=FS - 2, linespacing=1.15)
        ax.text(x, -14.4, title, ha='center', va='top', fontweight='semibold', fontsize=FS)
        ax.text(x, -24.6, sub, ha='center', va='top', color=P['muted'], fontsize=FS - 1.5)
        ax.text(x, -34.2, 'each earns ' + earn, ha='center', va='top', color=P['text'], fontsize=FS - 1.5)
    ax.axhline(120, color=P['text'], linewidth=1, linestyle=(0, (1, 2.5)))
    ax.text(1.95, 121.8, 'true value', ha='right', va='bottom', color=P['text'], fontsize=FS - 1.5)
    ax.set_xlim(-0.5, 1.95); ax.set_ylim(0, 129.6)
    ax.set_yticks([0, 30, 60, 90, 120]); ax.set_xticks([])
    ax.spines['left'].set_visible(False)
    ax.set_ylabel('price, pence above the opening price')
    fig.subplots_adjust(left=0.1, right=0.99, top=0.97, bottom=0.25)
    return fig

# ---------------- Figure 2: same cheat, different fog ----------------
def fig2(P):
    fig, axes = plt.subplots(2, 1, figsize=(W, 6.2), sharex=True)
    x = np.linspace(-2.6, 4.6, 360)
    pdf = lambda m, s: np.exp(-0.5*((x - m)/s)**2)/(s*np.sqrt(2*np.pi))
    ax = axes[0]
    ax.fill_between(x, pdf(1, 1), color=P['accent_soft'], linewidth=0)
    ax.plot(x, pdf(1, 1), color=P['accent'], linewidth=2)
    ax.plot(x, pdf(1.207, 1), color=P['blue'], linewidth=2, linestyle=(0, (5, 2.5)))
    ax.text(-0.3, 0.22, 'both hold back', color=P['accent'], ha='right', va='center', fontsize=FS - 1)
    ax.text(2.45, 0.22, 'one cheats', color=P['blue'], ha='left', va='center', fontsize=FS - 1)
    ax.set_title("Kyle's market, at any level of noise")
    ax.text(4.55, 0.44, 'the cheat shifts the price by 0.21;\nnoise spreads it by about ±1', ha='right', va='top',
            color=P['muted'], fontsize=FS - 2, linespacing=1.25)
    ax = axes[1]
    h = pdf(1, 1).max()
    for m, c, ls in [(1.0, 'accent', '-'), (1.1667, 'blue', (0, (5, 2.5)))]:
        ax.plot([m, m], [0, h], color=P[c], linewidth=2, linestyle=ls)
        ax.plot([m], [h], marker='o', markersize=5, color=P[c])
    ax.text(0.93, 0.22, 'both hold back', color=P['accent'], ha='right', va='center', fontsize=FS - 1)
    ax.text(1.24, 0.22, 'one cheats', color=P['blue'], ha='left', va='center', fontsize=FS - 1)
    ax.set_title('Plenty of price-only investors, little noise')
    ax.text(4.55, 0.44, 'the cheat shifts the price by 0.17;\nnoise of about ±0.0004 is too narrow to draw', ha='right',
            va='top', color=P['muted'], fontsize=FS - 2, linespacing=1.25)
    for ax in axes:
        ax.set_ylim(0, 0.45); ax.set_yticks([]); ax.spines['left'].set_visible(False)
    axes[1].set_xlim(-2.6, 4.6); axes[1].set_xticks([-2, -1, 0, 1, 2, 3, 4])
    axes[1].set_xlabel('where the price lands after a typical signal (1 = the move the cartel causes)')
    fig.subplots_adjust(left=0.03, right=0.985, top=0.94, bottom=0.12, hspace=0.38)
    return fig

# ---------------- Figure 3: the hot stove ----------------
HOLD, DEV, NASH = 1/8, 9/64, 1/9          # normalised payoffs: cartel, best deviation, competition
def bandit(nu, alpha, n_runs, T=60000, explore_T=6000, seed=0, keep=0, every=100):
    rng = np.random.default_rng(seed)
    Q = np.full((n_runs, 2), (HOLD + DEV)/2); beta = 5.0/explore_T; idx = np.arange(n_runs)
    paths = np.zeros((keep, T//every)); hold_paths = np.zeros((keep, T//every))
    for t in range(T):
        eps = np.exp(-beta*t)
        a = np.where(rng.random(n_runs) < eps, rng.integers(0, 2, n_runs), Q.argmax(1))
        e = nu*rng.standard_normal(n_runs)
        r = np.where(a == 1, DEV - 0.375*e, HOLD - 0.25*e)
        Q[idx, a] = (1 - alpha)*Q[idx, a] + alpha*r
        if keep and t % every == 0:
            paths[:, t//every] = Q[:keep, 1]; hold_paths[:, t//every] = Q[:keep, 0]
    return (Q.argmax(1) == 0), paths, hold_paths


def pick_learner(nu=0.2, alpha=0.05, n=400, T=40000, explore_T=6000, seed=5):
    """The illustrated learner in Figure 3: the first of n learners whose deviation is written off for good
    (last tried between 3,000 and 15,000 trades, and clearly below holding back at the end)."""
    rng = np.random.default_rng(seed); Q = np.full((n, 2), (HOLD + DEV)/2); beta = 5/explore_T; idx = np.arange(n)
    hist = np.zeros((T, n, 2)); last = np.zeros(n, int)
    for t in range(T):
        eps = np.exp(-beta*t); a = np.where(rng.random(n) < eps, rng.integers(0, 2, n), Q.argmax(1))
        e = nu*rng.standard_normal(n); r = np.where(a == 1, DEV - 0.375*e, HOLD - 0.25*e)
        Q[idx, a] = (1 - alpha)*Q[idx, a] + alpha*r; last[a == 1] = t; hist[t] = Q
    held = hist[-1].argmax(1) == 0
    i = next(k for k in range(n) if held[k] and 3000 < last[k] < 15000 and hist[-1, k, 0] - hist[-1, k, 1] > 0.004)
    return dict(off=hist[:, i, :].copy(), last=int(last[i]))

def fig3(P, data):
    import pickle
    L = data['learner']
    fig, axes = plt.subplots(2, 1, figsize=(W, 7.6))
    ax = axes[0]; grid_y(ax, P)
    off = L['off']/NASH; t_all = np.arange(off.shape[0])/1000
    ax.axhline(DEV/NASH, color=P['blue'], linewidth=1, linestyle=(0, (1, 2.5)))
    ax.plot(t_all[::100], off[::100, 0], color=P['accent'], linewidth=0.8, alpha=0.75)
    ax.plot(t_all[::20], off[::20, 1], color=P['blue'], linewidth=1.4)
    tr = ax.get_yaxis_transform()
    ax.text(1.012, DEV/NASH, 'deviating really\nearns 1.27', transform=tr, va='center', ha='left', color=P['blue'], fontsize=FS - 2.5, linespacing=1.1)
    ax.text(1.012, HOLD/NASH, 'score for\nholding back', transform=tr, va='center', ha='left', color=P['accent'], fontsize=FS - 2.5, linespacing=1.1)
    ax.text(1.012, off[-1, 1], 'score for\ndeviating', transform=tr, va='center', ha='left', color=P['blue'], fontsize=FS - 2.5, linespacing=1.1)
    ax.text(26.5, 0.79, 'Each time the score for deviating dips below holding\nback, the learner stops deviating and the score freezes.\nAfter one deep enough dip, it is never tried again.',
            ha='center', va='top', color=P['muted'], fontsize=FS - 2.5, linespacing=1.25)
    ax.set_xlim(0, 40); ax.set_ylim(0.62, 1.66); ax.set_yticks([0.8, 1.0, 1.2, 1.4, 1.6])
    ax.set_xlabel('trades, thousands'); ax.set_ylabel('score\n(1 = competitive profit)')
    ax.set_title('One learner in a foggy market (fog 0.2)')
    ax = axes[1]; grid_y(ax, P)
    nus = data['nus']
    ax.plot(nus, data['share'][0.05]*100, color=P['accent'], linewidth=2, marker='o', markersize=3, label='learning rate 0.05')
    ax.plot(nus, data['share'][0.01]*100, color=P['accent'], linewidth=2, linestyle=(0, (5, 2.5)), marker='o', markersize=3, label='learning rate 0.01')
    ax.legend(loc='center left', bbox_to_anchor=(0.06, 0.5), frameon=False, fontsize=FS - 2, handlelength=2.6)
    for nu, lab, ha, dx in [(0.0002, 'little noise', 'left', 1.12), (0.2, 'heavy noise', 'right', 0.9), (0.5, "Kyle's market", 'left', 1.1)]:
        ax.axvline(nu, color=P['muted'], linewidth=0.9, linestyle=(0, (1, 2.5)))
        ax.text(nu*dx, 106, lab, ha=ha, va='center', color=P['muted'], fontsize=FS - 2)
    ax.set_xscale('log'); ax.set_xlim(1e-4, 2); ax.set_ylim(0, 112)
    ax.set_xticks([1e-4, 1e-3, 1e-2, 1e-1, 1]); ax.set_xticklabels(['0.0001', '0.001', '0.01', '0.1', '1'])
    ax.set_yticks([0, 25, 50, 75, 100]); ax.set_yticklabels(['0%', '25%', '50%', '75%', '100%'])
    ax.set_xlabel('fog in the price (log scale)'); ax.set_ylabel('learners that end\nup holding back')
    ax.set_title('How often the deviation gets written off')
    fig.subplots_adjust(left=0.14, right=0.84, top=0.95, bottom=0.08, hspace=0.5)
    return fig

# ---------------- Figure 4: the two fingerprints (schematic) ----------------
def fig4(P):
    fig, axes = plt.subplots(2, 1, figsize=(W, 6.6))
    ax = axes[0]
    days = np.arange(1, 9); reflex = [0, 0, 0, 1, 0.35, 0.05, 0, 0]
    ax.axvspan(2.6, 3.4, color=P['band'], linewidth=0)
    ax.text(3, 1.27, 'burst of noise trading:\nthe price jumps', ha='center', va='top', color=P['muted'], fontsize=FS - 2, linespacing=1.2)
    ax.plot(days, [0]*8, color=P['muted'], linewidth=2.6, linestyle=(0, (4, 2.5)), alpha=0.8, zorder=2)
    ax.plot(days, reflex, color=P['text'], linewidth=2, marker='o', markersize=5, zorder=3)
    ax.text(4.15, 1.0, 'learned reflex: trades hard the next day', va='center', color=P['text'], fontsize=FS - 1.5)
    ax.text(8.15, -0.13, 'learned blind spot: no change', ha='right', va='top', color=P['muted'], fontsize=FS - 1.5)
    ax.text(1.0, 0.98, 'schematic', transform=ax.transAxes, ha='right', va='bottom', color=P['muted'], fontsize=FS - 3, style='italic')
    ax.set_xlim(0.6, 8.4); ax.set_ylim(-0.32, 1.3); ax.set_xticks(days); ax.set_xlabel('day')
    ax.set_yticks([0, 1]); ax.set_yticklabels(['normal', 'hard'])
    ax.spines['left'].set_visible(False); ax.set_title('How hard the programs trade, day by day')
    ax = axes[1]
    cats = ['tiny\n(0.25%)', 'medium\n(2.5%)', 'large\n(11.5%)', 'very large\n(15%)']; xs = np.arange(4)
    ax.plot(xs, [0, 0, 0, 0], color=P['muted'], linewidth=2.6, linestyle=(0, (4, 2.5)), alpha=0.8, marker='o', markersize=6,
            markerfacecolor=P['bg'], zorder=2)
    ax.plot([0, 0.5], [0, 0], color=P['text'], linewidth=2, zorder=3)
    ax.plot([0.5, 0.5], [0, 1], color=P['text'], linewidth=1.2, linestyle=(0, (1, 2.5)), zorder=3)
    ax.plot([0.5, 3], [1, 1], color=P['text'], linewidth=2, zorder=3)
    ax.plot(xs, [0, 1, 1, 1], color=P['text'], linewidth=0, marker='o', markersize=6, zorder=4)
    ax.text(0.55, 0.5, 'threshold\nsomewhere here', ha='left', va='center', color=P['muted'], fontsize=FS - 2, linespacing=1.2)
    ax.text(3.12, 1.0, 'learned reflex', ha='left', va='center', color=P['text'], fontsize=FS - 1.5)
    ax.text(3.12, 0.0, 'learned blind spot', ha='left', va='center', color=P['muted'], fontsize=FS - 1.5)
    ax.text(1.0, 0.98, 'schematic', transform=ax.transAxes, ha='right', va='bottom', color=P['muted'], fontsize=FS - 3, style='italic')
    ax.set_xlim(-0.35, 4.0); ax.set_ylim(-0.15, 1.2); ax.set_xticks(xs); ax.set_xticklabels(cats)
    ax.set_yticks([0, 1]); ax.set_yticklabels(['none', 'hard\ntrading'])
    ax.set_xlabel('size of the burst, as a share of a typical order'); ax.spines['left'].set_visible(False)
    ax.set_title('Day-4 response, by size of the burst')
    fig.subplots_adjust(left=0.12, right=0.98, top=0.94, bottom=0.13, hspace=0.75)
    return fig

# ---------------- Figure 5: the map (schematic) ----------------
def fig5(P):
    fig, ax = plt.subplots(figsize=(W, 4.0))
    x = np.linspace(0, 1, 600)
    reflex = 0.85/(1 + np.exp((x - 0.33)/0.06)); blind = 0.85/(1 + np.exp(-(x - 0.62)/0.07))
    y = reflex + blind + 0.12
    ax.axvspan(0, 0.4, color=P['accent_soft'], linewidth=0, alpha=0.7)
    ax.axvspan(0.55, 1, color=P['band'], linewidth=0)
    ax.plot(x, y, color=P['accent'], linewidth=2.4)
    ax.text(0.03, 0.62, 'a learned reflex\nholds restraint\nin place', va='center', color=P['text'], fontsize=FS - 1.5, linespacing=1.2)
    ax.text(0.97, 0.62, 'the learned\nblind spot\ntakes over', ha='right', va='center', color=P['text'], fontsize=FS - 1.5, linespacing=1.2)
    ax.text(0.475, 0.06, 'collusion\nweakest', ha='center', va='bottom', color=P['muted'], fontsize=FS - 2, linespacing=1.2)
    for xm, lab in [(0.08, 'price-only investors,\nlittle noise'), (0.74, 'price-only investors,\nheavy noise'), (0.92, "Kyle's market,\nany noise")]:
        ax.plot([xm], [-0.02], marker='^', markersize=8, color=P['muted'], clip_on=False)
        ax.text(xm, -0.09, lab, ha='center', va='top', color=P['muted'], fontsize=FS - 2.5, linespacing=1.15)
    ax.set_xlim(0, 1); ax.set_ylim(0, 1.12)
    ax.set_xticks([]); ax.set_yticks([0.12, 0.97]); ax.set_yticklabels(['little', 'strong'])
    ax.set_ylabel('collusion'); ax.spines['left'].set_visible(False)
    ax.annotate('', xy=(1, -0.31), xytext=(0, -0.31), xycoords='axes fraction', textcoords='axes fraction',
                arrowprops=dict(arrowstyle='->', color=P['muted'], linewidth=1))
    ax.text(0.5, -0.36, 'fog in the price: thinner to thicker (schematic)', transform=ax.transAxes, ha='center',
            va='top', color=P['muted'], fontsize=FS - 1.5)
    fig.subplots_adjust(left=0.11, right=0.985, top=0.97, bottom=0.32)
    return fig

# ---------------- Supplementary: two markets, two temptations ----------------
def figS(P):
    fig, axes = plt.subplots(2, 1, figsize=(W, 6.6), sharex=True)
    u = np.linspace(0.5, 1.1, 400)
    specs = [("Kyle's market", 3*u/(2*u**2 + 1), 3*(u**2 + 1)**2/(4*u*(2*u**2 + 1)), 1/np.sqrt(2), 1.061, 1.193),
             ('Fixed price impact, as in the toy market', 3*u - 2*u**2, (3 - u)**2/4, 0.75, 1.125, 1.266)]
    for ax, (title, solid, dashed, uc, ys, yd) in zip(axes, specs):
        grid_y(ax, P)
        ax.plot(u, solid, color=P['accent'], linewidth=2.2)
        ax.plot(u, dashed, color=P['blue'], linewidth=2.2, linestyle=(0, (5, 2.5)))
        ax.axvline(uc, color=P['muted'], linewidth=0.9, linestyle=(0, (1, 2.5)))
        ax.plot([uc], [ys], 'o', color=P['accent'], markersize=6); ax.plot([uc], [yd], 'o', color=P['blue'], markersize=6)
        ax.text(uc + 0.012, ys - 0.03, f'cartel: {ys:.3f}', color=P['accent'], va='top', fontsize=FS - 1.5)
        ax.text(uc + 0.012, yd + 0.025, f'cheat on a partner who holds back: {yd:.3f}', color=P['blue'], va='bottom', fontsize=FS - 1.5)
        ax.plot([1], [1], 'o', color=P['text'], markersize=5); ax.text(0.995, 0.955, 'competition', ha='right', va='top', fontsize=FS - 1.5)
        ax.text(0.52, 0.965, 'both hold back', color=P['accent'], va='top', fontsize=FS - 1.5)
        ax.set_ylim(0.9, 1.62); ax.set_yticks([1.0, 1.2, 1.4, 1.6]); ax.set_title(title)
        ax.set_ylabel('profit\n(1 = competition)')
    axes[1].set_xlim(0.5, 1.1); axes[1].set_xlabel('agreed trading intensity (1 = competitive intensity)')
    fig.subplots_adjust(left=0.13, right=0.97, top=0.95, bottom=0.1, hspace=0.32)
    return fig

def to_theme_svg(svg, P, alt, name):
    for role, hexv in P.items():
        svg = re.sub(re.escape(hexv), f'var({CSSVAR[role]}, {hexv})', svg, flags=re.I)
    svg = re.sub(r"font-family:[^;\"]*Newsreader[^;\"]*", "font-family: 'HML Math', 'Newsreader', Charter, Georgia, serif", svg)
    svg = re.sub(r'<svg([^>]*?) width="[^"]*" height="[^"]*"', r'<svg\1 width="100%" role="img"', svg, count=1)
    svg = re.sub(r'(<svg[^>]*>)', r'\1<title>' + alt.replace('&', '&amp;') + '</title>', svg, count=1)
    svg = re.sub(r'<\?xml[^>]*\?>\s*|<!DOCTYPE[^>]*>\s*', '', svg)
    svg = re.sub(r'id="([^"]+)"', lambda m: f'id="{name}-{m.group(1)}"', svg)          # unique ids when several SVGs are inlined
    svg = re.sub(r'url\(#([^)]+)\)', lambda m: f'url(#{name}-{m.group(1)})', svg)
    svg = re.sub(r'href="#([^"]+)"', lambda m: f'href="#{name}-{m.group(1)}"', svg)
    return svg

ALT = {
 'fig1': 'Two stacked bars of price impact. Holding back, each program buys 30 blocks and the price closes halfway to the true value, leaving 60p per block, so each earns £18.00. Trading hard, each buys 40 blocks and the price closes two-thirds of the way up, leaving 40p per block, so each earns £16.00.',
 'fig2': "Two panels. In Kyle's market the price distributions with and without a cheat overlap almost completely. In a market with plenty of price-only investors and little noise, the two outcomes are thin lines 0.17 apart and easy to tell apart.",
 'fig3': "Top: one learner's score for deviating dips below its score for holding back several times and finally freezes at a low value, although deviating really pays more. Bottom: the share of learners that end up holding back is zero when the fog is thin and rises towards nearly all of them as the fog thickens.",
 'fig4': 'Schematic. After a burst of noise trading on day 3, programs with a learned reflex trade hard on day 4 and then return to normal, while programs with a blind spot do not react. The reflex ignores tiny bursts and responds equally to larger ones.',
 'fig5': "Schematic U-shaped curve of collusion against fog: strong where the fog is thin, held by a learned reflex; weakest in between; strong again where the fog is thick, through the learned blind spot. Kyle's market sits on the thick side.",
 'figS': "Profit relative to competition against the agreed trading intensity. In both Kyle's market and a market with fixed price impact, cheating on a partner who holds back earns more than holding back, which earns more than competition.",
}

NAMES = {'fig1': 'trading-day', 'fig2': 'fog', 'fig3': 'hot-stove', 'fig4': 'fingerprints', 'fig5': 'map', 'figS': 'temptation'}

if __name__ == '__main__':
    png_dir = sys.argv[sys.argv.index('--png') + 1] if '--png' in sys.argv else None
    os.makedirs(OUT, exist_ok=True)
    data = pickle.load(open(CACHE, 'rb')) if os.path.exists(CACHE) else {}
    if 'share' not in data:
        nus = np.logspace(-4, 0.3, 18)
        data = dict(nus=nus, share={a: np.array([bandit(nu, a, 2000, seed=11 + i)[0].mean() for i, nu in enumerate(nus)])
                                    for a in (0.05, 0.01)})
    if 'learner' not in data:
        data['learner'] = pick_learner()
    pickle.dump(data, open(CACHE, 'wb'))
    for theme, P in PALETTES.items():
        if theme == 'dark' and not png_dir:
            continue
        setup(P)
        for key, fn in [('fig1', fig1), ('fig2', fig2), ('fig3', lambda P: fig3(P, data)), ('fig4', fig4), ('fig5', fig5), ('figS', figS)]:
            fig = fn(P); name = NAMES[key]
            if png_dir:
                os.makedirs(png_dir, exist_ok=True)
                fig.savefig(os.path.join(png_dir, f'{name}-{theme}.png'), dpi=144, facecolor=P['bg'])
            if theme == 'light':
                path = os.path.join(OUT, f'{name}.svg')
                fig.savefig(path, format='svg', metadata={'Date': None})
                raw = open(path, encoding='utf-8').read()
                open(path, 'w', encoding='utf-8').write(to_theme_svg(raw, P, ALT[key], name))
            plt.close(fig)
    print('wrote', len(NAMES), 'SVGs to', os.path.relpath(OUT, ROOT))
