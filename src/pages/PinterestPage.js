// src/pages/PinterestPage.js
// Pinterest-Pins: Generator erzeugt Entwürfe, die Entwurfsliste prüft und
// übernimmt sie, die Queue veröffentlicht per täglichem Cron.
// Rendering und KI-Copy liegen in PinBatchGenerator.
import React from 'react';
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
          theme: draft.meta?.theme || 'classic',
        })}
      />

      {/* Der Einzel-Editor ist entfallen: Pins entstehen jetzt ausschließlich
          über Generator und Entwurfsliste. */}
      <PinQueue />
    </>
  );
}
