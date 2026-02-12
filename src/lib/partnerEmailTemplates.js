// src/lib/partnerEmailTemplates.js
// Kooperations-E-Mail Templates für S&I.
// Alle Templates sind editierbar - der Text wird als Default vorbelegt
// und kann im Composer vor dem Versand angepasst werden.

// ============================================
// TEMPLATE DEFINITIONEN
// ============================================

export const PARTNER_TYPES = {
  fotograf: { label: 'Fotograf/in', icon: '📸', color: '#8B5CF6' },
  planer: { label: 'Hochzeitsplaner/in', icon: '📋', color: '#3B82F6' },
  traurednerin: { label: 'Trauredner/in', icon: '🎤', color: '#EC4899' },
  location: { label: 'Location', icon: '🏰', color: '#F59E0B' },
};

export const PARTNER_STATUS = {
  neu: { label: 'Neu', color: '#9CA3AF' },
  kontaktiert: { label: 'Kontaktiert', color: '#3B82F6' },
  email_geoeffnet: { label: 'E-Mail geöffnet', color: '#06B6D4' },
  follow_up: { label: 'Follow-up', color: '#F59E0B' },
  angebot: { label: 'Angebot gesendet', color: '#8B5CF6' },
  aktiv: { label: 'Aktiver Partner', color: '#10B981' },
  geantwortet: { label: 'Geantwortet', color: '#14B8A6' },
  abgelehnt: { label: 'Abgelehnt', color: '#EF4444' },
  pausiert: { label: 'Pausiert', color: '#6B7280' },
  trash: { label: 'Trash', color: '#991B1B' },
};

// Status-Flow: Welcher Status kommt nach welcher Mail
export const STATUS_AFTER_EMAIL = {
  erstansprache: 'kontaktiert',
  followup: 'follow_up',
  angebot: 'angebot',
  abschluss: 'aktiv',
};

// Followup-Tage nach Mail-Typ
export const FOLLOWUP_DAYS = {
  erstansprache: 5,
  followup: 7,
  angebot: 10,
  abschluss: 0,
};

// Felder für XLSX-Import (Reihenfolge = Spaltenreihenfolge)
export const IMPORT_FIELDS = [
  { key: 'name', label: 'Name', required: true },
  { key: 'email', label: 'E-Mail', required: true },
  { key: 'company', label: 'Firma', required: false },
  { key: 'type', label: 'Typ (fotograf/planer/traurednerin/location)', required: true },
  { key: 'phone', label: 'Telefon', required: false },
  { key: 'city', label: 'Stadt', required: false },
  { key: 'website', label: 'Website', required: false },
  { key: 'instagram', label: 'Instagram', required: false },
  { key: 'notes', label: 'Notizen', required: false },
];

// ============================================
// TEMPLATE TEXTE (Defaults, editierbar)
// ============================================

export function getDefaultTemplates() {
  return {
    // ── FOTOGRAFEN ──────────────────────────────
    fotograf: {
      erstansprache: {
        subject: 'Kooperation: Premium-Hochzeitswebsites für deine Paare | S&I Wedding',
        body: `Hallo {name},

ich bin Iver von S&I Wedding – wir erstellen individuelle Premium-Hochzeitswebsites mit integriertem RSVP, Gästelisten-Management und Foto-Upload.

Ich habe eine Idee, die für dich und deine Paare einen echten Mehrwert bieten könnte:

Für jede Empfehlung, die zu einer Buchung führt, erhältst du eine Provision von 15% (ca. 190–300 €). Deine Paare bekommen über deinen persönlichen Link einen exklusiven Rabatt von 10%.

Der integrierte Foto-Upload auf unseren Websites ist übrigens perfekt für Fotografen: Deine Kunden können ihre Hochzeitsbilder direkt auf ihrer Website teilen – was auch deine Reichweite als Fotograf/in erhöht.

Hast du Lust, kurz darüber zu sprechen? Ich zeige dir gerne eine Demo.

Beste Grüße
Iver Gentz
S&I Wedding | siwedding.de`,
      },
      followup: {
        subject: 'Kurze Nachfrage: Kooperation S&I Wedding',
        body: `Hallo {name},

ich wollte nur kurz nachfragen, ob meine letzte Nachricht angekommen ist.

Falls du dir einen schnellen Eindruck verschaffen möchtest: Auf siwedding.de findest du unsere sechs Hochzeitsthemes. Das Botanical- und Editorial-Theme kommen besonders gut bei Paaren an, die Wert auf hochwertige Fotografie legen.

Falls das Timing gerade nicht passt – kein Problem. Ich freue mich auch später über einen Austausch.

Beste Grüße
Iver`,
      },
      angebot: {
        subject: 'Partnerschaftsangebot: 15% Provision + exklusive Vorteile | S&I Wedding',
        body: `Hallo {name},

ich möchte dir nochmal konkret zeigen, wie eine Partnerschaft mit S&I Wedding für dich aussehen könnte:

• 15% Provision pro vermittelter Buchung (190–300 €)
• Persönlicher Empfehlungslink mit 10% Rabatt für deine Paare
• Dein Logo + Link auf unserer Partner-Seite
• Gemeinsame Social-Media-Features (gegenseitiges Taggen, Story-Shares)
• Prioritäts-Support für deine empfohlenen Paare

Unser Foto-Upload-Feature macht es deinen Paaren leicht, deine Bilder direkt auf ihrer Hochzeitswebsite zu präsentieren – inklusive Verlinkung zu deinem Portfolio.

Sollen wir einen kurzen Call machen? 15 Minuten reichen völlig.

Beste Grüße
Iver Gentz
S&I Wedding | siwedding.de`,
      },
      abschluss: {
        subject: 'Letzte Nachfrage: Kooperation S&I Wedding',
        body: `Hallo {name},

ich melde mich ein letztes Mal zum Thema Kooperation. Ich verstehe, wenn das Timing gerade nicht passt.

Falls du irgendwann Interesse hast, stehe ich gerne zur Verfügung. Du erreichst mich jederzeit unter wedding@sarahiver.de.

Ich wünsche dir weiterhin viel Erfolg mit deiner Arbeit!

Beste Grüße
Iver`,
      },
    },

    // ── HOCHZEITSPLANER ─────────────────────────
    planer: {
      erstansprache: {
        subject: 'Digitale Hochzeitswebsites für deine Paare | Kooperation mit S&I Wedding',
        body: `Hallo {name},

als Hochzeitsplaner/in weißt du, wie viel Kommunikation und Organisation hinter einer perfekten Hochzeit steckt. Genau da setzen wir an.

Ich bin Iver von S&I Wedding. Wir bieten Premium-Hochzeitswebsites mit Features, die dir die Arbeit erleichtern: digitales RSVP mit automatischer Auswertung, Gästelisten-Management, interaktive Location-Karten und individuelles Design.

Mein Vorschlag für eine Zusammenarbeit:

Du empfiehlst S&I Wedding als Teil deines Planungspakets oder als Add-on. Dafür erhältst du 15% Provision pro Buchung. Deine Paare profitieren von 10% Rabatt über deinen persönlichen Link.

Gerade das RSVP-System spart dir und deinen Paaren enorm viel Zeit bei der Gästeplanung. Keine Excel-Listen mehr, keine Nachfass-Anrufe.

Ich zeige dir gerne in 15 Minuten, wie das System funktioniert. Wann passt es dir?

Beste Grüße
Iver Gentz
S&I Wedding | siwedding.de`,
      },
      followup: {
        subject: 'Nachfrage: Kooperation Hochzeitsplanung + digitales RSVP',
        body: `Hallo {name},

kurze Nachfrage zu meiner letzten E-Mail. Ich verstehe, dass der Kalender als Hochzeitsplaner/in immer voll ist.

Ein kurzer Gedanke: Stell dir vor, deine Paare könnten die Zusagen in Echtzeit auf ihrer eigenen Website verfolgen – inkl. Menüwahl und Allergien. Das ist einer der Gründe, warum Wedding Planner unser RSVP-System so schätzen.

Falls du magst, schick ich dir einen Testzugang, damit du es selbst ausprobieren kannst.

Beste Grüße
Iver`,
      },
      angebot: {
        subject: 'Partnerschaftsmodell für Hochzeitsplaner | S&I Wedding',
        body: `Hallo {name},

hier nochmal das konkrete Partnerschaftsmodell:

• 15% Provision pro vermittelter Buchung (190–300 €)
• S&I Wedding als fester Bestandteil deines Planungspakets
• Persönlicher Empfehlungslink mit 10% Kundenrabatt
• Dein Profil auf unserer Partner-Seite
• Direkter Draht zu mir für Rückfragen deiner Paare

Das RSVP-System mit Echtzeit-Auswertung, Gästeliste und Allergien-Tracking spart deinen Paaren und dir enorm viel Planungszeit.

Hast du 15 Minuten für eine Demo? Ich richte dir gerne auch einen Test-Account ein.

Beste Grüße
Iver Gentz
S&I Wedding | siwedding.de`,
      },
      abschluss: {
        subject: 'Letzte Nachfrage: Kooperation S&I Wedding',
        body: `Hallo {name},

ich melde mich ein letztes Mal zu unserem Kooperationsangebot. Falls das Timing gerade nicht passt, ist das völlig in Ordnung.

Du erreichst mich jederzeit unter wedding@sarahiver.de, falls sich in Zukunft etwas ergibt.

Weiterhin viel Erfolg mit deiner Arbeit – die Hochzeitssaison steht ja vor der Tür!

Beste Grüße
Iver`,
      },
    },

    // ── TRAUREDNER/INNEN ────────────────────────
    traurednerin: {
      erstansprache: {
        subject: 'Kooperation: Hochzeitswebsites mit persönlicher Note | S&I Wedding',
        body: `Hallo {name},

als Trauredner/in schaffst du einzigartige, persönliche Momente für Brautpaare. Genau diesen Anspruch teilen wir bei S&I Wedding – mit individuell gestalteten Premium-Hochzeitswebsites.

Ich bin Iver von S&I Wedding. Unsere Websites bieten Paaren alles aus einer Hand: RSVP-Management, Tagesablauf, Locationinfos und vieles mehr – mit hochwertigen Designs, die zur Persönlichkeit des Paares passen.

Meine Idee: Du empfiehlst S&I Wedding an deine Brautpaare, die oft noch am Anfang der Planung stehen. Dafür erhältst du 15% Provision pro Buchung (ca. 190–300 €). Deine Paare bekommen über deinen Link 10% Rabatt.

Gerade Trauredner/innen sind oft die erste Anlaufstelle für Paare – und damit in der perfekten Position, hilfreiche Tools wie eine Hochzeitswebsite zu empfehlen.

Hast du Lust auf einen kurzen Austausch? Ich zeige dir gerne, wie unsere Themes aussehen.

Beste Grüße
Iver Gentz
S&I Wedding | siwedding.de`,
      },
      followup: {
        subject: 'Kurze Nachfrage: Kooperation S&I Wedding + Trauung',
        body: `Hallo {name},

ich wollte kurz an meine letzte Nachricht anknüpfen.

Wir haben auf unseren Hochzeitswebsites übrigens auch eine "Tagesablauf"-Komponente, in der die freie Trauung prominent dargestellt wird – mit deinem Namen und ggf. einem kurzen Text von dir. Das ist eine schöne Möglichkeit für zusätzliche Sichtbarkeit.

Schau gerne mal auf siwedding.de vorbei, um dir die Themes anzusehen. Ich freue mich über Feedback!

Beste Grüße
Iver`,
      },
      angebot: {
        subject: 'Partnerschaftsangebot für Trauredner/innen | S&I Wedding',
        body: `Hallo {name},

hier das konkrete Kooperationsmodell:

• 15% Provision pro Buchung über deinen Empfehlungslink (190–300 €)
• 10% Rabatt für deine Paare
• Namentliche Erwähnung im Tagesablauf der Website
• Verlinkung auf unserer Partner-Seite
• Gemeinsame Sichtbarkeit auf Social Media

Unsere Paare planen gerne digital, und eine persönliche Hochzeitswebsite ist für viele der zentrale Planungs-Hub. Als Trauredner/in bist du oft eine der ersten Anlaufstellen – das macht dich zur idealen Partnerin.

Magst du dich einmal kurz austauschen? 15 Minuten reichen.

Beste Grüße
Iver Gentz
S&I Wedding | siwedding.de`,
      },
      abschluss: {
        subject: 'Letzte Nachfrage: Partnerschaft S&I Wedding',
        body: `Hallo {name},

ein letztes Mal zum Thema Kooperation – falls es gerade nicht passt, völlig verständlich.

Mein Angebot steht natürlich weiterhin. Du erreichst mich jederzeit unter wedding@sarahiver.de.

Ich wünsche dir eine schöne Trauungssaison!

Beste Grüße
Iver`,
      },
    },

    // ── LOCATIONS ────────────────────────────────
    location: {
      erstansprache: {
        subject: 'Kooperation: Digitale Hochzeitswebsites mit interaktiver Location-Karte | S&I Wedding',
        body: `Sehr geehrte/r {name},

mein Name ist Iver Gentz von S&I Wedding. Wir erstellen individuelle Premium-Hochzeitswebsites für Brautpaare – inklusive interaktiver Location-Karten, die den Weg zu Ihrer Location optimal darstellen.

Viele Locations nutzen bereits digitale Lösungen, um ihren Paaren einen Mehrwert zu bieten. Mit S&I Wedding können Ihre Brautpaare ihre gesamte Hochzeitsplanung auf einer eleganten Website bündeln, inklusive einer interaktiven Karte mit Wegbeschreibung zu Ihrer Location.

Ich würde mich freuen, Ihnen in einem kurzen Gespräch zu zeigen, wie das aussehen könnte. Für jede erfolgreiche Empfehlung erhalten Sie eine Provision von 15%.

Falls Sie Interesse haben, stehe ich gerne für ein kurzes Telefonat zur Verfügung.

Mit freundlichen Grüßen
Iver Gentz
S&I Wedding | siwedding.de`,
      },
      followup: {
        subject: 'Nachfrage: Kooperation S&I Wedding + Location-Feature',
        body: `Sehr geehrte/r {name},

ich erlaube mir, an meine letzte Nachricht anzuknüpfen.

Auf unserer Website siwedding.de können Sie sich einen Eindruck von unseren sechs Hochzeitsthemes verschaffen. Die Location-Komponente zeigt eine interaktive Karte mit Wegbeschreibung – ideal, um Ihren Gästen die Anreise zu erleichtern.

Falls das Timing gerade nicht passt, melde ich mich gerne zu einem späteren Zeitpunkt nochmals.

Mit freundlichen Grüßen
Iver Gentz`,
      },
      angebot: {
        subject: 'Partnerschaftsangebot für Locations | S&I Wedding',
        body: `Sehr geehrte/r {name},

hier unser konkretes Kooperationsangebot:

• 15% Provision pro vermittelter Buchung
• Ihre Location prominent auf unserer Partner-Seite
• Interaktive Location-Karte auf den Hochzeitswebsites Ihrer Paare
• Flyer/QR-Code für Ihre Auslage vor Ort
• Gemeinsame Sichtbarkeit in Social Media und auf der Website

Viele Paare suchen gezielt nach Locations, die digitale Services mitanbieten. Eine Empfehlung Ihrer Location inklusive hochwertiger Hochzeitswebsite hebt Sie von der Konkurrenz ab.

Ich freue mich über ein kurzes Gespräch zu den Details.

Mit freundlichen Grüßen
Iver Gentz
S&I Wedding | siwedding.de`,
      },
      abschluss: {
        subject: 'Letzte Anfrage: Partnerschaft S&I Wedding',
        body: `Sehr geehrte/r {name},

ich möchte mich ein letztes Mal bezüglich unseres Kooperationsangebots melden.

Sollte sich zu einem späteren Zeitpunkt Interesse ergeben, stehe ich Ihnen gerne unter wedding@sarahiver.de zur Verfügung.

Ich wünsche Ihnen eine erfolgreiche Saison!

Mit freundlichen Grüßen
Iver Gentz`,
      },
    },
  };
}

// ============================================
// E-MAIL TEMPLATE STAGES (für UI)
// ============================================

export const EMAIL_STAGES = [
  { id: 'erstansprache', label: 'Erstansprache', description: 'Erste Kontaktaufnahme', icon: '✉️', day: 0 },
  { id: 'followup', label: 'Follow-up', description: 'Nachfrage nach 5 Tagen', icon: '🔄', day: 5 },
  { id: 'angebot', label: 'Angebot', description: 'Konkretes Partnerschaftsangebot', icon: '🤝', day: 12 },
  { id: 'abschluss', label: 'Abschluss', description: 'Letzte Nachfrage', icon: '📩', day: 22 },
];

// ============================================
// HTML E-MAIL WRAPPER (S&I Branding)
// Mit Tracking-Pixel für Öffnungsrate
// ============================================

export function wrapInEmailHTML(bodyText, partnerName, trackingPixelUrl = null) {
  // Konvertiert Plaintext in HTML-Paragraphen
  const htmlBody = bodyText
    .split('\n\n')
    .map(para => {
      if (para.includes('\n•') || para.startsWith('•')) {
        const lines = para.split('\n').map(l => l.trim());
        const items = lines.filter(l => l.startsWith('•')).map(l => 
          `<li style="margin-bottom: 6px;">${l.replace(/^•\s*/, '')}</li>`
        ).join('');
        const intro = lines.filter(l => !l.startsWith('•')).join(' ');
        return `${intro ? `<p style="margin: 0 0 8px 0;">${intro}</p>` : ''}<ul style="margin: 8px 0 0 20px; padding: 0;">${items}</ul>`;
      }
      return `<p style="margin: 0 0 16px 0;">${para.replace(/\n/g, '<br>')}</p>`;
    })
    .join('');

  // Tracking Pixel (1x1 transparent PNG)
  const trackingPixel = trackingPixelUrl
    ? `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #F5F5F5; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF;">
    <div style="background: #0A0A0A; padding: 32px 30px; text-align: center;">
      <div style="font-family: 'Helvetica Neue', 'Arial Black', sans-serif; font-size: 28px; font-weight: 700; color: #FFFFFF; letter-spacing: -2px;">S&I.</div>
    </div>
    <div style="padding: 40px 30px; color: #333333; font-size: 15px; line-height: 1.7;">
      ${htmlBody}
    </div>
    <div style="background: #0A0A0A; padding: 24px 30px; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.5);">S&I. | Premium Hochzeits-Websites</p>
      <p style="margin: 6px 0 0 0; font-size: 12px;"><a href="https://siwedding.de" style="color: rgba(255,255,255,0.7); text-decoration: none;">siwedding.de</a></p>
    </div>
  </div>
  ${trackingPixel}
</body>
</html>`;
}
