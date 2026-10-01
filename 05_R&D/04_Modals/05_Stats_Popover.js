// ============================================================
// R&D Library — 04_Modals/05_Stats_Popover.js
// Interactive library statistics popover (donut chart, type breakdown, tags, timeline histogram).
// Extracted from public/js/ui.js (lines 3080-3185)
// ============================================================

import { esc, ICONS } from '../01_Utils.js';
import { GetAllItems, Stats } from '../00_State.js';

export function DonutSVG(stats) {
  const total = stats.total || 1;
  const segs = [
    { n: stats.read, color: 'var(--green)' },
    { n: stats.reading, color: 'var(--yellow)' },
    { n: stats.unread, color: 'var(--text-dim)' }
  ].filter((s) => s.n > 0);
  const C = 2 * Math.PI * 15.9155;
  let offset = 25; // start at 12 o'clock
  const circles = segs.map((s) => {
    const frac = s.n / total;
    const dash = `${frac * C} ${C - frac * C}`;
    const el = `<circle class="donut-seg" r="15.9155" cx="21" cy="21" fill="none" stroke="${s.color}" stroke-width="5.5"
         stroke-dasharray="${dash}" stroke-dashoffset="${offset}" stroke-linecap="butt"><title>${s.n} item(s)</title></circle>`;
    offset -= frac * 100;
    return el;
  }).join(' ');
  return `<svg class="rd-stats-donut" viewBox="0 0 42 42" width="120" height="120" role="img" aria-label="Reading status donut">
    <circle r="15.9155" cx="21" cy="21" fill="none" stroke="var(--border)" stroke-width="5.5"></circle>
    ${circles}
    <text x="21" y="20" class="donut-num">${stats.total}</text>
    <text x="21" y="26" class="donut-cap">items</text>
  </svg>`;
}

export function GetStatsPopoverHTML() {
  const items = GetAllItems();
  const stats = Stats();
  const legend = [
    { label: 'Read', n: stats.read, cls: 'read' },
    { label: 'Reading', n: stats.reading, cls: 'reading' },
    { label: 'Unread', n: stats.unread, cls: 'unread' }
  ].map((l) => `<span class="rd-stats-legend-item"><span class="rd-status-dot ${l.cls}"></span>${l.label}<b>${l.n}</b></span>`).join('');

  const maxType = Math.max(1, stats.papers, stats.books, stats.theses);
  const typeBars = [
    { label: 'Papers', n: stats.papers, icon: ICONS.file },
    { label: 'Books', n: stats.books, icon: ICONS.book },
    { label: 'Thesis', n: stats.theses, icon: ICONS.grad }
  ].map((t) => `<div class="rd-stats-bar-row" title="${t.n} ${t.label.toLowerCase()}">
      <span class="rd-stats-bar-label">${t.icon}${t.label}</span>
      <span class="rd-stats-bar-track"><span class="rd-stats-bar-fill" style="width:${Math.round((t.n / maxType) * 100)}%"></span></span>
      <b class="rd-stats-bar-n">${t.n}</b>
    </div>`).join('');

  // top tags
  const tagCount = new Map();
  items.forEach((it) => (it.tags || []).forEach((t) => tagCount.set(t, (tagCount.get(t) || 0) + 1)));
  const topTags = Array.from(tagCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const tagChips = topTags.length
    ? topTags.map(([t, n]) => `<button class="rd-tag-pill" data-action="filter-tag" data-tag="${esc(t)}" title="Show items tagged “${esc(t)}”">#${esc(t)}<b>${n}</b></button>`).join('')
    : '<span class="rd-stats-empty">No tags yet</span>';

  // year histogram
  const yearCount = new Map();
  items.forEach((it) => {
    const y = it.year || '????';
    yearCount.set(y, (yearCount.get(y) || 0) + 1);
  });
  const years = Array.from(yearCount.entries()).sort((a, b) => String(a[0]).localeCompare(String(b[0]))).slice(-12);
  const maxY = Math.max(1, ...years.map(([, n]) => n));
  const histogram = years.map(([y, n]) =>
    `<div class="rd-stats-year" title="${y}: ${n} item(s)">
      <span class="rd-stats-year-bar" style="height:${Math.max(8, Math.round((n / maxY) * 46))}px"></span>
      <span class="rd-stats-year-label">${esc(String(y))}</span>
    </div>`).join('');

  return `
    <div class="rd-stats-popover" role="dialog" aria-label="Library statistics">
      <div class="rd-stats-head">Library statistics</div>
      <div class="rd-stats-grid">
        <div class="rd-stats-cell">
          ${DonutSVG(stats)}
          <div class="rd-stats-legend">${legend}</div>
        </div>
        <div class="rd-stats-cell">
          <div class="rd-stats-cell-title">By type</div>
          ${typeBars}
          <div class="rd-stats-cell-title" style="margin-top:14px;">Avg progress</div>
          <div class="rd-stats-avg"><span class="rd-stats-bar-track"><span class="rd-stats-bar-fill avg" style="width:${stats.avgProgress}%"></span></span><b>${stats.avgProgress}%</b></div>
        </div>
      </div>
      <div class="rd-stats-cell-title" style="margin-top:4px;">Top tags <span class="rd-stats-cap">click to filter · right-click to rename</span></div>
      <div class="rd-stats-tags">${tagChips}</div>
      ${years.length ? `<div class="rd-stats-cell-title" style="margin-top:10px;">Published per year</div><div class="rd-stats-years">${histogram}</div>` : ''}
    </div>`;
}

export function ToggleStatsPopover() {
  const root = document.getElementById('rd-stats-root');
  if (!root) return;
  if (root.innerHTML) {
    CloseStatsPopover();
    return;
  }
  root.innerHTML = GetStatsPopoverHTML();
  const btn = document.getElementById('rd-footer-stats');
  if (btn) btn.setAttribute('aria-expanded', 'true');
  requestAnimationFrame(() => root.querySelector('.rd-stats-popover')?.classList.add('show'));
}

export function CloseStatsPopover() {
  const root = document.getElementById('rd-stats-root');
  if (!root) return;
  root.innerHTML = '';
  const btn = document.getElementById('rd-footer-stats');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

if (typeof window !== 'undefined') {
  window.RDStatsPopover = {
    DonutSVG,
    GetStatsPopoverHTML,
    ToggleStatsPopover,
    CloseStatsPopover
  };
}
