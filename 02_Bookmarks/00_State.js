export let BookmarkState = {
  bookmarks: [],
  sectionOrder: ['ALL']
};

export function LoadBookmarkState() {
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

  // 1. Check if browser Local Storage has an active unsaved crash recovery buffer
  try {
    const cached = typeof localStorage !== 'undefined' ? localStorage.getItem('Bookmarks_Local_Cache') : null;
    if (cached) {
      const parsedCache = JSON.parse(cached);
      const domTimestamp = domState?._lastSaved || 0;
      const cacheTimestamp = parsedCache?._savedAt || 0;

      // Only restore from cache if it represents active unsaved edits newer than the HTML file
      if (parsedCache && parsedCache._unsaved === true && cacheTimestamp > domTimestamp && Array.isArray(parsedCache.bookmarks)) {
        console.log('[BookmarkState] Recovering uncommitted bookmark edits from local cache...');
        BookmarkState = {
          bookmarks: parsedCache.bookmarks,
          sectionOrder: Array.isArray(parsedCache.sectionOrder) ? parsedCache.sectionOrder : ['ALL'],
          _lastSaved: cacheTimestamp
        };
        if (dataBlock) dataBlock.textContent = JSON.stringify(BookmarkState, null, 2);
        if (typeof window !== 'undefined') window.BookmarkState = BookmarkState;
        return BookmarkState;
      }
    }
  } catch (e) {
    console.warn('Could not read Bookmarks_Local_Cache:', e);
  }

  // 2. Pure, clean load directly from HTML data vault (#Bookmarks)
  if (domState) {
    BookmarkState = {
      bookmarks: domState.bookmarks,
      sectionOrder: domState.sectionOrder,
      _lastSaved: domState._lastSaved || 0
    };
    if (typeof window !== 'undefined') window.BookmarkState = BookmarkState;
    return BookmarkState;
  }

  // 3. Default empty state
  BookmarkState = { bookmarks: [], sectionOrder: ['ALL'], _lastSaved: 0 };
  if (typeof window !== 'undefined') window.BookmarkState = BookmarkState;
  return BookmarkState;
}

export function SaveBookmarkState(newState = null) {
  if (newState) BookmarkState = newState;

  const dataBlock = typeof document !== 'undefined' ? document.getElementById('Bookmarks') : null;
  if (dataBlock) dataBlock.textContent = JSON.stringify(BookmarkState, null, 2);

  if (typeof window !== 'undefined') window.BookmarkState = BookmarkState;

  // Persist to browser Local Storage as active unsaved working buffer
  try {
    if (typeof localStorage !== 'undefined') {
      const cachePayload = {
        ...BookmarkState,
        _unsaved: true,
        _savedAt: Date.now()
      };
      localStorage.setItem('Bookmarks_Local_Cache', JSON.stringify(cachePayload));
    }
  } catch (e) {
    console.warn('Failed to save Bookmarks to localStorage:', e);
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
}

// Initial load on import
BookmarkState = LoadBookmarkState();