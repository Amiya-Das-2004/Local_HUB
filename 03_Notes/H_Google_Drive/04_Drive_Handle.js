/**
 * 03_Notes/H_Google_Drive/04_Drive_Handle.js
 * A Google Drive JSON file dressed as a FileSystemFileHandle, so the data-file mode
 * (D_Data_File/03_Data_File_Mode.js) opens, saves, backs up and reconnects it with its usual code:
 *   name · getFile() → { lastModified, text() } · createWritable() → { write, close }
 *   queryPermission() ('granted' while a token is cached) · requestPermission() (Google popup)
 *   remember() / forget() — which Drive file this browser uses (localStorage, per address).
 * Registered as a data-file source: on the next page load the remembered Drive file comes back
 * (silently while the tab still has a token, else as "Reconnect <name>" — one click).
 */

import { RegisterDataFileSource } from '../D_Data_File/03_Data_File_Mode.js';
import { GetCachedDriveToken, GetDriveToken } from './02_Drive_Auth.js';
import { IsDriveCapableOrigin, GetDriveClientId } from './01_Drive_Config.js';
import { GetDriveFileInfo, ReadDriveFileText, UpdateDriveFileText } from './03_Drive_Files.js';

const DRIVE_REMEMBER_KEY = 'tixidian-drive-data-file';

export const DriveDataFileSource = {
  recall: async () => {
    if (!IsDriveCapableOrigin() || !GetDriveClientId()) return null;
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(DRIVE_REMEMBER_KEY) || 'null'); } catch (_) { saved = null; }
    return saved && saved.id ? MakeDriveFileHandle(saved) : null;
  },
  forget: async () => { try { localStorage.removeItem(DRIVE_REMEMBER_KEY); } catch (_) {} }
};

/** @param {{ id: string, name: string }} file */
export function MakeDriveFileHandle(file) {
  // Last content we read or wrote, keyed by Drive's modifiedTime: saves never re-download it.
  let cache = { lastModified: 0, text: null };
  const handle = {
    kind: 'file',
    storage: 'google-drive',
    source: DriveDataFileSource,
    id: file.id,
    name: file.name,
    async getFile() {
      const info = await GetDriveFileInfo(file.id, { interactive: false });
      if (info.trashed) throw new Error(`${file.name} is in the Google Drive trash.`);
      if (info.name) handle.name = info.name;
      return {
        name: handle.name,
        lastModified: info.lastModified,
        text: async () => {
          if (cache.text !== null && cache.lastModified === info.lastModified) return cache.text;
          const text = await ReadDriveFileText(file.id, { interactive: false });
          cache = { lastModified: info.lastModified, text };
          return text;
        }
      };
    },
    async createWritable() {
      const parts = [];
      return {
        write: async (chunk) => { parts.push(typeof chunk === 'string' ? chunk : await new Blob([chunk]).text()); },
        close: async () => {
          const text = parts.join('');
          const info = await UpdateDriveFileText(file.id, text);
          cache = { lastModified: info.lastModified, text };
        }
      };
    },
    queryPermission: async () => (GetCachedDriveToken() ? 'granted' : 'prompt'),
    requestPermission: async () => ((await GetDriveToken({ interactive: true })) ? 'granted' : 'denied'),
    remember: async () => { try { localStorage.setItem(DRIVE_REMEMBER_KEY, JSON.stringify({ id: file.id, name: handle.name })); } catch (_) {} }
  };
  return handle;
}

export function IsDriveHandle(handle) {
  return Boolean(handle && handle.storage === 'google-drive');
}

RegisterDataFileSource(DriveDataFileSource);
