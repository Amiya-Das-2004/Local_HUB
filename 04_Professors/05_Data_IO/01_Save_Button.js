// ============================================================
// PROFESSORS (ProfessorTrack) — 05_Data_IO/01_Save_Button.js
// Recursive standalone HTML builder: fetches the LIVE modular
// sources, strips module syntax, escapes script-closers, and embeds
// them with the current library data into ONE offline .html file.
// (Replaces the frozen PROFF_TEMPLATE exact-copy — downloads now
// always carry the current application code.)
// ============================================================

import { state, persist } from '../00_State.js';

export const SAVE_NAME = 'proff.html';

const PROF_APP_FILES = [
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
  '04_Professors/Professors.js',
];

const COMPONENT_FILES = [
  '00_Components/01_Local_HUB_Logo.js',
  '00_Components/02_Theme_Toggle.js',
  '00_Components/03_Scrollbar.js',
  '00_Components/04_Import_Export.js',
  '00_Components/05_Save_Button.js',
  '00_Components/06_Color_Selector.js',
  '00_Components/07_Blob_Store.js',
  '00_Components/08_Research_Library.js',
  '00_Components/09_Icon_Button.js',
];


function StripModuleSyntax(code) {
  code = code.replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '');
  code = code.replace(/^\s*import\s+['"][^'"]+['"];?\s*$/gm, '');
  code = code.replace(/^\s*export\s+\*[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '');
  code = code.replace(/^\s*export\s*\{[\s\S]*?\}\s*from\s+['"][^'"]+['"];?\s*$/gm, '');
  code = code.replace(/^\s*export\s*\{[\s\S]*?\};?\s*$/gm, '');
  code = code.replace(/^\s*export\s+default\s+/gm, '');
  code = code.replace(/^\s*export\s+(async\s+)?(function|const|let|var|class)/gm, (m, p1, p2) => (p1 || '') + p2);
  code = code.replace(/<\/script/gi, '<\\/script');
  return code;
}

async function FetchBundle(files) {
  let out = '';
  for (const f of files) {
    try {
      const res = await fetch(new URL('../../' + f, import.meta.url).href);
      if (!res.ok) { console.warn('[ProfessorTrack builder] missing ' + f + ' (' + res.status + ')'); continue; }
      const code = await res.text();
      if (!code.trim()) continue;
      out += '\n/* --- ' + f + ' --- */\n' + StripModuleSyntax(code) + '\n';
    } catch (e) {
      console.warn('[ProfessorTrack builder] fetch failed for ' + f + ':', e);
    }
  }
  return out;
}

function EscapeJsonForScript(dataJson) {
  return dataJson.replace(/</g, '\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

export function IsProffStandalone() {
  return typeof window !== 'undefined' && window.__PROFF_STANDALONE__ === true;
}

export async function buildSaveHtml() {
  persist();

  if (IsProffStandalone()) {
    // Self-replicating re-save: re-emit THIS document with a freshly synced vault.
    const vault = document.getElementById('app-data');
    if (vault) vault.textContent = '\n' + JSON.stringify(state, null, 2).replace(/</g, '\u003c') + '\n';
    return '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
  }

  // Dev branch: fetch the LIVE application code and ship it.
  const bundle = await FetchBundle([...COMPONENT_FILES, ...PROF_APP_FILES]);
  if (!bundle.trim()) throw new Error('Could not read application sources (serve over http(s) and retry).');
  const dataJson = EscapeJsonForScript(JSON.stringify(state, null, 2));
  return '<!DOCTYPE html>\n' +
    '<html lang="en">\n<head>\n' +
    '<meta charset="UTF-8"/>\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1"/>\n' +
    '<title>ProfessorTrack \u00b7 Professors &amp; Papers Library</title>\n' +
    '<link rel="icon" type="image/svg+xml" href=' + JSON.stringify("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cpath%20fill='%230f766e'%20d='M12%203%201%208l11%205%209-4.09V15h2V8L12%203zM5%2012.18V16c0%201.66%203.13%203%207%203s7-1.34%207-3v-3.82l-7%203.18-7-3.18z'/%3E%3C/svg%3E") + '/>\n' +
    '</head>\n<body>\n' +
    '<div id="root"></div>\n' +
    '<script id="app-data" type="application/json">\n' + dataJson + '\n<\/script>\n' +
    '<script>window.__PROFF_STANDALONE__ = true;<\/script>\n' +
    '<script>\n' + bundle + '\ninitProfessorsApp();\n<\/script>\n' +
    '</body>\n</html>';
}

export async function downloadWebsite() {
  try {
    const html = await buildSaveHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = SAVE_NAME;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch (err) {
    console.error('[ProfessorTrack] standalone export failed:', err);
    alert('Export failed: ' + (err && err.message || err));
  }
}

export function InitSaveButton() {
  const btn = document.getElementById('saveBtn');
  if (btn) btn.addEventListener('click', () => downloadWebsite());
}
