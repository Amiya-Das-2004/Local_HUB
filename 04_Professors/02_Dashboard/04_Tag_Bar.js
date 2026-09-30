/* ==========================================================================
   PROFESSORS — 02_Dashboard/04_Tag_Bar.js
   Top-12 tag filter chips above the professor list. Extracted verbatim from
   proff.html (lines 2258-2277 and the tagBar click binding at 3674-3681).
   ==========================================================================
*/

import { state, ui } from '../00_State.js';
import { $, esc, ICONS } from '../01_Utils.js';
import { render } from '../Professors.js';

export function renderTagBar() {
  var el = $('#tagBar');
  var freq = {};
  state.professors.forEach(function (p) {
    (p.papers || []).forEach(function (pp) {
      (pp.tags || []).forEach(function (t) {
        var key = String(t || '').trim();
        if (!key) return;
        freq[key] = (freq[key] || 0) + 1;
      });
    });
  });
  var tags = Object.keys(freq).sort(function (a, b) { return freq[b] - freq[a] || a.localeCompare(b); }).slice(0, 12);
  if (!tags.length) { el.hidden = true; el.innerHTML = ''; return; }
  el.hidden = false;
  el.innerHTML = '<span class="tag-bar-label">' + ICONS.tag + 'Tag filters</span>' +
    tags.map(function (t) {
      return '<button type="button" class="tag-chip' + (ui.tagFilter === t ? ' active' : '') + '" data-tag="' + esc(t) + '" aria-pressed="' + (ui.tagFilter === t) + '">' + esc(t) + '<span class="n">' + freq[t] + '</span></button>';
    }).join('') +
    (ui.tagFilter ? '<button type="button" class="tag-chip" data-tag-clear>Clear filter ✕</button>' : '');
}

export function InitTagBar() {
  $('#tagBar').addEventListener('click', function (e) {
    var clear = e.target.closest('[data-tag-clear]');
    var chip = e.target.closest('[data-tag]');
    if (!clear && !chip) return;
    ui.tagFilter = (!clear && chip && ui.tagFilter !== chip.dataset.tag) ? chip.dataset.tag : null;
    ui.expandedPaper = null;
    render();
  });
}
