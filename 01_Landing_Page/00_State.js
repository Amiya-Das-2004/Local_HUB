// AppState is a variable that stores the Tab Data
export let AppState = { tabs: [] };

// Reads and parses JSON from #LandingPageData, updates AppState and window.AppState.
export function LoadLandingState() {
  const dataBlock = typeof document !== 'undefined' ? document.getElementById('LandingPageData') : null;
  let domState = null;

  if (dataBlock && dataBlock.textContent.trim()) {
    try {
      domState = JSON.parse(dataBlock.textContent);
    } catch (e) {
      console.error("Failed to parse LandingPageData:", e);
    }
  }

  // 1. Check if browser Local Storage has an active unsaved crash recovery buffer
  try {
    const cached = typeof localStorage !== 'undefined' ? localStorage.getItem('LandingPageData_Local_Cache') : null;
    if (cached) {
      const parsedCache = JSON.parse(cached);
      const domTimestamp = domState?._lastSaved || 0;
      const cacheTimestamp = parsedCache?._savedAt || 0;

      // Only restore from cache if it represents active unsaved edits newer than the HTML file
      if (parsedCache && parsedCache._unsaved === true && cacheTimestamp > domTimestamp && Array.isArray(parsedCache.tabs)) {
        console.log('[LandingState] Recovering uncommitted tab edits from local cache...');
        AppState = {
          tabs: parsedCache.tabs,
          _lastSaved: cacheTimestamp
        };
        if (dataBlock) dataBlock.textContent = JSON.stringify(AppState, null, 2);
        if (typeof window !== 'undefined') window.AppState = AppState;
        return AppState;
      }
    }
  } catch (e) {
    console.warn('Could not read LandingPageData_Local_Cache:', e);
  }

  // 2. Pure, clean load directly from HTML data vault (#LandingPageData)
  if (domState) {
    AppState = {
      tabs: Array.isArray(domState.tabs) ? domState.tabs : [],
      _lastSaved: domState._lastSaved || 0
    };
    if (typeof window !== 'undefined') window.AppState = AppState;
    return AppState;
  }

  // 3. Default fallback
  AppState = { tabs: [], _lastSaved: 0 };
  if (typeof window !== 'undefined') window.AppState = AppState;
  return AppState;
}

// Runs on startup to read existing data from HTML into JavaScript memory (AppState).
LoadLandingState();

// Serializes AppState into #LandingPageData and unsaved localStorage cache
export function SaveLandingState() {
  const dataBlock = typeof document !== 'undefined' ? document.getElementById('LandingPageData') : null;
  if (dataBlock) {
    dataBlock.textContent = JSON.stringify(AppState, null, 2);
  }
  if (typeof window !== 'undefined') {
    window.AppState = AppState;
  }

  try {
    if (typeof localStorage !== 'undefined') {
      const cachePayload = {
        ...AppState,
        _unsaved: true,
        _savedAt: Date.now()
      };
      localStorage.setItem('LandingPageData_Local_Cache', JSON.stringify(cachePayload));
    }
  } catch (e) {
    console.warn('Failed to save LandingPageData to localStorage:', e);
  }
}

// Function to empty/clear unsaved cache after downloading / saving standalone HTML
export function ClearLandingLocalCache() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('LandingPageData_Local_Cache');
    }
  } catch (e) {
    console.warn('Failed to clear LandingPageData_Local_Cache:', e);
  }
}

