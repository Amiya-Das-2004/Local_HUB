// ============================================================
// R&D Library — 01_HTML_Page/01_Header.js
// Header bar HTML, count chips, queue badge, and controls.
// Extracted from public/js/ui.js (lines 148-179, 1334-1354)
// ============================================================

import { esc, ICONS } from '../01_Utils.js';
import { GetAllItems, VisibleItems, QueueItems } from '../00_State.js';

export function GetHeaderHTML() {
  return `
    <header class="rd-header">
      <div class="rd-header-inner">
        <button class="rd-logo-btn" id="rd-logo-btn" data-action="switch-tab" data-tab="list" title="R&D Library — home">
          <div class="rd-logo-badge" style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:6px;background:var(--accent);color:#fff;font-weight:800;font-size:12px;margin-right:8px;">R&amp;D</div>
          <span class="rd-site-name">
            <span class="title">R&amp;D</span>
            <span class="subtitle">Research &amp; Development</span>
          </span>
        </button>
        <div class="rd-header-actions">
          <span class="rd-count-chip" id="rd-header-count"></span>
          <button class="ghost-btn" data-action="toggle-queue" id="rd-queue-btn" title="Reading queue (Q) — what to read next">
            ${ICONS.queue}<span>Queue</span><span class="rd-queue-badge" id="rd-queue-badge" hidden></span>
          </button>
          <button class="ghost-btn pal-trigger" data-action="open-palette" title="Command palette (Ctrl+K) — jump to papers &amp; run actions" aria-label="Open command palette">
            ${ICONS.search}<span class="pal-trigger-label">Search</span><kbd class="pal-kbd">Ctrl K</kbd>
          </button>
          <button class="icon-btn" data-action="show-help" id="rd-help-btn" title="Help &amp; keyboard shortcuts (?)" aria-label="Help and keyboard shortcuts">${ICONS.help}</button>
          <button class="icon-btn" data-action="toggle-theme" id="rd-theme-btn" title="Toggle light / dark theme">
            <svg class="theme-icon-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            <svg class="theme-icon-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          </button>
          <button class="ghost-btn" data-action="export-standalone" title="Save / Download Standalone HTML — the whole library + app in one file">
            ${ICONS.download}<span>Save HTML</span>
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
  const logo = document.getElementById('rd-logo-btn');
  if (logo) {
    logo.addEventListener('click', (e) => {
      const hubUrl = (typeof window !== 'undefined' && window.__LOCALHUB_HUB_URL__) || '';
      if (hubUrl) {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = hubUrl;
      } else if (typeof window !== 'undefined' && window.location.hash) {
        e.preventDefault();
        e.stopPropagation();
        window.location.hash = '';
      }
    });
  }
}

if (typeof window !== 'undefined') {
  window.RDHeader = {
    GetHeaderHTML,
    RenderHeader,
    InitHeader
  };
}
