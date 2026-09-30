/* ==========================================================================
   PROFESSORS — 01_HTML_Page/01_Header.js
   Site header (brand, theme + save + add buttons, toolbar row markup) and
   Add-Professor / back-to-top behaviour. Extracted from proff.html lines 833-902
   and the toolbar/boot bindings.
   ==========================================================================
*/

import { $ } from '../01_Utils.js';
import { openProfModal } from '../04_Modals/02_Professor_Modal.js';

export function GetHeaderHTML() {
  return `
  <header class="site-header">
    <div class="header-inner">
      <div class="brand-row">
        <a class="brand" href="#" onclick="return false" aria-label="ProffTrack home">
          <span class="logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>
          </span>
          <span class="brand-text">
            <strong>ProffTrack</strong>
            <small>Professors &amp; Papers Library</small>
          </span>
        </a>
        <div class="header-actions">
          <button id="themeBtn" class="btn btn-ghost" type="button" title="Toggle light / dark theme" aria-label="Toggle light or dark theme">
            <svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            <svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
          </button>
          <button id="saveBtn" class="btn btn-accent" type="button" title="Download this website with all your data inside (Ctrl/Cmd+S)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Save &amp; Download</span>
          </button>
          <button id="addProfBtn" class="btn btn-primary" type="button" title="Add a new professor">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            <span>Add Professor</span>
          </button>
        </div>
      </div>
      <div class="toolbar-row">
        <div class="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input id="searchInput" type="search" placeholder="Search professors, colleges, departments, papers…" aria-label="Search library"/>
        </div>
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
