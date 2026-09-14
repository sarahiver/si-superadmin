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
  classic: { id: 'classic', name: 'Classic', description: 'Warm, Elegant, Zeitlos' },
  parallax: { id: 'parallax', name: 'Parallax', description: '3D Scroll, Bold Typography, Immersiv' },
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
  demo: { id: 'demo', label: 'Demo', color: '#EC4899' }, // Pink - Für Marketing-Website
};

// ============================================
// COMPONENTS
// ============================================

export const CORE_COMPONENTS = ['hero', 'countdown', 'lovestory', 'rsvp'];

// CORE_COMPONENTS = Vorauswahl bei der Projektanlage, KEIN Limit.
// Alle Komponenten aus ALL_COMPONENTS sind in jedem Paket inklusive.

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
];

export const DEFAULT_COMPONENT_ORDER = [
  'hero', 'countdown', 'lovestory', 'timeline', 'locations',
  'directions', 'accommodations', 'dresscode', 'rsvp', 'gallery',
  'photoupload', 'guestbook', 'musicwishes', 'gifts', 'witnesses',
  'faq', 'weddingabc'
];

// ============================================
// PACKAGES / ADDONS / PRICING
// ============================================
// Die komplette Preis- und Paketlogik liegt jetzt in src/lib/pricing.js
// (zentrale Quelle der Wahrheit, gespiegelt in Marketing und Wedding App).
// Hier nur noch re-exportiert, damit bestehende Importe unverändert
// funktionieren — es gibt KEINE zweite Definition.

export {
  PACKAGES,
  PACKAGE_LIST,
  PUBLIC_PACKAGES,
  ADDONS,
  ADDON_LIST,
  LEGACY_PACKAGE_MAP,
  normalizePackageId,
  getPackage,
  isFeatureIncluded,
  hasFeature,
  calculateHostingDates,
  HOSTING_MONTHS_AFTER_WEDDING,
  STD_MONTHS_BEFORE_WEDDING,
  getAddonPrice,
  calculatePricing,
  formatPrice,
  PROCESS_STEPS,
  getProcessSteps,
} from './pricing';
