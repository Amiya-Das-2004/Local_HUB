/* ==========================================================================
   PROFESSORS — 04_Modals/06_Compare_Modal.js
   Side-by-side professor comparison (stats with winner highlighting, paper
   lists) plus the .txt comparison export. Extracted verbatim from proff.html
   (markup 1160-1185, logic 3297-3447; cmpAvatar itself lives in 01_Utils.js).
   ==========================================================================
*/

import { state, getProf } from '../00_State.js';
import { $, esc, fmtDate, stars, toast, saveText, STATUS_META, statusOf, statusPill, cmpAvatar } from '../01_Utils.js';
import { openModal } from './01_Modal_Core.js';
import { openProfModal } from './02_Professor_Modal.js';

export function GetCompareModalHTML() {
  return `
<div class="modal" id="cmpModal" role="dialog" aria-modal="true" aria-labelledby="cmpModalTitle" hidden>
  <div class="modal-card" style="max-width:720px">
    <div class="modal-head">
      <h2 id="cmpModalTitle">Compare professors</h2>
      <button class="icon-btn modal-close" type="button" aria-label="Close dialog">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="cmp-pick">
        <select id="cmpA" aria-label="First professor"></select>
        <button type="button" class="icon-btn cmp-swap" id="cmpSwap" title="Swap sides" aria-label="Swap the two professors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>
        </button>
        <select id="cmpB" aria-label="Second professor"></select>
      </div>
      <div id="cmpBody"></div>
      <div class="modal-actions" style="margin-top:16px;padding-top:14px;border-top:1px dashed var(--line)">
        <button type="button" class="btn btn-line" id="cmpExportBtn" title="Download this side-by-side comparison as a .txt file">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
          Export .txt
        </button>
      </div>
    </div>
  </div>
</div>`;
}

/* ---------- compare professors side by side ---------- */
export function cmpStats(p) {
  var papers = p.papers || [];
  var s = { papers: papers, n: papers.length, read: 0, reading: 0, wish: 0, rated: 0, sum: 0, five: 0, last: null };
  papers.forEach(function (pp) {
    var st = statusOf(pp);
    if (st === 'read') {
      s.read++;
      var fd = pp.finishedOn || pp.readDate;
      if (fd && (!s.last || fd > s.last)) s.last = fd;
    } else if (st === 'reading') s.reading++;
    else s.wish++;
    if (typeof pp.rating === 'number' && pp.rating > 0) { s.rated++; s.sum += pp.rating; if (pp.rating === 5) s.five++; }
  });
  s.avg = s.rated ? s.sum / s.rated : null;
  return s;
}
export function cmpPaperList(s) {
  if (!s.papers.length) return '<p class="cmp-empty">No papers logged.</p>';
  var arr = s.papers.slice().sort(function (x, y) {
    return (y.rating || 0) - (x.rating || 0) || (y.year || 0) - (x.year || 0) || String(x.title).localeCompare(String(y.title));
  });
  return arr.map(function (pp) {
    var st = statusOf(pp);
    return '<div class="cmp-paper"><span class="t">' + esc(pp.title) + '</span><span class="m">' + stars(pp.rating) +
      (pp.year ? '<span>' + esc(pp.year) + '</span>' : '') +
      (st !== 'read' ? statusPill(pp) : '') +
      ((pp.rereads || []).length ? '<span title="Times re-read">↻ ×' + pp.rereads.length + '</span>' : '') +
    '</span></div>';
  }).join('');
}
export function renderCompare() {
  var body = $('#cmpBody');
  if (!state.professors.length) { body.innerHTML = '<p class="cmp-empty">Your library is empty — add professors first, then compare them here.</p>'; return; }
  var a = getProf($('#cmpA').value), b = getProf($('#cmpB').value);
  if (!a || !b) { body.innerHTML = '<p class="cmp-empty">Pick two professors to compare.</p>'; return; }
  if (a.id === b.id) { body.innerHTML = '<p class="cmp-empty">Pick two <strong>different</strong> professors to compare them.</p>'; return; }
  var sa = cmpStats(a), sb = cmpStats(b);
  function win(x, y) { return (x == null || y == null || x === y) ? [false, false] : (x > y ? [true, false] : [false, true]); }
  function avgF(v) { return v == null ? '—' : v.toFixed(1) + ' ★'; }
  function dateF(v) { return v ? fmtDate(v) : '—'; }
  var rAvg = win(sa.avg, sb.avg), rLast = win(sa.last, sb.last), rRead = win(sa.read, sb.read), rFive = win(sa.five, sb.five);
  var rows = [
    { k: 'Papers logged', fa: String(sa.n), fb: String(sb.n), wa: false, wb: false },
    { k: 'Read', fa: String(sa.read), fb: String(sb.read), wa: rRead[0], wb: rRead[1] },
    { k: 'Reading now', fa: String(sa.reading), fb: String(sb.reading), wa: false, wb: false },
    { k: 'Want to read', fa: String(sa.wish), fb: String(sb.wish), wa: false, wb: false },
    { k: 'Average rating', fa: avgF(sa.avg), fb: avgF(sb.avg), wa: rAvg[0], wb: rAvg[1] },
    { k: 'Favourites (5★)', fa: String(sa.five), fb: String(sb.five), wa: rFive[0], wb: rFive[1] },
    { k: 'Latest finish', fa: dateF(sa.last), fb: dateF(sb.last), wa: rLast[0], wb: rLast[1] }
  ];
  function colHTML(p, s, side) {
    return '<div class="cmp-col">' +
      '<div class="cmp-id">' + cmpAvatar(p) +
        '<span class="cmp-id-txt"><span class="cmp-name">' + esc(p.name) + '</span>' +
        '<span class="cmp-college">' + esc(p.college) + (typeof p.qsRank === 'number' ? ' · QS #' + p.qsRank : '') + '</span></span></div>' +
      '<div class="cmp-stats">' + rows.map(function (r) {
        return '<div class="cmp-row"><span class="k">' + r.k + '</span><span class="v' + (r['w' + side] ? ' win' : '') + '">' + r['f' + side] + '</span></div>';
      }).join('') + '</div>' +
      '<div class="cmp-papers">' + cmpPaperList(s) + '</div>' +
    '</div>';
  }
  body.innerHTML = '<div class="cmp-grid">' + colHTML(a, sa, 'a') + colHTML(b, sb, 'b') + '</div>';
}
function cmpFillSelects() {
  var sorted = state.professors.slice().sort(function (x, y) { return x.name.localeCompare(y.name); });
  var opts = sorted.map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.name) + '</option>'; }).join('');
  $('#cmpA').innerHTML = opts;
  $('#cmpB').innerHTML = opts;
  $('#cmpA').value = sorted[0].id;
  $('#cmpB').value = (sorted[1] || sorted[0]).id;
}
export function openCompare() {
  if (!state.professors.length) { toast('Add a professor first — then compare them here.', 'info'); openProfModal(null); return; }
  cmpFillSelects();
  openModal('#cmpModal');
  renderCompare();
}
/* ---------- compare export (.txt) ---------- */
function starsText(r) {
  var n = Math.max(0, Math.min(5, Number(r) || 0));
  return n ? '★'.repeat(n) + '☆'.repeat(5 - n) : '(unrated)';
}
function padTxt(s, w) { s = String(s); return s.length >= w ? s : s + Array(w - s.length + 1).join(' '); }
function cmpPaperLines(s) {
  if (!s.papers.length) return ['  (no papers logged)'];
  var arr = s.papers.slice().sort(function (x, y) {
    return (y.rating || 0) - (x.rating || 0) || (y.year || 0) - (x.year || 0) || String(x.title).localeCompare(String(y.title));
  });
  var out = [];
  arr.forEach(function (pp) {
    var st = statusOf(pp);
    out.push('  ' + starsText(pp.rating) + '  ' + (pp.year || '    ') + '  ' + pp.title +
      (st !== 'read' ? '  [' + STATUS_META[st].label + ']' : '') +
      ((pp.rereads || []).length ? '  [re-read ×' + pp.rereads.length + ']' : ''));
    if (pp.url) out.push('        ' + pp.url);
  });
  return out;
}
function compareText() {
  var a = getProf($('#cmpA').value), b = getProf($('#cmpB').value);
  if (!a || !b || a.id === b.id) return null;
  var sa = cmpStats(a), sb = cmpStats(b);
  function avgF(v) { return v == null ? '—' : v.toFixed(1) + ' ★'; }
  function dateF(v) { return v ? fmtDate(v) : '—'; }
  function idLine(tag, p) {
    return tag + ') ' + p.name + ' — ' + (p.college || '—') + (typeof p.qsRank === 'number' ? ' (QS #' + p.qsRank + ')' : '');
  }
  var L = [];
  L.push('PROFFTRACK — PROFESSOR COMPARISON');
  L.push('Generated ' + new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  L.push('');
  L.push(idLine('A', a));
  L.push(idLine('B', b));
  L.push('');
  L.push(padTxt('STATISTICS', 30) + padTxt('A', 28) + 'B');
  L.push(Array(62).join('-'));
  [
    ['Papers logged', String(sa.n), String(sb.n)],
    ['Read', String(sa.read), String(sb.read)],
    ['Reading now', String(sa.reading), String(sb.reading)],
    ['Want to read', String(sa.wish), String(sb.wish)],
    ['Average rating', avgF(sa.avg), avgF(sb.avg)],
    ['Favourites (5★)', String(sa.five), String(sb.five)],
    ['Latest finish', dateF(sa.last), dateF(sb.last)]
  ].forEach(function (r) { L.push(padTxt(r[0], 30) + padTxt(r[1], 28) + r[2]); });
  L.push('');
  L.push('PAPERS — A) ' + a.name);
  L.push(Array(40).join('-'));
  cmpPaperLines(sa).forEach(function (l) { L.push(l); });
  L.push('');
  L.push('PAPERS — B) ' + b.name);
  L.push(Array(40).join('-'));
  cmpPaperLines(sb).forEach(function (l) { L.push(l); });
  return L.join('\n');
}
export function InitCompareModal() {
  $('#compareBtn').addEventListener('click', openCompare);
  $('#cmpA').addEventListener('change', renderCompare);
  $('#cmpB').addEventListener('change', renderCompare);
  $('#cmpSwap').addEventListener('click', function () {
    var t = $('#cmpA').value;
    $('#cmpA').value = $('#cmpB').value;
    $('#cmpB').value = t;
    renderCompare();
  });
  $('#cmpExportBtn').addEventListener('click', function () {
    var txt = compareText();
    if (!txt) { toast('Pick two different professors to export a comparison.', 'info'); return; }
    var a = getProf($('#cmpA').value), b = getProf($('#cmpB').value);
    saveText(txt, 'Compare — ' + a.name + ' vs ' + b.name, '.txt');
    toast('Comparison exported as .txt.');
  });
}
