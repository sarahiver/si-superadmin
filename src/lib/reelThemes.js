// src/lib/reelThemes.js
// Shared THEMES for Instagram + Reels generators
// Extracted from InstagramPage to avoid duplication

export const THEMES = {
  classic: {
    name: 'Classic', bg: '#FFFFFF', bgDark: '#000000', text: '#000000', textDark: '#FFFFFF',
    accent: '#000000', accentDark: '#FFFFFF', muted: '#999', body: '#555',
    headlineFont: "'Cormorant Garamond', Georgia, serif", headlineWeight: 300,
    scriptFont: "'Mrs Saint Delafield', cursive",
    bodyFont: "'Josefin Sans', sans-serif", bodyWeight: 300,
    uiFont: "'Josefin Sans', sans-serif",
    logoStyle: { background: '#1A1A1A', color: '#fff' },
    logoDarkStyle: { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)', color: '#FDFCFA' },
  },
  editorial: {
    name: 'Editorial', bg: '#FAFAFA', bgDark: '#0A0A0A', text: '#0A0A0A', textDark: '#FAFAFA',
    accent: '#C41E3A', muted: '#999', body: '#666',
    headlineFont: "'Oswald', sans-serif", headlineWeight: 700, headlineTransform: 'uppercase',
    scriptFont: "'Source Serif 4', Georgia, serif", scriptStyle: 'italic',
    bodyFont: "'Source Serif 4', Georgia, serif", bodyWeight: 400, bodyStyle: 'italic',
    uiFont: "'Inter', sans-serif",
    logoStyle: { background: '#0A0A0A', color: '#fff' },
    logoDarkStyle: { background: '#C41E3A', color: '#fff' },
  },
  botanical: {
    name: 'Botanical', bg: '#040604', bgDark: '#040604', text: 'rgba(255,255,255,0.95)', textDark: 'rgba(255,255,255,0.95)',
    accent: 'rgba(45,90,60,0.8)', muted: 'rgba(255,255,255,0.4)', body: 'rgba(255,255,255,0.5)',
    headlineFont: "'Cormorant Garamond', Georgia, serif", headlineWeight: 300,
    bodyFont: "'Montserrat', sans-serif", bodyWeight: 300,
    uiFont: "'Montserrat', sans-serif",
    alwaysDark: true, glass: true,
    logoStyle: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)', borderRadius: '8px' },
    logoDarkStyle: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)', borderRadius: '8px' },
  },
  contemporary: {
    name: 'Contemporary', bg: '#FAFAFA', bgDark: '#0D0D0D', text: '#0D0D0D', textDark: '#fff',
    accent: '#FF6B6B', secondary: '#4ECDC4', tertiary: '#FFE66D',
    muted: '#999', body: '#525252',
    headlineFont: "'Space Grotesk', sans-serif", headlineWeight: 700, headlineTransform: 'uppercase',
    bodyFont: "'Space Grotesk', sans-serif", bodyWeight: 400,
    uiFont: "'Space Grotesk', sans-serif",
    brutal: true,
    logoStyle: { background: '#0D0D0D', color: '#fff' },
    logoDarkStyle: { background: '#0D0D0D', color: '#FFE66D' },
  },
  luxe: {
    name: 'Luxe', bg: '#0A0A0A', bgDark: '#0A0A0A', text: '#F8F6F3', textDark: '#F8F6F3',
    accent: '#C9A962', muted: 'rgba(248,246,243,0.4)', body: 'rgba(248,246,243,0.45)',
    headlineFont: "'Cormorant', Georgia, serif", headlineWeight: 300, headlineStyle: 'italic',
    bodyFont: "'Outfit', sans-serif", bodyWeight: 300,
    uiFont: "'Outfit', sans-serif",
    alwaysDark: true,
    logoStyle: { background: 'transparent', border: '1px solid rgba(201,169,98,0.3)', color: '#C9A962' },
    logoDarkStyle: { background: 'transparent', border: '1px solid rgba(201,169,98,0.3)', color: '#C9A962' },
  },
  neon: {
    name: 'Neon', bg: '#0a0a0f', bgDark: '#0a0a0f', text: '#fff', textDark: '#fff',
    accent: '#00ffff', secondary: '#ff00ff', tertiary: '#00ff88',
    muted: 'rgba(255,255,255,0.4)', body: 'rgba(255,255,255,0.5)',
    headlineFont: "'Space Grotesk', sans-serif", headlineWeight: 700, headlineTransform: 'uppercase',
    bodyFont: "'Space Grotesk', sans-serif", bodyWeight: 400,
    uiFont: "'Space Grotesk', sans-serif",
    alwaysDark: true, glow: true,
    logoStyle: { background: 'rgba(0,255,255,0.08)', border: '1px solid rgba(0,255,255,0.3)', color: '#00ffff' },
    logoDarkStyle: { background: 'rgba(0,255,255,0.08)', border: '1px solid rgba(0,255,255,0.3)', color: '#00ffff' },
  },
  modern: {
    name: 'Modern', bg: '#F5F0EB', bgDark: '#1A1A1A', text: '#1A1A1A', textDark: '#F5F0EB',
    accent: '#8B6F4E', muted: '#999', body: '#666',
    headlineFont: "'Cormorant Garamond', Georgia, serif", headlineWeight: 300,
    scriptFont: "'Cormorant Garamond', Georgia, serif", scriptStyle: 'italic',
    bodyFont: "'Montserrat', sans-serif", bodyWeight: 300,
    uiFont: "'Montserrat', sans-serif",
    logoStyle: { background: '#1A1A1A', color: '#F5F0EB' },
    logoDarkStyle: { background: 'rgba(139,111,78,0.15)', border: '1px solid rgba(139,111,78,0.3)', color: '#8B6F4E' },
  },
  video: {
    name: 'Video', bg: '#0A0A0A', bgDark: '#0A0A0A', text: '#fff', textDark: '#fff',
    accent: '#6B8CAE', muted: 'rgba(255,255,255,0.35)', body: '#B0B0B0',
    headlineFont: "'Manrope', sans-serif", headlineWeight: 700,
    scriptFont: "'Cormorant Garamond', Georgia, serif", scriptStyle: 'italic',
    bodyFont: "'Inter', sans-serif", bodyWeight: 400,
    uiFont: "'Inter', sans-serif",
    alwaysDark: true,
    logoStyle: { background: 'transparent', border: '1px solid rgba(107,140,174,0.3)', color: '#6B8CAE' },
    logoDarkStyle: { background: 'transparent', border: '1px solid rgba(107,140,174,0.3)', color: '#6B8CAE' },
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
};

// Load Google Fonts required for a specific theme into the document
export async function loadThemeFonts(themeId) {
  const t = THEMES[themeId];
  if (!t) return;

  // Collect unique font families from the theme
  const families = new Set();
  [t.headlineFont, t.scriptFont, t.bodyFont, t.uiFont].forEach(f => {
    if (!f) return;
    const match = f.match(/'([^']+)'/);
    if (match && FONT_MAP[match[1]]) families.add(FONT_MAP[match[1]]);
  });

  if (families.size === 0) return;

  const url = `https://fonts.googleapis.com/css2?${[...families].map(f => `family=${f}`).join('&')}&display=swap`;

  // Check if already loaded
  if (document.querySelector(`link[href="${url}"]`)) return;

  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.onload = resolve;
    link.onerror = resolve; // Don't block on font load failure
    document.head.appendChild(link);
  });
}

// Load fonts for canvas rendering via FontFace API
export async function loadThemeFontsForCanvas(themeId) {
  const t = THEMES[themeId];
  if (!t) return;

  // First, ensure CSS is loaded
  await loadThemeFonts(themeId);

  // Then wait for all fonts to be ready
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
}
