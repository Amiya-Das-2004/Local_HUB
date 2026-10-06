/* ==========================================================================
   PROFESSORS — Professors.js
   Entry point for the ProffTrack app (exact modular extraction of workspace
   proff.html). Contract matches Bookmarks.js / Notes.js:

     import('./Professors/Professors.js').then(m => m.initProfessorsApp())

   Index.html wiring (later, do NOT touch Index.html yet):
     1. vault tag in <head>:  <script type="application/json" id="ProfessorsData">
        { "version": 1, "updatedAt": null, "professors": [] } </script>
     2. route in handleRoute(): #professors → import './Professors/Professors.js'
        and call initProfessorsApp()

   The same folder also powers a future standalone Professor.html shell that
   embeds the identical vault tag + a module script tag — no code changes needed.
   ==========================================================================
*/

import { InitProfessorsStyles } from './02_Styles.js';
import { state, ui, loadState, sanitizeIds } from './00_State.js';
import { $ } from './01_Utils.js';
import { GetHeaderHTML, InitHeader } from './01_HTML_Page/01_Header.js';
import { InitToolbar } from './01_HTML_Page/02_Toolbar.js';
import { applyTheme, InitThemeToggle } from './01_HTML_Page/03_Theme_Toggle.js';
import { GetFooterHTML, InitFooter } from './01_HTML_Page/04_Footer.js';
import { GetGoalModalHTML, renderStats, InitStatsBar } from './02_Dashboard/01_Stats_Bar.js';
import { renderResume, InitResumeSection } from './02_Dashboard/02_Resume_Section.js';
import { renderHeat, InitHeatmap } from './02_Dashboard/03_Heatmap.js';
import { renderTagBar, InitTagBar } from './02_Dashboard/04_Tag_Bar.js';
import { renderList } from './03_Professor_List/01_Prof_Cards.js';
import { updateKbFocus, InitListActions } from './03_Professor_List/02_List_Actions.js';
import { InitModalCore } from './04_Modals/01_Modal_Core.js';
import { GetProfessorModalHTML, InitProfessorModal } from './04_Modals/02_Professor_Modal.js';
import { GetPaperModalHTML, InitPaperModal } from './04_Modals/03_Paper_Modal.js';
import { GetJournalModalHTML, InitJournalModal } from './04_Modals/04_Journal_Modal.js';
import { GetJournalBrowserHTML } from './04_Modals/05_Journal_Browser.js';
import { GetCompareModalHTML, InitCompareModal } from './04_Modals/06_Compare_Modal.js';
import { GetBulkModalHTML, InitBulkModal } from './04_Modals/07_Bulk_Add_Modal.js';
import { GetPasteModalHTML, InitPasteImportModal } from './04_Modals/08_Paste_Import_Modal.js';
import { GetShortcutsModalHTML, InitShortcutsModal } from './04_Modals/09_Shortcuts_Modal.js';
import { InitSaveButton } from './05_Data_IO/01_Save_Button.js';
import { InitExport } from './05_Data_IO/02_Export.js';
import { InitImport } from './05_Data_IO/03_Import.js';

/* master render cycle (proff.html line 2279) */
export function render() { renderStats(); renderResume(); renderHeat(); renderTagBar(); renderList(); updateKbFocus(); }

/* static page skeleton: header + 5 content sections + footer + 9 modals + toast + back-to-top */
function GetProfessorsHTML() {
  return '<div class="page">' +
    GetHeaderHTML() +
    '<main class="content">' +
      '<section id="statsBar" class="stats-bar" aria-label="Library statistics"></section>' +
      '<section id="resumeSection" class="resume-section" hidden aria-label="Continue reading"></section>' +
      '<section id="heatSection" class="heat-section" hidden aria-label="Reading activity heatmap"></section>' +
      '<section id="tagBar" class="tag-bar" hidden aria-label="Filter by tag"></section>' +
      '<section id="profList" class="prof-list" aria-live="polite"></section>' +
    '</main>' +
    GetFooterHTML() +
    GetProfessorModalHTML() +
    GetPaperModalHTML() +
    GetPasteModalHTML() +
    GetJournalModalHTML() +
    GetCompareModalHTML() +
    GetBulkModalHTML() +
    GetJournalBrowserHTML() +
    GetShortcutsModalHTML() +
    GetGoalModalHTML() +
    '<div id="toast" class="toast" role="status" aria-live="polite">' +
      '<svg class="ico-ok" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>' +
      '<svg class="ico-info" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>' +
      '<span id="toastMsg"></span>' +
    '</div>' +
    '<button id="scrollTopBtn" class="scroll-top" type="button" aria-label="Back to top" hidden>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>' +
    '</button>' +
  '</div>';
}

let booted = false;
export function initProfessorsApp() {
  InitProfessorsStyles();
  /* mount into the shell's #root when present (Professor.html / bundled
     Local_HUB.html pattern), else create the app container on <body> */
  var host = document.getElementById('root') || document.body;
  var root = document.getElementById('ProfessorsApp');
  if (!root) {
    root = document.createElement('div');
    root.id = 'ProfessorsApp';
    host.appendChild(root);
  }
  root.innerHTML = GetProfessorsHTML();

  /* element-level bindings — the DOM is fresh on every mount */
  InitModalCore();
  InitHeader();
  InitToolbar();
  InitThemeToggle();
  InitFooter();
  InitStatsBar();
  InitResumeSection();
  InitHeatmap();
  InitTagBar();
  InitListActions();
  InitProfessorModal();
  InitPaperModal();
  InitJournalModal();
  InitCompareModal();
  InitBulkModal();
  InitPasteImportModal();
  InitShortcutsModal();
  InitSaveButton();
  InitExport();
  InitImport();

  if (!booted) {
    /* ============================== boot (proff.html lines 3705-3711) ============================== */
    booted = true;
    loadState();
    sanitizeIds();
    if (!state.theme) state.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  } else {
    /* hash re-entry: restore the select values the fresh markup forgot */
    $('#sortSelect').value = ui.sort;
    var statusSel = $('#statusSelect'); /* row-3 status filter was removed from the header */
    if (statusSel) statusSel.value = ui.statusFilter;
  }
  applyTheme(state.theme);
  ui.sort = $('#sortSelect').value || 'qs';
  render();
}
