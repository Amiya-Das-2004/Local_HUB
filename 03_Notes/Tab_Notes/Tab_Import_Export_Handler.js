// Per-tab Import/Export handler adapter for 03_Notes/Notes.html.
// Delegates directly to canonical 00_Components/04_Import_Export.js, which
// natively detects the isolated 'notes' shell context via window.__LOCALHUB_PAGE__.

import { TriggerExport, TriggerImport } from '../../00_Components/04_Import_Export.js';

// Dedicated Notes tab export
export function TriggerTabExport() {
  TriggerExport();
}

// Dedicated Notes tab import
export function TriggerTabImport(onSuccess = null) {
  TriggerImport(onSuccess);
}

// Swaps the header button click listeners to use the single-tab notes handlers on Notes.html
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

