/* ==========================================================================
   PROFESSORS — 00_State.js
   Central state vault + persistence + data operations for ProffTrack.
   Extracted verbatim from workspace proff.html <script> IIFE.
   Source line references in Professors.md.
   ==========================================================================
*/

import { toast, uid, norm, todayISO, statusOf } from './01_Utils.js';
import { seedSamples } from './03_Seed_Data.js';
import { render } from './Professors.js';

export var STORE_KEY = 'profftrack:v1';

export var state = { version: 1, updatedAt: null, professors: [] };
export var ui = { sort: 'qs', paperSort: 'recent', search: '', statusFilter: 'all', tagFilter: null, collapsed: {}, kbIdx: -1, heatYear: null, expandedProf: null, expandedPaper: null, toastTimer: null, printMode: false, dragId: null, dragTarget: null, dragBelow: false, favOnly: false };

/* ES modules expose `state` as a read-only live binding to importers —
   reassignments (loadState / imports / clear-all) must go through here. */
export function replaceState(next) { state = next; }

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
    return;
  }
  if (stored && Array.isArray(stored.professors) && stored.professors.length === 0) {
    state = { version: 1, updatedAt: null, professors: [] }; /* user cleared it — respect that */
    return;
  }
  if (embedded && Array.isArray(embedded.professors) && embedded.professors.length === 0 && embedded.updatedAt) {
    state = { version: 1, updatedAt: null, professors: [] };
    return;
  }
  state = { version: 1, updatedAt: null, professors: seedSamples() };
  persist();
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
  state.professors.push(np);
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
  if (data.id) {
    for (var i = 0; i < p.papers.length; i++) {
      if (p.papers[i].id === data.id) { Object.assign(p.papers[i], data, { id: data.id }); persist(); return p.papers[i]; }
    }
  }
  var np = Object.assign({
    id: uid('pp'), authors: '', year: null, venue: '', url: '', readDate: todayISO(),
    rating: 4, tags: [], summary: '', notes: '', createdAt: new Date().toISOString()
  }, data);
  if (!np.id) np.id = uid('pp'); /* form passes id:null for new entries — never lose the generated id */
  p.papers.push(np);
  persist();
  return np;
}
export function deletePaper(profId, paperId) {
  var p = getProf(profId);
  if (!p) return;
  p.papers = p.papers.filter(function (x) { return x.id !== paperId; });
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
