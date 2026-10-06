// Per-tab standalone Save handler for 05_R&D/06_Tab_RD/R&D.html.
//
// This file is deliberately SELF-CONTAINED (no imports from 00_Components or
// the R&D modules) and is NOT part of the all-in-one bundler lists in
// 00_Components/05_Save_Button.js. Index.html never loads it. Its only job:
// on the R&D.html tab page, the header "Save HTML" control compiles exactly
// this tab (shared components + these handler files + the R&D modules) into
// ONE standalone HTML file — the LocalHUB tab shell, not the core builder's
// minimal R&D-only page — and downloads it.
//
// R&D dispatches save through a delegated action
// (`data-action="export-standalone"` → `window.RDSaveButton.DownloadStandaloneHTML()`,
// checked before the imported binding), so the override simply swaps that
// member on window.RDSaveButton — no DOM rebinding needed.

const TAB_OUTPUT_NAME = 'R&D.html';

// Syncs the tab's DOM <script type="application/json"> vault blocks with live
// window states and localStorage caches. #RDData stores the UNWRAPPED rd data
// (matching 00_State.syncVault); #PapersData stores the shared research
// registry owned by this tab.
function syncTabStatesToDOM(doc) {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const vaults = [
    { id: 'RDData', stateKey: 'RDState', cacheKey: 'rd_library_v1', unwrap: true },
    { id: 'PapersData', stateKey: 'PapersState', cacheKey: 'PapersData_Local_Cache', unwrap: false }
  ];

  vaults.forEach(v => {
    /* doc is document.documentElement (an Element) — getElementById does not
       exist there, so select the vault script by attribute */
    const script = doc.querySelector('script[type="application/json"][id="' + v.id + '"]');
    if (!script) return;

    let foundData = null;
    const liveState = window[v.stateKey];
    if (liveState && typeof liveState === 'object' && Object.keys(liveState).length > 0) {
      foundData = (v.unwrap && liveState.rd) ? liveState.rd : liveState;
    }

    if (!foundData) {
      try {
        const cached = typeof localStorage !== 'undefined' ? localStorage.getItem(v.cacheKey) : null;
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') {
            foundData = (v.unwrap && parsed.rd) ? parsed.rd : parsed;
          }
        }
      } catch (e) { }
    }

    if (!foundData) return;

    try {
      const cleanData = JSON.parse(JSON.stringify(foundData));
      delete cleanData._unsaved;
      delete cleanData._savedAt;
      cleanData._lastSaved = now;

      script.textContent = '\n' + JSON.stringify(cleanData, null, 2).replace(/</g, '\\u003c') + '\n';

      if (typeof document !== 'undefined') {
        const liveScript = document.getElementById(v.id);
        if (liveScript && liveScript !== script) {
          liveScript.textContent = script.textContent;
        }
      }
    } catch (e) { }
  });
}

// Clears all unsaved local cache keys from browser localStorage (local copy),
// including R&D's own store key, so a saved standalone reopens from its
// embedded vault instead of a stale machine-local copy.
function clearAllTabLocalCaches() {
  if (typeof localStorage === 'undefined') return;
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.endsWith('_Local_Cache') || key.includes('_Cache'))) {
        localStorage.removeItem(key);
      }
    }
    localStorage.removeItem('rd_library_v1');
  } catch (e) { }
}

// Fetches one modular JS file and strips ES module syntax for flat embedding.
// Resolves paths against the project root (this file sits two levels deep).
async function bundleTabFile(filePath) {
  try {
    const cleanPath = filePath.endsWith('.js') ? filePath : filePath + '.js';
    const resolvedUrl = new URL('../../' + cleanPath, import.meta.url).href;
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
    code = code.replace(/<\/script/gi, '<\\/script');
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

// R&D's only 00_Components import (verified): the shared icon-button module.
const sharedComponentFiles = [
  '00_Components/09_Icon_Button.js'
];

const tabHandlerFiles = [
  '05_R&D/06_Tab_RD/Tab_Save_Handler.js',
  '05_R&D/06_Tab_RD/Tab_Logo_Handler.js',
  '05_R&D/06_Tab_RD/Tab_Import_Export_Handler.js'
];

// Same list and order as RD_APP_FILES in 05_R&D/05_Data_IO/01_Save_Button.js
// (dependency-ordered for the flat bundle: leaves before 00_State.js).
const tabModuleFiles = [
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
  '05_R&D/02_Dashboard/03_Heatmap.js',
  '05_R&D/02_Dashboard/01_Stats_Bar.js',
  '05_R&D/02_Dashboard/02_Resume_Section.js',
  '05_R&D/02_Dashboard/04_Tag_Bar.js',
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

// Compiles THIS tab into one standalone HTML file and downloads it.
// Inside an already-standalone file it just re-emits itself with fresh vault data.
export async function SaveRDStandalone() {
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
window.__LOCALHUB_PAGE__ = 'rd';

/* ==========================================================================
   SHARED COMPONENTS (icon buttons)
   ========================================================================== */
${bundledComponents}

/* ==========================================================================
   PER-TAB HANDLERS
   ========================================================================== */
${bundledHandlers}

/* ==========================================================================
   R&D PAGE MODULE
   ========================================================================== */
function LoadThisPage() {
${bundledTab}
  if (typeof initRDApp === 'function') initRDApp();
  if (typeof InitTabSaveOverride === 'function') InitTabSaveOverride();
  if (typeof InitTabLogoOverride === 'function') InitTabLogoOverride();
  if (typeof InitTabImportExportOverride === 'function') InitTabImportExportOverride();
}

/* ==========================================================================
   PAGE ROUTER (keeps in-tab deep links working)
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
        if (s.textContent.includes('RD.js') || s.textContent.includes('bootRDPage')) {
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

  // Brief confirmation pulse on the header Save control
  const saveBtn = document.querySelector('button[data-action="export-standalone"]');
  if (saveBtn) {
    const originalHTML = saveBtn.innerHTML;
    const originalTip = saveBtn.getAttribute('data-tip');
    saveBtn.style.background = '#16a34a';
    saveBtn.setAttribute('data-tip', 'Saved to file & Cache Cleared!');
    saveBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
    setTimeout(() => {
      saveBtn.style.background = '';
      if (originalTip) saveBtn.setAttribute('data-tip', originalTip);
      saveBtn.innerHTML = originalHTML;
    }, 2000);
  }
}

// Swaps the core standalone builder (minimal R&D-only page) for the per-tab
// shell builder above. R&D's delegated dispatcher consults
// window.RDSaveButton.DownloadStandaloneHTML FIRST, so replacing that member
// is the complete override — called after initRDApp() boots the app.
export function InitTabSaveOverride() {
  if (typeof window === 'undefined') return;
  const original = (window.RDSaveButton && typeof window.RDSaveButton === 'object') ? window.RDSaveButton : {};
  window.RDSaveButton = Object.assign({}, original, {
    DownloadStandaloneHTML: SaveRDStandalone
  });
}
