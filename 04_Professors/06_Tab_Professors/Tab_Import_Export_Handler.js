// Per-tab Import/Export handler for 04_Professors/06_Tab_Professors/Professor.html.
//
// Self-contained on purpose: not listed in the all-in-one bundler, not needed
// by Index.html. Its only job: on the Professor.html page, the header Import /
// Export buttons operate strictly on ProfessorTrack data ('Professors_DATA.json').
// It is also resilient: if a user uploads a full 'Local_HUB_DATA.json' backup,
// it automatically extracts the Professors slice.
//
// The footer's advanced core flows (merge/CSV import, paste-JSON, CSV export)
// remain bound to their core handlers — only the two header buttons are swapped.

// Dedicated Professors tab export
export function TriggerTabExport() {
  let foundData = null;

  if (typeof window !== 'undefined' && window.ProfessorsState && typeof window.ProfessorsState === 'object') {
    foundData = window.ProfessorsState;
  }

  if (!foundData) {
    const script = document.getElementById('ProfessorsData');
    if (script && script.textContent.trim()) {
      try {
        foundData = JSON.parse(script.textContent);
      } catch (e) { }
    }
  }

  if (!foundData) {
    try {
      const cached = typeof localStorage !== 'undefined' ? localStorage.getItem('profftrack:v1') : null;
      if (cached) {
        foundData = JSON.parse(cached);
      }
    } catch (e) { }
  }

  const now = Date.now();
  const rawProfs = Array.isArray(foundData?.professors) ? foundData.professors : [];

  const cleanData = {
    version: foundData?.version || 1,
    updatedAt: foundData?.updatedAt || null,
    professors: rawProfs,
    _lastSaved: now
  };
  if (foundData?.theme) cleanData.theme = foundData.theme;
  if (foundData?.goal) cleanData.goal = foundData.goal;
  if (foundData?.goalStart) cleanData.goalStart = foundData.goalStart;

  const dataStr = JSON.stringify(cleanData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Professors_DATA.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Dedicated Professors tab import with multi-tab envelope resilience
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

        // Resilient extraction: direct library vs global multi-tab envelope
        let targetData = null;
        if (importedData.Professors && typeof importedData.Professors === 'object') {
          targetData = importedData.Professors;
        } else if (Array.isArray(importedData.professors)) {
          targetData = importedData;
        } else {
          throw new Error('No ProfessorTrack library data found in this file.');
        }

        const now = new Date().toISOString();
        const cleanData = {
          version: targetData.version || 1,
          updatedAt: now,
          professors: Array.isArray(targetData.professors) ? targetData.professors : []
        };
        if (targetData.theme) cleanData.theme = targetData.theme;
        if (targetData.goal) cleanData.goal = targetData.goal;
        if (targetData.goalStart) cleanData.goalStart = targetData.goalStart;

        // 1. Sync to DOM script block (vault convention: escape "<" for script safety)
        let scriptBlock = document.getElementById('ProfessorsData');
        if (!scriptBlock) {
          scriptBlock = document.createElement('script');
          scriptBlock.type = 'application/json';
          scriptBlock.id = 'ProfessorsData';
          document.head.appendChild(scriptBlock);
        }
        scriptBlock.textContent = '\n' + JSON.stringify(cleanData, null, 2).replace(/</g, '\\u003c') + '\n';

        // 2. Sync to in-memory state mirror (persist() keeps window.ProfessorsState live)
        if (typeof window !== 'undefined') {
          window.ProfessorsState = cleanData;
        }

        // 3. Save to ProffTrack's localStorage store (loadState picks the newest candidate)
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('profftrack:v1', JSON.stringify(cleanData));
          }
        } catch (err) {
          console.warn('[Professors Import] Failed to cache in localStorage:', err);
        }

        alert('ProfessorTrack library imported successfully! Remember to click SAVE to make it permanent in your HTML.');

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

// Swaps the core header Import/Export bindings (which delegate to the footer's
// merge/CSV handlers) for the local copies above. Called after
// initProfessorsApp() mounts the header.
export function InitTabImportExportOverride() {
  const importBtn = document.getElementById('importBtn');
  const exportBtn = document.getElementById('exportBtn');

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
