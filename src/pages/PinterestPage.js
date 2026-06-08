// src/pages/PinterestPage.js
// Pinterest-Pin-Generator — nutzt dieselbe Engine wie InstagramPage über die platform-Prop.
// 2:3-Canvas (1080×1620), Pinterest-getunte KI (SEO-Titel/Beschreibung/Keywords).
import React from 'react';
import InstagramPage from './InstagramPage';

export default function PinterestPage() {
  return <InstagramPage platform="pinterest" />;
}
