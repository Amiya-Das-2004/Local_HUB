/**
 * 03_Notes/D_Data_File/02_Handle_Store.js
 * IndexedDB storage for the data-file mode:
 *   - "handles": the remembered FileSystemFileHandle of the data file and the optional
 *     backup-folder FileSystemDirectoryHandle (handles survive reloads; the browser
 *     re-asks for permission with one click)
 *   - "backups": rolling copies of the data file's previous contents (last 5 per file)
 *
 * Test seam: when window.__TIX_HANDLE_STORE_MEMORY__ is a Map, handles are kept there
 * instead (automated browsers cannot create real picker handles, and fake handles
 * cannot be stored in IndexedDB).
 */

const DATA_FILE_DB_NAME = 'tixidian-data-file';
const DATA_FILE_DB_VERSION = 1;
const DATA_FILE_BACKUPS_KEEP = 5;

let dataFileDbPromise = null;

function openDataFileDb() {
  if (dataFileDbPromise) return dataFileDbPromise;
  dataFileDbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DATA_FILE_DB_NAME, DATA_FILE_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('handles')) db.createObjectStore('handles');
      if (!db.objectStoreNames.contains('backups')) db.createObjectStore('backups', { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => { dataFileDbPromise = null; reject(req.error); };
  });
  return dataFileDbPromise;
}

function dataFileTx(storeName, mode, fn) {
  return openDataFileDb().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    let result;
    Promise.resolve(fn(store)).then(r => { result = r; });
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  }));
}

function dataFileRequest(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getTestHandleMap() {
  return (typeof window !== 'undefined' && window.__TIX_HANDLE_STORE_MEMORY__ instanceof Map)
    ? window.__TIX_HANDLE_STORE_MEMORY__
    : null;
}

/** key: 'dataFile' | 'backupFolder' */
export async function RememberHandle(key, handle) {
  const mem = getTestHandleMap();
  if (mem) { mem.set(key, handle); return; }
  await dataFileTx('handles', 'readwrite', store => { store.put(handle, key); });
}

export async function RecallHandle(key) {
  const mem = getTestHandleMap();
  if (mem) return mem.get(key) || null;
  try {
    return await dataFileTx('handles', 'readonly', store => dataFileRequest(store.get(key))) || null;
  } catch (_) {
    return null;
  }
}

export async function ForgetHandle(key) {
  const mem = getTestHandleMap();
  if (mem) { mem.delete(key); return; }
  try { await dataFileTx('handles', 'readwrite', store => { store.delete(key); }); } catch (_) {}
}

/** Stores a previous version of a data file; keeps the newest DATA_FILE_BACKUPS_KEEP per file name. */
export async function AddDataFileBackup(fileName, text) {
  await dataFileTx('backups', 'readwrite', store => { store.add({ fileName, savedAt: Date.now(), text }); });
  const all = await ListDataFileBackups(fileName);
  const extra = all.slice(DATA_FILE_BACKUPS_KEEP);
  if (extra.length) {
    await dataFileTx('backups', 'readwrite', store => { extra.forEach(b => store.delete(b.id)); });
  }
}

/** Newest first: [{ id, fileName, savedAt, size }] (text omitted). */
export async function ListDataFileBackups(fileName) {
  const all = await dataFileTx('backups', 'readonly', store => dataFileRequest(store.getAll()));
  return (all || [])
    .filter(b => !fileName || b.fileName === fileName)
    .sort((a, b) => b.savedAt - a.savedAt)
    .map(b => ({ id: b.id, fileName: b.fileName, savedAt: b.savedAt, size: (b.text || '').length }));
}

export async function GetDataFileBackupText(id) {
  const rec = await dataFileTx('backups', 'readonly', store => dataFileRequest(store.get(id)));
  return rec ? rec.text : null;
}
