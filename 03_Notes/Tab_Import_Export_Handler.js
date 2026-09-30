// Per-tab Import/Export handler for 03_Notes/Notes.html.
//
// Local copy of the shared 00_Components/04_Import_Export.js logic (identifiers
// renamed with a Tab prefix to stay collision-free in the flat standalone
// bundle, where both this file and the shared component are inlined). It exists
// so this page's Import/Export buttons keep working even while the shared
// component is being edited or broken.
//
// Self-contained on purpose: not listed in the all-in-one bundler, not needed
// by Index.html.

const TAB_DEFAULT_MACROS = {
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

function sanitizeTabNote(n, idx = 0) {
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
  return {
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
}

// Dedicated Notes tab import with multi-tab envelope resilience
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

        // Resilient extraction: direct notes vs global multi-tab envelope
        let targetData = null;
        if (importedData.NotesData && typeof importedData.NotesData === 'object') {
          targetData = importedData.NotesData;
        } else if (Array.isArray(importedData.notes) || importedData.vaultMeta) {
          targetData = importedData;
        } else {
          throw new Error('No notes data found in this file.');
        }

        const now = Date.now();
        let cleanData = JSON.parse(JSON.stringify(targetData));
        delete cleanData._unsaved;
        delete cleanData._savedAt;

        cleanData.vaultMeta = cleanData.vaultMeta || { title: "My Research & Notes Vault", version: "1.0.0" };
        cleanData.vaultMeta.lastSaved = now;
        cleanData.globalMacros = cleanData.globalMacros || { ...TAB_DEFAULT_MACROS };
        cleanData.tableTemplates = Array.isArray(cleanData.tableTemplates) ? cleanData.tableTemplates : [];
        cleanData.tikzTemplates = Array.isArray(cleanData.tikzTemplates) ? cleanData.tikzTemplates : [];
        cleanData.bibliography = Array.isArray(cleanData.bibliography) ? cleanData.bibliography : [];
        cleanData.citationStyle = typeof cleanData.citationStyle === 'string' ? cleanData.citationStyle : 'numeric';
        cleanData.notes = Array.isArray(cleanData.notes) ? cleanData.notes.map(sanitizeTabNote) : [];
        cleanData.folders = Array.isArray(cleanData.folders) && cleanData.folders.length > 0
          ? cleanData.folders
          : Array.from(new Set(cleanData.notes.map(n => n.folder || 'General').filter(Boolean)));
        cleanData.tags = Array.isArray(cleanData.tags) && cleanData.tags.length > 0
          ? cleanData.tags
          : Array.from(new Set(cleanData.notes.flatMap(n => n.tags || []).filter(Boolean)));

        // 1. Sync to DOM script block
        let scriptBlock = document.getElementById('NotesData');
        if (!scriptBlock) {
          scriptBlock = document.createElement('script');
          scriptBlock.type = 'application/json';
          scriptBlock.id = 'NotesData';
          document.head.appendChild(scriptBlock);
        }
        scriptBlock.textContent = JSON.stringify(cleanData, null, 2);

        // 2. Sync to in-memory window state
        if (typeof window !== 'undefined' && window.NotesState) {
          Object.assign(window.NotesState, cleanData);
        }

        // 3. Save to localStorage with recovery buffer
        try {
          if (typeof localStorage !== 'undefined') {
            const cachePayload = {
              ...cleanData,
              _unsaved: true,
              _savedAt: now
            };
            localStorage.setItem('NotesData_Local_Cache', JSON.stringify(cachePayload));
          }
        } catch (err) {
          console.warn('[Notes Import] Failed to cache in localStorage:', err);
        }

        alert('Notes imported successfully! Remember to click SAVE to make it permanent in your HTML.');

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

// Dedicated Notes tab export
export function TriggerTabExport() {
  if (typeof window !== 'undefined' && typeof window.flushNotesSave === 'function') {
    window.flushNotesSave();
  }

  let foundData = null;
  if (typeof window !== 'undefined' && window.NotesState && typeof window.NotesState === 'object') {
    foundData = window.NotesState;
  }

  if (!foundData) {
    const script = document.getElementById('NotesData');
    if (script && script.textContent.trim()) {
      try {
        foundData = JSON.parse(script.textContent);
      } catch (e) { }
    }
  }

  if (!foundData) {
    try {
      const cached = typeof localStorage !== 'undefined' ? localStorage.getItem('NotesData_Local_Cache') : null;
      if (cached) {
        foundData = JSON.parse(cached);
      }
    } catch (e) { }
  }

  const now = Date.now();
  const cleanData = JSON.parse(JSON.stringify(foundData || {}));
  delete cleanData._unsaved;
  delete cleanData._savedAt;

  cleanData.vaultMeta = cleanData.vaultMeta || { title: "My Research & Notes Vault", version: "1.0.0" };
  cleanData.vaultMeta.lastSaved = now;
  cleanData.globalMacros = cleanData.globalMacros || { ...TAB_DEFAULT_MACROS };
  cleanData.tableTemplates = Array.isArray(cleanData.tableTemplates) ? cleanData.tableTemplates : [];
  cleanData.tikzTemplates = Array.isArray(cleanData.tikzTemplates) ? cleanData.tikzTemplates : [];
  cleanData.bibliography = Array.isArray(cleanData.bibliography) ? cleanData.bibliography : [];
  cleanData.citationStyle = typeof cleanData.citationStyle === 'string' ? cleanData.citationStyle : 'numeric';
  cleanData.notes = Array.isArray(cleanData.notes) ? cleanData.notes.map(sanitizeTabNote) : [];
  cleanData.folders = Array.isArray(cleanData.folders) && cleanData.folders.length > 0
    ? cleanData.folders
    : Array.from(new Set(cleanData.notes.map(n => n.folder || 'General').filter(Boolean)));
  cleanData.tags = Array.isArray(cleanData.tags) && cleanData.tags.length > 0
    ? cleanData.tags
    : Array.from(new Set(cleanData.notes.flatMap(n => n.tags || []).filter(Boolean)));

  const dataStr = JSON.stringify(cleanData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Notes_DATA.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Swaps the shared Import/Export bindings for the local copies above.
// Called after initNotesApp() mounts the header.
export function InitTabImportExportOverride() {
  const importBtn = document.getElementById('btn-import');
  const exportBtn = document.getElementById('btn-export');

  if (exportBtn) {
    const clone = exportBtn.cloneNode(true); // clone drops the shared click listener
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
