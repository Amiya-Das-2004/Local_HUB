/**
 * 03_Notes/F_Share/01_Share_Payload.js
 * Builds the data embedded in a "Share note as HTML" file: ONLY the shared note, the global
 * macros, the TikZ fonts its saved SVGs use, and the bibliography entries it cites.
 * [[wiki-links]] to notes that are not included become plain text.
 */

import { NotesState } from '../00_State.js';
import { NoteMatchesWikiRef } from '../E_Note_Ops/02_Wiki_Link_Rewrite.js';
import { getTikzSvgFontFamilies } from '../Writing_Engine/Tikz_Engine/Tikz_Font_Store.js';
import { CollectBlockAssets } from '../Writing_Engine/Asset_Store.js';

// Visits every string of an object (skips ids, SVGs, data URLs); fn may return a replacement.
function walkShareStrings(obj, fn) {
  const walk = (o) => {
    Object.keys(o).forEach((k) => {
      const v = o[k];
      if (typeof v === 'string') {
        if (k === 'id' || k === 'svg' || k === 'svgKey' || v.startsWith('data:') || v.startsWith('asset:') || v.startsWith('<svg')) return;
        const next = fn(v, k);
        if (typeof next === 'string' && next !== v) o[k] = next;
      } else if (v && typeof v === 'object') {
        walk(v);
      }
    });
  };
  walk(obj);
}

/** Citation keys used by \cite{a,b} anywhere in the note. */
export function CollectCitedKeys(note) {
  const keys = new Set();
  walkShareStrings(JSON.parse(JSON.stringify(note)), (text) => {
    const re = /\\cite[tp]?\*?(?:\[[^\]]*\])?\{([^}]+)\}/g;
    let m;
    while ((m = re.exec(text)) !== null) m[1].split(',').map(k => k.trim().toLowerCase()).filter(Boolean).forEach(k => keys.add(k));
  });
  return keys;
}

/** Font families used by the note's saved TikZ SVGs. */
export function CollectNoteTikzFonts(note) {
  const fonts = new Set();
  (note.blocks || []).forEach(b => { if (b.type === 'tikz' && b.svg) getTikzSvgFontFamilies(b.svg).forEach(f => fonts.add(f)); });
  return fonts;
}

// [[Other note]] / [[Other note^ref]] → "Other note" (links inside the shared note stay links).
function flattenForeignWikiLinks(note) {
  walkShareStrings(note, (text) => {
    if (!text.includes('[[')) return text;
    return text.replace(/\[\[([^\]]+)\]\]/g, (match, inner) => {
      const caret = inner.indexOf('^');
      const name = (caret === -1 ? inner : inner.slice(0, caret)).trim();
      return NoteMatchesWikiRef(note, name) ? match : name;
    });
  });
}

/** @returns {Object} a complete vault payload containing only `noteId` */
export function BuildSharedNotePayload(noteId) {
  const src = (NotesState.notes || []).find(n => n.id === noteId);
  if (!src) throw new Error('Note not found.');
  const note = JSON.parse(JSON.stringify(src));
  flattenForeignWikiLinks(note);
  const cited = CollectCitedKeys(note);
  const fontsUsed = CollectNoteTikzFonts(note);
  const allFonts = NotesState.tikzFonts || {};
  const tikzFonts = {};
  fontsUsed.forEach(f => { if (allFonts[f]) tikzFonts[f] = allFonts[f]; });
  return {
    vaultMeta: {
      title: note.title || 'Shared note',
      version: (NotesState.vaultMeta && NotesState.vaultMeta.version) || '1.0.0',
      shared: { readOnly: true, noteId: note.id, sharedAt: Date.now() }
    },
    globalMacros: JSON.parse(JSON.stringify(NotesState.globalMacros || {})),
    tableTemplates: [],
    tikzTemplates: [],
    tikzFonts,
    bibliography: (NotesState.bibliography || []).filter(e => cited.has(String(e.key || '').trim().toLowerCase())).map(e => JSON.parse(JSON.stringify(e))),
    citationStyle: NotesState.citationStyle || 'numeric',
    folders: [note.folder || 'General'],
    tags: Array.isArray(note.tags) ? note.tags.slice() : [],
    notes: [note],
    assets: CollectBlockAssets(note.blocks) // only this note's images
  };
}
