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
import { GetImportButtonHTML, GetExportButtonHTML, InitImportExport } from '../../00_Components/04_Import_Export.js';
import { GetSaveButtonHTML, InitSaveButtonLogic } from '../../00_Components/05_Save_Button.js';

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
          ${GetImportButtonHTML()}
          ${GetExportButtonHTML()}
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

export function InitHeader(container) {
  if (container) {
    container.innerHTML = GetHeaderHTML();
  }
  InitLogoLogic();
  InitImportExport();
  InitThemeToggleLogic();
  InitSaveButtonLogic();
  RenderHeader();

  const header = document.querySelector('.rd-header, .app-header');
  if (header) {
    const updateHeaderH = () => {
      const h = header.offsetHeight;
      if (h > 0) document.documentElement.style.setProperty('--header-height', `${h}px`);
    };
    updateHeaderH();
    if (window.ResizeObserver) {
      new ResizeObserver(entries => {
        for (const entry of entries) {
          const h = entry.borderBoxSize ? entry.borderBoxSize[0].blockSize : header.offsetHeight;
          if (h > 0) document.documentElement.style.setProperty('--header-height', `${h}px`);
        }
      }).observe(header);
    }
  }
}

export { InitSaveButtonLogic, InitImportExport };

if (typeof window !== 'undefined') {
  window.RDHeader = {
    GetHeaderHTML,
    RenderHeader,
    InitHeader
  };
}
