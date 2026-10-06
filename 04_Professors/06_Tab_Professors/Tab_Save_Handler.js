// Per-tab standalone Save handler for 04_Professors/06_Tab_Professors/Professor.html.
//
// This file is deliberately SELF-CONTAINED (no imports from 00_Components or the
// professor modules) and is NOT part of the all-in-one bundler lists in
// 00_Components/05_Save_Button.js. Index.html never loads it. Its only job: on
// the Professor.html tab page, the header Save button compiles exactly this tab
// (shared components + these handler files + the professor modules) into ONE
// standalone HTML file and downloads it.
//
// The shared Save button on Index.html (all-in-one build) is completely untouched,
// and the tab's core PROFF_TEMPLATE saver (05_Data_IO/01_Save_Button.js) stays
// available for non-tab contexts; this override simply wins inside the tab shell
// because it rebinds #saveBtn after initProfessorsApp() mounts the header.

const TAB_OUTPUT_NAME = 'Professor.html';

// Syncs the tab's DOM <script type="application/json"> vault blocks with live
// window states and localStorage caches (local copy of the proven shared sync
// logic, narrowed to the two vaults this shell carries).
function syncTabStatesToDOM(doc) {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const vaults = [
    { id: 'ProfessorsData', stateKey: 'ProfessorsState', cacheKey: 'profftrack:v1' },
    { id: 'PapersData', stateKey: 'PapersState', cacheKey: 'PapersData_Local_Cache' }
  ];

  vaults.forEach(v => {
    /* doc is document.documentElement (an Element) — getElementById does not
       exist there, so select the vault script by attribute */
    const script = doc.querySelector('script[type="application/json"][id="' + v.id + '"]');
    if (!script) return;

    let foundData = null;
    const liveState = window[v.stateKey];
    if (liveState && typeof liveState === 'object' && Object.keys(liveState).length > 0) {
      foundData = liveState;
    }

    if (!foundData) {
      try {
        const cached = typeof localStorage !== 'undefined' ? localStorage.getItem(v.cacheKey) : null;
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') foundData = parsed;
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
// including ProffTrack's own store key, so a saved standalone reopens from its
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
    localStorage.removeItem('profftrack:v1');
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

// Components the professor modules import (research-registry bridge, blob
// store, icon buttons) — bundled first so their definitions exist before
// 00_State.js evaluates.
const sharedComponentFiles = [
  '00_Components/07_Blob_Store.js',
  '00_Components/08_Research_Library.js',
  '00_Components/09_Icon_Button.js'
];

const tabHandlerFiles = [
  '04_Professors/06_Tab_Professors/Tab_Save_Handler.js',
  '04_Professors/06_Tab_Professors/Tab_Logo_Handler.js',
  '04_Professors/06_Tab_Professors/Tab_Import_Export_Handler.js'
];

// Same list and order as professorFiles in 00_Components/05_Save_Button.js.
const tabModuleFiles = [
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

// Compiles THIS tab into one standalone HTML file and downloads it.
// Inside an already-standalone file it just re-emits itself with fresh vault data.
export async function SaveProfessorsStandalone() {
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
window.__LOCALHUB_PAGE__ = 'professors';

/* ==========================================================================
   SHARED COMPONENTS (blob store · research registry · icon buttons)
   ========================================================================== */
${bundledComponents}

/* ==========================================================================
   PER-TAB HANDLERS
   ========================================================================== */
${bundledHandlers}

/* ==========================================================================
   PROFESSORS PAGE MODULE
   ========================================================================== */
function LoadThisPage() {
${bundledTab}
  if (typeof initProfessorsApp === 'function') initProfessorsApp();
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
        if (s.textContent.includes('Professors.js') || s.textContent.includes('bootProfessorsPage')) {
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

  // Brief confirmation pulse on the header Save button
  const saveBtn = document.getElementById('saveBtn');
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

// Swaps the core Save binding (which would emit the PROFF_TEMPLATE standalone)
// for the per-tab shell builder above. Called after initProfessorsApp() mounts
// the header.
export function InitTabSaveOverride() {
  const btn = document.getElementById('saveBtn');
  if (!btn) return;
  const clone = btn.cloneNode(true); // clone drops the core click listener
  btn.replaceWith(clone);
  clone.addEventListener('click', (e) => {
    e.preventDefault();
    SaveProfessorsStandalone();
  });
}
