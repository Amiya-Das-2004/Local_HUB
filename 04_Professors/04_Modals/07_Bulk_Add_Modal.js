/* ==========================================================================
   PROFESSORS — 04_Modals/07_Bulk_Add_Modal.js
   Bulk add papers: paste one paper per line; titles, years "(2017)" / "— 2019"
   and URLs are parsed automatically; duplicates skipped. Extracted verbatim
   from proff.html (markup 1188-1216, logic 3222-3289).
   ==========================================================================
*/

import { state, ui, persist, sanitizeIds, getProf } from '../00_State.js';
import { $, toast, norm, uid, todayISO } from '../01_Utils.js';
import { openModal, closeModal } from './01_Modal_Core.js';
import { render } from '../Professors.js';

export function GetBulkModalHTML() {
  return `
<div class="modal" id="bulkModal" role="dialog" aria-modal="true" aria-labelledby="bulkModalTitle" hidden>
  <div class="modal-card" style="max-width:560px">
    <div class="modal-head">
      <h2 id="bulkModalTitle">Bulk add papers</h2>
      <button class="icon-btn modal-close" type="button" aria-label="Close dialog">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <p class="bulk-hint">One paper per line — a year like <code>(2017)</code> or <code>— 2019</code> and a URL are picked up automatically. Titles already in this professor's list are skipped.</p>
      <div class="field" style="margin-bottom:12px">
        <label for="bulkStatus">Mark the added papers as</label>
        <select id="bulkStatus">
          <option value="wishlist" selected>Want to read</option>
          <option value="reading">Currently reading</option>
          <option value="read">Read ✓</option>
        </select>
      </div>
      <div class="field">
        <label for="bulkArea">Paper list</label>
        <textarea id="bulkArea" class="paste-area" style="min-height:170px" placeholder="Attention Is All You Need (2017)&#10;BERT: Pre-training of Deep Bidirectional Transformers — 2019&#10;A Mathematical Theory of Communication, 1948, https://example.org/shannon.pdf" aria-label="Paper list, one paper per line"></textarea>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-line modal-cancel">Cancel</button>
        <button type="button" class="btn btn-primary" id="bulkAddBtn">Add papers</button>
      </div>
    </div>
  </div>
</div>`;
}

/* ---------- bulk add papers (paste a list, one per line) ---------- */
var bulkProfId = null;
export function parseBulkLine(line) {
  var s = String(line || '').trim();
  if (!s) return null;
  var url = '';
  var mUrl = s.match(/https?:\/\/\S+/);
  if (mUrl) { url = mUrl[0].replace(/[),.;]+$/, ''); s = (s.slice(0, mUrl.index) + ' ' + s.slice(mUrl.index + mUrl[0].length)).trim(); }
  var year = null;
  /* bracket groups carrying a year — "[NeurIPS 2019]", "(2017)" — yield the year and drop the whole group */
  s = s.replace(/([(\[])[^()\[\]]*((?:19|20)\d{2})[^()\[\]]*[)\]]/g, function (_, o, y) { year = parseInt(y, 10); return ' '; });
  if (year == null) {
    var mY = s.match(/(?:^|[^\d])((?:19|20)\d{2})(?!\d)/);
    if (mY) { year = parseInt(mY[1], 10); s = (s.slice(0, mY.index) + ' ' + s.slice(mY.index + mY[0].length)).trim(); }
  }
  s = s.replace(/\s{2,}/g, ' ').replace(/\s*,\s*,\s*/g, ', ').replace(/\s+,/g, ',').replace(/,(?=\S)/g, ', ').trim();
  s = s.replace(/^[\s,;:|\-–—()\[\]{}]+/, '').replace(/[\s,;:|\-–—()\[\]{}]+$/, '').trim();
  if (!s) return null;
  return { title: s, year: year, url: url };
}
export function openBulkModal(profId) {
  var p = getProf(profId);
  if (!p) return;
  bulkProfId = profId;
  $('#bulkArea').value = '';
  $('#bulkStatus').value = 'wishlist';
  $('#bulkAddBtn').textContent = 'Add papers';
  $('#bulkModalTitle').textContent = 'Bulk add papers — ' + p.name;
  openModal('#bulkModal');
  setTimeout(function () { $('#bulkArea').focus(); }, 60);
}
export function InitBulkModal() {
  $('#bulkArea').addEventListener('input', function () {
    var n = this.value.split('\n').filter(function (l) { return l.trim(); }).length;
    $('#bulkAddBtn').textContent = n ? ('Add ' + n + ' paper' + (n === 1 ? '' : 's')) : 'Add papers';
  });
  $('#bulkAddBtn').addEventListener('click', function () {
    var prof = getProf(bulkProfId);
    if (!prof) { closeModal($('#bulkModal')); return; }
    var st = $('#bulkStatus').value || 'wishlist';
    var existing = {};
    (prof.papers || []).forEach(function (x) { existing[norm(x.title)] = 1; });
    var added = 0, dups = 0;
    $('#bulkArea').value.split('\n').forEach(function (line) {
      var parsed = parseBulkLine(line);
      if (!parsed) return;
      var key = norm(parsed.title);
      if (existing[key]) { dups++; return; }
      existing[key] = 1;
      (prof.papers = prof.papers || []).push({
        id: uid('pp'), title: parsed.title, authors: '', year: parsed.year,
        venue: '', url: parsed.url, status: st,
        startedOn: st === 'reading' ? todayISO() : null,
        finishedOn: st === 'read' ? todayISO() : null,
        readDate: st === 'read' ? todayISO() : null,
        rating: st === 'read' ? 4 : 0,
        tags: [], summary: '', notes: '', attachment: null,
        createdAt: new Date().toISOString()
      });
      added++;
    });
    if (!added) { toast(dups ? ('Nothing new — all ' + dups + ' title' + (dups === 1 ? '' : 's') + ' already in this list.') : 'Nothing to add — the list is empty.', 'info'); return; }
    persist();
    sanitizeIds();
    closeModal($('#bulkModal'));
    ui.expandedProf = bulkProfId;
    render();
    toast(added + ' paper' + (added === 1 ? '' : 's') + ' added to ' + prof.name + (dups ? ' — ' + dups + ' duplicate' + (dups === 1 ? '' : 's') + ' skipped' : '') + '.');
  });
}
