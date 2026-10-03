/* ==========================================================================
   PROFESSORS — 00_State.js
   Central state vault + persistence + data operations for ProffTrack.
   Extracted verbatim from workspace proff.html <script> IIFE.
   Source line references in Professors.md.
   ==========================================================================
*/

import { toast, uid, norm, todayISO, statusOf, avatarColor } from './01_Utils.js';
import { seedSamples } from './03_Seed_Data.js';
import { RL_Upsert, RL_Get, RL_Delete, RL_FindByTitle } from '../../00_Components/08_Research_Library.js';
import { BlobStore_PutDataUrl } from '../../00_Components/07_Blob_Store.js';
import { render } from './Professors.js';

export var STORE_KEY = 'profftrack:v1';

export var state = { version: 1, updatedAt: null, professors: [] };
export var ui = { sort: 'qs', paperSort: 'recent', search: '', statusFilter: 'all', tagFilter: null, collapsed: {}, kbIdx: -1, heatYear: null, expandedProf: null, expandedPaper: null, toastTimer: null, printMode: false, dragId: null, dragTarget: null, dragBelow: false, favOnly: false };

/* ES modules expose `state` as a read-only live binding to importers —
   reassignments (loadState / imports / clear-all) must go through here. */
export function replaceState(next) { state = next; decorateAllProfessors(); }

/* reading status filter + tag filter gate, shared by every renderer */
export function paperPasses(pp) {
  if (ui.statusFilter !== 'all' && statusOf(pp) !== ui.statusFilter) return false;
  if (ui.tagFilter && (pp.tags || []).indexOf(ui.tagFilter) === -1) return false;
  return true;
}

/* ============================== persistence ============================== */
export function persist() {
  state.updatedAt = new Date().toISOString();
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* file:// or private mode */ }
  /* LocalHUB Save button vault sync: candidate key 'ProfessorsState' mirrors
     the live library into #ProfessorsData on every save-and-download */
  try { window.ProfessorsState = state; } catch (e) { /* not in a browser */ }
  syncVault();
}
/* LocalHUB convention: keep the JSON vault script tag in the live document in
   sync too (no-op when the page has no vault tag). */
function syncVault() {
  if (typeof document === 'undefined') return;
  var el = document.getElementById('ProfessorsData') || document.getElementById('app-data');
  if (el) el.textContent = '\n' + JSON.stringify(state, null, 2).replace(/</g, '\\u003c') + '\n';
}
function isEmptyData(d) {
  return !d || !Array.isArray(d.professors) || d.professors.length === 0;
}
export function loadState() {
  var embedded = null, stored = null;
  var vaultEl = typeof document !== 'undefined'
    ? (document.getElementById('ProfessorsData') || document.getElementById('app-data'))
    : null;
  try { embedded = vaultEl ? JSON.parse(vaultEl.textContent || 'null') : null; } catch (e) {}
  try { stored = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) {}
  var candidates = [];
  if (!isEmptyData(embedded) && embedded.updatedAt) candidates.push(embedded);
  if (!isEmptyData(stored) && stored.updatedAt) candidates.push(stored);
  if (!isEmptyData(embedded) && !embedded.updatedAt) candidates.push(embedded);
  if (!isEmptyData(stored) && !stored.updatedAt) candidates.push(stored);
  if (candidates.length) {
    candidates.sort(function (a, b) { return String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')); });
    state = candidates[0];
    decorateAllProfessors();
    return;
  }
  if (stored && Array.isArray(stored.professors) && stored.professors.length === 0) {
    state = { version: 1, updatedAt: null, professors: [] }; /* user cleared it — respect that */
    decorateAllProfessors();
    return;
  }
  if (embedded && Array.isArray(embedded.professors) && embedded.professors.length === 0 && embedded.updatedAt) {
    state = { version: 1, updatedAt: null, professors: [] };
    return;
  }
  state = { version: 1, updatedAt: null, professors: seedSamples() };
  persist();
  decorateAllProfessors();
}

/* repair items saved by older builds without ids (or with null ids) */
export function sanitizeIds() {
  var changed = false;
  state.professors.forEach(function (p) {
    if (!p.id) { p.id = uid('p'); changed = true; }
    (p.papers || []).forEach(function (pp) {
      if (!pp.id) { pp.id = uid('pp'); changed = true; }
      if (!pp.status) { pp.status = 'read'; changed = true; }
      if (pp.rereads && !Array.isArray(pp.rereads)) { pp.rereads = []; changed = true; }
      if (pp.journal && !Array.isArray(pp.journal)) { pp.journal = []; changed = true; }
    });
  });
  if (changed) persist();
}


/* ==================== research registry bridge (spec §15-20) ====================
   Canonical papers live in PapersData (RL_*); ProfessorTrack keeps lightweight
   paperRefs: [{ paperId, journal, addedAt }]. `prof.papers` remains readable
   through a computed view whose writes flow back into the registry, so every
   existing UI code path keeps working unchanged. */

var STATUS_TO_RL = { read: 'read', reading: 'reading', wishlist: 'unread' };
var RL_TO_STATUS = { read: 'read', reading: 'reading', unread: 'wishlist' };

var VIEW_FIELDS = ['title', 'authors', 'year', 'venue', 'url', 'startedOn', 'finishedOn',
  'rating', 'tags', 'summary', 'notes', 'attachment', 'rereads', 'progress'];

function profPaperView(item, prof, ref) {
  var view = {
    id: item.id,
    professorId: item.professorId || prof.id,
    status: RL_TO_STATUS[item.status] || item.status,
    readDate: item.finishedOn || '',
    journal: (ref && ref.journal) || []
  };
  VIEW_FIELDS.forEach(function (k) { if (item[k] !== undefined) view[k] = item[k]; });
  return new Proxy(view, {
    set: function (target, key, value) {
      target[key] = value;
      if (key === 'journal') {
        if (ref) ref.journal = value; /* same array reference — later pushes mutate it in place */
        persist();
        return true;
      }
      if (key === 'rereads') {
        RL_Upsert({ id: item.id, rereads: value }, { origin: 'professors' });
        return true;
      }
      if (key === 'status') {
        RL_Upsert({ id: item.id, status: STATUS_TO_RL[value] || 'unread' }, { origin: 'professors' });
        return true;
      }
      if (key === 'readDate') {
        RL_Upsert({ id: item.id, finishedOn: value }, { origin: 'professors' });
        return true;
      }
      if (VIEW_FIELDS.indexOf(key) !== -1) {
        var patch = {};
        patch[key] = value;
        RL_Upsert(patch, { origin: 'professors' });
      }
      return true;
    }
  });
}

function decorateProf(p) {
  if (!p) return;
  var desc = Object.getOwnPropertyDescriptor(p, 'papers');
  if (desc && desc.get) return; /* already decorated */
  Object.defineProperty(p, 'papers', {
    configurable: true,
    get: function () {
      var prof = p;
      return (p.paperRefs || []).map(function (ref) {
        var item = RL_Get(ref.paperId);
        return item ? profPaperView(item, prof, ref) : null;
      }).filter(Boolean);
    }
  });
}

function decorateAllProfessors() { (state.professors || []).forEach(decorateProf); }

/* One-time migration: embedded legacy papers become registry items (base64
   attachments move to IndexedDB); professors keep journal-bearing refs. */
export function MigratePapersToRegistry() {
  var changed = false;
  (state.professors || []).forEach(function (p) {
    if (!Array.isArray(p.papers) || !p.papers.length) return;
    p.paperRefs = p.paperRefs || [];
    p.papers.slice().forEach(function (pp) {
      var att = pp.attachment;
      var res = RL_Upsert({
        type: 'paper',
        title: pp.title, authors: pp.authors || '', year: pp.year || null,
        venue: pp.venue || '', url: pp.url || '',
        status: STATUS_TO_RL[pp.status] || 'unread',
        startedOn: pp.startedOn || '', finishedOn: pp.finishedOn || pp.readDate || '',
        rating: typeof pp.rating === 'number' ? pp.rating : null,
        tags: pp.tags || [], summary: pp.summary || '', notes: pp.notes || '',
        professorId: p.id
      }, { origin: 'professors' });
      var item = res.item;
      if (att && att.data) {
        var key = 'blob_' + item.id;
        BlobStore_PutDataUrl(key, att.data, { name: att.name || 'paper.pdf', type: att.type || 'application/pdf', size: att.size || 0 })
          .then(function () {
            RL_Upsert({ id: item.id, attachment: { name: att.name, type: att.type, size: att.size, blobKey: key } }, { origin: 'professors' });
          })
          .catch(function (e) { console.warn('[ProfessorTrack] attachment migration failed:', e); });
      } else if (att) {
        RL_Upsert({ id: item.id, attachment: { name: att.name, type: att.type, size: att.size } }, { origin: 'professors' });
      }
      var hasRef = p.paperRefs.some(function (r) { return r.paperId === item.id; });
      if (!hasRef) p.paperRefs.push({ paperId: item.id, journal: pp.journal || [], addedAt: pp.createdAt || new Date().toISOString() });
      changed = true;
    });
    delete p.papers;
    decorateProf(p);
  });
  if (changed || !state.registryMigrated) { state.registryMigrated = true; persist(); }
}

/* ============================== data ops ============================== */
export function getProf(id) {
  for (var i = 0; i < state.professors.length; i++) if (state.professors[i].id === id) return state.professors[i];
  return null;
}
export function upsertProf(data) {
  if (data.id) {
    var p = getProf(data.id);
    if (p) { Object.assign(p, data, { id: p.id }); persist(); return p; }
  }
  var np = Object.assign({
    id: uid('p'), papers: [], createdAt: new Date().toISOString(),
    title: '', department: '', qsRank: null, areas: [], email: '', website: '', photo: '', bio: ''
  }, data);
  if (!np.papers) np.papers = [];
  if (!np.id) np.id = uid('p'); /* form passes id:null for new entries — never lose the generated id */
  if (!np.color) np.color = avatarColor(np.name); /* identity color (spec §14) — defaults to the name-hash avatar color */
  state.professors.push(np);
  decorateProf(np);
  persist();
  return np;
}
export function deleteProf(id) {
  state.professors = state.professors.filter(function (p) { return p.id !== id; });
  if (ui.expandedProf === id) ui.expandedProf = null;
  persist(); render(); toast('Professor removed from your library.');
}
export function upsertPaper(profId, data) {
  var p = getProf(profId);
  if (!p) return null;
  var patch = {
    type: 'paper',
    title: data.title || 'Untitled',
    authors: data.authors || '', year: data.year || null, venue: data.venue || '', url: data.url || '',
    status: STATUS_TO_RL[data.status] || 'unread',
    startedOn: data.startedOn || '', finishedOn: data.finishedOn || data.readDate || '',
    rating: typeof data.rating === 'number' ? data.rating : 4,
    tags: data.tags || [], summary: data.summary || '', notes: data.notes || '',
    professorId: profId
  };
  if (data.id) patch.id = data.id;
  if (data.attachment && data.attachment.data) {
    /* new base64 upload — move the binary to IndexedDB and keep a pointer */
    var tempId = data.id || 'pp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    var key = 'blob_' + tempId;
    BlobStore_PutDataUrl(key, data.attachment.data, { name: data.attachment.name || 'paper.pdf', type: data.attachment.type || 'application/pdf', size: data.attachment.size || 0 })
      .then(function () {
        var attId = patch.id || (RL_FindByTitle(patch.title) || {}).id;
        if (attId) RL_Upsert({ id: attId, attachment: { name: data.attachment.name, type: data.attachment.type, size: data.attachment.size, blobKey: key } }, { origin: 'professors' });
      })
      .catch(function (e) { console.warn('[ProfessorTrack] attachment store failed:', e); });
    patch.attachment = { name: data.attachment.name || 'paper.pdf', type: data.attachment.type || 'application/pdf', size: data.attachment.size || 0, blobKey: key };
  } else if (data.attachment) {
    patch.attachment = data.attachment; /* pointer-only attachment (edit path) */
  }
  var res = RL_Upsert(patch, { origin: 'professors' });
  var itemId = res.item.id;
  var refs = (p.paperRefs = p.paperRefs || []);
  var ref = null;
  for (var i = 0; i < refs.length; i++) if (refs[i].paperId === itemId) { ref = refs[i]; break; }
  if (!ref) { ref = { paperId: itemId, journal: data.journal || [], addedAt: new Date().toISOString() }; refs.push(ref); }
  else if (data.journal) ref.journal = data.journal;
  persist();
  return profPaperView(RL_Get(itemId), p, ref);
}
export function deletePaper(profId, paperId) {
  var p = getProf(profId);
  if (!p) return;
  p.paperRefs = (p.paperRefs || []).filter(function (r) { return r.paperId !== paperId; });
  var item = RL_Get(paperId);
  var stillReferenced = (state.professors || []).some(function (other) {
    return other.id !== profId && (other.paperRefs || []).some(function (r) { return r.paperId === paperId; });
  });
  if (item && item.professorId === profId && !stillReferenced) {
    RL_Delete(paperId); /* professor-owned paper with no other links — remove from the library too */
  }
  if (ui.expandedPaper === paperId) ui.expandedPaper = null;
  persist(); render(); toast('Paper removed.');
}

/* ============================== sorting / filtering ============================== */
export function collegeKey(p) { return norm(p.college) || 'unknown'; }
export function collegeBestRank(profs) {
  var best = null;
  profs.forEach(function (p) {
    if (typeof p.qsRank === 'number' && (best === null || p.qsRank < best)) best = p.qsRank;
  });
  return best;
}
export function filteredSorted() {
  var q = norm(ui.search);
  var anyFilter = ui.statusFilter !== 'all' || !!ui.tagFilter;
  var arr = state.professors.filter(function (p) {
    if (ui.favOnly && !p.fav) return false;
    var papers = p.papers || [];
    if (anyFilter && !papers.some(paperPasses)) return false;
    if (!q) return true;
    var hay = norm([p.name, p.title, p.department, p.college, (p.areas || []).join(' '), p.bio].join(' '));
    if (hay.indexOf(q) !== -1) return true;
    return papers.some(function (pp) {
      return norm([pp.title, pp.venue, pp.authors, (pp.tags || []).join(' ')].join(' ')).indexOf(q) !== -1;
    });
  });
  if (ui.sort === 'name') {
    arr.sort(function (a, b) { return (b.fav ? 1 : 0) - (a.fav ? 1 : 0) || a.name.localeCompare(b.name); });
  } else if (ui.sort === 'papers') {
    arr.sort(function (a, b) { return (b.fav ? 1 : 0) - (a.fav ? 1 : 0) || (b.papers || []).length - (a.papers || []).length || a.name.localeCompare(b.name); });
  } else if (ui.sort === 'recent') {
    arr.sort(function (a, b) { return (b.fav ? 1 : 0) - (a.fav ? 1 : 0) || String(b.createdAt || '').localeCompare(String(a.createdAt || '')); });
  } else { /* qs — group by college, colleges ordered by best rank */
    var groups = {};
    arr.forEach(function (p) {
      var k = collegeKey(p);
      (groups[k] = groups[k] || []).push(p);
    });
    var order = Object.keys(groups).sort(function (ka, kb) {
      var ra = collegeBestRank(groups[ka]), rb = collegeBestRank(groups[kb]);
      var va = (ra === null ? Infinity : ra), vb = (rb === null ? Infinity : rb);
      return va - vb || ka.localeCompare(kb);
    });
    arr = [];
    order.forEach(function (k) {
      /* within a college: favorites first, then manual order (drag / Shift+J·K), then name */
      groups[k].sort(function (a, b) {
        var f = (b.fav ? 1 : 0) - (a.fav ? 1 : 0);
        if (f) return f;
        if (typeof a.order === 'number' && typeof b.order === 'number') return a.order - b.order;
        return a.name.localeCompare(b.name);
      });
      arr = arr.concat(groups[k]);
    });
  }
  return arr;
}
