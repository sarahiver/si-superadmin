// src/lib/constants.js

export const THEMES = {
  editorial: { id: "editorial", name: "Editorial", description: "Minimalistisch modern in Schwarz/Weiß" },
  video: { id: "video", name: "Video", description: "Cinematisch elegant mit Video-Hero" },
  botanical: { id: "botanical", name: "Botanical", description: "Natürlich organisch mit Grüntönen" },
  contemporary: { id: "contemporary", name: "Contemporary", description: "Modern & bunt mit klaren Linien" },
  luxe: { id: "luxe", name: "Luxe", description: "Opulent & raffiniert mit Gold-Akzenten" },
  neon: { id: "neon", name: "Neon", description: "Bold & modern mit Neon-Akzenten" },
};

export const PACKAGES = {
  klassik: {
    id: "klassik",
    name: "Klassik",
    price: 1490,
    description: "Perfekter Einstieg",
    hostingMonths: 1, // nach Hochzeit
    maxOptionalComponents: 4,
    feedbackRounds: 1,
    includesSTD: false,
    includesArchive: false,
  },
  signature: {
    id: "signature",
    name: "Signature",
    price: 2190,
    description: "Unser Bestseller",
    hostingMonths: 3,
    maxOptionalComponents: 8,
    feedbackRounds: 2,
    includesSTD: false,
    includesArchive: false,
    popular: true,
  },
  couture: {
    id: "couture",
    name: "Couture",
    price: 2990,
    description: "Full-Service Erlebnis",
    hostingMonths: 6,
    maxOptionalComponents: 999, // unlimited
    feedbackRounds: 999, // unlimited
    includesSTD: true,
    includesArchive: true,
  },
};

export const ADDONS = {
  std: { id: "std", name: "Save the Date", price: 190, description: "Vorankündigung vor der Einladung" },
  archive: { id: "archive", name: "Archiv-Seite", price: 150, description: "Erinnerungsseite nach der Hochzeit" },
  photoUpload: { id: "photoUpload", name: "Foto-Upload", price: 190, description: "Gäste können Fotos hochladen" },
  customDomain: { id: "customDomain", name: "Eigene Domain", price: 50, description: "z.B. anna-und-max.de (jährlich)" },
  extraHosting: { id: "extraHosting", name: "Hosting-Verlängerung", price: 25, description: "Pro zusätzlichem Monat" },
  multiLanguage: { id: "multiLanguage", name: "Mehrsprachigkeit", price: 350, description: "Website in mehreren Sprachen" },
  printDesign: { id: "printDesign", name: "Print Design", price: 290, description: "Passende Save-the-Date & Einladungskarten" },
  guestManagement: { id: "guestManagement", name: "Erweiterte Gästeverwaltung", price: 290, description: "Tischplan, Menüauswahl, etc." },
};

// Core components - always included (4 Basis-Komponenten)
export const CORE_COMPONENTS = [
  "hero", "countdown", "rsvp", "lovestory"
];

// Optional components
export const OPTIONAL_COMPONENTS = [
  { id: "timeline", name: "Tagesablauf" },
  { id: "locations", name: "Locations" },
  { id: "directions", name: "Anfahrt" },
  { id: "gallery", name: "Galerie" },
  { id: "gifts", name: "Geschenkeliste" },
  { id: "faq", name: "FAQ" },
  { id: "accommodations", name: "Unterkünfte" },
  { id: "dresscode", name: "Dresscode" },
  { id: "musicwishes", name: "Musikwünsche" },
  { id: "guestbook", name: "Gästebuch" },
  { id: "witnesses", name: "Trauzeugen" },
  { id: "weddingabc", name: "Hochzeits-ABC" },
  { id: "photoupload", name: "Foto-Upload" },
];

export const PROJECT_STATUS = {
  draft: { label: "Entwurf", color: "#666" },
  inquiry: { label: "Anfrage", color: "#f59e0b" },
  contract_sent: { label: "Vertrag gesendet", color: "#3b82f6" },
  contract_signed: { label: "Vertrag unterschrieben", color: "#8b5cf6" },
  paid: { label: "Bezahlt", color: "#10b981" },
  in_progress: { label: "In Bearbeitung", color: "#6366f1" },
  std: { label: "Save the Date", color: "#eab308" },
  live: { label: "Live", color: "#22c55e" },
  archiv: { label: "Archiv", color: "#64748b" },
};

// Calculate total price
export function calculateProjectPrice(pkg, addons = [], extraHostingMonths = 0) {
  const packagePrice = PACKAGES[pkg]?.price || 0;
  const addonsPrice = addons.reduce((sum, addonId) => sum + (ADDONS[addonId]?.price || 0), 0);
  const extraHosting = extraHostingMonths * (ADDONS.extraHosting?.price || 25);
  return packagePrice + addonsPrice + extraHosting;
}

// Calculate hosting end date
export function calculateHostingEndDate(weddingDate, pkg, extraMonths = 0) {
  if (!weddingDate) return null;
  const date = new Date(weddingDate);
  const baseMonths = PACKAGES[pkg]?.hostingMonths || 1;
  date.setMonth(date.getMonth() + baseMonths + extraMonths);
  return date;
}
