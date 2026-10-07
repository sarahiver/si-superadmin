// src/pages/PinterestPage.js
// Pinterest-Pin-Generator — nutzt dieselbe Engine wie InstagramPage über die platform-Prop.
// 2:3-Canvas (1080×1620), Pinterest-getunte KI (SEO-Titel/Beschreibung/Keywords).
// Darunter: Pin-Queue mit Status (geplant / live / Fehler) — Publishing läuft
// über die Pinterest-API (api/pinterest.js) + täglichen Cron.
import React from 'react';
import InstagramPage from './InstagramPage';
import { PinQueue, PinterestConnect } from '../components/PinterestPublish';
import PinBatchGenerator, { renderPinBase64 } from '../components/PinBatchGenerator';
import PinterestDrafts from '../components/PinterestDrafts';

export default function PinterestPage() {
  return (
    <>
      <PinterestConnect />
      <PinBatchGenerator />

      {/* Entwürfe liegen zwischen Erzeugung und Queue: Hier wird jeder Pin
          einzeln geprüft, bearbeitet und dann übernommen oder verworfen.
          Das Bild entsteht erst beim Übernehmen — aus den Metadaten, die
          der Generator im Entwurf hinterlegt hat. */}
      <PinterestDrafts
        renderImage={(draft) => renderPinBase64({
          layout: draft.meta?.layout || 'statement',
          eyebrow: draft.meta?.eyebrow,
          headline: draft.meta?.headline || draft.title,
          accentWord: draft.meta?.accentWord,
          body: draft.meta?.body || draft.description,
          imageUrl: draft.meta?.imageUrl || null,
        })}
      />

      <InstagramPage platform="pinterest" />
      <PinQueue />
    </>
  );
}
