// Save button svg logo
export function GetSaveButtonHTML() {
  return `
    <style>
      .save-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 36px;
        padding: 0 14px;
        border-radius: 8px;
        background: var(--accent, #c6b8fc);
        color: #ffffff;
        font-size: 13px;
        font-weight: 600;
        border: 1px solid transparent;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: inherit;
        user-select: none;
        white-space: nowrap;
      }

      .save-btn:hover {
        background: var(--accent-hover, #704dff);
        box-shadow: 0 0 14px var(--accent-glow, rgba(224, 218, 248, 0.35));
        transform: translateY(-1px);
      }

      .save-btn:active {
        transform: translateY(0);
      }

      .save-btn svg {
        width: 15px;
        height: 15px;
        flex-shrink: 0;
      }

      @media (max-width: 440px) {
        .save-btn {
          height: 32px;
          padding: 0 10px;
          font-size: 11px;
        }
      }

      @media (max-width: 380px) {
        .save-btn span {
          display: none;
        }
        .save-btn {
          width: 32px;
          height: 32px;
          padding: 0;
          justify-content: center;
        }
      }

      @media (max-width: 360px) {
        .save-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
        }
        .save-btn svg {
          width: 13px;
          height: 13px;
        }
      }
    </style>

    <button class="save-btn" id="save-btn" title="SAVE APPLICATION">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </svg>
    </button>
  `;
}

// Automatically syncs all DOM <script type="application/json"> blocks with live window states and localStorage caches
function syncAllStatesToDOM(doc) {
  if (typeof window === 'undefined') return;
  if (typeof window.flushNotesSave === 'function') window.flushNotesSave();

  const now = Date.now();
  const dataScripts = doc.querySelectorAll('script[type="application/json"][id]');
  dataScripts.forEach(script => {
    const id = script.id;
    let foundData = null;

    // 1. Check window state matching id (e.g. window.BookmarkState, window.NotesState, window.AppState, window.RD, window[id])
    if (id === 'RDData') {
      if (window.RD && typeof window.RD.state === 'function') {
        foundData = window.RD.state();
      } else if (window.RDState) {
        foundData = window.RDState.rd || window.RDState;
      }
    }

    const candidateKeys = [
      id,
      id + 'State',
      id.replace(/Data$/, '') + 'State',
      'App' + id,
      'AppState',
      'BookmarkState',
      'NotesState',
      'ProfessorsState',
      'RDState'
    ];

    if (!foundData) {
      for (const key of candidateKeys) {
        if (window[key] && typeof window[key] === 'object' && Object.keys(window[key]).length > 0) {
          if (
            key === id ||
            key === id + 'State' ||
            key === id.replace(/Data$/, '') + 'State' ||
            (id === 'LandingPageData' && key === 'AppState') ||
            (id === 'Bookmarks' && key === 'BookmarkState') ||
            (id === 'NotesData' && key === 'NotesState') ||
            (id === 'ProfessorsData' && key === 'ProfessorsState') ||
            (id === 'RDData' && key === 'RDState')
          ) {
            foundData = (id === 'RDData' && window[key].rd) ? window[key].rd : window[key];
            break;
          }
        }
      }
    }

    // 2. Check localStorage cache for latest edits only if not found in live window state
    if (!foundData) {
      const cacheKeys = [id + '_Local_Cache', id.replace(/Data$/, '') + '_Local_Cache', id];
      if (id === 'RDData') cacheKeys.push('rd_library_v1');
      for (const ck of cacheKeys) {
        try {
          const cached = localStorage.getItem(ck);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && typeof parsed === 'object') {
              foundData = (id === 'RDData' && parsed.rd) ? parsed.rd : parsed;
              break;
            }
          }
        } catch (e) { }
      }
    }

    if (foundData) {
      try {
        // Deep clone to sanitize and set lastSaved
        const cleanData = JSON.parse(JSON.stringify(foundData));
        delete cleanData._unsaved;
        delete cleanData._savedAt;

        if (id === 'NotesData') {
          if (!cleanData.vaultMeta) cleanData.vaultMeta = {};
          cleanData.vaultMeta.lastSaved = now;
          if (window.NotesState && window.NotesState.vaultMeta) {
            window.NotesState.vaultMeta.lastSaved = now;
          }
        } else if (id === 'RDData') {
          cleanData.updatedAt = new Date().toISOString();
        } else {
          cleanData._lastSaved = now;
          if (id === 'Bookmarks' && window.BookmarkState) {
            window.BookmarkState._lastSaved = now;
          } else if (id === 'LandingPageData' && window.AppState) {
            window.AppState._lastSaved = now;
          }
        }

        // \u003c-escape `<` so vault data (note content can contain markup)
        // can never close the host <script> block in the standalone file.
        const safeJson = JSON.stringify(cleanData, null, 2).replace(/</g, '\\u003c');

        script.textContent = safeJson;

        // Also update live in-memory document script tag
        if (typeof document !== 'undefined') {
          const liveScript = document.getElementById(id);
          if (liveScript && liveScript !== script) {
            liveScript.textContent = safeJson;
          }
        }
      } catch (e) { }
    }
  });
}

// Save & Download Standalone App
export async function SaveAndDownloadApp() {
  const DocClone = document.documentElement.cloneNode(true);

  // 1. Auto-sync all data blocks from in-memory / localStorage
  syncAllStatesToDOM(DocClone);

  // 2. Check if running in standalone mode
  const isStandalone = typeof window !== 'undefined' && window.__IS_STANDALONE__ === true;

  if (!isStandalone) {
    async function bundleFile(filePath) {
      try {
        const cleanPath = filePath.endsWith('.js') ? filePath : filePath + '.js';
        const resolvedUrl = new URL('../' + cleanPath, import.meta.url).href;
        const res = await fetch(resolvedUrl);
        if (!res.ok) {
          console.warn(`[Bundler] Skipping unavailable file: ${cleanPath} (${res.status})`);
          return '';
        }
        let code = await res.text();
        if (!code || !code.trim()) return '';

        // Strip module imports/exports for flat bundle embedding
        code = code.replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '');
        code = code.replace(/^\s*import\s+['"][^'"]+['"];?\s*$/gm, '');
        code = code.replace(/^\s*export\s+\*[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '');
        code = code.replace(/^\s*export\s*\{[\s\S]*?\}\s*from\s+['"][^'"]+['"];?\s*$/gm, '');
        code = code.replace(/^\s*export\s*\{[\s\S]*?\};?\s*$/gm, '');
        code = code.replace(/^\s*export\s+default\s+/gm, '');
        code = code.replace(/^\s*export\s+(async\s+)?(function|const|let|var|class)/gm, (m, p1, p2) => (p1 || '') + p2);
        // Escape literal script-closers so embedded sources (templates in
        // 04_Professors/Professors.js, the per-tab Data_IO builders, …) cannot
        // terminate the host <script> block of the generated standalone.
        // Source-level escape only: `\/` evaluates to `/`, so runtime strings
        // and the per-tab builders' own generated HTML stay byte-identical.
        code = code.replace(/<\/script/gi, '<\\/script');
        return `\n/* --- ${cleanPath} --- */\n${code}\n`;
      } catch (e) {
        console.warn(`[Bundler] Error reading ${filePath}:`, e);
        return '';
      }
    }

    const componentFiles = [
      '00_Components/01_Local_HUB_Logo.js',
      '00_Components/02_Theme_Toggle.js',
      '00_Components/03_Scrollbar.js',
      '00_Components/04_Import_Export.js',
      '00_Components/05_Save_Button.js',
      '00_Components/06_Color_Selector.js',
      '00_Components/07_Blob_Store.js',
      '00_Components/08_Research_Library.js',
      '00_Components/09_Icon_Button.js'
    ];

    const landingFiles = [
      '01_Landing_Page/00_State.js',
      '01_Landing_Page/01_Theme.js',
      '01_Landing_Page/02_Background.js',
      '01_Landing_Page/03_Orbs.js',
      '01_Landing_Page/04_Save_Icon_Logo.js',
      '01_Landing_Page/05_Import_Export.js',
      '01_Landing_Page/06_Header.js',
      '01_Landing_Page/07_Footer.js',
      '01_Landing_Page/08_Loading.js',
      '01_Landing_Page/Main.js'
    ];

    const bookmarkFiles = [
      '02_Bookmarks/00_State.js',
      '02_Bookmarks/01_Header.js',
      '02_Bookmarks/02_Navbar/01_View.js',
      '02_Bookmarks/02_Navbar/02_Sort_Groups.js',
      '02_Bookmarks/02_Navbar/03_Check_Links.js',
      '02_Bookmarks/02_Navbar.js',
      '02_Bookmarks/03_Add_Edit_Delete.js',
      '02_Bookmarks/04_Bookmark_Cards.js',
      '02_Bookmarks/05_Footer.js',
      '02_Bookmarks/Bookmarks.js'
    ];

    const noteFiles = [
      '03_Notes/00_State.js',
      '03_Notes/02_Utils.js',
      '03_Notes/Writing_Engine/BibTeX_Parser.js',
      '03_Notes/03_Library.js',
      '03_Notes/Writing_Engine/Bullet_Engine.js',
      '03_Notes/Writing_Engine/Block_Engine.js',
      '03_Notes/Writing_Engine/Numbering_Engine.js',
      '03_Notes/Writing_Engine/Math_Renderer.js',
      '03_Notes/Writing_Engine/Tikz_Renderer.js',
      '03_Notes/Writing_Engine/Code_Highlighter.js',
      '03_Notes/Writing_Engine/Link_Parser.js',
      '03_Notes/Writing_Engine/Highlight_Sync.js',
      '03_Notes/Writing_Engine/Table_Parser.js',
      '03_Notes/Writing_Engine/Block_History.js',
      '03_Notes/B_Editor_View/01_Blocks/Block_Actions.js',
      '03_Notes/B_Editor_View/01_Blocks/Figure_Utils.js',
      '03_Notes/B_Editor_View/01_Blocks/Block_Textarea.js',
      '03_Notes/B_Editor_View/01_Blocks/Table_Templates.js',
      '03_Notes/B_Editor_View/01_Blocks/Table_Templates_Modal.js',
      '03_Notes/B_Editor_View/01_Blocks/Tikz_Templates.js',
      '03_Notes/B_Editor_View/01_Blocks/Tikz_Templates_Modal.js',
      '03_Notes/B_Editor_View/01_Blocks/Heading_Block.js',
      '03_Notes/B_Editor_View/01_Blocks/Text_Block/Text_Widgets.js',
      '03_Notes/B_Editor_View/01_Blocks/Text_Block/Text_Parser.js',
      '03_Notes/B_Editor_View/01_Blocks/Text_Block/Text_Keyboard.js',
      '03_Notes/B_Editor_View/01_Blocks/Text_Block/Cite_Autocomplete.js',
      '03_Notes/B_Editor_View/01_Blocks/Text_Block/Cite_Preview.js',
      '03_Notes/B_Editor_View/01_Blocks/Text_Block/Text_Block_Markdown.js',
      '03_Notes/B_Editor_View/01_Blocks/Text_Block.js',
      '03_Notes/B_Editor_View/01_Blocks/Equation_Block.js',
      '03_Notes/B_Editor_View/01_Blocks/Tikz_Block.js',
      '03_Notes/B_Editor_View/01_Blocks/Image_Block.js',
      '03_Notes/B_Editor_View/01_Blocks/Table_Block.js',
      '03_Notes/B_Editor_View/01_Blocks/Code_Block.js',
      '03_Notes/B_Editor_View/01_Blocks/Block_Block.js',
      '03_Notes/B_Editor_View/01_Blocks/Block_Dispatcher.js',
      '03_Notes/B_Editor_View/01_Blocks/Multi_Column_Block.js',
      '03_Notes/B_Editor_View/01_Blocks/Orientation_Modal.js',
      '03_Notes/B_Editor_View/01_Blocks/Block_Item.js',
      '03_Notes/B_Editor_View/01_Doc_Header.js',
      '03_Notes/B_Editor_View/02_Sidebar/01_Sidebar_Logo.js',
      '03_Notes/B_Editor_View/02_Sidebar/02_Sidebar_TOC.js',
      '03_Notes/B_Editor_View/02_Sidebar/03_Sidebar_Toggle.js',
      '03_Notes/B_Editor_View/03_Floating_ToolBar/01_Study_View_Toggle.js',
      '03_Notes/B_Editor_View/03_Floating_ToolBar/02_Note_Fonts.js',
      '03_Notes/B_Editor_View/03_Floating_ToolBar/03_Font_Size.js',
      '03_Notes/B_Editor_View/03_Floating_ToolBar/04_Macros_Modal.js',
      '03_Notes/B_Editor_View/03_Floating_ToolBar/05_Citation_Style.js',
      '03_Notes/B_Editor_View/03_Floating_ToolBar/06_Equation_Numbering.js',
      '03_Notes/B_Editor_View/02_Floating_Toolbar.js',
      '03_Notes/B_Editor_View/03_Study_View.js',
      '03_Notes/B_Editor_View/04_LaTeX_Editor.js',
      '03_Notes/A_Notes_Card_View/01_Navbar/01_Card_View_Toggle.js',
      '03_Notes/A_Notes_Card_View/01_Navbar/02_Group_Filter.js',
      '03_Notes/A_Notes_Card_View/01_Navbar/03_Search_Bar.js',
      '03_Notes/A_Notes_Card_View/01_Navbar/04_Graph_Toggle.js',
      '03_Notes/A_Notes_Card_View/01_Navbar/05_Delete_Button.js',
      '03_Notes/A_Notes_Card_View/01_Navbar/06_Add_Edit_Button.js',
      '03_Notes/A_Notes_Card_View/01_Navbar/07_Library_Button.js',
      '03_Notes/A_Notes_Card_View/01_Navbar.js',
      '03_Notes/A_Notes_Card_View/02_Notes_Card.js',
      '03_Notes/A_Notes_Card_View/A_Notes_Card_View.js',
      '03_Notes/C_Graph_View/Graph_Data.js',
      '03_Notes/C_Graph_View/Graph_Physics.js',
      '03_Notes/C_Graph_View/Graph_View.js',
      '03_Notes/01_Header.js',
      '03_Notes/Notes.js'
    ];

    const professorFiles = [
      '04_Professors/00_State.js',
      '04_Professors/01_Utils.js',
      '04_Professors/02_Styles.js',
      '04_Professors/03_Seed_Data.js',
      '04_Professors/01_HTML_Page/01_Header.js',
      '04_Professors/01_HTML_Page/02_Toolbar.js',
      '04_Professors/01_HTML_Page/03_Theme_Toggle.js',
      '04_Professors/01_HTML_Page/04_Footer.js',
      '04_Professors/02_Dashboard/01_Stats_Bar.js',
      '04_Professors/02_Dashboard/02_Resume_Section.js',
      '04_Professors/02_Dashboard/03_Heatmap.js',
      '04_Professors/02_Dashboard/04_Tag_Bar.js',
      '04_Professors/03_Professor_List/01_Prof_Cards.js',
      '04_Professors/03_Professor_List/02_List_Actions.js',
      '04_Professors/04_Modals/01_Modal_Core.js',
      '04_Professors/04_Modals/02_Professor_Modal.js',
      '04_Professors/04_Modals/03_Paper_Modal.js',
      '04_Professors/04_Modals/04_Journal_Modal.js',
      '04_Professors/04_Modals/05_Journal_Browser.js',
      '04_Professors/04_Modals/06_Compare_Modal.js',
      '04_Professors/04_Modals/07_Bulk_Add_Modal.js',
      '04_Professors/04_Modals/08_Paste_Import_Modal.js',
      '04_Professors/04_Modals/09_Shortcuts_Modal.js',
      '04_Professors/05_Data_IO/01_Save_Button.js',
      '04_Professors/05_Data_IO/02_Export.js',
      '04_Professors/05_Data_IO/03_Import.js',
      '04_Professors/Professors.js'
    ];

    const rdFiles = [
      // Dependency-ordered for the flat bundle: 00_State.js eagerly seeds the
      // library at evaluation time, touching RD_LAYOUT/palettes from
      // 03_Seed_Data.js and uid() from 01_Utils.js. In dev, ES module imports
      // resolve lazily, but the concatenated bundle executes top-level code in
      // list order — leaves must come first or const bindings hit the TDZ.
      '05_R&D/01_Utils.js',
      '05_R&D/03_Seed_Data.js',
      '05_R&D/00_State.js',
      '05_R&D/02_Styles.js',
      '05_R&D/01_HTML_Page/01_Header.js',
      '05_R&D/01_HTML_Page/02_Navbar.js',
      '05_R&D/01_HTML_Page/03_Toolbar.js',
      '05_R&D/01_HTML_Page/04_Footer.js',
      '05_R&D/02_Bibtex_Doi/01_Bibtex.js',
      '05_R&D/02_Bibtex_Doi/02_Doi.js',
      '05_R&D/03_Views/01_List_View.js',
      '05_R&D/03_Views/02_Timeline_View.js',
      '05_R&D/03_Views/03_Map_View.js',
      '05_R&D/03_Views/04_Group_View.js',
      '05_R&D/04_Modals/01_Modal_Core.js',
      '05_R&D/04_Modals/02_Item_Modal.js',
      '05_R&D/04_Modals/03_Drawer.js',
      '05_R&D/04_Modals/04_Queue_Panel.js',
      '05_R&D/04_Modals/05_Stats_Popover.js',
      '05_R&D/04_Modals/06_Health_Modal.js',
      '05_R&D/04_Modals/07_Help_Modal.js',
      '05_R&D/04_Modals/08_Link_Modal.js',
      '05_R&D/05_Data_IO/01_Save_Button.js',
      '05_R&D/05_Data_IO/02_Export.js',
      '05_R&D/05_Data_IO/03_Import.js',
      '05_R&D/RD.js'
    ];

    const bundleGroup = async (files) => {
      let out = '';
      for (const f of files) out += await bundleFile(f);
      return out;
    };

    const [bundledComponents, bundledLanding, bundledBookmarks, bundledNotes, bundledProfessors, bundledRD] = await Promise.all([
      bundleGroup(componentFiles),
      bundleGroup(landingFiles),
      bundleGroup(bookmarkFiles),
      bundleGroup(noteFiles),
      bundleGroup(professorFiles),
      bundleGroup(rdFiles)
    ]);

    const threeImportLine = 'imp' + 'ort * as THREE from \'https://unpkg.com/three@0.160.0/build/three.module.js\';';

    const finalModuleCode = `
window.__IS_STANDALONE__ = true;

${threeImportLine}

/* ==========================================================================
   SHARED COMPONENTS
   ========================================================================== */
${bundledComponents}

/* ==========================================================================
   LANDING PAGE MODULE
   ========================================================================== */
function LoadLandingPage() {
${bundledLanding}
  if (typeof initLandingPage === 'function') initLandingPage();
}

/* ==========================================================================
   BOOKMARKS PAGE MODULE
   ========================================================================== */
function LoadBookmarkPage() {
${bundledBookmarks}
  if (typeof initBookmarksApp === 'function') initBookmarksApp();
}

/* ==========================================================================
   NOTES PAGE MODULE
   ========================================================================== */
function LoadNotesPage() {
${bundledNotes}
  if (typeof initNotesApp === 'function') initNotesApp();
}

/* ==========================================================================
   PROFESSORS PAGE MODULE (ProffTrack)
   ========================================================================== */
function LoadProfessorsPage() {
${bundledProfessors}
  if (typeof initProfessorsApp === 'function') initProfessorsApp();
}

/* ==========================================================================
   R&D LIBRARY MODULE
   ========================================================================== */
function LoadRDPage() {
${bundledRD}
  if (typeof initRDApp === 'function') initRDApp();
}

/* ==========================================================================
   MASTER ROUTER
   ========================================================================== */
function handleRoute() {
  const currentHash = (window.location.hash || '').trim();
  const lowerHash = currentHash.toLowerCase();
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = '';
    root.removeAttribute('data-theme');
  }
  document.body.classList.remove('prof-dark');

  if (lowerHash.startsWith('#bookmarks')) {
    LoadBookmarkPage();
  } else if (lowerHash.startsWith('#notes')) {
    LoadNotesPage();
  } else if (lowerHash.startsWith('#professors')) {
    LoadProfessorsPage();
  } else if (lowerHash.startsWith('#rd') || lowerHash.startsWith('#r&d')) {
    LoadRDPage();
  } else {
    LoadLandingPage();
  }
}

window.addEventListener('hashchange', handleRoute);
handleRoute();
`;

    const scripts = DocClone.querySelectorAll('script[type="module"]');
    for (let s of scripts) {
      if (
        s.textContent.includes('currentHash') ||
        s.textContent.includes('handleRoute') ||
        s.textContent.includes('Bookmarks.js') ||
        s.textContent.includes('Main.js') ||
        s.textContent.includes('initLandingPage') ||
        s.textContent.includes('RD.js') ||
        s.textContent.includes('R&D.js') ||
        s.textContent.includes('initRDApp')
      ) {
        const inlineScript = document.createElement('script');
        inlineScript.type = 'module';
        inlineScript.textContent = finalModuleCode;
        s.replaceWith(inlineScript);
        break;
      }
    }
  }

  // Cleanup injected dev scripts and runtime containers before download
  DocClone.querySelectorAll('script[src*="livepreview"], script[src*="livereload"]').forEach(s => s.remove());
  ['#canvas-container', '#loading-container', '#root'].forEach(sel => {
    const el = DocClone.querySelector(sel);
    if (el) el.innerHTML = '';
  });

  // Trigger HTML download
  const currentHTML = '<!DOCTYPE html>\n' + DocClone.outerHTML;
  const blob = new Blob([currentHTML], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Local_HUB.html';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Clear unsaved working caches in localStorage (Option 1)
  ClearAllLocalCaches();

  // Visual feedback on Save button
  const saveBtn = document.getElementById('save-btn');
  if (saveBtn) {
    const originalHTML = saveBtn.innerHTML;
    const originalBg = saveBtn.style.background;
    saveBtn.style.background = '#16a34a';
    saveBtn.title = 'Saved to file & Cache Cleared!';
    saveBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
    setTimeout(() => {
      saveBtn.style.background = originalBg;
      saveBtn.title = 'SAVE APPLICATION';
      saveBtn.innerHTML = originalHTML;
    }, 2000);
  }
}

// Clears all unsaved local cache keys from browser localStorage
export function ClearAllLocalCaches() {
  if (typeof localStorage === 'undefined') return;
  // 1. Clear known tab cache keys based on DOM data blocks
  if (typeof document !== 'undefined') {
    const dataScripts = document.querySelectorAll('script[type="application/json"][id]');
    dataScripts.forEach(s => {
      try {
        localStorage.removeItem(s.id + '_Local_Cache');
        localStorage.removeItem(s.id.replace(/Data$/, '') + '_Local_Cache');
        localStorage.removeItem(s.id);
      } catch (e) { }
    });
  }
  // 2. Also sweep any key in localStorage ending with _Local_Cache
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.endsWith('_Local_Cache') || key.includes('_Cache'))) {
        localStorage.removeItem(key);
      }
    }
  } catch (e) { }

  // 3. Clear per-block undo/redo history stacks from memory
  if (typeof window !== 'undefined' && window.__blockHistories) {
    try {
      window.__blockHistories.clear();
    } catch (e) { }
  }

  console.log('[Save] All unsaved local caches flushed successfully.');
}

// Button Click Logic
export function InitSaveButtonLogic() {
  const btn = document.getElementById('save-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      SaveAndDownloadApp();
    });
  }
}