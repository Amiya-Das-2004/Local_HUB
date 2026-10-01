/**
 * 08_Research_Library.js — Canonical cross-tab research registry for Local_HUB.
 *
 * Single source of truth for papers, books, theses, preprints and misc
 * scholarly items. Every tab (R&D, ProffTrack, Notes Library, future tabs)
 * reads/writes through this component so an item is stored exactly once in
 * the shared `<script type="application/json" id="PapersData">` vault,
 * regardless of which tab it was added from.
 *
 * Storage contract:
 *  - The vault holds METADATA ONLY (~1 KB/item). Binary attachments live in
 *    IndexedDB via 07_Blob_Store.js under `attachment.blobKey`.
 *  - `window.PapersState` mirrors the live state (Prompt.md convention).
 *  - IMPORT SAFETY: `RL_MergePapers()` / `RL_ImportSlice()` are strictly
 *    additive, id-based upserts. No code path may blind-replace `PapersData`,
 *    because single-tab exports carry only a SUBSET of the library.
 *  - CASCADE: `RL_Delete()` dispatches `localhub:paper-deleted` so R&D can
 *    purge orphan links/queue entries and ProffTrack can purge paperRefs.
 *    `RL_Upsert()` dispatches `localhub:paper-upserted` for live sync.
 *
 * All symbols are strictly `RL_` prefixed to guarantee zero top-level
 * identifier collisions with `05_R&D/00_State.js` in the flat bundle.
 */

const RL_VAULT_ID = 'PapersData';
const RL_CACHE_KEY = 'PapersData_Local_Cache';
const RL_SCHEMA_VERSION = 1;
const RL_MIGRATION_VERSION = 0; // bumped as legacy migrations ship in later phases

const RL_TYPES = ['paper', 'book', 'thesis', 'preprint', 'misc', 'software', 'web'];
const RL_STATUSES = ['wishlist', 'reading', 'read'];

const RL_State = {
  schema: RL_SCHEMA_VERSION,
  migration: 0,
  items: [],
  loaded: false
};
if (typeof window !== 'undefined') window.PapersState = RL_State;

/* ------------------------------------------------------------------ */
/* Identity & normalization helpers                                    */
/* ------------------------------------------------------------------ */

export function RL_NewId() {
  return 'pap_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Dedupe fingerprint: lowercase alphanumeric-only title. */
export function RL_NormalizeTitle(title) {
  return String(title || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/** Canonical DOI: trims resolver prefixes, lowercases. */
export function RL_NormalizeDOI(doi) {
  let d = String(doi || '').trim().toLowerCase();
  d = d.replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
  d = d.replace(/^doi:\s*/, '');
  return d;
}

/** Coerce any raw/imported object into a valid registry item (never throws). */
export function RL_NormalizeItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const num = v => (Number.isFinite(Number(v)) ? Number(v) : null);
  const type = RL_TYPES.includes(raw.type) ? raw.type : 'paper';
  const status = RL_STATUSES.includes(raw.status) ? raw.status : 'wishlist';
  const attachment = (raw.attachment && typeof raw.attachment === 'object')
    ? {
        name: String(raw.attachment.name || ''),
        size: Number(raw.attachment.size) || 0,
        type: String(raw.attachment.type || ''),
        blobKey: String(raw.attachment.blobKey || ''),
        // legacy base64 payloads are preserved untouched until migration moves
        // them into IndexedDB (later phases); never write new ones.
        data: typeof raw.attachment.data === 'string' ? raw.attachment.data : undefined
      }
    : null;
  const item = {
    id: String(raw.id || RL_NewId()),
    type,
    title: String(raw.title || '').trim() || 'Untitled',
    authors: Array.isArray(raw.authors) ? raw.authors.map(a => String(a)).filter(Boolean) : [],
    year: num(raw.year),
    venue: String(raw.venue || ''),
    doi: RL_NormalizeDOI(raw.doi),
    arxivId: String(raw.arxivId || ''),
    isbn: String(raw.isbn || ''),
    url: String(raw.url || ''),
    pdfUrl: String(raw.pdfUrl || ''),
    status,
    progress: Math.max(0, Math.min(100, num(raw.progress) || 0)),
    rating: num(raw.rating),
    starred: !!raw.starred,
    tags: Array.isArray(raw.tags) ? raw.tags.map(t => String(t)).filter(Boolean) : [],
    summary: String(raw.summary || ''),
    citeKey: String(raw.citeKey || ''),
    bibtex: String(raw.bibtex || ''),
    attachment,
    origin: ['rd', 'professors', 'notes'].includes(raw.origin) ? raw.origin : 'rd',
    createdAt: num(raw.createdAt) || Date.now(),
    updatedAt: num(raw.updatedAt) || Date.now()
  };
  // attachment record is dropped entirely when completely empty
  if (item.attachment && !item.attachment.blobKey && !item.attachment.data &&
      !item.attachment.name && !item.attachment.size) item.attachment = null;
  return item;
}

/* ------------------------------------------------------------------ */
/* Boot: vault load & sync                                             */
/* ------------------------------------------------------------------ */

/** Read `#PapersData` vault (fallback: localStorage cache). Idempotent. */
export function RL_Load() {
  let payload = null;
  const tag = (typeof document !== 'undefined') ? document.getElementById(RL_VAULT_ID) : null;
  if (tag && tag.textContent) {
    try { payload = JSON.parse(tag.textContent); }
    catch (e) { console.warn('[ResearchLibrary] Vault parse failed; falling back to cache.', e); }
  }
  if (!payload || !Array.isArray(payload.items)) {
    try {
      const raw = localStorage.getItem(RL_CACHE_KEY);
      if (raw) {
        const cache = JSON.parse(raw);
        if (cache && Array.isArray(cache.items)) payload = cache;
      }
    } catch (e) { /* corrupted cache — ignore */ }
  }
  RL_State.items = ((payload && Array.isArray(payload.items)) ? payload.items : [])
    .map(RL_NormalizeItem).filter(Boolean);
  RL_State.schema = (payload && payload.schema) || RL_SCHEMA_VERSION;
  RL_State.migration = (payload && typeof payload.migration === 'number') ? payload.migration : 0;
  RL_State.loaded = true;
  return RL_State;
}

export function RL_EnsureLoaded() {
  if (!RL_State.loaded) RL_Load();
  return RL_State;
}

/** Serialize live state into the DOM vault + localStorage cache. */
export function RL_SyncVault() {
  const payload = JSON.stringify({
    schema: RL_State.schema,
    migration: RL_State.migration,
    items: RL_State.items
  });
  if (typeof document !== 'undefined') {
    let tag = document.getElementById(RL_VAULT_ID);
    if (!tag) {
      tag = document.createElement('script');
      tag.type = 'application/json';
      tag.id = RL_VAULT_ID;
      (document.head || document.documentElement).appendChild(tag);
    }
    tag.textContent = payload;
  }
  try { localStorage.setItem(RL_CACHE_KEY, payload); }
  catch (e) { console.warn('[ResearchLibrary] localStorage cache write failed:', e); }
  return payload;
}

function RL_Emit(name, detail) {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  try { window.dispatchEvent(new CustomEvent('localhub:' + name, { detail })); }
  catch (e) { console.warn('[ResearchLibrary] Event dispatch failed:', e); }
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

export function RL_All() {
  RL_EnsureLoaded();
  return RL_State.items;
}

export function RL_Get(id) {
  RL_EnsureLoaded();
  return RL_State.items.find(i => i.id === id) || null;
}

export function RL_FindByDOI(doi) {
  const d = RL_NormalizeDOI(doi);
  if (!d) return null;
  RL_EnsureLoaded();
  return RL_State.items.find(i => i.doi && i.doi === d) || null;
}

export function RL_FindByISBN(isbn) {
  const k = String(isbn || '').replace(/[^0-9Xx]/g, '');
  if (!k) return null;
  RL_EnsureLoaded();
  return RL_State.items.find(i => i.isbn && i.isbn.replace(/[^0-9Xx]/g, '') === k) || null;
}

export function RL_FindByTitle(title) {
  const t = RL_NormalizeTitle(title);
  if (!t) return null;
  RL_EnsureLoaded();
  return RL_State.items.find(i => RL_NormalizeTitle(i.title) === t) || null;
}

export function RL_FindByKey(citeKey) {
  const k = String(citeKey || '').trim();
  if (!k) return null;
  RL_EnsureLoaded();
  return RL_State.items.find(i => i.citeKey && i.citeKey.toLowerCase() === k.toLowerCase()) || null;
}

/** Lightweight substring search across title/authors/tags/citeKey. */
export function RL_Search(query) {
  const q = String(query || '').trim().toLowerCase();
  RL_EnsureLoaded();
  if (!q) return RL_State.items.slice();
  return RL_State.items.filter(i => {
    const hay = [i.title, i.citeKey, i.venue, (i.authors || []).join(' '), (i.tags || []).join(' ')]
      .join(' ').toLowerCase();
    return hay.includes(q);
  });
}

/* ------------------------------------------------------------------ */
/* Writes — always merge-safe, never blind-replace                     */
/* ------------------------------------------------------------------ */

function RL_SuggestCiteKey(item) {
  const first = (item.authors && item.authors[0]) ? String(item.authors[0]) : '';
  const surname = (first.split(/\s+/).pop() || 'anon').toLowerCase().replace(/[^a-z]/g, '') || 'anon';
  const year = item.year || 'nd';
  const word = (String(item.title || 'untitled').toLowerCase().replace(/[^a-z0-9 ]/g, '')
    .split(/\s+/).filter(Boolean)[0]) || 'untitled';
  return `${surname}${year}${word}`;
}

/** Guarantee a citeKey that is unique across the library (mutates item). */
function RL_EnsureUniqueCiteKey(item) {
  RL_EnsureLoaded();
  if (!item.citeKey) item.citeKey = RL_SuggestCiteKey(item);
  let base = item.citeKey;
  let n = 1;
  while (RL_State.items.some(i => i.id !== item.id &&
      i.citeKey && i.citeKey.toLowerCase() === item.citeKey.toLowerCase())) {
    n += 1;
    item.citeKey = `${base}_${n}`;
  }
  return item.citeKey;
}

/**
 * Insert or merge ONE item. Identity resolution: id → DOI → citeKey, so a
 * paper re-added from any tab MERGES into the existing entry instead of
 * duplicating it. Incoming defined fields win; `tags` are unioned.
 * @returns {{item: object, created: boolean}}
 */
export function RL_Upsert(item, { origin, deferSync = false } = {}) {
  RL_EnsureLoaded();
  const norm = RL_NormalizeItem(item);
  if (!norm) throw new Error('[ResearchLibrary] Upsert requires an object');
  if (origin && ['rd', 'professors', 'notes'].includes(origin)) norm.origin = origin;
  const idx = RL_State.items.findIndex(i =>
    i.id === norm.id ||
    (norm.doi && i.doi && i.doi === norm.doi) ||
    (norm.citeKey && i.citeKey && i.citeKey.toLowerCase() === norm.citeKey.toLowerCase())
  );
  let created = false;
  let merged;
  if (idx >= 0) {
    const existing = RL_State.items[idx];
    merged = { ...existing };
    Object.keys(norm).forEach(k => {
      if (norm[k] !== undefined && norm[k] !== null && norm[k] !== '' && k !== 'id' && k !== 'createdAt') {
        merged[k] = norm[k];
      }
    });
    // union tags, keep earliest createdAt, refresh updatedAt
    merged.tags = Array.from(new Set([...(existing.tags || []), ...(norm.tags || [])]));
    merged.createdAt = existing.createdAt;
    merged.updatedAt = Date.now();
    if (existing.citeKey) merged.citeKey = existing.citeKey; // identity stays stable on merge
    if (!merged.attachment && norm.attachment) merged.attachment = norm.attachment;
    RL_State.items[idx] = RL_NormalizeItem(merged);
  } else {
    created = true;
    RL_EnsureUniqueCiteKey(norm);
    RL_State.items.push(norm);
    merged = norm;
  }
  if (!deferSync) RL_SyncVault();
  RL_Emit('paper-upserted', { id: merged.id, item: merged, created });
  return { item: merged, created };
}

/**
 * Merge an ARRAY of incoming items (the ONLY sanctioned import path).
 * Matching priority: id → DOI → citeKey (plus normalized title when opted in).
 * Never removes or truncates existing entries, so single-tab subsets cannot
 * erase the master library.
 * @param {object[]} incoming
 * @param {{byTitle?:boolean}} [opts]  also merge on normalized title (opt-in)
 * @returns {{added:number, updated:number, total:number}}
 */
export function RL_MergePapers(incoming, { byTitle = false } = {}) {
  RL_EnsureLoaded();
  const stats = { added: 0, updated: 0, total: 0 };
  if (!Array.isArray(incoming)) return stats;
  incoming.forEach(raw => {
    const norm = RL_NormalizeItem(raw);
    if (!norm) return;
    stats.total += 1;
    const titleMatch = byTitle ? RL_FindByTitle(norm.title) : null;
    const result = RL_Upsert(titleMatch ? { ...norm, id: titleMatch.id } : norm, { deferSync: true });
    if (result.created) stats.added += 1;
    else stats.updated += 1;
  });
  RL_SyncVault();
  return stats;
}

export function RL_Delete(id) {
  RL_EnsureLoaded();
  const idx = RL_State.items.findIndex(i => i.id === id);
  if (idx < 0) return false;
  const removed = RL_State.items[idx];
  RL_State.items.splice(idx, 1);
  RL_SyncVault();
  RL_Emit('paper-deleted', { id, item: removed });
  return true;
}

/** Explicit full reset — callers MUST confirm with the user first. */
export function RL_ResetLibrary() {
  RL_EnsureLoaded();
  RL_State.items = [];
  RL_SyncVault();
  RL_Emit('paper-deleted', { id: '*', item: null });
}

/* ------------------------------------------------------------------ */
/* Import/Export slices (consumed by 04_Import_Export.js in Phase 4)   */
/* ------------------------------------------------------------------ */

export function RL_ExportSlice() {
  RL_EnsureLoaded();
  return JSON.parse(JSON.stringify({ schema: RL_State.schema, migration: RL_State.migration, items: RL_State.items }));
}

/** Merge-safe import of a `Papers` slice from any JSON envelope. */
export function RL_ImportSlice(slice, opts = {}) {
  if (!slice || !Array.isArray(slice.items)) return { added: 0, updated: 0, total: 0 };
  return RL_MergePapers(slice.items, opts);
}

/* ------------------------------------------------------------------ */
/* Legacy migration hook                                               */
/* ------------------------------------------------------------------ */

/**
 * Runs versioned one-time migrations (base64 → IndexedDB, professors'
 * embedded papers → registry, RDData items → registry). Registered in later
 * phases; safe no-op until then.
 */
export function RL_MigrateLegacy() {
  RL_EnsureLoaded();
  if (RL_State.migration >= RL_MIGRATION_VERSION) return false;
  // Phase 1+: append per-version migration steps here.
  RL_State.migration = RL_MIGRATION_VERSION;
  RL_SyncVault();
  return true;
}
