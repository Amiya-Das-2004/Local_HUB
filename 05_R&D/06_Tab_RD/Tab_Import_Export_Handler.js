// Per-tab Import/Export handler for 05_R&D/06_Tab_RD/R&D.html.
//
// Self-contained on purpose: not listed in the all-in-one bundler, not needed
// by Index.html. Its only job: on the R&D.html page, the footer Import/Export
// JSON controls operate strictly on R&D data ('RD_DATA.json'). It is also
// resilient: if a user uploads a full 'Local_HUB_DATA.json' backup, it
// automatically extracts the RD slice.
//
// R&D dispatches footer actions through ONE document-level delegated click
// handler (RD.js InitDelegatedEvents), so clone-swapping the buttons cannot
// intercept them. Instead this handler registers a CAPTURE-phase listener on
// document, which fires before the delegated bubble listener and swallows the
// two actions it owns. All other data-actions (queue, theme, palette, …)
// pass through untouched to the core dispatcher.

// Dedicated R&D tab export (core envelope shape: { rd: <library> })
export function TriggerTabExport() {
  let foundData = null;

  if (typeof window !== 'undefined' && window.RDState && typeof window.RDState === 'object') {
    foundData = window.RDState.rd || window.RDState;
  }

  if (!foundData) {
    const script = document.getElementById('RDData');
    if (script && script.textContent.trim()) {
      try {
        const parsed = JSON.parse(script.textContent);
        foundData = (parsed && parsed.rd) ? parsed.rd : parsed;
      } catch (e) { }
    }
  }

  if (!foundData) {
    try {
      const cached = typeof localStorage !== 'undefined' ? localStorage.getItem('rd_library_v1') : null;
      if (cached) {
        const parsed = JSON.parse(cached);
        foundData = (parsed && parsed.rd) ? parsed.rd : parsed;
      }
    } catch (e) { }
  }

  const now = Date.now();
  const cleanData = (foundData && typeof foundData === 'object') ? JSON.parse(JSON.stringify(foundData)) : {};
  if (!Array.isArray(cleanData.items)) cleanData.items = [];
  cleanData._lastSaved = now;

  const dataStr = JSON.stringify({ rd: cleanData }, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'RD_DATA.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Dedicated R&D tab import with multi-tab envelope resilience.
// Accepted shapes: { RDData: {...} } slice of Local_HUB_DATA.json (the key
// 00_Components/04_Import_Export.js actually writes), legacy { RD: {...} },
// { rd: {...} } core snapshot, or a bare library object with an items array.
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

        // Resilient extraction: envelope slice → core snapshot → bare library
        let targetData = null;
        const envelopeSlice = (importedData.RDData && typeof importedData.RDData === 'object')
          ? importedData.RDData
          : ((importedData.RD && typeof importedData.RD === 'object') ? importedData.RD : null);
        if (envelopeSlice) {
          targetData = envelopeSlice.rd || envelopeSlice;
        } else if (importedData.rd && typeof importedData.rd === 'object') {
          targetData = importedData.rd;
        } else if (Array.isArray(importedData.items)) {
          targetData = importedData;
        } else {
          throw new Error('No R&D library data found in this file.');
        }

        const cleanData = JSON.parse(JSON.stringify(targetData));
        if (!Array.isArray(cleanData.items)) cleanData.items = [];
        cleanData.updatedAt = new Date().toISOString();

        // 1. Sync to DOM script block (vault stores the UNWRAPPED rd data;
        //    escape "<" for script safety, matching 00_State.syncVault)
        let scriptBlock = document.getElementById('RDData');
        if (!scriptBlock) {
          scriptBlock = document.createElement('script');
          scriptBlock.type = 'application/json';
          scriptBlock.id = 'RDData';
          document.head.appendChild(scriptBlock);
        }
        scriptBlock.textContent = '\n' + JSON.stringify(cleanData, null, 2).replace(/</g, '\\u003c') + '\n';

        // 2. Sync to the in-memory state mirror (window.RDState wraps state:
        //    { rd: … }), matching persist()'s convention
        if (typeof window !== 'undefined') {
          if (window.RDState && typeof window.RDState === 'object' && !Array.isArray(window.RDState)) {
            window.RDState.rd = cleanData;
          } else {
            window.RDState = { rd: cleanData };
          }
        }

        alert('R&D library imported successfully! Remember to click SAVE HTML to make it permanent in your HTML.');

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

// Capture-phase interception of the two footer actions this handler owns.
// The capture listener on document fires before RD.js's document-level bubble
// listener, and stopPropagation() keeps the core dispatcher from ever seeing
// them; every other data-action passes through untouched.
export function InitTabImportExportOverride() {
  if (typeof document === 'undefined') return;
  /* Once per page load — the tab page re-runs the whole bundle (and this init)
     on every in-tab hashchange. Flag on window: the flat bundle re-declares
     module lets inside LoadThisPage() on every call. */
  if (typeof window !== 'undefined') {
    if (window.__RD_TAB_IO_BOUND__) return;
    window.__RD_TAB_IO_BOUND__ = true;
  }
  document.addEventListener('click', (e) => {
    const el = e.target && e.target.closest ? (e.target.closest('[data-action]') || e.target.closest('#btn-import, #btn-export')) : null;
    if (!el) return;
    const action = el.dataset.action;
    const isExport = action === 'export-json' || el.id === 'btn-export';
    const isImport = action === 'import-json' || el.id === 'btn-import';
    if (isExport) {
      e.stopPropagation();
      e.preventDefault();
      TriggerTabExport();
    } else if (isImport) {
      e.stopPropagation();
      e.preventDefault();
      TriggerTabImport(null);
    }
  }, true);
}
