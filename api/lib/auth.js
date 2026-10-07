// api/lib/auth.js
// Shared auth utilities for all API routes:
// - CORS handling (exact domain whitelist)
// - Token-based authentication
// - Rate limiting (in-memory)

const crypto = require('crypto');

// ============================================
// CORS
// ============================================

const ALLOWED_ORIGINS = [
  'https://siwedding.de',
  'https://www.siwedding.de',
  'http://localhost:3000',
  'http://localhost:3001',
];

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Customer subdomains: *.siwedding.de
  if (origin.endsWith('.siwedding.de') && origin.startsWith('https://')) return true;
  return false;
}

function getCorsHeaders(origin) {
  const allowed = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

/**
 * Handle CORS preflight and set headers.
 * Returns true if the request was an OPTIONS preflight (already responded).
 */
function handleCors(req, res) {
  const origin = req.headers.origin || '';
  const corsHeaders = getCorsHeaders(origin);
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

// ============================================
// TOKEN AUTH
// ============================================

const TOKEN_SECRET = process.env.TOKEN_SECRET;
const TOKEN_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Create a signed token containing email + timestamp.
 */
function createToken(email, slug) {
  if (!TOKEN_SECRET) throw new Error('TOKEN_SECRET not configured');
  const payload = JSON.stringify({ email, slug, iat: Date.now() });
  const b64 = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(b64).digest('base64url');
  return `${b64}.${sig}`;
}

/**
 * Verify a token. Returns { email, slug, iat } or null.
 */
function verifyToken(token) {
  if (!token || !TOKEN_SECRET) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [b64, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(b64).digest('base64url');
  if (sig !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString());
    if (Date.now() - payload.iat > TOKEN_MAX_AGE) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Middleware: require valid Bearer token.
 * Returns the token payload or null (and sends 401).
 */
function requireAuth(req, res) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return payload;
}

/**
 * Token gehört zum Kunden-Dashboard dieses Projekts?
 * Gäste- und Vorschau-Tokens (guest@slug, preview@slug) sind bewusst
 * ausgeschlossen — das Gäste-Passwort kennt die ganze Hochzeitsgesellschaft.
 */
function isAdminToken(payload) {
  return !!(payload && payload.slug && payload.email === `admin@${payload.slug}`);
}

/**
 * Lädt das Projekt zum Token und prüft, ob projectId dazu passt.
 * Sendet 403 und gibt null zurück, wenn nicht.
 * @returns {Promise<{id: string, slug: string} | null>}
 */
async function requireProjectAdmin(req, res, projectId) {
  const auth = requireAuth(req, res);
  if (!auth) return null;

  if (!isAdminToken(auth)) {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  const r = await fetch(
    `${url}/rest/v1/projects?slug=eq.${encodeURIComponent(auth.slug)}&select=id,slug`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  );
  const rows = r.ok ? await r.json() : [];
  const project = rows?.[0] || null;

  if (!project || (projectId && String(projectId) !== String(project.id))) {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }
  return { ...project, auth };
}

// ============================================
// RATE LIMITING
// ============================================

const rateLimitStore = new Map();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now - entry.windowStart > entry.windowMs * 2) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Check rate limit for a given key.
 * @param {string} key - Unique identifier (IP or email)
 * @param {number} maxRequests - Max requests allowed in window
 * @param {number} windowMs - Window duration in milliseconds
 * @returns {{ allowed: boolean, remaining: number, retryAfter: number }}
 */
function checkRateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  let entry = rateLimitStore.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    entry = { windowStart: now, count: 0, windowMs };
    rateLimitStore.set(key, entry);
  }

  entry.count++;

  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  return { allowed: true, remaining: maxRequests - entry.count, retryAfter: 0 };
}

/**
 * Apply rate limit and send 429 if exceeded.
 * Returns true if the request was blocked.
 */
function applyRateLimit(res, key, maxRequests, windowMs) {
  const result = checkRateLimit(key, maxRequests, windowMs);
  if (!result.allowed) {
    res.setHeader('Retry-After', String(result.retryAfter));
    res.status(429).json({ error: 'Too many requests', retryAfter: result.retryAfter });
    return true;
  }
  return false;
}

/**
 * Get client IP from Vercel headers.
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || 'unknown';
}

module.exports = {
  handleCors,
  isAllowedOrigin,
  getCorsHeaders,
  createToken,
  verifyToken,
  requireAuth,
  isAdminToken,
  requireProjectAdmin,
  checkRateLimit,
  applyRateLimit,
  getClientIP,
};
