/**
 * 03_Notes/Writing_Engine/Asset_Store.js
 * Internal image store. Every image is kept ONCE, keyed by a content hash; image blocks and
 * image-grid cells hold the reference `asset:<hash>` instead of a multi-MB data URL.
 *   - The store lives in memory, outside NotesState: typing never re-serializes images and the
 *     crash-recovery snapshot of the notes stays small.
 *   - Files get images through NotesState.toJSON (InstallAssetSerializer): every serializer
 *     (Save, data file, Export, the hub's Save button) writes `assets` = ONLY the images the
 *     notes still reference, so unused images are dropped on save (garbage collection) while
 *     undo in this session still finds them in memory.
 *   - Rendering uses one cached object URL per image (no data-URL string in the DOM).
 * Pure module (no imports): bundlers load it before 00_State.js.
 */

export const ASSET_REF_PREFIX = 'asset:';

const assetData = new Map();      // hash -> data URL
const assetObjectUrls = new Map(); // hash -> blob: URL (rendering cache)
const sessionNewAssets = new Set(); // hashes added this session (not loaded from a file)
let assetsChangedSinceSnapshot = false;

export function IsAssetRef(value) {
  return typeof value === 'string' && value.startsWith(ASSET_REF_PREFIX);
}

export function AssetRefHash(ref) {
  return IsAssetRef(ref) ? ref.slice(ASSET_REF_PREFIX.length) : '';
}

// cyrb53 with two seeds → 26 hex chars; synchronous and fast on multi-MB strings.
function cyrb53(str, seed) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}

export function HashAssetData(dataUrl) {
  return cyrb53(dataUrl, 0) + cyrb53(dataUrl, 0x9e3779b9).slice(2);
}

/**
 * Stores a data URL (once) and returns its `asset:<hash>` ref. Anything else is returned as-is.
 * fromFile=true: the image already exists in the opened file (migration), recovery skips it.
 */
export function PutAsset(value, { fromFile = false } = {}) {
  if (typeof value !== 'string' || !value.startsWith('data:')) return value;
  const hash = HashAssetData(value);
  if (!assetData.has(hash)) {
    assetData.set(hash, value);
    if (!fromFile) { sessionNewAssets.add(hash); assetsChangedSinceSnapshot = true; }
  }
  return ASSET_REF_PREFIX + hash;
}

/**
 * Adds a { hash: dataUrl } map (from a file, a recovery snapshot or the block clipboard).
 * fromFile=true: the images are already saved in a file, so recovery does not need them.
 */
export function LoadAssets(map, { fromFile = false } = {}) {
  if (!map || typeof map !== 'object') return 0;
  let added = 0;
  Object.keys(map).forEach((hash) => {
    const data = map[hash];
    if (typeof data !== 'string' || !data.startsWith('data:') || assetData.has(hash)) return;
    assetData.set(hash, data);
    if (!fromFile) { sessionNewAssets.add(hash); assetsChangedSinceSnapshot = true; }
    added++;
  });
  return added;
}

/** Data URL for a ref ('' when unknown); non-refs are returned unchanged. */
export function GetAssetData(value) {
  if (!IsAssetRef(value)) return value || '';
  return assetData.get(AssetRefHash(value)) || '';
}

function dataUrlToBlob(dataUrl) {
  const comma = dataUrl.indexOf(',');
  const header = dataUrl.slice(5, comma);
  const body = dataUrl.slice(comma + 1);
  const mime = header.split(';')[0] || 'application/octet-stream';
  if (/;base64/i.test(header)) {
    const bin = atob(body.replace(/\s+/g, ''));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }
  return new Blob([decodeURIComponent(body)], { type: mime });
}

/** URL to put in <img src>: a cached object URL for refs (data URL fallback); others unchanged. */
export function ResolveAssetUrl(value) {
  if (!IsAssetRef(value)) return value || '';
  const hash = AssetRefHash(value);
  if (assetObjectUrls.has(hash)) return assetObjectUrls.get(hash);
  const data = assetData.get(hash);
  if (!data) return '';
  try {
    if (typeof URL !== 'undefined' && URL.createObjectURL && typeof Blob !== 'undefined') {
      const url = URL.createObjectURL(dataUrlToBlob(data));
      assetObjectUrls.set(hash, url);
      return url;
    }
  } catch (_) { /* fall back to the data URL */ }
  return data;
}

/** Image fields of one block that may hold an image (url/content, grid cells). */
export function ForEachBlockImageField(block, fn) {
  if (!block || typeof block !== 'object' || block.type !== 'image') return;
  ['url', 'content'].forEach((k) => {
    if (typeof block[k] === 'string') {
      const next = fn(block[k]);
      if (typeof next === 'string') block[k] = next;
    }
  });
  const cells = block.grid && Array.isArray(block.grid.cells) ? block.grid.cells : [];
  cells.forEach((cell) => {
    if (cell && typeof cell.src === 'string') {
      const next = fn(cell.src);
      if (typeof next === 'string') cell.src = next;
    }
  });
}

/** { hash: dataUrl } of the images the given blocks reference. */
export function CollectBlockAssets(blocks) {
  const out = {};
  (blocks || []).forEach((b) => ForEachBlockImageField(b, (v) => {
    if (!IsAssetRef(v)) return;
    const hash = AssetRefHash(v);
    const data = assetData.get(hash);
    if (data) out[hash] = data;
  }));
  return out;
}

/** { hash: dataUrl } of the images any note of `state` references (the saved set). */
export function CollectReferencedAssets(state) {
  const out = {};
  ((state && state.notes) || []).forEach((n) => Object.assign(out, CollectBlockAssets(n && n.blocks)));
  return out;
}

/** Makes every JSON.stringify(state) carry `assets` (referenced images only). Idempotent. */
export function InstallAssetSerializer(state) {
  if (!state || typeof state !== 'object' || Object.prototype.hasOwnProperty.call(state, 'toJSON')) return state;
  Object.defineProperty(state, 'toJSON', {
    enumerable: false,
    configurable: true,
    value: function () { return { ...this, assets: CollectReferencedAssets(this) }; }
  });
  return state;
}

/** Shallow copy without the asset serializer: for hot paths (live DOM vault, recovery). */
export function StateWithoutAssets(state) {
  const copy = { ...state };
  delete copy.assets;
  return copy;
}

/** Images added this session (for the recovery snapshot); null when unchanged since last call. */
export function TakeSessionAssetsIfChanged() {
  if (!assetsChangedSinceSnapshot) return null;
  assetsChangedSinceSnapshot = false;
  const out = {};
  sessionNewAssets.forEach((h) => { if (assetData.has(h)) out[h] = assetData.get(h); });
  return out;
}

/** After a save: everything in memory is now in a file (or intentionally dropped). */
export function MarkAssetsSaved() {
  sessionNewAssets.clear();
  assetsChangedSinceSnapshot = false;
}

export function GetAssetStats() {
  let bytes = 0;
  assetData.forEach((d) => { bytes += d.length; });
  return { count: assetData.size, bytes, sessionNew: sessionNewAssets.size };
}
