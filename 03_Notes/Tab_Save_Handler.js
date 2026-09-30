// Per-tab standalone Save handler for 03_Notes/Notes.html.
//
// This file is deliberately SELF-CONTAINED (no imports from 00_Components) and is
// NOT part of the all-in-one bundler lists in 00_Components/05_Save_Button.js.
// Index.html never loads it. Its only job: on the Notes.html page, the Save
// button compiles exactly this tab (shared components + these handler files +
// the notes modules) into ONE standalone HTML file and downloads it.
//
// The shared Save button on Index.html (all-in-one build) is completely untouched.

const TAB_OUTPUT_NAME = 'Notes.html';

// Syncs all DOM <script type="application/json"> vault blocks with live window
// states and localStorage caches (local copy of the proven shared sync logic).
function syncTabStatesToDOM(doc) {
  if (typeof window === 'undefined') return;
  if (typeof window.flushNotesSave === 'function') window.flushNotesSave();

  const now = Date.now();
  const dataScripts = doc.querySelectorAll('script[type="application/json"][id]');
  dataScripts.forEach(script => {
    const id = script.id;
    let foundData = null;

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
      if (window[key] && typeof window[key] === 'object' && Object.keys(window[key]).length > 0) {
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
      const cacheKeys = [id + '_Local_Cache', id.replace(/Data$/, '') + '_Local_Cache', id];
      for (const ck of cacheKeys) {
        try {
          const cached = localStorage.getItem(ck);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && typeof parsed === 'object') {
              foundData = parsed;
              break;
            }
          }
        } catch (e) { }
      }
    }

    if (foundData) {
      try {
        const cleanData = JSON.parse(JSON.stringify(foundData));
        delete cleanData._unsaved;
        delete cleanData._savedAt;

        if (id === 'NotesData') {
          if (!cleanData.vaultMeta) cleanData.vaultMeta = {};
          cleanData.vaultMeta.lastSaved = now;
          if (window.NotesState && window.NotesState.vaultMeta) {
            window.NotesState.vaultMeta.lastSaved = now;
          }
        } else {
          cleanData._lastSaved = now;
          if (id === 'Bookmarks' && window.BookmarkState) {
            window.BookmarkState._lastSaved = now;
          } else if (id === 'LandingPageData' && window.AppState) {
            window.AppState._lastSaved = now;
          }
        }

        script.textContent = JSON.stringify(cleanData, null, 2);

        if (typeof document !== 'undefined') {
          const liveScript = document.getElementById(id);
          if (liveScript && liveScript !== script) {
            liveScript.textContent = JSON.stringify(cleanData, null, 2);
          }
        }
      } catch (e) { }
    }
  });
}

// Clears all unsaved local cache keys from browser localStorage (local copy).
function clearAllTabLocalCaches() {
  if (typeof localStorage === 'undefined') return;
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.endsWith('_Local_Cache') || key.includes('_Cache'))) {
        localStorage.removeItem(key);
      }
    }
  } catch (e) { }

  if (typeof window !== 'undefined' && window.__blockHistories) {
    try {
      window.__blockHistories.clear();
    } catch (e) { }
  }
}

// Fetches one modular JS file and strips ES module syntax for flat embedding.
// Resolves paths against the project root (this file sits one level deep).
async function bundleTabFile(filePath) {
  try {
    const cleanPath = filePath.endsWith('.js') ? filePath : filePath + '.js';
    const resolvedUrl = new URL('../' + cleanPath, import.meta.url).href;
    const res = await fetch(resolvedUrl);
    if (!res.ok) {
      console.warn(`[TabBundler] Skipping unavailable file: ${cleanPath} (${res.status})`);
      return '';
    }
    let code = await res.text();
    if (!code || !code.trim()) return '';

    code = code.replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '');
    code = code.replace(/^\s*import\s+['"][^'"]+['"];?\s*$/gm, '');
    code = code.replace(/^\s*export\s+\*[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '');
    code = code.replace(/^\s*export\s*\{[\s\S]*?\}\s*from\s+['"][^'"]+['"];?\s*$/gm, '');
    code = code.replace(/^\s*export\s*\{[\s\S]*?\};?\s*$/gm, '');
    code = code.replace(/^\s*export\s+default\s+/gm, '');
    code = code.replace(/^\s*export\s+(async\s+)?(function|const|let|var|class)/gm, (m, p1, p2) => (p1 || '') + p2);
    return `\n/* --- ${cleanPath} --- */\n${code}\n`;
  } catch (e) {
    console.warn(`[TabBundler] Error reading ${filePath}:`, e);
    return '';
  }
}

async function bundleTabGroup(files) {
  let out = '';
  for (const f of files) out += await bundleTabFile(f);
  return out;
}

const sharedComponentFiles = [
  '00_Components/01_Local_HUB_Logo.js',
  '00_Components/02_Theme_Toggle.js',
  '00_Components/03_Scrollbar.js',
  '00_Components/04_Import_Export.js',
  '00_Components/05_Save_Button.js',
  '00_Components/06_Color_Selector.js'
];

const tabHandlerFiles = [
  '03_Notes/Tab_Save_Handler.js',
  '03_Notes/Tab_Logo_Handler.js',
  '03_Notes/Tab_Import_Export_Handler.js'
];

const tabModuleFiles = [
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
  '03_Notes/C_Graph_View/Graph_View.js',
  '03_Notes/01_Header.js',
  '03_Notes/Notes.js'
];

// Compiles THIS tab into one standalone HTML file and downloads it.
// Inside an already-standalone file it just re-emits itself with fresh vault data.
export async function SaveNotesStandalone() {
  const DocClone = document.documentElement.cloneNode(true);

  syncTabStatesToDOM(DocClone);

  const isStandalone = typeof window !== 'undefined' && window.__IS_STANDALONE__ === true;

  if (!isStandalone) {
    const [bundledComponents, bundledHandlers, bundledTab] = await Promise.all([
      bundleTabGroup(sharedComponentFiles),
      bundleTabGroup(tabHandlerFiles),
      bundleTabGroup(tabModuleFiles)
    ]);

    const finalModuleCode = `
window.__IS_STANDALONE__ = true;
window.__LOCALHUB_PAGE__ = 'notes';
window.__LOCALHUB_HUB_URL__ = 'Index.html';

/* ==========================================================================
   SHARED COMPONENTS
   ========================================================================== */
${bundledComponents}

/* ==========================================================================
   PER-TAB HANDLERS
   ========================================================================== */
${bundledHandlers}

/* ==========================================================================
   NOTES PAGE MODULE
   ========================================================================== */
function LoadThisPage() {
${bundledTab}
  if (typeof initNotesApp === 'function') initNotesApp();
  if (typeof InitTabSaveOverride === 'function') InitTabSaveOverride();
  if (typeof InitTabLogoOverride === 'function') InitTabLogoOverride();
  if (typeof InitTabImportExportOverride === 'function') InitTabImportExportOverride();
}

/* ==========================================================================
   PAGE ROUTER (keeps #Notes?id=... deep links working)
   ========================================================================== */
function handlePageRoute() {
  const root = document.getElementById('root');
  if (root) root.innerHTML = '';
  LoadThisPage();
}

window.addEventListener('hashchange', handlePageRoute);
handlePageRoute();
`;

    // Replace this page's boot script (deterministic id, sniffing fallback)
    let replaced = false;
    const routerScript = DocClone.querySelector('script#localhub-router');
    if (routerScript) {
      const inlineScript = document.createElement('script');
      inlineScript.type = 'module';
      inlineScript.textContent = finalModuleCode;
      routerScript.replaceWith(inlineScript);
      replaced = true;
    }
    if (!replaced) {
      const scripts = DocClone.querySelectorAll('script[type="module"]');
      for (let s of scripts) {
        if (s.textContent.includes('Notes.js') || s.textContent.includes('bootNotesPage')) {
          const inlineScript = document.createElement('script');
          inlineScript.type = 'module';
          inlineScript.textContent = finalModuleCode;
          s.replaceWith(inlineScript);
          break;
        }
      }
    }
  }

  // Cleanup runtime containers before download
  DocClone.querySelectorAll('script[src*="livepreview"], script[src*="livereload"]').forEach(s => s.remove());
  ['#canvas-container', '#loading-container', '#root'].forEach(sel => {
    const el = DocClone.querySelector(sel);
    if (el) el.innerHTML = '';
  });

  const currentHTML = '<!DOCTYPE html>\n' + DocClone.outerHTML;
  const blob = new Blob([currentHTML], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = TAB_OUTPUT_NAME;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  clearAllTabLocalCaches();

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

// Swaps the shared Save binding (which would build the all-in-one app) for the
// per-tab standalone builder. Called after initNotesApp() mounts the header.
export function InitTabSaveOverride() {
  const btn = document.getElementById('save-btn');
  if (!btn) return;
  const clone = btn.cloneNode(true); // clone drops the shared click listener
  btn.replaceWith(clone);
  clone.addEventListener('click', (e) => {
    e.preventDefault();
    SaveNotesStandalone();
  });
}
