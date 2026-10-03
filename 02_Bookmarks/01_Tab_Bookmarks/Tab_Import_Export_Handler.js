// Per-tab Import/Export handler for 02_Bookmarks/01_Tab_Bookmarks/Bookmarks.html.
//
// Self-contained on purpose: not listed in the all-in-one bundler, not needed
// by Index.html. Its only job: on the Bookmarks.html page, the Import/Export
// buttons operate strictly on Bookmarks data ('Bookmarks_DATA.json').
// It is also resilient: if a user uploads a full 'Local_HUB_DATA.json' backup,
// it automatically extracts the Bookmarks slice.

// Dedicated Bookmarks tab export
export function TriggerTabExport() {
  let foundData = null;

  if (typeof window !== 'undefined' && window.BookmarkState && typeof window.BookmarkState === 'object') {
    foundData = window.BookmarkState;
  }

  if (!foundData) {
    const script = document.getElementById('Bookmarks');
    if (script && script.textContent.trim()) {
      try {
        foundData = JSON.parse(script.textContent);
      } catch (e) { }
    }
  }

  if (!foundData) {
    try {
      const cached = typeof localStorage !== 'undefined' ? localStorage.getItem('Bookmarks_Local_Cache') : null;
      if (cached) {
        foundData = JSON.parse(cached);
      }
    } catch (e) { }
  }

  const now = Date.now();
  const rawBookmarks = foundData?.bookmarks || foundData?.bookmark || [];
  let secOrder = Array.isArray(foundData?.sectionOrder) ? [...foundData.sectionOrder] : ['ALL'];
  if (!secOrder.includes('ALL')) secOrder.unshift('ALL');

  const cleanData = {
    bookmarks: Array.isArray(rawBookmarks) ? rawBookmarks : [],
    sectionOrder: secOrder,
    _lastSaved: now
  };

  const dataStr = JSON.stringify(cleanData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Bookmarks_DATA.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Dedicated Bookmarks tab import with multi-tab envelope resilience
export function TriggerTabImport(onSuccess = null) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (!importedData || typeof importedData !== 'object') {
          throw new Error('Imported file does not contain a valid JSON object.');
        }

        // Resilient extraction: direct bookmarks vs global multi-tab envelope
        let targetData = null;
        if (importedData.Bookmarks && typeof importedData.Bookmarks === 'object') {
          targetData = importedData.Bookmarks;
        } else if (Array.isArray(importedData.bookmarks) || importedData.sectionOrder) {
          targetData = importedData;
        } else if (Array.isArray(importedData.bookmark)) {
          targetData = { bookmarks: importedData.bookmark, sectionOrder: ['ALL'] };
        } else {
          throw new Error('No bookmarks data found in this file.');
        }

        const now = Date.now();
        const bms = Array.isArray(targetData.bookmarks) ? targetData.bookmarks : (Array.isArray(targetData.bookmark) ? targetData.bookmark : []);
        let secOrder = Array.isArray(targetData.sectionOrder) ? [...targetData.sectionOrder] : ['ALL'];
        if (!secOrder.includes('ALL')) secOrder.unshift('ALL');

        const cleanData = {
          bookmarks: bms,
          sectionOrder: secOrder,
          _lastSaved: now
        };

        // 1. Sync to DOM script block
        let scriptBlock = document.getElementById('Bookmarks');
        if (!scriptBlock) {
          scriptBlock = document.createElement('script');
          scriptBlock.type = 'application/json';
          scriptBlock.id = 'Bookmarks';
          document.head.appendChild(scriptBlock);
        }
        scriptBlock.textContent = JSON.stringify(cleanData, null, 2);

        // 2. Sync to in-memory state
        if (typeof window !== 'undefined') {
          if (window.BookmarkState) {
            window.BookmarkState.bookmarks = cleanData.bookmarks;
            window.BookmarkState.sectionOrder = cleanData.sectionOrder;
            window.BookmarkState._lastSaved = now;
          } else {
            window.BookmarkState = cleanData;
          }
        }

        // 3. Save to localStorage with recovery buffer
        try {
          if (typeof localStorage !== 'undefined') {
            const cachePayload = {
              ...cleanData,
              _unsaved: true,
              _savedAt: now
            };
            localStorage.setItem('Bookmarks_Local_Cache', JSON.stringify(cachePayload));
          }
        } catch (err) {
          console.warn('[Bookmarks Import] Failed to cache in localStorage:', err);
        }

        alert('Bookmarks imported successfully! Remember to click SAVE to make it permanent in your HTML.');

        if (onSuccess) {
          onSuccess(cleanData);
        } else {
          window.location.reload();
        }
      } catch (err) {
        alert('Invalid JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// Swaps the shared Import/Export bindings for the local copies above.
// Called after initBookmarksApp() mounts the header.
export function InitTabImportExportOverride() {
  const importBtn = document.getElementById('btn-import');
  const exportBtn = document.getElementById('btn-export');

  if (exportBtn) {
    const clone = exportBtn.cloneNode(true);
    exportBtn.replaceWith(clone);
    clone.addEventListener('click', (e) => {
      e.preventDefault();
      TriggerTabExport();
    });
  }

  if (importBtn) {
    const clone = importBtn.cloneNode(true);
    importBtn.replaceWith(clone);
    clone.addEventListener('click', (e) => {
      e.preventDefault();
      TriggerTabImport(null);
    });
  }
}
