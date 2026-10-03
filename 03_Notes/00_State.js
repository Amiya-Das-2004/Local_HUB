import { clearAllBlockHistory } from './Writing_Engine/Block_History.js';

export const DEFAULT_GLOBAL_MACROS = {
  equation: `\\newcommand{\\mb}[1]{\\mathbf{#1}}
\\newcommand{\\cancelto}[2]{\\htmlClass{lh-cancelto}{\\htmlClass{lh-cancelto-base}{#2}\\htmlClass{lh-cancelto-val}{\\scriptstyle #1}}}
\\newcommand{\\comment}[1]{\\textcolor{#dc2626|#f87171}{[#1]}}
\\newcommand{\\R}{\\mathbb{R}}
\\newcommand{\\C}{\\mathbb{C}}
\\newcommand{\\N}{\\mathbb{N}}
\\newcommand{\\Z}{\\mathbb{Z}}`,
  tikz: `\\usetikzlibrary{patterns, angles, calc, quotes, shapes, arrows, arrows.meta, positioning, intersections, fadings}
\\tikzset{
  blockv/.style={
    rectangle,
    draw,
    fill=blue!20,
    text centered,
    minimum height=2em,
    minimum width=7cm,
    rounded corners
  },
  blockh/.style={
    rectangle,
    draw,
    fill=blue!20,
    text width=3cm,
    text centered,
    rounded corners,
    minimum height=2cm
  },
  timeline/.style={
    draw=blue,
    thick,
    rounded rectangle,
    fill=white,
    text width=3.6cm,
    align=left,
    font=\\small
  },
  arrow/.style={
    ->,
    thick
  }
}`
};

// In-memory state holding notes, folders, tags, vault metadata, macros, custom templates, and the BibTeX library
export let NotesState = {
  vaultMeta: { title: "Notes Vault", version: "1.0.0" },
  globalMacros: { ...DEFAULT_GLOBAL_MACROS },
  tableTemplates: [],
  tikzTemplates: [],
  bibliography: [],
  citationStyle: 'numeric',
  folders: [],
  tags: [],
  notes: []
};

// Preserves a manually curated order (e.g. drag-reordered folders) and only appends newly seen values.
function mergeOrderedLists(existing, derived) {
  const base = Array.isArray(existing) ? existing.filter(Boolean) : [];
  const extra = (Array.isArray(derived) ? derived : []).filter(v => v && !base.includes(v));
  return [...base, ...extra];
}

// Validates note structure and fills missing fields with defaults
function sanitizeNote(n, idx = 0) {
  if (!n || typeof n !== 'object') {
    return {
      id: `note_${Date.now()}_${idx}`,
      title: 'Untitled Note',
      folder: 'General',
      tags: [],
      blocks: [],
      macros: { equation: '', tikz: '' },
      meta: { created: new Date().toISOString().slice(0, 10), author: 'User' }
    };
  }
  const note = {
    id: n.id || `note_${Date.now()}_${idx}`,
    slug: n.slug || (n.title ? n.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `note-${idx}`),
    title: n.title || 'Untitled Note',
    folder: n.folder || 'General',
    tags: Array.isArray(n.tags) ? n.tags : [],
    description: n.description || '',
    meta: n.meta || { created: new Date().toISOString().slice(0, 10), author: 'User' },
    flashcard: n.flashcard || null,
    blocks: Array.isArray(n.blocks) ? n.blocks : [],
    autoNumbering: n.autoNumbering || { h1: 'numeric', h2: 'numeric', h3: 'numeric' },
    logo: n.logo || null,
    macros: (n.macros && typeof n.macros === 'object') ? {
      equation: n.macros.equation || '',
      tikz: n.macros.tikz || ''
    } : { equation: '', tikz: '' }
  };
  migrateOrientationContainers(note);
  return note;
}

// One-time migration: legacy Multi-Column blocks embed children by value (block.cols[]).
// Hoist children to top-level blocks (right after the container) and reference them via
// members/rows so containers become non-destructive orientation layouts. Callout blocks
// keep their content string and simply gain members/rows when configured.
function migrateOrientationContainers(note) {
  if (!note || !Array.isArray(note.blocks)) return;
  const isContainerType = (b) => b && (b.type === 'columns' || b.type === 'multicolumn' || b.type === 'multi-column');

  for (let i = 0; i < note.blocks.length; i++) {
    const block = note.blocks[i];
    if (!isContainerType(block)) continue;

    if (Array.isArray(block.cols) && block.cols.length > 0) {
      // The old renderer auto-created empty text blocks as column padding — hoisting
      // those would litter the flow with "Empty text block" placeholders, so drop them.
      const children = block.cols
        .filter((c) => c && typeof c === 'object' && c.id)
        .filter((c) => !(c.type === 'text' && !(c.content || '').trim()));

      const merged = Array.isArray(block.members) ? block.members.slice() : [];
      children.forEach((child) => {
        if (!merged.includes(child.id)) merged.push(child.id);
      });
      block.members = merged;
      block.rows = [merged.slice()];

      delete block.cols;
      delete block.left;
      delete block.right;

      note.blocks.splice(i + 1, 0, ...children);
      i += children.length;
    } else {
      if (!Array.isArray(block.members)) block.members = [];
      if (!Array.isArray(block.rows) || block.rows.length === 0) block.rows = [block.members.slice()];
    }
  }
}

// Loads notes from HTML vault (#NotesData) and optionally recovers uncommitted edits from localStorage
export function LoadNotesState(forceReload = false) {
  // Reuse in-memory state if already loaded and not stale to avoid multi-MB JSON parsing on every route change
  if (!forceReload && NotesState.notes && NotesState.notes.length > 0) {
    try {
      const cached = typeof localStorage !== 'undefined' ? localStorage.getItem('NotesData_Local_Cache') : null;
      if (cached) {
        const parsedCache = JSON.parse(cached);
        const cacheTimestamp = parsedCache?._savedAt || 0;
        const currentTimestamp = NotesState.vaultMeta?.lastSaved || 0;
        if (cacheTimestamp <= currentTimestamp) {
          return NotesState;
        }
      } else {
        return NotesState;
      }
    } catch (e) {
      return NotesState;
    }
  }

  const dataBlock = typeof document !== 'undefined' ? document.getElementById('NotesData') : null;
  let domState = null;

  if (dataBlock && dataBlock.textContent.trim()) {
    try {
      const parsedDom = JSON.parse(dataBlock.textContent);
      if (parsedDom && typeof parsedDom === 'object') {
        domState = {
          vaultMeta: parsedDom.vaultMeta || { title: "My Research & Notes Vault", version: "1.0.0", lastSaved: 0 },
          globalMacros: parsedDom.globalMacros || { ...DEFAULT_GLOBAL_MACROS },
          tableTemplates: Array.isArray(parsedDom.tableTemplates) ? parsedDom.tableTemplates : [],
          tikzTemplates: Array.isArray(parsedDom.tikzTemplates) ? parsedDom.tikzTemplates : [],
          bibliography: Array.isArray(parsedDom.bibliography) ? parsedDom.bibliography : [],
          citationStyle: typeof parsedDom.citationStyle === 'string' ? parsedDom.citationStyle : 'numeric',
          folders: Array.isArray(parsedDom.folders) ? parsedDom.folders : [],
          tags: Array.isArray(parsedDom.tags) ? parsedDom.tags : [],
          notes: Array.isArray(parsedDom.notes) ? parsedDom.notes.map(sanitizeNote) : []
        };
      }
    } catch (e) {
      console.warn('Could not parse DOM NotesData from HTML:', e);
    }
  }

  // 1. Check if browser Local Storage has an active unsaved crash recovery buffer
  try {
    const cached = typeof localStorage !== 'undefined' ? localStorage.getItem('NotesData_Local_Cache') : null;
    if (cached) {
      const parsedCache = JSON.parse(cached);
      const domTimestamp = domState?.vaultMeta?.lastSaved || 0;
      const cacheTimestamp = parsedCache?._savedAt || 0;

      // Only restore from cache if it represents active unsaved edits newer than the HTML file's last saved date
      if (parsedCache && parsedCache._unsaved === true && cacheTimestamp > domTimestamp && Array.isArray(parsedCache.notes)) {
        console.log('[NotesState] Recovering uncommitted working edits from local cache...');
        const cachedNotes = parsedCache.notes.map(sanitizeNote);

        Object.assign(NotesState, {
          vaultMeta: parsedCache.vaultMeta || domState?.vaultMeta || { title: "My Research & Notes Vault", version: "1.0.0", lastSaved: cacheTimestamp },
          globalMacros: parsedCache.globalMacros || domState?.globalMacros || { ...DEFAULT_GLOBAL_MACROS },
          tableTemplates: parsedCache.tableTemplates || domState?.tableTemplates || [],
          tikzTemplates: parsedCache.tikzTemplates || domState?.tikzTemplates || [],
          bibliography: Array.isArray(parsedCache.bibliography) ? parsedCache.bibliography : (domState?.bibliography || []),
          citationStyle: typeof parsedCache.citationStyle === 'string' ? parsedCache.citationStyle : (domState?.citationStyle || 'numeric'),
          // Recovery must not discard vault-level folders/tags that have no cached note (they may be intentionally empty or hand-ordered)
          folders: mergeOrderedLists(parsedCache.folders || domState?.folders || [], Array.from(new Set(cachedNotes.map(n => n.folder || 'General').filter(Boolean)))),
          tags: mergeOrderedLists(parsedCache.tags || domState?.tags || [], Array.from(new Set(cachedNotes.flatMap(n => n.tags || []).filter(Boolean)))),
          notes: cachedNotes
        });

        if (dataBlock) dataBlock.textContent = JSON.stringify(NotesState, null, 2);
        if (typeof window !== 'undefined') window.NotesState = NotesState;
        return NotesState;
      }
    }
  } catch (e) {
    console.warn('Could not read NotesData_Local_Cache from localStorage:', e);
  }

  // 2. Pure, clean load directly from HTML data vault (#NotesData)
  if (domState) {
    Object.assign(NotesState, {
      vaultMeta: domState.vaultMeta,
      globalMacros: domState.globalMacros || { ...DEFAULT_GLOBAL_MACROS },
      tableTemplates: domState.tableTemplates || [],
      tikzTemplates: domState.tikzTemplates || [],
      bibliography: domState.bibliography || [],
      citationStyle: domState.citationStyle || 'numeric',
      folders: domState.folders.length > 0 ? domState.folders : Array.from(new Set(domState.notes.map(n => n.folder || 'General').filter(Boolean))),
      tags: domState.tags.length > 0 ? domState.tags : Array.from(new Set(domState.notes.flatMap(n => n.tags || []).filter(Boolean))),
      notes: domState.notes
    });
    if (typeof window !== 'undefined') window.NotesState = NotesState;
    return NotesState;
  }

  // 3. Clean default fallback
  Object.assign(NotesState, {
    vaultMeta: { title: "My Research & Notes Vault", version: "1.0.0", lastSaved: 0 },
    globalMacros: { ...DEFAULT_GLOBAL_MACROS },
    tableTemplates: [],
    tikzTemplates: [],
    bibliography: [],
    citationStyle: 'numeric',
    folders: [],
    tags: [],
    notes: []
  });
  if (typeof window !== 'undefined') window.NotesState = NotesState;
  return NotesState;
}

let notesSaveDebounceTimer = null;

function persistNotesToStorageImmediate() {
  if (notesSaveDebounceTimer) {
    clearTimeout(notesSaveDebounceTimer);
    notesSaveDebounceTimer = null;
  }

  // 1. Write to DOM <script id="NotesData">
  const dataBlock = typeof document !== 'undefined' ? document.getElementById('NotesData') : null;
  if (dataBlock) {
    dataBlock.textContent = JSON.stringify(NotesState, null, 2);
  }

  // 2. Persist to browser Local Storage as active unsaved working buffer (compact unindented JSON for speed)
  try {
    if (typeof localStorage !== 'undefined') {
      const cachePayload = {
        ...NotesState,
        _unsaved: true,
        _savedAt: Date.now()
      };
      localStorage.setItem('NotesData_Local_Cache', JSON.stringify(cachePayload));
    }
  } catch (err) {
    console.warn('Failed to save NotesData to localStorage:', err);
  }
}

// Immediately flushes any pending debounced state writes to DOM & localStorage
export function flushNotesSave() {
  persistNotesToStorageImmediate();
}

if (typeof window !== 'undefined') {
  window.flushNotesSave = flushNotesSave;
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (notesSaveDebounceTimer) {
      persistNotesToStorageImmediate();
    }
  });
}

// Persists active notes, syncs folder/tag lists, and updates HTML vault & unsaved localStorage cache with debouncing
export function SaveNotesState(newState = null, { immediate = false } = {}) {
  if (newState) NotesState = newState;

  // Sync folders and tags to currently active notes.
  // The existing lists are the ordering source of truth (drag-reorder writes them directly);
  // derived values are only APPENDED so custom order and intentionally-empty folders survive saves.
  if (Array.isArray(NotesState.notes)) {
    const derivedFolders = Array.from(new Set(NotesState.notes.map(n => n.folder || 'General').filter(Boolean)));
    const derivedTags = Array.from(new Set(NotesState.notes.flatMap(n => n.tags || []).filter(Boolean)));
    NotesState.folders = mergeOrderedLists(NotesState.folders, derivedFolders);
    NotesState.tags = mergeOrderedLists(NotesState.tags, derivedTags);
  }

  // Keep window.NotesState synchronously in sync
  if (typeof window !== 'undefined') {
    window.NotesState = NotesState;
  }

  if (immediate) {
    persistNotesToStorageImmediate();
  } else {
    if (notesSaveDebounceTimer) clearTimeout(notesSaveDebounceTimer);
    notesSaveDebounceTimer = setTimeout(() => {
      persistNotesToStorageImmediate();
    }, 280);
  }
}

// Function to empty/clear unsaved cache after downloading / saving standalone HTML
export function ClearNotesLocalCache() {
  if (notesSaveDebounceTimer) {
    clearTimeout(notesSaveDebounceTimer);
    notesSaveDebounceTimer = null;
  }
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('NotesData_Local_Cache');
    }
  } catch (e) {
    console.warn('Failed to clear NotesData_Local_Cache:', e);
  }
  if (typeof clearAllBlockHistory === 'function') {
    clearAllBlockHistory();
  }
}

// Runs initial state load on module import
NotesState = LoadNotesState();