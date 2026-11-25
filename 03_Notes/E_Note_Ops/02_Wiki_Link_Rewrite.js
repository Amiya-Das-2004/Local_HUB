/**
 * 03_Notes/E_Note_Ops/02_Wiki_Link_Rewrite.js
 * Keeps [[wiki-links]] pointing at the right place when blocks or whole notes move.
 *
 *   [[Note]]          whole-note link   → retargeted only when the whole note moved/merged away
 *   [[Note^blockId]]  block link        → retargeted when that block moved
 *   [[Note^3]]        1-based index     → converted to the block's id FIRST (using the positions
 *                                          before the change), then handled like a block link,
 *                                          so links to blocks that stay behind survive shifting too
 */

import { NotesState } from '../00_State.js';

export function NoteMatchesWikiRef(note, ref) {
  if (!note || !ref) return false;
  const r = String(ref).trim().toLowerCase();
  return (note.title && note.title.trim().toLowerCase() === r)
    || note.id === ref.trim()
    || (note.slug && note.slug.toLowerCase() === r);
}

// Applies fn to every string in obj (skips ids, saved SVGs and data URLs).
function mapNoteStrings(obj, fn) {
  let changed = 0;
  const walk = (o) => {
    Object.keys(o).forEach((k) => {
      const v = o[k];
      if (typeof v === 'string') {
        if (k === 'id' || k === 'svg' || k === 'svgKey' || v.startsWith('data:') || v.startsWith('<svg') || !v.includes('[[')) return;
        const next = fn(v);
        if (next !== v) { o[k] = next; changed += 1; }
      } else if (v && typeof v === 'object') {
        walk(v);
      }
    });
  };
  walk(obj);
  return changed;
}

/**
 * Rewrites links across the whole vault. Call BEFORE removing blocks from `fromNote`
 * (index links are resolved against its current block order).
 * @param {Object} fromNote
 * @param {Object} toNote
 * @param {{ blockIds?: Set<string>|null, wholeNote?: boolean, idMap?: Map<string,string> }} opts
 *   blockIds  ids of blocks moving to toNote (null = none)
 *   wholeNote also retarget plain [[fromNote]] links (note merged + deleted)
 *   idMap     old → new id when moved blocks got new ids
 * @returns {number} number of text fields changed
 */
export function RewriteWikiLinks(fromNote, toNote, { blockIds = null, wholeNote = false, idMap = null } = {}) {
  if (!fromNote || !toNote) return 0;
  const fromBlocks = (fromNote.blocks || []).slice();
  const toTitle = toNote.title || toNote.id;
  const fromTitle = fromNote.title || fromNote.id;
  let changed = 0;
  (NotesState.notes || []).forEach(note => {
    changed += mapNoteStrings(note, (text) => text.replace(/\[\[([^\]]+)\]\]/g, (match, inner) => {
      const caret = inner.indexOf('^');
      const name = (caret === -1 ? inner : inner.slice(0, caret)).trim();
      let ref = caret === -1 ? '' : inner.slice(caret + 1).trim();
      if (!NoteMatchesWikiRef(fromNote, name)) return match;
      if (!ref) return wholeNote ? `[[${toTitle}]]` : match;
      if (/^\d+$/.test(ref)) {
        const blk = fromBlocks[parseInt(ref, 10) - 1];
        if (blk && blk.id) ref = blk.id;
      }
      const moved = wholeNote || (blockIds && blockIds.has(ref));
      if (moved) {
        const newRef = (idMap && idMap.get(ref)) || ref;
        return `[[${toTitle}^${newRef}]]`;
      }
      return `[[${fromTitle}^${ref}]]`;
    }));
  });
  return changed;
}
