// src/lib/googleMaps.js
// Google Maps Integration für S&I SuperAdmin
// Gleiche API wie im Themes-Repo für Konsistenz
//
// Benötigt: REACT_APP_GOOGLE_MAPS_API_KEY in .env / Vercel
// Google Cloud Console → Maps JavaScript API + Places API + Geocoding API aktivieren

const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

// ============================================
// 1. SCRIPT LOADER (einmalig)
// ============================================

let scriptPromise = null;

export function loadGoogleMaps() {
  if (scriptPromise) return scriptPromise;
  if (window.google?.maps?.places) return Promise.resolve(window.google.maps);

  scriptPromise = new Promise((resolve, reject) => {
    if (!API_KEY) {
      reject(new Error('REACT_APP_GOOGLE_MAPS_API_KEY nicht gesetzt'));
      return;
    }

    const callbackName = '__googleMapsCallback';
    window[callbackName] = () => {
      delete window[callbackName];
      resolve(window.google.maps);
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&language=de&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      delete window[callbackName];
      scriptPromise = null;
      reject(new Error('Google Maps Script konnte nicht geladen werden'));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function isGoogleMapsAvailable() {
  return !!API_KEY;
}

// ============================================
// 2. GEOCODING (Adresse → Koordinaten)
// ============================================

let geocoder = null;

export async function geocodeAddress(address) {
  if (!address || address.trim().length < 5) return null;

  try {
    const maps = await loadGoogleMaps();
    if (!geocoder) geocoder = new maps.Geocoder();

    return new Promise((resolve) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const loc = results[0].geometry.location;
          resolve({
            lat: loc.lat(),
            lng: loc.lng(),
            formatted_address: results[0].formatted_address,
          });
        } else {
          resolve(null);
        }
      });
    });
  } catch {
    return null;
  }
}

// ============================================
// 3. EMBED URL GENERIERUNG
// ============================================

export function generateEmbedUrl(options = {}) {
  if (!API_KEY) return '';

  const { lat, lng, address, zoom = 15 } = options;

  if (lat && lng) {
    return `https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=${lat},${lng}&zoom=${zoom}`;
  }

  if (address) {
    const encoded = encodeURIComponent(address);
    return `https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=${encoded}&zoom=${zoom}`;
  }

  return '';
}

export function generateMapsUrl(address) {
  if (!address) return '';
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}
