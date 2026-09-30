/* ==========================================================================
   PROFESSORS — 02_Dashboard/02_Resume_Section.js
   "Continue reading" strip: currently-reading papers with quick
   open / mark-read / pause actions. Extracted verbatim from proff.html
   (lines 1825-1869, 2461-2495).
   ==========================================================================
*/

import { state, ui, persist, getProf } from '../00_State.js';
import { $, esc, toast, ICONS, cmpAvatar, todayISO, statusOf } from '../01_Utils.js';
import { render } from '../Professors.js';

/* ---------- continue reading (quick resume card) ---------- */
export function readingPapers() {
  var out = [];
  state.professors.forEach(function (p) {
    (p.papers || []).forEach(function (pp) {
      if (statusOf(pp) === 'reading') out.push({ prof: p, paper: pp });
    });
  });
  return out;
}

export function daysSince(iso) {
  if (!iso) return null;
  var d = new Date(String(iso) + 'T12:00:00');
  if (isNaN(d.getTime())) return null;
  return Math.max(0, Math.round((new Date().setHours(12, 0, 0, 0) - d.getTime()) / 86400000));
}

export function resumeSectionHTML(items) {
  return '<div class="resume-card">' +
    '<div class="resume-head">' + ICONS.bookmark +
      '<h3>Continue reading</h3><span class="cnt">' + items.length + '</span>' +
      '<span class="resume-hint">pick up where you left off</span>' +
    '</div>' +
    '<div class="resume-list">' + items.map(function (it) {
      var d = daysSince(it.paper.startedOn);
      var dTxt = d == null ? 'in progress' : d === 0 ? 'started today' : d + ' day' + (d === 1 ? '' : 's') + ' in progress';
      return '<div class="resume-row" data-prof="' + esc(it.prof.id) + '" data-paper="' + esc(it.paper.id) + '">' +
        cmpAvatar(it.prof) +
        '<span class="resume-main">' +
          '<button type="button" class="resume-title" data-action="resume-open" title="Open this professor and jump to the paper">' + esc(it.paper.title) + '</button>' +
          '<span class="resume-meta">' + esc(it.prof.name) + (it.prof.college ? ' · ' + esc(it.prof.college) : '') + '</span>' +
        '</span>' +
        '<span class="days-chip" title="' + (it.paper.startedOn ? 'Started on ' + esc(it.paper.startedOn) : 'No start date logged') + '">' + ICONS.cal + esc(dTxt) + '</span>' +
        '<button type="button" class="btn btn-line btn-sm resume-pause" data-action="resume-pause" title="Not reading this right now — moves it back to Want to read (start date is kept)">' + ICONS.pause + 'Pause</button>' +
        '<button type="button" class="btn btn-primary btn-sm resume-read" data-action="resume-read" title="Finish it today — feeds the heatmap, streak and yearly goal">' + ICONS.check + 'Mark read</button>' +
      '</div>';
    }).join('') + '</div>' +
  '</div>';
}

export function renderResume() {
  var el = $('#resumeSection');
  var items = readingPapers();
  if (!items.length) { el.hidden = true; el.innerHTML = ''; return; }
  el.hidden = false;
  el.innerHTML = resumeSectionHTML(items);
}

/* ---------- continue-reading interactions ---------- */
export function InitResumeSection() {
  $('#resumeSection').addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-action]') : null;
    if (!el) return;
    var row = el.closest('[data-prof]');
    if (!row) return;
    var prof = getProf(row.dataset.prof);
    if (!prof) return;
    var paper = (prof.papers || []).filter(function (x) { return x.id === row.dataset.paper; })[0];
    if (!paper) return;
    if (el.dataset.action === 'resume-open') {
      ui.expandedProf = prof.id;
      ui.expandedPaper = paper.id;
      render();
      var card = document.querySelector('.prof-card[data-prof="' + prof.id + '"]');
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('flash');
        setTimeout(function () { card.classList.remove('flash'); }, 2600);
      }
    } else if (el.dataset.action === 'resume-read') {
      paper.status = 'read';
      if (!paper.startedOn) paper.startedOn = todayISO();
      paper.finishedOn = todayISO();
      paper.readDate = todayISO();
      persist();
      render();
      toast('Marked as read — the heatmap, streak and goal are updated.');
    } else if (el.dataset.action === 'resume-pause') {
      paper.status = 'wishlist';
      persist();
      render();
      toast('Paused — moved back to Want to read (your dates are kept).');
    }
  });
}
