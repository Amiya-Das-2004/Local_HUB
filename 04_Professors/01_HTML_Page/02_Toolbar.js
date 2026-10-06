/* ==========================================================================
   PROFESSORS — 01_HTML_Page/02_Toolbar.js
   Toolbar behaviour: search, sort, status filter, favorites, expand-all,
   compare + journal buttons, per-professor paper-sort select.
   Extracted from proff.html toolbar bindings (lines 3659-3694, 2526-2534).
   ==========================================================================
*/

import { state, ui } from '../00_State.js';
import { $, toast } from '../01_Utils.js';
import { render } from '../Professors.js';
import { renderList } from '../03_Professor_List/01_Prof_Cards.js';
import { openCompare } from '../04_Modals/06_Compare_Modal.js';
import { openJournalBrowser } from '../04_Modals/05_Journal_Browser.js';

export function InitToolbar() {
  $('#searchInput').addEventListener('input', function () {
    ui.search = this.value;
    renderList();
  });
  $('#sortSelect').addEventListener('change', function () {
    ui.sort = this.value;
    renderList();
  });
  /* ---------- secondary utilities (row 3) were removed from the header —
     bindings survive guarded so the controls can be re-wired later ---------- */
  var statusSel = $('#statusSelect');
  if (statusSel) statusSel.addEventListener('change', function () {
    ui.statusFilter = this.value;
    ui.expandedPaper = null;
    render();
  });
  var favBtn = $('#favBtn');
  if (favBtn) favBtn.addEventListener('click', function () {
    ui.favOnly = !ui.favOnly;
    this.classList.toggle('active', ui.favOnly);
    this.setAttribute('aria-pressed', String(ui.favOnly));
    renderList();
    if (ui.favOnly && !state.professors.some(function (p) { return p.fav; })) {
      toast('No favorites yet — open a professor and press the ★ star (or focus it and hit F).', 'info');
    }
  });
  var expandAllBtn = $('#expandAllBtn');
  if (expandAllBtn) expandAllBtn.addEventListener('click', function () {
    ui.expandedProf = ui.expandedProf === 'ALL' ? null : 'ALL';
    ui.expandedPaper = null;
    renderList();
  });
  var compareBtn = $('#compareBtn');
  if (compareBtn) compareBtn.addEventListener('click', openCompare);
  var journalBtn = $('#journalBtn');
  if (journalBtn) journalBtn.addEventListener('click', openJournalBrowser);
  $('#profList').addEventListener('change', function (e) {
    var sel = e.target.closest('[data-paper-sort]');
    if (sel) {
      ui.paperSort = sel.value;
      renderList();
    }
  });
}
