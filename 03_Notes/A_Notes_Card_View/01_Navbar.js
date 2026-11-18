import { GetViewToggleHTML, InitViewToggle } from './01_Navbar/01_Card_View_Toggle.js';
import { GetGroupFilterHTML, InitGroupFilter } from './01_Navbar/02_Group_Filter.js';
import { GetSearchBarHTML, InitSearchBar } from './01_Navbar/03_Search_Bar.js';
import { GetGraphToggleHTML, InitGraphToggleLogic } from './01_Navbar/04_Graph_Toggle.js';
import { GetDeleteButtonHTML, InitDeleteButton } from './01_Navbar/05_Delete_Button.js';
import { GetAddNoteButtonHTML, InitAddNoteButton } from './01_Navbar/06_Add_Edit_Button.js';
import { GetLibraryButtonHTML, InitLibraryButton } from './01_Navbar/07_Library_Button.js';

// Assembles HTML for the complete toolbar (view toggle, folder filter, search bar, graph toggle, delete, and add button)
export function GetNavbarHTML(isGraphActive = false) {
  return `
    <style>
      /* ===== FIXED NAVBAR WRAPPER (NO BORDER LINE BELOW NAVBAR) ===== */
      .notes-toolbar-wrapper {
        position: fixed;
        top: var(--notes-header-height, 74px);
        left: 0;
        right: 0;
        z-index: 60;
        width: 100%;
        backdrop-filter: blur(16px) saturate(160%);
        -webkit-backdrop-filter: blur(16px) saturate(160%);
        background: var(--header-bg, rgba(14, 16, 24, 0.85));
        border: none;
        padding: 10px clamp(10px, 3vw, 32px);
        box-sizing: border-box;
        transition: background-color var(--transition, 0.2s);
      }

      [data-theme="light"] .notes-toolbar-wrapper {
        background: var(--header-bg, rgba(243, 244, 248, 0.85));
        border: none;
      }

      /* ===== NEON GREEN GRADIENT COMMAND BAR ===== */
      .notes-toolbar {
        background: linear-gradient(135deg, #00ff87 0%, #00e676 26%, #10b981 65%, #059669 100%);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 8px 14px;
        margin: 0;
        width: 100%;
        box-sizing: border-box;
        border-radius: 14px;
        border: 1px solid rgba(255, 255, 255, 0.4);
        box-shadow: 
          0 10px 30px -4px rgba(0, 255, 135, 0.42),
          0 4px 12px rgba(0, 0, 0, 0.25),
          inset 0 1px 1px 0 rgba(255, 255, 255, 0.6);
        transition: all var(--transition, 0.2s);
      }

      .notes-toolbar-left {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }

      .notes-toolbar-center {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        flex: 1;
        min-width: 0;
        margin: 0 4px;
      }

      .notes-toolbar-right {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }

      /* Base Obsidian Glass Button Style for all Toolbar Buttons */
      .notes-toolbar .notes-view-toggle-btn,
      .notes-toolbar .notes-ghost-btn,
      .notes-toolbar .notes-icon-btn,
      .notes-toolbar .notes-library-btn,
      .notes-toolbar .notes-delete-icon-btn {
        background: rgba(14, 18, 27, 0.88);
        border: 1px solid rgba(0, 0, 0, 0.3);
        border-radius: 9px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.12);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* 1. View Toggle Button */
      .notes-toolbar .notes-view-toggle-btn {
        color: #00ff87;
      }

      .notes-toolbar .notes-view-toggle-btn:hover {
        background: #080b12;
        color: #ffffff;
        border-color: rgba(255, 255, 255, 0.35);
        transform: translateY(-1.5px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35), 0 0 12px rgba(0, 255, 135, 0.5);
      }

      .notes-toolbar .notes-view-toggle-btn:active {
        transform: translateY(0);
      }

      /* 2. Group Filter Dropdown Button */
      .notes-toolbar .notes-ghost-btn {
        color: #ffffff;
        font-weight: 600;
        letter-spacing: 0.2px;
      }

      .notes-toolbar .notes-ghost-btn svg {
        color: #00ff87;
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .notes-toolbar .notes-ghost-btn:hover {
        background: #080b12;
        color: #00ff87;
        border-color: rgba(255, 255, 255, 0.35);
        transform: translateY(-1.5px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35), 0 0 12px rgba(0, 255, 135, 0.4);
      }

      .notes-toolbar .notes-ghost-btn:hover svg {
        transform: scale(1.1);
      }

      .notes-toolbar .notes-ghost-btn:active {
        transform: translateY(0);
      }

      /* 3. Search Bar Field */
      .notes-toolbar .notes-search-wrapper {
        min-width: 80px;
      }

      .notes-toolbar .notes-search-input {
        background: rgba(14, 18, 27, 0.88);
        border: 1px solid rgba(0, 0, 0, 0.3);
        border-radius: 9px;
        color: #ffffff;
        font-weight: 500;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .notes-toolbar .notes-search-input::placeholder {
        color: rgba(255, 255, 255, 0.65);
        font-weight: 400;
      }

      .notes-toolbar .notes-search-input:hover {
        border-color: rgba(255, 255, 255, 0.25);
        background: rgba(14, 18, 27, 0.95);
      }

      .notes-toolbar .notes-search-input:focus {
        background: #080b12;
        border-color: #ffffff;
        color: #ffffff;
        box-shadow: 
          0 0 0 3px rgba(0, 0, 0, 0.3),
          0 6px 18px rgba(0, 0, 0, 0.45),
          0 0 16px rgba(0, 255, 135, 0.45);
      }

      .notes-toolbar .notes-search-icon {
        color: #00ff87;
      }

      .notes-toolbar .notes-search-clear-btn {
        color: rgba(255, 255, 255, 0.65);
        transition: color 0.15s, transform 0.15s;
      }

      .notes-toolbar .notes-search-clear-btn:hover {
        color: #ff5252;
        transform: translateY(-50%) scale(1.18);
      }

      /* 4. Graph Toggle Button */
      .notes-toolbar .notes-icon-btn {
        color: #00ff87;
      }

      .notes-toolbar .notes-icon-btn:hover {
        background: #080b12;
        color: #ffffff;
        border-color: rgba(255, 255, 255, 0.35);
        transform: translateY(-1.5px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35), 0 0 12px rgba(0, 255, 135, 0.5);
      }

      .notes-toolbar .notes-icon-btn.active {
        background: #ffffff;
        color: #047857;
        border-color: #ffffff;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35), 0 0 16px rgba(255, 255, 255, 0.7);
      }

      /* 5. Delete Button */
      .notes-toolbar .notes-delete-icon-btn {
        color: rgba(255, 255, 255, 0.5);
        opacity: 0.55;
      }

      .notes-toolbar .notes-delete-icon-btn.active {
        opacity: 1;
        cursor: pointer;
        background: #ef4444;
        color: #ffffff;
        border-color: #f87171;
        box-shadow: 0 4px 16px rgba(239, 68, 68, 0.6), 0 0 8px rgba(0, 0, 0, 0.3);
        animation: pulseToolbarDelete 1.8s infinite cubic-bezier(0.4, 0, 0.6, 1);
      }

      @keyframes pulseToolbarDelete {
        0%, 100% {
          box-shadow: 0 4px 16px rgba(239, 68, 68, 0.6);
        }
        50% {
          box-shadow: 0 4px 24px rgba(239, 68, 68, 0.9), 0 0 12px rgba(255, 255, 255, 0.4);
        }
      }

      .notes-toolbar .notes-delete-icon-btn.active:hover {
        background: #dc2626;
        transform: translateY(-1.5px);
      }

      /* 6. BibTeX Library Button */
      .notes-toolbar .notes-library-btn {
        color: #00ff87;
      }

      .notes-toolbar .notes-library-btn:hover {
        background: #080b12;
        color: #ffffff;
        border-color: rgba(255, 255, 255, 0.35);
        transform: translateY(-1.5px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35), 0 0 12px rgba(0, 255, 135, 0.5);
      }

      /* 7. Add Note ("+ Note") Button */
      .notes-toolbar .notes-primary-icon-btn {
        background: #0c1018;
        color: #00ff87;
        border: 1.5px solid rgba(0, 255, 135, 0.7);
        border-radius: 9px;
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.32), 0 0 12px rgba(0, 255, 135, 0.3);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .notes-toolbar .notes-primary-icon-btn:hover {
        background: #00ff87;
        color: #022b17;
        border-color: #00ff87;
        transform: translateY(-1.5px) scale(1.05);
        box-shadow: 0 6px 22px rgba(0, 0, 0, 0.45), 0 0 22px rgba(0, 255, 135, 0.8);
      }

      .notes-toolbar .notes-primary-icon-btn:active {
        transform: translateY(0) scale(1);
      }

      /* 8. Dropdown Menu Styling (Inherits Neon Emerald Accents) */
      .notes-toolbar .notes-groups-dropdown-window {
        border-color: rgba(0, 255, 135, 0.35);
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.65), 0 0 20px rgba(0, 255, 135, 0.18);
      }

      .notes-toolbar .notes-groups-dropdown-window .notes-group-item:hover {
        background: rgba(0, 255, 135, 0.15);
        color: #00ff87;
      }

      .notes-toolbar .notes-groups-dropdown-window .notes-group-item.active {
        background: rgba(0, 255, 135, 0.25);
        color: #00ff87;
        font-weight: 700;
      }

      /* ===== LIGHT MODE: LUMINOUS MINT-JADE COMMAND BAR ===== */
      [data-theme="light"] .notes-toolbar {
        background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 35%, #6ee7b7 75%, #34d399 100%);
        border: 1px solid rgba(255, 255, 255, 0.85);
        box-shadow: 
          0 10px 28px -4px rgba(16, 185, 129, 0.28),
          0 4px 12px rgba(0, 0, 0, 0.05),
          inset 0 1px 2px rgba(255, 255, 255, 0.95);
      }

      /* Base Pearl Glass Button Style in Light Mode */
      [data-theme="light"] .notes-toolbar .notes-view-toggle-btn,
      [data-theme="light"] .notes-toolbar .notes-ghost-btn,
      [data-theme="light"] .notes-toolbar .notes-icon-btn,
      [data-theme="light"] .notes-toolbar .notes-library-btn,
      [data-theme="light"] .notes-toolbar .notes-delete-icon-btn {
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(16, 185, 129, 0.26);
        border-radius: 9px;
        box-shadow: 0 2px 6px rgba(5, 150, 105, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        color: #065f46;
      }

      /* 1. View Toggle in Light Mode */
      [data-theme="light"] .notes-toolbar .notes-view-toggle-btn {
        color: #047857;
      }

      [data-theme="light"] .notes-toolbar .notes-view-toggle-btn:hover {
        background: #ffffff;
        color: #065f46;
        border-color: #10b981;
        transform: translateY(-1.5px);
        box-shadow: 0 5px 14px rgba(16, 185, 129, 0.28), 0 0 10px rgba(52, 211, 153, 0.25);
      }

      /* 2. Group Filter in Light Mode */
      [data-theme="light"] .notes-toolbar .notes-ghost-btn {
        color: #065f46;
        font-weight: 600;
      }

      [data-theme="light"] .notes-toolbar .notes-ghost-btn svg {
        color: #059669;
      }

      [data-theme="light"] .notes-toolbar .notes-ghost-btn:hover {
        background: #ffffff;
        color: #047857;
        border-color: #10b981;
        transform: translateY(-1.5px);
        box-shadow: 0 5px 14px rgba(16, 185, 129, 0.28), 0 0 10px rgba(52, 211, 153, 0.25);
      }

      [data-theme="light"] .notes-toolbar .notes-ghost-btn:hover svg {
        color: #047857;
      }

      /* 3. Search Bar in Light Mode */
      [data-theme="light"] .notes-toolbar .notes-search-input {
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid rgba(16, 185, 129, 0.28);
        border-radius: 9px;
        color: #0f172a;
        font-weight: 500;
        box-shadow: 0 2px 6px rgba(5, 150, 105, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1);
      }

      [data-theme="light"] .notes-toolbar .notes-search-input::placeholder {
        color: #64748b;
        font-weight: 400;
      }

      [data-theme="light"] .notes-toolbar .notes-search-input:hover {
        border-color: #10b981;
        background: #ffffff;
      }

      [data-theme="light"] .notes-toolbar .notes-search-input:focus {
        background: #ffffff;
        border-color: #10b981;
        color: #0f172a;
        box-shadow: 
          0 0 0 3px rgba(16, 185, 129, 0.25),
          0 6px 18px rgba(16, 185, 129, 0.18);
      }

      [data-theme="light"] .notes-toolbar .notes-search-icon {
        color: #059669;
      }

      [data-theme="light"] .notes-toolbar .notes-search-clear-btn {
        color: #64748b;
      }

      [data-theme="light"] .notes-toolbar .notes-search-clear-btn:hover {
        color: #ef4444;
      }

      /* 4. Graph Toggle in Light Mode */
      [data-theme="light"] .notes-toolbar .notes-icon-btn {
        color: #047857;
      }

      [data-theme="light"] .notes-toolbar .notes-icon-btn:hover {
        background: #ffffff;
        color: #065f46;
        border-color: #10b981;
        transform: translateY(-1.5px);
        box-shadow: 0 5px 14px rgba(16, 185, 129, 0.28), 0 0 10px rgba(52, 211, 153, 0.25);
      }

      [data-theme="light"] .notes-toolbar .notes-icon-btn.active {
        background: #059669;
        color: #ffffff;
        border-color: #059669;
        box-shadow: 0 4px 14px rgba(5, 150, 105, 0.35);
      }

      /* 5. Delete Button in Light Mode */
      [data-theme="light"] .notes-toolbar .notes-delete-icon-btn {
        color: #94a3b8;
        background: rgba(255, 255, 255, 0.75);
        border-color: rgba(0, 0, 0, 0.1);
        opacity: 0.65;
      }

      [data-theme="light"] .notes-toolbar .notes-delete-icon-btn.active {
        opacity: 1;
        background: #ef4444;
        color: #ffffff;
        border-color: #dc2626;
        box-shadow: 0 4px 16px rgba(239, 68, 68, 0.45);
      }

      [data-theme="light"] .notes-toolbar .notes-delete-icon-btn.active:hover {
        background: #dc2626;
      }

      /* 6. BibTeX Library in Light Mode */
      [data-theme="light"] .notes-toolbar .notes-library-btn {
        color: #047857;
      }

      [data-theme="light"] .notes-toolbar .notes-library-btn:hover {
        background: #ffffff;
        color: #065f46;
        border-color: #10b981;
        transform: translateY(-1.5px);
        box-shadow: 0 5px 14px rgba(16, 185, 129, 0.28), 0 0 10px rgba(52, 211, 153, 0.25);
      }

      /* 7. Add Note ("+ Note") in Light Mode */
      [data-theme="light"] .notes-toolbar .notes-primary-icon-btn {
        background: linear-gradient(135deg, #059669 0%, #10b981 100%);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.45);
        border-radius: 9px;
        box-shadow: 0 3px 12px rgba(16, 185, 129, 0.4);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      [data-theme="light"] .notes-toolbar .notes-primary-icon-btn:hover {
        background: linear-gradient(135deg, #047857 0%, #059669 100%);
        color: #ffffff;
        border-color: rgba(255, 255, 255, 0.7);
        transform: translateY(-1.5px) scale(1.05);
        box-shadow: 0 6px 20px rgba(16, 185, 129, 0.55);
      }

      /* 8. Dropdown Menu in Light Mode */
      [data-theme="light"] .notes-toolbar .notes-groups-dropdown-window {
        background: #ffffff;
        border-color: rgba(16, 185, 129, 0.35);
        box-shadow: 0 16px 36px rgba(16, 185, 129, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      [data-theme="light"] .notes-toolbar .notes-groups-dropdown-window .notes-group-item:hover {
        background: rgba(16, 185, 129, 0.12);
        color: #047857;
      }

      [data-theme="light"] .notes-toolbar .notes-groups-dropdown-window .notes-group-item.active {
        background: rgba(16, 185, 129, 0.2);
        color: #047857;
        font-weight: 700;
      }

      @media (max-width: 600px) {
        .notes-toolbar {
          top: var(--notes-header-height, 66px);
          gap: 6px;
          padding: 6px 10px;
          margin-bottom: 18px;
          border-radius: 12px;
        }
        .notes-toolbar-left,
        .notes-toolbar-right {
          gap: 5px;
        }
        .notes-toolbar-center {
          gap: 6px;
        }
      }

      @media (max-width: 440px) {
        .notes-toolbar {
          top: var(--notes-header-height, 60px);
          padding: 6px 8px;
        }
      }

      @media (max-width: 380px) {
        .notes-toolbar {
          flex-wrap: wrap;
          gap: 6px;
        }
        .notes-toolbar-center {
          order: 3;
          width: 100%;
          margin: 4px 0 0 0;
          max-width: none;
        }
      }

      @media (max-width: 600px) {
        .notes-toolbar-wrapper {
          padding: 8px 12px;
        }
      }

      @media (max-width: 440px) {
        .notes-toolbar-wrapper {
          padding: 6px 8px;
        }
      }

      @media (max-width: 320px) {
        .notes-toolbar-wrapper {
          padding: 4px 6px;
        }
      }

      @media (max-width: 275px) {
        .notes-toolbar-left,
        .notes-toolbar-right {
          gap: 3px;
        }
      }
    </style>

    <div class="notes-toolbar-wrapper">
      <div class="notes-toolbar">
        <!-- 1. LEFT: View Toggle & Group Filter -->
        <div class="notes-toolbar-left">
          ${GetViewToggleHTML()}
          ${GetGroupFilterHTML()}
        </div>

        <!-- 2. CENTER: Long Search Bar & Graph View Toggle -->
        <div class="notes-toolbar-center">
          ${GetSearchBarHTML()}
          ${GetGraphToggleHTML(isGraphActive)}
        </div>

        <!-- 3. RIGHT: Auto-Active Delete, BibTeX Library & Add Note Button -->
        <div class="notes-toolbar-right">
          ${GetDeleteButtonHTML()}
          ${GetLibraryButtonHTML()}
          ${GetAddNoteButtonHTML()}
        </div>
      </div>
    </div>
  `;
}

// Initializes all toolbar controls with their corresponding event listeners and callbacks
export function InitNavbar(state, { onViewChange, onGroupSelect, onOrderUpdate, onSearch, onDeleteSelected, onAddClick, onLibraryClick }) {
  InitViewToggle(onViewChange);
  InitGroupFilter(state, onGroupSelect, onOrderUpdate);
  InitSearchBar(onSearch);
  InitGraphToggleLogic();
  InitDeleteButton(onDeleteSelected);
  InitLibraryButton(onLibraryClick);
  InitAddNoteButton(onAddClick);

  // Dynamically synchronize toolbar height to CSS variable
  const toolbarWrapper = document.querySelector('.notes-toolbar-wrapper') || document.querySelector('.notes-toolbar');
  if (toolbarWrapper) {
    const updateToolbarH = () => {
      const h = toolbarWrapper.offsetHeight;
      if (h > 0) {
        document.documentElement.style.setProperty('--notes-toolbar-height', `${h}px`);
      }
    };
    updateToolbarH();
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(entries => {
        for (const entry of entries) {
          const h = entry.borderBoxSize ? entry.borderBoxSize[0].blockSize : toolbarWrapper.offsetHeight;
          if (h > 0) {
            document.documentElement.style.setProperty('--notes-toolbar-height', `${h}px`);
          }
        }
      });
      ro.observe(toolbarWrapper);
    }
  }
}
