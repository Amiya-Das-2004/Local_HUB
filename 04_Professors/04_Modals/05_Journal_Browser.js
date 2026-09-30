/* ==========================================================================
   PROFESSORS — 04_Modals/05_Journal_Browser.js
   "Reading journal" browser — every dated entry across all papers, searchable,
   with jump-to-paper rows and a .txt text builder. Extracted verbatim from
   proff.html (markup 1219-1243, logic 3116-3178).
   NOTE: the modal's "Export .txt" button (#jrnlExportBtn) has no listener in
   proff.html either — journalBrowserText() is wired but unused there. Kept as-is.
   ==========================================================================
*/

import { state } from '../00_State.js';
import { $, esc, fmtDate, norm, ICONS, STATUS_META, statusOf } from '../01_Utils.js';
import { openModal } from './01_Modal_Core.js';

export function GetJournalBrowserHTML() {
  return `
<div class="modal" id="jrnlModal" role="dialog" aria-modal="true" aria-labelledby="jrnlModalTitle" hidden>
  <div class="modal-card" style="max-width:640px">
    <div class="modal-head">
      <h2 id="jrnlModalTitle">Reading journal</h2>
      <button class="icon-btn modal-close" type="button" aria-label="Close dialog">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <p class="bulk-hint">Every dated entry across all papers, newest first. Click a row to jump straight to the paper.</p>
      <div class="field" style="margin-bottom:12px">
        <label for="jrnlSearch">Search entries</label>
        <input id="jrnlSearch" type="search" placeholder="Filter by text, paper, professor, college…" aria-label="Filter journal entries"/>
      </div>
      <p class="jrnl-count" id="jrnlCount" role="status"></p>
      <div id="jrnlList" class="jrnl-list" role="list" aria-label="Journal entries, newest first"></div>
      <div class="modal-actions" style="margin-top:16px;padding-top:14px;border-top:1px dashed var(--line)">
        <button type="button" class="btn btn-line" id="jrnlExportBtn" title="Download every journal entry as a .txt file">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
          Export .txt
        </button>
      </div>
    </div>
  </div>
</div>`;
}

/* ---------- reading-journal browser (all entries across all papers) ---------- */
export function journalEntries() {
  var out = [];
  state.professors.forEach(function (p) {
    (p.papers || []).forEach(function (pp) {
      (pp.journal || []).forEach(function (en, i) {
        if (!en || !en.t) return;
        out.push({ d: String(en.d || ''), t: String(en.t), i: i, paper: pp, prof: p });
      });
    });
  });
  out.sort(function (a, b) { return String(b.d || '').localeCompare(String(a.d || '')) || (a.i - b.i); });
  return out;
}
export function journalBrowserHTML(q) {
  var all = journalEntries();
  var nq = norm(q || '');
  var rows = nq ? all.filter(function (en) {
    return norm(en.t).indexOf(nq) !== -1 ||
      norm(en.paper.title).indexOf(nq) !== -1 ||
      norm(en.prof.name).indexOf(nq) !== -1 ||
      norm(en.prof.college).indexOf(nq) !== -1;
  }) : all;
  var cntEl = '<b>' + rows.length + '</b> of ' + all.length + ' entr' + (all.length === 1 ? 'y' : 'ies') + (nq ? ' match' + (rows.length === 1 ? 'es' : '') + ' “' + esc(q) + '”' : '');
  if (!rows.length) {
    return { cnt: cntEl, html: '<div class="jrnl-empty">' + ICONS.pen +
      (all.length ? '<span>No entries match “' + esc(q) + '”.</span>' : '<span>No journal entries yet — open any paper and click <strong>Add journal entry</strong> to start a dated reading timeline.</span>') + '</div>' };
  }
  return { cnt: cntEl, html: rows.map(function (en) {
    var st = statusOf(en.paper);
    return '<button type="button" class="jrnl-row" role="listitem" data-jrnl-prof="' + esc(en.prof.id) + '" data-jrnl-paper="' + esc(en.paper.id) + '" title="Open this paper">' +
      '<span class="jrnl-date">' + esc(en.d ? fmtDate(en.d) : 'undated') + '</span>' +
      '<span class="jrnl-body"><span class="jrnl-txt">' + esc(en.t) + '</span>' +
      '<span class="jrnl-src"><span class="jp">' + esc(en.paper.title) + '</span><span aria-hidden="true">·</span><span>' + esc(en.prof.name) + '</span><span class="jc">' + esc(en.prof.college) + '</span>' + (st !== 'read' ? '<span class="st-pill ' + STATUS_META[st].cls + '">' + STATUS_META[st].label + '</span>' : '') + '</span></span></button>';
  }).join('') };
}
export function renderJournalList() {
  var built = journalBrowserHTML($('#jrnlSearch').value);
  $('#jrnlCount').innerHTML = built.cnt;
  $('#jrnlList').innerHTML = built.html;
}
export function openJournalBrowser() {
  var s = $('#jrnlSearch');
  s.value = '';
  renderJournalList();
  openModal('#jrnlModal');
  setTimeout(function () { s.focus(); }, 60);
}
export function journalBrowserText() {
  var all = journalEntries();
  var L = ['ProffTrack — Reading Journal (all entries)', '=========================================='];
  if (!all.length) L.push('(no journal entries yet)');
  all.forEach(function (en) {
    L.push('');
    L.push('· ' + (en.d || 'undated') + ' — ' + String(en.t).replace(/\s*\n\s*/g, ' / '));
    L.push('  Paper    : ' + en.paper.title);
    L.push('  Professor: ' + en.prof.name + ' — ' + en.prof.college);
  });
  L.push('');
  L.push('------------------------------------------');
  L.push('Exported from ProffTrack on ' + new Date().toLocaleString());
  return L.join('\n');
}
