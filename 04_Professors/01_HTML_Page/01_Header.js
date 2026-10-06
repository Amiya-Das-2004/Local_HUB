/* ==========================================================================
   PROFESSORS — 01_HTML_Page/01_Header.js
   ProfessorTrack header (reformed layout, 2026-10-03):
     Row 1: [bare scholar-cap brand mark] ProfessorTrack · Import · Export · Save · Theme
     Row 2: [chart] [sort] [search bar] [add professor]
   Every control is an SVG icon with a tooltip; no permanent text labels.
   The former global-nav cluster and the secondary utilities row (status /
   favorites / expand-all / compare / journal) were removed by design.
   ==========================================================================
*/

import { $ } from '../01_Utils.js';
import { openProfModal } from '../04_Modals/02_Professor_Modal.js';
import { SCHOLAR_CAP_SVG, EnsureIconButtonStyles } from '../../00_Components/09_Icon_Button.js';

const PERSON_ADD_SVG = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="9.5" cy="7.8" r="3.6"/><path d="M3.4 20c.6-3.6 3-5.7 6.1-5.7 1.6 0 3 .5 4.1 1.4"/>
    <path d="M18.4 13.9v5.6"/><path d="M15.6 16.7h5.6"/>
  </svg>`.trim();

const CHART_SVG = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M4 20v-7"/><path d="M10 20V5"/><path d="M16 20v-10"/><path d="M21.5 20H2.5"/>
  </svg>`.trim();

const IMPORT_SVG = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 3v11"/><path d="m7 9.5 5 5 5-5"/><path d="M4.5 20.5h15"/>
  </svg>`.trim();

const EXPORT_SVG = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 14.5v-11"/><path d="m7 8 5-5 5 5"/><path d="M4.5 20.5h15"/>
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
        <div class="header-actions">
          <button id="importBtn" class="icb-btn" type="button" data-tip="Import — load a saved .json / .html library (CSV import lives in the footer)" aria-label="Import ProfessorTrack data">
            ${IMPORT_SVG}
          </button>
          <button id="exportBtn" class="icb-btn" type="button" data-tip="Export — download the library as .json (CSV export lives in the footer)" aria-label="Export ProfessorTrack data">
            ${EXPORT_SVG}
          </button>
          <button id="saveBtn" class="icb-btn icb-accent" type="button" data-tip="Save — download ProfessorTrack as one offline file" aria-label="Save ProfessorTrack data">
            ${SAVE_SVG}
          </button>
          <button id="themeBtn" class="icb-btn" type="button" data-tip="Change theme" aria-label="Change theme">
            <svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            <svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
          </button>
        </div>
      </div>

      <div class="pt-row2">
        <button id="chartToggleBtn" class="icb-btn" type="button" data-tip="Stats — toggle the reading dashboard" aria-label="Toggle reading dashboard" aria-pressed="true">
          ${CHART_SVG}
        </button>
        <label class="sort-wrap">
          <span>Sort by</span>
          <select id="sortSelect" aria-label="Sort professors">
            <option value="qs" selected>QS Ranking (best first)</option>
            <option value="name">Name (A–Z)</option>
            <option value="papers">Most papers read</option>
            <option value="recent">Recently added</option>
          </select>
        </label>
        <div class="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input id="searchInput" type="search" placeholder="Search professors, colleges, departments, papers…" aria-label="Search library"/>
        </div>
        <button id="addProfBtn" class="icb-btn icb-accent" type="button" data-tip="Add Professor" aria-label="Add Professor">
          ${PERSON_ADD_SVG}
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

  /* import / export — delegate to the footer's wired IO buttons so the
     JSON/CSV handlers keep a single canonical binding */
  var importBtn = $('#importBtn');
  if (importBtn) {
    importBtn.addEventListener('click', function () {
      var target = document.getElementById('importJsonBtn');
      if (target) target.click();
    });
  }
  var exportBtn = $('#exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', function () {
      var target = document.getElementById('exportJsonBtn');
      if (target) target.click();
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
