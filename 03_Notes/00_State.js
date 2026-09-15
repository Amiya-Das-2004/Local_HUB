export const DEFAULT_GLOBAL_MACROS = {
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

// In-memory state holding notes, folders, tags, vault metadata, macros, and custom templates
export let NotesState = {
  vaultMeta: { title: "Notes Vault", version: "1.0.0" },
  globalMacros: { ...DEFAULT_GLOBAL_MACROS },
  tableTemplates: [],
  tikzTemplates: [],
  folders: [],
  tags: [],
  notes: []
};

// Validates note structure and fills missing fields with defaults
function sanitizeNote(n, idx = 0) {
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

// Loads notes from HTML vault (#NotesData) and optionally recovers uncommitted edits from localStorage
export function LoadNotesState() {
  const dataBlock = typeof document !== 'undefined' ? document.getElementById('NotesData') : null;
  let domState = null;

  if (dataBlock && dataBlock.textContent.trim()) {
    try {
      const parsedDom = JSON.parse(dataBlock.textContent);
      if (parsedDom && typeof parsedDom === 'object') {
        domState = {
          vaultMeta: parsedDom.vaultMeta || { title: "My Research & Notes Vault", version: "1.0.0", lastSaved: 0 },
          globalMacros: parsedDom.globalMacros || { ...DEFAULT_GLOBAL_MACROS },
          tableTemplates: Array.isArray(parsedDom.tableTemplates) ? parsedDom.tableTemplates : [],
          tikzTemplates: Array.isArray(parsedDom.tikzTemplates) ? parsedDom.tikzTemplates : [],
          folders: Array.isArray(parsedDom.folders) ? parsedDom.folders : [],
          tags: Array.isArray(parsedDom.tags) ? parsedDom.tags : [],
          notes: Array.isArray(parsedDom.notes) ? parsedDom.notes.map(sanitizeNote) : []
        };
      }
    } catch (e) {
      console.warn('Could not parse DOM NotesData from HTML:', e);
    }
  }

  // 1. Check if browser Local Storage has an active unsaved crash recovery buffer
  try {
    const cached = typeof localStorage !== 'undefined' ? localStorage.getItem('NotesData_Local_Cache') : null;
    if (cached) {
      const parsedCache = JSON.parse(cached);
      const domTimestamp = domState?.vaultMeta?.lastSaved || 0;
      const cacheTimestamp = parsedCache?._savedAt || 0;

      // Only restore from cache if it represents active unsaved edits newer than the HTML file's last saved date
      if (parsedCache && parsedCache._unsaved === true && cacheTimestamp > domTimestamp && Array.isArray(parsedCache.notes)) {
        console.log('[NotesState] Recovering uncommitted working edits from local cache...');
        const cachedNotes = parsedCache.notes.map(sanitizeNote);
        const allFolders = Array.from(new Set(cachedNotes.map(n => n.folder || 'General').filter(Boolean)));
        const allTags = Array.from(new Set(cachedNotes.flatMap(n => n.tags || []).filter(Boolean)));

        Object.assign(NotesState, {
          vaultMeta: parsedCache.vaultMeta || domState?.vaultMeta || { title: "My Research & Notes Vault", version: "1.0.0", lastSaved: cacheTimestamp },
          globalMacros: parsedCache.globalMacros || domState?.globalMacros || { ...DEFAULT_GLOBAL_MACROS },
          tableTemplates: parsedCache.tableTemplates || domState?.tableTemplates || [],
          tikzTemplates: parsedCache.tikzTemplates || domState?.tikzTemplates || [],
          folders: allFolders,
          tags: allTags,
          notes: cachedNotes
        });

        if (dataBlock) dataBlock.textContent = JSON.stringify(NotesState, null, 2);
        if (typeof window !== 'undefined') window.NotesState = NotesState;
        return NotesState;
      }
    }
  } catch (e) {
    console.warn('Could not read NotesData_Local_Cache from localStorage:', e);
  }

  // 2. Pure, clean load directly from HTML data vault (#NotesData)
  if (domState) {
    Object.assign(NotesState, {
      vaultMeta: domState.vaultMeta,
      globalMacros: domState.globalMacros || { ...DEFAULT_GLOBAL_MACROS },
      tableTemplates: domState.tableTemplates || [],
      tikzTemplates: domState.tikzTemplates || [],
      folders: domState.folders.length > 0 ? domState.folders : Array.from(new Set(domState.notes.map(n => n.folder || 'General').filter(Boolean))),
      tags: domState.tags.length > 0 ? domState.tags : Array.from(new Set(domState.notes.flatMap(n => n.tags || []).filter(Boolean))),
      notes: domState.notes
    });
    if (typeof window !== 'undefined') window.NotesState = NotesState;
    return NotesState;
  }

  // 3. Clean default fallback
  Object.assign(NotesState, {
    vaultMeta: { title: "My Research & Notes Vault", version: "1.0.0", lastSaved: 0 },
    globalMacros: { ...DEFAULT_GLOBAL_MACROS },
    tableTemplates: [],
    tikzTemplates: [],
    folders: [],
    tags: [],
    notes: []
  });
  if (typeof window !== 'undefined') window.NotesState = NotesState;
  return NotesState;
}

// Persists active notes, syncs folder/tag lists, and updates HTML vault & unsaved localStorage cache
export function SaveNotesState(newState = null) {
  if (newState) NotesState = newState;

  // Sync folders and tags to currently active notes
  if (Array.isArray(NotesState.notes)) {
    NotesState.folders = Array.from(new Set(NotesState.notes.map(n => n.folder || 'General').filter(Boolean)));
    NotesState.tags = Array.from(new Set(NotesState.notes.flatMap(n => n.tags || []).filter(Boolean)));
  }

  // 1. Write to DOM <script id="NotesData">
  const dataBlock = typeof document !== 'undefined' ? document.getElementById('NotesData') : null;
  if (dataBlock) {
    dataBlock.textContent = JSON.stringify(NotesState, null, 2);
  }

  // 2. Keep window.NotesState in sync
  if (typeof window !== 'undefined') {
    window.NotesState = NotesState;
  }

  // 3. Persist to browser Local Storage as active unsaved working buffer
  try {
    if (typeof localStorage !== 'undefined') {
      const cachePayload = {
        ...NotesState,
        _unsaved: true,
        _savedAt: Date.now()
      };
      localStorage.setItem('NotesData_Local_Cache', JSON.stringify(cachePayload));
    }
  } catch (err) {
    console.warn('Failed to save NotesData to localStorage:', err);
  }
}

// Function to empty/clear unsaved cache after downloading / saving standalone HTML
export function ClearNotesLocalCache() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('NotesData_Local_Cache');
    }
  } catch (e) {
    console.warn('Failed to clear NotesData_Local_Cache:', e);
  }
}

// Runs initial state load on module import
NotesState = LoadNotesState();