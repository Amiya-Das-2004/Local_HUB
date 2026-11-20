/**
 * 03_Notes/F_Share/03_Share_Export.js
 * "Share note as HTML": downloads ONE standalone HTML with the app and only that note
 * (01_Share_Payload.js), opening read-only in study mode (02_Shared_View.js).
 * The user's own file, data file and unsaved state are not touched.
 */

import { BuildSharedNotePayload } from './01_Share_Payload.js';

function shareFileName(title) {
  const base = String(title || 'note').trim().replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_').slice(0, 60) || 'note';
  return `${base}.html`;
}

/** @returns {Promise<string>} the downloaded file name */
export async function ShareNoteAsHtml(noteId) {
  if (typeof window.SaveNotesStandalone !== 'function') throw new Error('Sharing is not available on this page.');
  const payload = BuildSharedNotePayload(noteId);
  const fileName = shareFileName(payload.notes[0].title);
  await window.SaveNotesStandalone({ payload, fileName, markSaved: false });
  return fileName;
}
