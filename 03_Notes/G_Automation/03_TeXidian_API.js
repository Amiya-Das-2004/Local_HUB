/**
 * 03_Notes/G_Automation/03_TeXidian_API.js
 * window.TeXidianAPI — a small, stable automation API for scripts and assistants
 * (e.g. the `texidian-notes` Claude skill driving the page through Claude in Chrome).
 * Everything goes through the app's own code paths: block templates (Block_Engine.js),
 * the asset store for images, SaveNotesState (unsaved count, recovery) and a normal re-render.
 *
 * Stable globals that automation also relies on (do not rename): window.NotesState,
 * window.SaveNotesState, window.initNotesApp, window.GetNotesUnsavedChangesCount.
 * Reference for skill authors: 03_Notes/G_Automation/TeXidian_API.md
 */

import { NotesState } from '../00_State.js';
import { BLOCK_DEFINITIONS, createNewBlock, createBlockWithMembers } from '../Writing_Engine/Block_Engine.js';
import { GetImageInboxState, ListImageInbox, ReadImageInboxFile } from './01_Image_Inbox.js';
import { ResolveApiNote, InsertApiBlocks, AddImageBlock, RerenderNotesApp } from './02_Image_Insert.js';

export const TEXIDIAN_API_VERSION = 1;

/** { id, title, folder, blocks } summaries of every note (cheap to read). */
function listApiNotes() {
  return (NotesState.notes || []).map(n => ({ id: n.id, title: n.title, folder: n.folder, blocks: (n.blocks || []).length }));
}

/** Image from the system clipboard (the user copied an image; the browser may ask once). */
async function readClipboardImage() {
  if (!navigator.clipboard || typeof navigator.clipboard.read !== 'function') throw new Error('This browser cannot read images from the clipboard.');
  const items = await navigator.clipboard.read();
  for (const item of items) {
    const type = item.types.find(t => t.startsWith('image/'));
    if (type) return item.getType(type);
  }
  throw new Error('The clipboard holds no image. Copy an image first.');
}

export const TeXidianAPI = Object.freeze({
  version: TEXIDIAN_API_VERSION,

  // ---- notes
  listNotes: listApiNotes,
  getNote: (noteRef) => ResolveApiNote(noteRef),

  // ---- blocks
  blockTypes: () => BLOCK_DEFINITIONS.map(d => d.type),
  /** One new block of `type` with defaults (+ options such as { content }, { tex }, { level: 2 }). */
  createNewBlock: (type, options = {}) => createNewBlock(type, options),
  /** [block, ...members] — use for 'columns' (container + its two starter text blocks). */
  createBlockWithMembers: (type, options = {}) => createBlockWithMembers(type, options),
  /** Inserts a block or [container, ...members]; at: index | 'start' | 'end' | { after|before: blockId }. */
  insertBlock: (noteRef, blockOrBlocks, at = 'end', { render = true } = {}) => InsertApiBlocks(noteRef, blockOrBlocks, { at, render }),
  /** Creates and inserts in one step: addBlock('My note', 'heading', { title: 'Intro', level: 2 }). */
  addBlock: (noteRef, type, options = {}, at = 'end') => InsertApiBlocks(noteRef, createBlockWithMembers(type, options), { at }),
  rerender: RerenderNotesApp,

  // ---- images (no image data passes through the caller)
  imageInboxStatus: GetImageInboxState,
  listInboxImages: ListImageInbox,
  /** addImageFromInbox('My note', 'plot.png', { caption, width, tag, at }) */
  addImageFromInbox: async (noteRef, fileName, opts = {}) => AddImageBlock(noteRef, await ReadImageInboxFile(fileName), opts),
  /** addImageFromClipboard('My note', { caption, width, tag, at }) */
  addImageFromClipboard: async (noteRef, opts = {}) => AddImageBlock(noteRef, await readClipboardImage(), opts),
  /** For small images or SVG already in the page: addImageFromDataUrl(note, 'data:image/png;base64,…', opts) */
  addImageFromDataUrl: (noteRef, dataUrl, opts = {}) => AddImageBlock(noteRef, dataUrl, opts)
});

if (typeof window !== 'undefined') window.TeXidianAPI = TeXidianAPI;
