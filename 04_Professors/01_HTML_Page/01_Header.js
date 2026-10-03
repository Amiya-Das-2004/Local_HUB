/* ==========================================================================
   PROFESSORS — 01_HTML_Page/01_Header.js
   ProfessorTrack header (UI spec §6-13):
     Row 1: [cap logo] ProfessorTrack · global nav cluster · theme · io · save
     Row 2: [chart] [search bar] [add professor]
     Row 3: secondary list utilities (sort / filters / journal …)
   Every control is an SVG icon with a tooltip; no permanent text labels.
   ==========================================================================
*/

import { $ } from '../01_Utils.js';
import { openProfModal } from '../04_Modals/02_Professor_Modal.js';
import { GlobalNavHTML, SCHOLAR_CAP_SVG, EnsureIconButtonStyles } from '../../00_Components/09_Icon_Button.js';

const PERSON_ADD_SVG = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="9.5" cy="7.8" r="3.6"/><path d="M3.4 20c.6-3.6 3-5.7 6.1-5.7 1.6 0 3 .5 4.1 1.4"/>
    <path d="M18.4 13.9v5.6"/><path d="M15.6 16.7h5.6"/>
  </svg>`.trim();

const CHART_SVG = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M4 20v-7"/><path d="M10 20V5"/><path d="M16 20v-10"/><path d="M21.5 20H2.5"/>
  </svg>`.trim();

const IO_ARROWS_SVG = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="m3.5 15.5 3.75 3.75L11 15.5"/><path d="M7.25 19V4"/>
    <path d="m20.5 8.5-3.75-3.75L13 8.5"/><path d="M16.75 5v15"/>
  </svg>`.trim();

const SAVE_SVG = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>
  </svg>`.trim();

export function GetHeaderHTML() {
  EnsureIconButtonStyles();
  return `
  <header class="site-header">
    <div class="header-inner">
      <div class="brand-row">
        <a class="brand" href="#" onclick="return false" aria-label="ProfessorTrack home">
          <span class="logo" aria-hidden="true">${SCHOLAR_CAP_SVG}</span>
          <span class="brand-text">
            <strong>ProfessorTrack</strong>
            <small>Professors &amp; Papers Library</small>
          </span>
        </a>
        <div class="pt-global-nav-wrap">${GlobalNavHTML({ active: 'professors', accent: '#0f766e' })}</div>
        <div class="header-actions">
          <button id="themeBtn" class="icb-btn" type="button" data-tip="Change theme" aria-label="Change theme">
            <svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            <svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
          </button>
          <div class="pt-io-wrap">
            <button id="ioMenuBtn" class="icb-btn" type="button" data-tip="ProfessorTrack data — import / export" aria-label="Import or export ProfessorTrack data" aria-haspopup="true" aria-expanded="false">
              ${IO_ARROWS_SVG}
            </button>
            <div class="pt-io-menu" id="ptIoMenu" hidden>
              <button type="button" data-io="importJson">Import JSON…</button>
              <button type="button" data-io="importCsv">Import CSV…</button>
              <button type="button" data-io="exportJson">Export JSON</button>
              <button type="button" data-io="exportCsv">Export CSV</button>
            </div>
          </div>
          <button id="saveBtn" class="icb-btn icb-accent" type="button" data-tip="Save — download ProfessorTrack as one offline file" aria-label="Save ProfessorTrack data">
            ${SAVE_SVG}
          </button>
        </div>
      </div>

      <div class="pt-row2">
        <button id="chartToggleBtn" class="icb-btn" type="button" data-tip="Stats — toggle the reading dashboard" aria-label="Toggle reading dashboard" aria-pressed="true">
          ${CHART_SVG}
        </button>
        <div class="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input id="searchInput" type="search" placeholder="Search professors, colleges, departments, papers…" aria-label="Search library"/>
        </div>
        <button id="addProfBtn" class="icb-btn icb-accent" type="button" data-tip="Add Professor" aria-label="Add Professor">
          ${PERSON_ADD_SVG}
        </button>
      </div>

      <div class="toolbar-row pt-row3">
        <label class="sort-wrap">
          <span>Sort by</span>
          <select id="sortSelect" aria-label="Sort professors">
            <option value="qs" selected>QS Ranking (best first)</option>
            <option value="name">Name (A–Z)</option>
            <option value="papers">Most papers read</option>
            <option value="recent">Recently added</option>
          </select>
        </label>
        <label class="sort-wrap">
          <span>Show</span>
          <select id="statusSelect" aria-label="Filter papers by reading status">
            <option value="all" selected>All papers</option>
            <option value="read">Read</option>
            <option value="reading">Currently reading</option>
            <option value="wishlist">Want to read</option>
          </select>
        </label>
        <button id="favBtn" class="btn btn-ghost" type="button" title="Show only favorite professors (star a professor inside its card)" aria-pressed="false">
          <svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span>Favorites</span>
        </button>
        <button id="expandAllBtn" class="btn btn-ghost" type="button" title="Expand or collapse all professor cards">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h.01"/><path d="M17 7h.01"/><path d="M7 17h.01"/><path d="M17 17h.01"/><path d="M7 12h10"/></svg>
          <span id="expandAllLabel">Expand all</span>
        </button>
        <button id="compareBtn" class="btn btn-ghost" type="button" title="Compare two professors side by side (C)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>
          <span>Compare</span>
        </button>
        <button id="journalBtn" class="btn btn-ghost" type="button" title="Browse every reading-journal entry across all papers (N)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/></svg>
          <span>Journal</span>
          <span class="btn-cnt" id="journalCnt" hidden aria-hidden="true"></span>
        </button>
      </div>
    </div>
  </header>`;
}

/* window-level scroll listener is bound once; element queries stay live so the
   module keeps working after the app DOM is re-mounted (hash re-entry) */
let scrollBound = false;
export function InitHeader() {
  $('#addProfBtn').addEventListener('click', function () { openProfModal(null); });

  /* io menu — reuses the footer's wired export/import buttons */
  var ioBtn = $('#ioMenuBtn');
  var ioMenu = $('#ptIoMenu');
  if (ioBtn && ioMenu) {
    ioBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      ioMenu.hidden = !ioMenu.hidden;
      ioBtn.setAttribute('aria-expanded', String(!ioMenu.hidden));
    });
    ioMenu.addEventListener('click', function (e) {
      var item = e.target.closest('[data-io]');
      if (!item) return;
      ioMenu.hidden = true;
      ioBtn.setAttribute('aria-expanded', 'false');
      var map = {
        importJson: 'importJsonBtn', importCsv: 'importCsvBtn',
        exportJson: 'exportJsonBtn', exportCsv: 'exportCsvBtn'
      };
      var target = document.getElementById(map[item.dataset.io]);
      if (target) target.click();
    });
    document.addEventListener('click', function (e) {
      if (!ioMenu.hidden && !e.target.closest('.pt-io-wrap')) {
        ioMenu.hidden = true;
        ioBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* chart icon — toggle the reading dashboard (stats bar + heatmap) */
  var chartBtn = $('#chartToggleBtn');
  if (chartBtn) {
    chartBtn.addEventListener('click', function () {
      ['#statsBar', '#heatSection'].forEach(function (sel) {
        var el = document.querySelector(sel);
        if (el) el.hidden = !el.hidden;
      });
      var pressed = chartBtn.getAttribute('aria-pressed') !== 'true';
      chartBtn.setAttribute('aria-pressed', String(pressed));
    });
  }

  /* brand link → back to the hub (LocalHUB logo semantics): the standalone
     Professor.html shell sets __LOCALHUB_HUB_URL__; inside the Index.html SPA
     clearing the hash returns to the landing page; saved proff.html keeps the
     original inert behaviour because its inline code has no such handler */
  var brand = document.querySelector('.site-header .brand');
  if (brand) {
    brand.addEventListener('click', function (e) {
      e.preventDefault();
      var hubUrl = (typeof window !== 'undefined' && window.__LOCALHUB_HUB_URL__) || '';
      if (hubUrl) window.location.href = hubUrl;
      else if (window.location.hash) window.location.hash = '';
    });
  }

  /* back to top */
  var topBtn = $('#scrollTopBtn');
  topBtn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  if (!scrollBound) {
    scrollBound = true;
    window.addEventListener('scroll', function () {
      var tb = $('#scrollTopBtn');
      if (tb) tb.hidden = window.scrollY < 420;
      var headerEl = $('.site-header');
      if (headerEl) headerEl.classList.toggle('scrolled', window.scrollY > 8);
    }, { passive: true });
  }
}
