// HTML CSS For svg Logo Import Button
export function GetImportButtonHTML() {
  return `
    <style>
      .notes-icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        border: 1px solid var(--border, #2a2e40);
        background: var(--surface, #181b27);
        color: var(--text-secondary, #a0a4b8);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        padding: 0;
        margin: 0;
        user-select: none;
      }

      .notes-icon-btn:hover {
        color: var(--text, #e8eaf2);
        border-color: var(--accent, #8b6dff);
        background: var(--card, #1c1f2e);
        box-shadow: 0 0 10px var(--accent-glow, rgba(139, 109, 255, 0.2));
      }

      .notes-icon-btn svg {
        width: 17px;
        height: 17px;
        flex-shrink: 0;
      }
    </style>
    <button class="notes-icon-btn" id="btn-import" type="button" title="Import Data (JSON)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    </button>
  `;
}

const DEFAULT_MACROS = {
  equation: `\\newcommand{\\mb}[1]{\\mathbf{#1}}
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

function sanitizeImportedNote(n, idx = 0) {
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

// Logic For Universal Self-Healing Import
export function TriggerImport(onSuccess = null) {
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

        const now = Date.now();
        let masterBlocks = {};

        // 1. Identify format: Master multi-tab container vs Single-tab direct payload
        if (importedData.LandingPageData || importedData.Bookmarks || importedData.NotesData) {
          masterBlocks = importedData;
        } else if (Array.isArray(importedData.notes) || importedData.vaultMeta) {
          masterBlocks['NotesData'] = importedData;
        } else if (Array.isArray(importedData.bookmarks) || importedData.sectionOrder) {
          masterBlocks['Bookmarks'] = importedData;
        } else if (Array.isArray(importedData.tabs)) {
          masterBlocks['LandingPageData'] = importedData;
        } else {
          // Generic master dictionary
          masterBlocks = importedData;
        }

        // 2. Universally sanitize, auto-create missing fields, and sync to DOM & localStorage
        for (const [id, rawData] of Object.entries(masterBlocks)) {
          if (!rawData || typeof rawData !== 'object') continue;

          let cleanData = JSON.parse(JSON.stringify(rawData));
          delete cleanData._unsaved;
          delete cleanData._savedAt;

          // Auto-create missing parts for NotesData
          if (id === 'NotesData' || Array.isArray(cleanData.notes) || cleanData.vaultMeta) {
            cleanData.vaultMeta = cleanData.vaultMeta || { title: "My Research & Notes Vault", version: "1.0.0" };
            cleanData.vaultMeta.lastSaved = now;
            cleanData.globalMacros = cleanData.globalMacros || { ...DEFAULT_MACROS };
            cleanData.tableTemplates = Array.isArray(cleanData.tableTemplates) ? cleanData.tableTemplates : [];
            cleanData.tikzTemplates = Array.isArray(cleanData.tikzTemplates) ? cleanData.tikzTemplates : [];
            cleanData.notes = Array.isArray(cleanData.notes) ? cleanData.notes.map(sanitizeImportedNote) : [];
            cleanData.folders = Array.isArray(cleanData.folders) && cleanData.folders.length > 0 
              ? cleanData.folders 
              : Array.from(new Set(cleanData.notes.map(n => n.folder || 'General').filter(Boolean)));
            cleanData.tags = Array.isArray(cleanData.tags) && cleanData.tags.length > 0 
              ? cleanData.tags 
              : Array.from(new Set(cleanData.notes.flatMap(n => n.tags || []).filter(Boolean)));
          }
          // Auto-create missing parts for Bookmarks
          else if (id === 'Bookmarks' || Array.isArray(cleanData.bookmarks)) {
            cleanData.bookmarks = Array.isArray(cleanData.bookmarks) ? cleanData.bookmarks : [];
            cleanData.sectionOrder = Array.isArray(cleanData.sectionOrder) ? cleanData.sectionOrder : ['ALL'];
            if (!cleanData.sectionOrder.includes('ALL')) cleanData.sectionOrder.unshift('ALL');
            cleanData._lastSaved = now;
          }
          // Auto-create missing parts for LandingPageData
          else if (id === 'LandingPageData' || Array.isArray(cleanData.tabs)) {
            cleanData.tabs = Array.isArray(cleanData.tabs) ? cleanData.tabs : [];
            cleanData._lastSaved = now;
          } else {
            cleanData._lastSaved = now;
          }

          // A. Update or create DOM <script type="application/json" id="...">
          let scriptBlock = document.getElementById(id);
          if (!scriptBlock) {
            scriptBlock = document.createElement('script');
            scriptBlock.type = 'application/json';
            scriptBlock.id = id;
            document.head.appendChild(scriptBlock);
          }
          scriptBlock.textContent = JSON.stringify(cleanData, null, 2);

          // B. Update in-memory window state objects if present
          if (typeof window !== 'undefined') {
            if (id === 'NotesData' && window.NotesState) Object.assign(window.NotesState, cleanData);
            if (id === 'Bookmarks' && window.BookmarkState) Object.assign(window.BookmarkState, cleanData);
            if (id === 'LandingPageData' && window.AppState) Object.assign(window.AppState, cleanData);
            if (window[id + 'State']) Object.assign(window[id + 'State'], cleanData);
            if (window[id]) Object.assign(window[id], cleanData);
          }

          // C. Save to LocalStorage with _unsaved: true and _savedAt: now
          // This guarantees that after page reload, each state module detects fresh uncommitted edits and restores them!
          try {
            if (typeof localStorage !== 'undefined') {
              const cachePayload = {
                ...cleanData,
                _unsaved: true,
                _savedAt: now
              };
              localStorage.setItem(id + '_Local_Cache', JSON.stringify(cachePayload));
            }
          } catch (err) {
            console.warn(`[Import] Failed to cache ${id} in localStorage:`, err);
          }
        }

        alert('Data imported successfully! All missing fields were automatically structured. Remember to click SAVE to make it permanent in your HTML.');

        if (onSuccess) {
          onSuccess(masterBlocks);
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

// HTML CSS For svg Logo Export Button
export function GetExportButtonHTML() {
  return `
    <button class="notes-icon-btn" id="btn-export" type="button" title="Export All Vault Data (JSON)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    </button>
  `;
}

// Logic For Universal Dynamic Export
export function TriggerExport() {
  const masterBackup = {};
  const scripts = document.querySelectorAll('script[type="application/json"][id]');
  scripts.forEach(script => {
    const id = script.id;
    let foundData = null;

    // Check live in-memory window state matching id first
    const candidateKeys = [
      id,
      id + 'State',
      id.replace(/Data$/, '') + 'State',
      'App' + id,
      'AppState',
      'BookmarkState',
      'NotesState'
    ];

    for (const key of candidateKeys) {
      if (typeof window !== 'undefined' && window[key] && typeof window[key] === 'object' && Object.keys(window[key]).length > 0) {
        if (
          key === id ||
          key === id + 'State' ||
          key === id.replace(/Data$/, '') + 'State' ||
          (id === 'LandingPageData' && key === 'AppState') ||
          (id === 'Bookmarks' && key === 'BookmarkState') ||
          (id === 'NotesData' && key === 'NotesState')
        ) {
          foundData = window[key];
          break;
        }
      }
    }

    if (!foundData) {
      try {
        foundData = JSON.parse(script.textContent);
      } catch (e) { }
    }

    if (foundData) {
      const cleanData = JSON.parse(JSON.stringify(foundData));
      delete cleanData._unsaved;
      delete cleanData._savedAt;
      masterBackup[id] = cleanData;
    }
  });

  const dataStr = JSON.stringify(masterBackup, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Local_HUB_DATA.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// HTML and CSS for Landing Page Import Export Buttons
export function GetImportExportHTML() {
  return `
    <style>
      .import-export-actions .action-btn {
        background: transparent;
        border: 1px solid var(--border);
        color: var(--muted);
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.6rem;
        letter-spacing: 0.1em;
        padding: 6px 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        border-radius: 4px;
      }

      .import-export-actions .action-btn:hover {
        border-color: var(--accent);
        color: var(--accent);
        background: rgba(107, 140, 255, 0.05);
      }

      .import-export-actions .action-btn.export {
        background: rgba(107, 140, 255, 0.1);
        color: var(--accent);
        border-color: rgba(107, 140, 255, 0.3);
      }

      .import-export-actions .action-btn.export:hover {
        background: rgba(107, 140, 255, 0.2);
      }
    </style>

    <button class="action-btn" id="btn-import" type="button">IMPORT</button>
    <button class="action-btn export" id="btn-export" type="button">EXPORT</button>
  `;
}

// Logic For Import Export Landing Page
export function InitImportExport(onImportSuccess = null) {
  const importBtn = document.getElementById('btn-import');
  const exportBtn = document.getElementById('btn-export');

  if (exportBtn) {
    exportBtn.addEventListener('click', (e) => {
      e.preventDefault();
      TriggerExport();
    });
  }

  if (importBtn) {
    importBtn.addEventListener('click', (e) => {
      e.preventDefault();
      TriggerImport(onImportSuccess);
    });
  }
}