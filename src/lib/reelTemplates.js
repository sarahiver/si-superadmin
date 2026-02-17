// src/lib/reelTemplates.js
// Reel-Vorlagen — vorgefertigte Slide-Sequenzen

let _nextId = 1;
function uid() { return _nextId++; }

// Reset ID counter (call before generating templates)
function resetIds() { _nextId = 1; }

function makeEl(type, text, opts = {}) {
  return {
    id: uid(),
    type,
    text,
    animation: opts.animation || 'fadeUp',
    delay: opts.delay || 0,
    animDuration: opts.animDuration || 0.5,
    xPercent: opts.xPercent || 0.067,
    yPercent: opts.yPercent || 0.5,
    fontSize: opts.fontSize,
  };
}

function makeSlide(elements, opts = {}) {
  return {
    id: uid(),
    duration: opts.duration || 4,
    transitionIn: opts.transitionIn || 'crossfade',
    transitionDuration: opts.transitionDuration || 0.5,
    backgroundType: opts.backgroundType || 'solid',
    backgroundImage: null,
    backgroundDarken: opts.backgroundDarken || 0.4,
    elements,
  };
}

export const TEMPLATES = {
  themeVorstellung: {
    name: 'Theme Vorstellung',
    desc: 'Intro → Features → Preview → CTA',
    icon: '🎨',
    create: () => {
      resetIds();
      return [
        // Slide 1: Intro
        makeSlide([
          makeEl('logo', 'S&I.', { animation: 'fadeIn', delay: 0.2, yPercent: 0.04 }),
          makeEl('divider', '', { delay: 0.4, yPercent: 0.38 }),
          makeEl('eyebrow', 'Neues Theme', { delay: 0.6, yPercent: 0.35 }),
          makeEl('headline', 'Das Classic Theme', { delay: 0.8, yPercent: 0.42, fontSize: 85 }),
          makeEl('body', 'Zeitlose Eleganz für eure Hochzeitswebsite.', { delay: 1.2, yPercent: 0.62 }),
          makeEl('footer', '', { delay: 1.5, yPercent: 0.96 }),
        ], { duration: 4.5, transitionIn: 'none' }),

        // Slide 2: Features
        makeSlide([
          makeEl('logo', 'S&I.', { animation: 'fadeIn', delay: 0, yPercent: 0.04 }),
          makeEl('eyebrow', 'Features', { delay: 0.3, yPercent: 0.28 }),
          makeEl('headline', 'Alles was ihr braucht', { delay: 0.5, yPercent: 0.34, fontSize: 72 }),
          makeEl('divider', '', { delay: 0.8, yPercent: 0.46 }),
          makeEl('body', 'RSVP · Gästeliste · Love Story\nCountdown · Foto-Upload\nMusik-Wünsche · Passwortschutz', { delay: 1.0, yPercent: 0.50 }),
          makeEl('footer', '', { delay: 1.5, yPercent: 0.96 }),
        ], { duration: 4.5 }),

        // Slide 3: Highlight
        makeSlide([
          makeEl('logo', 'S&I.', { animation: 'fadeIn', delay: 0, yPercent: 0.04 }),
          makeEl('eyebrow', 'Handgemacht', { delay: 0.3, yPercent: 0.35 }),
          makeEl('headline', 'Kein Template. Euer Design.', { delay: 0.5, yPercent: 0.42, fontSize: 80 }),
          makeEl('accentWord', 'Design.', { delay: 1.0, yPercent: 0.62 }),
          makeEl('footer', '', { delay: 1.2, yPercent: 0.96 }),
        ], { duration: 4 }),

        // Slide 4: CTA
        makeSlide([
          makeEl('logo', 'S&I.', { animation: 'fadeIn', delay: 0, yPercent: 0.04 }),
          makeEl('divider', '', { delay: 0.3, yPercent: 0.38 }),
          makeEl('headline', 'Jetzt Demo anfragen', { delay: 0.5, yPercent: 0.42, fontSize: 80 }),
          makeEl('body', 'siwedding.com\nLink in Bio', { delay: 1.0, yPercent: 0.60 }),
          makeEl('footer', '', { delay: 1.2, yPercent: 0.96 }),
        ], { duration: 4 }),
      ];
    },
  },

  featureHighlight: {
    name: 'Feature Highlight',
    desc: 'Problem → Lösung → Demo → CTA',
    icon: '⚡',
    create: () => {
      resetIds();
      return [
        // Slide 1: Problem/Hook
        makeSlide([
          makeEl('logo', 'S&I.', { animation: 'fadeIn', delay: 0.2, yPercent: 0.04 }),
          makeEl('headline', 'Eure Gäste wissen nicht wann und wo?', { delay: 0.5, yPercent: 0.40, fontSize: 78 }),
          makeEl('body', 'Schluss mit endlosen WhatsApp-Gruppen.', { delay: 1.2, yPercent: 0.60 }),
          makeEl('footer', '', { delay: 1.5, yPercent: 0.96 }),
        ], { duration: 4.5, transitionIn: 'none' }),

        // Slide 2: Solution
        makeSlide([
          makeEl('logo', 'S&I.', { animation: 'fadeIn', delay: 0, yPercent: 0.04 }),
          makeEl('eyebrow', 'Die Lösung', { delay: 0.3, yPercent: 0.32 }),
          makeEl('headline', 'Eure eigene Hochzeitswebsite', { delay: 0.5, yPercent: 0.38, fontSize: 76 }),
          makeEl('divider', '', { delay: 0.9, yPercent: 0.52 }),
          makeEl('body', 'Alle Infos an einem Ort.\nEigene Domain. Eigenes Design.\nMit Admin-Dashboard für euch.', { delay: 1.1, yPercent: 0.56 }),
          makeEl('footer', '', { delay: 1.5, yPercent: 0.96 }),
        ], { duration: 4.5 }),

        // Slide 3: Feature Detail
        makeSlide([
          makeEl('logo', 'S&I.', { animation: 'fadeIn', delay: 0, yPercent: 0.04 }),
          makeEl('eyebrow', 'RSVP Feature', { delay: 0.3, yPercent: 0.30 }),
          makeEl('headline', 'Zu- und Absagen auf einen Blick', { delay: 0.5, yPercent: 0.36, fontSize: 72 }),
          makeEl('body', 'Eure Gäste melden sich direkt über\ndie Website an. Ihr seht alles im\nDashboard — Echtzeit.', { delay: 1.0, yPercent: 0.54 }),
          makeEl('footer', '', { delay: 1.3, yPercent: 0.96 }),
        ], { duration: 4 }),

        // Slide 4: CTA
        makeSlide([
          makeEl('logo', 'S&I.', { animation: 'fadeIn', delay: 0, yPercent: 0.04 }),
          makeEl('headline', 'Bereit für eure Website?', { delay: 0.5, yPercent: 0.42, fontSize: 80 }),
          makeEl('accentWord', 'Website?', { delay: 1.0, yPercent: 0.60 }),
          makeEl('body', 'Link in Bio · siwedding.com', { delay: 1.3, yPercent: 0.72 }),
          makeEl('footer', '', { delay: 1.5, yPercent: 0.96 }),
        ], { duration: 4 }),
      ];
    },
  },

  hochzeitstipp: {
    name: 'Hochzeitstipp',
    desc: 'Hook → 3 Tipps → CTA',
    icon: '💡',
    create: () => {
      resetIds();
      return [
        // Slide 1: Hook
        makeSlide([
          makeEl('logo', 'S&I.', { animation: 'fadeIn', delay: 0.2, yPercent: 0.04 }),
          makeEl('eyebrow', 'Hochzeitstipp', { delay: 0.5, yPercent: 0.35 }),
          makeEl('headline', '3 Dinge die eure Gäste wirklich wollen', { delay: 0.7, yPercent: 0.42, fontSize: 74 }),
          makeEl('divider', '', { delay: 1.2, yPercent: 0.60 }),
          makeEl('body', 'Speichern für später!', { delay: 1.4, yPercent: 0.64 }),
          makeEl('footer', '', { delay: 1.6, yPercent: 0.96 }),
        ], { duration: 4, transitionIn: 'none' }),

        // Slide 2: Tipp 1
        makeSlide([
          makeEl('logo', 'S&I.', { animation: 'fadeIn', delay: 0, yPercent: 0.04 }),
          makeEl('eyebrow', 'Tipp 1', { delay: 0.3, yPercent: 0.32 }),
          makeEl('headline', 'Klare Infos zur Location', { delay: 0.5, yPercent: 0.38, fontSize: 76 }),
          makeEl('body', 'Anfahrt, Parken, Dresscode —\nalles auf einen Blick, ohne\n10 Nachrichten schreiben zu müssen.', { delay: 1.0, yPercent: 0.56 }),
          makeEl('footer', '', { delay: 1.3, yPercent: 0.96 }),
        ], { duration: 4 }),

        // Slide 3: Tipp 2
        makeSlide([
          makeEl('logo', 'S&I.', { animation: 'fadeIn', delay: 0, yPercent: 0.04 }),
          makeEl('eyebrow', 'Tipp 2', { delay: 0.3, yPercent: 0.32 }),
          makeEl('headline', 'Einfache Zu- und Absage', { delay: 0.5, yPercent: 0.38, fontSize: 76 }),
          makeEl('body', 'Kein Anruf nötig. Ein Klick reicht.\nMit Menüwahl und Allergien\ndirekt auf der Website.', { delay: 1.0, yPercent: 0.56 }),
          makeEl('footer', '', { delay: 1.3, yPercent: 0.96 }),
        ], { duration: 4 }),

        // Slide 4: Tipp 3 + CTA
        makeSlide([
          makeEl('logo', 'S&I.', { animation: 'fadeIn', delay: 0, yPercent: 0.04 }),
          makeEl('eyebrow', 'Tipp 3', { delay: 0.3, yPercent: 0.28 }),
          makeEl('headline', 'Ein Ort für alle Erinnerungen', { delay: 0.5, yPercent: 0.34, fontSize: 72 }),
          makeEl('body', 'Fotos hochladen, Musikwünsche\nteilen — eure Website als\ngemeinsames Erlebnis.', { delay: 1.0, yPercent: 0.52 }),
          makeEl('divider', '', { delay: 1.5, yPercent: 0.70 }),
          makeEl('body', 'Mehr auf siwedding.com · Link in Bio', { delay: 1.7, yPercent: 0.74 }),
          makeEl('footer', '', { delay: 1.9, yPercent: 0.96 }),
        ], { duration: 5 }),
      ];
    },
  },

  vorherNachher: {
    name: 'Vorher/Nachher',
    desc: 'Problem → Lösung → Ergebnis → CTA',
    icon: '🔄',
    create: () => {
      resetIds();
      return [
        // Slide 1: Vorher (Problem)
        makeSlide([
          makeEl('logo', 'S&I.', { animation: 'fadeIn', delay: 0.2, yPercent: 0.04 }),
          makeEl('eyebrow', 'Vorher', { delay: 0.5, yPercent: 0.32 }),
          makeEl('headline', 'WhatsApp-Chaos, verlorene Zusagen, kein Überblick', { delay: 0.7, yPercent: 0.38, fontSize: 68 }),
          makeEl('body', 'Kennt ihr das? 5 Gruppen, 20 Nachfragen,\nund trotzdem weiß niemand Bescheid.', { delay: 1.3, yPercent: 0.62 }),
          makeEl('footer', '', { delay: 1.6, yPercent: 0.96 }),
        ], { duration: 4.5, transitionIn: 'none' }),

        // Slide 2: Nachher (Lösung)
        makeSlide([
          makeEl('logo', 'S&I.', { animation: 'fadeIn', delay: 0, yPercent: 0.04 }),
          makeEl('eyebrow', 'Nachher', { delay: 0.3, yPercent: 0.32 }),
          makeEl('headline', 'Eine Website. Alle Infos. Volle Kontrolle.', { delay: 0.5, yPercent: 0.38, fontSize: 72 }),
          makeEl('divider', '', { delay: 1.0, yPercent: 0.54 }),
          makeEl('body', 'RSVP, Gästeliste, Location —\nalles auf eurer eigenen Website.\nMit eurem Design.', { delay: 1.2, yPercent: 0.58 }),
          makeEl('footer', '', { delay: 1.5, yPercent: 0.96 }),
        ], { duration: 4.5 }),

        // Slide 3: Ergebnis
        makeSlide([
          makeEl('logo', 'S&I.', { animation: 'fadeIn', delay: 0, yPercent: 0.04 }),
          makeEl('eyebrow', 'Das Ergebnis', { delay: 0.3, yPercent: 0.35 }),
          makeEl('headline', 'Stressfrei heiraten', { delay: 0.5, yPercent: 0.42, fontSize: 88 }),
          makeEl('accentWord', 'Stressfrei', { delay: 1.0, yPercent: 0.60 }),
          makeEl('footer', '', { delay: 1.3, yPercent: 0.96 }),
        ], { duration: 3.5 }),

        // Slide 4: CTA
        makeSlide([
          makeEl('logo', 'S&I.', { animation: 'fadeIn', delay: 0, yPercent: 0.04 }),
          makeEl('headline', 'Ab 1.290€', { delay: 0.4, yPercent: 0.40, fontSize: 96 }),
          makeEl('body', 'Handgemacht in Hamburg.\nsiwedding.com · Link in Bio', { delay: 1.0, yPercent: 0.58 }),
          makeEl('footer', '', { delay: 1.3, yPercent: 0.96 }),
        ], { duration: 4 }),
      ];
    },
  },

  leer: {
    name: 'Leer',
    desc: '1 leerer Slide zum Selbstgestalten',
    icon: '📝',
    create: () => {
      resetIds();
      return [
        makeSlide([
          makeEl('logo', 'S&I.', { animation: 'fadeIn', delay: 0.2, yPercent: 0.04 }),
          makeEl('eyebrow', 'Eyebrow Text', { delay: 0.5, yPercent: 0.35 }),
          makeEl('headline', 'Deine Headline hier', { delay: 0.8, yPercent: 0.42, fontSize: 80 }),
          makeEl('body', 'Body Text hier eingeben.', { delay: 1.2, yPercent: 0.62 }),
          makeEl('footer', '', { delay: 1.5, yPercent: 0.96 }),
        ], { duration: 5, transitionIn: 'none' }),
      ];
    },
  },
};
