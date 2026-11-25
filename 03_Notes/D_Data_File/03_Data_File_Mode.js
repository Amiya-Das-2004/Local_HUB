/**
 * 03_Notes/D_Data_File/03_Data_File_Mode.js
 * Data-file mode (Chrome / Edge / Brave with the File System Access API):
 * the HTML is only the app, the notes live in ONE JSON file the user picked.
 *
 *   status  'unsupported'      browser has no File System Access API → embedded mode only
 *           'embedded'         notes live inside this HTML (today's behaviour; Save downloads the HTML)
 *           'needs-permission' a data file is remembered but the browser wants one click to reopen it
 *           'connected'        notes were loaded from the data file; Save overwrites it in place
 *
 * Save in data-file mode: previous file contents → rolling backup (IndexedDB, plus
 * "<name>.backup.json" in a chosen backup folder when one is set) → write the new JSON
 * (Chrome writes to a temp file and swaps on close, so a crash never leaves half a file).
 * Only active on the Notes page (window.__LOCALHUB_PAGE__ === 'notes').
 */

import { ApplyNotesPayload, HasUnsavedNotesChanges } from '../00_State.js';
import { BuildNotesPayload, SerializeNotesPayload, ParseNotesDataText } from './01_Data_Payload.js';
import { RememberHandle, RecallHandle, ForgetHandle, AddDataFileBackup } from './02_Handle_Store.js';
import { applyStoredTikzFonts } from '../Writing_Engine/Tikz_Engine/Tikz_Font_Store.js';
import { bumpKatexMacroVersion } from '../Writing_Engine/Math_Renderer.js';

const DATA_FILE_PICKER_TYPES = [{ description: 'Tixidian notes (JSON)', accept: { 'application/json': ['.json'] } }];

const dataFileState = {
  status: 'embedded',
  handle: null,
  name: '',
  lastModified: 0,   // of the file as we last read / wrote it (detects edits from elsewhere)
  backupDir: null,
  lastError: ''
};
const dataFileListeners = new Set();
let dataFileInitStarted = false;

export function IsDataFileSupported() {
  return typeof window !== 'undefined'
    && typeof window.showOpenFilePicker === 'function'
    && typeof window.showSaveFilePicker === 'function';
}

export function GetDataFileState() {
  return { ...dataFileState, supported: IsDataFileSupported() };
}

export function OnDataFileStateChange(fn) {
  dataFileListeners.add(fn);
  return () => dataFileListeners.delete(fn);
}

function setDataFileState(patch) {
  Object.assign(dataFileState, patch);
  const snapshot = GetDataFileState();
  dataFileListeners.forEach(fn => { try { fn(snapshot); } catch (e) { console.warn(e); } });
}

function hasUnsavedNotes() {
  return (typeof HasUnsavedNotesChanges === 'function' && HasUnsavedNotesChanges()) || Boolean(window.__NOTES_UNSAVED__);
}

// Re-renders the current route with the newly loaded vault.
function rerenderAfterLoad() {
  applyStoredTikzFonts();
  if (typeof bumpKatexMacroVersion === 'function') bumpKatexMacroVersion();
  if (typeof window.MarkUnsavedChanges === 'function') window.MarkUnsavedChanges(false, 0);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

async function ensureDataFilePermission(handle, { request = true } = {}) {
  if (!handle || typeof handle.queryPermission !== 'function') return true;
  const opts = { mode: 'readwrite' };
  if (await handle.queryPermission(opts) === 'granted') return true;
  if (!request) return false;
  return (await handle.requestPermission(opts)) === 'granted';
}

/** Reads + applies a data file. Throws with a readable message. */
async function loadDataFileFromHandle(handle) {
  const file = await handle.getFile();
  const text = await file.text();
  const parsed = ParseNotesDataText(text);
  if (!parsed.ok) throw new Error(`${handle.name}: ${parsed.error}`);
  if (!ApplyNotesPayload(parsed.payload)) throw new Error(`${handle.name} could not be loaded.`);
  setDataFileState({ status: 'connected', handle, name: handle.name, lastModified: file.lastModified, lastError: '' });
  await RememberHandle('dataFile', handle);
  rerenderAfterLoad();
}

/**
 * Called on every Notes-page boot (idempotent). Restores the remembered data file:
 * permission still granted → loads silently; otherwise status 'needs-permission'
 * (the UI asks for the one click that reconnects).
 */
export async function InitDataFileMode() {
  if (dataFileInitStarted) return GetDataFileState();
  dataFileInitStarted = true;
  if (typeof window === 'undefined' || window.__LOCALHUB_PAGE__ !== 'notes') return GetDataFileState();
  if (!IsDataFileSupported()) {
    setDataFileState({ status: 'unsupported' });
    return GetDataFileState();
  }
  const [handle, backupDir] = await Promise.all([RecallHandle('dataFile'), RecallHandle('backupFolder')]);
  setDataFileState({ backupDir: backupDir || null });
  // An "Export everything" HTML is a snapshot: show it as exported, never swap in the live file.
  const meta = (window.NotesState && window.NotesState.vaultMeta) || {};
  if (meta.exportedAt && Array.isArray(window.NotesState.notes) && window.NotesState.notes.length) {
    setDataFileState({ status: 'embedded' });
    return GetDataFileState();
  }
  if (!handle) {
    setDataFileState({ status: 'embedded' });
    return GetDataFileState();
  }
  setDataFileState({ handle, name: handle.name });
  try {
    if (await ensureDataFilePermission(handle, { request: false })) {
      await loadDataFileFromHandle(handle);
    } else {
      setDataFileState({ status: 'needs-permission' });
    }
  } catch (e) {
    setDataFileState({ status: 'needs-permission', lastError: e.message || String(e) });
  }
  return GetDataFileState();
}

/** One click: re-grant access to the remembered file and load it. Must run from a user gesture. */
export async function ReconnectDataFile() {
  const handle = dataFileState.handle || await RecallHandle('dataFile');
  if (!handle) throw new Error('No data file is remembered in this browser.');
  if (!(await ensureDataFilePermission(handle))) throw new Error(`Access to ${handle.name} was not allowed.`);
  await loadDataFileFromHandle(handle);
}

/** Picks an existing data file and loads it. Must run from a user gesture. */
export async function OpenDataFile() {
  const [handle] = await window.showOpenFilePicker({ types: DATA_FILE_PICKER_TYPES, multiple: false });
  if (hasUnsavedNotes() && !window.confirm(`Open ${handle.name}? Your unsaved changes in the notes shown now will be discarded.`)) return false;
  if (!(await ensureDataFilePermission(handle))) throw new Error(`Access to ${handle.name} was not allowed.`);
  await loadDataFileFromHandle(handle);
  return true;
}

/**
 * Creates a new data file. withCurrentNotes=true writes the notes shown now (also used to
 * move embedded notes out of the HTML); false starts an empty vault.
 */
export async function CreateDataFile({ withCurrentNotes = true, suggestedName = 'MyNotes.json' } = {}) {
  const handle = await window.showSaveFilePicker({ suggestedName, types: DATA_FILE_PICKER_TYPES });
  let payload;
  if (withCurrentNotes) {
    payload = BuildNotesPayload();
  } else {
    if (hasUnsavedNotes() && !window.confirm('Start an empty notes file? Unsaved changes in the notes shown now will be discarded.')) return false;
    payload = { ...BuildNotesPayload(), notes: [], folders: [], tags: [], bibliography: [] };
  }
  const writable = await handle.createWritable();
  await writable.write(SerializeNotesPayload(payload));
  await writable.close();
  await loadDataFileFromHandle(handle);
  return true;
}

/** Optional: a folder where "<name>.backup.json" is written before every save. */
export async function ChooseBackupFolder() {
  if (typeof window.showDirectoryPicker !== 'function') throw new Error('This browser cannot pick folders.');
  const dir = await window.showDirectoryPicker({ mode: 'readwrite' });
  await RememberHandle('backupFolder', dir);
  setDataFileState({ backupDir: dir });
}

async function writeBackupOfCurrentFile(handle) {
  let previous = '';
  try { previous = await (await handle.getFile()).text(); } catch (_) { return; }
  if (!previous) return;
  try { await AddDataFileBackup(handle.name, previous); } catch (e) { console.warn('Backup to IndexedDB failed:', e); }
  const dir = dataFileState.backupDir;
  if (dir) {
    try {
      if (await ensureDataFilePermission(dir)) {
        const backupName = handle.name.replace(/\.json$/i, '') + '.backup.json';
        const bh = await dir.getFileHandle(backupName, { create: true });
        const w = await bh.createWritable();
        await w.write(previous);
        await w.close();
      }
    } catch (e) { console.warn('Backup to folder failed:', e); }
  }
}

/** Overwrites the data file in place. Returns true when written. */
export async function SaveToDataFile() {
  const handle = dataFileState.handle;
  if (dataFileState.status !== 'connected' || !handle) throw new Error('No data file is open.');
  if (!(await ensureDataFilePermission(handle))) throw new Error(`Access to ${handle.name} was not allowed — nothing was saved.`);

  const current = await handle.getFile();
  if (dataFileState.lastModified && current.lastModified > dataFileState.lastModified + 1000) {
    const ok = window.confirm(`${handle.name} was changed outside this tab since it was opened (another tab, app or sync). Overwrite it with the notes shown here? A backup of the other version is kept.`);
    if (!ok) return false;
  }

  await writeBackupOfCurrentFile(handle);
  const writable = await handle.createWritable();
  await writable.write(SerializeNotesPayload(BuildNotesPayload()));
  await writable.close();
  const written = await handle.getFile();
  setDataFileState({ lastModified: written.lastModified, lastError: '' });

  if (typeof window.ClearNotesLocalCache === 'function') window.ClearNotesLocalCache();
  window.__NOTES_UNSAVED__ = false;
  window.__HAS_UNSAVED_CHANGES__ = false;
  window.__NOTES_UNSAVED_COUNT__ = 0;
  if (typeof window.MarkUnsavedChanges === 'function') window.MarkUnsavedChanges(false, 0);
  return true;
}

/** Stops using the data file in this browser (notes stay on screen; Save downloads the HTML again). */
export async function DisconnectDataFile() {
  await ForgetHandle('dataFile');
  setDataFileState({ status: IsDataFileSupported() ? 'embedded' : 'unsupported', handle: null, name: '', lastModified: 0 });
}

/**
 * Save entry point for the Save button and Ctrl+S.
 * @returns {Promise<'data-file'|'needs-reconnect'|'embedded'|'cancelled'>}
 *   'embedded' → the caller downloads the full HTML as before (fallback mode).
 */
export async function SaveNotesSmart() {
  if (dataFileState.status === 'connected') {
    return (await SaveToDataFile()) ? 'data-file' : 'cancelled';
  }
  if (dataFileState.status === 'needs-permission') {
    // Never write the notes shown now over the remembered file: they are not its contents.
    return 'needs-reconnect';
  }
  return 'embedded';
}

if (typeof window !== 'undefined') {
  window.InitDataFileMode = InitDataFileMode;
  window.SaveNotesSmart = SaveNotesSmart;
  window.GetDataFileState = GetDataFileState;
}
