/**
 * 03_Notes/Writing_Engine/Tikz_Engine/Tikz_Renderer.js
 * TikZ rendering front-end used by the TikZ block.
 *
 * Model: every TikZ block stores its own last good SVG (block.svg) and the render key
 * it was made from (block.svgKey = hash of engine + code + global TikZ preamble).
 *   - Viewing a note only shows the saved SVG: no engine, no internet needed.
 *   - Compiling happens only when the code or the global preamble changed (or on ▶).
 *   - A failed / offline compile never replaces the saved SVG.
 *
 * Pieces: Tikz_Source_Converter.js (Overleaf → engine input), Tikz_Engine_Loader.js
 * (online TikZJax engine), Tikz_Font_Store.js (fonts saved in the file).
 */

import { NotesState } from '../../00_State.js';
import { convertTikzSource } from './Tikz_Source_Converter.js';
import { compileTikzWithEngine, TIKZ_ENGINE_ID } from './Tikz_Engine_Loader.js';
import { storeTikzFontsForSvg, applyStoredTikzFonts } from './Tikz_Font_Store.js';

// Fonts saved in the file are available as soon as the module loads.
if (typeof document !== 'undefined') applyStoredTikzFonts();

/** Kept for callers that still announce the open note; macros are global-only now. */
export function setActiveTikzNoteContext(_note) {}

/** The vault-wide TikZ preamble (Macros → TikZ tab). */
export function getGlobalTikzPreamble() {
  return (NotesState.globalMacros && typeof NotesState.globalMacros.tikz === 'string')
    ? NotesState.globalMacros.tikz
    : '';
}

// FNV-1a 32-bit, hex
function tikzHashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** Identifies what a saved SVG was compiled from; a mismatch means the SVG is outdated. */
export function getTikzRenderKey(code) {
  return tikzHashString(`${TIKZ_ENGINE_ID}\n${getGlobalTikzPreamble()}\n${(code || '').trim()}`);
}

/**
 * Auto-heals missing backslashes for common TikZ commands while respecting path syntax.
 * 'node' only becomes '\node' when it starts a new statement (after ';', ']', '}' or at the start).
 */
export function healTikzCode(code) {
  if (!code) return '';
  return code
    .replace(/(^|\n)(\s*)draw(\[|\s)/g, '$1$2\\draw$3')
    .replace(/(^|\n)(\s*)path(\[|\s)/g, '$1$2\\path$3')
    .replace(/(^|\n)(\s*)fill(\[|\s)/g, '$1$2\\fill$3')
    .replace(/(^|\n)(\s*)clip(\[|\s)/g, '$1$2\\clip$3')
    .replace(/(^|\n)(\s*)node(\[|\s|\{)/g, (match, p1, p2, p3, offset, str) => {
      const before = str.slice(0, offset).replace(/%[^\n]*/g, '').trim();
      if (!before || /[;\]\}]\s*$/.test(before)) {
        return `${p1}${p2}\\node${p3}`;
      }
      return match;
    });
}

/** Converter output for a block (used for warnings such as unavailable packages). */
export function prepareTikzSource(code) {
  return convertTikzSource(code || '', getGlobalTikzPreamble());
}

/**
 * Compiles a block's code to SVG and stores the fonts it needs in the file.
 * @returns {Promise<{ svg: string, key: string, unavailable: string[] }>} — rejects with the TeX error
 */
export async function renderTikzToSvg(code) {
  const source = prepareTikzSource(code);
  if (!source.body) throw new Error('The TikZ block is empty.');
  const svg = await compileTikzWithEngine(source);
  await storeTikzFontsForSvg(svg);
  return { svg, key: getTikzRenderKey(code), unavailable: source.unavailable };
}

/** Puts a saved SVG into `target`, scaled to the container width with its natural aspect ratio. */
export function mountTikzSvg(target, svg) {
  if (!target) return;
  target.innerHTML = svg || '';
  const svgEl = target.querySelector('svg');
  if (!svgEl) return;
  const vb = (svgEl.getAttribute('viewBox') || '').trim().split(/\s+/).map(Number);
  svgEl.style.display = 'block';
  svgEl.style.margin = '0 auto';
  svgEl.style.overflow = 'visible';
  svgEl.style.height = 'auto';
  if (vb.length === 4 && vb[2] > 0 && vb[3] > 0) {
    svgEl.style.aspectRatio = `${vb[2]} / ${vb[3]}`;
    svgEl.style.width = '100%';
    svgEl.style.maxWidth = `${vb[2]}pt`;
  } else {
    svgEl.style.maxWidth = '100%';
  }
}
