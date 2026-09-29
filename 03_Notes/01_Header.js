import { GetLogoHTML, InitLogoLogic } from '../00_Components/01_Local_HUB_Logo.js';
import { GetThemeToggleHTML, InitThemeToggleLogic } from '../00_Components/02_Theme_Toggle.js';
import { GetImportButtonHTML, GetExportButtonHTML, InitImportExport } from '../00_Components/04_Import_Export.js';
import { GetSaveButtonHTML, InitSaveButtonLogic } from '../00_Components/05_Save_Button.js';

// Returns HTML for the center "NOTES" title and journal SVG icon
export function GetCenterTitleHTML() {
  return `
    <style>
      .notes-center-title-group {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        text-decoration: none;
        user-select: none;
        padding: 6px 14px;
        border-radius: 8px;
        transition: background-color var(--transition, 0.2s);
      }

      .notes-center-title-group:hover {
        background: var(--card-hover, #1c1f2e);
      }

      .notes-center-icon {
        width: 22px;
        height: 22px;
        color: var(--accent, #8b6dff);
        flex-shrink: 0;
        transition: color var(--transition, 0.2s), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        filter: drop-shadow(0 0 10px var(--accent-glow, rgba(139, 109, 255, 0.45)));
      }

      .notes-center-title-group:hover .notes-center-icon {
        transform: translateY(-1px) scale(1.12);
      }

      .notes-center-text {
        font-size: 18px;
        font-weight: 800;
        letter-spacing: 0.12em;
        color: var(--text, #e8eaf2);
        font-family: inherit;
        text-transform: uppercase;
        white-space: nowrap;
        transition: color var(--transition, 0.2s);
      }

      @media (max-width: 600px) {
        .notes-center-text {
          font-size: 16px;
          letter-spacing: 0.08em;
        }
        .notes-center-icon {
          width: 19px;
          height: 19px;
        }
      }

      @media (max-width: 440px) {
        .notes-center-text {
          font-size: 13px;
          letter-spacing: 0.05em;
        }
        .notes-center-icon {
          width: 16px;
          height: 16px;
        }
      }

      @media (max-width: 320px) {
        .notes-center-text {
          display: none;
        }
      }
    </style>

    <a class="notes-center-title-group" id="notes-center-title-btn" href="#Notes" title="Back to Notes Deck">
      <svg class="notes-center-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
        <!-- Outer Journal / Manuscript Cover with Soft Fill -->
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke-width="2"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke-width="2" fill="currentColor" fill-opacity="0.14"/>
        
        <!-- Bookmark Ribbon Tag -->
        <path d="M15 2v7l-2.5-1.5L10 9V2" fill="currentColor" fill-opacity="0.35" stroke-width="1.2"/>
        
        <!-- LaTeX Mathematical Glyph (Integral / Function curve) -->
        <path d="M8.5 16c1.5-1.8 3 1.8 4.5 0" stroke-width="1.8"/>
        <line x1="8.5" y1="12" x2="15" y2="12" stroke-width="1.8"/>
      </svg>
      <span class="notes-center-text">NOTES</span>
    </a>
  `;
}

// Attaches click listener to center title to navigate back to #Notes deck
export function InitCenterTitleLogic() {
  const btn = document.getElementById('notes-center-title-btn');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('#notes-text-floating-dock').forEach(el => {
        if (typeof el.__cleanup === 'function') el.__cleanup();
        el.remove();
      });
      window.location.hash = '#Notes';
    });
  }
}

// Returns complete sticky header HTML with navigation and utility buttons
export function GetHeaderHTML() {
  return `
    <style>
      .app-header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 70;
        backdrop-filter: blur(16px) saturate(160%);
        -webkit-backdrop-filter: blur(16px) saturate(160%);
        background: var(--header-bg, rgba(14, 16, 24, 0.85));
        width: 100%;
        transition: background-color var(--transition, 0.2s);
      }

      .header-inner {
        max-width: 100%;
        width: 100%;
        margin: 0 auto;
        padding: 0 clamp(10px, 3vw, 32px);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        height: 74px;
        box-sizing: border-box;
        border-bottom: 1px solid var(--border, #2a2e40);
        transition: border-color var(--transition, 0.2s);
      }

      .header-left {
        display: flex;
        align-items: center;
        flex-shrink: 0;
      }

      .header-center {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 0;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }

      .header-spacer {
        width: 14px;
        height: 1px;
        flex-shrink: 0;
      }

      @media (max-width: 600px) {
        .header-inner {
          height: 66px;
          padding: 0 12px;
          gap: 8px;
        }
        .header-spacer {
          width: 4px;
        }
      }

      @media (max-width: 440px) {
        .header-inner {
          height: 60px;
          padding: 0 8px;
          gap: 6px;
        }
        .header-right {
          gap: 5px;
        }
        .header-spacer {
          display: none;
        }
      }

      @media (max-width: 320px) {
        .header-inner {
          height: 56px;
          padding: 0 5px;
          gap: 4px;
        }
        .header-right {
          gap: 3px;
        }
      }
    </style>

    <header class="app-header">
      <div class="header-inner">
        <!-- 1. LEFT CORNER: Logo from 00_Components/Logo.js -->
        <div class="header-left">
          ${GetLogoHTML()}
        </div>

        <!-- 2. MIDDLE: Refined SVG Logo + "NOTES" -->
        <div class="header-center flex items-center">
          ${GetCenterTitleHTML()}
        </div>

        <!-- 3. RIGHT SIDE CONTROLS -->
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

// Initializes click logic for all header buttons and utilities
export function InitHeader() {
  InitLogoLogic();
  InitCenterTitleLogic();
  InitImportExport();
  InitSaveButtonLogic();
  InitThemeToggleLogic();
}
