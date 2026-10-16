// AppState is a variable that stores the Tab Data
export let AppState = { tabs: [] };

// Reads and parses JSON from #LandingPageData, updates AppState and window.AppState.
export function LoadLandingState() {
  const dataBlock = typeof document !== 'undefined' ? document.getElementById('LandingPageData') : null;
  let domState = null;

  if (dataBlock && typeof dataBlock.textContent === 'string' && dataBlock.textContent.trim()) {
    try {
      domState = JSON.parse(dataBlock.textContent);
    } catch (e) {
      console.error("Failed to parse LandingPageData:", e);
    }
  }

  // 1. Wipe any stale leftover cache from previous files or sessions
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('LandingPageData_Local_Cache');
    }
  } catch (e) { }

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

// Serializes AppState into #LandingPageData and marks unsaved changes
export function SaveLandingState() {
  const dataBlock = typeof document !== 'undefined' ? document.getElementById('LandingPageData') : null;
  if (dataBlock) {
    dataBlock.textContent = JSON.stringify(AppState, null, 2);
  }
  if (typeof window !== 'undefined') {
    window.AppState = AppState;
    if (typeof window.MarkUnsavedChanges === 'function') {
      window.MarkUnsavedChanges(true);
    }
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

