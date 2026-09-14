// src/lib/pricing.js
// ════════════════════════════════════════════════════════════════════════
// ZENTRALE QUELLE DER WAHRHEIT für Pakete, Add-ons und Preisberechnung.
// ════════════════════════════════════════════════════════════════════════
//
// Diese Datei existiert wortgleich in drei Repos, weil sie getrennt
// deployen und kein gemeinsames npm-Paket haben:
//
//   si-superadmin/src/lib/pricing.js     ← ORIGINAL, hier pflegen
//   si-marketing/src/lib/pricing.js      ← Kopie
//   si-wedding-themes/src/lib/pricing.js ← Kopie
//
// Bei jeder Änderung ALLE DREI aktualisieren.
//
// Preisänderung (z.B. All In auf 1.590 €) = eine Zahl in PACKAGES,
// dreimal kopiert. Sonst nichts.

// ════════════════════════════════════════════════════════════════════════
// PAKETE
// ════════════════════════════════════════════════════════════════════════
// Der Unterschied zwischen den Paketen ist der BETREUUNGSGRAD,
// nicht die Anzahl der Funktionen. Alle Komponenten sind überall drin.

export const PACKAGES = {
  website: {
    id: 'website',
    name: 'Website',
    contractName: 'S&I. Wedding Website',
    price: 990,
    order: 1,
    tagline: 'Gemeinsam gestaltet. Von euch gepflegt. Von uns perfektioniert.',
    positioning: 'Ihr möchtet eure Inhalte selbst zusammenstellen und habt Lust, eure Website gemeinsam mit uns zu gestalten.',
    hosting: 'Online bis 3 Monate nach der Hochzeit',
    // Wer pflegt die Inhalte ein
    contentBy: 'couple',

    includesSaveTheDate: false,
    includesArchive: false,
    includesDataEntry: false,
    includesQRCode: true, // QR ist IMMER inklusive

    // Leistungen für Vertrag, PDF und Marketing
    deliverables: [
      'Individuelle Hochzeitswebsite unter eigener Adresse',
      'Alle verfügbaren Website-Komponenten, frei wählbar',
      'Premium Theme mit individueller Farbgestaltung',
      'Gemeinsame Designabstimmung',
      'Persönliches Dashboard für eure Inhalte',
      'Inhaltspflege durch das Paar',
      'Design- und Qualitätsprüfung durch S&I.',
      'Feinschliff durch S&I.',
      'Mobile Optimierung',
      'QR-Code',
      'Technische Einrichtung und Go-Live',
      'Online bis 3 Monate nach der Hochzeit',
    ],
  },

  all_in: {
    id: 'all_in',
    name: 'All In',
    contractName: 'S&I. All In Wedding Website',
    price: 1490,
    order: 2,
    tagline: 'Ihr liefert uns eure Inhalte. Wir bauen eure komplette Hochzeitswebsite.',
    positioning: 'Ihr möchtet euch um eure Hochzeitswebsite möglichst gar nicht kümmern.',
    hosting: 'Online bis 3 Monate nach der Hochzeit',
    contentBy: 'si',

    includesSaveTheDate: true,
    includesArchive: true,
    includesDataEntry: true,
    includesQRCode: true,

    deliverables: [
      'Individuelle Hochzeitswebsite unter eigener Adresse',
      'Alle verfügbaren Website-Komponenten, frei wählbar',
      'Premium Theme mit individueller Farbgestaltung',
      'Gemeinsame Designabstimmung',
      'Strukturierte Content-Vorlage',
      'Vollständige Einrichtung durch S&I.',
      'Vollständige Inhaltspflege durch S&I.',
      'Design- und Qualitätsprüfung durch S&I.',
      'Feinschliff durch S&I.',
      'Mobile Optimierung',
      'Save the Date (2 Monate vor der Hochzeit)',
      'Wedding Archive (3 Monate nach der Hochzeit)',
      'QR-Code',
      'Technische Einrichtung und Go-Live',
      'Online bis 3 Monate nach der Hochzeit',
    ],
  },

  // ── SPECIAL CASE SYSTEM ────────────────────────────────────────────
  // Sonderfall, bewusst getrennt vom Standard-Paketsystem:
  // Preis über custom_price, nie im Marketing sichtbar, nur im SuperAdmin
  // auswählbar. Zusammen mit discount und custom_extras die einzige
  // Abweichung von den regulären Paketen.
  individual: {
    id: 'individual',
    name: 'Individual',
    contractName: 'S&I. Wedding Website (individuell)',
    price: 0,
    order: 99,
    custom: true,
    internalOnly: true,
    tagline: 'Individuell vereinbarter Leistungsumfang.',
    positioning: '',
    hosting: 'Online bis 3 Monate nach der Hochzeit',
    contentBy: 'si',

    includesSaveTheDate: true,
    includesArchive: true,
    includesDataEntry: true,
    includesQRCode: true,

    deliverables: [
      'Individuell vereinbarter Leistungsumfang',
      'Alle verfügbaren Website-Komponenten',
      'QR-Code',
    ],
  },
};

// Reihenfolge für Auswahl-UIs
export const PACKAGE_LIST = Object.values(PACKAGES).sort((a, b) => a.order - b.order);

// Nur die öffentlich buchbaren Pakete (Marketing, Anfrageformular)
export const PUBLIC_PACKAGES = PACKAGE_LIST.filter(p => !p.internalOnly);

// ════════════════════════════════════════════════════════════════════════
// ADD-ONS
// ════════════════════════════════════════════════════════════════════════
// Exakt drei. QR-Code ist KEIN Add-on mehr, Extra-Komponenten gibt es nicht.

export const ADDONS = {
  save_the_date: {
    id: 'save_the_date',
    name: 'Save the Date',
    description: 'Online 2 Monate vor der Hochzeit',
    price: 150,
    // Welches Paket-Flag dieses Add-on bereits abdeckt
    includedFlag: 'includesSaveTheDate',
  },
  archive: {
    id: 'archive',
    name: 'Wedding Archive',
    description: 'Online 3 Monate nach der Hochzeit',
    price: 150,
    includedFlag: 'includesArchive',
  },
  invitation_design: {
    id: 'invitation_design',
    name: 'Einladungsdesign',
    description: 'Passend zum Website-Theme',
    price: 400,
    // Von keinem Paket abgedeckt — immer buchbar, immer +400 €
    includedFlag: null,
  },
};

export const ADDON_LIST = Object.values(ADDONS);

// ════════════════════════════════════════════════════════════════════════
// LEGACY-MAPPING
// ════════════════════════════════════════════════════════════════════════
// Bestandsprojekte tragen noch alte Paket-IDs. Die Migration schreibt sie
// in der Datenbank um; diese Map ist das Sicherheitsnetz für alles, was
// vorher oder parallel geladen wird.
//
// Features hängen NICHT an dieser Map: has_std und has_archive sind auf
// den Projekten explizit gesetzt und haben Vorrang.

export const LEGACY_PACKAGE_MAP = {
  starter: 'website',
  standard: 'website',
  premium: 'all_in',
  // noch ältere Namen
  klassik: 'website',
  signature: 'website', // hatte STD → Migration ergänzt das Add-on
  couture: 'all_in',
};

export function normalizePackageId(packageId) {
  if (!packageId) return 'website';
  if (PACKAGES[packageId]) return packageId;
  return LEGACY_PACKAGE_MAP[packageId] || 'website';
}

export function getPackage(packageId) {
  return PACKAGES[normalizePackageId(packageId)];
}

// ════════════════════════════════════════════════════════════════════════
// FEATURES
// ════════════════════════════════════════════════════════════════════════

export function isFeatureIncluded(packageId, feature) {
  const pkg = getPackage(packageId);
  if (!pkg) return false;
  switch (feature) {
    case 'save_the_date': return pkg.includesSaveTheDate;
    case 'archive': return pkg.includesArchive;
    case 'data_entry': return pkg.includesDataEntry;
    case 'qr_code': return pkg.includesQRCode;
    default: return false;
  }
}

// Ist ein Feature verfügbar — über Paket ODER gebuchtes Add-on?
export function hasFeature(project, feature) {
  if (!project) return false;
  // Explizite Felder aus dem SuperAdmin haben immer Vorrang
  if (feature === 'save_the_date' && typeof project.has_std === 'boolean') return project.has_std;
  if (feature === 'archive' && typeof project.has_archive === 'boolean') return project.has_archive;
  if (isFeatureIncluded(project.package, feature)) return true;
  return Array.isArray(project.addons) && project.addons.includes(feature);
}

// ════════════════════════════════════════════════════════════════════════
// LAUFZEITEN
// ════════════════════════════════════════════════════════════════════════
// Hosting hängt NICHT mehr am Paket (früher 6/8/12 Monate), sondern am
// Hochzeitsdatum:
//   Hostingende   = Hochzeit + 3 Monate   (identisch mit dem Archiv-Ende)
//   Save the Date = Hochzeit - 2 Monate bis Hochzeit (wenn gebucht)
//   Hostingstart  = STD-Start, sonst Hochzeit - 12 Monate (Planungsphase)

export const HOSTING_MONTHS_AFTER_WEDDING = 3;
export const STD_MONTHS_BEFORE_WEDDING = 2;
const PLANNING_MONTHS_BEFORE_WEDDING = 12;

const shiftMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const iso = (d) => (d ? new Date(d).toISOString().split('T')[0] : null);

// Zentrale Terminberechnung. options.hasSaveTheDate entscheidet über den
// STD-Zeitraum; ohne Hochzeitsdatum gibt es bewusst keine Schätzwerte.
export function calculateHostingDates(weddingDate, options = {}) {
  if (!weddingDate) {
    return { start: null, end: null, stdStart: null, stdEnd: null, archiveEnd: null };
  }
  const wedding = new Date(weddingDate);
  const hasSTD = Boolean(options.hasSaveTheDate);

  const stdStart = shiftMonths(wedding, -STD_MONTHS_BEFORE_WEDDING);
  const start = hasSTD ? stdStart : shiftMonths(wedding, -PLANNING_MONTHS_BEFORE_WEDDING);
  const end = shiftMonths(wedding, HOSTING_MONTHS_AFTER_WEDDING);

  return {
    start: iso(start),
    end: iso(end),
    stdStart: hasSTD ? iso(stdStart) : null,
    stdEnd: hasSTD ? iso(wedding) : null,
    archiveEnd: iso(end),
  };
}

// ════════════════════════════════════════════════════════════════════════
// PREISBERECHNUNG
// ════════════════════════════════════════════════════════════════════════
// EINE Funktion für SuperAdmin, Verträge, PDFs, Rechnungen und E-Mails.
// Vorher existierten zwei Kopien, die sich in customExtras unterschieden.

export function getAddonPrice(addonId, packageId) {
  const addon = ADDONS[addonId];
  if (!addon) return 0;
  if (addon.includedFlag && isFeatureIncluded(packageId, addonId)) return 0;
  return addon.price;
}

export function calculatePricing(project = {}) {
  const packageId = normalizePackageId(project.package);
  const pkg = PACKAGES[packageId];

  const selected = Array.isArray(project.addons) ? project.addons : [];
  const customExtras = Array.isArray(project.custom_extras) ? project.custom_extras : [];
  const customExtrasPrice = customExtras.reduce(
    (sum, extra) => sum + (parseFloat(extra.amount) || 0), 0
  );
  const discount = parseFloat(project.discount) || 0;

  // Zeilen für Vertrag/PDF — inklusive der bereits enthaltenen Leistungen,
  // damit der Vertrag zeigt, was im Paket steckt, ohne es zu berechnen.
  const addonLines = ADDON_LIST.map(addon => {
    const included = Boolean(addon.includedFlag && isFeatureIncluded(packageId, addon.id));
    const booked = included || selected.includes(addon.id);
    return {
      id: addon.id,
      name: addon.name,
      description: addon.description,
      included,
      booked,
      price: included ? 0 : (selected.includes(addon.id) ? addon.price : 0),
    };
  }).filter(line => line.booked);

  // Doppelberechnung ausgeschlossen: enthaltene Add-ons haben price 0
  const addonsPrice = addonLines.reduce((sum, line) => sum + line.price, 0);

  if (pkg.custom) {
    const base = parseFloat(project.custom_price) || 0;
    return {
      packageId,
      packageName: pkg.name,
      packagePrice: base,
      addonsPrice: 0,
      addonLines,
      customExtrasPrice,
      discount: 0,
      total: base + customExtrasPrice,
      isCustom: true,
    };
  }

  return {
    packageId,
    packageName: pkg.name,
    packagePrice: pkg.price,
    addonsPrice,
    addonLines,
    customExtrasPrice,
    discount,
    total: Math.max(0, pkg.price + addonsPrice + customExtrasPrice - discount),
    isCustom: false,
  };
}

export function formatPrice(amount) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount || 0);
}

// ════════════════════════════════════════════════════════════════════════
// KUNDENPROZESS
// ════════════════════════════════════════════════════════════════════════
// Wird im Kunden-Dashboard angezeigt, damit das Paar weiß, was passiert.

export const PROCESS_STEPS = {
  website: [
    'Design gemeinsam abstimmen',
    'Inhalte einpflegen',
    'S&I. prüft & verfeinert',
    'Ihr prüft',
    'Freigabe',
    'Go-Live',
  ],
  all_in: [
    'Inhalte bereitstellen',
    'S&I. baut eure Website',
    'S&I. prüft & verfeinert',
    'Ihr prüft',
    'Freigabe',
    'Go-Live',
  ],
  individual: [
    'Abstimmung',
    'Umsetzung',
    'S&I. prüft & verfeinert',
    'Ihr prüft',
    'Freigabe',
    'Go-Live',
  ],
};

export function getProcessSteps(packageId) {
  return PROCESS_STEPS[normalizePackageId(packageId)] || PROCESS_STEPS.website;
}
