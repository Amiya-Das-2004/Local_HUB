// ============================================================
// R&D Library — 02_Dashboard/04_Tag_Bar.js
// Frequency-sorted research tag filter chips bar.
// ============================================================

import { state, SetUI } from '../00_State.js';
import { esc, ICONS } from '../01_Utils.js';

export function tagFrequencies() {
  const items = (state.rd && state.rd.items) || [];
  const freq = {};
  items.forEach((it) => {
    (it.tags || []).forEach((t) => {
      const key = String(t || '').trim();
      if (!key) return;
      freq[key] = (freq[key] || 0) + 1;
    });
  });
  return freq;
}

export function tagBarHTML() {
  const freq = tagFrequencies();
  const sorted = Object.keys(freq).sort((a, b) => freq[b] - freq[a] || a.localeCompare(b)).slice(0, 16);
  if (!sorted.length) return '';
  const active = state.rd.ui && state.rd.ui.tagFilter;
  return `
    <div class="rd-tag-bar-inner">
      <span class="rd-tag-bar-label">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="vertical-align:middle;margin-right:4px;"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
        Topic filters:
      </span>
      <div class="rd-tag-chips-wrap">
        ${sorted.map((t) => `
          <button type="button" class="rd-tag-filter-chip ${active === t ? 'active' : ''}" data-action="filter-tag-chip" data-tag="${esc(t)}" aria-pressed="${active === t}">
            #${esc(t)} <span class="tag-cnt">${freq[t]}</span>
          </button>
        `).join('')}
        ${active ? `<button type="button" class="rd-tag-filter-chip clear" data-action="clear-tag-chip">Clear filter &times;</button>` : ''}
      </div>
    </div>
  `;
}

export function RenderTagBar() {
  const el = document.getElementById('rd-tag-bar');
  if (!el) return;
  const freq = tagFrequencies();
  if (!Object.keys(freq).length) {
    el.hidden = true;
    el.innerHTML = '';
    return;
  }
  el.hidden = false;
  el.innerHTML = tagBarHTML();
}

export function InitTagBar() {
  document.addEventListener('click', (e) => {
    const clearBtn = e.target.closest && e.target.closest('[data-action="clear-tag-chip"]');
    if (clearBtn) {
      SetUI({ tagFilter: null });
      RenderTagBar();
      if (window.RDUI && typeof window.RDUI.RenderAll === 'function') window.RDUI.RenderAll();
      return;
    }
    const chip = e.target.closest && e.target.closest('[data-action="filter-tag-chip"]');
    if (chip) {
      const tag = chip.dataset.tag;
      const cur = state.rd.ui && state.rd.ui.tagFilter;
      SetUI({ tagFilter: cur === tag ? null : tag });
      RenderTagBar();
      if (window.RDUI && typeof window.RDUI.RenderAll === 'function') window.RDUI.RenderAll();
    }
  });
}
