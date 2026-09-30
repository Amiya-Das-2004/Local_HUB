/* ==========================================================================
   PROFESSORS — 03_Professor_List/02_List_Actions.js
   Everything interactive on the professor list: expand/collapse, the data-action
   dispatcher (toggle/add/edit/delete/download/copy/journal), drag-to-reorder
   inside college groups, keyboard navigation (j/k/o/f, Shift+J/K) and the
   per-professor paper filter. Extracted verbatim from proff.html
   (lines 2280-2319, 3474-3657).
   ==========================================================================
*/

import { state, ui, persist, getProf, deleteProf, deletePaper, collegeKey } from '../00_State.js';
import { $, norm, todayISO, toast, copyText, saveText } from '../01_Utils.js';
import { armConfirm } from '../04_Modals/01_Modal_Core.js';
import { openProfModal } from '../04_Modals/02_Professor_Modal.js';
import { openPaperModal } from '../04_Modals/03_Paper_Modal.js';
import { openJournalModal } from '../04_Modals/04_Journal_Modal.js';
import { openBulkModal } from '../04_Modals/07_Bulk_Add_Modal.js';
import { downloadProfPapers, downloadPaperFile, downloadAttachment, paperDetailsText } from '../05_Data_IO/02_Export.js';
import { render } from '../Professors.js';
import { renderList } from './01_Prof_Cards.js';

export function updateExpandBtn() {
  var label = $('#expandAllLabel');
  if (label) label.textContent = ui.expandedProf === 'ALL' ? 'Collapse all' : 'Expand all';
}

/* ---------- keyboard navigation over professor cards ---------- */
function visibleCards() {
  return Array.prototype.slice.call(document.querySelectorAll('#profList .prof-card'));
}
export function updateKbFocus() {
  var cards = visibleCards();
  if (ui.kbIdx >= cards.length) ui.kbIdx = cards.length - 1;
  cards.forEach(function (c, i) { c.classList.toggle('kb-active', i === ui.kbIdx); });
}
export function moveKb(dir) {
  var cards = visibleCards();
  if (!cards.length) return;
  if (ui.kbIdx < 0) ui.kbIdx = dir > 0 ? -1 : 0;
  ui.kbIdx = Math.min(cards.length - 1, Math.max(0, ui.kbIdx + dir));
  updateKbFocus();
  var c = cards[ui.kbIdx];
  if (c) c.scrollIntoView({ block: 'nearest' });
}
export function toggleKbCard() {
  var cards = visibleCards();
  if (!cards.length) return;
  if (ui.kbIdx < 0 || ui.kbIdx >= cards.length) { ui.kbIdx = 0; updateKbFocus(); return; }
  var head = cards[ui.kbIdx].querySelector('.prof-head');
  if (head) head.click();
}
export function toggleKbFav() {
  var cards = visibleCards();
  if (ui.kbIdx < 0 || ui.kbIdx >= cards.length) { toast('Press j / k to select a professor first.', 'info'); return; }
  var p = getProf(cards[ui.kbIdx].dataset.prof);
  if (!p) return;
  p.fav = !p.fav;
  persist();
  renderList();
  toast(p.fav ? p.name + ' favorited — floats to the top of ' + (p.college || 'the list') + '.' : p.name + ' removed from favorites.');
}

/* ============================== list interactions ============================== */
function toggleGroup(grpEl) {
  var k = grpEl.dataset.group;
  if (!k) return;
  ui.collapsed[k] = !ui.collapsed[k];
  renderList();
}

/* ---------- drag-to-reorder professors inside a college group (QS mode) ---------- */
function domGroupOrder() {
  var cur = null, out = {};
  Array.prototype.forEach.call(document.querySelectorAll('#profList > *'), function (el) {
    if (el.classList && el.classList.contains('college-group')) { cur = el.dataset.group; out[cur] = []; }
    else if (el.classList && el.classList.contains('prof-card') && cur) out[cur].push(el.dataset.prof);
  });
  return out;
}
function clearDragInds() {
  document.querySelectorAll('.prof-card.drag-above,.prof-card.drag-below').forEach(function (c) { c.classList.remove('drag-above', 'drag-below'); });
}
export function clearDragState() {
  clearDragInds();
  document.querySelectorAll('.prof-card.dragging').forEach(function (c) { c.classList.remove('dragging'); });
  ui.dragId = null; ui.dragTarget = null; ui.dragBelow = false;
}
function reorderProf(dragId, targetId, below) {
  var dragged = getProf(dragId), target = getProf(targetId);
  if (!dragged || !target || dragId === targetId) return;
  if (collegeKey(dragged) !== collegeKey(target)) { toast('Professors can only be reordered within the same college.', 'info'); return; }
  var groups = domGroupOrder();
  var ids = groups[collegeKey(dragged)];
  if (!ids) return;
  ids = ids.filter(function (id) { return id !== dragId; });
  var idx = ids.indexOf(targetId);
  if (idx === -1) return;
  ids.splice(below ? idx + 1 : idx, 0, dragId);
  ids.forEach(function (id, i) { var p = getProf(id); if (p) p.order = i; });
  /* professors of this college hidden by a filter keep a stable slot at the end */
  var next = ids.length;
  state.professors.forEach(function (p) {
    if (collegeKey(p) === collegeKey(dragged) && ids.indexOf(p.id) === -1) p.order = next++;
  });
  persist(); renderList();
  toast(dragged.name + ' moved within ' + dragged.college + '.');
}
export function moveFocusedProf(dir) {
  var cards = visibleCards();
  if (ui.kbIdx < 0 || ui.kbIdx >= cards.length) { toast('Press j / k to select a professor first.', 'info'); return; }
  if (ui.sort !== 'qs') { toast('Switch to “QS Ranking” sort to reorder professors.', 'info'); return; }
  var id = cards[ui.kbIdx].dataset.prof;
  var p = getProf(id);
  if (!p) return;
  var i = ui.kbIdx + dir;
  while (i >= 0 && i < cards.length) {
    var q = getProf(cards[i].dataset.prof);
    if (q && collegeKey(q) === collegeKey(p)) break;
    i += dir;
  }
  if (i < 0 || i >= cards.length) { toast(dir > 0 ? 'Already last in this college.' : 'Already first in this college.', 'info'); return; }
  reorderProf(id, cards[i].dataset.prof, dir > 0);
  Array.prototype.forEach.call(document.querySelectorAll('#profList .prof-card'), function (c, n) {
    if (c.dataset.prof === id) ui.kbIdx = n;
  });
  updateKbFocus();
}

export function InitListActions() {
  $('#profList').addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.grip')) return; /* grip is for dragging, not toggling */
    var grpEl = e.target.closest('.college-group');
    if (grpEl) { toggleGroup(grpEl); return; }
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var action = el.dataset.action;
    var card = el.closest('[data-prof]');
    var profId = card ? card.dataset.prof : null;
    var prof = profId ? getProf(profId) : null;
    var prow = el.closest('[data-paper]');
    var paperId = prow ? prow.dataset.paper : null;
    if (!prof) return;
    var paper = paperId ? prof.papers.filter(function (x) { return x.id === paperId; })[0] : null;
    switch (action) {
      case 'toggle-prof':
        ui.expandedProf = ui.expandedProf === profId ? null : profId;
        ui.expandedPaper = null;
        renderList();
        break;
      case 'toggle-paper':
        ui.expandedPaper = ui.expandedPaper === paperId ? null : paperId;
        renderList();
        break;
      case 'add-paper': openPaperModal(profId, null); break;
      case 'bulk-add': openBulkModal(profId); break;
      case 'reread':
        if (paper) {
          paper.rereads = paper.rereads || [];
          paper.rereads.push(todayISO());
          paper.status = 'read';
          paper.finishedOn = todayISO();
          paper.readDate = todayISO();
          persist();
          render();
          toast('Re-read logged — the heatmap, streak and yearly goal are updated.');
        }
        break;
      case 'edit-prof': openProfModal(prof); break;
      case 'fav-prof':
        prof.fav = !prof.fav;
        persist();
        renderList();
        toast(prof.fav ? prof.name + ' favorited — floats to the top of ' + (prof.college || 'the list') + '.' : prof.name + ' removed from favorites.');
        break;
      case 'journal-add': if (paper) openJournalModal(profId, paper); break;
      case 'journal-del':
        if (paper && paper.journal && typeof el.dataset.idx !== 'undefined') {
          var ji = parseInt(el.dataset.idx, 10);
          if (ji >= 0 && ji < paper.journal.length) {
            paper.journal.splice(ji, 1);
            if (!paper.journal.length) delete paper.journal;
            persist();
            renderList();
            toast('Journal entry deleted.');
          }
        }
        break;
      case 'del-prof': armConfirm(el, function () { deleteProf(profId); }); break;
      case 'dl-prof-list': downloadProfPapers(prof); break;
      case 'copy-prof': copyText(JSON.stringify(prof, null, 2), 'Professor copied as JSON — paste it into any ProffTrack library (footer → “Paste professor JSON”).'); break;
      case 'edit-paper': if (paper) openPaperModal(profId, paper); break;
      case 'del-paper': armConfirm(el, function () { deletePaper(profId, paperId); }); break;
      case 'dl-paper': if (paper) downloadPaperFile(paper, prof); break;
      case 'dl-attach': if (paper) downloadAttachment(paper); break;
      case 'dl-paper-txt': if (paper) { saveText(paperDetailsText(paper, prof), paper.title); toast('Paper details downloaded.'); } break;
    }
  });
  $('#profList').addEventListener('dragstart', function (e) {
    var grip = e.target.closest ? e.target.closest('.grip') : null;
    if (!grip || ui.sort !== 'qs') return;
    var card = grip.closest('[data-prof]');
    if (!card) return;
    ui.dragId = card.dataset.prof;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', ui.dragId); } catch (err) {}
  });
  $('#profList').addEventListener('dragover', function (e) {
    if (!ui.dragId) return;
    var card = e.target.closest ? e.target.closest('.prof-card') : null;
    if (!card || card.dataset.prof === ui.dragId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    clearDragInds();
    var r = card.getBoundingClientRect();
    ui.dragBelow = e.clientY > r.top + r.height / 2;
    ui.dragTarget = card.dataset.prof;
    card.classList.add(ui.dragBelow ? 'drag-below' : 'drag-above');
  });
  $('#profList').addEventListener('drop', function (e) {
    if (!ui.dragId) return;
    e.preventDefault();
    var t = ui.dragTarget, b = ui.dragBelow, d = ui.dragId;
    clearDragState();
    if (t) reorderProf(d, t, b);
  });
  $('#profList').addEventListener('dragend', clearDragState);

  $('#profList').addEventListener('keydown', function (e) {
    var grpEl = e.target.closest ? e.target.closest('.college-group') : null;
    if (grpEl && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleGroup(grpEl); }
  });
  /* per-professor paper filter — DOM-level, keeps the input focused between keystrokes */
  $('#profList').addEventListener('input', function (e) {
    var inp = e.target.closest('.paper-filter');
    if (!inp) return;
    var card = inp.closest('[data-prof]');
    if (!card) return;
    var q = norm(inp.value);
    var rows = card.querySelectorAll('.paper-row');
    var n = 0;
    rows.forEach(function (row) {
      var hit = !q || norm(row.textContent).indexOf(q) !== -1;
      row.hidden = !hit;
      if (hit) n++;
    });
    var cnt = card.querySelector('.papers-head h4 span');
    if (cnt) cnt.textContent = q ? (n + ' of ' + rows.length) : (cnt.dataset.base || String(rows.length));
  });
}
