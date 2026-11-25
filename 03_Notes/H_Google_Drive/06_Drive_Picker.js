/**
 * 03_Notes/H_Google_Drive/06_Drive_Picker.js
 * Google's own Drive picker ("Open file" window with all your folders, loaded on demand from
 * apis.google.com). Picking a file or folder there shares just that item with TeXidian
 * (drive.file scope), so notes files you put into any folder yourself can be opened, and a new
 * notes file can be created in the folder you choose. Needs the API key + Cloud project number
 * (01_Drive_Config.js) besides the client ID.
 */

import { GetDrivePickerConfig, HasDrivePickerConfig } from './01_Drive_Config.js';
import { GetDriveToken } from './02_Drive_Auth.js';

const DRIVE_GAPI_SRC = 'https://apis.google.com/js/api.js';
const DRIVE_FOLDER_MIME = 'application/vnd.google-apps.folder';
// .json files uploaded to Drive usually get application/json; some get text/plain or octet-stream.
const DRIVE_JSON_MIMES = 'application/json,text/plain,application/octet-stream';

let drivePickerPromise = null;

/** Loads apis.google.com/js/api.js and its 'picker' module once. */
export function LoadDrivePicker() {
  if (typeof window !== 'undefined' && window.google && window.google.picker) return Promise.resolve();
  if (drivePickerPromise) return drivePickerPromise;
  drivePickerPromise = new Promise((resolve, reject) => {
    const fail = () => { drivePickerPromise = null; reject(new Error('Could not load the Google Drive picker (are you online?).')); };
    const loadPicker = () => window.gapi.load('picker', { callback: resolve, onerror: fail });
    if (window.gapi && typeof window.gapi.load === 'function') { loadPicker(); return; }
    const s = document.createElement('script');
    s.src = DRIVE_GAPI_SRC;
    s.async = true;
    s.id = 'tixidian-google-gapi';
    s.onload = loadPicker;
    s.onerror = () => { s.remove(); fail(); };
    document.head.appendChild(s);
  });
  return drivePickerPromise;
}

/**
 * Opens the picker. mode 'file' → a notes JSON; mode 'folder' → a folder.
 * Run from a click (it may first open the Google sign-in window).
 * @returns {Promise<{ id: string, name: string } | null>} null when cancelled
 */
export async function PickFromDrive(mode = 'file') {
  if (!HasDrivePickerConfig()) throw new Error('Browsing Google Drive needs the API key and project number (storage menu → "Google Drive setup…").');
  const token = await GetDriveToken({ interactive: true });
  await LoadDrivePicker();
  const { apiKey, projectNumber } = GetDrivePickerConfig();
  const P = window.google.picker;
  let view;
  if (mode === 'folder') {
    view = new P.DocsView(P.ViewId.FOLDERS).setIncludeFolders(true).setSelectFolderEnabled(true).setMimeTypes(DRIVE_FOLDER_MIME);
  } else {
    view = new P.DocsView(P.ViewId.DOCS).setIncludeFolders(true).setMimeTypes(DRIVE_JSON_MIMES);
  }
  return new Promise((resolve) => {
    const picker = new P.PickerBuilder()
      .addView(view)
      .setOAuthToken(token)
      .setDeveloperKey(apiKey)
      .setAppId(projectNumber)
      .setOrigin(`${location.protocol}//${location.host}`)
      .setTitle(mode === 'folder' ? 'Choose the folder for your notes file' : 'Choose your TeXidian notes file (.json)')
      .setCallback((data) => {
        const action = data[P.Response.ACTION];
        if (action === P.Action.PICKED) {
          const doc = (data[P.Response.DOCUMENTS] || [])[0] || {};
          resolve({ id: doc[P.Document.ID], name: doc[P.Document.NAME] });
        } else if (action === P.Action.CANCEL) {
          resolve(null);
        }
      })
      .build();
    picker.setVisible(true);
  });
}
