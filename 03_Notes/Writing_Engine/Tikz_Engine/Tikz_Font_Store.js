/**
 * 03_Notes/Writing_Engine/Tikz_Engine/Tikz_Font_Store.js
 * Keeps the TeX web fonts used by saved TikZ SVGs inside the notes file itself
 * (NotesState.tikzFonts: { cmr10: "data:font/woff2;base64,..." }), shared by every
 * diagram, so saved diagrams render correctly offline without the engine or CDN.
 */

import { NotesState } from '../../00_State.js';
import { TIKZ_ENGINE_CDN } from './Tikz_Engine_Loader.js';

const TIKZ_FONT_STYLE_ID = 'tikz-saved-fonts';

/** Font families (cmr10, cmmi7, ...) referenced by an SVG string. */
export function getTikzSvgFontFamilies(svg = '') {
  const found = new Set();
  const re = /font-family\s*[:=]\s*["']?([A-Za-z0-9]+)/g;
  let m;
  while ((m = re.exec(svg)) !== null) found.add(m[1]);
  return Array.from(found);
}

function tikzArrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

/** Writes @font-face rules for every stored font (idempotent). */
export function applyStoredTikzFonts() {
  if (typeof document === 'undefined') return;
  const fonts = NotesState.tikzFonts || {};
  let style = document.getElementById(TIKZ_FONT_STYLE_ID);
  if (!style) {
    style = document.createElement('style');
    style.id = TIKZ_FONT_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = Object.entries(fonts)
    .filter(([name, url]) => /^[A-Za-z0-9]+$/.test(name) && typeof url === 'string' && url.startsWith('data:font/'))
    .map(([name, url]) => `@font-face { font-family: ${name}; src: url('${url}') format('woff2'); }`)
    .join('\n');
}

/**
 * Downloads (from the engine CDN) and stores any font the SVG uses that the file
 * does not have yet. Returns true when the store changed. Failures are non-fatal:
 * the diagram is still saved, it just needs the CDN fonts until a later render.
 */
export async function storeTikzFontsForSvg(svg) {
  if (!NotesState.tikzFonts || typeof NotesState.tikzFonts !== 'object') NotesState.tikzFonts = {};
  const missing = getTikzSvgFontFamilies(svg).filter(name => !NotesState.tikzFonts[name]);
  if (!missing.length) return false;
  let changed = false;
  await Promise.all(missing.map(async (name) => {
    try {
      const res = await fetch(`${TIKZ_ENGINE_CDN}fonts/${name}.woff2`);
      if (!res.ok) return;
      NotesState.tikzFonts[name] = 'data:font/woff2;base64,' + tikzArrayBufferToBase64(await res.arrayBuffer());
      changed = true;
    } catch (_) { /* offline: keep going without this font */ }
  }));
  if (changed) applyStoredTikzFonts();
  return changed;
}
