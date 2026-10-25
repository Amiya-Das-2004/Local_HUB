import { OfferRecoverySnapshot, WriteRecoverySnapshot, ClearRecoverySnapshot, PurgeLegacyRecoveryKeys } from '../00_Components/10_Recovery.js';

export let BookmarkState = {
  bookmarks: [],
  sectionOrder: ['ALL']
};

let baselineBookmarksMap = (typeof window !== 'undefined' && window.__BOOKMARKS_BASELINE__)
  ? window.__BOOKMARKS_BASELINE__
  : new Map(); // id -> fingerprint string
let isBaselineCaptured = Boolean(typeof window !== 'undefined' && window.__BOOKMARKS_BASELINE_CAPTURED__);
let hasUnsavedBookmarkChanges = Boolean(typeof window !== 'undefined' && window.__BOOKMARKS_UNSAVED__);

if (typeof window !== 'undefined') {
  window.__BOOKMARKS_BASELINE__ = baselineBookmarksMap;
  window.__BOOKMARKS_BASELINE_CAPTURED__ = isBaselineCaptured;
  window.__BOOKMARKS_UNSAVED__ = hasUnsavedBookmarkChanges;
}

function getBookmarkFingerprint(b) {
  if (!b || typeof b !== 'object') return '';
  return JSON.stringify({
    name: String(b.name || '').trim(),
    url: String(b.url || '').trim(),
    group: String(b.group || '').trim(),
    customIcon: String(b.customIcon || '').trim(),
    useTitleLogo: Boolean(b.useTitleLogo)
  });
}

export function CaptureBookmarkBaseline(state = BookmarkState) {
  baselineBookmarksMap.clear();
  if (state && Array.isArray(state.bookmarks)) {
    state.bookmarks.forEach(b => {
      if (!b || !b.id) return;
      baselineBookmarksMap.set(b.id, getBookmarkFingerprint(b));
    });
  }
  isBaselineCaptured = true;
  hasUnsavedBookmarkChanges = false;
  if (typeof window !== 'undefined') {
    window.__BOOKMARKS_BASELINE__ = baselineBookmarksMap;
    window.__BOOKMARKS_BASELINE_CAPTURED__ = true;
    window.__BOOKMARKS_UNSAVED__ = false;
    window.__BOOKMARKS_UNSAVED_COUNT__ = 0;
    if (typeof window.MarkUnsavedChanges === 'function') {
      window.MarkUnsavedChanges(false, 0);
    }
  }
}

export function CalculateBookmarkChanges() {
  if (!isBaselineCaptured) {
    return { count: 0, isDirty: false, addedCount: 0, editedCount: 0, deletedCount: 0 };
  }

  let addedCount = 0;
  let editedCount = 0;
  let deletedCount = 0;
  const currentIds = new Set();

  if (BookmarkState && Array.isArray(BookmarkState.bookmarks)) {
    BookmarkState.bookmarks.forEach(b => {
      if (!b || !b.id) return;
      currentIds.add(b.id);
      const origFp = baselineBookmarksMap.get(b.id);
      if (origFp === undefined) {
        addedCount++;
      } else {
        const currFp = getBookmarkFingerprint(b);
        if (origFp !== currFp) {
          editedCount++;
        }
      }
    });
  }

  for (const [origId] of baselineBookmarksMap) {
    if (!currentIds.has(origId)) {
      deletedCount++;
    }
  }

  const totalCount = addedCount + editedCount + deletedCount;
  const isDirty = totalCount > 0;

  return {
    count: totalCount,
    isDirty,
    addedCount,
    editedCount,
    deletedCount
  };
}

export function GetBookmarksUnsavedChangesCount() {
  const diff = CalculateBookmarkChanges();
  return diff.count;
}

export function HasUnsavedBookmarkChanges() {
  if (!isBaselineCaptured) return hasUnsavedBookmarkChanges;
  const diff = CalculateBookmarkChanges();
  return diff.isDirty;
}

export function SetBookmarksUnsavedChanges(dirty = true) {
  let isDirty = false;
  let count = 0;
  if (dirty === false) {
    isDirty = false;
    count = 0;
  } else if (isBaselineCaptured) {
    const diff = CalculateBookmarkChanges();
    isDirty = diff.isDirty;
    count = diff.count;
  } else {
    isDirty = Boolean(dirty);
    count = isDirty ? 1 : 0;
  }
  hasUnsavedBookmarkChanges = isDirty;
  if (typeof window !== 'undefined') {
    window.__BOOKMARKS_UNSAVED__ = hasUnsavedBookmarkChanges;
    window.__BOOKMARKS_UNSAVED_COUNT__ = count;
    if (typeof window.MarkUnsavedChanges === 'function') {
      const overallDirty = typeof window.HasUnsavedChanges === 'function' ? window.HasUnsavedChanges() : hasUnsavedBookmarkChanges;
      const overallCount = typeof window.GetUnsavedChangesCount === 'function' ? window.GetUnsavedChangesCount() : count;
      window.MarkUnsavedChanges(overallDirty, overallCount);
    }
  }
}

export function LoadBookmarkState() {
  // Reuse in-memory state if already loaded (mirrors LoadNotesState): avoids
  // multi-KB re-parsing on route changes and never clobbers a user-approved
  // recovery restore with the on-disk vault.
  if (
    typeof window !== 'undefined' &&
    window.BookmarkState &&
    window.BookmarkState === BookmarkState &&
    Array.isArray(window.BookmarkState.bookmarks) &&
    window.BookmarkState.bookmarks.length > 0
  ) {
    return BookmarkState;
  }

  const dataBlock = typeof document !== 'undefined' ? document.getElementById('Bookmarks') : null;
  let domState = null;

  if (dataBlock && dataBlock.textContent.trim()) {
    try {
      const parsed = JSON.parse(dataBlock.textContent);
      if (parsed && typeof parsed === 'object') {
        const bms = parsed.bookmarks || parsed.bookmark || [];
        let secOrder = parsed.sectionOrder || [];
        if (!secOrder.includes('ALL')) secOrder.unshift('ALL');
        domState = {
          bookmarks: bms,
          sectionOrder: secOrder,
          _lastSaved: parsed._lastSaved || 0
        };
      }
    } catch (e) {
      console.error('Failed to parse Bookmarks JSON data block:', e);
    }
  }

  // 1. Purge legacy fixed-key caches (older builds shared them across files)
  PurgeLegacyRecoveryKeys();

  // 2. Offer this file's crash-recovery snapshot (sessionStorage, path-scoped).
  //    Never auto-applies — the user picks Restore or Discard in the banner.
  OfferRecoverySnapshot({
    baseKey: 'Bookmarks',
    label: 'bookmarks',
    onRestore: (snapData) => RestoreBookmarksFromSnapshot(snapData)
  });

  // 3. Pure, clean load directly from HTML data vault (#Bookmarks)
  if (domState) {
    BookmarkState = {
      bookmarks: domState.bookmarks,
      sectionOrder: domState.sectionOrder,
      _lastSaved: domState._lastSaved || 0
    };
    if (typeof window !== 'undefined') window.BookmarkState = BookmarkState;
    if (!isBaselineCaptured) {
      CaptureBookmarkBaseline(BookmarkState);
    }
    return BookmarkState;
  }

  // 3. Default empty state
  BookmarkState = { bookmarks: [], sectionOrder: ['ALL'], _lastSaved: 0 };
  if (typeof window !== 'undefined') window.BookmarkState = BookmarkState;
  if (!isBaselineCaptured) {
    CaptureBookmarkBaseline(BookmarkState);
  }
  return BookmarkState;
}

export function SaveBookmarkState(newState = null) {
  if (newState) BookmarkState = newState;

  const dataBlock = typeof document !== 'undefined' ? document.getElementById('Bookmarks') : null;
  if (dataBlock) dataBlock.textContent = JSON.stringify(BookmarkState, null, 2);

  if (typeof window !== 'undefined') {
    window.BookmarkState = BookmarkState;
    SetBookmarksUnsavedChanges(true);
  }

  // Path-scoped crash-recovery snapshot (sessionStorage): per-tab, survives
  // reloads, never leaks into other files. Replaces the old shared-origin
  // localStorage write that contaminated other LocalHUB files.
  WriteRecoverySnapshot('Bookmarks', BookmarkState);
}

// Applies a user-approved recovery snapshot (Restore banner) to the live state
// and re-renders. The baseline is deliberately NOT recaptured — it still
// reflects the on-disk vault, so restored edits keep counting as unsaved
// until the next SAVE.
function RestoreBookmarksFromSnapshot(snapData) {
  if (!snapData || typeof snapData !== 'object') return;
  BookmarkState = {
    bookmarks: Array.isArray(snapData.bookmarks) ? snapData.bookmarks : [],
    sectionOrder: Array.isArray(snapData.sectionOrder) ? snapData.sectionOrder : ['ALL'],
    _lastSaved: snapData._lastSaved || 0
  };
  if (!BookmarkState.sectionOrder.includes('ALL')) BookmarkState.sectionOrder.unshift('ALL');
  if (typeof window !== 'undefined') window.BookmarkState = BookmarkState;
  // Sync the DOM vault so a subsequent initBookmarksApp() re-load parses the
  // restored state (with the reuse branch it re-enters in-memory anyway).
  const dataBlock = typeof document !== 'undefined' ? document.getElementById('Bookmarks') : null;
  if (dataBlock) dataBlock.textContent = JSON.stringify(BookmarkState, null, 2);
  SetBookmarksUnsavedChanges(true);
  if (typeof window !== 'undefined' && typeof window.initBookmarksApp === 'function') {
    window.initBookmarksApp();
  }
}

// Function to empty/clear unsaved cache after downloading / saving standalone HTML
export function ClearBookmarkLocalCache() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('Bookmarks_Local_Cache');
    }
  } catch (e) {
    console.warn('Failed to clear Bookmarks_Local_Cache:', e);
  }
  ClearRecoverySnapshot('Bookmarks');
  CaptureBookmarkBaseline(BookmarkState);
}

if (typeof window !== 'undefined') {
  window.BookmarkState = BookmarkState;
  window.SaveBookmarkState = SaveBookmarkState;
  window.ClearBookmarkLocalCache = ClearBookmarkLocalCache;
  window.CaptureBookmarkBaseline = CaptureBookmarkBaseline;
  window.CalculateBookmarkChanges = CalculateBookmarkChanges;
  window.GetBookmarksUnsavedChangesCount = GetBookmarksUnsavedChangesCount;
  window.HasUnsavedBookmarkChanges = HasUnsavedBookmarkChanges;
  window.SetBookmarksUnsavedChanges = SetBookmarksUnsavedChanges;
}

// Initial load on import
BookmarkState = LoadBookmarkState();