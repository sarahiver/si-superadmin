// src/lib/constants.js
// Ohne Preislogik - wird später erweitert

export const THEMES = {
  botanical: { id: "botanical", name: "Botanical", description: "Natürlich organisch mit Grüntönen" },
  editorial: { id: "editorial", name: "Editorial", description: "Minimalistisch modern in Schwarz/Weiß" },
  video: { id: "video", name: "Video", description: "Cinematisch elegant mit Video-Hero" },
  contemporary: { id: "contemporary", name: "Contemporary", description: "Modern & bunt mit klaren Linien" },
  luxe: { id: "luxe", name: "Luxe", description: "Opulent & raffiniert mit Gold-Akzenten" },
  neon: { id: "neon", name: "Neon", description: "Bold & modern mit Neon-Akzenten" },
};

export const PROJECT_STATUS = {
  draft: { label: "Entwurf", color: "#666" },
  inquiry: { label: "Anfrage", color: "#f59e0b" },
  in_progress: { label: "In Bearbeitung", color: "#6366f1" },
  std: { label: "Save the Date", color: "#eab308" },
  live: { label: "Live", color: "#22c55e" },
  archiv: { label: "Archiv", color: "#64748b" },
};

// Alle verfügbaren Komponenten
export const ALL_COMPONENTS = [
  // Core (immer aktiv)
  { id: 'hero', name: 'Hero', core: true },
  { id: 'countdown', name: 'Countdown', core: true },
  { id: 'lovestory', name: 'Love Story', core: true },
  { id: 'rsvp', name: 'RSVP', core: true },
  // Optional
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

export const CORE_COMPONENTS = ALL_COMPONENTS.filter(c => c.core).map(c => c.id);
export const OPTIONAL_COMPONENTS = ALL_COMPONENTS.filter(c => !c.core);
export const DEFAULT_COMPONENT_ORDER = ALL_COMPONENTS.map(c => c.id);
