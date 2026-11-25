/**
 * 03_Notes/G_Automation/02_Image_Insert.js
 * Adds an image block to a note from a File/Blob or data URL, exactly like the image block's
 * Upload button: processAndCompressImage (resize, WebP) → PutAsset (stored once, block keeps
 * `asset:<hash>`) → a normal image block inserted into the note.
 * Also: note lookup by id or title, and block insertion with save + re-render, shared by the
 * automation API (03_TeXidian_API.js).
 */

import { NotesState, SaveNotesState } from '../00_State.js';
import { createNewBlock, insertBlocksAt } from '../Writing_Engine/Block_Engine.js';
import { PutAsset } from '../Writing_Engine/Asset_Store.js';
import { processAndCompressImage } from '../B_Editor_View/01_Blocks/Image_Block.js';

/** Note by id, else by exact title, else by case-insensitive title. Throws when missing. */
export function ResolveApiNote(noteRef) {
  if (noteRef && typeof noteRef === 'object' && Array.isArray(noteRef.blocks)) return noteRef;
  const notes = NotesState.notes || [];
  const ref = String(noteRef === undefined || noteRef === null ? '' : noteRef).trim();
  const note = notes.find(n => n.id === ref) || notes.find(n => n.title === ref) ||
    notes.find(n => String(n.title || '').trim().toLowerCase() === ref.toLowerCase());
  if (!note) throw new Error(`No note with id or title "${ref}".`);
  return note;
}

/**
 * Block position from `at`: a number (index), 'start', 'end' (default), or
 * { after: blockId } / { before: blockId }.
 */
export function ResolveApiIndex(note, at) {
  const blocks = note.blocks || [];
  if (at === undefined || at === null || at === 'end') return blocks.length;
  if (at === 'start') return 0;
  if (typeof at === 'number' && Number.isFinite(at)) return Math.max(0, Math.min(blocks.length, Math.floor(at)));
  if (at && typeof at === 'object') {
    const id = at.after || at.before;
    const i = blocks.findIndex(b => b && b.id === id);
    if (i === -1) throw new Error(`No block "${id}" in note "${note.title}".`);
    return at.after ? i + 1 : i;
  }
  throw new Error('`at` must be a number, "start", "end", { after: blockId } or { before: blockId }.');
}

/**
 * Re-renders the current route through the page router, like the app does after loading a
 * data file. Calling initNotesApp() alone would skip the page's own setup (Save button
 * binding, storage chip); the router runs both.
 */
export function RerenderNotesApp() {
  if (typeof window === 'undefined') return;
  // Every page that hosts Notes (source page, standalone TeXidian.html, hub Index.html)
  // routes on hashchange; dispatchEvent runs the router synchronously.
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

/**
 * Inserts one block or a list (container + members) into a note, saves, re-renders.
 * @returns {{ noteId: string, index: number, ids: string[] }}
 */
export function InsertApiBlocks(noteRef, blockOrBlocks, { at = 'end', render = true } = {}) {
  const note = ResolveApiNote(noteRef);
  if (!Array.isArray(note.blocks)) note.blocks = [];
  const list = (Array.isArray(blockOrBlocks) ? blockOrBlocks : [blockOrBlocks]).filter(b => b && typeof b === 'object');
  if (!list.length) throw new Error('Nothing to insert.');
  list.forEach((b) => { if (!b.id) b.id = createNewBlock(b.type || 'text').id; });
  const index = insertBlocksAt(note.blocks, list, ResolveApiIndex(note, at));
  SaveNotesState(null, { immediate: true });
  if (render) RerenderNotesApp();
  return { noteId: note.id, index, ids: list.map(b => b.id) };
}

/**
 * Adds an image block. `source`: File, Blob or data URL (also raw SVG markup).
 * opts: { caption, width (10–100 %), tag, at, render }
 * @returns {{ noteId, index, ids, blockId, asset, bytes }}
 */
export async function AddImageBlock(noteRef, source, opts = {}) {
  const note = ResolveApiNote(noteRef);
  const processed = await processAndCompressImage(source);
  if (!processed || !String(processed).startsWith('data:image/')) throw new Error('That is not an image this app can read.');
  const ref = PutAsset(processed);
  const width = Number(opts.width);
  const block = createNewBlock('image', {
    url: ref,
    caption: opts.caption || '',
    width: Number.isFinite(width) && width > 0 ? Math.max(10, Math.min(100, Math.round(width))) : 100
  });
  block.content = ref; // the image block keeps url and content in step
  if (opts.tag) block.tag = String(opts.tag);
  const result = InsertApiBlocks(note, block, { at: opts.at, render: opts.render !== false });
  return { ...result, blockId: block.id, asset: ref, bytes: processed.length };
}
