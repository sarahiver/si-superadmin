// src/pages/PinterestPage.js
// Pinterest-Pin-Generator — nutzt dieselbe Engine wie InstagramPage über die platform-Prop.
// 2:3-Canvas (1080×1620), Pinterest-getunte KI (SEO-Titel/Beschreibung/Keywords).
// Darunter: Pin-Queue mit Status (geplant / live / Fehler) — Publishing läuft
// über die Pinterest-API (api/pinterest.js) + täglichen Cron.
import React from 'react';
import InstagramPage from './InstagramPage';
import { PinQueue } from '../components/PinterestPublish';

export default function PinterestPage() {
  return (
    <>
      <InstagramPage platform="pinterest" />
      <PinQueue />
    </>
  );
}
