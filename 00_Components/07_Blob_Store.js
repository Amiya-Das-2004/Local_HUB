/**
 * 07_Blob_Store.js — IndexedDB binary vault for Local_HUB.
 *
 * Stores large binary payloads (PDF attachments, images, …) OUTSIDE the HTML
 * data vaults so `<script type="application/json">` blocks stay featherweight.
 * IndexedDB is bound to the browser profile/origin and does NOT travel inside
 * a saved .html file — callers must keep a pointer (`blobKey`, `pdfUrl`, DOI)
 * in the JSON vault and offer the Archive Export path for device migration.
 *
 * All symbols are strictly `BlobStore_`/`BLOBSTORE_` prefixed to guarantee
 * zero top-level identifier collisions in the flat standalone bundle.
 * If IndexedDB is unavailable (private mode, blocked storage), a best-effort
 * in-memory fallback keeps the session functional for small payloads.
 */

const BLOBSTORE_DB_NAME = 'LocalHUB_Blobs';
const BLOBSTORE_DB_VERSION = 1;
const BLOBSTORE_STORE = 'files';

const BLOBSTORE_MEM = new Map();
let BLOBSTORE_DB_PROMISE = null;
let BLOBSTORE_WARNED = false;

function BlobStore_WarnFallback(err) {
  if (BLOBSTORE_WARNED) return;
  BLOBSTORE_WARNED = true;
  console.warn('[BlobStore] IndexedDB unavailable, falling back to in-memory storage (lost on reload).', err);
}

function BlobStore_Open() {
  if (typeof indexedDB === 'undefined' || indexedDB === null) {
    return Promise.reject(new Error('IndexedDB unavailable'));
  }
  if (BLOBSTORE_DB_PROMISE) return BLOBSTORE_DB_PROMISE;
  BLOBSTORE_DB_PROMISE = new Promise((resolve, reject) => {
    const req = indexedDB.open(BLOBSTORE_DB_NAME, BLOBSTORE_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(BLOBSTORE_STORE)) {
        db.createObjectStore(BLOBSTORE_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
    req.onblocked = () => reject(new Error('IndexedDB open blocked by another tab'));
  });
  return BLOBSTORE_DB_PROMISE;
}

async function BlobStore_Store(mode) {
  const db = await BlobStore_Open();
  return db.transaction(BLOBSTORE_STORE, mode).objectStore(BLOBSTORE_STORE);
}

function BlobStore_Request(store, method, ...args) {
  return new Promise((resolve, reject) => {
    const req = store[method](...args);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Persist a binary payload under a stable key.
 * @param {string} key  e.g. `blob_pap_lx2abc123`
 * @param {Blob} blob
 * @param {{name?:string, type?:string, size?:number}} [meta]
 * @returns {Promise<{key:string, name:string, type:string, size:number, savedAt:number}>}
 */
export async function BlobStore_Put(key, blob, meta = {}) {
  if (!key) throw new Error('[BlobStore] Put requires a key');
  const record = {
    key,
    blob,
    name: meta.name || (blob && blob.name) || key,
    type: meta.type || (blob && blob.type) || 'application/octet-stream',
    size: meta.size != null ? Number(meta.size) : (blob ? blob.size : 0),
    savedAt: Date.now()
  };
  try {
    const store = await BlobStore_Store('readwrite');
    await BlobStore_Request(store, 'put', record, key);
  } catch (err) {
    BlobStore_WarnFallback(err);
    BLOBSTORE_MEM.set(key, record);
  }
  return record;
}

/**
 * Decode a legacy base64 data URL and persist it as a real Blob.
 * Used by migrations that strip `attachment.data` out of JSON vaults.
 */
export async function BlobStore_PutDataUrl(key, dataUrl, meta = {}) {
  if (!dataUrl || typeof dataUrl !== 'string') throw new Error('[BlobStore] PutDataUrl requires a data URL string');
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUrl);
  if (!match) throw new Error('[BlobStore] Unrecognized data URL');
  const type = meta.type || match[1] || 'application/octet-stream';
  const isBase64 = !!match[2];
  const payload = match[3];
  let blob;
  if (isBase64) {
    const bin = atob(payload);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    blob = new Blob([bytes], { type });
  } else {
    blob = new Blob([decodeURIComponent(payload)], { type });
  }
  return BlobStore_Put(key, blob, { ...meta, type });
}

/** Fetch a stored record: `{ blob, name, type, size, savedAt }` or `null`. */
export async function BlobStore_Get(key) {
  if (!key) return null;
  try {
    const store = await BlobStore_Store('readonly');
    const record = await BlobStore_Request(store, 'get', key);
    return record || null;
  } catch (err) {
    BlobStore_WarnFallback(err);
    return BLOBSTORE_MEM.get(key) || null;
  }
}

export async function BlobStore_Has(key) {
  if (!key) return false;
  try {
    const store = await BlobStore_Store('readonly');
    const found = await BlobStore_Request(store, 'getKey', key);
    return found != null;
  } catch (err) {
    BlobStore_WarnFallback(err);
    return BLOBSTORE_MEM.has(key);
  }
}

export async function BlobStore_Delete(key) {
  if (!key) return false;
  BLOBSTORE_MEM.delete(key);
  try {
    const store = await BlobStore_Store('readwrite');
    await BlobStore_Request(store, 'delete', key);
    return true;
  } catch (err) {
    BlobStore_WarnFallback(err);
    return BLOBSTORE_MEM.has(key) === false;
  }
}

export async function BlobStore_AllKeys() {
  try {
    const store = await BlobStore_Store('readonly');
    return (await BlobStore_Request(store, 'getAllKeys')) || [];
  } catch (err) {
    BlobStore_WarnFallback(err);
    return Array.from(BLOBSTORE_MEM.keys());
  }
}

/** Browser storage estimate, falling back to a sum of known record sizes. */
export async function BlobStore_Usage() {
  try {
    if (navigator.storage && typeof navigator.storage.estimate === 'function') {
      const est = await navigator.storage.estimate();
      return { usage: est.usage || 0, quota: est.quota || null, source: 'estimate' };
    }
  } catch (e) { /* fall through */ }
  let usage = 0;
  try {
    const store = await BlobStore_Store('readonly');
    const records = (await BlobStore_Request(store, 'getAll')) || [];
    records.forEach(r => { usage += r.size || 0; });
  } catch (err) {
    BlobStore_WarnFallback(err);
    BLOBSTORE_MEM.forEach(r => { usage += r.size || 0; });
  }
  return { usage, quota: null, source: 'records' };
}

/** Convenience: resolve a stored blob into a temporary object URL (or null). */
export async function BlobStore_ObjectURL(key) {
  const record = await BlobStore_Get(key);
  if (!record || !record.blob) return null;
  return URL.createObjectURL(record.blob);
}

/** True when IndexedDB is usable (no in-memory fallback required). */
export function BlobStore_Available() {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch (e) {
    return false;
  }
}
