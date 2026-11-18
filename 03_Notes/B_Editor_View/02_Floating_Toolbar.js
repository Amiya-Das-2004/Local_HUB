/**
 * 03_Notes/B_Editor_View/02_Floating_Toolbar.js
 * Master Floating Dock Toolbar for Editor View (all buttons are pure SVG icons).
 * Order:
 * 1. Back to Notes Deck
 * 2. Sidebar Outline Drawer Toggle (02_Sidebar/03_Sidebar_Toggle.js)
 * 3. Reading Mode / Study View Toggle (03_Floating_ToolBar/01_Study_View_Toggle.js)
 * 4. LaTeX & TikZ Macros (03_Floating_ToolBar/04_Macros_Modal.js)
 * 5. Font Family Selector (03_Floating_ToolBar/02_Note_Fonts.js — icon + popup menu)
 * 6. Font Size Selector (03_Floating_ToolBar/03_Font_Size.js — icon + popup menu)
 * 7. BibTeX Library (03_Library.js)
 * 8. Numbering — popup above the bar with \cite{} (citation style), \Fig{} (figure style +
 *    captions) and \eqref{} (3-level equation numbering format: group N, part N.x,
 *    row N.x.y) option sections.
 */

import { GetSidebarToggleHTML, InitSidebarToggleLogic } from './02_Sidebar/03_Sidebar_Toggle.js';
import { GetStudyViewToggleHTML, InitStudyViewToggleLogic } from './03_Floating_ToolBar/01_Study_View_Toggle.js';
import { GetNoteFontsHTML, InitNoteFontsLogic } from './03_Floating_ToolBar/02_Note_Fonts.js';
import { GetFontSizeHTML, InitFontSizeLogic } from './03_Floating_ToolBar/03_Font_Size.js';
import { OpenMacrosModal } from './03_Floating_ToolBar/04_Macros_Modal.js';
import { OpenLibraryModal } from '../03_Library.js';
import { GetCiteStyleOptionsHTML, InitCiteStyleOptions } from './03_Floating_ToolBar/05_Citation_Style.js';
import { GetEqNumberingOptionsHTML, InitEqNumberingOptions } from './03_Floating_ToolBar/06_Equation_Numbering.js';
import { GetFigureNumberingOptionsHTML, InitFigureNumberingOptions } from './03_Floating_ToolBar/07_Figure_Numbering.js';

function ensureToolbarStyles() {
  if (typeof document === 'undefined' || document.getElementById('notes-floating-toolbar-styles')) return;
  const styleEl = document.createElement('style');
  styleEl.id = 'notes-floating-toolbar-styles';
  styleEl.textContent = `
    .nft-icon-btn {
      width: 32px; height: 32px; min-width: 32px; min-height: 32px; padding: 0;
      display: inline-flex; align-items: center; justify-content: center;
      border-radius: 9999px; border: 1px solid var(--border, #2a2e40);
      background: var(--surface, #181b27); color: var(--text, #e8eaf2);
      cursor: pointer; flex-shrink: 0;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
    }
    .nft-icon-btn:hover { transform: translateY(-1px); }
    .nft-accent-sky:hover { color: #38bdf8; border-color: rgba(56, 189, 248, 0.5); background: rgba(56, 189, 248, 0.08); }
    .nft-accent-purple:hover { color: #c084fc; border-color: rgba(192, 132, 252, 0.5); background: rgba(192, 132, 252, 0.08); }
    .nft-accent-amber:hover { color: #fbbf24; border-color: rgba(251, 191, 36, 0.5); background: rgba(251, 191, 36, 0.08); }
    .nft-accent-emerald:hover { color: #34d399; border-color: rgba(52, 211, 153, 0.5); background: rgba(52, 211, 153, 0.08); }
    .nft-divider { width: 1px; height: 20px; background: var(--border, #2a2e40); opacity: 0.7; flex-shrink: 0; }

    .nft-menu {
      position: absolute; bottom: calc(100% + 10px); left: 0; min-width: 150px; padding: 4px;
      border-radius: 12px; border: 1px solid var(--border, #2a2e40);
      background: var(--card, #1c1f2e); box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45); z-index: 90;
    }
    .nft-menu.hidden { display: none; }

    .nft-numbering-wrap { position: relative; }
    .nft-numbering-panel {
      position: absolute; bottom: calc(100% + 12px); right: -6px;
      width: 238px; max-width: calc(100vw - 20px); padding: 8px;
      border-radius: 14px; border: 1px solid var(--border, #2a2e40);
      background: var(--card, #1c1f2e); box-shadow: 0 14px 36px rgba(0, 0, 0, 0.5);
      z-index: 95; display: none;
    }
    .nft-numbering-panel.open { display: block; }
    .nft-num-triggers { display: flex; gap: 6px; }
    .nft-num-chip {
      flex: 1; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px; font-weight: 700; padding: 8px 10px; border-radius: 9px;
      border: 1px solid var(--border, #2a2e40); background: var(--surface, #181b27);
      color: var(--text, #e8eaf2); cursor: pointer; transition: all 0.15s; text-align: center;
    }
    .nft-num-chip-cite:hover, .nft-num-chip-cite.active { color: #facc15; border-color: rgba(250, 204, 21, 0.5); background: rgba(250, 204, 21, 0.1); }
    .nft-num-chip-fig:hover, .nft-num-chip-fig.active { color: #fbbf24; border-color: rgba(251, 191, 36, 0.5); background: rgba(251, 191, 36, 0.1); }
    .nft-num-chip-eq:hover, .nft-num-chip-eq.active { color: #34d399; border-color: rgba(52, 211, 153, 0.5); background: rgba(52, 211, 153, 0.1); }
    .nft-num-section { display: none; margin-top: 8px; padding-top: 6px; border-top: 1px solid var(--border, #2a2e40); }
    .nft-num-section.open { display: block; }

    /* Display-specific: tablet */
    @media (max-width: 768px) {
      .notes-floating-toolbar { gap: 4px !important; padding: 4px !important; }
      .notes-floating-toolbar .nft-icon-btn,
      .notes-floating-toolbar .notes-sidebar-toggle-btn,
      .notes-floating-toolbar .notes-study-toggle-btn {
        width: 30px !important; height: 30px !important; min-width: 30px !important; min-height: 30px !important;
      }
      .notes-floating-toolbar .nft-divider { height: 18px; }
    }

    /* Display-specific: phone */
    @media (max-width: 520px) {
      .notes-floating-toolbar { gap: 2px !important; padding: 3px !important; border-radius: 18px; }
      .notes-floating-toolbar .nft-icon-btn,
      .notes-floating-toolbar .notes-sidebar-toggle-btn,
      .notes-floating-toolbar .notes-study-toggle-btn {
        width: 28px !important; height: 28px !important; min-width: 28px !important; min-height: 28px !important;
      }
      .notes-floating-toolbar .nft-icon-btn svg { width: 14px; height: 14px; }
      .notes-floating-toolbar .nft-divider { display: none; }
    }
  `;
  document.head.appendChild(styleEl);
}

export function CreateFloatingToolbar({
  currentFont = 'serif',
  currentSize = 'base',
  isStudyMode = false,
  note = null,
  onFontChange = null,
  onSizeChange = null,
  onToggleStudy = null,
  onMacrosChange = null,
  onCiteStyleChange = null,
  onEqStyleChange = null, // reserved — equation numbering UI intentionally omitted for now
  onFigStyleChange = null
} = {}) {
  ensureToolbarStyles();

  const toolbar = document.createElement('div');
  toolbar.className = 'notes-insert-floating-dock notes-floating-toolbar fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 p-1 sm:p-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md shadow-2xl flex items-center justify-center gap-1.5 sm:gap-2 select-none transition-all duration-200 max-w-[calc(100vw-16px)]';

  toolbar.innerHTML = `
    <!-- 1. Back to Notes Deck -->
    <button type="button" class="btn-back-to-notes nft-icon-btn nft-accent-sky" title="Back to Notes Deck">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
        <path d="M19 12H5"></path>
        <path d="M12 19l-7-7 7-7"></path>
      </svg>
    </button>

    <!-- Divider -->
    <div class="nft-divider"></div>

    <!-- 2. Sidebar Outline Toggle -->
    <div class="flex items-center flex-shrink-0">
      ${GetSidebarToggleHTML()}
    </div>

    <!-- Divider -->
    <div class="nft-divider"></div>

    <!-- 3. Reading Mode (Study View) Toggle -->
    <div class="flex items-center flex-shrink-0">
      ${GetStudyViewToggleHTML(isStudyMode)}
    </div>

    <!-- Divider -->
    <div class="nft-divider"></div>

    <!-- 4. LaTeX & TikZ Macros -->
    <button type="button" class="btn-macros-toggle nft-icon-btn nft-accent-purple" title="Manage Global & Local LaTeX/TikZ Macros">
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
        <path d="M17 5H7l6 7-6 7h10"></path>
      </svg>
    </button>

    <!-- Divider -->
    <div class="nft-divider"></div>

    <!-- 5. Font Family + 6. Font Size (icon buttons with popup menus) -->
    <div class="flex items-center gap-1 flex-shrink-0">
      ${GetNoteFontsHTML(currentFont)}
      ${GetFontSizeHTML(currentSize)}
    </div>

    <!-- Divider -->
    <div class="nft-divider"></div>

    <!-- 7. BibTeX Library -->
    <button type="button" class="btn-library-toggle nft-icon-btn nft-accent-sky" title="BibTeX Library — manage sources, cite them with \\cite{key}">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
    </button>

    <!-- Divider -->
    <div class="nft-divider"></div>

    <!-- 8. Numbering: popup above the bar with \cite{} (citation) + \Fig{} (figure) options -->
    <div class="nft-numbering-wrap">
      <button type="button" class="btn-numbering-toggle nft-icon-btn nft-accent-amber" title="Numbering — citation style (\\cite{}) & figure style (\\Fig{})">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
          <line x1="10" x2="21" y1="6" y2="6"></line>
          <line x1="10" x2="21" y1="12" y2="12"></line>
          <line x1="10" x2="21" y1="18" y2="18"></line>
          <path d="M4 6h1v4"></path>
          <path d="M4 10h2"></path>
          <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
        </svg>
      </button>
      <div class="nft-numbering-panel">
        <div class="nft-num-triggers">
          <button type="button" class="nft-num-chip nft-num-chip-cite" title="Citation numbering style (\\cite{key} badges)">\\cite{}</button>
          <button type="button" class="nft-num-chip nft-num-chip-fig" title="Figure numbering style (\\fig{tag} badges & captions)">\\Fig{}</button>
          <button type="button" class="nft-num-chip nft-num-chip-eq" title="Equation numbering style (\\label{} numbering + \\eqref{}/\\ref{} references)">\\eqref{}</button>
        </div>
        <div class="nft-num-section nft-num-section-cite">
          ${GetCiteStyleOptionsHTML()}
        </div>
        <div class="nft-num-section nft-num-section-fig">
          ${GetFigureNumberingOptionsHTML(note)}
        </div>
        <div class="nft-num-section nft-num-section-eq">
          ${GetEqNumberingOptionsHTML(note)}
        </div>
      </div>
    </div>
  `;

  // Attach event handlers
  setTimeout(() => {
    InitSidebarToggleLogic();
    InitStudyViewToggleLogic(onToggleStudy);
    InitNoteFontsLogic(onFontChange);
    InitFontSizeLogic(onSizeChange);

    // 1. Back to Notes Deck — cleans up floating text docks, then routes to the card deck
    const btnBack = toolbar.querySelector('.btn-back-to-notes');
    if (btnBack) {
      btnBack.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll('#notes-text-floating-dock').forEach(el => {
          if (typeof el.__cleanup === 'function') el.__cleanup();
          el.remove();
        });
        window.location.hash = '#Notes';
      });
    }

    // 4. Macros modal
    const btnMacros = toolbar.querySelector('.btn-macros-toggle');
    if (btnMacros) {
      btnMacros.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        OpenMacrosModal({
          note,
          onSave: onMacrosChange
        });
      });
    }

    // 7. BibTeX Library modal
    const btnLibrary = toolbar.querySelector('.btn-library-toggle');
    if (btnLibrary) {
      btnLibrary.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        OpenLibraryModal({ onUpdate: onCiteStyleChange });
      });
    }

    // 8. Numbering popup: chips toggle their option section above the floating bar
    const numWrap = toolbar.querySelector('.nft-numbering-wrap');
    if (numWrap) {
      const numPanel = numWrap.querySelector('.nft-numbering-panel');
      const chipCite = numWrap.querySelector('.nft-num-chip-cite');
      const chipFig = numWrap.querySelector('.nft-num-chip-fig');
      const chipEq = numWrap.querySelector('.nft-num-chip-eq');
      const secCite = numWrap.querySelector('.nft-num-section-cite');
      const secFig = numWrap.querySelector('.nft-num-section-fig');
      const secEq = numWrap.querySelector('.nft-num-section-eq');

      const setSection = (which) => {
        [['cite', secCite, chipCite], ['fig', secFig, chipFig], ['eq', secEq, chipEq]].forEach(([name, sec, chip]) => {
          sec.classList.toggle('open', which === name);
          chip.classList.toggle('active', which === name);
        });
      };

      numWrap.querySelector('.btn-numbering-toggle').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        numPanel.classList.toggle('open');
        if (!numPanel.classList.contains('open')) setSection('none');
      });

      const bindChip = (chip, name) => {
        chip.addEventListener('click', (e) => {
          e.stopPropagation();
          const sec = numWrap.querySelector(`.nft-num-section-${name}`);
          setSection(sec.classList.contains('open') ? 'none' : name);
        });
      };
      bindChip(chipCite, 'cite');
      bindChip(chipFig, 'fig');
      bindChip(chipEq, 'eq');

      numPanel.addEventListener('click', (e) => e.stopPropagation());

      // Close when clicking anywhere else
      document.addEventListener('click', (e) => {
        if (!numWrap.contains(e.target)) {
          numPanel.classList.remove('open');
          setSection('none');
        }
      });

      InitCiteStyleOptions(secCite, onCiteStyleChange);
      InitFigureNumberingOptions(note, secFig, onFigStyleChange);
      InitEqNumberingOptions(note, secEq, onEqStyleChange);
    }
  }, 0);

  return toolbar;
}

// Backward compatibility alias
export const CreateInsertToolbar = CreateFloatingToolbar;
