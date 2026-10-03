/* ==========================================================================
   PROFESSORS — 05_Data_IO/02_Export.js
   Paper/professor .txt detail sheets, paper-PDF fetching (with new-tab
   fallback), in-page attachment download, JSON + CSV library export,
   citations/BibTeX builders and the Print flow. Extracted verbatim from
   proff.html (lines 2723-2830, 2885-2909, 2979, 3073-3114, 3449-3450).
   ==========================================================================
*/

import { state, ui, persist } from '../00_State.js';
import { $, toast, saveBlob, saveText, sanitizeFilename, STATUS_META, statusOf } from '../01_Utils.js';
import { render } from '../Professors.js';

export function paperDetailsText(paper, prof) {
  var L = [];
  L.push('ProfessorTrack — Paper Details');
  L.push('==========================================');
  L.push('Title    : ' + paper.title);
  if (paper.authors) L.push('Author(s): ' + paper.authors);
  if (paper.year) L.push('Year     : ' + paper.year);
  if (paper.venue) L.push('Venue    : ' + paper.venue);
  L.push('Rating   : ' + (paper.rating || 0) + '/5');
  L.push('Status   : ' + STATUS_META[statusOf(paper)].label);
  if (paper.startedOn) L.push('Started  : ' + paper.startedOn);
  if (paper.finishedOn || paper.readDate) L.push('Finished : ' + (paper.finishedOn || paper.readDate));
  if ((paper.rereads || []).length) L.push('Re-reads : ' + paper.rereads.length + ' (last on ' + paper.rereads[paper.rereads.length - 1] + ')');
  if ((paper.tags || []).length) L.push('Tags     : ' + paper.tags.join(', '));
  if (paper.url) L.push('Link     : ' + paper.url);
  if ((paper.journal || []).length) {
    var jr = paper.journal.slice().sort(function (a, b) { return String(b.d || '').localeCompare(String(a.d || '')); });
    L.push('');
    L.push('READING JOURNAL (' + jr.length + (jr.length === 1 ? ' entry' : ' entries') + ', newest first)');
    jr.forEach(function (en) { L.push('  · ' + (en.d || 'undated') + ' — ' + String(en.t || '').replace(/\s*\n\s*/g, ' / ')); });
  }
  L.push('');
  L.push('Logged under: ' + prof.name + (prof.title ? ' (' + prof.title + ')' : ''));
  L.push('College     : ' + prof.college + (typeof prof.qsRank === 'number' ? ' — QS #' + prof.qsRank : ''));
  L.push('');
  if (paper.summary) { L.push('SUMMARY'); L.push(paper.summary); L.push(''); }
  if (paper.notes) { L.push('MY NOTES'); L.push(paper.notes); L.push(''); }
  L.push('------------------------------------------');
  L.push('Exported from ProfessorTrack on ' + new Date().toLocaleString());
  return L.join('\n');
}
export function profPapersText(prof) {
  var L = [];
  L.push('ProfessorTrack — Papers I\'ve read');
  L.push('Professor: ' + prof.name + (prof.title ? ' (' + prof.title + ')' : '') + (prof.department ? ' · ' + prof.department : ''));
  L.push('College  : ' + prof.college + (typeof prof.qsRank === 'number' ? ' — QS #' + prof.qsRank : ''));
  if ((prof.areas || []).length) L.push('Areas    : ' + prof.areas.join(', '));
  L.push('Papers   : ' + (prof.papers || []).length);
  L.push('');
  (prof.papers || []).forEach(function (pp, i) {
    L.push((i + 1) + '. ' + pp.title);
    if (pp.authors) L.push('   Authors : ' + pp.authors);
    if (pp.year || pp.venue) L.push('   Where   : ' + [pp.venue, pp.year].filter(Boolean).join(' · '));
    if (pp.readDate || pp.finishedOn) L.push('   Read on : ' + (pp.finishedOn || pp.readDate));
    if (pp.startedOn) L.push('   Started : ' + pp.startedOn);
    if ((pp.rereads || []).length) L.push('   Re-reads: ' + pp.rereads.length + ' (last on ' + pp.rereads[pp.rereads.length - 1] + ')');
    L.push('   Rating  : ' + (pp.rating || 0) + '/5');
    if (statusOf(pp) !== 'read') L.push('   Status  : ' + STATUS_META[statusOf(pp)].label);
    if (pp.url) L.push('   Link    : ' + pp.url);
    if ((pp.tags || []).length) L.push('   Tags    : ' + pp.tags.join(', '));
    if (pp.summary) L.push('   Summary : ' + pp.summary);
    if (pp.notes) L.push('   Notes   : ' + pp.notes);
    L.push('');
  });
  L.push('------------------------------------------');
  L.push('Exported from ProfessorTrack on ' + new Date().toLocaleString());
  return L.join('\n');
}
export function downloadPaperFile(paper, prof) {
  if (paper.url) {
    var base = sanitizeFilename(paper.title);
    toast('Fetching paper…');
    fetch(paper.url, { mode: 'cors' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.blob();
      })
      .then(function (blob) {
        var ext = /\.pdf(\?|$)/i.test(paper.url) || /pdf/i.test(blob.type) ? '.pdf' : '';
        saveBlob(blob, base + ext);
        toast('Paper downloaded — check your downloads folder.');
      })
      .catch(function () {
        /* CORS or network — open the source instead */
        var a = document.createElement('a');
        a.href = paper.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast('Direct download was blocked by the source — opened it in a new tab instead.', 'info');
      });
  } else {
    saveText(paperDetailsText(paper, prof), paper.title);
    toast('No link on this paper — downloaded its details as .txt instead.');
  }
}
export function downloadAttachment(paper) {
  var att = paper.attachment;
  if (!att) return;
  try {
    /* octet-stream forces a real download instead of Chrome's PDF viewer */
    var parts = String(att.data).split(',');
    var bin = atob(parts[1] || '');
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    saveBlob(new Blob([arr], { type: 'application/octet-stream' }), att.name || 'attachment.pdf');
    toast('Attachment downloaded — it travelled inside this HTML file.');
  } catch (e) { toast('Attachment could not be decoded.'); }
}
export function downloadProfPapers(prof) {
  if (!prof) return;
  if (!(prof.papers || []).length) { toast('This professor has no papers logged yet.'); return; }
  saveText(profPapersText(prof), 'papers - ' + prof.name);
  toast('Papers list for ' + prof.name + ' downloaded.');
}

/* ---------- json export ---------- */
function csvCell(v) {
  v = String(v == null ? '' : v);
  return /[",\n\r;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}

/* ---------- citations & BibTeX ---------- */
export function citationText(paper) {
  var bits = [];
  var authors = String(paper.authors || '').trim();
  if (authors) bits.push(authors);
  if (paper.year) bits.push('(' + paper.year + ').');
  bits.push(paper.title + '.');
  if (paper.venue) bits.push(paper.venue + '.');
  if (paper.url) bits.push(paper.url);
  return bits.join(' ');
}
function bibEscape(s) { return String(s == null ? '' : s).replace(/[\\{}]/g, '').replace(/\s*\n\s*/g, ' ').trim(); }
export function bibtexText(prof) {
  var used = {};
  var L = ['% BibTeX — papers logged under ' + prof.name + ' (exported from ProfessorTrack on ' + new Date().toLocaleDateString() + ')', ''];
  var papers = (prof.papers || []).slice().sort(function (a, b) { return String(a.year || '').localeCompare(String(b.year || '')); });
  papers.forEach(function (pp) {
    var authors = String(pp.authors || '').trim();
    var first = authors.split(/,| and /)[0].trim().split(/\s+/).pop() || 'unknown';
    first = first.toLowerCase().replace(/[^a-z]/g, '') || 'unknown';
    var yr = String(pp.year || 'nd');
    var tw = (String(pp.title || 'title').toLowerCase().match(/[a-z]+/) || ['title'])[0];
    var key = first + yr + tw, n = 1;
    while (used[key]) { key = first + yr + tw + String.fromCharCode(96 + (++n)); }
    used[key] = 1;
    L.push('@misc{' + key + ',');
    if (authors) L.push('  author       = {' + bibEscape(authors) + '},');
    L.push('  title        = {' + bibEscape(pp.title) + '},');
    if (pp.venue) L.push('  howpublished = {' + bibEscape(pp.venue) + '},');
    if (pp.year) L.push('  year         = {' + bibEscape(pp.year) + '},');
    if (pp.url) L.push('  url          = {' + String(pp.url).trim() + '}');
    var note = 'Logged in ProfessorTrack · ' + STATUS_META[statusOf(pp)].label + (pp.rating ? ' · rated ' + pp.rating + '/5' : '');
    L.push('  note         = {' + note + '}', '}');
  });
  if (!papers.length) L.push('% (no papers logged yet)');
  return L.join('\n');
}
export function downloadBibtex(prof) {
  if (!(prof.papers || []).length) { toast('No papers to export for ' + prof.name + ' yet.', 'info'); return; }
  saveText(bibtexText(prof), 'bibtex - ' + prof.name, '.bib');
  toast('BibTeX downloaded — ' + prof.papers.length + ' entr' + (prof.papers.length === 1 ? 'y' : 'ies') + '.');
}

export function InitExport() {
  $('#exportJsonBtn').addEventListener('click', function () {
    persist();
    saveBlob(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }), 'profftrack-library.json');
    toast('Library exported as JSON.');
  });
  $('#exportCsvBtn').addEventListener('click', function () {
    var rows = [['Professor', 'Title', 'Department', 'College', 'QS Rank', 'Paper', 'Authors', 'Year', 'Venue', 'Rating', 'Status', 'Started on', 'Finished on', 'Tags', 'Link']];
    state.professors.forEach(function (p) {
      if (!(p.papers || []).length) {
        rows.push([p.name, p.title, p.department, p.college, p.qsRank, '', '', '', '', '', '', '', '', '', '']);
        return;
      }
      p.papers.forEach(function (pp) {
        rows.push([p.name, p.title, p.department, p.college, p.qsRank, pp.title, pp.authors, pp.year, pp.venue, pp.rating, STATUS_META[statusOf(pp)].label, pp.startedOn || '', pp.finishedOn || pp.readDate || '', (pp.tags || []).join('; '), pp.url]);
      });
    });
    var csv = rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n');
    saveBlob(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }), 'profftrack-papers.csv');
    toast('CSV exported — opens cleanly in Excel / Sheets.');
  });
  $('#printBtn').addEventListener('click', function () { window.print(); });
  /* print mode expands every accordion so the PDF contains full details;
     inert while the Professors app is not mounted */
  window.addEventListener('beforeprint', function () {
    if (!document.getElementById('ProfessorsApp')) return;
    ui.printMode = true; render();
  });
  window.addEventListener('afterprint', function () {
    if (!document.getElementById('ProfessorsApp')) return;
    ui.printMode = false; render();
  });
}
