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
    RenderHeader,
    InitHeader
  };
}
