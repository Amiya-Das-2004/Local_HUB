/* ==========================================================================
   PROFESSORS — 02_Dashboard/03_Heatmap.js
   52-week reading heatmap (GitHub-style calendar) with year navigation + menu,
   finished-day map, reading streak, and yearly-goal window helpers shared with
   the stats bar. Extracted verbatim from proff.html (lines 1770-1812, 1870-1959,
   2416-2459).
   ==========================================================================
*/

import { state, ui } from '../00_State.js';
import { $, esc, toast, ICONS, statusOf } from '../01_Utils.js';

/* ---------- day → finished papers map (heatmap / streak / goal) ---------- */
export function finishedDayMap() {
  var days = {};
  state.professors.forEach(function (p) {
    (p.papers || []).forEach(function (pp) {
      if (statusOf(pp) !== 'read') return;
      var d = pp.finishedOn || pp.readDate;
      if (!d) return;
      (days[d] = days[d] || []).push({ title: pp.title, prof: p.name });
    });
  });
  return days;
}
/* consecutive days (ending today or yesterday) with at least one paper finished */
export function computeStreak() {
  var days = finishedDayMap();
  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  var step = new Date();
  step.setHours(12, 0, 0, 0);
  if (!days[iso(step)]) step.setDate(step.getDate() - 1);
  var n = 0;
  while (days[iso(step)]) { n++; step.setDate(step.getDate() - 1); }
  return n;
}
/* papers finished so far in the goal window (calendar year by default, custom start month supported) */
export function goalStartMonth() {
  var v = Number(state.goalStart);
  return (v >= 0 && v <= 11 && v % 1 === 0) ? v : 0;
}
export function goalStartLabel() {
  return new Date(2024, goalStartMonth(), 1).toLocaleDateString(undefined, { month: 'long' });
}
export function yearReadCount() {
  var y = String(new Date().getFullYear());
  var m0 = goalStartMonth();
  var map = finishedDayMap(), n = 0;
  Object.keys(map).forEach(function (k) {
    if (String(k).slice(0, 4) !== y) return;
    if ((parseInt(String(k).slice(5, 7), 10) - 1) < m0) return;
    n += map[k].length;
  });
  return n;
}

/* ---------- 52-week reading heatmap (GitHub-style calendar) ---------- */
export function isoDay(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
export function heatLevel(n) { return n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : n <= 4 ? 3 : 4; }
export function heatSectionHTML() {
  var map = finishedDayMap();
  var cell = 11, gap = 3, padL = 30, padT = 20;
  var today = new Date(); today.setHours(12, 0, 0, 0);
  var thisYear = today.getFullYear();
  var rolling = ui.heatYear == null;
  var start;
  if (rolling) {
    start = new Date(today.getTime() - 364 * 86400000);
    start.setDate(start.getDate() - start.getDay()); /* align grid to Sunday */
  } else {
    start = new Date(ui.heatYear, 0, 1);
    start.setDate(start.getDate() - start.getDay()); /* back to the Sunday before Jan 1 */
  }
  var end = rolling ? today : new Date(Math.min(new Date(ui.heatYear, 11, 31, 12).getTime(), today.getTime()));
  var weeks = Math.ceil(((end - start) / 86400000 + 1) / 7);
  var w = padL + weeks * (cell + gap);
  var h = padT + 7 * (cell + gap);
  var rects = '', labels = '', lastLabelX = -99, seenMonths = {}, total = 0;
  for (var wk = 0; wk < weeks; wk++) {
    for (var dow = 0; dow < 7; dow++) {
      var d = new Date(start.getTime() + (wk * 7 + dow) * 86400000);
      if (d > end) continue;
      var iso = isoDay(d);
      var inYear = rolling || d.getFullYear() === ui.heatYear;
      var items = inYear ? (map[iso] || []) : [];
      var n = items.length;
      total += n;
      var x = padL + wk * (cell + gap), y = padT + dow * (cell + gap);
      var tip = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      if (n) {
        var names = items.slice(0, 2).map(function (it) { return it.title; }).join('; ');
        tip += ' — ' + n + ' paper' + (n === 1 ? '' : 's') + ' finished: ' + names + (n > 2 ? '; +' + (n - 2) + ' more' : '');
      } else tip += ' — no papers finished';
      rects += '<rect class="hl hl-' + heatLevel(n) + '"' + (n ? ' data-date="' + iso + '"' : '') + ' x="' + x + '" y="' + y + '" width="' + cell + '" height="' + cell + '" rx="2.5"><title>' + esc(tip) + '</title></rect>';
      if (dow === 0) {
        var mk = d.getFullYear() + '-' + d.getMonth();
        if (!seenMonths[mk] && x - lastLabelX >= 3 * (cell + gap)) {
          seenMonths[mk] = 1;
          labels += '<text class="hm" x="' + x + '" y="9">' + esc(d.toLocaleDateString(undefined, { month: 'short' })) + '</text>';
          lastLabelX = x;
        }
      }
    }
  }
  ['1:Mon', '3:Wed', '5:Fri'].forEach(function (s) {
    var p = s.split(':');
    labels += '<text class="hw" x="0" y="' + (padT + Number(p[0]) * (cell + gap) + 9) + '">' + p[1] + '</text>';
  });
  var swatches = [0, 1, 2, 3, 4].map(function (l) { return '<i class="sw" style="background:var(--heat-' + l + ')"></i>'; }).join('');
  var rangeLabel = rolling ? 'last 52 weeks' : String(ui.heatYear);
  var hintTxt = rolling
    ? 'Click a finished day to see its papers'
    : (total ? 'Finished papers in ' + ui.heatYear + ' — click a day to see them'
             : 'No papers finished in ' + ui.heatYear + ' — use ‹ to browse earlier years');
  var chevL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
  var chevR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';
  var nav = '<span class="heat-nav" role="group" aria-label="Heatmap period">' +
    '<button type="button" class="hn-btn" data-heat-nav="prev" title="Show the previous year" aria-label="Show the previous year">' + chevL + '</button>' +
    '<button type="button" class="hn-label" data-heat-nav="menu" title="Jump to a specific year" aria-haspopup="true" aria-expanded="false">' + (rolling ? 'Recent 52w' : ui.heatYear) + '</button>' +
    '<button type="button" class="hn-btn" data-heat-nav="next" title="Show the next year" aria-label="Show the next year"' + (rolling || ui.heatYear >= thisYear ? ' disabled' : '') + '>' + chevR + '</button>' +
    heatMenuHTML(map, rolling) +
  '</span>';
  return '<div class="heat-card"><div class="heat-head">' +
      '<h2>' + ICONS.cal + 'Reading activity</h2>' +
      '<span class="heat-total">' + total + ' paper' + (total === 1 ? '' : 's') + ' · ' + rangeLabel + '</span>' +
      nav +
      '<span class="heat-hint">' + hintTxt + '</span>' +
    '</div>' +
    '<div class="heat-scroll"><svg class="heat-svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="Calendar heatmap of papers finished per day, ' + (rolling ? 'last 52 weeks' : 'calendar year ' + ui.heatYear) + '">' + rects + labels + '</svg></div>' +
    '<div class="heat-legend"><span>Less</span>' + swatches + '<span>More</span></div>' +
  '</div>';
}
export function heatMenuHTML(map, rolling) {
  var years = {};
  Object.keys(map).forEach(function (k) {
    var y = String(k).slice(0, 4);
    years[y] = (years[y] || 0) + map[k].length;
  });
  var items = ['<button type="button" data-heat-nav="recent"' + (rolling ? ' class="on"' : '') + '><span>Recent 52 weeks</span></button>'];
  Object.keys(years).sort().reverse().forEach(function (y) {
    items.push('<button type="button" data-heat-nav="jump" data-year="' + y + '"' + (!rolling && ui.heatYear === Number(y) ? ' class="on"' : '') + '><span>' + y + '</span><span class="hm-n">' + years[y] + '</span></button>');
  });
  return '<span class="heat-menu" id="heatMenu" role="menu" aria-label="Jump to a year">' + items.join('') + '</span>';
}
export function renderHeat() {
  var el = $('#heatSection');
  var map = finishedDayMap();
  if (!map || Object.keys(map).length === 0) { el.hidden = true; el.innerHTML = ''; return; }
  el.hidden = false;
  el.innerHTML = heatSectionHTML();
}

/* heatmap interactions: year navigation + click a finished day → toast with that day's papers */
let docClickBound = false;
export function InitHeatmap() {
  if (!docClickBound) {
    docClickBound = true;
    document.addEventListener('click', function (e) {
      var mnu = $('#heatMenu');
      if (mnu && mnu.classList.contains('open') && !(e.target.closest && e.target.closest('.heat-nav'))) {
        mnu.classList.remove('open');
        var lbl = document.querySelector('.hn-label[data-heat-nav="menu"]');
        if (lbl) lbl.setAttribute('aria-expanded', 'false');
      }
    });
  }
  $('#heatSection').addEventListener('click', function (e) {
    var nav = e.target.closest ? e.target.closest('[data-heat-nav]') : null;
    if (nav) {
      if (nav.disabled) return;
      var act = nav.getAttribute('data-heat-nav');
      var thisYear = new Date().getFullYear();
      if (act === 'prev') ui.heatYear = (ui.heatYear == null) ? thisYear : Math.max(2000, ui.heatYear - 1);
      else if (act === 'next' && ui.heatYear != null && ui.heatYear < thisYear) ui.heatYear += 1;
      else if (act === 'recent') ui.heatYear = null;
      else if (act === 'jump' && nav.dataset.year) {
        ui.heatYear = Math.max(2000, Math.min(thisYear, parseInt(nav.dataset.year, 10) || thisYear));
      }
      else if (act === 'menu') {
        var mnu = $('#heatMenu');
        if (mnu) {
          var willOpen = !mnu.classList.contains('open');
          mnu.classList.toggle('open');
          nav.setAttribute('aria-expanded', String(willOpen));
        }
        return;
      }
      else return;
      renderHeat();
      return;
    }
    var r = e.target.closest ? e.target.closest('rect[data-date]') : null;
    if (!r) return;
    var iso = r.dataset.date || r.getAttribute('data-date');
    var items = (finishedDayMap()[iso] || []);
    if (!items.length) return;
    var d = new Date(iso + 'T12:00:00');
    var when = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    var names = items.slice(0, 2).map(function (it) { return it.title; }).join('; ');
    toast(when + ' — ' + items.length + ' paper' + (items.length === 1 ? '' : 's') + ' finished: ' + names + (items.length > 2 ? '; +' + (items.length - 2) + ' more' : ''));
  });
}
