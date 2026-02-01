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
  draft: { label: 'Entwurf', color: '#666666' },
  inquiry: { label: 'Anfrage', color: '#F59E0B' },
  in_progress: { label: 'In Bearbeitung', color: '#3B82F6' },
  std: { label: 'Save the Date', color: '#8B5CF6' },
  live: { label: 'Live', color: '#10B981' },
  archive: { label: 'Archiv', color: '#6B7280' },
};

// ============================================
// COMPONENTS
// ============================================

// Basis-Komponenten (in allen Paketen enthalten)
export const CORE_COMPONENTS = ['hero', 'countdown', 'lovestory', 'rsvp'];

// Alle verfügbaren Komponenten
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

// Standard-Reihenfolge
export const DEFAULT_COMPONENT_ORDER = [
  'hero', 'countdown', 'lovestory', 'timeline', 'locations',
  'directions', 'accommodations', 'dresscode', 'rsvp', 'gallery',
  'photoupload', 'guestbook', 'musicwishes', 'gifts', 'witnesses',
  'faq', 'weddingabc', 'contact'
];

// Zusatz-Komponenten (nicht core)
export const EXTRA_COMPONENTS = ALL_COMPONENTS.filter(c => !c.core);

// ============================================
// PACKAGES / PREISGESTALTUNG
// ============================================

export const PACKAGES = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 1290,
    extraComponentsIncluded: 0,
    features: [
      'Custom URL (siwedding.de/name)',
      'RSVP mit Download',
      '12 Monate Hosting',
      '4 Basis-Komponenten',
    ],
    includesSaveTheDate: false,
    includesArchive: false,
    includesDataEntry: false,
    includesQRCode: false,
    revisions: 1,
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    price: 1490,
    extraComponentsIncluded: 3,
    features: [
      'Custom URL (siwedding.de/name)',
      'RSVP mit Download',
      '12 Monate Hosting',
      '4 Basis-Komponenten',
      '3 zusätzliche Komponenten',
    ],
    includesSaveTheDate: false,
    includesArchive: false,
    includesDataEntry: false,
    includesQRCode: false,
    revisions: 2,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 1990,
    extraComponentsIncluded: 999, // unlimited
    features: [
      'Custom URL (siwedding.de/name)',
      'RSVP mit Download',
      '18 Monate Hosting',
      '4 Basis-Komponenten',
      'Alle zusätzlichen Komponenten',
      'Save the Date Seite (2 Monate)',
      'Archiv-Seite (3 Monate)',
      'Dateneingabe durch uns',
      'QR-Code Erstellung',
    ],
    includesSaveTheDate: true,
    includesArchive: true,
    includesDataEntry: true,
    includesQRCode: true,
    revisions: 3,
  },
  individual: {
    id: 'individual',
    name: 'Individual',
    price: 0, // Auf Anfrage
    extraComponentsIncluded: 999,
    features: [
      'Individuelle Anpassungen',
      'Eigenes Theme möglich',
      'Preis auf Anfrage',
    ],
    includesSaveTheDate: true,
    includesArchive: true,
    includesDataEntry: true,
    includesQRCode: true,
    revisions: 999,
  },
};

// ============================================
// ADDONS / ZUSATZOPTIONEN
// ============================================

export const ADDONS = {
  save_the_date: {
    id: 'save_the_date',
    name: 'Save the Date Seite',
    description: 'Bis 2 Monate vor der Hochzeit',
    price: 149,
  },
  archive: {
    id: 'archive',
    name: 'Archiv-Seite',
    description: '3 Monate nach der Hochzeit',
    price: 99,
  },
  extra_component: {
    id: 'extra_component',
    name: 'Zusätzliche Komponente',
    description: 'Pro Komponente',
    price: 50,
  },
  custom_domain: {
    id: 'custom_domain',
    name: 'Eigene Domain',
    description: 'z.B. anna-max.de',
    price: 99,
  },
  data_entry: {
    id: 'data_entry',
    name: 'Dateneingabe',
    description: 'Wir pflegen die Inhalte ein',
    price: 199,
  },
  qr_code: {
    id: 'qr_code',
    name: 'QR-Code Erstellung',
    description: 'Für Einladungen',
    price: 29,
  },
  invitation_design: {
    id: 'invitation_design',
    name: 'Einladungs-Design',
    description: 'Passend zum Website-Theme',
    price: 299,
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Berechne Gesamtpreis
export function calculateTotalPrice(packageId, addons = [], extraComponents = 0) {
  const pkg = PACKAGES[packageId];
  if (!pkg) return 0;
  
  let total = pkg.price;
  
  // Addons
  addons.forEach(addonId => {
    if (ADDONS[addonId]) {
      total += ADDONS[addonId].price;
    }
  });
  
  // Extra Komponenten über Paket-Limit
  const extraOverLimit = Math.max(0, extraComponents - pkg.extraComponentsIncluded);
  total += extraOverLimit * ADDONS.extra_component.price;
  
  return total;
}

// Prüfe ob Feature im Paket enthalten
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

// Anzahl erlaubter Extra-Komponenten
export function getAllowedExtraComponents(packageId, addons = []) {
  const pkg = PACKAGES[packageId];
  if (!pkg) return 0;
  
  let allowed = pkg.extraComponentsIncluded;
  
  // Zähle zusätzlich gebuchte Komponenten
  const extraComponentAddons = addons.filter(a => a === 'extra_component').length;
  allowed += extraComponentAddons;
  
  return allowed;
}

// Formatiere Preis
export function formatPrice(amount) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}
