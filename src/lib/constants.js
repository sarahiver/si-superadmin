// src/lib/constants.js
// SuperAdmin Constants - Themes, Status, Components, Packages

// ============================================
// THEMES
// ============================================

export const THEMES = {
  botanical: { id: 'botanical', name: 'Botanical Glass', description: 'Tropische Pflanzen mit Glasmorphism' },
  editorial: { id: 'editorial', name: 'Editorial', description: 'Minimalistisch, Magazine-Style' },
  contemporary: { id: 'contemporary', name: 'Contemporary', description: 'Modern, Clean, Elegant' },
  luxe: { id: 'luxe', name: 'Luxe', description: 'Luxuriös, Gold-Akzente' },
  neon: { id: 'neon', name: 'Neon', description: 'Bold, Leuchtfarben, Party' },
  video: { id: 'video', name: 'Video', description: 'Horizontal Scroll, Cinematic' },
};

// ============================================
// PROJECT STATUS
// ============================================

export const PROJECT_STATUS = {
  draft: { id: 'draft', label: 'Entwurf', color: '#666666' },
  inquiry: { id: 'inquiry', label: 'Anfrage', color: '#F59E0B' },
  in_progress: { id: 'in_progress', label: 'In Bearbeitung', color: '#3B82F6' },
  ready_for_review: { id: 'ready_for_review', label: 'Bereit zur Prüfung', color: '#F97316' }, // Orange - Kunde hat Daten eingegeben
  std: { id: 'std', label: 'Save the Date', color: '#8B5CF6' },
  live: { id: 'live', label: 'Live', color: '#10B981' },
  archive: { id: 'archive', label: 'Archiv', color: '#6B7280' },
};

// ============================================
// COMPONENTS
// ============================================

export const CORE_COMPONENTS = ['hero', 'countdown', 'lovestory', 'rsvp'];

export const ALL_COMPONENTS = [
  { id: 'hero', name: 'Hero', core: true },
  { id: 'countdown', name: 'Countdown', core: true },
  { id: 'lovestory', name: 'Love Story', core: true },
  { id: 'rsvp', name: 'RSVP', core: true },
  { id: 'timeline', name: 'Tagesablauf', core: false },
  { id: 'locations', name: 'Locations', core: false },
  { id: 'directions', name: 'Anfahrt', core: false },
  { id: 'accommodations', name: 'Unterkünfte', core: false },
  { id: 'dresscode', name: 'Dresscode', core: false },
  { id: 'gallery', name: 'Galerie', core: false },
  { id: 'photoupload', name: 'Foto-Upload', core: false },
  { id: 'guestbook', name: 'Gästebuch', core: false },
  { id: 'musicwishes', name: 'Musikwünsche', core: false },
  { id: 'gifts', name: 'Geschenke', core: false },
  { id: 'witnesses', name: 'Trauzeugen', core: false },
  { id: 'faq', name: 'FAQ', core: false },
  { id: 'weddingabc', name: 'Hochzeits-ABC', core: false },
  { id: 'contact', name: 'Kontakt', core: false },
];

export const DEFAULT_COMPONENT_ORDER = [
  'hero', 'countdown', 'lovestory', 'timeline', 'locations',
  'directions', 'accommodations', 'dresscode', 'rsvp', 'gallery',
  'photoupload', 'guestbook', 'musicwishes', 'gifts', 'witnesses',
  'faq', 'weddingabc', 'contact'
];

// ============================================
// PACKAGES - Korrigierte Werte aus Tabelle
// ============================================

export const PACKAGES = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 1290,
    hosting: '6 Monate',
    extraComponentsIncluded: 0,
    features: [
      'Custom URL (siwedding.de/name)',
      'RSVP mit Download',
      '6 Monate Hosting',
      '4 Basis-Komponenten (Hero, Countdown, Love Story, RSVP)',
      'Dateneingabe durch Kunde',
      '1 Revision vorher / 1 nachher',
    ],
    includesSaveTheDate: false,
    includesArchive: false,
    includesDataEntry: false,
    includesQRCode: false,
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    price: 1490,
    hosting: '8 Monate',
    extraComponentsIncluded: 3,
    features: [
      'Custom URL (siwedding.de/name)',
      'RSVP mit Download',
      '8 Monate Hosting',
      '4 Basis-Komponenten (Hero, Countdown, Love Story, RSVP)',
      '3 zusätzliche Komponenten',
      'Dateneingabe durch Kunde',
      '2 Revisionen vorher / 2 nachher',
    ],
    includesSaveTheDate: false,
    includesArchive: false,
    includesDataEntry: false,
    includesQRCode: false,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 1990,
    hosting: '12 Monate',
    extraComponentsIncluded: 6,
    features: [
      'Custom URL (siwedding.de/name)',
      'RSVP mit Download',
      '12 Monate Hosting',
      '4 Basis-Komponenten (Hero, Countdown, Love Story, RSVP)',
      '6 zusätzliche Komponenten',
      'Save the Date Seite (bis 2 Monate)',
      'Archiv-Seite (3 Monate)',
      'Dateneingabe durch IverLasting',
      'QR-Code Erstellung',
      'Unbegrenzte Revisionen',
    ],
    includesSaveTheDate: true,
    includesArchive: true,
    includesDataEntry: true,
    includesQRCode: true,
  },
  individual: {
    id: 'individual',
    name: 'Individual',
    price: 0, // Preis wird manuell eingegeben (custom_price Feld)
    hosting: 'Nach Vereinbarung',
    extraComponentsIncluded: 999,
    features: [
      'Individuelle Anpassungen',
      'Preis nach Vereinbarung',
    ],
    includesSaveTheDate: true,
    includesArchive: true,
    includesDataEntry: true,
    includesQRCode: true,
  },
};

// ============================================
// ADDONS - Mit paketspezifischen Preisen
// ============================================

export const ADDONS = {
  save_the_date: {
    id: 'save_the_date',
    name: 'Save the Date Seite',
    description: 'Bis 2 Monate vor der Hochzeit',
    prices: { starter: 150, standard: 75, premium: 0, individual: 0 },
  },
  archive: {
    id: 'archive',
    name: 'Archiv-Seite',
    description: '3 Monate (Hero, Danke, Galerie, Bilder-Upload)',
    prices: { starter: 150, standard: 75, premium: 0, individual: 0 },
  },
  extra_component: {
    id: 'extra_component',
    name: 'Zusätzliche Komponente',
    description: 'Pro Stück',
    price: 50,
  },
  invitation_design: {
    id: 'invitation_design',
    name: 'Einladungs-Design',
    description: 'Passend zum Website-Theme',
    prices: { starter: 400, standard: 300, premium: 200, individual: 200 },
  },
  qr_code: {
    id: 'qr_code',
    name: 'QR-Code Erstellung',
    description: 'Für Einladungen',
    prices: { starter: 35, standard: 35, premium: 0, individual: 0 },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getAddonPrice(addonId, packageId) {
  const addon = ADDONS[addonId];
  if (!addon) return 0;
  if (addon.prices) return addon.prices[packageId] || 0;
  return addon.price || 0;
}

export function isFeatureIncluded(packageId, feature) {
  const pkg = PACKAGES[packageId];
  if (!pkg) return false;
  switch (feature) {
    case 'save_the_date': return pkg.includesSaveTheDate;
    case 'archive': return pkg.includesArchive;
    case 'data_entry': return pkg.includesDataEntry;
    case 'qr_code': return pkg.includesQRCode;
    default: return false;
  }
}

export function formatPrice(amount) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
}
