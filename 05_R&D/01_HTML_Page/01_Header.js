// ============================================================
// R&D Library — 01_HTML_Page/01_Header.js
// Header bar: global nav cluster (flask identity, active), count
// chip, and SVG-only action controls with tooltips (UI spec §16/25).
// ============================================================

import { esc, ICONS } from '../01_Utils.js';
import { GetAllItems, VisibleItems, QueueItems } from '../00_State.js';
import { GlobalNavHTML, EnsureIconButtonStyles } from '../../00_Components/09_Icon_Button.js';

export function GetHeaderHTML() {
  EnsureIconButtonStyles();
  return `
    <header class="rd-header">
      <div class="rd-header-inner">
        ${GlobalNavHTML({ active: 'rd', accent: '#8b6dff', cls: 'rd-global-nav' })}
        <span class="rd-count-chip" id="rd-header-count"></span>
        <div class="rd-header-actions">
          <button class="icb-btn" data-action="toggle-queue" id="rd-queue-btn" data-tip="Reading queue (Q) — what to read next" aria-label="Reading queue">
            ${ICONS.queue}<span class="rd-queue-badge" id="rd-queue-badge" hidden></span>
          </button>
          <button class="icb-btn" data-action="open-palette" data-tip="Search — command palette (Ctrl+K)" aria-label="Open command palette">
            ${ICONS.search}
          </button>
          <button class="icb-btn" data-action="show-help" id="rd-help-btn" data-tip="Help &amp; keyboard shortcuts (?)" aria-label="Help and keyboard shortcuts">${ICONS.help}</button>
          <button class="icb-btn" data-action="toggle-theme" id="rd-theme-btn" data-tip="Change theme" aria-label="Change theme">
            <svg class="theme-icon-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            <svg class="theme-icon-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="18.36" y2="21"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          </button>
          <button class="icb-btn icb-accent" data-action="export-standalone" data-tip="Save HTML — library + app in one offline file" aria-label="Save standalone HTML">
            ${ICONS.download}
          </button>
        </div>
      </div>
    </header>
  `;
}

export function RenderHeader() {
  const all = GetAllItems().length;
  const vis = VisibleItems().length;
  const countEl = document.getElementById('rd-header-count');
  if (countEl) {
    countEl.textContent = vis === all ? `${all} item${all === 1 ? '' : 's'}` : `${vis} of ${all}`;
  }
  const queueBadge = document.getElementById('rd-queue-badge');
  if (queueBadge) {
    const qCount = QueueItems().length;
    queueBadge.textContent = String(qCount);
    queueBadge.hidden = qCount === 0;
  }
}

export function InitHeader() {
  RenderHeader();
}

if (typeof window !== 'undefined') {
  window.RDHeader = {
    GetHeaderHTML,
    RenderHeader,
    InitHeader
  };
}
