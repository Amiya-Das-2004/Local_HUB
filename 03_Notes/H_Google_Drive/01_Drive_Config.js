/**
 * 03_Notes/H_Google_Drive/01_Drive_Config.js
 * Settings for the Google Drive data file:
 *   - the Google OAuth client ID (the user creates it once; see Google_Drive_Setup.md). Kept in
 *     this browser (localStorage, per address) and, if present, read from the HTML's
 *     vaultMeta.googleClientId so one TeXidian.html works on every computer;
 *   - whether this page can sign in to Google at all (only from http://localhost:<port> or https,
 *     never from a file opened from disk);
 *   - the "Host locally" commands shown on a file:// page (OS detected, folder taken from the
 *     page's own path), to paste into a terminal.
 */

import { NotesState } from '../00_State.js';

const DRIVE_CLIENT_ID_KEY = 'tixidian-google-client-id';
export const DRIVE_LOCAL_PORT = 8000;
export const DRIVE_LOCAL_SPARE_PORTS = [8001, 8080];

/** True when Google sign-in can work on this page (http/https, not file://). */
export function IsDriveCapableOrigin() {
  return typeof location !== 'undefined' && (location.protocol === 'http:' || location.protocol === 'https:');
}

export function GetDriveClientId() {
  let id = '';
  try { id = localStorage.getItem(DRIVE_CLIENT_ID_KEY) || ''; } catch (_) { id = ''; }
  if (!id && NotesState.vaultMeta && typeof NotesState.vaultMeta.googleClientId === 'string') id = NotesState.vaultMeta.googleClientId;
  return id.trim();
}

/** Stores the client ID (returns false when it does not look like one). */
export function SetDriveClientId(id) {
  const clean = String(id || '').trim();
  if (clean && !/^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$/i.test(clean)) return false;
  try {
    if (clean) localStorage.setItem(DRIVE_CLIENT_ID_KEY, clean);
    else localStorage.removeItem(DRIVE_CLIENT_ID_KEY);
  } catch (_) { return false; }
  // Also keep it in the vault meta, so a later HTML save carries it to other computers.
  if (NotesState.vaultMeta && typeof NotesState.vaultMeta === 'object') NotesState.vaultMeta.googleClientId = clean;
  return true;
}

// Google's Drive picker (06_Drive_Picker.js) needs, besides the client ID, an API key and the
// Cloud project number (so a picked file/folder is shared with TeXidian under drive.file).
const DRIVE_PICKER_KEY = 'tixidian-google-picker';

/** { apiKey, projectNumber } — empty strings when not set. */
export function GetDrivePickerConfig() {
  let cfg = null;
  try { cfg = JSON.parse(localStorage.getItem(DRIVE_PICKER_KEY) || 'null'); } catch (_) { cfg = null; }
  const meta = (NotesState.vaultMeta && NotesState.vaultMeta.googlePicker) || {};
  return {
    apiKey: String((cfg && cfg.apiKey) || meta.apiKey || '').trim(),
    projectNumber: String((cfg && cfg.projectNumber) || meta.projectNumber || '').trim()
  };
}

export function HasDrivePickerConfig() {
  const c = GetDrivePickerConfig();
  return Boolean(c.apiKey && c.projectNumber);
}

/** Stores the picker settings; returns an error message, or '' when saved. */
export function SetDrivePickerConfig(apiKey, projectNumber) {
  const key = String(apiKey || '').trim();
  const num = String(projectNumber || '').trim();
  if (key && !/^AIza[0-9A-Za-z_-]{30,}$/.test(key)) return 'That does not look like an API key (it starts with "AIza").';
  if (num && !/^[0-9]{6,15}$/.test(num)) return 'The project number is digits only (Cloud console → project settings / dashboard).';
  try {
    if (key || num) localStorage.setItem(DRIVE_PICKER_KEY, JSON.stringify({ apiKey: key, projectNumber: num }));
    else localStorage.removeItem(DRIVE_PICKER_KEY);
  } catch (_) { return 'This browser blocks saving settings.'; }
  if (NotesState.vaultMeta && typeof NotesState.vaultMeta === 'object') NotesState.vaultMeta.googlePicker = { apiKey: key, projectNumber: num };
  return '';
}

function detectOs() {
  const p = ((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent || '').toLowerCase();
  if (p.includes('win')) return 'windows';
  if (p.includes('mac')) return 'mac';
  return 'linux';
}

/** This page's folder and file name, from its own file:// path. */
function pageFileLocation() {
  const path = decodeURIComponent((typeof location !== 'undefined' && location.pathname) || '');
  const slash = path.lastIndexOf('/');
  let dir = path.slice(0, slash);
  const file = path.slice(slash + 1) || 'TeXidian.html';
  if (/^\/[A-Za-z]:/.test(dir)) dir = dir.slice(1).replace(/\//g, '\\'); // /C:/Users → C:\Users
  return { dir, file };
}

/**
 * Commands to serve this file at http://localhost:<port>/<file>.
 * @returns {{ os, dir, file, url, command, plainCommand, spare: [{ port, url, command }] }}
 */
export function GetHostLocallyCommands(port = DRIVE_LOCAL_PORT) {
  const os = detectOs();
  const { dir, file } = pageFileLocation();
  const build = (p) => {
    const plain = os === 'windows' ? `py -m http.server ${p}` : `python3 -m http.server ${p}`;
    const command = !dir ? plain
      : (os === 'windows' ? `cd /d "${dir}" && ${plain}` : `cd "${dir.replace(/"/g, '\\"')}" && ${plain}`);
    return { port: p, url: `http://localhost:${p}/${encodeURI(file)}`, command, plainCommand: plain };
  };
  const main = build(port);
  return { os, dir, file, ...main, spare: DRIVE_LOCAL_SPARE_PORTS.map(build) };
}
