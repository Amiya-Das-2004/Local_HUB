// ============================================================
// R&D Library — 01_HTML_Page/01_Header.js
// Header bar: Local HUB R&D Logo (left), View Switcher (center),
// Import, Export, Save, Theme Toggle (right).
// Conforms directly to the Local_HUB shared component architecture.
// ============================================================

import { ICONS } from '../01_Utils.js';
import { CurrentTab } from './02_Navbar.js';
import { GetLogoHTML, InitLogoLogic } from '../../00_Components/01_Local_HUB_Logo.js';
import { GetThemeToggleHTML, InitThemeToggleLogic } from '../../00_Components/02_Theme_Toggle.js';
import { InitImportExport } from '../../00_Components/04_Import_Export.js';
import { GetSaveButtonHTML, InitSaveButtonLogic } from '../../00_Components/05_Save_Button.js';

export function GetImportDropdownHTML() {
  return `
    <div class="rd-dropdown-wrap" id="rd-import-menu-wrap">
      <button class="rd-dropdown-trigger icon-btn notes-icon-btn" id="rd-btn-import-menu" type="button" title="Import Data (JSON or BibTeX)" aria-expanded="false" aria-haspopup="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </button>
      <div class="rd-dropdown-menu hidden" id="rd-import-dropdown" role="menu">
        <button type="button" class="rd-dropdown-item" id="btn-import" data-action="import-json" role="menuitem">
          ${ICONS.file}<span>Json Data</span>
        </button>
        <button type="button" class="rd-dropdown-item" data-action="import-bibtex-file" role="menuitem">
          ${ICONS.book}<span>Bib Data</span>
        </button>
      </div>
    </div>
  `;
}

export function GetExportDropdownHTML() {
  return `
    <div class="rd-dropdown-wrap" id="rd-export-menu-wrap">
      <button class="rd-dropdown-trigger icon-btn notes-icon-btn" id="rd-btn-export-menu" type="button" title="Export Data (JSON or BibTeX)" aria-expanded="false" aria-haspopup="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </button>
      <div class="rd-dropdown-menu hidden" id="rd-export-dropdown" role="menu">
        <button type="button" class="rd-dropdown-item" id="btn-export" data-action="export-json" role="menuitem">
          ${ICONS.file}<span>Json Data</span>
        </button>
        <button type="button" class="rd-dropdown-item" data-action="export-bibtex" role="menuitem">
          ${ICONS.copy}<span>Bib Data</span>
        </button>
      </div>
    </div>
  `;
}

export function GetHeaderHTML() {
  const cur = CurrentTab();
  return `
    <header class="app-header rd-header">
      <div class="header-inner rd-header-inner">
        <div class="header-left">
          ${GetLogoHTML({ variant: 'rd' })}
        </div>

        <div class="header-center">
          <div class="rd-view-switcher" role="tablist" aria-label="View mode">
            <button type="button" class="rd-view-btn ${cur === 'list' ? 'active' : ''}" data-action="switch-tab" data-tab="list" id="btnViewList" title="List view (1)" aria-label="List view">
              ${ICONS.list}<span>List</span>
            </button>
            <button type="button" class="rd-view-btn ${cur === 'timeline' ? 'active' : ''}" data-action="switch-tab" data-tab="timeline" id="btnViewTimeline" title="Timeline view (2)" aria-label="Timeline view">
              ${ICONS.clock}<span>Timeline</span>
            </button>
            <button type="button" class="rd-view-btn ${cur === 'map' ? 'active' : ''}" data-action="switch-tab" data-tab="map" id="btnViewMap" title="Mind map view (3)" aria-label="Mind map view">
              ${ICONS.network}<span>Map</span>
            </button>
          </div>
        </div>

        <div class="header-right">
          ${GetImportDropdownHTML()}
          ${GetExportDropdownHTML()}
          ${GetSaveButtonHTML()}
          ${GetThemeToggleHTML()}
        </div>
      </div>
    </header>
  `;
}

export function RenderHeader() {
  const cur = CurrentTab();
  const listBtn = document.getElementById('btnViewList');
  if (listBtn) listBtn.classList.toggle('active', cur === 'list');
  const tlBtn = document.getElementById('btnViewTimeline');
  if (tlBtn) tlBtn.classList.toggle('active', cur === 'timeline');
  const mapBtn = document.getElementById('btnViewMap');
  if (mapBtn) mapBtn.classList.toggle('active', cur === 'map');
}

export function InitHeaderDropdowns() {
  if (typeof window === 'undefined') return;
  if (window.__RD_HEADER_DROPDOWNS_BOUND__) return;
  window.__RD_HEADER_DROPDOWNS_BOUND__ = true;

  const closeDropdowns = () => {
    const importMenu = document.getElementById('rd-import-dropdown');
    const exportMenu = document.getElementById('rd-export-dropdown');
    const impBtn = document.getElementById('rd-btn-import-menu');
    const expBtn = document.getElementById('rd-btn-export-menu');
    if (importMenu && !importMenu.classList.contains('hidden')) {
      importMenu.classList.add('hidden');
      if (impBtn) impBtn.setAttribute('aria-expanded', 'false');
    }
    if (exportMenu && !exportMenu.classList.contains('hidden')) {
      exportMenu.classList.add('hidden');
      if (expBtn) expBtn.setAttribute('aria-expanded', 'false');
    }
  };

  document.addEventListener('click', (e) => {
    const importTrigger = e.target && e.target.closest ? e.target.closest('#rd-btn-import-menu') : null;
    const exportTrigger = e.target && e.target.closest ? e.target.closest('#rd-btn-export-menu') : null;
    const importMenu = document.getElementById('rd-import-dropdown');
    const exportMenu = document.getElementById('rd-export-dropdown');
    const dropdownItem = e.target && e.target.closest ? e.target.closest('.rd-dropdown-item') : null;

    if (importTrigger) {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = importMenu && !importMenu.classList.contains('hidden');
      if (exportMenu) exportMenu.classList.add('hidden');
      const expBtn = document.getElementById('rd-btn-export-menu');
      if (expBtn) expBtn.setAttribute('aria-expanded', 'false');
      if (importMenu) importMenu.classList.toggle('hidden', isOpen);
      importTrigger.setAttribute('aria-expanded', String(!isOpen));
      return;
    }

    if (exportTrigger) {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = exportMenu && !exportMenu.classList.contains('hidden');
      if (importMenu) importMenu.classList.add('hidden');
      const impBtn = document.getElementById('rd-btn-import-menu');
      if (impBtn) impBtn.setAttribute('aria-expanded', 'false');
      if (exportMenu) exportMenu.classList.toggle('hidden', isOpen);
      exportTrigger.setAttribute('aria-expanded', String(!isOpen));
      return;
    }

    if (dropdownItem) {
      // Allow item action to trigger, then dismiss menu
      setTimeout(closeDropdowns, 100);
      return;
    }

    // Dismiss if click is outside both dropdown menus
    closeDropdowns();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDropdowns();
    }
  });
}

export function InitHeader(container) {
  if (container) {
    container.innerHTML = GetHeaderHTML();
  }
  InitLogoLogic();
  InitImportExport();
  InitThemeToggleLogic();
  InitSaveButtonLogic();
  InitHeaderDropdowns();
  RenderHeader();

  const header = document.querySelector('.rd-header, .app-header');
  if (header) {
    /* The header's height is itself driven by --header-height (set on
       .rd-header-inner), while the border-bottom sits on .rd-header — so
       offsetHeight is always var + 1px. Feeding the raw measurement back made
       the ResizeObserver grow the bar ~1px per frame, unbounded while the tab
       is open. Write the border-exclusive inner height instead: the write is
       the fixed point of the loop, so it settles after one delivery. */
    const updateHeaderH = () => {
      const border = header.offsetHeight - header.clientHeight;
      const h = header.offsetHeight - border;
      if (h > 0) document.documentElement.style.setProperty('--header-height', `${h}px`);
    };
    updateHeaderH();
    if (window.ResizeObserver && !window.__RD_HEADER_RO__) {
      window.__RD_HEADER_RO__ = new ResizeObserver(updateHeaderH);
      window.__RD_HEADER_RO__.observe(header);
    }
  }
}

export { InitSaveButtonLogic, InitImportExport };

if (typeof window !== 'undefined') {
  window.RDHeader = {
    GetHeaderHTML,
    GetImportDropdownHTML,
    GetExportDropdownHTML,
    RenderHeader,
    InitHeader,
    InitHeaderDropdowns
  };
}
