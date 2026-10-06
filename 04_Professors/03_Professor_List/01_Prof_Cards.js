/* ==========================================================================
   PROFESSORS — 03_Professor_List/01_Prof_Cards.js
   The core list: college group headers, professor cards, paper rows/details,
   per-professor paper sort, empty states and the renderList() entry point.
   Extracted verbatim from proff.html (lines 1739-1752, 1965-2277).
   ==========================================================================
*/

import { state, ui, paperPasses, collegeKey, collegeBestRank, filteredSorted, persist } from '../00_State.js';
import { $, esc, fmtDate, stars, fmtSize, avatarColor, initials, toast, ICONS, STATUS_META, statusOf, statusPill } from '../01_Utils.js';
import { seedSamples } from '../03_Seed_Data.js';
import { openProfModal } from '../04_Modals/02_Professor_Modal.js';
import { openBulkModal } from '../04_Modals/07_Bulk_Add_Modal.js';
import { render } from '../Professors.js';
import { updateExpandBtn, updateKbFocus } from './02_List_Actions.js';

/* ============================== rendering ============================== */
export function sortPapers(papers) {
  var arr = papers.slice();
  if (ui.paperSort === 'year') arr.sort(function (a, b) { return (b.year || 0) - (a.year || 0); });
  else if (ui.paperSort === 'rating') arr.sort(function (a, b) { return (b.rating || 0) - (a.rating || 0); });
  else if (ui.paperSort === 'title') arr.sort(function (a, b) { return String(a.title).localeCompare(String(b.title)); });
  else arr.sort(function (a, b) { return String(b.createdAt || '').localeCompare(String(a.createdAt || '')); });
  return arr;
}
export function paperSortSelect() {
  var opts = [['recent', 'Recent'], ['year', 'By year'], ['rating', 'By rating'], ['title', 'A–Z']];
  return '<select class="paper-sort" data-paper-sort aria-label="Sort papers within this professor">' +
    opts.map(function (o) { return '<option value="' + o[0] + '"' + (ui.paperSort === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') +
  '</select>';
}
export function qsPill(rank) {
  if (typeof rank === 'number') return '<span class="qs-pill" title="QS World Ranking of the college (approx.)">QS #' + rank + '</span>';
  return '<span class="qs-pill none" title="QS ranking not set">QS —</span>';
}
export function collegeGroupHTML(key, profs, displayName) {
  var rank = collegeBestRank(profs);
  var filtering = ui.statusFilter !== 'all' || !!ui.tagFilter;
  var cRead = 0, cReading = 0, cWish = 0;
  profs.forEach(function (p) {
    (p.papers || []).forEach(function (pp) {
      if (!paperPasses(pp)) return;
      var st = statusOf(pp);
      if (st === 'read') cRead++; else if (st === 'reading') cReading++; else cWish++;
    });
  });
  var nPapers = cRead + cReading + cWish;
  var bar = '';
  if (nPapers) {
    var tt = cRead + ' read · ' + cReading + ' reading · ' + cWish + ' to read';
    bar = '<span class="group-bar" role="img" aria-label="' + esc(tt) + '" title="' + esc(tt) + '">' +
      (cRead ? '<i class="gb-read" style="flex:' + cRead + '"></i>' : '') +
      (cReading ? '<i class="gb-reading" style="flex:' + cReading + '"></i>' : '') +
      (cWish ? '<i class="gb-wishlist" style="flex:' + cWish + '"></i>' : '') +
    '</span>';
  }
  var collapsed = !!ui.collapsed[key];
  return '<div class="college-group' + (collapsed ? ' collapsed' : '') + '" role="button" tabindex="0" data-group="' + esc(key) + '" aria-expanded="' + (!collapsed) + '" title="Click to collapse or expand this college group">' +
    '<span class="group-chev" aria-hidden="true">' + ICONS.chev + '</span>' + ICONS.landmark +
    '<h2>' + esc(displayName) + '</h2>' +
    (typeof rank === 'number' ? '<span class="qs-pill">QS #' + rank + '</span>' : '<span class="qs-pill none">QS —</span>') +
    '<span class="count">' + profs.length + (profs.length === 1 ? ' professor' : ' professors') + ' · ' + nPapers + ' paper' + (nPapers === 1 ? '' : 's') + (filtering ? ' shown' : '') + '</span>' +
    bar +
    '<span class="rule"></span></div>';
}
export function paperRowHTML(paper, prof) {
  if (!paperPasses(paper)) return '';
  var open = ui.expandedPaper === paper.id || ui.printMode;
  var st = statusOf(paper);
  var meta = [];
  if (paper.year) meta.push(esc(paper.year));
  if (paper.venue) meta.push(esc(paper.venue));
  meta.push(stars(paper.rating));
  if (st !== 'read') meta.push(statusPill(paper));
  if (st === 'read') {
    var fd = paper.finishedOn || paper.readDate;
    if (fd) meta.push('read ' + esc(fmtDate(fd)));
  } else if (st === 'reading' && paper.startedOn) {
    meta.push('started ' + esc(fmtDate(paper.startedOn)));
  }
  var nRereads = (paper.rereads || []).length;
  if (nRereads) meta.push('re-read ×' + nRereads);
  var nJournal = (paper.journal || []).length;
  if (nJournal) meta.push('journal ×' + nJournal);
  return '<div class="paper-row pr-' + st + (open ? ' open' : '') + '" data-paper="' + esc(paper.id) + '">' +
    '<button type="button" class="paper-head" data-action="toggle-paper" aria-expanded="' + open + '">' +
      '<span class="paper-ico ' + (STATUS_META[st].ico || '') + '">' + ICONS.fileText + '</span>' +
      '<span class="paper-id"><span class="paper-title">' + esc(paper.title) + '</span>' +
      '<span class="paper-meta">' + meta.join('<span aria-hidden="true">·</span>') + '</span></span>' +
      ICONS.chev +
    '</button>' +
    '<div class="acc' + (open ? ' open' : '') + '" role="region" aria-label="Paper details"><div class="acc-inner">' +
      (open ? paperDetailHTML(paper, prof) : '') +
    '</div></div>' +
  '</div>';
}
export function paperDetailHTML(paper, prof) {
  var cells = '';
  function cell(k, v) { return '<div class="detail-cell"><div class="k">' + k + '</div><div class="v">' + (v || '—') + '</div></div>'; }
  cells += cell('Author(s)', esc(paper.authors));
  cells += cell('Year', esc(paper.year));
  cells += cell('Venue', esc(paper.venue));
  cells += cell('Status', statusPill(paper));
  cells += cell('Rating', stars(paper.rating));
  cells += cell('Started', esc(fmtDate(paper.startedOn)));
  cells += cell('Finished', esc(fmtDate(paper.finishedOn || paper.readDate)));
  if ((paper.rereads || []).length) {
    var rrs = paper.rereads;
    cells += cell('Re-reads', rrs.length + '× · last ' + esc(fmtDate(rrs[rrs.length - 1])));
  }
  var tags = (paper.tags || []).map(function (t) { return '<span class="chip">' + esc(t) + '</span>'; }).join('');
  cells += '<div class="detail-cell"><div class="k">Tags</div><div class="v tag-row">' + (tags || '—') + '</div></div>';
  var jr = (paper.journal || []).slice().map(function (en, i) { return { d: en && en.d, t: en && en.t, i: i }; }).filter(function (en) { return en.t; })
    .sort(function (a, b) { return String(b.d || '').localeCompare(String(a.d || '')); });
  var journalHtml = '';
  if (jr.length) {
    journalHtml = '<div class="journal-block"><div class="journal-head">' + ICONS.pen + '<span class="k">Reading journal</span><span class="cnt">' + jr.length + '</span></div>' +
      '<ol class="journal-list">' + jr.map(function (en) {
        return '<li class="journal-item"><span class="journal-date">' + esc(fmtDate(en.d)) + '</span><span class="journal-txt">' + esc(en.t) + '</span>' +
          '<button type="button" class="journal-del icon-btn danger" data-action="journal-del" data-idx="' + en.i + '" title="Delete this entry" aria-label="Delete journal entry from ' + esc(fmtDate(en.d)) + '">' + ICONS.trash + '</button></li>';
      }).join('') + '</ol></div>';
  }
  var actions = '';
  if (paper.attachment) {
    actions += '<span class="attach-chip" title="The PDF is stored inside this HTML file — it works offline">' + ICONS.fileText + 'PDF attached · ' + esc(fmtSize(paper.attachment.size)) + '</span>';
    actions += '<button type="button" class="btn btn-accent btn-sm" data-action="dl-attach">' + ICONS.download + 'Download attached PDF</button>';
    if (paper.url) actions += '<a class="btn btn-line btn-sm" href="' + esc(paper.url) + '" target="_blank" rel="noopener noreferrer">Open source ↗</a>';
  } else if (paper.url) {
    actions += '<button type="button" class="btn btn-accent btn-sm" data-action="dl-paper">' + ICONS.download + 'Download paper</button>';
    actions += '<a class="btn btn-line btn-sm" href="' + esc(paper.url) + '" target="_blank" rel="noopener noreferrer">Open source ↗</a>';
  } else {
    actions += '<button type="button" class="btn btn-accent btn-sm" data-action="dl-paper">' + ICONS.download + 'Download details (.txt)</button>';
  }
  actions += '<button type="button" class="btn btn-line btn-sm" data-action="dl-paper-txt">' + ICONS.fileText + 'Details (.txt)</button>';
  actions += '<button type="button" class="btn btn-line btn-sm" data-action="cite-copy" title="Copy a ready-to-paste citation for this paper">' + ICONS.copy + 'Copy citation</button>';
  actions += '<button type="button" class="btn btn-line btn-sm" data-action="cite-bib" title="Copy this paper as a BibTeX entry">' + ICONS.fileText + 'Copy BibTeX</button>';
  actions += '<button type="button" class="btn btn-line btn-sm" data-action="journal-add" title="Dated reading notes — a timeline on this paper">' + ICONS.pen + 'Add journal entry</button>';
  if (statusOf(paper) === 'read') actions += '<button type="button" class="btn btn-line btn-sm" data-action="reread" title="You finished it again today — feeds the heatmap, streak and yearly goal">' + ICONS.rotate + 'Log re-read</button>';
  actions += '<span class="spacer"></span>';
  actions += '<button type="button" class="icon-btn" data-action="edit-paper" title="Edit paper" aria-label="Edit paper">' + ICONS.edit + '</button>';
  actions += '<button type="button" class="icon-btn danger" data-action="del-paper" title="Delete paper" aria-label="Delete paper">' + ICONS.trash + '</button>';
  return '<div class="paper-detail">' +
    '<div class="detail-grid">' + cells + '</div>' +
    (paper.summary ? '<div class="note-block"><div class="k">Summary</div>' + esc(paper.summary) + '</div>' : '') +
    (paper.notes ? '<div class="note-block"><div class="k">Your notes</div>' + esc(paper.notes) + '</div>' : '') +
    journalHtml +
    '<div class="paper-actions">' + actions + '</div>' +
  '</div>';
}
export function profCardHTML(p) {
  var open = ui.expandedProf === p.id || ui.expandedProf === 'ALL' || ui.printMode;
  var papers = p.papers || [];
  var filtering = ui.statusFilter !== 'all' || !!ui.tagFilter;
  var shown = filtering ? papers.filter(paperPasses) : papers;
  var rated = papers.filter(function (x) { return typeof x.rating === 'number' && x.rating > 0; });
  var avg = rated.length ? (rated.reduce(function (s, x) { return s + x.rating; }, 0) / rated.length).toFixed(1) : null;
  var areaChips = (p.areas || []).map(function (a) { return '<span class="chip">' + esc(a) + '</span>'; }).join('');
  var pc = p.color || avatarColor(p.name);
  /* big proff.html-style portrait — when no photo was dropped / pasted / linked,
     the space stays blank (no initials fallback) */
  var photo = p.photo
    ? '<span class="avatar avatar-lg" style="--prof-c:' + pc + '" aria-hidden="true"><img src="' + esc(p.photo) + '" alt="Photo of ' + esc(p.name) + '" onerror="this.remove()"/></span>'
    : '<span class="avatar avatar-lg avatar-blank" style="--prof-c:' + pc + '" aria-hidden="true"></span>';
  var clogo = p.collegeLogo
    ? '<img class="college-logo" src="' + esc(p.collegeLogo) + '" alt="' + esc(p.college) + ' logo" onerror="this.remove()"/>'
    : '';
  var contact = '';
  if (p.email) contact += '<a href="mailto:' + esc(p.email) + '">' + ICONS.mail + esc(p.email) + '</a>';
  if (p.website) contact += '<a href="' + esc(p.website) + '" target="_blank" rel="noopener noreferrer">' + ICONS.link + 'Website / Scholar</a>';
  var detail = '';
  if (open) {
    detail = '<div class="prof-detail">' +
      '<div class="prof-meta">' +
        (contact ? '<div class="contact-links">' + contact + '</div>' : '') +
        (areaChips ? '<div class="areas">' + areaChips + '</div>' : '') +
        (p.bio ? '<p class="bio">' + esc(p.bio) + '</p>' : '') +
        '<span class="added-note">Added ' + esc(fmtDate(p.createdAt)) + ' · QS college ranking: ' + (typeof p.qsRank === 'number' ? '#' + p.qsRank : 'not set') + '</span>' +
      '</div>' +
      '<div class="prof-actions">' +
        '<button type="button" class="btn btn-primary btn-sm" data-action="add-paper">' + ICONS.plus + 'Add paper</button>' +
        '<button type="button" class="btn btn-line btn-sm" data-action="bulk-add" title="Paste a whole list of papers — one per line">' + ICONS.list + 'Bulk add papers</button>' +
        '<button type="button" class="btn btn-line btn-sm" data-action="dl-prof-list">' + ICONS.download + 'Papers list (.txt)</button>' +
        '<button type="button" class="btn btn-line btn-sm" data-action="dl-prof-bib" title="Download all of this professor&#39;s papers as a BibTeX .bib file — ready for LaTeX">' + ICONS.fileText + 'BibTeX (.bib)</button>' +
        '<button type="button" class="btn btn-line btn-sm" data-action="copy-prof" title="Copy this professor (with papers) as JSON — paste it into any other ProfessorTrack library via the footer link">' + ICONS.copy + 'Copy JSON</button>' +
        '<span class="spacer"></span>' +
        '<button type="button" class="icon-btn' + (p.fav ? ' fav-on' : '') + '" data-action="fav-prof" title="' + (p.fav ? 'Remove from favorites' : 'Mark as favorite — floats to the top of its college group (F)') + '" aria-label="Toggle favorite" aria-pressed="' + (!!p.fav) + '">' + ICONS.star + '</button>' +
        '<button type="button" class="icon-btn" data-action="edit-prof" title="Edit professor" aria-label="Edit professor">' + ICONS.edit + '</button>' +
        '<button type="button" class="icon-btn danger" data-action="del-prof" title="Delete professor" aria-label="Delete professor">' + ICONS.trash + '</button>' +
      '</div>' +
      '<div class="papers-block">' +
        '<div class="papers-head"><h4>Papers I&#39;ve read <span class="cnt" data-base="' + (filtering ? shown.length + ' of ' + papers.length : papers.length) + '">' + (filtering ? shown.length + ' of ' + papers.length : papers.length) + '</span>' +
          (avg ? '<span class="avg-chip" title="Average of ' + rated.length + ' rated paper' + (rated.length === 1 ? '' : 's') + '">' + ICONS.star + avg + ' avg</span>' : '') + '</h4>' +
          (papers.length >= 3 ? '<input type="search" class="paper-filter" placeholder="Filter papers…" aria-label="Filter papers within this professor"/>' : '') +
          (papers.length ? paperSortSelect() : '') + '</div>' +
        '<div class="papers-list">' +
          (papers.length
            ? (shown.length
                ? sortPapers(shown).map(function (pp) { return paperRowHTML(pp, p); }).join('')
                : '<div class="papers-empty">No papers match the current filters — clear the status / tag filter to see all ' + papers.length + '.</div>')
            : '<div class="papers-empty">No papers yet — click <strong>Add paper</strong> to log the first one you&#39;ve read.</div>') +
        '</div>' +
      '</div>' +
    '</div>';
  }
  return '<article class="prof-card' + (p.fav ? ' fav' : '') + (open ? ' open' : '') + '" data-prof="' + esc(p.id) + '">' +
    '<button type="button" class="prof-head" data-action="toggle-prof" aria-expanded="' + open + '">' +
      '<span class="grip" draggable="true" title="Drag to reorder within this college (or focus the card and press Shift+J / Shift+K)" aria-hidden="true">' + ICONS.grip + '</span>' +
      photo +
      '<span class="prof-id">' +
        '<span class="prof-name">' + esc(p.name) + (p.fav ? '<span class="fav-chip" title="Favorite professor — floats to the top of its college group">' + ICONS.star + 'Fav</span>' : '') + '</span>' +
        '<span class="prof-sub">' + esc([p.title, p.department].filter(Boolean).join(' · ')) + '</span>' +
        '<span class="prof-college">' + ICONS.landmark + '<span class="cname">' + esc(p.college) + '</span></span>' +
      '</span>' +
      '<span class="prof-right">' + qsPill(p.qsRank) + '<span class="count-chip' + (filtering ? ' filtered' : '') + '">' + (filtering ? shown.length + ' of ' + papers.length : papers.length + ' paper' + (papers.length === 1 ? '' : 's')) + '</span>' + ICONS.chev + '</span>' +
      clogo +
    '</button>' +
    '<div class="acc' + (open ? ' open' : '') + '" role="region" aria-label="Professor details"><div class="acc-inner">' + detail + '</div></div>' +
  '</article>';
}

export function renderEmptyState() {
  $('#profList').innerHTML =
    '<div class="empty-state">' +
      '<div class="empty-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg></div>' +
      '<h2>Your library is empty</h2>' +
      '<p>Add the professors you follow — their college, its QS ranking and the papers you&#39;ve read. ProfessorTrack groups them by college and ranks them automatically, and the whole library lives inside this single HTML file.</p>' +
      '<div class="empty-actions">' +
        '<button type="button" class="btn btn-primary" id="emptyAddBtn">' + ICONS.plus + 'Add your first professor</button>' +
        '<button type="button" class="btn btn-line" id="emptySeedBtn">Load sample library</button>' +
      '</div>' +
    '</div>';
  $('#emptyAddBtn').addEventListener('click', function () { openProfModal(null); });
  $('#emptySeedBtn').addEventListener('click', function () {
    state.professors = seedSamples();
    persist(); render(); toast('Sample library loaded — explore, then make it yours.');
  });
}
export function renderList() {
  updateExpandBtn();
  var listEl = $('#profList');
  if (!state.professors.length) { ui.kbIdx = -1; renderEmptyState(); return; }
  var arr = filteredSorted();
  if (!arr.length) {
    ui.kbIdx = -1;
    listEl.innerHTML = '<div class="empty-state"><h2>No matches</h2><p>Nothing matches “' + esc(ui.search) + '”. Try another search.</p></div>';
    return;
  }
  listEl.classList.toggle('grouped', ui.sort === 'qs');
  var html = '', lastKey = null;
  if (ui.sort === 'qs') {
    var groups = {};
    arr.forEach(function (p) { (groups[collegeKey(p)] = groups[collegeKey(p)] || []).push(p); });
    var seen = {};
    arr.forEach(function (p) {
      var k = collegeKey(p);
      if (!seen[k]) {
        seen[k] = true;
        html += collegeGroupHTML(k, groups[k], groups[k][0].college);
      }
      if (!ui.collapsed[k]) html += profCardHTML(p);
    });
  } else {
    arr.forEach(function (p) { html += profCardHTML(p); });
  }
  listEl.innerHTML = html;
  updateKbFocus();
}
