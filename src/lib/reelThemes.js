// src/lib/reelThemes.js
// Shared THEMES for Instagram + Reels generators
// Design tokens extracted from actual wedding theme implementations
// URL: sarahiver.com (landing page)

export const THEMES = {
  classic: {
    name: 'Classic',
    // Elegant, timeless — cream tones, script font accents
    bg: '#FDFCFA', bgDark: '#1A1A1A',
    text: '#1A1A1A', textDark: '#FDFCFA',
    accent: '#999999', muted: '#999', body: '#555555',
    border: 'rgba(0,0,0,0.06)',
    headlineFont: "'Cormorant Garamond', Georgia, serif", headlineWeight: 300,
    scriptFont: "'Mrs Saint Delafield', cursive",
    bodyFont: "'Josefin Sans', sans-serif", bodyWeight: 300,
    uiFont: "'Josefin Sans', sans-serif",
    // Post-spezifisch
    headlineSize: '2.8rem',
    sublineSize: '1.1rem',
    bodySize: '0.95rem',
    footerSize: '0.45rem',
    logoStyle: { background: '#1A1A1A', color: '#fff', padding: '0.3rem 0.6rem' },
    logoDarkStyle: { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)', color: '#FDFCFA', padding: '0.3rem 0.6rem' },
    cardStyle: null, // clean, no card effect
  },

  editorial: {
    name: 'Editorial',
    // High contrast, magazine-inspired — red accent, uppercase headlines
    bg: '#FAFAFA', bgDark: '#0A0A0A',
    text: '#0A0A0A', textDark: '#FAFAFA',
    accent: '#C41E3A', muted: '#999', body: '#666666',
    border: '#E5E5E5',
    headlineFont: "'Oswald', sans-serif", headlineWeight: 700, headlineTransform: 'uppercase',
    scriptFont: "'Source Serif 4', Georgia, serif", scriptStyle: 'italic',
    bodyFont: "'Source Serif 4', Georgia, serif", bodyWeight: 400, bodyStyle: 'italic',
    uiFont: "'Inter', sans-serif",
    headlineSize: '3rem',
    sublineSize: '1.05rem',
    bodySize: '0.9rem',
    footerSize: '0.4rem',
    logoStyle: { background: '#0A0A0A', color: '#fff', padding: '0.3rem 0.6rem' },
    logoDarkStyle: { background: '#C41E3A', color: '#fff', padding: '0.3rem 0.6rem' },
    cardStyle: null, // clean editorial grid
  },

  botanical: {
    name: 'Botanical',
    // Dark, moody — Apple-style glassmorphism, plant greens
    bg: '#040604', bgDark: '#040604',
    text: 'rgba(255,255,255,0.95)', textDark: 'rgba(255,255,255,0.95)',
    accent: 'rgba(45, 90, 60, 0.8)', accentSolid: '#2D5A3C',
    muted: 'rgba(255,255,255,0.55)', body: 'rgba(255,255,255,0.55)',
    border: 'rgba(255,255,255,0.15)',
    gradient: 'linear-gradient(160deg, #030503 0%, #081208 40%, #050805 100%)',
    headlineFont: "'Cormorant Garamond', Georgia, serif", headlineWeight: 300,
    bodyFont: "'Montserrat', sans-serif", bodyWeight: 300,
    uiFont: "'Montserrat', sans-serif",
    headlineSize: '2.8rem',
    sublineSize: '1rem',
    bodySize: '0.85rem',
    footerSize: '0.4rem',
    alwaysDark: true,
    glass: true,
    glassStyle: {
      background: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(40px) saturate(180%)',
      WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '28px',
      boxShadow: '0 0 0 1px rgba(255,255,255,0.05) inset, 0 4px 6px rgba(0,0,0,0.1), 0 10px 40px rgba(0,0,0,0.25)',
    },
    logoStyle: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)', borderRadius: '8px', padding: '0.3rem 0.6rem' },
    logoDarkStyle: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)', borderRadius: '8px', padding: '0.3rem 0.6rem' },
    cardStyle: 'glass',
  },

  contemporary: {
    name: 'Contemporary',
    // Neobrutalism — bold shadows, multi-color accents, thick borders
    bg: '#FAFAFA', bgDark: '#0D0D0D',
    text: '#0D0D0D', textDark: '#fff',
    accent: '#FF6B6B', secondary: '#4ECDC4', tertiary: '#FFE66D', purple: '#9B5DE5', pink: '#F15BB5',
    muted: '#737373', body: '#525252',
    border: '#0D0D0D',
    headlineFont: "'Space Grotesk', sans-serif", headlineWeight: 700, headlineTransform: 'uppercase',
    bodyFont: "'Space Grotesk', sans-serif", bodyWeight: 400,
    uiFont: "'Space Grotesk', sans-serif",
    headlineSize: '3.2rem',
    sublineSize: '1.1rem',
    bodySize: '0.9rem',
    footerSize: '0.45rem',
    brutal: true,
    brutalShadow: '6px 6px 0 #0D0D0D',
    brutalBorder: '3px solid #0D0D0D',
    logoStyle: { background: '#0D0D0D', color: '#fff', padding: '0.3rem 0.6rem' },
    logoDarkStyle: { background: '#0D0D0D', color: '#FFE66D', padding: '0.3rem 0.6rem' },
    cardStyle: 'brutal',
  },

  luxe: {
    name: 'Luxe',
    // Ultra-premium dark — gold accents, cinematic feel
    bg: '#0A0A0A', bgDark: '#0A0A0A',
    text: '#F8F6F3', textDark: '#F8F6F3',
    accent: '#C9A962', champagne: '#D4AF37', rose: '#B76E79',
    muted: 'rgba(248,246,243,0.4)', body: 'rgba(248,246,243,0.45)',
    border: 'rgba(201,169,98,0.2)',
    headlineFont: "'Cormorant', Georgia, serif", headlineWeight: 300, headlineStyle: 'italic',
    bodyFont: "'Outfit', sans-serif", bodyWeight: 300,
    uiFont: "'Outfit', sans-serif",
    headlineSize: '2.8rem',
    sublineSize: '1rem',
    bodySize: '0.85rem',
    footerSize: '0.4rem',
    alwaysDark: true,
    logoStyle: { background: 'transparent', border: '1px solid rgba(201,169,98,0.3)', color: '#C9A962', padding: '0.3rem 0.6rem' },
    logoDarkStyle: { background: 'transparent', border: '1px solid rgba(201,169,98,0.3)', color: '#C9A962', padding: '0.3rem 0.6rem' },
    cardStyle: 'luxe', // subtle gold border glow
  },

  neon: {
    name: 'Neon',
    // Cyberpunk dark — neon glows, gradient accents, bold type
    bg: '#0a0a0f', bgDark: '#0a0a0f',
    text: '#fff', textDark: '#fff',
    accent: '#00ffff', secondary: '#ff00ff', tertiary: '#00ff88', purple: '#b347ff',
    muted: 'rgba(255,255,255,0.4)', body: 'rgba(255,255,255,0.5)',
    border: 'rgba(0,255,255,0.2)',
    glowCyan: '0 0 10px rgba(0,255,255,0.5), 0 0 30px rgba(0,255,255,0.3)',
    glowPink: '0 0 10px rgba(255,0,255,0.5), 0 0 30px rgba(255,0,255,0.3)',
    textGlow: '0 0 10px rgba(0,255,255,0.8), 0 0 20px rgba(0,255,255,0.5)',
    headlineFont: "'Space Grotesk', sans-serif", headlineWeight: 700, headlineTransform: 'uppercase',
    bodyFont: "'Space Grotesk', sans-serif", bodyWeight: 400,
    uiFont: "'Space Grotesk', sans-serif",
    headlineSize: '3rem',
    sublineSize: '1.05rem',
    bodySize: '0.85rem',
    footerSize: '0.4rem',
    alwaysDark: true,
    glow: true,
    logoStyle: { background: 'rgba(0,255,255,0.08)', border: '1px solid rgba(0,255,255,0.3)', color: '#00ffff', padding: '0.3rem 0.6rem' },
    logoDarkStyle: { background: 'rgba(0,255,255,0.08)', border: '1px solid rgba(0,255,255,0.3)', color: '#00ffff', padding: '0.3rem 0.6rem' },
    cardStyle: 'neon',
  },

  modern: {
    name: 'Modern',
    // Clean minimal parallax — warm neutrals, DM Sans, bold simplicity
    bg: '#FFFFFF', bgDark: '#000000',
    text: '#000000', textDark: '#FFFFFF',
    accent: '#000000', muted: '#888', body: '#555',
    border: 'rgba(0,0,0,0.08)',
    headlineFont: "'DM Sans', sans-serif", headlineWeight: 700,
    bodyFont: "'DM Sans', sans-serif", bodyWeight: 400,
    uiFont: "'DM Sans', sans-serif",
    headlineSize: '3rem',
    sublineSize: '1.1rem',
    bodySize: '0.9rem',
    footerSize: '0.45rem',
    logoStyle: { background: '#000', color: '#fff', padding: '0.3rem 0.6rem' },
    logoDarkStyle: { background: '#fff', color: '#000', padding: '0.3rem 0.6rem' },
    cardStyle: null,
  },

  video: {
    name: 'Video',
    // Cinematic dark — steel blue accent, layered typography
    bg: '#0A0A0A', bgDark: '#0A0A0A',
    text: '#fff', textDark: '#fff',
    accent: '#6B8CAE', accentLight: '#8BA5C1',
    muted: 'rgba(255,255,255,0.35)', body: '#B0B0B0',
    border: 'rgba(107,140,174,0.3)',
    headlineFont: "'Manrope', sans-serif", headlineWeight: 700,
    scriptFont: "'Cormorant Garamond', Georgia, serif", scriptStyle: 'italic',
    bodyFont: "'Inter', sans-serif", bodyWeight: 400,
    uiFont: "'Inter', sans-serif",
    headlineSize: '2.8rem',
    sublineSize: '1rem',
    bodySize: '0.85rem',
    footerSize: '0.4rem',
    alwaysDark: true,
    logoStyle: { background: 'transparent', border: '1px solid rgba(107,140,174,0.3)', color: '#6B8CAE', padding: '0.3rem 0.6rem' },
    logoDarkStyle: { background: 'transparent', border: '1px solid rgba(107,140,174,0.3)', color: '#6B8CAE', padding: '0.3rem 0.6rem' },
    cardStyle: 'video',
  },
};

// Font-family to Google Fonts URL mapping
const FONT_MAP = {
  'Cormorant Garamond': 'Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400',
  'Mrs Saint Delafield': 'Mrs+Saint+Delafield',
  'Josefin Sans': 'Josefin+Sans:wght@300;400;600',
  'Oswald': 'Oswald:wght@400;600;700',
  'Source Serif 4': 'Source+Serif+4:ital,wght@0,400;0,600;1,400',
  'Inter': 'Inter:wght@300;400;500;600;700',
  'Montserrat': 'Montserrat:wght@300;400;600',
  'Space Grotesk': 'Space+Grotesk:wght@400;600;700',
  'Cormorant': 'Cormorant:ital,wght@0,300;0,400;1,300;1,400',
  'Outfit': 'Outfit:wght@300;400;600',
  'Manrope': 'Manrope:wght@400;600;700',
  'DM Sans': 'DM+Sans:wght@400;500;700',
};

export async function loadThemeFonts(themeId) {
  const t = THEMES[themeId];
  if (!t) return;
  const families = new Set();
  [t.headlineFont, t.scriptFont, t.bodyFont, t.uiFont].forEach(f => {
    if (!f) return;
    const match = f.match(/'([^']+)'/);
    if (match && FONT_MAP[match[1]]) families.add(FONT_MAP[match[1]]);
  });
  if (families.size === 0) return;
  const url = `https://fonts.googleapis.com/css2?${[...families].map(f => `family=${f}`).join('&')}&display=swap`;
  if (document.querySelector(`link[href="${url}"]`)) return;
  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.onload = resolve;
    link.onerror = resolve;
    document.head.appendChild(link);
  });
}

export async function loadThemeFontsForCanvas(themeId) {
  const t = THEMES[themeId];
  if (!t) return;
  await loadThemeFonts(themeId);
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
}
