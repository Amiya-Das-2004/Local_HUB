// ============================================================
// R&D Library — 00_State.js
// Central state vault + persistence + data operations for R&D.
// Extracted from public/js/storage.js (lines 8-222)
//            and public/js/papers.js (lines 11-1035)
// ============================================================

import { RD_LAYOUT, RD_GROUP_PALETTE, RD_ITEM_PALETTE, SeedDataJSON } from './03_Seed_Data.js';
import { uid, copyText } from './01_Utils.js';

export const STORE_KEY = 'rd_library_v1';

// Default empty datastructure
export function DefaultState() {
  return {
    rd: {
      version: 1,
      items: [],
      groups: [],
      groupOrder: [],
      itemOrder: [],
      links: [],
      ui: {
        activeTab: 'list',
        activeSection: 'ALL',
        columnCount: 2,
        search: '',
        typeFilter: 'ALL',
        statusFilter: 'ALL',
        starredOnly: false,
        queueOpen: false,
        queueOrder: [],
        queueSort: 'smart',
        collapsedSections: [],
        minimap: true,
        yearFilter: null,
        sortMode: 'year-desc',
        theme: 'dark',
        views: {
          timeline: { x: 0, y: 0, k: 1 },
          map: { x: 0, y: 0, k: 1 },
          group: { x: 0, y: 0, k: 1 }
        }
      },
      meta: {
        seededAt: null,
        exportedAt: null,
        exportCount: 0,
        embeddedExportedAt: null,
        onboarded: false,
        createdAt: new Date().toISOString()
      }
    }
  };
}

export function EmbeddedInitialData() {
  try {
    if (typeof window !== 'undefined' && window.__RD_INITIAL_DATA__) {
      return window.__RD_INITIAL_DATA__;
    }
    if (typeof document !== 'undefined') {
      const el = document.getElementById('RDData');
      if (el && el.textContent) {
        const parsed = JSON.parse(el.textContent);
        if (parsed && (parsed.rd || Array.isArray(parsed.items))) {
          return parsed.rd ? parsed : { rd: parsed };
        }
      }
    }
  } catch (e) { }
  return null;
}

export function NormalizeState(raw) {
  const def = DefaultState().rd;
  const out = def;
  if (raw && raw.rd) {
    Object.keys(def).forEach((k) => {
      if (raw.rd[k] !== undefined && raw.rd[k] !== null) out[k] = raw.rd[k];
    });
  }
  out.version = 1;
  out.items = Array.isArray(out.items) ? out.items : [];
  out.groups = Array.isArray(out.groups) ? out.groups : [];
  out.groupOrder = Array.isArray(out.groupOrder) ? out.groupOrder : [];
  out.itemOrder = Array.isArray(out.itemOrder) ? out.itemOrder : [];
  out.links = Array.isArray(out.links) ? out.links : [];
  out.ui = Object.assign(DefaultState().rd.ui, out.ui || {});
  if (!Array.isArray(out.ui.queueOrder)) out.ui.queueOrder = [];
  if (['smart', 'added-desc', 'year-asc', 'year-desc', 'title', 'venue'].indexOf(out.ui.queueSort) === -1) out.ui.queueSort = 'smart';
  if (!Array.isArray(out.ui.collapsedSections)) out.ui.collapsedSections = [];
  out.ui.minimap = out.ui.minimap !== false;
  out.ui.views = Object.assign(DefaultState().rd.ui.views, out.ui.views || {});
  out.meta = Object.assign(DefaultState().rd.meta, out.meta || {});

  const now = new Date().toISOString();
  out.items = out.items.map((it) => ({
    id: it.id || uid('it'),
    type: ['paper', 'book', 'thesis'].includes(it.type) ? it.type : 'paper',
    title: it.title || 'Untitled',
    authors: Array.isArray(it.authors)
      ? it.authors
      : (it.authors ? String(it.authors).split(/;|\s+and\s+/i) : []),
    journal: it.journal || '',
    volume: it.volume || '',
    issue: it.issue || '',
    pages: it.pages || '',
    year: it.year ? Number(it.year) : null,
    publisher: it.publisher || '',
    doi: it.doi || '',
    url: it.url || '',
    bibtexKey: it.bibtexKey || '',
    status: ['unread', 'reading', 'read'].includes(it.status) ? it.status : 'unread',
    progress: (typeof it.progress === 'number' && isFinite(it.progress))
      ? Math.min(100, Math.max(0, Math.round(it.progress)))
      : 0,
    starred: !!it.starred,
    important: !!it.important,
    notes: typeof it.notes === 'string' ? it.notes : '',
    color: typeof it.color === 'string' ? it.color : '',
    tags: Array.isArray(it.tags) ? it.tags : [],
    groupId: it.groupId || null,
    positions: Object.assign({ timeline: null, map: null, group: null }, it.positions || {}),
    createdAt: it.createdAt || now,
    updatedAt: it.updatedAt || now
  })).map((it) => ({ ...it, authors: it.authors.map((a) => String(a).trim()).filter(Boolean) }));

  out.groups = out.groups.map((g) => ({
    id: g.id || uid('grp'),
    name: g.name || 'Group',
    color: g.color || '#8b6dff',
    x: typeof g.x === 'number' ? g.x : null,
    y: typeof g.y === 'number' ? g.y : null
  }));

  out.links = out.links.map((l) => ({
    id: l.id || uid('lnk'),
    from: l.from || l.source || null,
    fromAnchor: l.fromAnchor || 'a-e',
    to: l.to || l.target || null,
    toAnchor: l.toAnchor || 'a-w',
    label: l.label || '',
    style: l.style || 'curve',
    shape: l.shape || 'capsule',
    direction: l.direction || 'forward',
    color: l.color || '#8b6dff'
  })).filter((l) => l.from && l.to);

  const itemIds = new Set(out.items.map((i) => i.id));
  out.itemOrder = out.itemOrder.filter((id) => itemIds.has(id));
  out.items.forEach((i) => { if (!out.itemOrder.includes(i.id)) out.itemOrder.push(i.id); });
  const groupIds = new Set(out.groups.map((g) => g.id));
  out.groupOrder = out.groupOrder.filter((id) => groupIds.has(id));
  out.groups.forEach((g) => { if (!out.groupOrder.includes(g.id)) out.groupOrder.push(g.id); });
  out.items.forEach((i) => { if (i.groupId && !groupIds.has(i.groupId)) i.groupId = null; });
  out.links = out.links.filter((l) => itemIds.has(l.from) && itemIds.has(l.to));

  return { rd: out };
}

// Master state objects
export var state = DefaultState();
export var ui = state.rd.ui;
let PersistCb = null;

export function replaceState(next) {
  state = next;
  ui = state.rd.ui;
}

export function OnPersist(cb) {
  PersistCb = cb;
}

export function persist(silent) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ rd: state.rd }));
  } catch (e) {
    console.warn('[R&D] Could not persist state:', e);
  }
  if (typeof window !== 'undefined') {
    try { window.RDState = state; } catch (e) { }
  }
  syncVault();
  if (!silent && PersistCb) PersistCb();
}

export function syncVault() {
  if (typeof document === 'undefined') return;
  const el = document.getElementById('RDData');
  if (el) {
    el.textContent = '\n' + JSON.stringify(state.rd, null, 2).replace(/</g, '\\u003c') + '\n';
  }
}

export function loadState() {
  const embedded = EmbeddedInitialData();
  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
  } catch (e) {
    stored = null;
  }

  if (stored && stored.rd) {
    state = NormalizeState(stored);
    ui = state.rd.ui;
    if (
      embedded && embedded.rd && embedded.rd.meta && embedded.rd.meta.exportedAt &&
      state.rd.meta.exportedAt && embedded.rd.meta.exportedAt > state.rd.meta.exportedAt &&
      embedded.rd.meta.exportedAt !== state.rd.meta.embeddedExportedAt
    ) {
      state.__pendingEmbedded = embedded;
    }
    return state;
  }

  if (embedded && embedded.rd) {
    state = NormalizeState(embedded);
    ui = state.rd.ui;
    return state;
  }

  state = DefaultState();
  ui = state.rd.ui;
  return state;
}

export function Clear() {
  try { localStorage.removeItem(STORE_KEY); } catch (e) { }
}

export function ExportSnapshot() {
  return JSON.stringify({ rd: state.rd }, null, 2);
}

export function ParseSnapshot(text) {
  const obj = JSON.parse(text);
  if (!obj || !obj.rd || !Array.isArray(obj.rd.items)) {
    throw new Error('Not a valid R&D library file (missing "rd" data).');
  }
  return NormalizeState(obj);
}

// ---------- Operations on papers/items ----------

export function SyncProgressStatus(fields) {
  if (typeof fields.progress === 'number' && isFinite(fields.progress)) {
    fields.progress = Math.min(100, Math.max(0, Math.round(fields.progress)));
    if (fields.progress >= 100) fields.status = 'read';
    else if (fields.progress > 0 && fields.status === 'unread') fields.status = 'reading';
  }
  if (fields.status === 'read') fields.progress = 100;
  if (fields.status === 'unread') fields.progress = 0;
  return fields;
}

export function CreateItem(fields) {
  const now = new Date().toISOString();
  SyncProgressStatus(fields);
  return {
    id: uid('it'),
    type: ['paper', 'book', 'thesis'].includes(fields.type) ? fields.type : 'paper',
    title: (fields.title || '').trim() || 'Untitled',
    authors: Array.isArray(fields.authors) ? fields.authors : [],
    journal: fields.journal || '',
    volume: fields.volume || '',
    issue: fields.issue || '',
    pages: fields.pages || '',
    year: fields.year ? Number(fields.year) : null,
    publisher: fields.publisher || '',
    doi: fields.doi || '',
    url: fields.url || '',
    bibtexKey: fields.bibtexKey || '',
    status: ['unread', 'reading', 'read'].includes(fields.status) ? fields.status : 'unread',
    progress: typeof fields.progress === 'number' ? fields.progress : 0,
    starred: !!fields.starred,
    important: !!fields.important,
    notes: typeof fields.notes === 'string' ? fields.notes : '',
    color: typeof fields.color === 'string' ? fields.color : '',
    tags: Array.isArray(fields.tags) ? fields.tags : [],
    groupId: fields.groupId || null,
    positions: { timeline: null, map: null, group: null },
    createdAt: now,
    updatedAt: now
  };
}

export function AddItem(fields, opts) {
  const o = opts || {};
  const item = CreateItem(fields);
  if (o.groupId !== undefined) item.groupId = o.groupId;
  if (o.positions) {
    ['timeline', 'map', 'group'].forEach((v) => {
      if (o.positions[v]) item.positions[v] = o.positions[v];
    });
  }
  EnsureDefaultsForItem(item);
  state.rd.items.push(item);
  if (o.atTop) state.rd.itemOrder.unshift(item.id);
  else state.rd.itemOrder.push(item.id);
  persist();
  return item;
}

export function UpdateItem(id, patch, opts) {
  const item = GetItem(id);
  if (!item) return null;
  const allowed = ['type', 'title', 'authors', 'journal', 'volume', 'issue', 'pages',
    'year', 'publisher', 'doi', 'url', 'bibtexKey', 'status', 'starred', 'important',
    'notes', 'color', 'tags', 'groupId', 'progress'];
  allowed.forEach((k) => {
    if (patch[k] !== undefined) item[k] = patch[k];
  });
  if (patch.year !== undefined) item.year = patch.year ? Number(patch.year) : null;
  if (patch.progress !== undefined || patch.status !== undefined) {
    const synced = SyncProgressStatus({ progress: item.progress, status: item.status });
    item.progress = synced.progress;
    item.status = synced.status;
  }
  item.updatedAt = new Date().toISOString();
  persist(opts && opts.silent);
  return item;
}

export function DeleteItem(id) {
  const idx = state.rd.items.findIndex((i) => i.id === id);
  if (idx === -1) return false;
  state.rd.items.splice(idx, 1);
  state.rd.itemOrder = state.rd.itemOrder.filter((x) => x !== id);
  state.rd.links = state.rd.links.filter((l) => l.from !== id && l.to !== id);
  persist();
  return true;
}

export function DuplicateItem(id) {
  const src = GetItem(id);
  if (!src) return null;
  const copy = JSON.parse(JSON.stringify(src));
  copy.id = uid('it');
  copy.title = src.title + ' (copy)';
  copy.bibtexKey = '';
  copy.status = 'unread';
  copy.createdAt = new Date().toISOString();
  copy.updatedAt = copy.createdAt;
  copy.positions = { timeline: null, map: null, group: null };
  state.rd.items.push(copy);
  state.rd.itemOrder.push(copy.id);
  persist();
  return copy;
}

export function GetItem(id) {
  return state.rd.items.find((i) => i.id === id) || null;
}

export function GetAllItems() {
  return state.rd.items;
}

export function CycleItemStatus(id) {
  const item = GetItem(id);
  if (!item) return null;
  item.status = item.status === 'unread' ? 'reading' : item.status === 'reading' ? 'read' : 'unread';
  if (item.status === 'read') item.progress = 100;
  if (item.status === 'reading' && (item.progress || 0) === 0) item.progress = 10;
  if (item.status === 'unread') item.progress = 0;
  item.updatedAt = new Date().toISOString();
  persist();
  return item;
}

export function ToggleStar(id) {
  const item = GetItem(id);
  if (!item) return null;
  item.starred = !item.starred;
  persist();
  return item;
}

export function SetItemPosition(id, view, x, y, opts) {
  const item = GetItem(id);
  if (!item) return null;
  if (!item.positions[view]) item.positions[view] = { x: 0, y: 0 };
  item.positions[view].x = Math.round(x);
  item.positions[view].y = Math.round(y);
  persist(opts && opts.silent);
  return item;
}

export function EnsureDefaultsForItem(item) {
  if (!item.positions.timeline) item.positions.timeline = DefaultTimelinePosFor(item);
  if (!item.positions.map) item.positions.map = DefaultMapPosFor(item);
  if (!item.positions.group) item.positions.group = DefaultGroupPosFor(item);
}

export function EnsureAllDefaults() {
  state.rd.items.forEach(EnsureDefaultsForItem);
  state.rd.groups.forEach((g, i) => {
    if (g.x === null || g.y === null) {
      g.x = RD_LAYOUT.GRP.X0 + i * (RD_LAYOUT.GRP.BOX_W + RD_LAYOUT.GRP.BOX_GAP);
      g.y = RD_LAYOUT.GRP.Y0;
    }
  });
}

export function TimelineColumns() {
  const years = [];
  const byYear = {};
  state.rd.items.forEach((it) => {
    const y = it.year || '????';
    if (!byYear[y]) { byYear[y] = []; years.push(y); }
    byYear[y].push(it);
  });
  years.sort((a, b) => {
    if (a === '????') return -1;
    if (b === '????') return 1;
    return a - b;
  });
  return years.map((y) => ({ year: y, items: byYear[y] }));
}

export function DefaultTimelinePosFor(item) {
  const cols = TimelineColumns();
  let ci = 0, ri = 0;
  for (let i = 0; i < cols.length; i++) {
    const j = cols[i].items.findIndex((x) => x.id === item.id);
    if (j !== -1) { ci = i; ri = j; break; }
  }
  return {
    x: RD_LAYOUT.TL.X0 + ci * RD_LAYOUT.TL.GAP,
    y: RD_LAYOUT.TL.CARD_Y0 + ri * RD_LAYOUT.TL.ROW_H
  };
}

export function DefaultMapPosFor(item) {
  const n = state.rd.items.length || 1;
  const cols = Math.max(3, Math.ceil(Math.sqrt(n) + 1));
  const idx = state.rd.items.indexOf(item);
  return {
    x: RD_LAYOUT.MAP.X0 + (idx % cols) * RD_LAYOUT.MAP.COL_W,
    y: RD_LAYOUT.MAP.Y0 + Math.floor(idx / cols) * RD_LAYOUT.MAP.ROW_H
  };
}

export function DefaultGroupPosFor(item) {
  if (item.groupId) {
    const g = GetGroup(item.groupId);
    if (g) {
      const members = state.rd.items.filter((i) => i.groupId === g.id);
      const j = members.indexOf(item);
      return {
        x: g.x + 20 + (j % 2) * 224,
        y: g.y + 64 + Math.floor(j / 2) * RD_LAYOUT.CARD_STEP
      };
    }
  }
  const loose = state.rd.items.filter((i) => !i.groupId);
  const j = loose.indexOf(item);
  return { x: RD_LAYOUT.GRP.X0 + (j % 4) * 260, y: RD_LAYOUT.UNSORTED_Y + Math.floor(j / 4) * RD_LAYOUT.CARD_STEP };
}

export function RelayoutAll(view) {
  state.rd.items.forEach((it) => {
    if (view === 'timeline') it.positions.timeline = DefaultTimelinePosFor(it);
    if (view === 'map') it.positions.map = DefaultMapPosFor(it);
    if (view === 'group') it.positions.group = DefaultGroupPosFor(it);
  });
  if (view === 'group') {
    state.rd.groups.forEach((g, i) => {
      g.x = RD_LAYOUT.GRP.X0 + i * (RD_LAYOUT.GRP.BOX_W + RD_LAYOUT.GRP.BOX_GAP);
      g.y = RD_LAYOUT.GRP.Y0;
    });
  }
  persist();
}

export function ReorderItemBefore(itemId, targetItemId, newGroupId) {
  const oldPos = state.rd.itemOrder.indexOf(itemId);
  if (oldPos !== -1) state.rd.itemOrder.splice(oldPos, 1);
  if (targetItemId) {
    const tPos = state.rd.itemOrder.indexOf(targetItemId);
    if (tPos === -1) state.rd.itemOrder.push(itemId);
    else state.rd.itemOrder.splice(tPos, 0, itemId);
  } else {
    state.rd.itemOrder.push(itemId);
  }
  if (newGroupId !== undefined) {
    const item = GetItem(itemId);
    if (item) item.groupId = newGroupId || null;
  }
  persist();
}

export function SetGroupOrder(ids) {
  state.rd.groupOrder = ids.filter((id) => GetGroup(id));
  state.rd.groups.forEach((g) => { if (!state.rd.groupOrder.includes(g.id)) state.rd.groupOrder.push(g.id); });
  persist();
}

export function AddGroup(name, color) {
  const count = state.rd.groups.length;
  const group = {
    id: uid('grp'),
    name: (name || '').trim() || ('Group ' + (count + 1)),
    color: color || RD_GROUP_PALETTE[count % RD_GROUP_PALETTE.length],
    x: RD_LAYOUT.GRP.X0 + count * (RD_LAYOUT.GRP.BOX_W + RD_LAYOUT.GRP.BOX_GAP),
    y: RD_LAYOUT.GRP.Y0
  };
  state.rd.groups.push(group);
  state.rd.groupOrder.push(group.id);
  persist();
  return group;
}

export function UpdateGroup(id, patch) {
  const g = GetGroup(id);
  if (!g) return null;
  ['name', 'color', 'x', 'y'].forEach((k) => {
    if (patch[k] !== undefined) g[k] = patch[k];
  });
  persist();
  return g;
}

export function DeleteGroup(id) {
  const idx = state.rd.groups.findIndex((g) => g.id === id);
  if (idx === -1) return false;
  state.rd.groups.splice(idx, 1);
  state.rd.groupOrder = state.rd.groupOrder.filter((x) => x !== id);
  state.rd.items.forEach((i) => { if (i.groupId === id) i.groupId = null; });
  if (state.rd.ui.activeSection === id) state.rd.ui.activeSection = 'ALL';
  persist();
  return true;
}

export function GetGroup(id) {
  return state.rd.groups.find((g) => g.id === id) || null;
}

export function GetAllGroups() {
  return state.rd.groups;
}

export function SetGroupPosition(id, x, y, dx, dy, opts) {
  const g = GetGroup(id);
  if (!g) return;
  g.x = Math.round(x);
  g.y = Math.round(y);
  state.rd.items.forEach((i) => {
    if (i.groupId === id && i.positions.group) {
      i.positions.group.x = Math.round(i.positions.group.x + (dx || 0));
      i.positions.group.y = Math.round(i.positions.group.y + (dy || 0));
    }
  });
  persist(opts && opts.silent);
}

export function AssignItemToGroup(itemId, groupId, opts) {
  const item = GetItem(itemId);
  if (!item) return null;
  item.groupId = groupId || null;
  item.updatedAt = new Date().toISOString();
  if (!(opts && opts.skipPosition)) {
    item.positions.group = DefaultGroupPosFor(item);
  }
  persist();
  return item;
}

export function AddLink(from, to, fromAnchor, toAnchor, label, opts) {
  if (!from || !to || from === to) return null;
  const exists = state.rd.links.find((l) =>
    (l.from === from && l.to === to) || (l.from === to && l.to === from));
  if (exists) return exists;
  const o = opts || {};
  const link = {
    id: uid('lnk'),
    from,
    fromAnchor: fromAnchor || 'a-e',
    to,
    toAnchor: toAnchor || 'a-w',
    label: label || o.label || '',
    style: o.style || 'curve',
    shape: o.shape || 'capsule',
    direction: o.direction || 'forward',
    color: o.color || '#8b6dff'
  };
  state.rd.links.push(link);
  persist();
  return link;
}

export function GetLink(id) {
  return state.rd.links.find((l) => l.id === id) || null;
}

export function UpdateLink(id, patch) {
  const l = GetLink(id);
  if (!l || !patch) return null;
  ['label', 'style', 'shape', 'direction', 'color', 'fromAnchor', 'toAnchor'].forEach((k) => {
    if (patch[k] !== undefined) l[k] = patch[k];
  });
  persist();
  return l;
}

export function DeleteLink(id) {
  const before = state.rd.links.length;
  state.rd.links = state.rd.links.filter((l) => l.id !== id);
  if (state.rd.links.length !== before) { persist(); return true; }
  return false;
}

export function GetLinks() {
  return state.rd.links;
}

export function MatchesFilters(item) {
  const u = state.rd.ui;
  if (u.starredOnly && !item.starred) return false;
  if (u.typeFilter !== 'ALL' && item.type !== u.typeFilter) return false;
  if (u.statusFilter !== 'ALL' && item.status !== u.statusFilter) return false;
  if (u.yearFilter && String(item.year || '????') !== String(u.yearFilter)) return false;
  if (u.activeSection === 'UNSORTED' && item.groupId) return false;
  if (u.activeSection !== 'ALL' && u.activeSection !== 'UNSORTED' && item.groupId !== u.activeSection) return false;
  const q = (u.search || '').toLowerCase().trim();
  if (q) {
    const hay = [
      item.title, item.journal, item.publisher, item.doi,
      (item.authors || []).join(' '),
      (item.tags || []).join(' '),
      item.year ? String(item.year) : ''
    ].join(' ').toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

export function SortedItems(items) {
  const mode = state.rd.ui.sortMode || 'year-desc';
  const arr = [...items];
  const y = (i) => (i.year === null || i.year === undefined ? -9999 : i.year);
  const firstAuthor = (i) => (i.authors && i.authors[0] ? String(i.authors[0]).toLowerCase() : '');
  switch (mode) {
    case 'year-asc': arr.sort((a, b) => y(a) - y(b)); break;
    case 'title-asc': arr.sort((a, b) => a.title.localeCompare(b.title)); break;
    case 'added-desc': arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
    case 'author-asc': arr.sort((a, b) => firstAuthor(a).localeCompare(firstAuthor(b))); break;
    case 'year-desc':
    default: arr.sort((a, b) => y(b) - y(a)); break;
  }
  return arr;
}

export function VisibleItems() {
  return SortedItems(state.rd.items.filter(MatchesFilters));
}

export const QUEUE_SORTS = ['smart', 'added-desc', 'year-asc', 'year-desc', 'title', 'venue'];

export function QueueItems() {
  const active = state.rd.items.filter((i) => i.status === 'reading' || i.status === 'unread');
  const mode = QUEUE_SORTS.indexOf(state.rd.ui.queueSort) !== -1 ? state.rd.ui.queueSort : 'smart';
  if (mode !== 'smart') {
    const cmp = {
      'added-desc': (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)),
      'year-asc': (a, b) => (a.year || 9999) - (b.year || 9999),
      'year-desc': (a, b) => (b.year || 0) - (a.year || 0),
      'title': (a, b) => String(a.title).localeCompare(String(b.title)),
      'venue': (a, b) => String(a.journal || a.publisher || '').localeCompare(String(b.journal || b.publisher || '')) || (b.year || 0) - (a.year || 0)
    }[mode];
    return active.slice().sort(cmp);
  }
  const byId = new Map(active.map((i) => [i.id, i]));
  const result = [];
  (state.rd.ui.queueOrder || []).forEach((id) => {
    const it = byId.get(id);
    if (it) { result.push(it); byId.delete(id); }
  });
  const score = (i) => {
    let s = 0;
    if (i.status === 'reading') s -= 10000;
    s -= (i.progress || 0) * 10;
    if (i.starred) s -= 5000;
    if (i.important) s -= 1000;
    s += (i.year ? i.year : 9999);
    return s;
  };
  const rest = [...byId.values()].sort((a, b) => score(a) - score(b));
  return result.concat(rest);
}

export function SetQueueSort(mode) {
  state.rd.ui.queueSort = QUEUE_SORTS.indexOf(mode) !== -1 ? mode : 'smart';
  persist();
  return state.rd.ui.queueSort;
}

export function SetQueueOrder(ids) {
  const activeIds = new Set(
    state.rd.items.filter((i) => i.status === 'reading' || i.status === 'unread').map((i) => i.id)
  );
  const seen = new Set();
  state.rd.ui.queueOrder = (ids || []).filter((id) => activeIds.has(id) && !seen.has(id) && seen.add(id));
  persist();
}

export function RenameTag(from, to) {
  const src = String(from || '').replace(/^#/, '').trim().toLowerCase();
  const dst = String(to || '').replace(/^#/, '').trim();
  if (!src || !dst) return -1;
  let touched = 0;
  state.rd.items.forEach((it) => {
    if (!Array.isArray(it.tags) || !it.tags.length) return;
    let changed = false;
    const next = it.tags.map((t) => {
      if (String(t).replace(/^#/, '').trim().toLowerCase() === src) { changed = true; return dst; }
      return t;
    });
    if (changed) {
      it.tags = Array.from(new Set(next));
      it.updatedAt = new Date().toISOString();
      touched++;
    }
  });
  if (touched) persist();
  return touched;
}

export function LinkedItems(id) {
  const out = [];
  state.rd.links.forEach((l) => {
    if (l.from === id) {
      const other = GetItem(l.to);
      if (other) out.push({ other, dir: 'out', fromAnchor: l.fromAnchor, toAnchor: l.toAnchor });
    } else if (l.to === id) {
      const other = GetItem(l.from);
      if (other) out.push({ other, dir: 'in', fromAnchor: l.fromAnchor, toAnchor: l.toAnchor });
    }
  });
  return out;
}

export function ItemsBySection() {
  const visible = VisibleItems();
  const sections = [];
  if (state.rd.ui.activeSection === 'ALL' || state.rd.groups.some((g) => g.id === state.rd.ui.activeSection)) {
    state.rd.groupOrder.forEach((gid) => {
      const g = GetGroup(gid);
      if (!g) return;
      if (state.rd.ui.activeSection !== 'ALL' && state.rd.ui.activeSection !== gid) return;
      const inGroup = visible.filter((i) => i.groupId === gid);
      inGroup.sort((a, b) => state.rd.itemOrder.indexOf(a.id) - state.rd.itemOrder.indexOf(b.id));
      sections.push({ group: g, items: inGroup });
    });
  }
  if (state.rd.ui.activeSection === 'ALL' || state.rd.ui.activeSection === 'UNSORTED') {
    const loose = visible.filter((i) => !i.groupId);
    loose.sort((a, b) => state.rd.itemOrder.indexOf(a.id) - state.rd.itemOrder.indexOf(b.id));
    sections.push({ group: null, items: loose });
  }
  return sections;
}

export function Stats() {
  const items = state.rd.items;
  const read = items.filter((i) => i.status === 'read').length;
  return {
    total: items.length,
    papers: items.filter((i) => i.type === 'paper').length,
    books: items.filter((i) => i.type === 'book').length,
    theses: items.filter((i) => i.type === 'thesis').length,
    read,
    reading: items.filter((i) => i.status === 'reading').length,
    unread: items.filter((i) => i.status === 'unread').length,
    starred: items.filter((i) => i.starred).length,
    avgProgress: items.length ? Math.round(items.reduce((s, i) => s + (i.progress || 0), 0) / items.length) : 0,
    groups: state.rd.groups.length,
    links: state.rd.links.length
  };
}

export function NormKey(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function FindDuplicates(fields, excludeId) {
  const doi = NormKey(String(fields.doi || '').replace(/^https?:\/(dx\.)?doi\.org\//i, '').replace(/^doi:/i, ''));
  const title = NormKey(fields.title);
  const bib = NormKey(fields.bibtexKey);
  if (!doi && !title && !bib) return [];
  return state.rd.items.filter((it) => {
    if (excludeId && it.id === excludeId) return false;
    if (doi && it.doi && NormKey(it.doi) === doi) return true;
    if (title && NormKey(it.title) === title) return true;
    if (bib && it.bibtexKey && NormKey(it.bibtexKey) === bib) return true;
    return false;
  });
}

export function FindDuplicateClusters() {
  const parent = new Map();
  state.rd.items.forEach((it) => parent.set(it.id, it.id));
  const find = (x) => {
    while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); }
    return x;
  };
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent.set(rb, ra); };
  const byDoi = new Map(), byTitle = new Map();
  const reasons = new Map();
  state.rd.items.forEach((it) => {
    const d = NormKey(String(it.doi || '').replace(/^https?:\/\/((dx\.)?doi\.org)\//i, '').replace(/^doi:/i, ''));
    const t = NormKey(it.title);
    if (d) {
      if (byDoi.has(d)) { union(byDoi.get(d), it.id); reasons.set(find(it.id), (reasons.get(find(it.id)) === 'title' ? 'doi+title' : 'doi')); }
      else byDoi.set(d, it.id);
    }
    if (t) {
      if (byTitle.has(t)) { union(byTitle.get(t), it.id); reasons.set(find(it.id), (reasons.get(find(it.id)) === 'doi' ? 'doi+title' : 'title')); }
      else byTitle.set(t, it.id);
    }
  });
  const clusters = new Map();
  state.rd.items.forEach((it) => {
    const root = find(it.id);
    if (!clusters.has(root)) clusters.set(root, []);
    clusters.get(root).push(it);
  });
  const out = [];
  clusters.forEach((members, root) => {
    if (members.length < 2) return;
    out.push({ reason: reasons.get(root) || 'title', items: members });
  });
  out.sort((a, b) =>
    (b.reason.indexOf('doi') !== -1) - (a.reason.indexOf('doi') !== -1) ||
    b.items.length - a.items.length ||
    String(a.items[0].createdAt).localeCompare(String(b.items[0].createdAt))
  );
  return out;
}

export function MergeItems(primaryId, secondaryIds, choices) {
  const ch = choices || {};
  const primary = GetItem(primaryId);
  if (!primary) return null;
  const secondaries = (secondaryIds || []).map((id) => GetItem(id)).filter(Boolean);
  if (!secondaries.length) return primary;

  const pickField = (name) => {
    const want = ch.fields && ch.fields[name];
    if (want && want !== 'primary') {
      const sec = secondaries.find((s) => 'sec:' + s.id === want);
      if (sec && String(sec[name] !== null && sec[name] !== undefined ? sec[name] : '') !== '') return sec[name];
    }
    const pv = primary[name];
    if (pv !== null && pv !== undefined && String(pv) !== '' && !(Array.isArray(pv) && !pv.length)) return pv;
    for (const s of secondaries) {
      const sv = s[name];
      if (sv !== null && sv !== undefined && String(sv) !== '' && !(Array.isArray(sv) && !sv.length)) return sv;
    }
    return pv;
  };

  ['title', 'journal', 'volume', 'issue', 'pages', 'year', 'publisher', 'doi', 'url', 'bibtexKey', 'type']
    .forEach((f) => { primary[f] = pickField(f); });
  primary.authors = pickField('authors') || [];

  const statusWant = ch.status && ch.status !== 'primary'
    ? secondaries.find((s) => 'sec:' + s.id === ch.status) : null;
  const statusSrc = statusWant || [primary].concat(secondaries)
    .sort((a, b) => ({ read: 2, reading: 1, unread: 0 }[b.status] - { read: 2, reading: 1, unread: 0 }[a.status] || (b.progress || 0) - (a.progress || 0)))[0];
  primary.status = statusSrc.status;
  primary.progress = statusSrc.progress || 0;

  primary.starred = [primary].concat(secondaries).some((i) => i.starred);
  primary.important = [primary].concat(secondaries).some((i) => i.important);

  const seenTags = new Map();
  [primary].concat(secondaries).forEach((i) => (i.tags || []).forEach((t) => {
    const k = String(t).toLowerCase();
    if (!seenTags.has(k)) seenTags.set(k, t);
  }));
  primary.tags = [...seenTags.values()];

  if (ch.appendNotes) {
    const srcs = Array.isArray(ch.appendNotesFrom)
      ? secondaries.filter((s) => ch.appendNotesFrom.indexOf(s.id) !== -1)
      : secondaries;
    const extra = srcs.map((s) => String(s.notes || '').trim()).filter(Boolean);
    if (extra.length) {
      const base = String(primary.notes || '').trim();
      primary.notes = (base ? base + '\n\n---\n\n' : '') + extra.join('\n\n---\n\n');
    }
  }

  ['timeline', 'map', 'group'].forEach((view) => {
    if (!primary.positions[view]) {
      const donor = secondaries.find((s) => s.positions && s.positions[view]);
      if (donor) primary.positions[view] = donor.positions[view];
    }
  });

  [primary].concat(secondaries).forEach((i) => {
    if (i.createdAt && (!primary.createdAt || i.createdAt < primary.createdAt)) primary.createdAt = i.createdAt;
  });

  const gone = new Set(secondaries.map((s) => s.id));
  state.rd.links.forEach((l) => {
    if (gone.has(l.from)) l.from = primary.id;
    if (gone.has(l.to)) l.to = primary.id;
  });
  state.rd.links = state.rd.links.filter((l, idx, arr) =>
    l.from !== l.to && arr.findIndex((o) => o.from === l.from && o.to === l.to && o.fromAnchor === l.fromAnchor && o.toAnchor === l.toAnchor) === idx
  );
  secondaries.forEach((s) => {
    const idx = state.rd.items.findIndex((i) => i.id === s.id);
    if (idx !== -1) state.rd.items.splice(idx, 1);
    state.rd.itemOrder = state.rd.itemOrder.filter((x) => x !== s.id);
  });
  state.rd.ui.queueOrder = (state.rd.ui.queueOrder || []).filter((id) => !gone.has(id));

  primary.updatedAt = new Date().toISOString();
  persist();
  return primary;
}

export function AddItems(fieldsList, opts) {
  const o = opts || {};
  const created = [];
  (fieldsList || []).forEach((fields) => {
    const item = CreateItem(fields);
    if (o.groupId !== undefined) item.groupId = o.groupId;
    EnsureDefaultsForItem(item);
    state.rd.items.push(item);
    state.rd.itemOrder.push(item.id);
    created.push(item);
  });
  if (created.length) persist();
  return created;
}

export function BulkUpdate(ids, patch) {
  const idSet = new Set(ids || []);
  let touched = 0;
  state.rd.items.forEach((it) => {
    if (!idSet.has(it.id)) return;
    if (patch.status !== undefined || patch.progress !== undefined) {
      const synced = SyncProgressStatus({ progress: patch.progress !== undefined ? patch.progress : it.progress, status: patch.status !== undefined ? patch.status : it.status });
      it.progress = synced.progress;
      it.status = synced.status;
    }
    if (patch.starred !== undefined) it.starred = !!patch.starred;
    if (typeof patch.color === 'string') it.color = patch.color;
    if (patch.groupId !== undefined) {
      it.groupId = patch.groupId;
      if (patch.groupId) EnsureDefaultsForItem(it);
    }
    if (Array.isArray(patch.tags)) it.tags = patch.tags.slice();
    it.updatedAt = new Date().toISOString();
    touched++;
  });
  if (touched) persist();
  return touched;
}

export function BulkDelete(ids) {
  const idSet = new Set(ids || []);
  const before = state.rd.items.length;
  state.rd.items = state.rd.items.filter((i) => !idSet.has(i.id));
  state.rd.itemOrder = state.rd.itemOrder.filter((x) => !idSet.has(x));
  state.rd.links = state.rd.links.filter((l) => !idSet.has(l.from) && !idSet.has(l.to));
  const removed = before - state.rd.items.length;
  if (removed) persist();
  return removed;
}

export function ShortTitle(t) {
  return String(t || '').length > 38 ? String(t).slice(0, 38) + '…' : String(t || '');
}

export function HealthReport() {
  const issues = [];
  const push = (kind, severity, itemId, message) => issues.push({ kind, severity, itemId, message });

  const keyOwners = new Map();
  state.rd.items.forEach((it) => {
    if (!it.bibtexKey) return;
    const k = NormKey(it.bibtexKey);
    if (!k) return;
    if (!keyOwners.has(k)) keyOwners.set(k, []);
    keyOwners.get(k).push(it);
  });
  keyOwners.forEach((owners) => {
    if (owners.length < 2) return;
    owners.forEach((it) => push('key-clash', 'warn', it.id,
      'Citation key “' + it.bibtexKey + '” is shared by ' + owners.length + ' items'));
  });

  state.rd.items.forEach((it) => {
    if (!it.doi) push('no-doi', 'info', it.id, '“' + ShortTitle(it.title) + '” has no DOI');
    if (!it.bibtexKey) push('no-key', 'info', it.id, '“' + ShortTitle(it.title) + '” has no citation key');
    if (!it.year) push('no-year', 'warn', it.id, '“' + ShortTitle(it.title) + '” has no publication year (missing from the Timeline)');
    if (!it.groupId) push('no-group', 'info', it.id, '“' + ShortTitle(it.title) + '” is not in any group');
    if (!it.tags || !it.tags.length) push('no-tags', 'info', it.id, '“' + ShortTitle(it.title) + '” has no tags');
    if (!(it.authors || []).length) push('no-authors', 'warn', it.id, '“' + ShortTitle(it.title) + '” has no authors');
  });

  const emptyGroups = state.rd.groups.filter((g) => !state.rd.items.some((i) => i.groupId === g.id));
  emptyGroups.forEach((g) => push('empty-group', 'info', null, 'Group “' + g.name + '” is empty'));

  issues.sort((a, b) => (a.severity === 'warn' ? -1 : 1) - (b.severity === 'warn' ? -1 : 1));
  const warned = issues.filter((i) => i.severity === 'warn').length;
  return {
    issues,
    warns: warned,
    score: state.rd.items.length ? Math.max(0, Math.round((1 - warned / (state.rd.items.length * 0.6)) * 100)) : 100,
    total: issues.length
  };
}

export function SetUI(patch) {
  Object.assign(state.rd.ui, patch);
  persist();
}

export function SetView(view, patch) {
  Object.assign(state.rd.ui.views[view], patch);
  persist();
}

export function SeedDemoData() {
  const seed = SeedDataJSON();
  const keyToId = {};
  const now = new Date().toISOString();
  seed.groups.forEach((g) => {
    const group = AddGroup(g.name, g.color);
    keyToId['__group' + seed.groups.indexOf(g)] = group.id;
  });
  seed.items.forEach((si) => {
    const groupId = keyToId['__group' + si.groupIdx] || null;
    const item = CreateItem({
      type: si.type, title: si.title, authors: si.authors, journal: si.journal,
      volume: si.volume || '', issue: si.issue || '', pages: si.pages || '',
      year: si.year, publisher: si.publisher || '', tags: si.tags || [],
      status: si.status, starred: si.starred, important: si.important,
      bibtexKey: si.key || '', progress: si.progress || 0
    });
    item.groupId = groupId;
    state.rd.items.push(item);
    state.rd.itemOrder.push(item.id);
    keyToId[si.key] = item.id;
  });
  EnsureAllDefaults();
  seed.links.forEach((sl) => {
    if (keyToId[sl.fromKey] && keyToId[sl.toKey]) {
      state.rd.links.push({
        id: uid('lnk'),
        from: keyToId[sl.fromKey], fromAnchor: sl.fromAnchor,
        to: keyToId[sl.toKey], toAnchor: sl.toAnchor,
        label: ''
      });
    }
  });
  state.rd.meta.seededAt = now;
  persist();
}

export function ReplaceAll(newRd) {
  const normalized = NormalizeState({ rd: newRd });
  state.rd = normalized.rd;
  ui = state.rd.ui;
  persist();
}

// Backward-compatible namespace mirrors
export const RDStorage = {
  STORAGE_KEY: STORE_KEY,
  DefaultState,
  NormalizeState,
  EmbeddedInitialData,
  Load: loadState,
  Save: persist,
  Clear,
  ExportSnapshot,
  ParseSnapshot
};

export const RDPapers = {
  LAYOUT: RD_LAYOUT,
  Attach: (s) => { state = s; ui = s.rd.ui; },
  OnPersist,
  State: () => state.rd,
  Commit: persist,
  Uid: uid,
  SaveQuiet: () => persist(true),
  AddItem,
  AddItems,
  UpdateItem,
  DeleteItem,
  DuplicateItem,
  GetItem,
  GetAllItems,
  FindDuplicates,
  NormKey,
  BulkUpdate,
  BulkDelete,
  CycleItemStatus,
  ToggleStar,
  SetItemPosition,
  EnsureDefaultsForItem,
  EnsureAllDefaults,
  RelayoutAll,
  TimelineColumns,
  ReorderItemBefore,
  SetGroupOrder,
  AddGroup,
  UpdateGroup,
  DeleteGroup,
  GetGroup,
  GetAllGroups,
  SetGroupPosition,
  AssignItemToGroup,
  AddLink,
  DeleteLink,
  GetLinks,
  GetLink,
  UpdateLink,
  MatchesFilters,
  VisibleItems,
  ItemsBySection,
  Stats,
  QueueItems,
  SetQueueOrder,
  SetQueueSort,
  QUEUE_SORTS,
  FindDuplicateClusters,
  MergeItems,
  RenameTag,
  LinkedItems,
  HealthReport,
  ShortTitle,
  SetUI,
  SetView,
  SeedDemoData,
  SeedDataJSON,
  ReplaceAll,
  GROUP_PALETTE: RD_GROUP_PALETTE,
  ITEM_PALETTE: RD_ITEM_PALETTE
};

// Aliases and named exports for modular consumers
export const initState = loadState;
export const EnsureDefaults = EnsureAllDefaults;
export const Commit = persist;
export function SaveQuiet() { return persist(true); }
export const ITEM_PALETTE = RD_ITEM_PALETTE;
export const GROUP_PALETTE = RD_GROUP_PALETTE;
export { RD_LAYOUT };
