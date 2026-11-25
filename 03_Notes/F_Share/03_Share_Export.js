/**
 * 03_Notes/F_Share/03_Share_Export.js
 * "Share note as HTML": downloads ONE standalone HTML with the app and only that note
 * (01_Share_Payload.js), opening read-only in study mode (02_Shared_View.js).
 * "Export everything as one HTML": the full standalone with ALL notes embedded (backup, or to
 * use another browser). Marked vaultMeta.exportedAt so opening it never auto-attaches to the
 * data file (03_Data_File_Mode.js) — it shows the snapshot as exported.
 * The user's own file, data file and unsaved state are not touched by either.
 */

import { BuildSharedNotePayload } from './01_Share_Payload.js';
import { BuildNotesPayload } from '../D_Data_File/01_Data_Payload.js';

function shareFileName(title) {
  const base = String(title || 'note').trim().replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_').slice(0, 60) || 'note';
  return `${base}.html`;
}

/** @returns {Promise<string>} the downloaded file name */
export async function ExportEverythingAsHtml() {
  if (typeof window.SaveNotesStandalone !== 'function') throw new Error('Exporting is not available on this page.');
  const payload = BuildNotesPayload();
  payload.vaultMeta = { ...payload.vaultMeta, exportedAt: Date.now() };
  delete payload.vaultMeta.shared;
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const fileName = `TeXidian_export_${stamp}.html`;
  await window.SaveNotesStandalone({ payload, fileName, markSaved: false });
  return fileName;
}

/** @returns {Promise<string>} the downloaded file name */
export async function ShareNoteAsHtml(noteId) {
  if (typeof window.SaveNotesStandalone !== 'function') throw new Error('Sharing is not available on this page.');
  const payload = BuildSharedNotePayload(noteId);
  const fileName = shareFileName(payload.notes[0].title);
  await window.SaveNotesStandalone({ payload, fileName, markSaved: false });
  return fileName;
}
