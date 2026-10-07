// api/lib/auth.js
// Shared Auth-Utilities: CORS-Whitelist, Token-Erstellung & Verifizierung (HMAC-SHA256)

import { createHmac } from 'crypto';

const ALLOWED_ORIGINS = [
  'https://admin.sarahiver.de',
  'https://si-superadmin.vercel.app',
  'https://superadmin.siwedding.de',
  'http://localhost:3000',
];

const JWT_SECRET = process.env.ADMIN_JWT_SECRET;
const TOKEN_EXPIRY = 24 * 60 * 60; // 24h in Sekunden

// CORS-Whitelist — einmal definiert, überall genutzt
export function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || (origin && origin.endsWith('.vercel.app'));
  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Token erstellen (HMAC-SHA256)
export function createSessionToken(payload) {
  if (!JWT_SECRET) throw new Error('ADMIN_JWT_SECRET not configured');

  const tokenPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY,
  };

  const payloadB64 = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');
  const signature = createHmac('sha256', JWT_SECRET).update(payloadB64).digest('base64url');

  return `${payloadB64}.${signature}`;
}

// Token aus Authorization-Header lesen + verifizieren
export function verifySessionToken(req) {
  if (!JWT_SECRET) return { valid: false, error: 'ADMIN_JWT_SECRET not configured' };

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing Authorization header' };
  }

  const token = authHeader.slice(7); // "Bearer " entfernen
  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Invalid token format' };
  }

  const [payloadB64, signature] = parts;

  // Signatur prüfen
  const expectedSig = createHmac('sha256', JWT_SECRET).update(payloadB64).digest('base64url');
  if (signature !== expectedSig) {
    return { valid: false, error: 'Invalid token signature' };
  }

  // Payload dekodieren
  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
  } catch {
    return { valid: false, error: 'Invalid token payload' };
  }

  // Ablauf prüfen
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    return { valid: false, error: 'Token expired' };
  }

  return { valid: true, payload };
}
