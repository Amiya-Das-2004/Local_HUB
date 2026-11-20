/**
 * 03_Notes/D_Data_File/01_Data_Payload.js
 * The ONE data format shared by both storage modes:
 *   - embedded mode: the JSON inside <script id="NotesData"> of the HTML
 *   - data-file mode: the external JSON file the user picked (e.g. MyNotes.json)
 * Both hold the same object: { vaultMeta, globalMacros, tableTemplates, tikzTemplates,
 * tikzFonts, bibliography, citationStyle, folders, tags, notes } (notes carry their
 * blocks, saved TikZ SVGs and images).
 */

import { NotesState, flushNotesSave } from '../00_State.js';

export const NOTES_DATA_FORMAT = 'tixidian-notes';
export const NOTES_DATA_FORMAT_VERSION = 1;

/** Deep copy of the live vault, stamped with format + save time. */
export function BuildNotesPayload() {
  if (typeof flushNotesSave === 'function') flushNotesSave();
  const payload = JSON.parse(JSON.stringify(NotesState));
  delete payload._unsaved;
  delete payload._savedAt;
  payload.vaultMeta = {
    ...(payload.vaultMeta || {}),
    format: NOTES_DATA_FORMAT,
    formatVersion: NOTES_DATA_FORMAT_VERSION,
    lastSaved: Date.now()
  };
  delete payload.vaultMeta.appOnly;
  return payload;
}

/** Text written to the data file. */
export function SerializeNotesPayload(payload) {
  return JSON.stringify(payload, null, 1);
}

/**
 * Parses data-file text.
 * @returns {{ ok: true, payload: Object } | { ok: false, error: string }}
 */
export function ParseNotesDataText(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: 'This file is not valid JSON.' };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !Array.isArray(parsed.notes)) {
    return { ok: false, error: 'This JSON file is not a Tixidian notes file (no "notes" list).' };
  }
  return { ok: true, payload: parsed };
}

/** True when this HTML was saved as "app only" (its notes live in a data file). */
export function IsAppOnlyHtml() {
  return Boolean(NotesState.vaultMeta && NotesState.vaultMeta.appOnly === true);
}

/** True when the HTML currently carries notes of its own. */
export function HasEmbeddedNotes() {
  return !IsAppOnlyHtml() && Array.isArray(NotesState.notes) && NotesState.notes.length > 0;
}
