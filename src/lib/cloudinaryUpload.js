// src/lib/cloudinaryUpload.js
// Direkter Upload nach Cloudinary — gleiche Technik wie im Kunden-Dashboard
// (si-wedding-themes/src/lib/cloudinary.js), damit es nur einen Weg gibt.
//
// Nutzt dasselbe unsigned Upload-Preset. Das Secret bleibt dadurch im
// Backend; der Browser kennt nur Cloud-Name und Preset.
//
// Hinweis zu SVG: Cloudinary liefert SVGs über den image/upload-Endpunkt
// aus. Wichtig ist, dass der Dateiname auf .svg endet und keine Format-
// Transformation (f_auto) in der URL steht — sonst wird daraus ein PNG und
// die CSS-Maske verliert ihre Schärfe.

const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || '';

export const isCloudinaryConfigured = () => Boolean(CLOUD_NAME && UPLOAD_PRESET);

export function uploadFile(file, { folder = '', onProgress } = {}) {
  if (!isCloudinaryConfigured()) {
    return Promise.reject(new Error(
      'Cloudinary ist nicht konfiguriert — REACT_APP_CLOUDINARY_CLOUD_NAME und REACT_APP_CLOUDINARY_UPLOAD_PRESET fehlen.'
    ));
  }

  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', UPLOAD_PRESET);
  if (folder) {
    form.append('folder', folder);
    form.append('asset_folder', folder);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve(res.secure_url);
        } catch {
          reject(new Error('Antwort von Cloudinary konnte nicht gelesen werden'));
        }
      } else {
        let msg = `Upload fehlgeschlagen (${xhr.status})`;
        try {
          const err = JSON.parse(xhr.responseText);
          if (err?.error?.message) msg = err.error.message;
        } catch { /* Rohtext reicht nicht aus, Standardmeldung bleibt */ }
        reject(new Error(msg));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Netzwerkfehler beim Upload')));

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);
    xhr.send(form);
  });
}
