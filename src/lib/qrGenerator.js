// src/lib/qrGenerator.js
// QR Code Generator für:
// a) EPC/GiroCode (Zahlungs-QR auf Rechnungen)
// b) URL-QR (Website-Link für Einladungen)
//
// Nutzt eine reine JS-Implementierung ohne externe Abhängigkeiten.
// Generiert QR als Data-URL (PNG) für PDF-Einbettung und als SVG für E-Mails.

// ============================================
// QR CODE MATRIX GENERATOR (Reed-Solomon etc.)
// Lightweight implementation based on kazuhikoarase/qrcode-generator (MIT)
// ============================================

const QR_MODE_8BIT = 4;
const QR_ERROR_CORRECT_M = 0;
const QR_ERROR_CORRECT_Q = 1;

// Polynomial & GF(256) tables
const EXP_TABLE = new Array(256);
const LOG_TABLE = new Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x >= 256) x ^= 0x11d;
  }
  EXP_TABLE[255] = EXP_TABLE[0];
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return EXP_TABLE[(LOG_TABLE[a] + LOG_TABLE[b]) % 255];
}

function rsGenPoly(nsym) {
  let g = [1];
  for (let i = 0; i < nsym; i++) {
    const ng = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      ng[j] ^= g[j];
      ng[j + 1] ^= gfMul(g[j], EXP_TABLE[i]);
    }
    g = ng;
  }
  return g;
}

function rsEncode(data, nsym) {
  const gen = rsGenPoly(nsym);
  const res = new Array(data.length + nsym).fill(0);
  for (let i = 0; i < data.length; i++) res[i] = data[i];
  for (let i = 0; i < data.length; i++) {
    const coef = res[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        res[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return res.slice(data.length);
}

// Version/EC capacity table (data codewords per version for EC level M and Q)
// [version][ecLevel] = { totalCodewords, ecCodewordsPerBlock, numBlocks }
const VERSION_TABLE = [
  null, // 0
  { M: { dc: 16, ec: 10, b: 1 }, Q: { dc: 13, ec: 13, b: 1 } },
  { M: { dc: 28, ec: 16, b: 1 }, Q: { dc: 22, ec: 22, b: 1 } },
  { M: { dc: 44, ec: 26, b: 1 }, Q: { dc: 34, ec: 18, b: 2 } },
  { M: { dc: 64, ec: 18, b: 2 }, Q: { dc: 48, ec: 26, b: 2 } },
  { M: { dc: 86, ec: 24, b: 2 }, Q: { dc: 62, ec: 18, b: 2 } },
  { M: { dc: 108, ec: 16, b: 4 }, Q: { dc: 76, ec: 24, b: 4 } },
  { M: { dc: 124, ec: 18, b: 4 }, Q: { dc: 88, ec: 18, b: 2 } },
  { M: { dc: 154, ec: 22, b: 2 }, Q: { dc: 110, ec: 22, b: 4 } },
  { M: { dc: 182, ec: 22, b: 3 }, Q: { dc: 132, ec: 20, b: 4 } },
  { M: { dc: 216, ec: 26, b: 4 }, Q: { dc: 154, ec: 24, b: 6 } },
];

// Use a well-tested external approach: generate via Canvas using a minimal encoder
// For reliability, we'll use the browser's native capabilities

/**
 * Generate QR code as a data URL using a canvas-based approach.
 * Falls back to a simple SVG-based generation.
 */

// ============================================
// SIMPLE BUT RELIABLE QR GENERATION
// Using the proven qr-creator approach via CDN or inline
// ============================================

/**
 * Generate EPC QR Code payload (European Payments Council standard)
 * This is the format banking apps recognize for SEPA payments
 */
export function buildEPCPayload({ iban, bic, name, amount, reference }) {
  // EPC069-12 standard
  const lines = [
    'BCD',                          // Service Tag
    '002',                          // Version
    '1',                            // Character set (UTF-8)
    'SCT',                          // Identification
    bic || '',                      // BIC
    name || '',                     // Beneficiary Name (max 70)
    iban.replace(/\s/g, ''),       // IBAN (no spaces)
    amount ? `EUR${amount.toFixed(2)}` : '', // Amount
    '',                             // Purpose
    reference || '',                // Remittance (max 140)
    '',                             // Information
  ];
  return lines.join('\n');
}

/**
 * Generate QR Code as SVG string
 * Uses a CDN-loaded library for reliability
 */
async function generateQRDataURL(content, options = {}) {
  const {
    size = 200,
    color = '#000000',
    bgColor = '#FFFFFF',
    margin = 2,
  } = options;

  // Use the QRCode library if available (loaded via CDN in index.html)
  // Fallback: use Google Charts API (works offline too with cached response)
  
  // Method 1: Canvas-based generation using inline QR encoder
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      // Try using window.QRCode if loaded
      if (window.QRCode) {
        const tempDiv = document.createElement('div');
        new window.QRCode(tempDiv, {
          text: content,
          width: size,
          height: size,
          colorDark: color,
          colorLight: bgColor,
          correctLevel: window.QRCode.CorrectLevel.M,
        });
        // QRCode library creates an img or canvas inside tempDiv
        setTimeout(() => {
          const img = tempDiv.querySelector('img') || tempDiv.querySelector('canvas');
          if (img) {
            if (img.tagName === 'CANVAS') {
              resolve(img.toDataURL('image/png'));
            } else {
              resolve(img.src);
            }
          } else {
            resolve(generateQRSVGFallback(content, size, color, bgColor));
          }
        }, 100);
        return;
      }
      
      // Fallback: SVG-based
      resolve(generateQRSVGFallback(content, size, color, bgColor));
    } catch (e) {
      console.warn('QR generation error:', e);
      resolve(null);
    }
  });
}

/**
 * Generate QR as SVG string (for email embedding)
 */
export function generateQRSVG(content, options = {}) {
  const {
    size = 200,
    color = '#000000',
    bgColor = '#FFFFFF',
    style = 'square',      // square | dots | rounded
    logoText = '',          // Text in center (e.g. "S&I.")
    logoImage = '',         // Base64 data URL for center image
    frameText = '',         // Text below QR (e.g. "Scan me!")
    frameStyle = 'none',    // none | simple | rounded
  } = options;
  
  const modules = encodeToModules(content);
  if (!modules) return null;
  
  const moduleCount = modules.length;
  const frameH = frameText ? 28 : 0;
  const totalH = size + frameH;
  const cellSize = size / (moduleCount + 8);
  const offset = cellSize * 4;
  const r = (cellSize * 0.45).toFixed(2); // radius for dots
  const cr = (cellSize * 0.3).toFixed(2); // corner radius for rounded
  
  let paths = '';
  
  // Detect finder pattern areas (skip them for special rendering)
  const isFinderModule = (row, col) => {
    return (row < 7 && col < 7) || 
           (row < 7 && col >= moduleCount - 7) || 
           (row >= moduleCount - 7 && col < 7);
  };
  
  // Render finder patterns (always square-style for scannability)
  const renderFinder = (ox, oy) => {
    let svg = '';
    // Outer border
    svg += `<rect x="${ox}" y="${oy}" width="${(cellSize*7).toFixed(2)}" height="${(cellSize*7).toFixed(2)}" rx="${(cellSize*0.5).toFixed(2)}" fill="${color}"/>`;
    // Inner white
    svg += `<rect x="${(ox+cellSize).toFixed(2)}" y="${(oy+cellSize).toFixed(2)}" width="${(cellSize*5).toFixed(2)}" height="${(cellSize*5).toFixed(2)}" rx="${(cellSize*0.3).toFixed(2)}" fill="${bgColor}"/>`;
    // Center dot
    svg += `<rect x="${(ox+cellSize*2).toFixed(2)}" y="${(oy+cellSize*2).toFixed(2)}" width="${(cellSize*3).toFixed(2)}" height="${(cellSize*3).toFixed(2)}" rx="${(cellSize*0.4).toFixed(2)}" fill="${color}"/>`;
    return svg;
  };
  
  // Render 3 finder patterns
  paths += renderFinder(offset, offset);
  paths += renderFinder(offset + (moduleCount - 7) * cellSize, offset);
  paths += renderFinder(offset, offset + (moduleCount - 7) * cellSize);
  
  // Render data modules
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (isFinderModule(row, col)) continue;
      if (!modules[row][col]) continue;
      
      const x = offset + col * cellSize;
      const y = offset + row * cellSize;
      
      switch (style) {
        case 'dots':
          paths += `<circle cx="${(x + cellSize/2).toFixed(2)}" cy="${(y + cellSize/2).toFixed(2)}" r="${r}" fill="${color}"/>`;
          break;
        case 'rounded':
          paths += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" rx="${cr}" fill="${color}"/>`;
          break;
        default: // square
          paths += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" fill="${color}"/>`;
      }
    }
  }
  
  // Logo area (center of QR)
  let logoPart = '';
  if (logoText || logoImage) {
    const logoSize = size * 0.22;
    const lx = (size - logoSize) / 2;
    const ly = (size - logoSize) / 2;
    const pad = logoSize * 0.12;
    
    // White background circle for logo
    logoPart += `<circle cx="${(size/2).toFixed(2)}" cy="${(size/2).toFixed(2)}" r="${(logoSize/2 + pad).toFixed(2)}" fill="${bgColor}"/>`;
    
    if (logoImage) {
      logoPart += `<image href="${logoImage}" x="${lx.toFixed(2)}" y="${ly.toFixed(2)}" width="${logoSize.toFixed(2)}" height="${logoSize.toFixed(2)}" preserveAspectRatio="xMidYMid meet"/>`;
    } else if (logoText) {
      const fontSize = logoSize * 0.4;
      logoPart += `<text x="${(size/2).toFixed(2)}" y="${(size/2 + fontSize * 0.35).toFixed(2)}" text-anchor="middle" font-family="'Helvetica','Arial',sans-serif" font-weight="700" font-size="${fontSize.toFixed(1)}" fill="${color}" letter-spacing="-0.03em">${escapeXml(logoText)}</text>`;
    }
  }
  
  // Frame with text below QR
  let framePart = '';
  if (frameText && frameStyle !== 'none') {
    const fy = size;
    const fRadius = frameStyle === 'rounded' ? '8' : '0';
    
    // Frame background (extends from bottom of QR)
    framePart += `<rect x="0" y="${fy}" width="${size}" height="${frameH}" rx="0" fill="${color}"/>`;
    // Rounded bottom corners
    if (frameStyle === 'rounded') {
      framePart += `<rect x="0" y="${fy}" width="${size}" height="10" fill="${color}"/>`;
      framePart += `<rect x="0" y="${fy + 4}" width="${size}" height="${frameH - 4}" rx="${fRadius}" fill="${color}"/>`;
    }
    // Frame text
    framePart += `<text x="${(size/2).toFixed(2)}" y="${(fy + frameH * 0.62).toFixed(2)}" text-anchor="middle" font-family="'Helvetica','Arial',sans-serif" font-weight="600" font-size="${(frameH * 0.42).toFixed(1)}" fill="${bgColor}" letter-spacing="0.02em">${escapeXml(frameText)}</text>`;
  }
  
  // Full border for frame styles
  let borderPart = '';
  if (frameText && frameStyle !== 'none') {
    const bRadius = frameStyle === 'rounded' ? '12' : '0';
    borderPart = `<rect x="0" y="0" width="${size}" height="${totalH}" rx="${bRadius}" fill="none" stroke="${color}" stroke-width="3"/>`;
    // Re-fill QR background inside border
  }
  
  // Build complete SVG
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${totalH}" width="${size}" height="${totalH}">`;
  
  if (frameText && frameStyle !== 'none') {
    const bRadius = frameStyle === 'rounded' ? '12' : '0';
    svg += `<rect width="${size}" height="${totalH}" rx="${bRadius}" fill="${bgColor}" stroke="${color}" stroke-width="2"/>`;
  } else {
    svg += `<rect width="${size}" height="${totalH}" fill="${bgColor}"/>`;
  }
  
  svg += paths;
  svg += logoPart;
  svg += framePart;
  svg += `</svg>`;
  
  return svg;
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ============================================
// MINIMAL QR ENCODER (for SVG fallback)
// Encodes text to QR module matrix
// ============================================

export function encodeToModules(text) {
  try {
    const data = new TextEncoder().encode(text);
    const byteCount = data.length;
    
    // Find minimum version
    let version = 1;
    const ecLevel = 'M';
    while (version <= 10) {
      const cap = VERSION_TABLE[version]?.[ecLevel];
      if (cap && cap.dc >= byteCount + 3) break; // +3 for mode/length overhead
      version++;
    }
    if (version > 10) version = 10; // Cap at version 10 for simplicity
    
    const moduleCount = version * 4 + 17;
    const matrix = Array.from({ length: moduleCount }, () => new Array(moduleCount).fill(false));
    const reserved = Array.from({ length: moduleCount }, () => new Array(moduleCount).fill(false));
    
    // Place finder patterns
    placeFinder(matrix, reserved, 0, 0);
    placeFinder(matrix, reserved, moduleCount - 7, 0);
    placeFinder(matrix, reserved, 0, moduleCount - 7);
    
    // Place timing patterns
    for (let i = 8; i < moduleCount - 8; i++) {
      matrix[6][i] = matrix[i][6] = i % 2 === 0;
      reserved[6][i] = reserved[i][6] = true;
    }
    
    // Reserve format info areas
    for (let i = 0; i < 8; i++) {
      reserved[8][i] = reserved[i][8] = true;
      reserved[8][moduleCount - 1 - i] = true;
      reserved[moduleCount - 1 - i][8] = true;
    }
    reserved[8][8] = true;
    matrix[moduleCount - 8][8] = true; // Dark module
    reserved[moduleCount - 8][8] = true;
    
    // Alignment pattern for version >= 2
    if (version >= 2) {
      const pos = getAlignmentPositions(version);
      for (const r of pos) {
        for (const c of pos) {
          if (reserved[r]?.[c]) continue;
          placeAlignment(matrix, reserved, r, c);
        }
      }
    }
    
    // Encode data
    const ecInfo = VERSION_TABLE[version][ecLevel];
    const totalDataCodewords = ecInfo.dc;
    const ecCodewords = ecInfo.ec;
    const numBlocks = ecInfo.b;
    
    // Build data bitstream
    let bits = '';
    bits += '0100'; // Byte mode indicator
    const charCountBits = version <= 9 ? 8 : 16;
    bits += byteCount.toString(2).padStart(charCountBits, '0');
    for (const byte of data) {
      bits += byte.toString(2).padStart(8, '0');
    }
    // Terminator
    bits += '0000';
    // Pad to byte boundary
    while (bits.length % 8 !== 0) bits += '0';
    // Pad bytes
    const padBytes = [0xEC, 0x11];
    let padIdx = 0;
    while (bits.length < totalDataCodewords * 8) {
      bits += padBytes[padIdx % 2].toString(2).padStart(8, '0');
      padIdx++;
    }
    
    // Convert to codewords
    const codewords = [];
    for (let i = 0; i < bits.length; i += 8) {
      codewords.push(parseInt(bits.substr(i, 8), 2));
    }
    
    // RS error correction
    const dataPerBlock = Math.floor(totalDataCodewords / numBlocks);
    const blocks = [];
    let offset = 0;
    for (let i = 0; i < numBlocks; i++) {
      const blockData = codewords.slice(offset, offset + dataPerBlock);
      const ecData = rsEncode(blockData, ecCodewords);
      blocks.push({ data: blockData, ec: ecData });
      offset += dataPerBlock;
    }
    
    // Interleave
    const finalData = [];
    for (let i = 0; i < dataPerBlock; i++) {
      for (const b of blocks) {
        if (i < b.data.length) finalData.push(b.data[i]);
      }
    }
    for (let i = 0; i < ecCodewords; i++) {
      for (const b of blocks) {
        if (i < b.ec.length) finalData.push(b.ec[i]);
      }
    }
    
    // Place data
    let bitIndex = 0;
    const allBits = finalData.map(b => b.toString(2).padStart(8, '0')).join('');
    let direction = -1; // up
    let col = moduleCount - 1;
    
    while (col >= 0) {
      if (col === 6) col--; // Skip timing column
      
      const rows = direction === -1 
        ? Array.from({ length: moduleCount }, (_, i) => i).reverse()
        : Array.from({ length: moduleCount }, (_, i) => i);
        
      for (const row of rows) {
        for (const dc of [0, 1]) {
          const c = col - dc;
          if (c < 0 || reserved[row][c]) continue;
          if (bitIndex < allBits.length) {
            matrix[row][c] = allBits[bitIndex] === '1';
            bitIndex++;
          }
        }
      }
      
      direction = -direction;
      col -= 2;
    }
    
    // Apply mask (pattern 0: (row + col) % 2 === 0)
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (!reserved[r][c] && (r + c) % 2 === 0) {
          matrix[r][c] = !matrix[r][c];
        }
      }
    }
    
    // Place format info (mask 0, EC level M = 0)
    placeFormatInfo(matrix, moduleCount, 0, 0); // mask 0, ecLevel M=0
    
    return matrix;
  } catch (e) {
    console.warn('QR encode error:', e);
    return null;
  }
}

function placeFinder(matrix, reserved, row, col) {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const mr = row + r, mc = col + c;
      if (mr < 0 || mc < 0 || mr >= matrix.length || mc >= matrix.length) continue;
      const isOuter = r === -1 || r === 7 || c === -1 || c === 7;
      const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
      matrix[mr][mc] = !isOuter && (isBorder || isInner);
      reserved[mr][mc] = true;
    }
  }
}

function placeAlignment(matrix, reserved, centerRow, centerCol) {
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const mr = centerRow + r, mc = centerCol + c;
      if (mr < 0 || mc < 0 || mr >= matrix.length || mc >= matrix.length) continue;
      if (reserved[mr][mc]) continue;
      matrix[mr][mc] = Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0);
      reserved[mr][mc] = true;
    }
  }
}

function getAlignmentPositions(version) {
  if (version <= 1) return [];
  const positions = [6];
  const last = version * 4 + 10;
  const count = Math.floor(version / 7) + 2;
  const step = Math.ceil((last - 6) / (count - 1));
  for (let i = 1; i < count; i++) {
    positions.push(6 + i * step);
  }
  positions[positions.length - 1] = last;
  return positions;
}

function placeFormatInfo(matrix, size, mask, ecLevel) {
  // Simplified format info placement
  // Format string for EC=M, mask=0: 101010000010010
  const formatBits = '101010000010010';
  for (let i = 0; i < 15; i++) {
    const bit = formatBits[i] === '1';
    // Horizontal
    if (i < 8) {
      const col = i < 6 ? i : i + 1;
      matrix[8][col] = bit;
    } else {
      matrix[8][size - 15 + i] = bit;
    }
    // Vertical
    if (i < 8) {
      matrix[size - 1 - i][8] = bit;
    } else {
      const row = i < 9 ? 15 - i : 14 - i;
      matrix[row][8] = bit;
    }
  }
}

function generateQRSVGFallback(content, size, color, bgColor) {
  const svg = generateQRSVG(content, { size, color, bgColor });
  if (!svg) return null;
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Generate an EPC/GiroCode QR for invoices
 * Banking apps will recognize this and pre-fill payment details
 */
export async function generatePaymentQR(options = {}) {
  const {
    amount,
    reference,
    iban = 'DE06100180000625272320',
    bic = 'FNOMDEB2',
    name = 'Iver Gentz',
    size = 150,
    color = '#000000',
  } = options;

  const payload = buildEPCPayload({ iban, bic, name, amount, reference });
  return await generateQRDataURL(payload, { size, color });
}

/**
 * Generate a URL QR code for wedding websites
 */
export async function generateWebsiteQR(options = {}) {
  const {
    url,
    size = 300,
    color = '#000000',
    bgColor = '#FFFFFF',
  } = options;

  if (!url) return null;
  const fullUrl = url.startsWith('http') ? url : `https://${url}`;
  return await generateQRDataURL(fullUrl, { size, color, bgColor });
}

/**
 * Generate a URL QR code as SVG string (for email embedding)
 */
export function generateWebsiteQRSVG(options = {}) {
  const {
    url,
    size = 300,
    color = '#000000',
    bgColor = '#FFFFFF',
    style = 'square',
    logoText = '',
    logoImage = '',
    frameText = '',
    frameStyle = 'none',
  } = options;

  if (!url) return null;
  const fullUrl = url.startsWith('http') ? url : `https://${url}`;
  return generateQRSVG(fullUrl, { size, color, bgColor, style, logoText, logoImage, frameText, frameStyle });
}

/**
 * Generate EPC payment QR as SVG
 */
export function generatePaymentQRSVG(options = {}) {
  const {
    amount,
    reference,
    iban = 'DE06100180000625272320',
    bic = 'FNOMDEB2',
    name = 'Iver Gentz',
    size = 150,
    color = '#000000',
  } = options;

  const payload = buildEPCPayload({ iban, bic, name, amount, reference });
  return generateQRSVG(payload, { size, color });
}

/**
 * Add QR code image to a jsPDF document
 */
export async function addQRToPDF(doc, content, x, y, size = 40, color = '#000000') {
  const dataUrl = await generateQRDataURL(content, { size: size * 4, color }); // 4x for quality
  if (dataUrl) {
    doc.addImage(dataUrl, 'PNG', x, y, size, size);
    return true;
  }
  return false;
}

export default {
  generatePaymentQR,
  generateWebsiteQR,
  generateWebsiteQRSVG,
  generatePaymentQRSVG,
  addQRToPDF,
  buildEPCPayload,
};
