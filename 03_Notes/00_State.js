import { clearAllBlockHistory } from './Writing_Engine/Block_History.js';
import { OfferRecoverySnapshot, WriteRecoverySnapshot, ClearRecoverySnapshot, PurgeLegacyRecoveryKeys } from '../00_Components/10_Recovery.js';

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
export let NotesState = (typeof window !== 'undefined' && window.NotesState && Array.isArray(window.NotesState.notes) && window.NotesState.notes.length > 0)
  ? window.NotesState
  : {
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
if (typeof window !== 'undefined') {
  window.NotesState = NotesState;
}

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
    properties: (() => {
      // Obsidian-style typed key-value properties; legacy notes migrate their description in
      let props = Array.isArray(n.properties)
        ? n.properties.filter(p => p && typeof p === 'object' && (String(p.key || '').trim() || (p.type === 'checkbox' && (String(p.text || '').trim() || p.value === true))))
        : [];
      if (!props.length && typeof n.description === 'string' && n.description.trim()) {
        props = [{ key: 'Description', value: n.description.trim(), type: 'text' }];
      }
      return props.map(p => { const out = { key: String(p.key).trim(), value: (p.value !== undefined && p.value !== null) ? p.value : '', type: p.type || 'text' };
        if (p.text !== undefined && p.text !== null && String(p.text).trim()) out.text = String(p.text);
        return out; });
    })(),
    meta: n.meta || { created: new Date().toISOString().slice(0, 10), author: 'User' },
    blocks: Array.isArray(n.blocks) ? n.blocks.map((b, bIdx) => {
      if (b && typeof b === 'object' && !b.id) {
        b.id = `b_${Date.now()}_${idx}_${bIdx}_${Math.random().toString(36).slice(2, 6)}`;
      }
      return b;
    }) : [],
    // Per-note numbering configs pass through untouched (objects or legacy strings):
    ...(n.equationNumbering !== undefined ? { equationNumbering: n.equationNumbering } : {}),
    ...(n.figureNumbering !== undefined ? { figureNumbering: n.figureNumbering } : {}),
    ...(n.showFigureCaptions !== undefined ? { showFigureCaptions: n.showFigureCaptions } : {}),
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
  // Reuse in-memory state if already loaded to avoid multi-MB JSON parsing on every route change
  if (!forceReload && (
    (NotesState.notes && NotesState.notes.length > 0) ||
    (typeof window !== 'undefined' && window.NotesState && Array.isArray(window.NotesState.notes) && window.NotesState.notes.length > 0)
  )) {
    if (typeof window !== 'undefined' && window.NotesState && NotesState !== window.NotesState) {
      Object.assign(NotesState, window.NotesState);
    }
    return NotesState;
  }

  const dataBlock = typeof document !== 'undefined' ? document.getElementById('NotesData') : null;
  let domState = null;

  if (dataBlock && typeof dataBlock.textContent === 'string' && dataBlock.textContent.trim()) {
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

  // 1. Purge legacy fixed-key caches (older builds shared them across files)
  PurgeLegacyRecoveryKeys();

  // 2. Offer this file's crash-recovery snapshot (sessionStorage, path-scoped).
  //    Never auto-applies — the user picks Restore or Discard in the banner.
  OfferRecoverySnapshot({
    baseKey: 'NotesData',
    label: 'notes',
    onRestore: (snapData) => RestoreNotesFromSnapshot(snapData)
  });

  // 3. Pure, clean load directly from HTML data vault (#NotesData)
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
    if (!isBaselineCaptured) {
      CaptureNotesBaseline(NotesState);
    }
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
  if (!isBaselineCaptured) {
    CaptureNotesBaseline(NotesState);
  }
  return NotesState;
}

let notesSaveDebounceTimer = null;
let hasUnsavedNotesChanges = Boolean(typeof window !== 'undefined' && window.__NOTES_UNSAVED__);

// Baseline snapshot of loaded or saved vault data
let baselineBlocksMap = (typeof window !== 'undefined' && window.__NOTES_BASELINE_BLOCKS__)
  ? window.__NOTES_BASELINE_BLOCKS__
  : new Map(); // blockId -> { noteId, fingerprint }
let baselineNotesMeta = (typeof window !== 'undefined' && window.__NOTES_BASELINE_META__)
  ? window.__NOTES_BASELINE_META__
  : new Map(); // noteId -> { title, folder, tagsString, description, blockIdsOrder }
let isBaselineCaptured = Boolean(typeof window !== 'undefined' && window.__NOTES_BASELINE_CAPTURED__);

if (typeof window !== 'undefined') {
  window.__NOTES_BASELINE_BLOCKS__ = baselineBlocksMap;
  window.__NOTES_BASELINE_META__ = baselineNotesMeta;
  window.__NOTES_BASELINE_CAPTURED__ = isBaselineCaptured;
  window.__NOTES_UNSAVED__ = hasUnsavedNotesChanges;
}

function getBlockFingerprint(block) {
  if (!block || typeof block !== 'object') return '';
  const copy = { ...block };
  delete copy._isEditing;
  delete copy._temp;
  try {
    return JSON.stringify(copy);
  } catch (e) {
    return String(block.id || '') + ':' + String(block.type || '') + ':' + String(block.content || '');
  }
}

export function CaptureNotesBaseline(state = NotesState) {
  baselineBlocksMap.clear();
  baselineNotesMeta.clear();
  if (state && Array.isArray(state.notes)) {
    state.notes.forEach(note => {
      if (!note) return;
      const blockIds = [];
      if (Array.isArray(note.blocks)) {
        note.blocks.forEach(b => {
          if (!b || !b.id) return;
          blockIds.push(b.id);
          baselineBlocksMap.set(b.id, {
            noteId: note.id,
            fingerprint: getBlockFingerprint(b)
          });
        });
      }
      baselineNotesMeta.set(note.id, {
        title: String(note.title || ''),
        folder: String(note.folder || ''),
        tagsString: (Array.isArray(note.tags) ? note.tags.slice().sort().join(',') : ''),
        description: String(note.description || ''),
        blockIdsOrder: blockIds.join(',')
      });
    });
  }
  isBaselineCaptured = true;
  hasUnsavedNotesChanges = false;
  if (typeof window !== 'undefined') {
    window.__NOTES_BASELINE_BLOCKS__ = baselineBlocksMap;
    window.__NOTES_BASELINE_META__ = baselineNotesMeta;
    window.__NOTES_BASELINE_CAPTURED__ = true;
    window.__NOTES_UNSAVED__ = false;
    window.__NOTES_UNSAVED_COUNT__ = 0;
    if (typeof window.MarkUnsavedChanges === 'function') {
      window.MarkUnsavedChanges(false, 0);
    }
  }
}

export function CalculateNotesBlockChanges() {
  if (!isBaselineCaptured) {
    return { count: 0, isDirty: false, modifiedCount: 0, addedCount: 0, deletedCount: 0, metadataChangesCount: 0 };
  }

  const currentBlockIds = new Set();
  let modifiedCount = 0;
  let addedCount = 0;
  let deletedCount = 0;
  let metadataChangesCount = 0;

  if (Array.isArray(NotesState.notes)) {
    NotesState.notes.forEach(note => {
      if (!note) return;

      const origMeta = baselineNotesMeta.get(note.id);
      if (!origMeta) {
        metadataChangesCount++;
      } else {
        const currentTagsStr = (Array.isArray(note.tags) ? note.tags.slice().sort().join(',') : '');
        const currentBlockIdsOrder = (Array.isArray(note.blocks) ? note.blocks.map(b => b?.id).filter(Boolean).join(',') : '');
        if (
          origMeta.title !== String(note.title || '') ||
          origMeta.folder !== String(note.folder || '') ||
          origMeta.tagsString !== currentTagsStr ||
          origMeta.description !== String(note.description || '') ||
          origMeta.blockIdsOrder !== currentBlockIdsOrder
        ) {
          metadataChangesCount++;
        }
      }

      if (Array.isArray(note.blocks)) {
        note.blocks.forEach(b => {
          if (!b || !b.id) return;
          currentBlockIds.add(b.id);
          const orig = baselineBlocksMap.get(b.id);
          if (!orig) {
            addedCount++;
          } else {
            const currentFp = getBlockFingerprint(b);
            if (orig.fingerprint !== currentFp) {
              modifiedCount++;
            }
          }
        });
      }
    });
  }

  for (const [origBlockId] of baselineBlocksMap) {
    if (!currentBlockIds.has(origBlockId)) {
      deletedCount++;
    }
  }

  for (const [origNoteId] of baselineNotesMeta) {
    const stillExists = NotesState.notes.some(n => n && n.id === origNoteId);
    if (!stillExists) {
      metadataChangesCount++;
    }
  }

  const blockChangesCount = modifiedCount + addedCount + deletedCount;
  const totalCount = blockChangesCount + metadataChangesCount;
  const isDirty = totalCount > 0;

  return {
    count: totalCount,
    isDirty: isDirty,
    modifiedCount,
    addedCount,
    deletedCount,
    metadataChangesCount
  };
}

export function GetNotesUnsavedChangesCount() {
  const diff = CalculateNotesBlockChanges();
  return diff.count;
}

export function HasUnsavedNotesChanges() {
  if (!isBaselineCaptured) return hasUnsavedNotesChanges;
  const diff = CalculateNotesBlockChanges();
  return diff.isDirty;
}

export function SetNotesUnsavedChanges(dirty = true) {
  let isDirty = false;
  let count = 0;
  if (dirty === false) {
    isDirty = false;
    count = 0;
  } else if (isBaselineCaptured) {
    const diff = CalculateNotesBlockChanges();
    isDirty = diff.isDirty;
    count = diff.count;
  } else {
    isDirty = Boolean(dirty);
    count = isDirty ? 1 : 0;
  }
  hasUnsavedNotesChanges = isDirty;
  if (typeof window !== 'undefined') {
    window.__NOTES_UNSAVED__ = hasUnsavedNotesChanges;
    window.__NOTES_UNSAVED_COUNT__ = count;
    if (typeof window.MarkUnsavedChanges === 'function') {
      const overallDirty = typeof window.HasUnsavedChanges === 'function' ? window.HasUnsavedChanges() : hasUnsavedNotesChanges;
      const overallCount = typeof window.GetUnsavedChangesCount === 'function' ? window.GetUnsavedChangesCount() : count;
      window.MarkUnsavedChanges(overallDirty, overallCount);
    }
  }
}

function persistNotesToStorageImmediate() {
  if (notesSaveDebounceTimer) {
    clearTimeout(notesSaveDebounceTimer);
    notesSaveDebounceTimer = null;
  }

  // 1. Write to live in-memory DOM <script id="NotesData">
  const dataBlock = typeof document !== 'undefined' ? document.getElementById('NotesData') : null;
  if (dataBlock) {
    dataBlock.textContent = JSON.stringify(NotesState, null, 2);
  }

  // 2. Keep this file's path-scoped crash-recovery snapshot in sessionStorage
  //    in sync with the working buffer (survives reloads/crashes, never leaks
  //    into other files or tabs).
  WriteRecoverySnapshot('NotesData', NotesState);

  // Pure in-memory session: do NOT persist unsaved working notes buffer to browser localStorage.
  // This ensures zero cross-file cache contamination between different standalone LocalHUB files.
}

// Applies a user-approved recovery snapshot (Restore banner) to the live state:
// sanitizes notes, persists to the DOM vault and re-renders. The baseline is
// deliberately NOT recaptured — it still reflects the on-disk vault, so the
// restored edits keep counting as unsaved until the next SAVE.
function RestoreNotesFromSnapshot(snapData) {
  if (!snapData || typeof snapData !== 'object') return;
  Object.assign(NotesState, {
    vaultMeta: snapData.vaultMeta || NotesState.vaultMeta,
    globalMacros: snapData.globalMacros || NotesState.globalMacros,
    tableTemplates: Array.isArray(snapData.tableTemplates) ? snapData.tableTemplates : NotesState.tableTemplates,
    tikzTemplates: Array.isArray(snapData.tikzTemplates) ? snapData.tikzTemplates : NotesState.tikzTemplates,
    bibliography: Array.isArray(snapData.bibliography) ? snapData.bibliography : NotesState.bibliography,
    citationStyle: typeof snapData.citationStyle === 'string' ? snapData.citationStyle : NotesState.citationStyle,
    folders: Array.isArray(snapData.folders) ? snapData.folders : NotesState.folders,
    tags: Array.isArray(snapData.tags) ? snapData.tags : NotesState.tags,
    notes: Array.isArray(snapData.notes) ? snapData.notes.map(sanitizeNote) : NotesState.notes
  });
  if (typeof window !== 'undefined') window.NotesState = NotesState;
  persistNotesToStorageImmediate();
  SetNotesUnsavedChanges(true);
  if (typeof window !== 'undefined' && typeof window.initNotesApp === 'function') {
    window.initNotesApp();
  }
}

// Immediately flushes any pending debounced state writes to the DOM vault
export function flushNotesSave() {
  persistNotesToStorageImmediate();
}

if (typeof window !== 'undefined') {
  window.SaveNotesState = SaveNotesState;
  window.flushNotesSave = flushNotesSave;
  window.ClearNotesLocalCache = ClearNotesLocalCache;
  window.CaptureNotesBaseline = CaptureNotesBaseline;
  window.CalculateNotesBlockChanges = CalculateNotesBlockChanges;
  window.GetNotesUnsavedChangesCount = GetNotesUnsavedChangesCount;
  window.HasUnsavedNotesChanges = HasUnsavedNotesChanges;
  window.SetNotesUnsavedChanges = SetNotesUnsavedChanges;
}

// Protect against accidental data loss: prompt user on browser close or refresh if there are unsaved edits
if (typeof window !== 'undefined' && !window.__NOTES_BEFOREUNLOAD_INSTALLED__) {
  window.__NOTES_BEFOREUNLOAD_INSTALLED__ = true;
  window.addEventListener('beforeunload', (e) => {
    if (window.__SUPPRESS_BEFOREUNLOAD__) return;
    if (hasUnsavedNotesChanges || (typeof window.HasUnsavedChanges === 'function' && window.HasUnsavedChanges())) {
      e.preventDefault();
      e.returnValue = '';
      return '';
    }
  });
}

// Persists active notes, syncs folder/tag lists, and updates HTML vault in-memory with debouncing
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

  // Mark in-memory state as dirty and keep window.NotesState synchronously in sync
  SetNotesUnsavedChanges(true);

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
  CaptureNotesBaseline(NotesState);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('NotesData_Local_Cache');
    }
  } catch (e) {
    console.warn('Failed to clear NotesData_Local_Cache:', e);
  }
  ClearRecoverySnapshot('NotesData');
  if (typeof clearAllBlockHistory === 'function') {
    clearAllBlockHistory();
  }
}

// Runs initial state load on module import
NotesState = LoadNotesState();